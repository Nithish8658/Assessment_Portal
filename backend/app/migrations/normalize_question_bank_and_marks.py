"""
Migration script: Normalize Question Bank, Formats & Rebalance Marks
- Normalizes Data Analyst & BI Round titles and slugs (reversing legacy inversion).
- Relocates Q95 (Pandas Practical Coding) into Round 3 (Python Practical).
- Standardizes marks across all rounds to eliminate random snapshot score variance.
- Normalizes case-sensitive question_type strings across C track.
"""
import os
import sys

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, ROOT_DIR)

from app.database import SessionLocal
from app.models.assessment_models import (
    AssessmentDomain,
    AssessmentRound,
    AssessmentQuestion,
    QuestionEvaluationConfig,
    QuestionVersion
)

def run_migration():
    db = SessionLocal()
    print("[START] Starting Question Bank Normalization & Mark Rebalancing...")

    try:
        # =========================================================================
        # 1. DATA ANALYST & BUSINESS INTELLIGENCE (Domain id=3)
        # =========================================================================
        da_domain = db.query(AssessmentDomain).filter(AssessmentDomain.slug == "data-analyst").first()
        if not da_domain:
            print("❌ Data Analyst domain not found!")
            return

        # A. Correct Inverted Round Slugs & Titles for Round 3 & Round 4
        r3 = db.query(AssessmentRound).filter(AssessmentRound.domain_id == da_domain.id, AssessmentRound.round_number == 3).first()
        r4 = db.query(AssessmentRound).filter(AssessmentRound.domain_id == da_domain.id, AssessmentRound.round_number == 4).first()

        if r3:
            r3.title = "Round 3: Python Analytics & Algorithmic Coding"
            r3.slug = "round-3-python-analytics-coding"
            r3.round_type = "PYTHON_PRACTICAL"
            print(f"  [OK] Updated Round 3: {r3.title} ({r3.slug})")

        if r4:
            r4.title = "Round 4: Tableau Studio & Visual Analytics"
            r4.slug = "round-4-tableau-visual-analytics"
            r4.round_type = "TABLEAU_PRACTICAL"
            print(f"  [OK] Updated Round 4: {r4.title} ({r4.slug})")

        # B. Relocate Q95 (Pandas Practical Coding) from Round 4 into Round 3
        q95 = db.query(AssessmentQuestion).filter(AssessmentQuestion.id == 95).first()
        if q95 and r3:
            q95.round_id = r3.id
            q95.question_type = "coding"
            q95.marks = 10.0
            print("  [OK] Relocated Q95 to Round 3 with 10.0 marks.")

        # C. Rebalance Marks: Round 1 (DATA_APTITUDE_MCQ - id=9)
        # 10 questions -> 2.0 marks each = 20.0 total marks
        r1_qs = db.query(AssessmentQuestion).filter(AssessmentQuestion.round_id == 9).all()
        for q in r1_qs:
            q.marks = 2.0
            q.question_type = "mcq"
        print(f"  [OK] Rebalanced {len(r1_qs)} questions in Round 1 to 2.0 marks each.")

        # D. Rebalance Marks & Formats: Round 2 (SQL_PRACTICAL - id=10)
        # SQL practical queries: 10.0 marks each
        # SQL concept / formula checks: 2.0 marks each
        sql_practical_ids = [74, 79, 262, 263]
        sql_concept_ids = [73, 75, 76, 77, 78, 264]

        for q in db.query(AssessmentQuestion).filter(AssessmentQuestion.round_id == 10).all():
            if q.id in sql_practical_ids:
                q.marks = 10.0
                q.question_type = "sql"
            elif q.id in sql_concept_ids:
                q.marks = 2.0
                if q.question_type not in ["mcq", "code_completion"]:
                    q.question_type = "mcq"
        print("  [OK] Rebalanced Round 2 SQL questions (10.0 marks for queries, 2.0 marks for concept checks).")

        # E. Rebalance Marks: Round 3 (PYTHON_PRACTICAL - id=11)
        # Coding & debugging challenges: 10.0 marks each
        # Python & analytics theory: 2.0 marks each
        py_coding_ids = [83, 84, 90, 91, 92, 95]
        for q in db.query(AssessmentQuestion).filter(AssessmentQuestion.round_id == 11).all():
            if q.id in py_coding_ids:
                q.marks = 10.0
            else:
                q.marks = 2.0
                if q.question_type == "mcq":
                    q.marks = 2.0
        print("  [OK] Rebalanced Round 3 Python questions (10.0 marks for coding/debug, 2.0 marks for concepts).")

        # F. Rebalance Marks: Round 4 (TABLEAU_PRACTICAL - id=12)
        # Tableau procedural task & business case: 15.0 marks each
        # Tableau / Viz MCQs: 2.0 marks each
        tab_practical_ids = [96, 97]
        for q in db.query(AssessmentQuestion).filter(AssessmentQuestion.round_id == 12).all():
            if q.id in tab_practical_ids:
                q.marks = 15.0
            else:
                q.marks = 2.0
                q.question_type = "mcq"
        print("  [OK] Rebalanced Round 4 Tableau questions (15.0 marks for practical/case, 2.0 marks for MCQs).")

        # G. Rebalance Marks: Round 5 (BUSINESS_CASE_AND_INTERVIEW - id=13)
        # Project discussion interview: 15.0 marks each
        # Architecture & Data lineage: 5.0 marks each
        interview_ids = [99, 101]
        for q in db.query(AssessmentQuestion).filter(AssessmentQuestion.round_id == 13).all():
            if q.id in interview_ids:
                q.marks = 15.0
                q.question_type = "project_discussion"
            else:
                q.marks = 5.0
                q.question_type = "text_response"
        print("  [OK] Rebalanced Round 5 Project Interview questions (15.0 marks for discussion, 5.0 marks for text responses).")

        # =========================================================================
        # 2. SOFTWARE DEVELOPER (Domain id=1)
        # =========================================================================
        # Round 4: Debugging (id=4)
        # Normalize all 4 debugging questions (Q9, Q258, Q259, Q260) to 10.0 marks each
        r4_debug_qs = db.query(AssessmentQuestion).filter(AssessmentQuestion.round_id == 4).all()
        for q in r4_debug_qs:
            q.marks = 10.0
            q.question_type = "debugging"
        print(f"  [OK] Rebalanced Software Developer Round 4: All {len(r4_debug_qs)} debugging challenges set to 10.0 marks each.")

        # =========================================================================
        # 3. C & SYSTEMS PROGRAMMING MASTER TRACK (Domain id=8)
        # =========================================================================
        c_domain = db.query(AssessmentDomain).filter(AssessmentDomain.slug == "c-programming-track").first()
        if c_domain:
            for r in c_domain.rounds:
                for q in r.questions:
                    # Lowercase question types for robust string matching
                    raw_type = (q.question_type or "").strip().lower()
                    if raw_type in ["mcq"]:
                        q.question_type = "mcq"
                    elif raw_type in ["coding", "programming"]:
                        q.question_type = "coding"
                    elif raw_type in ["debugging", "debug"]:
                        q.question_type = "debugging"
            print("  [OK] Normalized question type strings in C track to lowercase ('mcq', 'coding', 'debugging').")

        # Commit all changes atomically
        db.commit()
        print("\n[SUCCESS] All Question Bank Normalizations & Mark Rebalancings successfully committed to database!")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Migration failed with error: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    run_migration()
