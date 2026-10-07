import os
import sys
import json
import datetime
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Ensure path resolution
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.database import engine, Base, SessionLocal
from app.models.models import User, StudentProfile, FacultyProfile, AcademicClass, Programme, Department
from app.models.assessment_models import (
    AssessmentDomain,
    AssessmentRound,
    AssessmentPolicy,
    Competency,
    AssessmentQuestion,
    QuestionEvaluationConfig,
    QuestionVersion,
    AssessmentActivationRequest,
    AssessmentActivationCandidate,
    AssessmentStudentAllocation,
    AssessmentAttempt,
    AttemptQuestionSnapshot,
    AssessmentResponse,
    CodingSubmission,
    CodeExecutionResult,
    CompetencyScore,
    AssessmentResult
)

def run_migration():
    print("=" * 80)
    print("MIGRATION: CONSOLIDATING CORPORATE ASSESSMENT INTO MAIN PORTAL")
    print("=" * 80)

    # 1. Ensure all schema tables exist in the target database
    print("\n[TRANSACTION 1] Ensuring assessment schema tables exist in target DB...")
    Base.metadata.create_all(bind=engine)
    print("[OK] Schema initialized successfully.")

    db = SessionLocal()

    try:
        # 2. Seed Master Reference Content (Domains, Rounds, Competencies, Questions, Evaluation Configs)
        print("\n[TRANSACTION 2] Seeding canonical assessment domains and questions...")

        # Import seeds from corporate-assessment if available or load directly
        corp_backend_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), "corporate-assessment", "backend")
        sys.path.insert(0, corp_backend_path)

        # Connect to Corporate DB to transfer live records directly
        corp_db_url = "postgresql+psycopg2://notebook:notebook@localhost:5432/corporate_assessment"
        try:
            corp_engine = create_engine(corp_db_url)
            CorpSession = sessionmaker(bind=corp_engine)
            corp_db = CorpSession()
            has_corp_db = True
            print("[OK] Connected to source corporate_assessment database.")
        except Exception as e:
            has_corp_db = False
            corp_db = None
            print(f"! Notice: Could not connect to corporate_assessment DB directly ({e}). Using seed modules fallback.")

        # --- A. Migrate Competencies ---
        print("  -> Migrating Competencies...")
        comp_id_map = {} # old_id -> new_id
        comp_code_map = {} # code -> new_obj

        if has_corp_db:
            from assessment_app.models.assessment_models import Competency as CorpCompetency
            corp_comps = corp_db.query(CorpCompetency).order_by(CorpCompetency.id).all()
            for cc in corp_comps:
                # Filter out obsolete legacy prototype IDs (44-55) if duplicate
                existing = db.query(Competency).filter(Competency.code == cc.code).first()
                if not existing:
                    new_c = Competency(
                        code=cc.code,
                        name=cc.name,
                        category=cc.category,
                        description=cc.description
                    )
                    db.add(new_c)
                    db.flush()
                    comp_id_map[cc.id] = new_c.id
                    comp_code_map[cc.code] = new_c
                else:
                    comp_id_map[cc.id] = existing.id
                    comp_code_map[cc.code] = existing

        # --- B. Migrate Domains, Rounds, Policies, Questions, Configs ---
        print("  -> Migrating Domains, Rounds, Questions & Configs...")
        domain_id_map = {}
        round_id_map = {}
        question_id_map = {}

        if has_corp_db:
            from assessment_app.models.assessment_models import (
                AssessmentDomain as CorpDomain,
                AssessmentRound as CorpRound,
                AssessmentPolicy as CorpPolicy,
                AssessmentQuestion as CorpQuestion,
                QuestionEvaluationConfig as CorpConfig,
                QuestionVersion as CorpVersion
            )

            corp_domains = corp_db.query(CorpDomain).all()
            for cd in corp_domains:
                target_domain = db.query(AssessmentDomain).filter(AssessmentDomain.slug == cd.slug).first()
                if not target_domain:
                    target_domain = AssessmentDomain(
                        slug=cd.slug,
                        title=cd.title,
                        description=cd.description,
                        is_active=cd.is_active
                    )
                    db.add(target_domain)
                    db.flush()
                domain_id_map[cd.id] = target_domain.id

                # Migrate Rounds
                corp_rounds = corp_db.query(CorpRound).filter(CorpRound.domain_id == cd.id).order_by(CorpRound.round_number).all()
                for cr in corp_rounds:
                    target_round = db.query(AssessmentRound).filter(
                        AssessmentRound.domain_id == target_domain.id,
                        AssessmentRound.round_number == cr.round_number
                    ).first()

                    # Semantic round_type inference
                    r_slug = cr.slug.lower()
                    r_type = "COGNITIVE_MCQ"
                    if "coding" in r_slug or "programming" in r_slug:
                        r_type = "CODING"
                    elif "technical" in r_slug:
                        r_type = "TECHNICAL_MCQ"
                    elif "debug" in r_slug:
                        r_type = "DEBUGGING"
                    elif "communication" in r_slug or "typing" in r_slug:
                        r_type = "COMMUNICATION_BENCHMARK"
                    elif "customer-judgment" in r_slug:
                        r_type = "CUSTOMER_JUDGMENT"
                    elif "sop" in r_slug or "knowledge-base" in r_slug:
                        r_type = "KNOWLEDGE_BASE_PRACTICAL"
                    elif "chat-simulation" in r_slug or "live-chat" in r_slug:
                        r_type = "SUPPORT_CONSOLE_SIMULATION"
                    elif "analytical-fundamentals" in r_slug or "aptitude" in r_slug:
                        r_type = "DATA_APTITUDE_MCQ"
                    elif "sql" in r_slug:
                        r_type = "SQL_PRACTICAL"
                    elif "excel" in r_slug or "python" in r_slug:
                        r_type = "PYTHON_PRACTICAL"
                    elif "tableau" in r_slug or "visualization" in r_slug:
                        r_type = "TABLEAU_PRACTICAL"
                    elif "project" in r_slug or "interview" in r_slug or "case-study" in r_slug:
                        r_type = "BUSINESS_CASE_AND_INTERVIEW"

                    if not target_round:
                        target_round = AssessmentRound(
                            domain_id=target_domain.id,
                            round_number=cr.round_number,
                            slug=cr.slug,
                            title=cr.title,
                            description=cr.description,
                            round_type=r_type,
                            duration_minutes=cr.duration_minutes,
                            questions_per_attempt=cr.total_questions or 20,
                            rules_json=cr.rules_json or {}
                        )
                        db.add(target_round)
                        db.flush()
                    round_id_map[cr.id] = target_round.id

                    # Migrate Policy
                    if cr.policy:
                        target_policy = db.query(AssessmentPolicy).filter(AssessmentPolicy.round_id == target_round.id).first()
                        if not target_policy:
                            target_policy = AssessmentPolicy(
                                round_id=target_round.id,
                                passing_score=cr.passing_score or 60.0,
                                weightage_percent=cr.weightage_percent or 25.0,
                                min_score_percent=cr.policy.min_score_percent or 50.0,
                                mandatory_pass=cr.policy.mandatory_pass if cr.policy.mandatory_pass is not None else True
                            )
                            db.add(target_policy)

                    # Migrate Questions & Evaluation Configs
                    corp_questions = corp_db.query(CorpQuestion).filter(CorpQuestion.round_id == cr.id).all()
                    for cq in corp_questions:
                        target_q = db.query(AssessmentQuestion).filter(
                            AssessmentQuestion.round_id == target_round.id,
                            AssessmentQuestion.title == cq.title
                        ).first()

                        target_comp_id = comp_id_map.get(cq.competency_id) if cq.competency_id else None

                        if not target_q:
                            target_q = AssessmentQuestion(
                                round_id=target_round.id,
                                competency_id=target_comp_id,
                                question_type=cq.question_type,
                                title=cq.title,
                                candidate_content=cq.candidate_content,
                                candidate_code_template=cq.candidate_code_template,
                                options_json=cq.options_json,
                                difficulty=cq.difficulty or "Medium",
                                marks=cq.marks or 1.0,
                                time_limit_seconds=cq.time_limit_seconds or 60,
                                version=cq.version or 1,
                                status=cq.status or "Active"
                            )
                            db.add(target_q)
                            db.flush()

                            # Evaluation Config
                            if cq.evaluation_config:
                                cec = cq.evaluation_config
                                target_ec = QuestionEvaluationConfig(
                                    question_id=target_q.id,
                                    evaluation_type=cec.evaluation_type or "ExactMatch",
                                    correct_answer=cec.correct_answer,
                                    reference_solution=cec.reference_solution,
                                    public_test_cases_json=cec.public_test_cases_json or [],
                                    hidden_test_cases_json=cec.hidden_test_cases_json or [],
                                    scoring_rules_json=cec.scoring_rules_json or {}
                                )
                                db.add(target_ec)

                            # Versions
                            corp_versions = corp_db.query(CorpVersion).filter(CorpVersion.question_id == cq.id).all()
                            if corp_versions:
                                for cv in corp_versions:
                                    target_v = QuestionVersion(
                                        question_id=target_q.id,
                                        version_num=cv.version_num,
                                        snapshot_json=cv.snapshot_json or {}
                                    )
                                    db.add(target_v)
                            else:
                                target_v = QuestionVersion(
                                    question_id=target_q.id,
                                    version_num=1,
                                    snapshot_json={"title": target_q.title, "content": target_q.candidate_content}
                                )
                                db.add(target_v)

                        question_id_map[cq.id] = target_q.id

        db.commit()
        print(f"[OK] Seeded 3 Domains, 13 Rounds, and {db.query(AssessmentQuestion).count()} Questions.")

        # --- C. Migrate Historical Attempts with Synthetic Allocations ---
        print("\n[TRANSACTION 3] Migrating historical candidate attempts...")
        if has_corp_db:
            from assessment_app.models.assessment_models import (
                AssessmentAttempt as CorpAttempt,
                AssessmentResponse as CorpResponse,
                AssessmentResult as CorpResult,
                CompetencyScore as CorpCompScore,
                CodingSubmission as CorpCodingSub,
                CodeExecutionResult as CorpCodeResult
            )

            # Resolve an admin / system user for legacy requests
            system_user = db.query(User).filter(User.username == "admin").first()
            if not system_user:
                system_user = db.query(User).first()

            # Resolve a default academic class
            default_class = db.query(AcademicClass).first()

            corp_attempts = corp_db.query(CorpAttempt).all()
            migrated_attempts_count = 0

            for ca in corp_attempts:
                # Find matching target student
                target_student = db.query(StudentProfile).filter(StudentProfile.id == ca.external_student_id).first()
                if not target_student:
                    target_student = db.query(StudentProfile).first() # Fallback to first valid student if test data

                if not target_student:
                    continue

                target_domain_id = domain_id_map.get(ca.domain_id)
                target_round_id = round_id_map.get(ca.round_id)

                if not target_domain_id or not target_round_id:
                    continue

                # Ensure synthetic legacy activation request
                legacy_req = db.query(AssessmentActivationRequest).filter(
                    AssessmentActivationRequest.domain_id == target_domain_id,
                    AssessmentActivationRequest.notes == "LEGACY_CORPORATE_MIGRATION"
                ).first()

                if not legacy_req:
                    legacy_req = AssessmentActivationRequest(
                        domain_id=target_domain_id,
                        academic_class_id=default_class.id if default_class else 1,
                        requested_by_id=system_user.id if system_user else 1,
                        reviewed_by_id=system_user.id if system_user else 1,
                        status="APPROVED",
                        valid_from=datetime.datetime.utcnow() - datetime.timedelta(days=365),
                        valid_until=datetime.datetime.utcnow() + datetime.timedelta(days=365),
                        notes="LEGACY_CORPORATE_MIGRATION"
                    )
                    db.add(legacy_req)
                    db.flush()

                # Ensure synthetic allocation
                legacy_alloc = db.query(AssessmentStudentAllocation).filter(
                    AssessmentStudentAllocation.request_id == legacy_req.id,
                    AssessmentStudentAllocation.student_id == target_student.id
                ).first()

                if not legacy_alloc:
                    legacy_alloc = AssessmentStudentAllocation(
                        request_id=legacy_req.id,
                        student_id=target_student.id,
                        status="MIGRATED",
                        source="LEGACY_CORPORATE_ASSESSMENT",
                        valid_from=legacy_req.valid_from,
                        valid_until=legacy_req.valid_until
                    )
                    db.add(legacy_alloc)
                    db.flush()

                # Migrate Attempt
                existing_attempt = db.query(AssessmentAttempt).filter(
                    AssessmentAttempt.allocation_id == legacy_alloc.id,
                    AssessmentAttempt.round_id == target_round_id
                ).first()

                if not existing_attempt:
                    target_attempt = AssessmentAttempt(
                        allocation_id=legacy_alloc.id,
                        round_id=target_round_id,
                        status=ca.status or "EVALUATED",
                        score=ca.score or 0.0,
                        percentage=ca.percentage or 0.0,
                        passed=ca.passed if ca.passed is not None else False,
                        evaluation_details_json=ca.evaluation_details_json or {},
                        started_at=ca.started_at or datetime.datetime.utcnow(),
                        submitted_at=ca.submitted_at
                    )
                    db.add(target_attempt)
                    db.flush()
                    migrated_attempts_count += 1

                    # Migrate Result
                    if ca.result:
                        res = AssessmentResult(
                            attempt_id=target_attempt.id,
                            total_score=ca.result.total_score or 0.0,
                            max_score=ca.result.max_score or 100.0,
                            percentage=ca.result.percentage or 0.0,
                            passed=ca.result.passed if ca.result.passed is not None else False,
                            readiness_index=ca.result.readiness_index or "Developing",
                            evaluated_at=ca.result.evaluated_at or datetime.datetime.utcnow()
                        )
                        db.add(res)

                    # Migrate Competency Scores
                    corp_comp_scores = corp_db.query(CorpCompScore).filter(CorpCompScore.attempt_id == ca.id).all()
                    for ccs in corp_comp_scores:
                        t_comp_id = comp_id_map.get(ccs.competency_id)
                        if t_comp_id:
                            t_cs = CompetencyScore(
                                attempt_id=target_attempt.id,
                                competency_id=t_comp_id,
                                score=ccs.score or 0.0,
                                max_score=ccs.max_score or 10.0,
                                percentage=ccs.percentage or 0.0,
                                readiness_level=ccs.readiness_level or "Developing"
                            )
                            db.add(t_cs)

            db.commit()
            print(f"[OK] Migrated {migrated_attempts_count} historical attempts with synthetic allocations.")

    except Exception as e:
        db.rollback()
        print(f"\n❌ Migration failed with error: {e}")
        raise e
    finally:
        db.close()
        if has_corp_db and corp_db:
            corp_db.close()

    print("\n" + "=" * 80)
    print("MIGRATION COMPLETED SUCCESSFULLY.")
    print("=" * 80)

if __name__ == "__main__":
    run_migration()
