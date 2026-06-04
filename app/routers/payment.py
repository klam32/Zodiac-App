import httpx
import re
from fastapi import APIRouter, HTTPException, Depends, Form
from pydantic import BaseModel
from typing import Optional
from app.config import settings
from app.models.base_db import UserDB
from app.security.security import get_current_user
from datetime import datetime, timedelta, timezone

router = APIRouter(prefix="/payment", tags=["payment"])
reports_router = APIRouter(prefix="/payment-reports", tags=["payment-reports"])

# Format: <nameweb>NAPTOKEN<obfuscated_id> (No underscores)
# Example: BLOOMNAPTOKEN1A2B
def encode_payment_id(payment_id: int) -> str:
    # Light obfuscation: XOR with a fixed secret and convert to hex
    secret = 0x5EAFB
    return hex(payment_id ^ secret)[2:].upper()

def decode_payment_id(obfuscated_str: str) -> int:
    try:
        secret = 0x5EAFB
        return int(obfuscated_str, 16) ^ secret
    except:
        return 0

# Strict format: <nameweb>NAPTOKEN<id> (No spaces or underscores)
PAYMENT_REGEX = rf"{settings.NAME_WEB}NAPTOKEN([A-Fa-f0-9]+)"

@router.get("/packages")
def get_packages():
    db = UserDB()
    packages = db.get_packages()
    # Nếu chưa có package nào, thêm mặc định
    if not packages:
        db.add_package("Gói khởi đầu", 50, 50000)
        db.add_package("Gói chuyên nghiệp", 150, 100000)
        db.add_package("Gói doanh nghiệp", 500, 300000)
        packages = db.get_packages()
    db.close()
    return {"packages": packages}

@router.post("/create")
def create_payment(package_id: int = Form(...), user=Depends(get_current_user)):
    db = UserDB()
    # Lấy thông tin gói
    packages = db.get_packages()
    package = next((p for p in packages if p["id"] == package_id), None)
    if not package:
        db.close()
        raise HTTPException(status_code=404, detail="Gói không tồn tại")

    # Tạo đơn hàng
    payment_id = db.create_payment(
        user_id=user["id"],
        package_id=package["id"],
        amount_vnd=package["amount_vnd"],
        tokens=package["tokens"]
    )
    db.close()

    # Nội dung chuyển khoản theo cấu hình (mã hoá nhẹ id, không dùng underscore)
    obfuscated_id = encode_payment_id(payment_id)
    payment_note = f"{settings.NAME_WEB}NAPTOKEN{obfuscated_id}"
    
    # VietQR URL
    qr_url = f"https://qr.sepay.vn/img?acc={settings.SEPAY_ACCOUNT_NUMBER}&bank={settings.SEPAY_BANK_BRAND}&amount={package['amount_vnd']}&des={payment_note}"

    return {
        "payment_id": payment_id,
        "amount_vnd": package["amount_vnd"],
        "tokens": package["tokens"],
        "note": payment_note,
        "qr_url": qr_url,
        "bank_account": settings.SEPAY_ACCOUNT_NUMBER,
        "bank_brand": settings.SEPAY_BANK_BRAND
    }

@router.get("/status/{payment_id}")
async def check_payment_status(payment_id: int, user=Depends(get_current_user)):
    db = UserDB()
    payment = db.get_payment(payment_id)
    
    if not payment:
        db.close()
        raise HTTPException(status_code=404, detail="Hóa đơn không tìm thấy")
    
    if payment["user_id"] != user["id"]:
        db.close()
        raise HTTPException(status_code=403, detail="Không có quyền truy cập hóa đơn này")

    # Sync SePay trước khi trả về kết quả
    if payment["status"] == "pending":
        await sync_sepay(db)
        # Lấy lại trạng thái sau sync
        payment = db.get_payment(payment_id)

    # Sau khi sync mà vẫn pending, kiểm tra xem có quá hạn (15p) chưa
    if payment and payment["status"] == "pending":
        # created_at trong DB là UTC (theo CURRENT_TIMESTAMP)
        created_at = payment["created_at"]
        current_utc = datetime.now(timezone.utc).replace(tzinfo=None)
        if created_at and current_utc - created_at > timedelta(minutes=15):
            db.update_payment_status(payment_id, "failed")
            payment["status"] = "failed"
            print(f"⌛ Đơn hàng #{payment_id} đã hết hạn (UTC: {created_at}, Current: {current_utc})")

    db.close()
    if not payment:
        raise HTTPException(status_code=404, detail="Hóa đơn không tìm thấy")

    return {
        "status": payment["status"],
        "tokens": payment["tokens"],
        "amount_vnd": payment["amount_vnd"]
    }

async def sync_sepay(db: UserDB):
    if not settings.SEPAY_API_KEY:
        return

    url = "https://my.sepay.vn/userapi/transactions/list"
    headers = {"Authorization": f"Bearer {settings.SEPAY_API_KEY}"}
    params = {"account_number": settings.SEPAY_ACCOUNT_NUMBER, "limit": 20}

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, headers=headers, params=params)
            if resp.status_code != 200:
                print(f"❌ SePay Sync Error: {resp.text}")
                return
            
            data = resp.json()
            transactions = data.get("transactions", [])
            print(f"🔍 SePay Sync: Found {len(transactions)} transactions")

            for tx in transactions:
                sepay_id = str(tx.get("id"))
                content = tx.get("transaction_content", "")
                amount_in = float(tx.get("amount_in", 0))

                # Kiểm tra xem giao dịch này đã xử lý chưa
                if db.get_payment_by_sepay_id(sepay_id):
                    continue

                # Tìm payment_id từ nội dung
                match = re.search(PAYMENT_REGEX, content, re.IGNORECASE)
                if match:
                    obfuscated_str = match.group(1)
                    tx_payment_id = decode_payment_id(obfuscated_str)
                    print(f"  Matched Payment ID: {tx_payment_id} (Obfuscated: {obfuscated_str})")
                    
                    tx_payment = db.get_payment(tx_payment_id)

                    # Cho phép xử lý cả đơn pending và failed (nếu lỡ mark failed mà tiền vẫn về)
                    if tx_payment and tx_payment["status"] in ["pending", "failed"]:
                        # Kiểm tra số tiền chuyển khoản có khớp với đơn hàng không
                        if amount_in != tx_payment['amount_vnd']:
                            print(f"⚠️ Số tiền không khớp - Payment ID: {tx_payment_id}, Expected: {tx_payment['amount_vnd']}, Got: {amount_in}")
                            continue
                        
                        # Cập nhật trạng thái và cộng token
                        db.update_payment_status(tx_payment_id, "completed", sepay_id)
                        db.change_token_balance(
                            tx_payment["user_id"], 
                            tx_payment["tokens"], 
                            f"Nạp tiền qua SePay (GD: {sepay_id})", 
                            "in"
                        )
                        print(f"✅ Đã xử lý nạp token cho Payment ID: {tx_payment_id}")

    except Exception as e:
        print(f"❌ SePay Sync Exception: {e}")

# @router.post("/report")
# def create_payment_report(
#     payment_id: int = Form(...), 
#     description: str = Form("Thanh toán bị lỗi hoặc không nhận được token"), 
#     user=Depends(get_current_user)
# ):
#     db = UserDB()
#     # Verify payment belongs to user
#     payment = db.get_payment(payment_id)
    
#     if not payment:
#         db.close()
#         raise HTTPException(status_code=404, detail="Hóa đơn không tìm thấy")
    
#     if payment["user_id"] != user["id"]:
#         db.close()
#         raise HTTPException(status_code=403, detail="Không có quyền báo cáo hóa đơn này")

#     db.create_payment_report(user["id"], payment_id, description)
#     db.close()
    
#     return {"message": "Đã gửi báo cáo thành công. Admin sẽ kiểm tra sớm."}

@router.post("/report")
def create_payment_report(
    description: str = Form("Thanh toán bị lỗi hoặc không nhận được token"), 
    user=Depends(get_current_user)
):
    db = UserDB()

    # 🔥 LẤY PAYMENT GẦN NHẤT CỦA USER
    db.cursor.execute(
        "SELECT * FROM payments WHERE user_id=%s ORDER BY created_at DESC LIMIT 1",
        (user["id"],)
    )
    payment = db.cursor.fetchone()

    if not payment:
        db.close()
        raise HTTPException(status_code=404, detail="Bạn chưa có giao dịch nào")

    # (optional) chỉ cho report payment pending/failed
    if payment["status"] == "completed":
        db.close()
        raise HTTPException(
            status_code=400, 
            detail="Giao dịch này đã hoàn tất và token đã được cộng. Nếu bạn vẫn gặp vấn đề, hãy liên hệ hỗ trợ trực tiếp."
        )

    # Generate unique report code for compatibility
    today_str = datetime.now().strftime("%Y%m%d")
    today_prefix = f"RPT-{today_str}-"
    try:
        db.cursor.execute("SELECT COUNT(*) as count FROM payment_reports WHERE report_code LIKE %s", (today_prefix + "%",))
        res = db.cursor.fetchone()
        count_today = res["count"] if res and res["count"] is not None else 0
    except Exception:
        count_today = 0
    report_code = f"{today_prefix}{count_today + 1:04d}"

    invoice_code = f"#{payment['id']}"
    transaction_code = payment.get('transaction_id') or "N/A"

    report_id = db.create_payment_report(
        report_code=report_code,
        user_id=user["id"],
        title="Báo cáo sự cố thanh toán (Tự động tạo)",
        report_type="payment_not_received",
        invoice_code=invoice_code,
        transaction_code=transaction_code,
        description=description,
        attachment_url=None,
        payment_id=payment["id"]
    )
    print(f"[Report] Created report_id={report_id}")
    db.close()

    # Send admin notification email
    try:
        from app.services.email_service import send_payment_report_admin_notification
        report_data = {
            "id": report_id,
            "report_code": report_code,
            "title": "Báo cáo sự cố thanh toán (Tự động tạo)",
            "report_type": "payment_not_received",
            "invoice_code": invoice_code,
            "transaction_code": transaction_code,
            "description": description,
            "attachment_url": None,
            "created_at": datetime.now()
        }
        send_payment_report_admin_notification(report_data, user)
    except Exception as email_err:
        print(f"[Email] Failed to notify admin: {email_err}")

    return {
        "message": "Đã gửi báo cáo thanh toán. Admin sẽ kiểm tra và phản hồi qua email.",
        "payment_id": payment["id"]
    }

class PaymentReportCreate(BaseModel):
    title: str
    report_type: str
    invoice_code: Optional[str] = None
    transaction_code: Optional[str] = None
    description: str
    attachment_url: Optional[str] = None

@reports_router.post("")
def create_payment_report_v2(
    data: PaymentReportCreate,
    user=Depends(get_current_user)
):
    db = UserDB()
    
    # 1. Generate unique report code
    today_str = datetime.now().strftime("%Y%m%d")
    today_prefix = f"RPT-{today_str}-"
    try:
        db.cursor.execute("SELECT COUNT(*) as count FROM payment_reports WHERE report_code LIKE %s", (today_prefix + "%",))
        res = db.cursor.fetchone()
        count_today = res["count"] if res and res["count"] is not None else 0
    except Exception:
        count_today = 0
        
    report_code = f"{today_prefix}{count_today + 1:04d}"
    
    # 2. Extract payment_id if invoice_code matches a payment
    payment_id = None
    if data.invoice_code:
        try:
            clean_code = data.invoice_code.strip()
            if clean_code.startswith("#"):
                p_id_str = clean_code[1:]
                if p_id_str.isdigit():
                    payment_id = int(p_id_str)
        except Exception:
            pass
            
    # 3. Insert report to database
    try:
        report_id = db.create_payment_report(
            report_code=report_code,
            user_id=user["id"],
            title=data.title,
            report_type=data.report_type,
            invoice_code=data.invoice_code,
            transaction_code=data.transaction_code,
            description=data.description,
            attachment_url=data.attachment_url,
            payment_id=payment_id
        )
        print(f"[Report] Created report_id={report_id}")
    except Exception as db_err:
        db.close()
        raise HTTPException(status_code=500, detail=f"Lỗi database: {db_err}")
        
    db.close()
    
    # 4. Email notification to Admin
    email_warning = None
    try:
        from app.services.email_service import send_payment_report_admin_notification
        report_data = {
            "id": report_id,
            "report_code": report_code,
            "title": data.title,
            "report_type": data.report_type,
            "invoice_code": data.invoice_code,
            "transaction_code": data.transaction_code,
            "description": data.description,
            "attachment_url": data.attachment_url,
            "created_at": datetime.now()
        }
        success = send_payment_report_admin_notification(report_data, user)
        if not success:
            email_warning = "Gửi email thông báo cho Admin thất bại."
    except Exception as email_err:
        print(f"[Email] Failed to send admin notification: {email_err}")
        email_warning = f"Gửi email thông báo cho Admin thất bại: {email_err}"
        
    response_payload = {
        "success": True,
        "message": "Report submitted successfully",
        "report": {
            "id": report_id,
            "report_code": report_code,
            "status": "pending"
        }
    }
    if email_warning:
        response_payload["warning"] = email_warning
        
    return response_payload