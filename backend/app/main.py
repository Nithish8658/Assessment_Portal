from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import (
    auth, master, users, questions, papers, assessments, assignments, marks, evaluation, results, obe, analytics, calendar, reports, audit
)

# Initialize FastAPI application
app = FastAPI(
    title="NASC Assessment Portal API",
    description="Institutional Assessment & OBE Management System for Nehru Arts and Science College (Autonomous)",
    version="1.0.0"
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth.router)
app.include_router(master.router)
app.include_router(users.router)
app.include_router(questions.router)
app.include_router(papers.router)
app.include_router(assessments.router)
app.include_router(assignments.router)
app.include_router(marks.router)
app.include_router(evaluation.router)
app.include_router(results.router)
app.include_router(obe.router)
app.include_router(analytics.router)
app.include_router(calendar.router)
app.include_router(reports.router)
app.include_router(audit.router)

@app.get("/")
def root():
    return {
        "institution": "Nehru Arts and Science College (Autonomous)",
        "portal": "NASC Assessment Portal API",
        "status": "Online",
        "docs": "/docs"
    }
