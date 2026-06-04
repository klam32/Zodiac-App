import smtplib
from typing import Optional
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import settings
from app.models.base_db import UserDB

def send_email(to_email: str, subject: str, html_content: str) -> bool:
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        print("[Email] Error: SMTP configurations (SMTP_USER, SMTP_PASSWORD) are not set in .env")
        return False
    
    from_email = settings.SMTP_FROM_EMAIL or settings.SMTP_USER
    
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = from_email
    msg["To"] = to_email
    
    part = MIMEText(html_content, "html", "utf-8")
    msg.attach(part)
    
    try:
        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10)
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(from_email, to_email, msg.as_string())
        server.quit()
        print(f"[Email] Sent email to {to_email} with subject: {subject}")
        return True
    except Exception as e:
        print(f"[Email] Failed to send email to {to_email}: {e}")
        return False

def get_admin_email() -> str:
    if settings.ADMIN_EMAIL:
        return settings.ADMIN_EMAIL
    
    db = UserDB()
    try:
        db.cursor.execute("SELECT email FROM users WHERE is_admin = 1 ORDER BY id ASC LIMIT 1")
        row = db.cursor.fetchone()
        if row and row.get("email"):
            return row["email"]
    except Exception as e:
        print(f"[Email] Failed to query admin email from DB: {e}")
    finally:
        db.close()
        
    return ""

def send_payment_report_admin_notification(report: dict, user: dict) -> bool:
    admin_email = get_admin_email()
    if not admin_email:
        print("[Email] Cannot send admin notification: No admin email found")
        return False
    
    report_code = report.get('report_code', f"RPT-ID-{report.get('id')}")
    subject = f"[Zodiac Whisper] Báo cáo thanh toán mới - {report_code}"
    
    invoice_code = report.get('invoice_code') or "Không có"
    transaction_code = report.get('transaction_code') or "Không có"
    description = report.get('description', 'Không có mô tả')
    
    created_at = report.get('created_at')
    created_at_str = created_at.strftime('%Y-%m-%d %H:%M:%S') if hasattr(created_at, 'strftime') else str(created_at or "Vừa mới đây")
    
    user_name = user.get('full_name') or user.get('username') or 'Người dùng'
    user_email = user.get('email', 'Không có email')
    
    report_type_labels = {
        "payment_not_received": "Đã thanh toán nhưng chưa nhận token",
        "wrong_token_amount": "Sai số token",
        "payment_failed": "Thanh toán thất bại",
        "duplicate_payment": "Thanh toán trùng",
        "other": "Khác"
    }
    raw_type = str(report.get('report_type') or "")
    report_type_label = report_type_labels.get(raw_type) or raw_type or "Khác"
    
    attachment_url = report.get('attachment_url')
    if attachment_url and attachment_url.startswith("/"):
        backend_base_url = "https://railcar-frostbite-alumni.ngrok-free.dev"  # Default fallback from env
        if settings.GOOGLE_REDIRECT_URI:
            if "/api/" in settings.GOOGLE_REDIRECT_URI:
                backend_base_url = settings.GOOGLE_REDIRECT_URI.split("/api/")[0]
            elif "/auth/" in settings.GOOGLE_REDIRECT_URI:
                backend_base_url = settings.GOOGLE_REDIRECT_URI.split("/auth/")[0]
        backend_base_url = backend_base_url.rstrip("/")
        attachment_url = f"{backend_base_url}{attachment_url}"

    attachment_link = f'<a href="{attachment_url}" target="_blank" style="color: #7c3aed; font-weight: bold;">{attachment_url}</a>' if attachment_url else "Không có"
    
    html_content = f"""
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; }}
            .header {{ background-color: #7c3aed; color: white; padding: 15px; text-align: center; border-radius: 10px 10px 0 0; }}
            .content {{ padding: 20px; }}
            .info-table {{ width: 100%; border-collapse: collapse; margin-top: 15px; }}
            .info-table td {{ padding: 10px; border-bottom: 1px solid #eee; }}
            .info-table td.label {{ font-weight: bold; width: 150px; color: #666; }}
            .footer {{ text-align: center; margin-top: 20px; font-size: 12px; color: #999; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>Báo cáo sự cố mới</h2>
            </div>
            <div class="content">
                <p>Xin chào Admin,</p>
                <p>Hệ thống vừa nhận được một báo cáo thanh toán mới cần xử lý.</p>
                <table class="info-table">
                    <tr>
                        <td class="label">Mã báo cáo:</td>
                        <td><strong>{report_code}</strong></td>
                    </tr>
                    <tr>
                        <td class="label">Tiêu đề:</td>
                        <td>{report.get('title', 'Không có tiêu đề')}</td>
                    </tr>
                    <tr>
                        <td class="label">Loại sự cố:</td>
                        <td>{report_type_label}</td>
                    </tr>
                    <tr>
                        <td class="label">Người gửi:</td>
                        <td>{user_name}</td>
                    </tr>
                    <tr>
                        <td class="label">Email người gửi:</td>
                        <td>{user_email}</td>
                    </tr>
                    <tr>
                        <td class="label">Mã hóa đơn:</td>
                        <td>{invoice_code}</td>
                    </tr>
                    <tr>
                        <td class="label">Mã giao dịch:</td>
                        <td>{transaction_code}</td>
                    </tr>
                    <tr>
                        <td class="label">Nội dung chi tiết:</td>
                        <td>{description}</td>
                    </tr>
                    <tr>
                        <td class="label">Ảnh minh chứng:</td>
                        <td>{attachment_link}</td>
                    </tr>
                    <tr>
                        <td class="label">Thời gian gửi:</td>
                        <td>{created_at_str}</td>
                    </tr>
                </table>
                <p style="margin-top: 20px;">Hướng dẫn: Vào Admin > Báo cáo TT để xử lý.</p>
            </div>
            <div class="footer">
                <p>© 2026 Zodiac Whisper. Hệ thống thông báo tự động.</p>
            </div>
        </div>
    </body>
    </html>
    """
    print(f"[Email] Sending report notification to admin_email={admin_email}")
    success = send_email(admin_email, subject, html_content)
    if success:
        print("[Email] Admin notification sent successfully")
    else:
        print(f"[Email] Failed to send admin notification to {admin_email}")
    return success

def send_payment_report_user_result_email(
    report: dict, 
    user: Optional[dict] = None, 
    result_data: Optional[dict] = None,
    **kwargs
) -> bool:
    # SMTP_PASSWORD must be Gmail App Password, not a normal Gmail password
    actual_report = report
    actual_user = user
    
    # Detect if user and report were swapped or passed positionally under old signature
    if isinstance(actual_report, dict) and ('username' in actual_report or 'token_balance' in actual_report) and 'report_code' not in actual_report:
        actual_report, actual_user = actual_user, actual_report

    if not isinstance(actual_report, dict):
        actual_report = {}
    if not isinstance(actual_user, dict):
        actual_user = {}

    if result_data is None:
        result_data = {}

    status = result_data.get('status') or actual_report.get('status') or 'resolved'
    adjustment_type = result_data.get('adjustment_type') or kwargs.get('adjustment_type') or 'none'
    token_amount = result_data.get('token_amount') or kwargs.get('token_amount') or 0.0
    new_balance = result_data.get('new_balance') or kwargs.get('new_balance') or 0.0
    admin_note = result_data.get('admin_note') or kwargs.get('admin_note') or ""

    user_email = actual_user.get('email') or actual_report.get('email') or actual_report.get('user_email')
    if not user_email:
        print("[Email] Cannot send user result email: User email is empty")
        return False
        
    user_name = actual_user.get('full_name') or actual_user.get('username') or 'Người dùng'
    report_code = actual_report.get('report_code') or f"RPT-ID-{actual_report.get('id')}"
    title = actual_report.get('title', 'Không có tiêu đề')
    
    is_rejected = status in ['rejected', 'ignored']
    
    if is_rejected:
        subject = f"[Zodiac Whisper] Báo cáo của bạn chưa được chấp nhận - {report_code}"
    else:
        subject = f"[Zodiac Whisper] Báo cáo của bạn đã được xử lý - {report_code}"
        
    note_section = f"<p><strong>Ghi chú admin:</strong> {admin_note}</p>" if admin_note else ""
    
    if is_rejected:
        html_content = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; }}
                .header {{ background-color: #ef4444; color: white; padding: 15px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ padding: 20px; }}
                .footer {{ text-align: center; margin-top: 20px; font-size: 12px; color: #999; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>Báo cáo sự cố {report_code}</h2>
                </div>
                <div class="content">
                    <p>Xin chào <strong>{user_name}</strong>,</p>
                    <p>Báo cáo của bạn đã được admin kiểm tra nhưng chưa được chấp nhận.</p>
                    <p><strong>Thông tin:</strong></p>
                    <ul>
                        <li>Mã báo cáo: {report_code}</li>
                        <li>Tiêu đề: {title}</li>
                        <li>Lý do/Ghi chú admin: {admin_note or "Không có"}</li>
                    </ul>
                    <p>Nếu bạn cần hỗ trợ thêm, vui lòng gửi lại báo cáo với thông tin chi tiết hơn.</p>
                    <p>Trân trọng,<br>Đội ngũ Zodiac Whisper</p>
                </div>
                <div class="footer">
                    <p>© 2026 Zodiac Whisper. Cảm ơn bạn đã đồng hành cùng chúng tôi.</p>
                </div>
            </div>
        </body>
        </html>
        """
    else:
        adjust_text = "Không điều chỉnh token"
        if adjustment_type == 'in':
            adjust_text = "Cộng token"
        elif adjustment_type == 'out':
            adjust_text = "Trừ token"

        html_content = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; }}
                .header {{ background-color: #10b981; color: white; padding: 15px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ padding: 20px; }}
                .info-table {{ width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 15px; }}
                .info-table td {{ padding: 10px; border-bottom: 1px solid #eee; }}
                .info-table td.label {{ font-weight: bold; width: 180px; color: #666; }}
                .footer {{ text-align: center; margin-top: 20px; font-size: 12px; color: #999; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>Báo cáo sự cố {report_code}</h2>
                </div>
                <div class="content">
                    <p>Xin chào <strong>{user_name}</strong>,</p>
                    <p>Báo cáo của bạn đã được admin kiểm tra và xử lý.</p>
                    <table class="info-table">
                        <tr>
                            <td class="label">Mã báo cáo:</td>
                            <td><strong>{report_code}</strong></td>
                        </tr>
                        <tr>
                            <td class="label">Tiêu đề:</td>
                            <td>{title}</td>
                        </tr>
                        <tr>
                            <td class="label">Trạng thái:</td>
                            <td><span style="color:#10b981; font-weight:bold;">Đã xử lý</span></td>
                        </tr>
                        <tr>
                            <td class="label">Kết quả:</td>
                            <td>{adjust_text}</td>
                        </tr>
                        <tr>
                            <td class="label">Số token điều chỉnh:</td>
                            <td>{token_amount:.2f} Tokens</td>
                        </tr>
                        <tr>
                            <td class="label">Số dư token hiện tại:</td>
                            <td><strong>{new_balance:.2f} Tokens</strong></td>
                        </tr>
                    </table>
                    {note_section}
                    <p>Cảm ơn bạn đã sử dụng Zodiac Whisper.</p>
                    <p>Trân trọng,<br>Đội ngũ Zodiac Whisper</p>
                </div>
                <div class="footer">
                    <p>© 2026 Zodiac Whisper. Cảm ơn bạn đã đồng hành cùng chúng tôi.</p>
                </div>
            </div>
        </body>
        </html>
        """
    print(f"[Email] Sending result email to user={user_email}")
    success = send_email(user_email, subject, html_content)
    if success:
        print("[Email] User result email sent successfully")
    else:
        print(f"[Email] Failed to send user result email: SMTP error")
    return success

def send_token_adjustment_email(
    user: dict, 
    adjustment_type: str, # 'in' / 'out'
    token_amount: float, 
    new_balance: float,
    admin_name: str = "Admin",
    note: str = ""
) -> bool:
    user_email = user.get('email')
    if not user_email:
        print("[Email] Cannot send token adjustment email: User email is empty")
        return False
        
    user_name = user.get('full_name') or user.get('username') or 'Người dùng'
    
    subject = "[Zodiac Whisper] Số dư tài khoản của bạn đã được cập nhật"
    
    adjust_text = f"Cộng token (+{token_amount:.2f} Tokens)" if adjustment_type == 'in' else f"Trừ token (-{token_amount:.2f} Tokens)"
    action_description = "được cộng thêm" if adjustment_type == 'in' else "bị khấu trừ"
    
    note_section = f"<p><strong>Ghi chú điều chỉnh:</strong> {note}</p>" if note else ""
    
    html_content = f"""
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; }}
            .header {{ background-color: #6d5dfc; color: white; padding: 15px; text-align: center; border-radius: 10px 10px 0 0; }}
            .content {{ padding: 20px; }}
            .info-table {{ width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 15px; }}
            .info-table td {{ padding: 10px; border-bottom: 1px solid #eee; }}
            .info-table td.label {{ font-weight: bold; width: 180px; color: #666; }}
            .footer {{ text-align: center; margin-top: 20px; font-size: 12px; color: #999; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>Cập nhật số dư tài khoản</h2>
            </div>
            <div class="content">
                <p>Xin chào <strong>{user_name}</strong>,</p>
                <p>Chúng tôi xin thông báo số dư token trong tài khoản của bạn đã được {action_description} bởi ban quản trị hệ thống.</p>
                <table class="info-table">
                    <tr>
                        <td class="label">Hành động:</td>
                        <td>{adjust_text}</td>
                    </tr>
                    <tr>
                        <td class="label">Số dư hiện tại:</td>
                        <td><strong>{new_balance:.2f} Tokens</strong></td>
                    </tr>
                    <tr>
                        <td class="label">Người thực hiện:</td>
                        <td>{admin_name}</td>
                    </tr>
                </table>
                {note_section}
                <p>Chúc bạn có những giây phút trải nghiệm tuyệt vời cùng các công cụ của chúng tôi.</p>
                <p>Trân trọng,<br>Ban quản trị Zodiac Whisper</p>
            </div>
            <div class="footer">
                <p>© 2026 Zodiac Whisper. Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi.</p>
            </div>
        </div>
    </body>
    </html>
    """
    print(f"[AdminTokenAdjust] user_id={user.get('id')} email={user_email} type={adjustment_type} amount={token_amount}")
    print(f"[Email] Sent user result email to {user_email}")
    return send_email(user_email, subject, html_content)
