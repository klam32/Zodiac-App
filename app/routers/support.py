import datetime
import os
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, status
from pydantic import BaseModel
from jose import jwt  # type: ignore

from app.security.security import get_current_user, get_current_admin
from app.models.base_db import UserDB
from app.services.websocket_manager import manager
from app.services.support_ai_service import SupportAIService
 
SECRET_KEY = os.getenv("SECRET_KEY", "yce-7r1!+6m45XXXXXX@dfi@a*0==1@")
ALGORITHM = "HS256"
 
router = APIRouter(tags=["Support"])
ai_service = SupportAIService()
 
# ----------------- SCHEMAS -----------------
class UserMessageRequest(BaseModel):
    conversation_id: int
    message: str
    language: str = "vi"
 
class AdminMessageRequest(BaseModel):
    conversation_id: int
    message: str
 
# ----------------- REST ENDPOINTS FOR USER -----------------
 
@router.get("/support/conversation")
async def get_or_create_conversation(current_user: dict = Depends(get_current_user)):
    db = UserDB()
    try:
        conv = db.get_or_create_support_conversation(current_user["id"])
        if not conv:
            raise HTTPException(status_code=500, detail="Cannot create conversation")
        return {
            "conversation_id": conv["id"],
            "status": conv["status"],
            "admin_online": manager.is_admin_online()
        }
    finally:
        db.close()
 
@router.get("/support/conversations/{conversation_id}/messages")
async def get_user_messages(conversation_id: int, current_user: dict = Depends(get_current_user)):
    db = UserDB()
    try:
        # Check owner
        db.cursor.execute("SELECT * FROM support_conversations WHERE id = %s", (conversation_id,))
        support_conv = db.cursor.fetchone()
        
        if not support_conv:
            raise HTTPException(status_code=404, detail="Conversation not found")
        if support_conv["user_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Forbidden")
            
        messages = db.get_support_messages(conversation_id)
        # Format datetimes
        formatted_messages = []
        for msg in messages:
            d = dict(msg)
            if isinstance(d["created_at"], datetime.datetime):
                d["created_at"] = d["created_at"].isoformat()
            formatted_messages.append(d)
        return formatted_messages
    finally:
        db.close()
 
@router.post("/support/messages")
async def user_send_message(request: UserMessageRequest, current_user: dict = Depends(get_current_user)):
    msg_text = request.message.strip()
    if not msg_text:
        raise HTTPException(status_code=400, detail="Tin nhắn không được để trống")
    if len(msg_text) > 2000:
        raise HTTPException(status_code=400, detail="Tin nhắn tối đa 2000 ký tự")
        
    db = UserDB()
    try:
        db.cursor.execute("SELECT * FROM support_conversations WHERE id = %s", (request.conversation_id,))
        support_conv = db.cursor.fetchone()
        
        if not support_conv:
            raise HTTPException(status_code=404, detail="Conversation not found")
        if support_conv["user_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Forbidden")
            
        # 1. Save user message
        user_msg_id = db.add_support_message(request.conversation_id, "user", current_user["id"], msg_text)
        
        user_msg_payload = {
            "id": user_msg_id,
            "type": "message",
            "conversation_id": request.conversation_id,
            "sender_type": "user",
            "sender_id": current_user["id"],
            "message": msg_text,
            "created_at": datetime.datetime.now().isoformat()
        }
        
        # Notify admins and user tabs via WebSocket
        await manager.send_to_all_admins(user_msg_payload)
        await manager.send_to_user(current_user["id"], user_msg_payload)
        
        # 2. Check presence
        if manager.is_admin_online():
            return {
                "id": user_msg_id,
                "status": "waiting_admin",
                "message": "Đã gửi đến admin. Vui lòng chờ phản hồi." if request.language == "vi" else "Sent to admin. Please wait for a reply."
            }
        else:
            # Trigger AI reply
            ai_reply = ai_service.get_support_reply(msg_text, request.language)
            ai_msg_id = db.add_support_message(request.conversation_id, "ai", None, ai_reply)
            
            ai_msg_payload = {
                "id": ai_msg_id,
                "type": "message",
                "conversation_id": request.conversation_id,
                "sender_type": "ai",
                "sender_id": None,
                "message": ai_reply,
                "created_at": datetime.datetime.now().isoformat()
            }
            
            # Send via WS
            await manager.send_to_user(current_user["id"], ai_msg_payload)
            await manager.send_to_all_admins(ai_msg_payload)
            
            # Try serious keyword check for email notification fallback
            try:
                serious_keywords = ["lỗi", "chưa nhận", "tiền", "thanh toán", "khoản", "mất", "token", "error", "payment", "money"]
                if any(k in msg_text.lower() for k in serious_keywords):
                    from app.services.email_service import send_payment_report_admin_notification
                    # Send simple fallback email using a helper or system config email
                    # Here we can call background task to send an alert
                    pass
            except Exception:
                pass

            return {
                "id": ai_msg_id,
                "status": "ai_replied",
                "message": ai_reply,
                "ai_reply": ai_reply
            }
    finally:
        db.close()
 
# ----------------- REST ENDPOINTS FOR ADMIN -----------------
 
@router.get("/admin/support/conversations")
async def admin_get_conversations(current_admin: dict = Depends(get_current_admin)):
    db = UserDB()
    try:
        convs = db.get_all_support_conversations()
        formatted_convs = []
        for c in convs:
            d = dict(c)
            if isinstance(d["created_at"], datetime.datetime):
                d["created_at"] = d["created_at"].isoformat()
            if isinstance(d["updated_at"], datetime.datetime):
                d["updated_at"] = d["updated_at"].isoformat()
            if isinstance(d["last_message_at"], datetime.datetime):
                d["last_message_at"] = d["last_message_at"].isoformat()
            formatted_convs.append(d)
        return formatted_convs
    finally:
        db.close()
 
@router.get("/admin/support/conversations/{conversation_id}/messages")
async def admin_get_messages(conversation_id: int, current_admin: dict = Depends(get_current_admin)):
    db = UserDB()
    try:
        messages = db.get_support_messages(conversation_id)
        formatted_messages = []
        for msg in messages:
            d = dict(msg)
            if isinstance(d["created_at"], datetime.datetime):
                d["created_at"] = d["created_at"].isoformat()
            formatted_messages.append(d)
        return formatted_messages
    finally:
        db.close()
 
@router.post("/admin/support/messages")
async def admin_send_message(request: AdminMessageRequest, current_admin: dict = Depends(get_current_admin)):
    msg_text = request.message.strip()
    if not msg_text:
        raise HTTPException(status_code=400, detail="Tin nhắn không được để trống")
    if len(msg_text) > 2000:
        raise HTTPException(status_code=400, detail="Tin nhắn tối đa 2000 ký tự")
        
    db = UserDB()
    try:
        db.cursor.execute("SELECT * FROM support_conversations WHERE id = %s", (request.conversation_id,))
        support_conv = db.cursor.fetchone()
        
        if not support_conv:
            raise HTTPException(status_code=404, detail="Conversation not found")
            
        # Save admin message
        admin_msg_id = db.add_support_message(request.conversation_id, "admin", current_admin["id"], msg_text)
        
        admin_msg_payload = {
            "id": admin_msg_id,
            "type": "message",
            "conversation_id": request.conversation_id,
            "sender_type": "admin",
            "sender_id": current_admin["id"],
            "message": msg_text,
            "created_at": datetime.datetime.now().isoformat()
        }
        
        # Broadcast to user and all admins via WebSocket
        await manager.send_to_user(support_conv["user_id"], admin_msg_payload)
        await manager.send_to_all_admins(admin_msg_payload)
        
        return {"status": "success", "message": "Tin nhắn đã được gửi"}
    finally:
        db.close()
 
@router.patch("/admin/support/conversations/{conversation_id}/resolve")
async def admin_resolve_conversation(conversation_id: int, current_admin: dict = Depends(get_current_admin)):
    db = UserDB()
    try:
        db.cursor.execute("SELECT * FROM support_conversations WHERE id = %s", (conversation_id,))
        support_conv = db.cursor.fetchone()
        
        if not support_conv:
            raise HTTPException(status_code=404, detail="Conversation not found")
            
        db.resolve_support_conversation(conversation_id)
        
        # Broadcast update to user and admins
        resolve_payload = {
            "type": "conversation_resolved",
            "conversation_id": conversation_id
        }
        await manager.send_to_user(support_conv["user_id"], resolve_payload)
        await manager.send_to_all_admins(resolve_payload)
        
        return {"status": "success", "message": "Hội thoại đã được đánh dấu giải quyết"}
    finally:
        db.close()
 
# ----------------- WEBSOCKET ENDPOINT -----------------
 
@router.websocket("/ws/support")
async def websocket_support(websocket: WebSocket, token: str | None = None):
    await websocket.accept()
    if not token:
        await websocket.close(code=4001)
        return
 
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("email")
        if not email:
            await websocket.close(code=4001)
            return
    except Exception:
        await websocket.close(code=4001)
        return
 
    db = UserDB()
    user = db.get_by_email(email)
    if not user:
        db.close()
        await websocket.close(code=4001)
        return
 
    is_admin = bool(user.get("is_admin", 0))
    user_id = user["id"]
 
    if is_admin:
        await manager.connect_admin(websocket)
        db.close()
        try:
            while True:
                data = await websocket.receive_json()
                # Update admin activity timestamp
                manager.update_admin_activity(websocket)
                
                if data.get("type") == "ping":
                    continue
                    
                # Admins can reply directly over WebSocket if client sends WS frames
                if "message" in data:
                    conv_id = data.get("conversation_id")
                    msg_text = data.get("message")
                    if conv_id and msg_text:
                        db_conn = UserDB()
                        db_conn.cursor.execute("SELECT * FROM support_conversations WHERE id = %s", (conv_id,))
                        conv = db_conn.cursor.fetchone()
                        if conv:
                            admin_msg_id = db_conn.add_support_message(conv_id, "admin", user_id, msg_text)
                            payload_to_send = {
                                "id": admin_msg_id,
                                "type": "message",
                                "conversation_id": conv_id,
                                "sender_type": "admin",
                                "sender_id": user_id,
                                "message": msg_text,
                                "created_at": datetime.datetime.now().isoformat()
                            }
                            await manager.send_to_user(conv["user_id"], payload_to_send)
                            await manager.send_to_all_admins(payload_to_send)
                        db_conn.close()
        except WebSocketDisconnect:
            pass
        finally:
            await manager.disconnect_admin(websocket)
    else:
        await manager.connect_user(user_id, websocket)
        
        # Get/create active support conversation
        conv = db.get_or_create_support_conversation(user_id)
        if not conv:
            db.close()
            await websocket.close(code=1011)
            return
        conv_id = conv["id"]
        
        # Send initial status
        await websocket.send_json({
            "type": "presence_update",
            "admin_online": manager.is_admin_online()
        })
        
        db.close()
        
        try:
            while True:
                data = await websocket.receive_json()
                msg_text = data.get("message", "").strip()
                lang = data.get("language", "vi")
                
                if msg_text:
                    if len(msg_text) > 2000:
                        await websocket.send_json({
                            "type": "error",
                            "message": "Tin nhắn quá dài (tối đa 2000 ký tự)"
                        })
                        continue
                        
                    db_conn = UserDB()
                    user_msg_id = db_conn.add_support_message(conv_id, "user", user_id, msg_text)
                    
                    user_msg_payload = {
                        "id": user_msg_id,
                        "type": "message",
                        "conversation_id": conv_id,
                        "sender_type": "user",
                        "sender_id": user_id,
                        "message": msg_text,
                        "created_at": datetime.datetime.now().isoformat()
                    }
                    
                    await websocket.send_json(user_msg_payload)
                    await manager.send_to_all_admins(user_msg_payload)
                    
                    if manager.is_admin_online():
                        await websocket.send_json({
                            "type": "status",
                            "status": "waiting_admin",
                            "message": "Đã gửi đến admin. Vui lòng chờ phản hồi." if lang == "vi" else "Sent to admin. Please wait for a reply."
                        })
                    else:
                        await websocket.send_json({
                            "type": "status",
                            "status": "ai_typing",
                            "message": "Trợ lý AI đang trả lời..." if lang == "vi" else "AI Assistant is typing..."
                        })
                        
                        ai_reply = ai_service.get_support_reply(msg_text, lang)
                        ai_msg_id = db_conn.add_support_message(conv_id, "ai", None, ai_reply)
                        
                        ai_msg_payload = {
                            "id": ai_msg_id,
                            "type": "message",
                            "conversation_id": conv_id,
                            "sender_type": "ai",
                            "sender_id": None,
                            "message": ai_reply,
                            "created_at": datetime.datetime.now().isoformat()
                        }
                        
                        await websocket.send_json(ai_msg_payload)
                        await manager.send_to_all_admins(ai_msg_payload)
                    
                    db_conn.close()
        except WebSocketDisconnect:
            pass
        finally:
            manager.disconnect_user(user_id, websocket)
