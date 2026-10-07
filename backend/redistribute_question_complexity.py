import math
from app.database import SessionLocal
from app.models.assessment_models import AssessmentRound, AssessmentQuestion, AssessmentDomain

def rebalance_question_difficulties():
    db = SessionLocal()
    try:
        rounds = db.query(AssessmentRound).order_by(AssessmentRound.domain_id, AssessmentRound.round_number).all()
        print("=== REBALANCING QUESTION BANK DIFFICULTY LEVELS (EASY, MEDIUM, HARD) ===")
        
        for r in rounds:
            questions = db.query(AssessmentQuestion).filter(
                AssessmentQuestion.round_id == r.id,
                AssessmentQuestion.status == "Active"
            ).order_by(AssessmentQuestion.id.asc()).all()
            
            n = len(questions)
            if n == 0:
                continue
                
            domain = db.query(AssessmentDomain).filter(AssessmentDomain.id == r.domain_id).first()
            dom_name = domain.title if domain else f"Domain {r.domain_id}"
            
            # Determine target distribution for n items across 3 tiers
            if n == 1:
                targets = ["Medium"]
            elif n == 2:
                targets = ["Easy", "Hard"]
            elif n == 3:
                targets = ["Easy", "Medium", "Hard"]
            else:
                # Distribute ~ 1/3 Easy, 1/3 Medium, 1/3 Hard
                n_easy = n // 3
                n_hard = n // 3
                n_medium = n - (n_easy + n_hard)
                targets = ["Easy"] * n_easy + ["Medium"] * n_medium + ["Hard"] * n_hard

            # Sort existing questions to preserve existing difficulty intent if possible
            # e.g., if a question was already marked Hard or had higher marks/length, assign to Hard
            diff_weight = {"Easy": 1, "Medium": 2, "Hard": 3}
            questions_sorted = sorted(
                questions,
                key=lambda q: (
                    diff_weight.get(q.difficulty, 2),
                    q.marks,
                    len(q.candidate_content or "")
                )
            )

            for i, q in enumerate(questions_sorted):
                new_diff = targets[i]
                q.difficulty = new_diff
                # Also adjust time_limit_seconds slightly to reflect difficulty if reasonable
                if q.question_type == "MCQ":
                    if new_diff == "Easy":
                        q.time_limit_seconds = 45
                        q.marks = 1.0
                    elif new_diff == "Medium":
                        q.time_limit_seconds = 60
                        q.marks = 2.0
                    elif new_diff == "Hard":
                        q.time_limit_seconds = 90
                        q.marks = 3.0
            
            db.commit()
            
            # Verify distribution
            diff_counts = {}
            for q in questions:
                diff_counts[q.difficulty] = diff_counts.get(q.difficulty, 0) + 1
                
            print(f"[{dom_name}] Round {r.round_number}: '{r.title}' (Total: {n}) -> {diff_counts}")
            
    finally:
        db.close()

if __name__ == "__main__":
    rebalance_question_difficulties()
