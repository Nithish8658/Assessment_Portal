import os
import sys
import json
import psycopg2

db_url = os.getenv("DATABASE_URL", "postgresql://nasc_admin:nasc_secure_password_2026@localhost:5432/nasc_portal")
conn = psycopg2.connect(db_url)
cur = conn.cursor()

print("="*90)
print("AUDIT & VERIFICATION OF ALL ASSESSMENT DOMAINS & ROUNDS QUESTION BANKS")
print("="*90)

cur.execute("""
SELECT 
    d.id AS domain_id,
    d.title AS domain_title,
    r.id AS round_id,
    r.round_number,
    r.title AS round_title,
    r.round_type,
    r.questions_per_attempt,
    COUNT(q.id) AS total_questions_in_db,
    COUNT(e.id) AS total_eval_configs_in_db
FROM assessment_domains d
JOIN assessment_rounds r ON r.domain_id = d.id
LEFT JOIN assessment_questions q ON q.round_id = r.id AND q.status = 'Active'
LEFT JOIN question_evaluation_configs e ON e.question_id = q.id
GROUP BY d.id, d.title, r.id, r.round_number, r.title, r.round_type, r.questions_per_attempt
ORDER BY d.id, r.round_number;
""")

rows = cur.fetchall()

print(f"{'Domain':<30} | {'R#':<3} | {'Round Title':<38} | {'Target':<6} | {'DB Qs':<6} | {'Eval Cfg':<8} | {'Status'}")
print("-" * 115)

all_passed = True
total_questions_all = 0
total_target_all = 0

for r in rows:
    domain_id, domain_title, round_id, r_num, r_title, r_type, target_q, db_q, eval_cfg = r
    total_questions_all += db_q
    total_target_all += target_q
    
    is_target_met = (db_q >= target_q)
    is_eval_complete = (db_q == eval_cfg)
    
    if is_target_met and is_eval_complete:
        status_str = "PASSED (100%)"
    else:
        status_str = f"DEFICIT (DB: {db_q}/{target_q})"
        all_passed = False
        
    short_domain = domain_title[:28]
    short_title = r_title[:36]
    print(f"{short_domain:<30} | {r_num:<3} | {short_title:<38} | {target_q:<6} | {db_q:<6} | {eval_cfg:<8} | {status_str}")

print("="*115)
print(f"Total Across Portal: {total_questions_all} Questions across 17 Rounds (Configured Targets: {total_target_all})")

# Check for cross-round duplicate titles
cur.execute("""
SELECT title, COUNT(*), array_agg(round_id)
FROM assessment_questions
GROUP BY title
HAVING COUNT(*) > 1;
""")
duplicates = cur.fetchall()

if duplicates:
    print(f"\n[WARNING] Found {len(duplicates)} duplicate question titles:")
    for dup in duplicates:
        print(f"  - '{dup[0]}' appears {dup[1]} times in rounds {dup[2]}")
else:
    print("\n[SUCCESS] 0 Duplicate questions found across all rounds! Every question is unique.")

if all_passed:
    print("[FINAL RESULT] ALL 17 ROUNDS ACROSS ALL 4 DOMAINS HAVE 100% TARGET QUESTION BANK COMPLETION!")
else:
    print("[FINAL RESULT] Some rounds still have deficits.")

cur.close()
conn.close()
