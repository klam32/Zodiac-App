import pymysql
import bcrypt
import sys
import os

# Add project root to sys.path
sys.path.append(os.getcwd())
from app.config import settings

def reset_password(username, new_password):
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(new_password.encode('utf-8'), salt).decode('utf-8')
    
    try:
        conn = pymysql.connect(
            host=settings.DB_HOST,
            user=settings.DB_USER,
            password=settings.DB_PASSWORD,
            database=settings.DB_NAME,
            port=settings.DB_PORT,
            cursorclass=pymysql.cursors.DictCursor,
            autocommit=True
        )
        with conn.cursor() as cursor:
            cursor.execute("SELECT id FROM users WHERE username=%s", (username,))
            user = cursor.fetchone()
            if user:
                cursor.execute("UPDATE users SET password=%s WHERE id=%s", (hashed, user['id']))
                print(f"SUCCESS: Password for '{username}' reset to '{new_password}' in MySQL")
            else:
                print(f"ERROR: User '{username}' not found in MySQL")
        conn.close()
    except Exception as e:
        print(f"MYSQL ERROR: {e}")

    if os.path.exists("database.db"):
        try:
            import sqlite3
            conn = sqlite3.connect("database.db")
            cursor = conn.cursor()
            cursor.execute("UPDATE users SET password=? WHERE username=?", (hashed, username))
            if cursor.rowcount > 0:
                print(f"SUCCESS: Password for '{username}' reset in SQLite")
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"SQLITE ERROR: {e}")

if __name__ == "__main__":
    reset_password("klam", "123456")
