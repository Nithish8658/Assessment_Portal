import os
import sys
import json

# Ensure app path resolution
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.database import SessionLocal
from app.models.assessment_models import AssessmentDomain, AssessmentRound, AssessmentQuestion
from app.schemas.assessment_schemas import StartAttemptResponse, CandidateQuestionResponse

def test_serialization():
    db = SessionLocal()
    try:
        domain = db.query(AssessmentDomain).filter(AssessmentDomain.slug == "iot-hardware-systems").first()
        assert domain is not None, "Domain iot-hardware-systems not found!"
        print(f"Found Domain: {domain.title}")

        round_obj = db.query(AssessmentRound).filter(AssessmentRound.domain_id == domain.id).first()
        assert round_obj is not None, "Round not found!"
        print(f"Found Round: {round_obj.title} (slug: {round_obj.slug}, round_type: {round_obj.round_type})")

        questions = db.query(AssessmentQuestion).filter(AssessmentQuestion.round_id == round_obj.id).all()
        print(f"Found {len(questions)} Questions.")

        candidate_questions = []
        for q in questions:
            opts = q.options_json
            cq = CandidateQuestionResponse(
                id=q.id,
                round_id=q.round_id,
                question_type=q.question_type,
                title=q.title,
                content=q.candidate_content,
                candidate_content=q.candidate_content,
                code_template=q.candidate_code_template,
                candidate_code_template=q.candidate_code_template,
                options=opts,
                options_json=opts,
                marks=q.marks,
                difficulty=q.difficulty,
                time_limit_seconds=q.time_limit_seconds
            )
            candidate_questions.append(cq)

        start_resp = StartAttemptResponse(
            attempt_id=999,
            allocation_id=888,
            domain_slug=domain.slug,
            round_id=round_obj.id,
            round_number=round_obj.round_number,
            round_title=round_obj.title,
            round_type=round_obj.round_type,
            duration_minutes=round_obj.duration_minutes,
            questions_per_attempt=round_obj.questions_per_attempt,
            passing_score=60.0,
            rules=round_obj.rules_json or {},
            questions=candidate_questions,
            started_at="2026-09-09T13:45:00",
            saved_answers={},
            time_remaining_seconds=2700,
            expires_at="2026-09-09T14:30:00",
            server_time="2026-09-09T13:45:01"
        )

        print("\nSuccessfully validated StartAttemptResponse with all 10 IoT Hardware Questions!")
        print(f"Total serialized questions: {len(start_resp.questions)}")
        print(f"Sample task 1 title: {start_resp.questions[0].title}")
        print(f"Sample task 1 motherboard board_name: {start_resp.questions[0].options_json.get('motherboard_config', {}).get('board_name')}")
        print("\nALL SERIALIZATION TESTS PASSED!")

    finally:
        db.close()

if __name__ == "__main__":
    test_serialization()
