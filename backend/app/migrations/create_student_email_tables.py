"""Idempotent additive migration: creates email_senders and email_deliveries for Student Emails.

Run from backend: python -m app.migrations.create_student_email_tables
Existing tables are left alone. Vercel does not create tables on startup, so run this once
before deploying the Student Emails feature.
"""
from sqlalchemy import text

from app.database import engine, direct_engine
from app.models.models import EmailDelivery, EmailSender


def migrate():
    bind = direct_engine or engine
    for model in (EmailSender, EmailDelivery):
        model.__table__.create(bind=bind, checkfirst=True)
        print(f"  -> {model.__tablename__} ready")
    # Columns added after the tables first shipped
    with bind.begin() as connection:
        connection.execute(text("ALTER TABLE email_senders ADD COLUMN IF NOT EXISTS portal_url VARCHAR(200)"))
    print("  -> email_senders.portal_url ready")


if __name__ == "__main__":
    migrate()
