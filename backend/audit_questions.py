import os
import sys
import json

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models.assessment_models import AssessmentDomain, AssessmentRound, AssessmentQuestion, QuestionEvaluationConfig

def audit_all_questions():
    db = SessionLocal()
    try:
        domains = db.query(AssessmentDomain).order_by(AssessmentDomain.id).all()
        
        results = []
        for d in domains:
            rounds = db.query(AssessmentRound).filter(AssessmentRound.domain_id == d.id).order_by(AssessmentRound.round_number).all()
            for r in rounds:
                questions = db.query(AssessmentQuestion).filter(AssessmentQuestion.round_id == r.id).order_by(AssessmentQuestion.id).all()
                for q in questions:
                    cfg = db.query(QuestionEvaluationConfig).filter(QuestionEvaluationConfig.question_id == q.id).first()
                    
                    tech = cfg.evaluation_type if cfg and cfg.evaluation_type else "Not Configured"
                    correct_ans = cfg.correct_answer if cfg and cfg.correct_answer else (cfg.reference_solution if cfg and cfg.reference_solution else "N/A")
                    pub_cases = cfg.public_test_cases_json if cfg and cfg.public_test_cases_json else []
                    hid_cases = cfg.hidden_test_cases_json if cfg and cfg.hidden_test_cases_json else []
                    
                    opts = q.options_json if q.options_json else []
                    
                    results.append({
                        "domain_id": d.id,
                        "domain_title": d.title,
                        "round_id": r.id,
                        "round_number": r.round_number,
                        "round_title": r.title,
                        "round_type": r.round_type,
                        "question_id": q.id,
                        "question_title": q.title,
                        "question_type": q.question_type,
                        "options_count": len(opts) if isinstance(opts, list) else 0,
                        "eval_technique": tech,
                        "correct_answer": correct_ans,
                        "pub_cases_count": len(pub_cases) if isinstance(pub_cases, list) else 0,
                        "hid_cases_count": len(hid_cases) if isinstance(hid_cases, list) else 0,
                    })
                    
        print(f"Audited {len(results)} total questions across {len(domains)} domains.")
        
        with open("audit_dump.json", "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
            
        print("Wrote audit_dump.json successfully.")
    finally:
        db.close()

if __name__ == "__main__":
    audit_all_questions()
