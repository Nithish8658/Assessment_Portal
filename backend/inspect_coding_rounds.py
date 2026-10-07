from app.database import SessionLocal
from app.models.assessment_models import AssessmentQuestion, AssessmentRound

db = SessionLocal()
for rid in [2, 4, 10, 11]:
    round_obj = db.query(AssessmentRound).filter(AssessmentRound.id == rid).first()
    qs = db.query(AssessmentQuestion).filter(AssessmentQuestion.round_id == rid, AssessmentQuestion.status == 'Active').all()
    print(f"\n=======================================================")
    print(f"Round {rid} - '{round_obj.title}' (Type: {round_obj.round_type}) | Domain ID: {round_obj.domain_id}")
    print(f"Active Questions: {len(qs)}")
    print(f"=======================================================")
    for q in qs:
        template_preview = (q.candidate_code_template or "").replace("\n", " ")[:60]
        print(f"  [Q ID: {q.id}] '{q.title}' (type: {q.question_type}, difficulty: {q.difficulty}, marks: {q.marks})")
        if template_preview:
            print(f"    Template: {template_preview}...")
db.close()
