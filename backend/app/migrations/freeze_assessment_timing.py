"""Idempotent additive migration; legacy durations use the current round settings.

Run from backend: python -m app.migrations.freeze_assessment_timing
Existing start times, answers and results are preserved. Old approval durations
were never stored, so their historical values cannot be reconstructed.
"""
from sqlalchemy import text
from app.database import engine


def migrate():
    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE assessment_activation_requests ADD COLUMN IF NOT EXISTS approved_round_durations_json JSON"))
        connection.execute(text("ALTER TABLE assessment_attempts ADD COLUMN IF NOT EXISTS duration_minutes INTEGER"))
        connection.execute(text("ALTER TABLE assessment_attempts ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITHOUT TIME ZONE"))
        connection.execute(text("""
            UPDATE assessment_activation_requests req
            SET approved_round_durations_json = (
                SELECT json_object_agg(r.id::text, r.duration_minutes)
                FROM assessment_rounds r WHERE r.domain_id = req.domain_id
                AND (req.selected_rounds_json IS NULL
                     OR req.selected_rounds_json::jsonb = 'null'::jsonb
                     OR req.selected_rounds_json::jsonb = '[]'::jsonb
                     OR req.selected_rounds_json::jsonb @> to_jsonb(r.id))
            )
            WHERE req.approved_round_durations_json IS NULL AND req.status = 'APPROVED'
        """))
        connection.execute(text("""
            UPDATE assessment_activation_requests req
            SET selected_rounds_json = (
                SELECT json_agg(key::int ORDER BY key::int)
                FROM json_each(req.approved_round_durations_json)
            )
            WHERE req.status = 'APPROVED' AND req.approved_round_durations_json IS NOT NULL
            AND (req.selected_rounds_json IS NULL OR req.selected_rounds_json::jsonb IN ('[]'::jsonb, 'null'::jsonb))
        """))
        connection.execute(text("""
            UPDATE assessment_attempts a SET
                duration_minutes = COALESCE(a.duration_minutes,
                    (req.approved_round_durations_json ->> a.round_id::text)::int, r.duration_minutes),
                expires_at = COALESCE(a.expires_at, a.started_at + make_interval(mins =>
                    COALESCE(a.duration_minutes, (req.approved_round_durations_json ->> a.round_id::text)::int, r.duration_minutes)))
            FROM assessment_student_allocations alloc, assessment_activation_requests req, assessment_rounds r
            WHERE a.allocation_id = alloc.id AND alloc.request_id = req.id AND a.round_id = r.id
            AND (a.duration_minutes IS NULL OR a.expires_at IS NULL)
        """))
    print("Assessment timing migration completed; existing start times and results preserved.")


if __name__ == "__main__":
    migrate()
