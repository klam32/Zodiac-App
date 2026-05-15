from app.models.base_db import UserDB
db = UserDB()
db.cursor.execute("SELECT id, conversation_id FROM chat_logs WHERE sources IS NOT NULL ORDER BY id DESC LIMIT 1")
row = db.cursor.fetchone()
if row:
    conv_id = row['conversation_id']
    logs = db.get_user_chat_logs(conv_id)
    for log in logs:
        if log.get('sources'):
            print(f"Log ID: {log['id']}, sources type: {type(log.get('sources'))}, len: {len(log.get('sources'))}")
