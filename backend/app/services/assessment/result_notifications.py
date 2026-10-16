"""Tells a student their round result once the attempt's grade is final.

Called wherever an attempt becomes EVALUATED (instant grading, AI batch grading, admin regrade),
so every attempt's final score is notified, including reattempts. The caller commits.
"""
from sqlalchemy.orm import Session

from app.services.student_email import notify_student


def notify_result(db: Session, attempt, percentage: float, passed: bool) -> None:
    student = attempt.allocation.student if attempt.allocation else None
    if not student or not student.user_id:
        return
    round_obj = attempt.round
    round_title = round_obj.title if round_obj else "Round"
    domain_title = round_obj.domain.title if round_obj and round_obj.domain else "Assessment Track"
    notify_student(
        db,
        student.user_id,
        title=f"Evaluation Result: {round_title}",
        message=f"Your submission for {domain_title} - {round_title} was evaluated: Score {round(percentage, 2)}% "
                f"({'PASSED' if passed else 'NEEDS IMPROVEMENT'}).",
        type="success" if passed else "info",
    )
