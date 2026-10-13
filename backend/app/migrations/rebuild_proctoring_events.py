"""Rebuild proctoring_events to the current ProctoringEvent model.

Run from backend: python -m app.migrations.rebuild_proctoring_events
Production still had an older proctoring_events table (session_id, severity, ...), so every
insert and the Exam Operations queries failed on the missing attempt_id column. The old table
never received a row; this refuses to run if it holds any data.
"""
from sqlalchemy import inspect, text
from app.database import engine
from app.models.assessment_models import ProctoringEvent


def migrate():
    with engine.begin() as connection:
        insp = inspect(connection)
        columns = {c["name"] for c in insp.get_columns("proctoring_events")} if insp.has_table("proctoring_events") else set()
        if "attempt_id" in columns:
            print("proctoring_events already matches the model; nothing to do.")
            return
        if columns:
            rows = connection.execute(text("SELECT count(*) FROM proctoring_events")).scalar()
            if rows:
                raise RuntimeError(f"proctoring_events holds {rows} rows; refusing to drop it.")
            connection.execute(text("DROP TABLE proctoring_events"))
        ProctoringEvent.__table__.create(connection)
    print("proctoring_events rebuilt with attempt_id, event_type and occurred_at.")


if __name__ == "__main__":
    migrate()
