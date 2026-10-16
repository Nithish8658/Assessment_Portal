import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.database import engine, direct_engine, Base
from app.routers import (
    auth, master, users, calendar, audit, dashboard, academic_calendar, student_email
)
from app.routers.assessment import (
    domains as assessment_domains,
    activation as assessment_activation,
    attempts as assessment_attempts,
    coding as assessment_coding,
    tutor as assessment_tutor,
    admin as assessment_admin,
    operations as assessment_operations,
    simulation as assessment_simulation,
    assistant as assessment_assistant
)

import asyncio
from contextlib import asynccontextmanager

async def scheduled_batch_code_evaluation_loop():
    """Periodic background worker running once every 2 hours to evaluate pending coding submissions via Gemini."""
    from app.database import SessionLocal
    from app.services.assessment.gemini_batch_code_evaluator import gemini_batch_code_evaluator
    while True:
        try:
            db = SessionLocal()
            try:
                await gemini_batch_code_evaluator.evaluate_pending_batch(db)
            finally:
                db.close()
        except Exception as e:
            print(f"[BATCH EVALUATOR] Scheduled evaluation error: {e}")
        await asyncio.sleep(7200) # 2 hours

async def student_email_loop():
    """Sends queued student emails and checks for bounces every minute. Not run on Vercel, where
    the tutor's Student Emails page drives sending instead."""
    from app.database import SessionLocal
    from app.services.student_email import run_all_senders

    def one_pass():
        db = SessionLocal()
        try:
            run_all_senders(db)
        finally:
            db.close()

    while True:
        try:
            await asyncio.to_thread(one_pass)  # SMTP/IMAP calls block
        except Exception as e:
            print(f"[STUDENT EMAIL] Scheduled send error: {e}")
        await asyncio.sleep(60)

@asynccontextmanager
async def lifespan(app: FastAPI):
    tasks = []
    if not os.getenv("VERCEL"):
        tasks.append(asyncio.create_task(scheduled_batch_code_evaluation_loop()))
        tasks.append(asyncio.create_task(student_email_loop()))
    yield
    for task in tasks:
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass

# Create tables if not present using direct administrative connection.
# Skipped on Vercel: this runs on every cold start, and direct_engine targets the
# session-mode pooler (port 5432), which only allows 15 clients. Run schema changes
# locally or via the migration scripts instead.
if not os.getenv("VERCEL"):
    try:
        Base.metadata.create_all(bind=direct_engine or engine)
    except Exception as e:
        print(f"[STARTUP DDL NOTICE] Schema already initialized or direct DDL connection deferred: {e}")

from fastapi.responses import RedirectResponse, JSONResponse
from sqlalchemy.exc import IntegrityError, DataError, OperationalError
import re

# Initialize FastAPI application (MockRun by OpenLectern)
app = FastAPI(
    title="MockRun API — by OpenLectern",
    description="MockRun Centralized Assessment & OBE Platform for Nehru Arts and Science College (Autonomous), powered by OpenLectern",
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def no_store_api_responses(request, call_next):
    """Results, radar charts and dashboards are generated per request; never serve a cached copy."""
    response = await call_next(request)
    if request.url.path.startswith("/api/") and "cache-control" not in response.headers:
        response.headers["Cache-Control"] = "no-store"
    return response

# Database rejections caused by the request's data become 4xx answers instead of 500 crashes.
# get_db closes the session afterwards, which rolls the failed transaction back.
def _pg(exc):
    orig = getattr(exc, "orig", None)
    return getattr(orig, "pgcode", None), getattr(getattr(orig, "diag", None), "message_detail", None) or ""


@app.exception_handler(IntegrityError)
async def integrity_error_handler(request, exc):
    code, detail = _pg(exc)
    key = re.search(r"Key \(([^)]+)\)=\(([^)]*)\)", detail)
    field, value = (key.group(1), key.group(2)) if key else ("value", "")
    if code == "23505":  # unique_violation
        return JSONResponse(status_code=409, content={"detail": f"A record with {field} '{value}' already exists."})
    if code == "23503":  # foreign_key_violation
        if "still referenced" in detail:
            return JSONResponse(status_code=409, content={"detail": "This record is still in use by other records and cannot be removed."})
        return JSONResponse(status_code=400, content={"detail": f"No record exists for {field} '{value}'."})
    if code == "23502":  # not_null_violation
        column = getattr(getattr(exc.orig, "diag", None), "column_name", None) or "a required field"
        return JSONResponse(status_code=422, content={"detail": f"{column} is required."})
    return JSONResponse(status_code=409, content={"detail": "The request conflicts with existing data."})


@app.exception_handler(DataError)
async def data_error_handler(request, exc):
    code, _ = _pg(exc)
    if code == "22001":  # string_data_right_truncation
        message = "One of the values is too long."
    elif code == "22003":  # numeric_value_out_of_range
        message = "One of the numbers is too large."
    else:
        message = "One of the values has an invalid format."
    return JSONResponse(status_code=422, content={"detail": message})


@app.exception_handler(OperationalError)
async def operational_error_handler(request, exc):
    code, _ = _pg(exc)
    if code in ("40P01", "40001"):  # deadlock_detected, serialization_failure
        return JSONResponse(status_code=503, content={"detail": "The server was busy with a conflicting change. Please try again."})
    raise exc

# Include Core Routers
app.include_router(auth.router)
app.include_router(master.router)
app.include_router(users.router)
app.include_router(calendar.router)
app.include_router(audit.router)
app.include_router(dashboard.router)
app.include_router(academic_calendar.router)
app.include_router(student_email.router)

# Include Assessment Module Routers
app.include_router(assessment_domains.router)
app.include_router(assessment_activation.router)
app.include_router(assessment_attempts.router)
app.include_router(assessment_coding.router)
app.include_router(assessment_tutor.router)
app.include_router(assessment_admin.router)
app.include_router(assessment_operations.router)
app.include_router(assessment_simulation.router)
app.include_router(assessment_assistant.router)

@app.get("/docs", include_in_schema=False)
def docs_redirect():
    return RedirectResponse(url="/api/docs")

@app.get("/api/v1/health")
@app.get("/health")
def health():
    return {
        "status": "online",
        "app": "MockRun",
        "provider": "OpenLectern",
        "institution": "Nehru Arts and Science College (Autonomous)",
        "database": "Connected"
    }

@app.get("/api")
@app.get("/api/")
@app.get("/")
def root():
    return {
        "institution": "Nehru Arts and Science College (Autonomous)",
        "portal": "MockRun Centralized Assessment & OBE Platform",
        "provider": "OpenLectern",
        "status": "Online",
        "docs": "/api/docs"
    }
