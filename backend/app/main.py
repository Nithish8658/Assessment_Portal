import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.database import engine, direct_engine, Base
from app.routers import (
    auth, master, users, calendar, audit, dashboard
)
from app.routers.assessment import (
    domains as assessment_domains,
    activation as assessment_activation,
    attempts as assessment_attempts,
    coding as assessment_coding,
    tutor as assessment_tutor,
    admin as assessment_admin,
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

@asynccontextmanager
async def lifespan(app: FastAPI):
    task = None
    if not os.getenv("VERCEL"):
        task = asyncio.create_task(scheduled_batch_code_evaluation_loop())
    yield
    if task:
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass

# Create tables if not present using direct administrative connection
try:
    Base.metadata.create_all(bind=direct_engine or engine)
except Exception as e:
    print(f"[STARTUP DDL NOTICE] Schema already initialized or direct DDL connection deferred: {e}")

# Initialize FastAPI application (MockRun by OpenLectern)
app = FastAPI(
    title="MockRun API — by OpenLectern",
    description="MockRun Centralized Assessment & OBE Platform for Nehru Arts and Science College (Autonomous), powered by OpenLectern",
    version="2.0.0",
    lifespan=lifespan
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Core Routers
app.include_router(auth.router)
app.include_router(master.router)
app.include_router(users.router)
app.include_router(calendar.router)
app.include_router(audit.router)
app.include_router(dashboard.router)

# Include Assessment Module Routers
app.include_router(assessment_domains.router)
app.include_router(assessment_activation.router)
app.include_router(assessment_attempts.router)
app.include_router(assessment_coding.router)
app.include_router(assessment_tutor.router)
app.include_router(assessment_admin.router)
app.include_router(assessment_simulation.router)
app.include_router(assessment_assistant.router)

@app.get("/")
def root():
    return {
        "institution": "Nehru Arts and Science College (Autonomous)",
        "portal": "NASC Academic Master & Student Setup API",
        "module": "Block 1 Standalone Engine",
        "status": "Online",
        "docs": "/docs"
    }
