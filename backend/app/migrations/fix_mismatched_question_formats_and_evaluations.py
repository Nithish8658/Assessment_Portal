"""
Migration script: Fix Mismatched Question Formats & Evaluation Methods
- Q78 (SQL Practical): Convert from code_completion to 4-option MCQ (2.0 marks), ExactMatch.
- Q81 (VBA Loop Debugging): Convert from code_debug to 4-option MCQ (2.0 marks), ExactMatch.
- Q93 (Python Max Loop): Convert from code_completion to 4-option MCQ (2.0 marks), ExactMatch.
- Q96 (Tableau Procedural): Normalize question_type to 'mcq', marks to 2.0 (standard MCQ marks), evaluation_type to 'ExactMatch'.
- Q98, Q100, Q269, Q270 (Project Interview): Set evaluation_type to 'ai_rubric_tutor_override', clear correct_answer, populate reference_solution & structured scoring_rules_json.
"""
import os
import sys

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, ROOT_DIR)

from app.database import SessionLocal
from app.models.assessment_models import (
    AssessmentQuestion,
    QuestionEvaluationConfig
)

def run_migration():
    db = SessionLocal()
    print("[START] Fixing mismatched question formats and evaluation methods...")

    try:
        # =========================================================================
        # 1. Q78: SQL Aggregation & Having Filter Completion -> MCQ (2.0 Marks)
        # =========================================================================
        q78 = db.query(AssessmentQuestion).filter(AssessmentQuestion.id == 78).first()
        cfg78 = db.query(QuestionEvaluationConfig).filter(QuestionEvaluationConfig.question_id == 78).first()
        if q78:
            q78.question_type = "mcq"
            q78.marks = 2.0
            q78.candidate_content = (
                "Given the query template below to calculate total sales per customer and filter for "
                "customers with total revenue strictly greater than $1,000:\n\n"
                "```sql\n"
                "SELECT customer_id, SUM(amount) AS total_revenue\n"
                "FROM orders\n"
                "GROUP BY {{BLANK_1}}\n"
                "HAVING {{BLANK_2}}\n"
                "ORDER BY total_revenue DESC;\n"
                "```\n\n"
                "Which pair of clauses correctly fills in `{{BLANK_1}}` and `{{BLANK_2}}`?"
            )
            q78.candidate_code_template = None
            q78.options_json = [
                {
                    "key": "A",
                    "text": "BLANK_1: customer_id  |  BLANK_2: SUM(amount) > 1000"
                },
                {
                    "key": "B",
                    "text": "BLANK_1: total_revenue  |  BLANK_2: total_revenue > 1000"
                },
                {
                    "key": "C",
                    "text": "BLANK_1: customer_id  |  BLANK_2: WHERE SUM(amount) > 1000"
                },
                {
                    "key": "D",
                    "text": "BLANK_1: orders.id  |  BLANK_2: COUNT(amount) > 1000"
                }
            ]
            print("  [UPDATED] Q78 converted to MCQ (2.0M)")

        if cfg78:
            cfg78.evaluation_type = "ExactMatch"
            cfg78.correct_answer = "A"
            cfg78.reference_solution = "Option A correctly groups by the non-aggregated column customer_id and filters aggregated total revenue via HAVING SUM(amount) > 1000."
            cfg78.public_test_cases_json = []
            cfg78.hidden_test_cases_json = []

        # =========================================================================
        # 2. Q81: VBA Macro Loop Debugging -> MCQ (2.0 Marks)
        # =========================================================================
        q81 = db.query(AssessmentQuestion).filter(AssessmentQuestion.id == 81).first()
        cfg81 = db.query(QuestionEvaluationConfig).filter(QuestionEvaluationConfig.question_id == 81).first()
        if q81:
            q81.question_type = "mcq"
            q81.marks = 2.0
            q81.candidate_content = (
                "The following VBA macro highlights rows where Column C (Sales) is less than 1,000, "
                "but it fails at runtime with Error 1004 because `LastRow` is not properly initialized:\n\n"
                "```vb\n"
                "Sub HighlightLowSales()\n"
                "    Dim i As Long\n"
                "    For i = 2 To LastRow\n"
                "        If Cells(i, 3).Value < 1000 Then\n"
                "            Cells(i, 3).Interior.Color = RGB(255, 0, 0)\n"
                "        End If\n"
                "    Next i\n"
                "End Sub\n"
                "```\n\n"
                "Which statement correctly initializes `LastRow` to find the last populated row in Column C before entering the loop?"
            )
            q81.candidate_code_template = None
            q81.options_json = [
                {
                    "key": "A",
                    "text": "Dim LastRow As Long: LastRow = Cells(Rows.Count, 3).End(xlUp).Row"
                },
                {
                    "key": "B",
                    "text": "Dim LastRow As Integer: LastRow = Cells(3, Columns.Count).End(xlToLeft).Column"
                },
                {
                    "key": "C",
                    "text": "LastRow = ActiveSheet.UsedRange.Rows.Select"
                },
                {
                    "key": "D",
                    "text": "Dim LastRow: LastRow = Count(Range(\"C:C\"))"
                }
            ]
            print("  [UPDATED] Q81 converted to MCQ (2.0M)")

        if cfg81:
            cfg81.evaluation_type = "ExactMatch"
            cfg81.correct_answer = "A"
            cfg81.reference_solution = "Cells(Rows.Count, 3).End(xlUp).Row is the standard robust VBA technique to find the last used row in Column C."
            cfg81.public_test_cases_json = []
            cfg81.hidden_test_cases_json = []

        # =========================================================================
        # 3. Q93: Find Maximum Value Algorithmic Code Completion -> MCQ (2.0 Marks)
        # =========================================================================
        q93 = db.query(AssessmentQuestion).filter(AssessmentQuestion.id == 93).first()
        cfg93 = db.query(QuestionEvaluationConfig).filter(QuestionEvaluationConfig.question_id == 93).first()
        if q93:
            q93.question_type = "mcq"
            q93.marks = 2.0
            q93.candidate_content = (
                "Review the following Python algorithm designed to iterate through a list and return its maximum value:\n\n"
                "```python\n"
                "def find_max(numbers):\n"
                "    max_value = numbers[0]\n"
                "    for number in numbers:\n"
                "        {{BLANK_1}}\n"
                "    return max_value\n"
                "```\n\n"
                "Which code snippet correctly fills `{{BLANK_1}}` in the loop body to ensure `max_value` is updated accurately?"
            )
            q93.candidate_code_template = None
            q93.options_json = [
                {
                    "key": "A",
                    "text": "if number > max_value:\n    max_value = number"
                },
                {
                    "key": "B",
                    "text": "if number < max_value:\n    max_value = number"
                },
                {
                    "key": "C",
                    "text": "max_value = max(numbers)"
                },
                {
                    "key": "D",
                    "text": "if max_value == number:\n    continue"
                }
            ]
            print("  [UPDATED] Q93 converted to MCQ (2.0M)")

        if cfg93:
            cfg93.evaluation_type = "ExactMatch"
            cfg93.correct_answer = "A"
            cfg93.reference_solution = "if number > max_value: max_value = number properly checks each element against the current running maximum and updates it."
            cfg93.public_test_cases_json = []
            cfg93.hidden_test_cases_json = []

        # =========================================================================
        # 4. Q96: Tableau Executive Sales Dashboard Creation -> MCQ (2.0 Marks)
        # =========================================================================
        q96 = db.query(AssessmentQuestion).filter(AssessmentQuestion.id == 96).first()
        cfg96 = db.query(QuestionEvaluationConfig).filter(QuestionEvaluationConfig.question_id == 96).first()
        if q96:
            q96.question_type = "mcq"
            q96.marks = 2.0  # Standardized MCQ marks as per round
            print("  [UPDATED] Q96 normalized to MCQ (2.0M)")

        if cfg96:
            cfg96.evaluation_type = "ExactMatch"
            cfg96.correct_answer = "A"
            cfg96.reference_solution = "Option A correctly follows Tableau best practices: build modular individual worksheets before combining on an executive dashboard with global filter actions."

        # =========================================================================
        # 5. Q98: Analytical Decision & Anomaly Investigation -> ai_rubric_tutor_override (5.0M)
        # =========================================================================
        q98 = db.query(AssessmentQuestion).filter(AssessmentQuestion.id == 98).first()
        cfg98 = db.query(QuestionEvaluationConfig).filter(QuestionEvaluationConfig.question_id == 98).first()
        if q98:
            q98.question_type = "text_response"
            q98.marks = 5.0
            print("  [UPDATED] Q98 normalized format to text_response (5.0M)")

        if cfg98:
            cfg98.evaluation_type = "ai_rubric_tutor_override"
            cfg98.correct_answer = None
            cfg98.reference_solution = (
                "Candidate response must outline systematic verification steps: "
                "(1) Data Pipeline Integrity: Audit ingestion logs for bulk synthetic orders, test accounts, or duplicate ETL runs. "
                "(2) Metric Decomposition: Decompose 45% revenue surge into unit volume vs average order value (AOV) vs product category mix. "
                "(3) Business Driver Corroboration: Check regional marketing campaign launches, B2B wholesale bulk contracts, or pricing changes. "
                "(4) Executive Reporting Readiness: Prepare confidence intervals, caveat data limitations, and present sensitivity analysis to leadership."
            )
            cfg98.scoring_rules_json = {
                "criteria": [
                    {"dimension": "Data Pipeline & Duplication Checks", "weight": 0.3},
                    {"dimension": "Metric Decomposition (Volume vs Price)", "weight": 0.3},
                    {"dimension": "Business Context & External Drivers", "weight": 0.2},
                    {"dimension": "Executive Communication Readiness", "weight": 0.2}
                ],
                "award_full": 5.0,
                "penalty_wrong": 0.0
            }

        # =========================================================================
        # 6. Q100: Project Architecture & Data Lineage -> ai_rubric_tutor_override (5.0M)
        # =========================================================================
        q100 = db.query(AssessmentQuestion).filter(AssessmentQuestion.id == 100).first()
        cfg100 = db.query(QuestionEvaluationConfig).filter(QuestionEvaluationConfig.question_id == 100).first()
        if q100:
            q100.question_type = "text_response"
            q100.marks = 5.0
            print("  [UPDATED] Q100 normalized format to text_response (5.0M)")

        if cfg100:
            cfg100.evaluation_type = "ai_rubric_tutor_override"
            cfg100.correct_answer = None
            cfg100.reference_solution = (
                "Candidate response must demonstrate authentic technical ownership of an end-to-end data project: "
                "(1) Clear Business Problem: Well-defined objective and success metrics (e.g. churn prediction, sales forecasting). "
                "(2) Data Lineage & Sources: Identified origin of raw data (CSV, relational DB, API) and volume. "
                "(3) Data Cleaning & Transformation: Explicit handling of missing values, anomalies, joins, and aggregations. "
                "(4) Tool Stack & Personal Contribution: Concrete explanation of personal role in SQL queries, Python scripts, or Tableau dashboard creation."
            )
            cfg100.scoring_rules_json = {
                "criteria": [
                    {"dimension": "Business Objective Clarity", "weight": 0.25},
                    {"dimension": "Data Lineage & Pipeline Steps", "weight": 0.25},
                    {"dimension": "Cleaning & Transformation Rigor", "weight": 0.25},
                    {"dimension": "Individual Tool Stack Ownership", "weight": 0.25}
                ],
                "award_full": 5.0,
                "penalty_wrong": 0.0
            }

        # =========================================================================
        # 7. Q269: Handling Data Skew & Salting Join Keys -> ai_rubric_tutor_override (5.0M)
        # =========================================================================
        q269 = db.query(AssessmentQuestion).filter(AssessmentQuestion.id == 269).first()
        cfg269 = db.query(QuestionEvaluationConfig).filter(QuestionEvaluationConfig.question_id == 269).first()
        if q269:
            q269.question_type = "text_response"
            q269.marks = 5.0
            print("  [UPDATED] Q269 normalized format to text_response (5.0M)")

        if cfg269:
            cfg269.evaluation_type = "ai_rubric_tutor_override"
            cfg269.correct_answer = None
            cfg269.reference_solution = (
                "Candidate response must detail distributed systems skew mitigation: "
                "(1) Skew Detection: Spark/engine UI stage metrics showing 1 partition task executing 10x longer than peers with high spill-to-disk on default customer_id=0. "
                "(2) Key Salting Implementation: Adding pseudo-random salt (e.g. concat(customer_id, '_', floor(rand() * N))) to skewed table to distribute rows uniformly across N partitions. "
                "(3) Dimension Table Replication: Exploding lookup dimension table keys across the same salt space (1..N) to preserve join alignment. "
                "(4) Two-Stage Aggregation: Aggregating partially by salted key, then stripping the salt suffix to compute global aggregate without reducer bottleneck."
            )
            cfg269.scoring_rules_json = {
                "criteria": [
                    {"dimension": "Skew Detection & Spark UI Metrics", "weight": 0.25},
                    {"dimension": "Key Salting Formula & Mechanics", "weight": 0.35},
                    {"dimension": "Dimension Replication / Two-Stage Rollup", "weight": 0.25},
                    {"dimension": "Trade-offs (Memory vs Compute Overhead)", "weight": 0.15}
                ],
                "award_full": 5.0,
                "penalty_wrong": 0.0
            }

        # =========================================================================
        # 8. Q270: Automated Data Drift & Schema Evolution in ETL -> ai_rubric_tutor_override (5.0M)
        # =========================================================================
        q270 = db.query(AssessmentQuestion).filter(AssessmentQuestion.id == 270).first()
        cfg270 = db.query(QuestionEvaluationConfig).filter(QuestionEvaluationConfig.question_id == 270).first()
        if q270:
            q270.question_type = "text_response"
            q270.marks = 5.0
            print("  [UPDATED] Q270 normalized format to text_response (5.0M)")

        if cfg270:
            cfg270.evaluation_type = "ai_rubric_tutor_override"
            cfg270.correct_answer = None
            cfg270.reference_solution = (
                "Candidate response must present robust production data quality architecture: "
                "(1) Schema Enforcement & Evolution: Enforcing strict schema contracts (Pydantic / Great Expectations / Delta Lake merge schema) to prevent breaking type mutations. "
                "(2) Statistical Drift Detection: Monitoring feature distributions (null rate delta, mean/std shift, Population Stability Index (PSI) or Kolmogorov-Smirnov test). "
                "(3) Quarantine & Dead-Letter Isolation: Routing corrupted or drifted records into quarantine tables without terminating the main production ETL pipeline. "
                "(4) Automated Alerting & Observability: Webhook integration (Slack / PagerDuty / Datadog) with run metadata and remediation runbooks."
            )
            cfg270.scoring_rules_json = {
                "criteria": [
                    {"dimension": "Schema Contract & Evolution Strategy", "weight": 0.3},
                    {"dimension": "Statistical Distribution & Drift Metrics", "weight": 0.3},
                    {"dimension": "Quarantine & Dead-Letter Queue Isolation", "weight": 0.25},
                    {"dimension": "Observability & Alerting Automation", "weight": 0.15}
                ],
                "award_full": 5.0,
                "penalty_wrong": 0.0
            }

        db.commit()
        print("[SUCCESS] All 8 questions and evaluation configs normalized successfully!")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Migration failed: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    run_migration()
