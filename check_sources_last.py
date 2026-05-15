from app.models.base_db import UserDB
db = UserDB()
db.cursor.execute("SELECT id, label, sources FROM chat_logs ORDER BY id DESC LIMIT 5")
rows = db.cursor.fetchall()
for row in rows:
    print(f"ID: {row['id']} | LABEL: {row['label']} | HAS SOURCES: {bool(row['sources'])}")
    if row['sources']:
        print("  Length of sources JSON string:", len(row['sources']))
