import sys
from app.database import SessionLocal
from app.models.assessment_models import AssessmentDomain, AssessmentRound, AssessmentQuestion, QuestionEvaluationConfig

db = SessionLocal()
domains = db.query(AssessmentDomain).all()

print(f"Total domains found: {len(domains)}")
for d in domains:
    print(f"\n=======================================================")
    print(f"DOMAIN #{d.id}: {d.title} (slug: '{d.slug}')")
    print(f"=======================================================")
    rounds = db.query(AssessmentRound).filter(AssessmentRound.domain_id == d.id).order_by(AssessmentRound.round_number).all()
    for r in rounds:
        qs = db.query(AssessmentQuestion).filter(AssessmentQuestion.round_id == r.id).all()
        q_types = set(q.question_type for q in qs)
        active_qs = [q for q in qs if q.status == "Active"]
        
        # Check eval configs
        configs = db.query(QuestionEvaluationConfig).filter(
            QuestionEvaluationConfig.question_id.in_([q.id for q in active_qs])
        ).all() if active_qs else []
        eval_methods = set(c.evaluation_type for c in configs) if configs else set()

        print(f"  * Round {r.round_number} [Round ID: {r.id}]")
        print(f"    - Title: {r.title}")
        print(f"    - Type: {r.round_type}")
        print(f"    - Questions Per Attempt: {r.questions_per_attempt}")
        print(f"    - Active Questions: {len(active_qs)} (types: {q_types})")
        print(f"    - Evaluation Methods in Config: {eval_methods}")
db.close()
