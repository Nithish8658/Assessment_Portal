import os

SECRET_KEY = os.getenv("SECRET_KEY", "nasc-assessment-portal-secret-key-2026-super-secure")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 24 hours

INSTITUTION_NAME = "Nehru Arts and Science College (Autonomous)"
INSTITUTION_SHORT = "NASC"
CURRENT_ACADEMIC_YEAR = "2025-2026"
CURRENT_SEMESTER = "Even Semester (IV/VI)"
