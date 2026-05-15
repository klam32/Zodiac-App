from app.models.base_db import UserDB
db = UserDB()
db.cursor.execute("DESCRIBE chat_logs")
cols = [row['Field'] for row in db.cursor.fetchall()]
print("Columns in chat_logs:", cols)
if "sources" in cols:
    print("SUCCESS: sources column exists!")
else:
    print("FAILED: sources column not found!")
