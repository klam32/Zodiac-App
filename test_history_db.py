from app.models.base_db import UserDB
user_db = UserDB()
conversations = user_db.get_user_conversations(1)
history = []
for conv in conversations:
    logs = user_db.get_user_chat_logs(conv["id"])
    for log in logs:
        history.append({
            "id": f"a-{log['id']}",
            "sources": log.get("sources"),
            "conversation_id": conv["id"]
        })
for h in history[-5:]:
    print(f"Log ID: {h['id']}, sources type: {type(h.get('sources'))}, has data: {bool(h.get('sources'))}")
