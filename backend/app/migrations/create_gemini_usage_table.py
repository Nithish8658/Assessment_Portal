"""
Migration: create the gemini_usage table, where every server instance books its Gemini requests so
grading stays under each model's RPM / TPM / RPD limits (see services/assessment/gemini_quota.py).

Usage (from backend/):
    python -m app.migrations.create_gemini_usage_table
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.database import direct_engine, engine
from app.models.assessment_models import GeminiUsage

if __name__ == "__main__":
    GeminiUsage.__table__.create(bind=direct_engine or engine, checkfirst=True)
    print("gemini_usage table is in place.")
