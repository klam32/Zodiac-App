from fastapi import APIRouter, HTTPException, Depends, Body, File, UploadFile
from app.models.base_db import UserDB
from app.security.security import get_current_admin
from pydantic import BaseModel
from typing import List, Optional
import os
import shutil
from uuid import uuid4
from app.config import settings
from datetime import datetime

router = APIRouter(prefix="/admin", tags=["Admin"])
public_settings_router = APIRouter(prefix="/settings", tags=["Public Settings"])

class UserUpdate(BaseModel):
    token_balance: float

class UserBalanceAdjust(BaseModel):
    type: str # 'in' or 'out'
    amount: float

class UpdateUserAdmin(BaseModel):
    full_name: Optional[str] = None
    password: Optional[str] = None
    token_balance: Optional[float] = None
    is_admin: Optional[int] = None # 0 or 1

class PackageCreate(BaseModel):
    name: str
    tokens: int
    amount_vnd: int

ALL_SETTINGS_DEFAULTS = {
    # System & SEO
    "rate_per_1000": "1.0",
    "logo_url": "",
    "background_url": "",
    "site_title": "Zodiac Whisper",
    "seo_description": "Zodiac Whisper - Chiêm tinh AI hàng đầu",
    "seo_keywords": "chiem tinh, ai, zodiac, horoscope, ban do sao",
    "seo_author": "Zodiac Whisper Team",
    "favicon_url": "/favicon.svg",
    "no_answer_fallback": "Rất tiếc, các lá bài hiện chưa cho thấy câu trả lời rõ ràng cho vấn đề này. Hãy thử hít thở sâu và đặt câu hỏi theo một cách khác để vũ trụ có thể dẫn lối cho bạn tốt hơn.",
    
    # Hero Section
    "hero_title": "Khai mở vận mệnh cùng AI",
    "hero_highlight_text": "AI hàng đầu",
    "hero_subtitle": "Khám phá bản đồ sao cá nhân để thấu hiểu vận mệnh của chính mình.",
    "hero_primary_button_text": "Tạo bản đồ sao",
    "hero_secondary_button_text": "Tìm hiểu thêm",
    "hero_background_url": "",
    "hero_chart_image_url": "",

    # Stats Section
    "stat_users_label": "NGƯỜI DÙNG TIN TƯỞNG",
    "stat_users_value": "500.000+",
    "stat_charts_label": "BẢN ĐỒ SAO ĐƯỢC TẠO",
    "stat_charts_value": "1.000.000+",
    "stat_accuracy_label": "ĐỘ CHÍNH XÁC AI",
    "stat_accuracy_value": "99.8%",
    "stat_support_label": "HỖ TRỢ CHIÊM TINH",
    "stat_support_value": "24/7",

    # Intro Section
    "intro_label": "VỀ ZODIAC WHISPER",
    "intro_title": "Nền tảng Chiêm tinh AI hàng đầu",
    "intro_content": "Zodiac Whisper là hệ sinh thái công nghệ kết hợp giữa chiêm tinh học cổ truyền và trí tuệ nhân tạo hiện đại để mang lại những luận giải bản đồ sao cá nhân hóa sâu sắc nhất.",

    # Video Guide Section
    "guide_video_label": "VIDEO HƯỚNG DẪN",
    "guide_video_title": "Hướng dẫn sử dụng Zodiac Whisper",
    "guide_video_subtitle": "Xem video ngắn để biết cách tạo bản đồ sao và trò chuyện với AI chuyên gia.",
    "guide_video_url": "/videos/zodiac-whisper-guide.mp4",
    "guide_video_poster_url": "",
    "guide_video_enabled": "true",

    # Choice Section
    "choice_window_title": "Zodiac Whisper",
    "choice_title": "Bạn muốn xem điều gì?",
    "choice_subtitle": "Hãy chọn một trong những dịch vụ chiêm tinh AI đặc sắc dưới đây để bắt đầu hành trình khám phá bản thân.",
    "choice_button_text": "Trò chuyện ngay",
    "choice_option_1_title": "Bản đồ sao cá nhân",
    "choice_option_1_description": "Giải mã tính cách, xu hướng cuộc đời và các tiềm năng ẩn giấu qua vị trí các hành tinh lúc bạn sinh ra.",
    "choice_option_2_title": "Độ hợp nhau cặp đôi",
    "choice_option_2_description": "So sánh bản đồ sao đôi (synastry) để thấy mức độ hòa hợp, thử thách và cơ hội trong mối quan hệ.",
    "choice_option_3_title": "Dự đoán vận hạn ngày/tháng",
    "choice_option_3_description": "Cập nhật các góc chiếu hành tinh hiện tại để định hướng hành động tốt nhất cho hôm nay.",

    # About Section
    "about_label": "VỀ CHÚNG TÔI",
    "about_title": "Zodiac Whisper, hệ thống chuyên gia chiêm tinh AI thấu hiểu vận mệnh",
    "about_company_name": "CÔNG TY TNHH MỘT THÀNH VIÊN CÔNG NGHỆ KỸ THUẬT TIÊN PHONG",
    "about_content": "Chuyên cung cấp giải pháp công nghệ kỹ thuật cao và xuất nhập khẩu các mặt hàng công nghệ tiên tiến.",
    "about_address": "P16, Đường số 8, KDC lô 49, Khu đô thị Nam Cần Thơ, Phường Cái Răng, TP. Cần Thơ",
    "about_hotline": "0916 416 409",
    "about_working_time": "05/04/2017",
    "company_name": "CÔNG TY TNHH MỘT THÀNH VIÊN CÔNG NGHỆ KỸ THUẬT TIÊN PHONG",
    "company_description": "Chuyên cung cấp giải pháp công nghệ kỹ thuật cao và xuất nhập khẩu các mặt hàng công nghệ tiên tiến.",
    "company_address": "P16, Đường số 8, KDC lô 49, Khu đô thị Nam Cần Thơ, Phường Cái Răng, TP. Cần Thơ",
    "company_hotline": "0916 416 409",
    "company_active_date": "05/04/2017",

    # Blog Section
    "blog_section_title": "Bài viết mới nhất",
    "blog_section_enabled": "true",

    # Footer
    "footer_description": "Hệ thống chuyên gia chiêm tinh AI thấu hiểu vận mệnh và định hướng tương lai cho bạn.",
    "footer_column_1_title": "DỊCH VỤ",
    "footer_column_2_title": "LIÊN KẾT CHÍNH",
    "footer_column_3_title": "THÔNG TIN LIÊN HỆ",
    "footer_address": "Khu Công nghệ cao, Quận 9, TP. Hồ Chí Minh",
    "footer_hotline": "1900-123-456",
    "footer_working_time": "8:00 - 18:00 (Thứ 2 - Thứ 6)",
    "footer_copyright": "© 2026 Zodiac Whisper. All rights reserved."
}

LOCALIZABLE_KEYS = [
    "site_title", "seo_description", "seo_keywords", "seo_author", "no_answer_fallback",
    "hero_title", "hero_highlight_text", "hero_subtitle", "hero_primary_button_text", "hero_secondary_button_text",
    "stat_users_label", "stat_charts_label", "stat_accuracy_label", "stat_support_label",
    "intro_label", "intro_title", "intro_content",
    "guide_video_label", "guide_video_title", "guide_video_subtitle",
    "choice_window_title", "choice_title", "choice_subtitle", "choice_button_text",
    "choice_option_1_title", "choice_option_1_description",
    "choice_option_2_title", "choice_option_2_description",
    "choice_option_3_title", "choice_option_3_description",
    "about_label", "about_title", "about_company_name", "about_content", "about_address", "about_working_time",
    "company_name", "company_description", "company_address", "company_active_date",
    "blog_section_title",
    "footer_description", "footer_column_1_title", "footer_column_2_title", "footer_column_3_title",
    "footer_address", "footer_working_time", "footer_copyright"
]

ENGLISH_DEFAULTS = {
    "site_title": "Zodiac Whisper",
    "seo_description": "Zodiac Whisper - Leading Astrology AI",
    "seo_keywords": "astrology, ai, zodiac, horoscope, birth chart",
    "seo_author": "Zodiac Whisper Team",
    "no_answer_fallback": "Unfortunately, the cards do not show a clear answer to this issue yet. Please take a deep breath and ask your question in a different way so that the universe can guide you better.",
    "hero_title": "Unlock Your Destiny with AI",
    "hero_highlight_text": "Leading AI",
    "hero_subtitle": "Discover your personal birth chart to understand your own destiny.",
    "hero_primary_button_text": "Create Birth Chart",
    "hero_secondary_button_text": "Learn More",
    "stat_users_label": "TRUSTED USERS",
    "stat_charts_label": "CHARTS CREATED",
    "stat_accuracy_label": "AI ACCURACY",
    "stat_support_label": "ASTROLOGY SUPPORT",
    "intro_label": "ABOUT ZODIAC WHISPER",
    "intro_title": "Leading AI Astrology Platform",
    "intro_content": "Zodiac Whisper is a technology ecosystem combining traditional astrology and modern artificial intelligence to deliver the most personalized birth chart interpretations.",
    "guide_video_label": "VIDEO GUIDE",
    "guide_video_title": "How to Use Zodiac Whisper",
    "guide_video_subtitle": "Watch a short video to learn how to create your birth chart and chat with our AI experts.",
    "choice_window_title": "Zodiac Whisper",
    "choice_title": "What do you want to see?",
    "choice_subtitle": "Select one of our special AI astrology services below to begin your self-discovery journey.",
    "choice_button_text": "Chat Now",
    "choice_option_1_title": "Personal Birth Chart",
    "choice_option_1_description": "Decode personality, life trends, and hidden potentials through planetary positions at your birth.",
    "choice_option_2_title": "Couple Compatibility",
    "choice_option_2_description": "Compare birth charts (synastry) to see compatibility levels, challenges, and opportunities in relationships.",
    "choice_option_3_title": "Daily/Monthly Prediction",
    "choice_option_3_description": "Update current planetary transits to guide your actions best for today.",
    "about_label": "ABOUT US",
    "about_title": "Zodiac Whisper, AI astrology expert system understanding destiny",
    "about_company_name": "PIONEER ENGINEERING TECHNOLOGY ONE MEMBER COMPANY LIMITED",
    "about_content": "Specializing in high-tech solutions and importing/exporting advanced technology products.",
    "about_address": "P16, Street 8, Block 49, Nam Can Tho Urban Area, Cai Rang Ward, Can Tho City",
    "company_name": "PIONEER ENGINEERING TECHNOLOGY ONE MEMBER COMPANY LIMITED",
    "company_description": "Specializing in high-tech solutions and importing/exporting advanced technology products.",
    "company_address": "P16, Street 8, Block 49, Nam Can Tho Urban Area, Cai Rang Ward, Can Tho City",
    "blog_section_title": "Latest Posts",
    "footer_description": "AI astrology expert system understanding destiny and guiding your future.",
    "footer_column_1_title": "SERVICES",
    "footer_column_2_title": "QUICK LINKS",
    "footer_column_3_title": "CONTACT INFO",
    "footer_address": "High-Tech Park, District 9, Ho Chi Minh City",
    "footer_working_time": "8:00 AM - 6:00 PM (Monday - Friday)",
    "footer_copyright": "© 2026 Zodiac Whisper. All rights reserved."
}

# Dynamically populate the defaults dictionary with localized versions
for key in LOCALIZABLE_KEYS:
    default_val = ALL_SETTINGS_DEFAULTS.get(key, "")
    ALL_SETTINGS_DEFAULTS[f"{key}_vi"] = default_val
    ALL_SETTINGS_DEFAULTS[f"{key}_en"] = ENGLISH_DEFAULTS.get(key, default_val)

class SettingsUpdate(BaseModel):
    model_config = {
        "extra": "allow"
    }


    rate_per_1000: Optional[float] = None
    logo_url: Optional[str] = None
    background_url: Optional[str] = None
    site_title: Optional[str] = None
    seo_description: Optional[str] = None
    seo_keywords: Optional[str] = None
    seo_author: Optional[str] = None
    favicon_url: Optional[str] = None
    no_answer_fallback: Optional[str] = None
    
    # Hero Section
    hero_title: Optional[str] = None
    hero_highlight_text: Optional[str] = None
    hero_subtitle: Optional[str] = None
    hero_primary_button_text: Optional[str] = None
    hero_secondary_button_text: Optional[str] = None
    hero_background_url: Optional[str] = None
    hero_chart_image_url: Optional[str] = None

    # Stats Section
    stat_users_label: Optional[str] = None
    stat_users_value: Optional[str] = None
    stat_charts_label: Optional[str] = None
    stat_charts_value: Optional[str] = None
    stat_accuracy_label: Optional[str] = None
    stat_accuracy_value: Optional[str] = None
    stat_support_label: Optional[str] = None
    stat_support_value: Optional[str] = None

    # Intro Section
    intro_label: Optional[str] = None
    intro_title: Optional[str] = None
    intro_content: Optional[str] = None

    # Video Guide Section
    guide_video_label: Optional[str] = None
    guide_video_title: Optional[str] = None
    guide_video_subtitle: Optional[str] = None
    guide_video_url: Optional[str] = None
    guide_video_poster_url: Optional[str] = None
    guide_video_enabled: Optional[str] = None

    # Choice Section
    choice_window_title: Optional[str] = None
    choice_title: Optional[str] = None
    choice_subtitle: Optional[str] = None
    choice_button_text: Optional[str] = None
    choice_option_1_title: Optional[str] = None
    choice_option_1_description: Optional[str] = None
    choice_option_2_title: Optional[str] = None
    choice_option_2_description: Optional[str] = None
    choice_option_3_title: Optional[str] = None
    choice_option_3_description: Optional[str] = None

    # About Section
    about_label: Optional[str] = None
    about_title: Optional[str] = None
    about_company_name: Optional[str] = None
    about_content: Optional[str] = None
    about_address: Optional[str] = None
    about_hotline: Optional[str] = None
    about_working_time: Optional[str] = None
    company_name: Optional[str] = None
    company_description: Optional[str] = None
    company_address: Optional[str] = None
    company_hotline: Optional[str] = None
    company_active_date: Optional[str] = None

    # Blog Section
    blog_section_title: Optional[str] = None
    blog_section_enabled: Optional[str] = None

    # Footer
    footer_description: Optional[str] = None
    footer_column_1_title: Optional[str] = None
    footer_column_2_title: Optional[str] = None
    footer_column_3_title: Optional[str] = None
    footer_address: Optional[str] = None
    footer_hotline: Optional[str] = None
    footer_working_time: Optional[str] = None
    footer_copyright: Optional[str] = None

class BlogPostCreate(BaseModel):
    title: str
    excerpt: str
    content: str
    image_url: str
    slug: str

class BlogPostUpdate(BaseModel):
    title: Optional[str] = None
    excerpt: Optional[str] = None
    content: Optional[str] = None
    image_url: Optional[str] = None
    slug: Optional[str] = None

def update_index_html_seo(site_title: str, description: str, keywords: str, author: str, favicon_url: str, logo_url: str):
    import re
    index_path = os.path.join(settings.DIR_ROOT, "frontend", "index.html")
    if not os.path.exists(index_path):
        return

    with open(index_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    original_content = content

    # Helper to update meta tag by name or property
    def update_meta(html_content, key, value, is_property=False):
        attr_name = "property" if is_property else "name"
        # Match <meta ... attr="key" ... content="..." ...> or vice versa
        # We replace the whole tag to ensure consistency
        pattern = fr'<meta\s+[^>]*?{attr_name}=["\']{re.escape(key)}["\'][^>]*?>'
        new_tag = f'<meta {attr_name}="{key}" content="{value}">'
        
        if re.search(pattern, html_content, re.IGNORECASE | re.DOTALL):
            return re.sub(pattern, new_tag, html_content, flags=re.IGNORECASE | re.DOTALL)
        else:
            # If not found, insert before </head>
            return html_content.replace("</head>", f"    {new_tag}\n</head>")

    # Update Title
    content = re.sub(r"<title>.*?</title>", f"<title>{site_title}</title>", content, flags=re.IGNORECASE | re.DOTALL)
    
    # Update Meta Tags
    content = update_meta(content, "description", description)
    content = update_meta(content, "keywords", keywords)
    content = update_meta(content, "author", author)
    content = update_meta(content, "og:title", site_title, True)
    content = update_meta(content, "og:description", description, True)
    content = update_meta(content, "twitter:title", site_title)
    content = update_meta(content, "twitter:description", description)
    
    if logo_url:
        content = update_meta(content, "og:image", logo_url, True)
        content = update_meta(content, "twitter:image", logo_url)

    # Update Favicon
    favicon_pattern = r'<link\s+[^>]*?rel=["\']icon["\'][^>]*?>'
    new_favicon_tag = f'<link rel="icon" href="{favicon_url}">'
    if re.search(favicon_pattern, content, re.IGNORECASE | re.DOTALL):
        content = re.sub(favicon_pattern, new_favicon_tag, content, flags=re.IGNORECASE | re.DOTALL)
    else:
        content = content.replace("</head>", f"    {new_favicon_tag}\n</head>")

    if content != original_content:
        with open(index_path, "w", encoding="utf-8") as f:
            f.write(content)

def extract_seo_from_index_html():
    import re
    index_path = os.path.join(settings.DIR_ROOT, "frontend", "index.html")
    if not os.path.exists(index_path):
        return {}

    try:
        with open(index_path, "r", encoding="utf-8") as f:
            content = f.read()

        res = {}
        # Title
        title_match = re.search(r"<title>(.*?)</title>", content, re.IGNORECASE | re.DOTALL)
        if title_match:
            res['site_title'] = title_match.group(1).strip()
            
        # Parse all meta tags
        meta_matches = re.findall(r'<meta\s+(.*?)>', content, re.IGNORECASE | re.DOTALL)
        for attrs in meta_matches:
            # Check for name="description"
            if re.search(r'name=["\']description["\']', attrs, re.IGNORECASE):
                c_match = re.search(r'content=["\'](.*?)["\']', attrs, re.IGNORECASE | re.DOTALL)
                if c_match: res['seo_description'] = c_match.group(1).strip()
            
            # Check for name="keywords"
            if re.search(r'name=["\']keywords["\']', attrs, re.IGNORECASE):
                c_match = re.search(r'content=["\'](.*?)["\']', attrs, re.IGNORECASE | re.DOTALL)
                if c_match: res['seo_keywords'] = c_match.group(1).strip()

            # Check for name="author"
            if re.search(r'name=["\']author["\']', attrs, re.IGNORECASE):
                c_match = re.search(r'content=["\'](.*?)["\']', attrs, re.IGNORECASE | re.DOTALL)
                if c_match: res['seo_author'] = c_match.group(1).strip()
                
        # Favicon
        favicon_match = re.search(r'<link\s+[^>]*?rel=["\']icon["\'][^>]*?href=["\'](.*?)["\']', content, re.IGNORECASE | re.DOTALL)
        if favicon_match:
            res['favicon_url'] = favicon_match.group(1).strip()
            
        return res
    except Exception as e:
        return {}

@router.get("/users")
async def get_all_users(admin: dict = Depends(get_current_admin)):
    db = UserDB()
    users = db.get_all()
    db.close()
    return {"users": users}

@router.post("/users/{user_id}/balance")
async def update_user_balance(
    user_id: int, 
    data: dict = Body(...), 
    admin: dict = Depends(get_current_admin)
):
    db = UserDB()
    user = next((u for u in db.get_all() if u['id'] == user_id), None)
    if not user:
        db.close()
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
    
    admin_note = data.get("admin_note", "")
    amount = 0.0
    tx_type = "in"

    # Check if it's incremental adjustment or absolute set
    if "type" in data and "amount" in data:
        # Incremental
        tx_type = data["type"]
        amount = float(data["amount"])
        action_text = "Cộng số dư" if tx_type == "in" else "Trừ số dư"
        description = f"Hệ thống: {action_text} {amount:.2f} tokens (Admin {admin['username']} điều chỉnh)"
        if admin_note:
            description += f" - Ghi chú: {admin_note}"
            
        db.change_token_balance(
            user_id=user_id,
            amount=amount,
            description=description,
            tx_type=tx_type
        )
        new_balance = user['token_balance'] + (amount if tx_type == 'in' else -amount)
    else:
        # Absolute set (backward compatibility or direct set)
        target_balance = float(data.get("token_balance", 0))
        diff = target_balance - user['token_balance']
        amount = abs(diff)
        tx_type = "in" if diff > 0 else "out"
        if diff != 0:
            action_text = "Cộng số dư" if diff > 0 else "Trừ số dư"
            description = f"Hệ thống: {action_text} {abs(diff):.2f} tokens (Admin {admin['username']} điều chỉnh)"
            if admin_note:
                description += f" - Ghi chú: {admin_note}"
                
            db.change_token_balance(
                user_id=user_id,
                amount=abs(diff),
                description=description,
                tx_type=tx_type
            )
        new_balance = target_balance
    
    db.close()

    # Send email notification to user
    if amount > 0:
        try:
            from app.services.email_service import send_token_adjustment_email
            send_token_adjustment_email(
                user=user,
                adjustment_type=tx_type,
                token_amount=amount,
                new_balance=new_balance,
                admin_name=admin.get("username", "Admin"),
                note=admin_note
            )
        except Exception as email_err:
            print(f"[Email] Failed to send token adjustment email: {email_err}")

    return {"message": "Cập nhật số dư thành công", "new_balance": new_balance}

@router.delete("/users/{user_id}")
async def delete_user(user_id: int, admin: dict = Depends(get_current_admin)):
    db = UserDB()
    # PREVENT DELETING ADMINS
    db.cursor.execute("SELECT is_admin FROM users WHERE id = %s", (user_id,))
    row = db.cursor.fetchone()
    if row and row['is_admin']:
        db.close()
        raise HTTPException(status_code=400, detail="Không thể xóa tài khoản Admin")
        
    db.delete_user(user_id)
    db.close()
    return {"message": "Đã xóa người dùng thành công"}

@router.put("/users/{user_id}")
async def update_user_by_admin(
    user_id: int, 
    data: UpdateUserAdmin, 
    admin: dict = Depends(get_current_admin)
):
    from app.routers.auth import get_password_hash
    db = UserDB()
    
    # Update Full Name
    if data.full_name is not None:
        db.update_user_info(user_id, full_name=data.full_name)
    
    # Update Admin Status
    if data.is_admin is not None:
        db.update_user_info(user_id, is_admin=data.is_admin)
    
    # Update Password
    if data.password:
        hashed = get_password_hash(data.password)
        db.update_user_password(user_id, hashed)
        
    # Update Balance (reuse logic from existing post endpoint if needed, or just direct)
    if data.token_balance is not None:
        db.cursor.execute("SELECT token_balance FROM users WHERE id = %s", (user_id,))
        row = db.cursor.fetchone()
        if row:
            diff = data.token_balance - row['token_balance']
            if diff != 0:
                action_text = "Cộng số dư" if diff > 0 else "Trừ số dư"
                db.change_token_balance(
                    user_id=user_id,
                    amount=abs(diff),
                    description=f"Hệ thống: {action_text} {abs(diff):.2f} tokens (Admin {admin['username']} điều chỉnh)",
                    tx_type="in" if diff > 0 else "out"
                )
    
    db.close()
    return {"message": "Cập nhật người dùng thành công"}

@router.get("/users/{user_id}")
async def get_user_detail(user_id: int, admin: dict = Depends(get_current_admin)):
    db = UserDB()
    # Get user info
    db.cursor.execute("SELECT * FROM users WHERE id = %s", [user_id])
    row = db.cursor.fetchone()
    if not row:
        db.close()
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
    
    user = dict(row)
    # Remove sensitive data
    user.pop('password', None)
    
    # Get stats
    history = db.get_token_history(user_id)
    logs = db.get_user_chat_logs(user_id)
    
    db.close()
    return {
        "user": user,
        "token_history": history,
        "chat_logs": logs
    }

@router.get("/packages")
async def get_all_packages(admin: dict = Depends(get_current_admin)):
    db = UserDB()
    packages = db.get_packages()
    db.close()
    return {"packages": packages}

@router.post("/packages")
async def create_package(data: PackageCreate, admin: dict = Depends(get_current_admin)):
    db = UserDB()
    db.add_package(data.name, data.tokens, data.amount_vnd)
    db.close()
    return {"message": "Tạo gói nạp thành công"}

@router.delete("/packages/{package_id}")
async def delete_package(package_id: int, admin: dict = Depends(get_current_admin)):
    db = UserDB()
    db.delete_package(package_id)
    db.close()
    return {"message": "Đã xóa gói nạp thành công"}

@router.put("/packages/{package_id}")
async def update_package(package_id: int, data: PackageCreate, admin: dict = Depends(get_current_admin)):
    db = UserDB()
    db.update_package(package_id, data.name, data.tokens, data.amount_vnd)
    db.close()
    return {"message": "Cập nhật gói nạp thành công"}

@router.get("/token-history")
async def get_all_token_history(admin: dict = Depends(get_current_admin)):
    db = UserDB()
    history = db.get_all_token_history()
    db.close()
    return {"history": history}

@router.get("/payments")
async def get_all_payments(admin: dict = Depends(get_current_admin)):
    db = UserDB()
    payments = db.get_all_payments()
    db.close()
    return {"payments": payments}

@router.get("/chat-logs")
async def get_all_chat_logs(admin: dict = Depends(get_current_admin)):
    db = UserDB()
    logs = db.get_all_chat_logs()
    db.close()
    return {"logs": logs}

@router.get("/settings")
async def get_all_settings(admin: dict = Depends(get_current_admin)):
    db = UserDB()
    html_seo = extract_seo_from_index_html()
    
    res = {}
    for key, default in ALL_SETTINGS_DEFAULTS.items():
        if key in ["site_title", "seo_description", "seo_keywords", "seo_author", "favicon_url"] and key in html_seo:
            res[key] = db.get_setting(key, html_seo[key])
        else:
            res[key] = db.get_setting(key, default)
            
    # For rate_per_1000, parse as float
    try:
        val = res.get("rate_per_1000")
        res["rate_per_1000"] = float(val) if val is not None else 1.0
    except:
        res["rate_per_1000"] = 1.0
        
    db.close()
    return res

@router.post("/settings")
@router.patch("/settings")
async def update_settings(
    data: SettingsUpdate, 
    admin: dict = Depends(get_current_admin)
):
    db = UserDB()
    changed_any = False
    seo_changed = False

    fields_dict = data.model_dump()
    if hasattr(data, "model_extra") and data.model_extra:
        fields_dict.update(data.model_extra)
    fields = [(k, v) for k, v in fields_dict.items() if v is not None]

    for key, new_val in fields:
        current_val = db.get_setting(key, "") or ""
        # Special case for rate_per_1000 as it's a float stored as string
        if key == "rate_per_1000":
            try:
                if float(current_val or "0.0") != float(new_val):
                    db.set_setting(key, str(new_val))
                    changed_any = True
            except:
                db.set_setting(key, str(new_val))
                changed_any = True
        elif str(current_val) != str(new_val):
            db.set_setting(key, str(new_val))
            changed_any = True
            if key in ["site_title", "seo_description", "seo_keywords", "seo_author", "favicon_url", "logo_url"]:
                seo_changed = True

    if seo_changed:
        current_title = db.get_setting("site_title", "Zodiac Whisper") or "Zodiac Whisper"
        current_desc = db.get_setting("seo_description", "") or ""
        current_keys = db.get_setting("seo_keywords", "") or ""
        current_author = db.get_setting("seo_author", "") or ""
        current_favicon = db.get_setting("favicon_url", "/favicon.svg") or "/favicon.svg"
        current_logo = db.get_setting("logo_url", "") or ""
        update_index_html_seo(current_title, current_desc, current_keys, current_author, current_favicon, current_logo)
    
    db.close()
    return {"message": "Cập nhật cấu hình thành công", "changed": changed_any}

@public_settings_router.get("/public")
async def get_public_settings():
    db = UserDB()
    res = {}
    for key, default in ALL_SETTINGS_DEFAULTS.items():
        if key == "rate_per_1000":
            continue
        res[key] = db.get_setting(key, default)
    db.close()
    return res

@router.post("/upload-logo")
async def upload_logo(
    file: UploadFile = File(...),
    admin: dict = Depends(get_current_admin)
):
    try:
        # Ngăn chặn Path Traversal
        safe_filename = os.path.basename(file.filename or "file")
        file_extension = os.path.splitext(safe_filename)[1]
        unique_filename = f"logo_{uuid4().hex}{file_extension}"
        
        folder_path = os.path.join(settings.DIR_ROOT, "utils", "download")
        os.makedirs(folder_path, exist_ok=True)
        file_path = os.path.join(folder_path, unique_filename)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Trả về URL xem file (re-use /upload-file router logic)
        view_url = f"/api/v1/upload-file/view/{unique_filename}"
        
        return {"logo_url": view_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi tải lên logo: {str(e)}")

@router.post("/upload-blog-image")
async def upload_blog_image(
    file: UploadFile = File(...),
    admin: dict = Depends(get_current_admin)
):
    try:
        safe_filename = os.path.basename(file.filename or "file")
        file_extension = os.path.splitext(safe_filename)[1]
        unique_filename = f"blog_{uuid4().hex}{file_extension}"
        
        folder_path = os.path.join(settings.DIR_ROOT, "utils", "download")
        os.makedirs(folder_path, exist_ok=True)
        file_path = os.path.join(folder_path, unique_filename)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        view_url = f"/api/v1/upload-file/view/{unique_filename}"
        return {"image_url": view_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/active-users")
async def get_active_users(limit: int = 50, admin: dict = Depends(get_current_admin)):
    db = UserDB()
    logins = db.get_recent_logins(limit)
    db.close()
    return {"logins": logins}

@router.get("/payment-reports")
async def get_payment_reports(admin: dict = Depends(get_current_admin)):
    db = UserDB()
    reports = db.get_all_payment_reports()
    db.close()
    return {"reports": reports}

class ResolveReportData(BaseModel):
    status: str
    token_amount: Optional[float] = 0.0
    adjustment_type: Optional[str] = 'none'
    admin_note: Optional[str] = ""

@router.patch("/payment-reports/{report_id}")
async def resolve_payment_report(
    report_id: int,
    data: ResolveReportData,
    admin: dict = Depends(get_current_admin)
):
    db = UserDB()
    report = db.get_payment_report(report_id)
    if not report:
        db.close()
        raise HTTPException(status_code=404, detail="Không tìm thấy báo cáo thanh toán")
        
    print(f"[Report] Resolving report_id={report_id}")
    status = data.status
    if status == 'rejected':
        status = 'ignored'
        
    admin_note = data.admin_note or ""
    
    db.update_payment_report_status(report_id, status, admin_note)
    
    db.cursor.execute("SELECT * FROM users WHERE id = %s", (report['user_id'],))
    user = db.cursor.fetchone()
    if not user:
        db.close()
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng sở hữu báo cáo này")
        
    token_amount = data.token_amount or 0.0
    adjustment_type = data.adjustment_type or 'none'
    new_balance = user['token_balance']
    
    if status == 'resolved' and adjustment_type in ['in', 'out'] and token_amount > 0:
        action_text = "Cộng số dư" if adjustment_type == "in" else "Trừ số dư"
        description = f"Duyệt báo cáo #{report_id}: {action_text} {token_amount:.2f} tokens (Admin {admin['username']})"
        if admin_note:
            description += f" - Ghi chú: {admin_note}"
            
        db.change_token_balance(
            user_id=report['user_id'],
            amount=token_amount,
            description=description,
            tx_type=adjustment_type
        )
        new_balance = user['token_balance'] + (token_amount if adjustment_type == 'in' else -token_amount)
        
        # Get updated user info
        db.cursor.execute("SELECT * FROM users WHERE id = %s", (report['user_id'],))
        user = db.cursor.fetchone()
        
    db.close()
    
    user_email = (user.get('email') if user else None) or report.get('email')
    print(f"[Report] User email={user_email}")
    
    # Send email notification to user
    email_warning = None
    try:
        from app.services.email_service import send_payment_report_user_result_email
        result_data = {
            "status": status,
            "adjustment_type": adjustment_type if status == 'resolved' else 'none',
            "token_amount": token_amount if status == 'resolved' else 0.0,
            "new_balance": new_balance,
            "admin_note": admin_note
        }
        success = send_payment_report_user_result_email(
            report=report,
            user=dict(user) if user else {},
            result_data=result_data
        )
        if not success:
            email_warning = "Đã xử lý báo cáo nhưng gửi email thông báo thất bại."
    except Exception as email_err:
        print(f"[Email] Failed to send user result email: {email_err}")
        email_warning = f"Đã xử lý báo cáo nhưng gửi email thông báo thất bại: {email_err}"
        
    response_data = {"message": "Đã xử lý báo cáo thanh toán thành công", "new_balance": new_balance}
    if email_warning:
        response_data["warning"] = email_warning
        
    return response_data

class AdminResolveReportData(BaseModel):
    action: str  # "approve" or "reject"
    adjustment_type: Optional[str] = "none"  # "add", "subtract", "none"
    token_amount: Optional[float] = 0.0
    admin_note: Optional[str] = ""

@router.patch("/payment-reports/{report_id}/resolve")
async def admin_resolve_payment_report_v2(
    report_id: int,
    data: AdminResolveReportData,
    admin: dict = Depends(get_current_admin)
):
    print(f"[Report] Resolving report_id={report_id}")
    db = UserDB()
    report = db.get_payment_report(report_id)
    if not report:
        db.close()
        raise HTTPException(status_code=404, detail="Không tìm thấy báo cáo thanh toán")

    # Map parameters
    action = data.action
    adjustment_type_input = data.adjustment_type or "none"
    token_amount = data.token_amount or 0.0
    admin_note = data.admin_note or ""

    status = "resolved" if action == "approve" else "rejected"
    db_adjustment_type = "none"
    if status == "resolved":
        if adjustment_type_input == "add":
            db_adjustment_type = "in"
        elif adjustment_type_input == "subtract":
            db_adjustment_type = "out"

    # Save to DB
    resolved_at = datetime.now()
    db.update_payment_report_status(
        report_id=report_id,
        status=status,
        admin_note=admin_note,
        adjustment_type=db_adjustment_type,
        token_amount=token_amount,
        resolved_at=resolved_at
    )

    # Get user to modify tokens
    db.cursor.execute("SELECT * FROM users WHERE id = %s", (report['user_id'],))
    user = db.cursor.fetchone()
    if not user:
        db.close()
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng sở hữu báo cáo này")

    new_balance = user['token_balance']

    if status == 'resolved' and db_adjustment_type in ['in', 'out'] and token_amount > 0:
        action_text = "Cộng số dư" if db_adjustment_type == "in" else "Trừ số dư"
        description = f"Duyệt báo cáo {report['report_code'] or f'#{report_id}'}: {action_text} {token_amount:.2f} tokens (Admin {admin['username']})"
        if admin_note:
            description += f" - Ghi chú: {admin_note}"

        db.change_token_balance(
            user_id=report['user_id'],
            amount=token_amount,
            description=description,
            tx_type=db_adjustment_type
        )
        # Fetch updated balance
        db.cursor.execute("SELECT token_balance FROM users WHERE id = %s", (report['user_id'],))
        user_balance_res = db.cursor.fetchone()
        new_balance = user_balance_res['token_balance'] if user_balance_res else user['token_balance']

    # Get updated user info
    db.cursor.execute("SELECT * FROM users WHERE id = %s", (report['user_id'],))
    user = db.cursor.fetchone()
    db.close()

    # Get user email
    user_email = (user.get('email') if user else None) or report.get('email')
    print(f"[Report] User email={user_email}")

    # Send email notification to user
    email_warning = None
    try:
        from app.services.email_service import send_payment_report_user_result_email
        report_for_email = dict(report)
        report_for_email['status'] = status
        
        result_data = {
            "status": status,
            "adjustment_type": db_adjustment_type,
            "token_amount": token_amount,
            "new_balance": new_balance,
            "admin_note": admin_note
        }
        success = send_payment_report_user_result_email(
            report=report_for_email,
            user=dict(user) if user else {},
            result_data=result_data
        )
        if not success:
            email_warning = "Đã xử lý báo cáo nhưng gửi email thông báo thất bại."
    except Exception as email_err:
        print(f"[Email] Failed to send user result email: {email_err}")
        email_warning = f"Đã xử lý báo cáo nhưng gửi email thông báo thất bại: {email_err}"

    response_data = {
        "success": True,
        "message": "Đã xử lý báo cáo và gửi email cho người dùng.",
        "new_balance": new_balance
    }
    if email_warning:
        response_data["warning"] = email_warning

    return response_data

@router.get("/sync-from-html")
async def sync_from_html(admin: dict = Depends(get_current_admin)):
    html_seo = extract_seo_from_index_html()
    return html_seo

# ===============================
# BLOG MANAGEMENT
# ===============================

@router.get("/blog")
async def admin_get_blog_posts(admin: dict = Depends(get_current_admin)):
    db = UserDB()
    posts = db.get_blog_posts()
    db.close()
    return {"posts": posts}

@router.post("/blog")
async def admin_create_blog_post(data: BlogPostCreate, admin: dict = Depends(get_current_admin)):
    db = UserDB()
    post_id = db.create_blog_post(data.title, data.excerpt, data.content, data.image_url, data.slug)
    db.close()
    return {"message": "Tạo bài viết thành công", "post_id": post_id}

@router.put("/blog/{post_id}")
async def admin_update_blog_post(post_id: int, data: BlogPostUpdate, admin: dict = Depends(get_current_admin)):
    db = UserDB()
    # Get current
    db.cursor.execute("SELECT * FROM blog_posts WHERE id=%s", (post_id,))
    current = db.cursor.fetchone()
    if not current:
        db.close()
        raise HTTPException(status_code=404, detail="Không tìm thấy bài viết")
    
    title = data.title if data.title is not None else current['title']
    excerpt = data.excerpt if data.excerpt is not None else current['excerpt']
    content = data.content if data.content is not None else current['content']
    image_url = data.image_url if data.image_url is not None else current['image_url']
    slug = data.slug if data.slug is not None else current['slug']
    
    db.update_blog_post(post_id, title, excerpt, content, image_url, slug)
    db.close()
    return {"message": "Cập nhật bài viết thành công"}

@router.delete("/blog/{post_id}")
async def admin_delete_blog_post(post_id: int, admin: dict = Depends(get_current_admin)):
    db = UserDB()
    db.delete_blog_post(post_id)
    db.close()
    return {"message": "Đã xóa bài viết thành công"}

@router.get("/dashboard/stats")
async def get_dashboard_stats(admin: dict = Depends(get_current_admin)):
    db = UserDB()
    try:
        # summary
        db.cursor.execute("SELECT COUNT(*) as count FROM users")
        res = db.cursor.fetchone()
        total_users = res['count'] if res and res['count'] is not None else 0
        
        db.cursor.execute("SELECT SUM(tokens) as total FROM payments WHERE status = 'completed'")
        res = db.cursor.fetchone()
        total_tokens_recharged = res['total'] if res and res['total'] is not None else 0
        
        db.cursor.execute("SELECT SUM(amount_vnd) as total FROM payments WHERE status = 'completed'")
        res = db.cursor.fetchone()
        total_revenue = res['total'] if res and res['total'] is not None else 0
        
        db.cursor.execute("SELECT COUNT(*) as count FROM chat_logs")
        res = db.cursor.fetchone()
        total_chats = res['count'] if res and res['count'] is not None else 0
        
        db.cursor.execute("SELECT COUNT(*) as count FROM packages")
        res = db.cursor.fetchone()
        active_packages = res['count'] if res and res['count'] is not None else 0
        
        db.cursor.execute("SELECT COUNT(*) as count FROM payments")
        res = db.cursor.fetchone()
        total_invoices = res['count'] if res and res['count'] is not None else 0
        
        db.cursor.execute("SELECT COUNT(*) as count FROM payment_reports")
        res = db.cursor.fetchone()
        total_reports = res['count'] if res and res['count'] is not None else 0
        
        db.cursor.execute("SELECT COUNT(*) as count FROM blog_posts")
        res = db.cursor.fetchone()
        total_blogs = res['count'] if res and res['count'] is not None else 0
        
        # revenue_by_month
        db.cursor.execute("""
            SELECT DATE_FORMAT(created_at, '%Y-%m') as month, SUM(amount_vnd) as revenue 
            FROM payments 
            WHERE status = 'completed' 
            GROUP BY month 
            ORDER BY month ASC 
            LIMIT 12
        """)
        revenue_by_month = [dict(row) for row in db.cursor.fetchall()]
        
        # token_usage_by_day
        db.cursor.execute("""
            SELECT DATE_FORMAT(created_at, '%Y-%m-%d') as date, SUM(tokens_charged) as tokens 
            FROM chat_logs 
            GROUP BY date 
            ORDER BY date ASC 
            LIMIT 30
        """)
        token_usage_by_day = [
            {"date": row["date"], "tokens": float(row["tokens"] or 0)} 
            for row in db.cursor.fetchall()
        ]
        
        # new_users_by_day
        db.cursor.execute("""
            SELECT DATE_FORMAT(created_at, '%Y-%m-%d') as date, COUNT(*) as users 
            FROM users 
            GROUP BY date 
            ORDER BY date ASC 
            LIMIT 30
        """)
        new_users_by_day = [dict(row) for row in db.cursor.fetchall()]
        
        # top_token_users
        db.cursor.execute("""
            SELECT u.id as user_id, u.username as name, u.email, SUM(cl.tokens_charged) as tokens_used, u.token_balance as tokens_remaining 
            FROM users u 
            JOIN chat_logs cl ON u.id = cl.user_id 
            GROUP BY u.id, u.username, u.email, u.token_balance 
            ORDER BY tokens_used DESC 
            LIMIT 10
        """)
        top_token_users = [
            {
                "user_id": row["user_id"],
                "name": row["name"],
                "email": row["email"],
                "tokens_used": float(row["tokens_used"] or 0),
                "tokens_remaining": float(row["tokens_remaining"] or 0)
            }
            for row in db.cursor.fetchall()
        ]
        
        # Fill with dummy/placeholder data if totally empty (but formatted properly) so the UI looks beautiful
        if not revenue_by_month:
            import datetime
            now = datetime.datetime.now()
            # Last 6 months
            for i in range(5, -1, -1):
                d = now - datetime.timedelta(days=i*30)
                m = d.strftime('%Y-%m')
                revenue_by_month.append({"month": m, "revenue": 0})
                
        if not token_usage_by_day:
            import datetime
            now = datetime.datetime.now()
            for i in range(6, -1, -1):
                d = now - datetime.timedelta(days=i)
                date_str = d.strftime('%Y-%m-%d')
                token_usage_by_day.append({"date": date_str, "tokens": 0})
                
        if not new_users_by_day:
            import datetime
            now = datetime.datetime.now()
            for i in range(6, -1, -1):
                d = now - datetime.timedelta(days=i)
                date_str = d.strftime('%Y-%m-%d')
                new_users_by_day.append({"date": date_str, "users": 0})
                
        return {
            "summary": {
                "total_users": total_users,
                "total_tokens_recharged": float(total_tokens_recharged or 0),
                "total_revenue": float(total_revenue or 0),
                "total_chats": total_chats,
                "active_packages": active_packages,
                "total_invoices": total_invoices,
                "total_reports": total_reports,
                "total_blogs": total_blogs
            },
            "revenue_by_month": revenue_by_month,
            "token_usage_by_day": token_usage_by_day,
            "new_users_by_day": new_users_by_day,
            "top_token_users": top_token_users
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database query error: {str(e)}")
    finally:
        db.close()

