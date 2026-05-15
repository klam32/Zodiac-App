import sqlite3
import os

db_path = "database.db"
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, email FROM users")
    rows = cursor.fetchall()
    for row in rows:
        print(f"ID: {row['id']}, Username: {row['username']}, Email: {row['email']}")
    conn.close()
else:
    print("Database not found")
