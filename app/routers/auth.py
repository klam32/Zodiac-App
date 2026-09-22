import httpx
import os
from fastapi import APIRouter, HTTPException, Form, Depends, Query, Request
from datetime import datetime, timedelta, timezone
from jose import jwt  # type: ignore
from app.config import settings
from app.models.base_db import UserDB
from app.security.security import get_current_user
from pydantic import BaseModel
from typing import Optional
from urllib.parse import urlencode, urlparse
import bcrypt


import logging

router = APIRouter(prefix="/auth", tags=["auth"])
logger = logging.getLogger(__name__)

def get_google_redirect_uri(request: Request):
    scheme = (request.headers.get("x-forwarded-proto") or request.url.scheme or "https").split(",")[0].strip()
    host = (request.headers.get("x-forwarded-host") or request.headers.get("host") or "localhost:2643").split(",")[0].strip()

    is_localhost = any(x in host for x in ["localhost", "127.0.0.1", "192.168."])
    if is_localhost:
        scheme = "http"

    detected_redirect_uri = f"{scheme}://{host}/api/v1/auth/google/callback"
    configured_redirect_uri = (settings.GOOGLE_REDIRECT_URI or "").strip()

    if configured_redirect_uri:
        force_configured = os.getenv("FORCE_GOOGLE_REDIRECT_URI", "0").lower() in {"1", "true", "yes"}
        configured_host = urlparse(configured_redirect_uri).netloc

        if force_configured or configured_host == host:
            logger.info("Using configured Google redirect URI: %s", configured_redirect_uri)
            return configured_redirect_uri

        logger.warning(
            "Ignoring GOOGLE_REDIRECT_URI host %s because request host is %s. Set FORCE_GOOGLE_REDIRECT_URI=1 to override.",
            configured_host,
            host,
        )

    logger.info("Using detected Google redirect URI: %s", detected_redirect_uri)
    return detected_redirect_uri


SECRET_KEY = settings.SECRET_KEY
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    picture_url: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None


def verify_password(plain_password: str, hashed_password: str):
    # Trực tiếp sử dụng bcrypt để kiểm tra
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))


def get_password_hash(password: str):
    # Trực tiếp sử dụng bcrypt để hash
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


@router.post("/send-otp")
def send_otp(request: Request, email: str = Form(...)):
    import re
    email = email.strip().lower()
    if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
        raise HTTPException(status_code=400, detail="Định dạng email không hợp lệ!")

    user_db = UserDB()
    existing_email = user_db.get_by_email(email)
    if existing_email:
        user_db.close()
        raise HTTPException(status_code=400, detail="Email đã được sử dụng!")

    import random
    otp = f"{random.randint(100000, 999999)}"

    user_db.save_otp(email, otp)
    user_db.close()

    print("=" * 50)
    print(f"[OTP DEBUG] Generated OTP for {email}: {otp}")
    print("=" * 50)


    from app.services.email_service import send_email
    subject = "[Zodiac Whisper] Mã xác thực OTP đăng ký tài khoản"
    html_content = f"""
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; }}
            .header {{ background-color: #7c3aed; color: white; padding: 15px; text-align: center; border-radius: 10px 10px 0 0; }}
            .content {{ padding: 20px; text-align: center; }}
            .otp-code {{ font-size: 32px; font-weight: bold; color: #7c3aed; letter-spacing: 5px; margin: 20px 0; padding: 10px; background-color: #f3f4f6; border-radius: 8px; display: inline-block; }}
            .footer {{ text-align: center; margin-top: 20px; font-size: 12px; color: #999; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>Xác thực đăng ký tài khoản</h2>
            </div>
            <div class="content">
                <p>Xin chào,</p>
                <p>Cảm ơn bạn đã lựa chọn đăng ký tài khoản tại <strong>Zodiac Whisper</strong>.</p>
                <p>Dưới đây là mã OTP xác thực của bạn (mã có hiệu lực trong 5 phút):</p>
                <div class="otp-code">{otp}</div>
                <p>Vui lòng không chia sẻ mã này cho bất kỳ ai để đảm bảo an toàn cho tài khoản của bạn.</p>
            </div>
            <div class="footer">
                <p>© 2026 Zodiac Whisper. Đây là email tự động, vui lòng không phản hồi.</p>
            </div>
        </div>
    </body>
    </html>
    """

    success = send_email(email, subject, html_content)
    if not success:
        host = request.headers.get("host", "")
        is_localhost = any(x in host for x in ["localhost", "127.0.0.1", "192.168.", "ngrok-free.dev"]) or "trycloudflare" in host
        if is_localhost:
            return {"message": "Mã OTP đã được tạo! [LƯU Ý: Gửi email thất bại do cấu hình SMTP trong file .env chưa chính xác hoặc bị chặn. Do bạn đang chạy ở môi trường phát triển local, vui lòng xem mã OTP trong cửa sổ terminal/console của backend để tiếp tục đăng ký!]"}

        raise HTTPException(status_code=500, detail="Không thể gửi email OTP. Vui lòng kiểm tra lại cấu hình email!")

    return {"message": "Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư!"}



@router.post("/register")
def register(username: str = Form(...), password: str = Form(...), email: str = Form(...), otp: str = Form(...)):
    user_db = UserDB()

    if not user_db.verify_otp(email, otp):
        user_db.close()
        raise HTTPException(status_code=400, detail="Mã OTP không chính xác hoặc đã hết hạn!")

    existing = user_db.get_by_username(username)
    if existing:
        user_db.close()
        raise HTTPException(status_code=400, detail="Tên người dùng đã tồn tại!")

    existing_email = user_db.get_by_email(email)
    if existing_email:
        user_db.close()
        raise HTTPException(status_code=400, detail="Email đã được sử dụng!")

    hashed_pw = get_password_hash(password)
    user_db.add(username, hashed_pw, email)
    user_db.close()
    return {"message": "✅ Đăng ký thành công!"}



@router.post("/login")
def login(request: Request, username: str = Form(...), password: str = Form(...)):
    user_db = UserDB()
    user = user_db.get_by_username(username)

    if user is None:
        user_db.close()
        raise HTTPException(status_code=401, detail="Sai tên đăng nhập hoặc mật khẩu!")

    if not user.get("password"):
        user_db.close()
        raise HTTPException(status_code=401, detail="Sai tên đăng nhập hoặc mật khẩu!")

    if not verify_password(password, str(user.get("password"))):
        user_db.close()
        raise HTTPException(status_code=401, detail="Sai tên đăng nhập hoặc mật khẩu!")

    # Log login
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")
    user_db.log_login(user["id"], client_ip, user_agent)
    user_db.close()

    token = create_access_token({
        "id": user["id"],
        "username": user["username"],
        "email": user["email"],
        "is_admin": bool(user["is_admin"]),
        "token_balance": user.get("token_balance", 0)
    })
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            **user,
            "is_admin": bool(user["is_admin"]),
            "role": "ADMIN" if user["is_admin"] else "USER",
            "token_balance": user.get("token_balance", 0)
        }
    }


@router.get("/google/login")
async def google_login(request: Request):
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Google OAuth is not configured")

    redirect_uri = get_google_redirect_uri(request)
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "consent"
    }
    query_string = urlencode(params)
    return {"auth_url": f"https://accounts.google.com/o/oauth2/v2/auth?{query_string}"}


@router.get("/google/login/flutter")
async def google_login_flutter(request: Request, callback_scheme: str = "zodiacchatbot"):
    from fastapi.responses import RedirectResponse
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Google OAuth is not configured")

    redirect_uri = get_google_redirect_uri(request)
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "consent",
        "state": f"flutter:{callback_scheme}"
    }
    query_string = urlencode(params)
    auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{query_string}"
    return RedirectResponse(url=auth_url)


@router.get("/google/callback")
async def google_callback(request: Request, code: str = Query(...), state: str = Query(None)):
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="Google OAuth is not configured")

    redirect_uri = get_google_redirect_uri(request)
    # 1. Trao đổi code lấy access_token từ Google
    async with httpx.AsyncClient() as client:
        token_url = "https://oauth2.googleapis.com/token"
        data = {
            "code": code,
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code",
        }
        resp = await client.post(token_url, data=data)
        if resp.status_code != 200:
            logger.error("Google token exchange failed: %s", resp.text)
            raise HTTPException(status_code=400, detail="Lỗi xác thực Google (Token Exchange)")

        token_data = resp.json()
        access_token = token_data.get("access_token")

        # 2. Lấy thông tin user (email, name) từ Google
        user_info_url = "https://www.googleapis.com/oauth2/v3/userinfo"
        headers = {"Authorization": f"Bearer {access_token}"}
        user_resp = await client.get(user_info_url, headers=headers)
        if user_resp.status_code != 200:
            logger.error("Google userinfo failed: %s", user_resp.text)
            raise HTTPException(status_code=400, detail="Lỗi lấy thông tin người dùng từ Google")

        google_user = user_resp.json()
        email = google_user.get("email")
        name = google_user.get("name")
        picture = google_user.get("picture")

    # 3. Lưu/Cập nhật user vào Database
    user_db = UserDB()
    user = user_db.update_or_create_google_user(email, name, picture)
    user_db.close()

    if user is None:
        raise HTTPException(status_code=400, detail="Không thể tạo hoặc cập nhật người dùng")

    # 4. Tạo JWT token và trả về
    token = create_access_token({
        "id": user["id"],
        "username": user["username"],
        "email": user["email"],
        "is_admin": bool(user.get("is_admin", 0)),
        "token_balance": user.get("token_balance", 0)
    })

    # 5. Redirect về Frontend kèm token
    from fastapi.responses import RedirectResponse

    # Check if the state is from Flutter / native app
    if state and state.startswith("flutter:"):
        app_scheme = state.split(":", 1)[1]
        # Use zodiacchatbot://callback?token=... format - needs a host component for Android
        target_url = f"{app_scheme}://callback?token={token}"
        logger.info(f"Flutter sign-in detected. Redirecting via HTML: {target_url}")

        from fastapi.responses import HTMLResponse
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Redirecting...</title>
            <style>
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                    background-color: #07070c;
                    color: #ffffff;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    margin: 0;
                    padding: 20px;
                    box-sizing: border-box;
                    text-align: center;
                }}
                .spinner {{
                    width: 50px;
                    height: 50px;
                    border: 5px solid rgba(255,255,255,0.1);
                    border-radius: 50%;
                    border-top-color: #a855f7;
                    animation: spin 1s ease-in-out infinite;
                    margin-bottom: 24px;
                }}
                @keyframes spin {{
                    to {{ transform: rotate(360deg); }}
                }}
                h2 {{
                    margin: 0 0 8px 0;
                    font-size: 20px;
                    font-weight: 600;
                    background: linear-gradient(to right, #c084fc, #f472b6, #fbbf24);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }}
                p {{
                    color: #94a3b8;
                    font-size: 14px;
                    margin: 0 0 32px 0;
                }}
                .btn {{
                    display: inline-block;
                    background: linear-gradient(135deg, #a855f7, #4f46e5);
                    color: white;
                    text-decoration: none;
                    padding: 12px 24px;
                    border-radius: 12px;
                    font-weight: bold;
                    font-size: 15px;
                    box-shadow: 0 4px 15px rgba(168, 85, 247, 0.4);
                    transition: transform 0.2s, box-shadow 0.2s;
                }}
                .btn:active {{
                    transform: scale(0.98);
                }}
            </style>
        </head>
        <body>
            <div class="spinner"></div>
            <h2>Đăng nhập thành công</h2>
            <p>Đang quay trở lại ứng dụng Zodiac Whisper...</p>
            <a href="{target_url}" class="btn">Tiếp tục vào ứng dụng</a>

            <script>
                // Auto redirect
                setTimeout(function() {{
                    window.location.href = "{target_url}";
                }}, 500);
            </script>
        </body>
        </html>
        """
        return HTMLResponse(content=html_content)

    # --- LOGIC DYNAMIC FRONTEND REDIRECT ---
    scheme = request.headers.get("x-forwarded-proto", request.url.scheme)
    host = request.headers.get("host", "localhost:5173")

    is_localhost = any(x in host for x in ["localhost", "127.0.0.1", "192.168."])

    if is_localhost:
        if ":2643" in host:
            frontend_host = host.replace(":2643", ":3000")
        else:
            frontend_host = "localhost:3000"
        target_url = f"http://{frontend_host}/?token={token}"
    else:
        # Nếu đang chạy trên server/production, dùng FRONTEND_URL từ .env
        if settings.FRONTEND_URL and "localhost" not in settings.FRONTEND_URL:
            target_url = f"{settings.FRONTEND_URL.rstrip('/')}/?token={token}"
        else:
            target_url = f"{scheme}://{host}/?token={token}"

    logger.info(f"Redirecting back to Frontend: {target_url}")
    return RedirectResponse(url=target_url)

# Trigger reload config change
@router.get("/tokens/history")
def get_tokens_history(user=Depends(get_current_user)):
    user_db = UserDB()
    history = user_db.get_token_history(user["id"])
    user_db.close()
    return {"history": history}


@router.post("/tokens/transaction")
def token_transaction(
    amount: int = Form(...),
    description: str = Form("Nạp/Rút token"),
    tx_type: str = Form(...), # 'in' or 'out'
    user=Depends(get_current_user)
):
    if tx_type not in ['in', 'out']:
        raise HTTPException(status_code=400, detail="Loại giao dịch không hợp lệ")

    user_db = UserDB()

    # Nếu là 'out', kiểm tra số dư
    if tx_type == 'out':
        current_user = user_db.get_by_email(user["email"])
        if current_user is None:
            user_db.close()
            raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
        if current_user["token_balance"] < amount:
            user_db.close()
            raise HTTPException(status_code=400, detail="Số dư token không đủ")

    new_balance = user_db.change_token_balance(user["id"], amount, description, tx_type)
    user_db.close()

    return {
        "message": f"✅ Giao dịch thành công ({tx_type})",
        "new_balance": new_balance
    }


@router.put("/profile")
async def update_profile(data: ProfileUpdate, user=Depends(get_current_user)):
    user_db = UserDB()
    db_user = user_db.get_by_email(user["email"])

    if not db_user:
        user_db.close()
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")

    # Update full_name, picture_url
    if data.full_name is not None or data.picture_url is not None:
        user_db.update_user_info(db_user["id"], full_name=data.full_name, picture_url=data.picture_url)

    # Update password
    if data.new_password:
        # If user has current password, must verify it
        if db_user.get("password"):
            if not data.current_password or not verify_password(data.current_password, db_user["password"]):
                user_db.close()
                raise HTTPException(status_code=400, detail="Mật khẩu hiện tại không chính xác")

        hashed = get_password_hash(data.new_password)
        user_db.update_user_password(db_user["id"], hashed)

    user_db.close()
    return {"message": "Cập nhật hồ sơ thành công"}

@router.get("/check")
def check_login(user=Depends(get_current_user)):
    user_db = UserDB()
    db_user = user_db.get_by_email(user["email"])
    user_db.close()

    if db_user is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")

    return {
        "message": "✅ Token hợp lệ, người dùng đang đăng nhập!",
        "user": {
            **user,
            "role": "ADMIN" if user.get("is_admin") else "USER",
            "token_balance": db_user["token_balance"]
        },
    }

@router.delete("/account")
def delete_own_account(user=Depends(get_current_user)):
    user_db = UserDB()
    db_user = user_db.get_by_email(user["email"])
    if not db_user:
        user_db.close()
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")

    if db_user.get("is_admin"):
        user_db.close()
        raise HTTPException(status_code=400, detail="Không thể xóa tài khoản Admin")

    user_db.delete_user(db_user["id"])
    user_db.close()
    return {"message": "Tài khoản và toàn bộ dữ liệu của bạn đã được xóa thành công"}
