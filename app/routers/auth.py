import httpx
from fastapi import APIRouter, HTTPException, Form, Depends, Query, Request
from datetime import datetime, timedelta, timezone
from jose import jwt  # type: ignore
from app.config import settings
from app.models.base_db import UserDB
from app.security.security import get_current_user
from pydantic import BaseModel
from typing import Optional
import bcrypt


import logging

router = APIRouter(prefix="/auth", tags=["auth"])
logger = logging.getLogger(__name__)

def get_google_redirect_uri(request: Request):
    """
    Tự động xác định redirect_uri dựa trên domain đang truy cập.
    """
    scheme = request.headers.get("x-forwarded-proto", request.url.scheme)
    host = request.headers.get("host", "localhost:2643")
    
    is_localhost = any(x in host for x in ["localhost", "127.0.0.1", "192.168."])

    if is_localhost:
        redirect_uri = f"http://{host}/api/v1/auth/google/callback"
        logger.info(f"Dynamic Redirect URI (Localhost): {redirect_uri}")
        return redirect_uri

    # 1. Kiểm tra nếu có cấu hình ghi đè từ .env (cho Production cố định)
    if settings.GOOGLE_REDIRECT_URI and "trycloudflare" not in settings.GOOGLE_REDIRECT_URI:
        logger.info(f"Using fixed Redirect URI from .env: {settings.GOOGLE_REDIRECT_URI}")
        return settings.GOOGLE_REDIRECT_URI

    # 2. Trường hợp Tunnel hoặc Server
    base_url = f"{scheme}://{host}"
    redirect_uri = f"{base_url}/api/v1/auth/google/callback"
    logger.info(f"Dynamic Redirect URI detected: {redirect_uri}")
    return redirect_uri

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


@router.post("/register")
def register(username: str = Form(...), password: str = Form(...), email: str = Form(...)):
    user_db = UserDB()
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
            "token_balance": user.get("token_balance", 0)
        }
    }


@router.get("/google/login")
async def google_login(request: Request):
    redirect_uri = get_google_redirect_uri(request)
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "consent"
    }
    query_string = "&".join([f"{k}={v}" for k, v in params.items()])
    return {"auth_url": f"https://accounts.google.com/o/oauth2/v2/auth?{query_string}"}


@router.get("/google/callback")
async def google_callback(request: Request, code: str = Query(...)):
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
            raise HTTPException(status_code=400, detail="Lỗi xác thực Google (Token Exchange)")
        
        token_data = resp.json()
        access_token = token_data.get("access_token")

        # 2. Lấy thông tin user (email, name) từ Google
        user_info_url = "https://www.googleapis.com/oauth2/v3/userinfo"
        headers = {"Authorization": f"Bearer {access_token}"}
        user_resp = await client.get(user_info_url, headers=headers)
        if user_resp.status_code != 200:
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
            "token_balance": db_user["token_balance"]
        },
    }
