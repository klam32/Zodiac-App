from fastapi import FastAPI
from dotenv import load_dotenv
load_dotenv()

from app.routers import auth, file_upload, payment, chatbot, admin, calendar, prediction, format_text, rewards, support
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from fastapi.staticfiles import StaticFiles
import logging

for handler in logging.root.handlers[:]:
    logging.root.removeHandler(handler)
logging.basicConfig(level=logging.INFO)
class IgnoreGeoNames(logging.Filter):
    def filter(self, record):
        msg = record.getMessage().lower()
        return not (
            "geonames" in msg or
            "timezone/coordinates" in msg or
            "no geonames username" in msg
        )

# áp dụng filter cho root
logging.getLogger().addFilter(IgnoreGeoNames())
logging.getLogger("kerykeion").setLevel(logging.CRITICAL)
logging.getLogger("kerykeion.fetch_geonames").setLevel(logging.CRITICAL)
logger = logging.getLogger(__name__)
# Prefix API theo version
api_prefix = f"/api/{settings.VERSION_APP}"

# Tạo instance của FastAPI
app = FastAPI(
    title=settings.TITLE_APP,
    docs_url=f"{api_prefix}/docs",
    redoc_url=f"{api_prefix}/redoc",
    openapi_url=f"{api_prefix}/openapi.json",
)

# Cấu hình CORS
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://frontend-omega-pink-49.vercel.app",
    "https://railcar-frostbite-alumni.ngrok-free.dev",
]

if settings.ALLOW_ORIGINS:
    import json
    try:
        # Hỗ trợ định dạng JSON trong .env
        parsed = json.loads(settings.ALLOW_ORIGINS)
        if isinstance(parsed, list):
            env_origins = parsed
        else:
            env_origins = [str(parsed)]
    except Exception:
        # Hỗ trợ định dạng phân tách bằng dấu phẩy
        if "," in settings.ALLOW_ORIGINS:
            env_origins = [o.strip() for o in settings.ALLOW_ORIGINS.split(",")]
        else:
            env_origins = [settings.ALLOW_ORIGINS.strip()]
            
    for o in env_origins:
        o_str = str(o).strip()
        if o_str and o_str != "*" and o_str not in origins:
            origins.append(o_str)

logger.info(f"CORS Allowed Origins: {origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


from fastapi import Request

@app.middleware("http")
async def log_cors_and_headers(request: Request, call_next):
    origin = request.headers.get("origin")
    host = request.headers.get("host")
    x_forwarded_proto = request.headers.get("x-forwarded-proto")
    logger.info(f"[CORS LOG] Request URL: {request.url.path} | Method: {request.method} | Origin: {origin} | Host: {host} | Forwarded Proto: {x_forwarded_proto}")
    response = await call_next(request)
    return response


# Include các router vào ứng dụng chính
app.include_router(auth.router, prefix=api_prefix)
app.include_router(file_upload.router, prefix=api_prefix)
app.include_router(payment.router, prefix=api_prefix)
app.include_router(payment.reports_router, prefix=api_prefix)
app.include_router(chatbot.router, prefix=api_prefix)
app.include_router(admin.router, prefix=api_prefix)
app.include_router(admin.public_settings_router, prefix=api_prefix)
app.include_router(calendar.router, prefix=api_prefix)
app.include_router(prediction.router, prefix=api_prefix)
app.include_router(format_text.router, prefix=api_prefix)
app.include_router(rewards.router, prefix=api_prefix)
app.include_router(support.router, prefix=api_prefix)
app.add_api_websocket_route("/ws/support", support.websocket_support)


@app.get(f"{api_prefix}/")
def read_root():
    return {"message": f"Welcome to {settings.TITLE_APP}"}
