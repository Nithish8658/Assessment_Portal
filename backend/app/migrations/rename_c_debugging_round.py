"""Rename C track Round 4 to match its question bank.

Run from backend: python -m app.migrations.rename_c_debugging_round
The 60 debugging questions cover C broadly (logic, loops, arrays, strings, pointers, dynamic
memory, linked lists, stacks, queues, trees); the old name promised only memory safety.
Only updates the round while it still has the old title.
"""
from sqlalchemy import text
from app.database import engine

OLD_TITLE = "Round 4: C Memory Safety & Systems Debugging"
NEW_TITLE = "Round 4: C Debugging & Defect Fixing"
NEW_DESCRIPTION = ("Find and fix defects in C programs: logic and loop errors, arrays and strings, pointers and "
                   "dynamic memory, linked lists, stacks, queues and trees.")


def migrate():
    with engine.begin() as connection:
        n = connection.execute(text(
            "UPDATE assessment_rounds SET title = :t, description = :d WHERE title = :old "
            "AND domain_id = (SELECT id FROM assessment_domains WHERE slug = 'c-programming-track')"
        ), {"t": NEW_TITLE, "d": NEW_DESCRIPTION, "old": OLD_TITLE}).rowcount
    print(f"Renamed {n} round(s) to '{NEW_TITLE}'." if n else "Round already renamed; nothing to do.")


if __name__ == "__main__":
    migrate()
