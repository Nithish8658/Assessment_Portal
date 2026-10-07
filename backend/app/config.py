import os
from pathlib import Path
from dotenv import load_dotenv

# Automatically locate and load .env from backend directory
backend_dir = Path(__file__).resolve().parent.parent
env_path = backend_dir / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "nasc-assessment-portal-secret-key-2026-super-secure")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 24 hours

APP_NAME = os.getenv("APP_NAME", "MockRun")
BRAND_PROVIDER = os.getenv("BRAND_PROVIDER", "OpenLectern")
INSTITUTION_NAME = os.getenv("INSTITUTION_NAME", "Nehru Arts and Science College (Autonomous)")
INSTITUTION_SHORT = os.getenv("INSTITUTION_SHORT", "NASC")
CURRENT_ACADEMIC_YEAR = os.getenv("CURRENT_ACADEMIC_YEAR", "2026-2027")
CURRENT_SEMESTER = os.getenv("CURRENT_SEMESTER", "Even Semester (III/V)")

# --- Database & PgCat Connection Pooler Configuration ---
USE_PGCAT = os.getenv("USE_PGCAT", "true").lower() in ("true", "1", "yes")
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg2://nasc_admin:nasc_secure_password_2026@localhost:6432/nasc_portal")
DIRECT_DATABASE_URL = os.getenv("DIRECT_DATABASE_URL", "postgresql+psycopg2://nasc_admin:nasc_secure_password_2026@localhost:5432/nasc_portal")
PGCAT_PORT = int(os.getenv("PGCAT_PORT", "6432"))
DB_DIRECT_PORT = int(os.getenv("DB_DIRECT_PORT", "5432"))
DB_POOL_SIZE = int(os.getenv("DB_POOL_SIZE", "80"))
DB_MAX_OVERFLOW = int(os.getenv("DB_MAX_OVERFLOW", "40"))

# --- Google Gemini Evaluation Engine Configuration ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", os.getenv("LLM_API_KEY", "")).strip()
GEMINI_MODELS_RAW = os.getenv("GEMINI_MODELS") or os.getenv("GEMINI_MODEL", "")
GEMINI_MODELS = [m.strip() for m in GEMINI_MODELS_RAW.split(",") if m.strip()]
GEMINI_MODEL = GEMINI_MODELS[0] if GEMINI_MODELS else "gemini-3.1-flash-lite"
LLM_API_KEY = GEMINI_API_KEY

# --- Dedicated HoD & Admin AI Intelligence Assistant Configuration (Gemini 3.1 Flash Live) ---
# Strictly configured to gemini-3.1-flash-live-preview (no fallback models)
HOD_ASSISTANT_API_KEY = os.getenv("HOD_ASSISTANT_API_KEY", GEMINI_API_KEY).strip()
HOD_ASSISTANT_LIVE_MODEL = os.getenv("HOD_ASSISTANT_LIVE_MODEL", "gemini-3.1-flash-live-preview").strip()

# Evaluation Engine Mode
CODE_EVALUATION_ENGINE = "GeminiBatchEvaluation"

