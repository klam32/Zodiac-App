# # File cấu hình chung cho ứng dụng

# import os
# from dotenv import load_dotenv

# # Load các biến môi trường từ file .env
# load_dotenv()


# class Settings:
#     # SETTING
#     DIR_ROOT = os.path.dirname(os.path.abspath(".env"))
    
#     # API KEY
#     SECRET_KEY = os.getenv("SECRET_KEY", "default_secret_key")
    
#     # SECURITY
#     ALLOW_ORIGINS = os.getenv("ALLOW_ORIGINS", "*")

#     # TITLE
#     TITLE_APP = os.getenv("TITLE_APP", "Bloom API")
#     VERSION_APP = os.getenv("VERSION_APP", "v1")
#     NAME_WEB = os.getenv("NAME_WEB", "BLOOM")
    
#     # GOOGLE OAUTH
#     GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
#     GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
#     GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI")
#     FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

#     # SEPAY
#     SEPAY_API_KEY = os.getenv("SEPAY_API_KEY")
#     SEPAY_ACCOUNT_NUMBER = os.getenv("SEPAY_ACCOUNT_NUMBER")
#     SEPAY_BANK_BRAND = os.getenv("SEPAY_BANK_BRAND")

#     # DB (SQLite)
#     DB_PATH = os.path.join(DIR_ROOT, "database.db")
#     # DB (MySQL)
#     DB_HOST="localhost"
#     DB_USER="root"
#     DB_PASSWORD=""
#     DB_NAME="zodiac_chatbot"
#     DB_PORT=3306

# settings = Settings()
# File cấu hình chung cho ứng dụng

import os
from dotenv import load_dotenv

load_dotenv()


class Settings:

    # ROOT
    DIR_ROOT = os.path.dirname(os.path.abspath(__file__))

    # ====================
    # SECURITY
    # ====================

    SECRET_KEY = os.getenv("SECRET_KEY", "default_secret_key")

    ALLOW_ORIGINS = os.getenv("ALLOWED_ORIGINS") or os.getenv("ALLOW_ORIGINS") or "*"

    # ====================
    # APP INFO
    # ====================

    TITLE_APP = os.getenv("TITLE_APP", "ZodiacWhisper API")
    VERSION_APP = os.getenv("VERSION_APP", "v1")
    NAME_WEB = os.getenv("NAME_WEB", "ZODIACWHISPER")

    # ====================
    # GOOGLE LOGIN
    # ====================

    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
    GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI")
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

    # ====================
    # SMTP EMAIL CONFIG
    # ====================
    SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
    SMTP_USER = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", "")
    ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "")

    # ====================
    # SEPAY PAYMENT
    # ====================

    SEPAY_API_KEY = os.getenv("SEPAY_API_KEY")
    SEPAY_ACCOUNT_NUMBER = os.getenv("SEPAY_ACCOUNT_NUMBER")
    SEPAY_BANK_BRAND = os.getenv("SEPAY_BANK_BRAND")

    # ====================
    # DATABASE MYSQL
    # ====================

    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_USER = os.getenv("DB_USER", "root")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "")
    DB_NAME = os.getenv("DB_NAME", "zodiac_chatbot")
    DB_PORT = int(os.getenv("DB_PORT", 3306))

    # ====================
    # AI MODEL
    # ====================

    LLM_NAME = os.getenv("LLM_NAME", "gemini")

    # GEMINI
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

    # OPENAI
    OPENAI_API_KEY = os.getenv("KEY_API_OPENAI")
    OPENAI_MODEL = os.getenv("OPENAI_LLM_MODEL_NAME", "gpt-4o-mini")

    # GROK
    GROK_API_KEY = os.getenv("GROK_API_KEY")
    GROK_MODEL = os.getenv("GROK_MODEL", "grok-2-latest")


settings = Settings()

# Validate SMTP environment variables
smtp_vars = [
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USER",
    "SMTP_PASSWORD",
    "SMTP_FROM_EMAIL",
    "ADMIN_EMAIL",
]
for var in smtp_vars:
    val = getattr(settings, var, None)
    if not val:
        print(f"[Email] Warning: Environment variable '{var}' is missing or empty in .env")