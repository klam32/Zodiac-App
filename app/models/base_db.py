
import sqlite3
import os
import json
from app.config import settings

class SQLiteCursorWrapper:
    def __init__(self, cursor):
        self.cursor = cursor

    def execute(self, sql, parameters=None):
        # Translate placeholder %s to ?
        if '%s' in sql:
            sql = sql.replace('%s', '?')
        
        # Translate INSERT IGNORE INTO to INSERT OR IGNORE INTO
        if 'INSERT IGNORE INTO' in sql:
            sql = sql.replace('INSERT IGNORE INTO', 'INSERT OR IGNORE INTO')
            
        # Translate ON DUPLICATE KEY UPDATE to ON CONFLICT DO UPDATE
        if 'ON DUPLICATE KEY UPDATE' in sql:
            sql = sql.replace('ON DUPLICATE KEY UPDATE profile=?', 'ON CONFLICT(user_id) DO UPDATE SET profile=?')

        if parameters is not None:
            # sqlite3 doesn't automatically convert list/dict parameters to JSON string
            if isinstance(parameters, dict):
                cleaned_params = {}
                for k, v in parameters.items():
                    if isinstance(v, (dict, list)):
                        cleaned_params[k] = json.dumps(v, ensure_ascii=False)
                    else:
                        cleaned_params[k] = v
            else:
                cleaned_params = []
                for p in parameters:
                    if isinstance(p, (dict, list)):
                        cleaned_params.append(json.dumps(p, ensure_ascii=False))
                    else:
                        cleaned_params.append(p)
                cleaned_params = tuple(cleaned_params)
            self.cursor.execute(sql, cleaned_params)
        else:
            self.cursor.execute(sql)
        return self

    def executemany(self, sql, seq_of_parameters=None):
        if '%s' in sql:
            sql = sql.replace('%s', '?')
        if 'INSERT IGNORE INTO' in sql:
            sql = sql.replace('INSERT IGNORE INTO', 'INSERT OR IGNORE INTO')
            
        if seq_of_parameters is not None:
            cleaned_seq = []
            for parameters in seq_of_parameters:
                cleaned_params = []
                for p in parameters:
                    if isinstance(p, (dict, list)):
                        cleaned_params.append(json.dumps(p, ensure_ascii=False))
                    else:
                        cleaned_params.append(p)
                cleaned_seq.append(tuple(cleaned_params))
            self.cursor.executemany(sql, cleaned_seq)
        else:
            self.cursor.executemany(sql)
        return self

    def fetchone(self):
        row = self.cursor.fetchone()
        if row is not None:
            return dict(row)
        return None

    def fetchall(self):
        rows = self.cursor.fetchall()
        return [dict(r) for r in rows]

    @property
    def lastrowid(self):
        return self.cursor.lastrowid

    @property
    def rowcount(self):
        return self.cursor.rowcount


class SQLiteConnectionWrapper:
    def __init__(self, conn):
        self.conn = conn

    def __getattr__(self, name):
        return getattr(self.conn, name)

    def commit(self):
        pass

    def rollback(self):
        pass

    def cursor(self):
        return SQLiteCursorWrapper(self.conn.cursor())

    def close(self):
        return self.conn.close()


class BaseDB:
    def __init__(self):
        db_dir = os.path.dirname(settings.DB_PATH)
        if db_dir and not os.path.exists(db_dir):
            os.makedirs(db_dir, exist_ok=True)
            
        conn = sqlite3.connect(
            settings.DB_PATH,
            detect_types=sqlite3.PARSE_DECLTYPES | sqlite3.PARSE_COLNAMES,
            isolation_level=None,
            timeout=10,
            check_same_thread=False
        )
        conn.row_factory = sqlite3.Row
        self.conn = SQLiteConnectionWrapper(conn)
        self.cursor = self.conn.cursor()
        
        # Enable foreign keys
        self.cursor.execute("PRAGMA foreign_keys = ON")
        self._create_tables()

    def _create_tables(self):

        # users
        self.cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username VARCHAR(255) UNIQUE,
            password VARCHAR(255),
            email VARCHAR(255) UNIQUE,
            full_name VARCHAR(255),
            picture_url TEXT,
            is_admin TINYINT(1) DEFAULT 0,
            token_balance DOUBLE DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)

        # token_history
        self.cursor.execute("""
        CREATE TABLE IF NOT EXISTS token_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            type VARCHAR(10),
            amount DOUBLE,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
        """)

        # base
        self.cursor.execute("""
        CREATE TABLE IF NOT EXISTS base (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(255),
            url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)

        # packages
        self.cursor.execute("""
        CREATE TABLE IF NOT EXISTS packages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(255),
            tokens INTEGER,
            amount_vnd INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)

        # payments
        self.cursor.execute("""
        CREATE TABLE IF NOT EXISTS payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            package_id INTEGER,
            amount_vnd INTEGER,
            tokens INTEGER,
            status VARCHAR(20) DEFAULT 'pending',
            sepay_id VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
        """)

        # conversations (NEW)
        self.cursor.execute("""
        CREATE TABLE IF NOT EXISTS conversations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            title VARCHAR(255),
            is_pinned TINYINT(1) DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
        """)

        # conversation_chunks (RAG)
        self.cursor.execute("""
        CREATE TABLE IF NOT EXISTS conversation_chunks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            conversation_id INTEGER,
            user_id INTEGER,
            section_name VARCHAR(100),
            domain VARCHAR(50),
            source_type VARCHAR(50),
            chunk_index INTEGER,
            token_count INTEGER,
            content TEXT,
            embedding TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
        )
        """)

        # retrieval_logs
        self.cursor.execute("""
        CREATE TABLE IF NOT EXISTS retrieval_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            conversation_id INTEGER,
            query TEXT,
            retrieved_chunks TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)

        # chat_logs (UPDATED)
        self.cursor.execute("""
        CREATE TABLE IF NOT EXISTS chat_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            conversation_id INTEGER,
            question TEXT,
            answer TEXT,
            tokens_charged DOUBLE,
            chart TEXT,
            chart_summary TEXT,
            chart_svg TEXT,
            partner_chart_svg TEXT,
            compatibility INTEGER,
            label VARCHAR(50),
            partner_json TEXT,
            raw_data TEXT,
            sources TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
        )
        """)

        # settings
        self.cursor.execute("""
        CREATE TABLE IF NOT EXISTS settings (
            `key` VARCHAR(255) PRIMARY KEY,
            value TEXT
        )
        """)

        self.cursor.execute("INSERT OR IGNORE INTO settings (`key`, value) VALUES ('rate_per_1000','1.0')")
        self.cursor.execute("INSERT OR IGNORE INTO settings (`key`, value) VALUES ('logo_url','')")
        self.cursor.execute("INSERT OR IGNORE INTO settings (`key`, value) VALUES ('site_title','Zodiac Whisper')")
        self.cursor.execute("INSERT OR IGNORE INTO settings (`key`, value) VALUES ('background_url','')")
        
        # Landing Page Settings
        self.cursor.execute("INSERT OR IGNORE INTO settings (`key`, value) VALUES ('hero_title','Khai mở vận mệnh cùng AI')")
        self.cursor.execute("INSERT OR IGNORE INTO settings (`key`, value) VALUES ('hero_subtitle','Khám phá bản đồ sao cá nhân để thấu hiểu vận mệnh của chính mình.')")
        self.cursor.execute("INSERT OR IGNORE INTO settings (`key`, value) VALUES ('about_title','Về chúng tôi')")
        self.cursor.execute("INSERT OR IGNORE INTO settings (`key`, value) VALUES ('about_content','Chúng tôi là đội ngũ đam mê chiêm tinh học và công nghệ AI...')")

        # blog_posts
        self.cursor.execute("""
        CREATE TABLE IF NOT EXISTS blog_posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title VARCHAR(255),
            excerpt TEXT,
            content TEXT,
            image_url TEXT,
            author VARCHAR(100) DEFAULT 'Zodiac Whisper',
            slug VARCHAR(255) UNIQUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)

        # Add initial blog posts if empty
        self.cursor.execute("SELECT COUNT(*) as count FROM blog_posts")
        row = self.cursor.fetchone()
        if row and row['count'] == 0:
             self.cursor.execute("""
                INSERT INTO blog_posts (title, excerpt, content, image_url, slug) VALUES 
                ('Nghiệp Quả Trong Chiêm Tinh Học', 'Hành trình linh hồn qua La Hầu, Kế Đô và Chiron...', 'Nội dung chi tiết...', '/blog-karma.png', 'nghiep-qua'),
                ('Xích Vĩ Trong Bản Đồ Sao', 'Khám phá chiều sâu của các hành tinh qua hệ thống xích vĩ...', 'Nội dung chi tiết...', '/blog-declination.png', 'xich-vi'),
                ('Phân Tích Hướng Nghiệp', 'Sử dụng chiêm tinh để tìm ra con đường sự nghiệp phù hợp...', 'Nội dung chi tiết...', '/blog-career.png', 'huong-nghiep')
             """)

        # payment_reports
        self.cursor.execute("""
        CREATE TABLE IF NOT EXISTS payment_reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            report_code VARCHAR(50) UNIQUE,
            user_id INTEGER,
            payment_id INTEGER NULL,
            title VARCHAR(255),
            report_type VARCHAR(50),
            invoice_code VARCHAR(50) NULL,
            transaction_code VARCHAR(100) NULL,
            description TEXT,
            attachment_url TEXT NULL,
            status VARCHAR(20) DEFAULT 'pending',
            admin_note TEXT NULL,
            adjustment_type VARCHAR(20) NULL,
            token_amount FLOAT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            resolved_at TIMESTAMP NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
        """)

        # login_logs
        self.cursor.execute("""
        CREATE TABLE IF NOT EXISTS login_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            ip_address VARCHAR(255),
            user_agent TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
        """)

        # user_memory
        self.cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_memory (
            user_id INTEGER PRIMARY KEY,
            profile TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
        """)

        # chat_feedback
        self.cursor.execute("""
        CREATE TABLE IF NOT EXISTS chat_feedback (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            conversation_id INTEGER,
            log_id INTEGER,
            rating VARCHAR(10), -- 'like' or 'dislike'
            comment TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
            FOREIGN KEY (log_id) REFERENCES chat_logs(id) ON DELETE CASCADE
        )
        """)

        # daily_checkins
        self.cursor.execute("""
        CREATE TABLE IF NOT EXISTS daily_checkins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            checkin_date DATE,
            streak INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE (user_id, checkin_date),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
        """)

        # daily_quizzes
        self.cursor.execute("""
        CREATE TABLE IF NOT EXISTS daily_quizzes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            quiz_date DATE,
            questions_answered INTEGER DEFAULT 0,
            correct_answers INTEGER DEFAULT 0,
            claimed_3_correct TINYINT(1) DEFAULT 0,
            claimed_5_correct TINYINT(1) DEFAULT 0,
            answers_json TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE (user_id, quiz_date),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
        """)

        # support_conversations
        self.cursor.execute("""
        CREATE TABLE IF NOT EXISTS support_conversations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            status VARCHAR(20) DEFAULT 'open',
            assigned_admin_id INTEGER NULL,
            last_message TEXT NULL,
            last_message_at TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
        """)

        # support_messages
        self.cursor.execute("""
        CREATE TABLE IF NOT EXISTS support_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            conversation_id INTEGER,
            sender_type VARCHAR(20),
            sender_id INTEGER NULL,
            message TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_read TINYINT(1) DEFAULT 0,
            FOREIGN KEY (conversation_id) REFERENCES support_conversations(id) ON DELETE CASCADE
        )
        """)

        # email_otps
        self.cursor.execute("""
        CREATE TABLE IF NOT EXISTS email_otps (
            email VARCHAR(255) PRIMARY KEY,
            otp VARCHAR(10),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP
        )
        """)



    def reconnect(self):
        """Ensure the database connection is alive."""
        try:
            self.cursor.execute("SELECT 1")
        except Exception:
            conn = sqlite3.connect(
                settings.DB_PATH,
                detect_types=sqlite3.PARSE_DECLTYPES | sqlite3.PARSE_COLNAMES,
                isolation_level=None,
                timeout=10,
                check_same_thread=False
            )
            conn.row_factory = sqlite3.Row
            self.conn = SQLiteConnectionWrapper(conn)
            self.cursor = self.conn.cursor()
    
    def log_login(self, user_id, ip_address, user_agent):
        self.cursor.execute(
            "INSERT INTO login_logs (user_id, ip_address, user_agent) VALUES (%s,%s,%s)",
            (user_id, ip_address, user_agent)
        )

    def get_recent_logins(self, limit=50):
        query = """
        SELECT ll.*, u.username, u.email
        FROM login_logs ll
        JOIN users u ON ll.user_id = u.id
        ORDER BY ll.created_at DESC
        LIMIT %s
        """
        self.cursor.execute(query, (limit,))
        return self.cursor.fetchall()

    def get_setting(self, key, default=None):
        self.cursor.execute("SELECT value FROM settings WHERE `key`=%s",(key,))
        row = self.cursor.fetchone()
        return row['value'] if row else default

    def set_setting(self,key,value):
        self.cursor.execute(
            "REPLACE INTO settings (`key`,value) VALUES (%s,%s)",
            (key,str(value))
        )

    def get_all_chat_logs(self):

        query="""
        SELECT cl.*,u.username,u.email
        FROM chat_logs cl
        JOIN users u ON cl.user_id=u.id
        ORDER BY cl.created_at DESC
        """

        self.cursor.execute(query)
        rows=self.cursor.fetchall()

        result=[]
        import json

        for row in rows:
            d=dict(row)

            if d.get("chart_summary"):
                try:
                    d["chart_summary"]=json.loads(d["chart_summary"])
                except:
                    pass

            result.append(d)

        return result

    def get_user_chat_logs(self,user_id):

        self.cursor.execute(
            "SELECT * FROM chat_logs WHERE user_id=%s ORDER BY created_at ASC",
            (user_id,)
        )

        rows=self.cursor.fetchall()

        result=[]
        import json

        for row in rows:
            d=dict(row)

            if d.get("chart_summary"):
                try:
                    d["chart_summary"]=json.loads(d["chart_summary"])
                except:
                    pass

            result.append(d)

        return result

    def get_all_pictures(self):

        self.cursor.execute("SELECT * FROM base")
        return self.cursor.fetchall()

    # ===============================
    # BLOG POSTS
    # ===============================

    def get_blog_posts(self):
        self.cursor.execute("SELECT * FROM blog_posts ORDER BY created_at DESC")
        return self.cursor.fetchall()

    def get_blog_post_by_slug(self, slug):
        self.cursor.execute("SELECT * FROM blog_posts WHERE slug=%s", (slug,))
        return self.cursor.fetchone()

    def create_blog_post(self, title, excerpt, content, image_url, slug):
        self.cursor.execute(
            "INSERT INTO blog_posts (title, excerpt, content, image_url, slug) VALUES (%s,%s,%s,%s,%s)",
            (title, excerpt, content, image_url, slug)
        )
        return self.cursor.lastrowid

    def update_blog_post(self, post_id, title, excerpt, content, image_url, slug):
        self.cursor.execute(
            "UPDATE blog_posts SET title=%s, excerpt=%s, content=%s, image_url=%s, slug=%s WHERE id=%s",
            (title, excerpt, content, image_url, slug, post_id)
        )

    def delete_blog_post(self, post_id):
        self.cursor.execute("DELETE FROM blog_posts WHERE id=%s", (post_id,))
    # ===============================
    # CONVERSATIONS
    # ===============================

    def create_conversation(self, user_id, title="Luận giải mới"):

        self.cursor.execute(
            "INSERT INTO conversations (user_id,title) VALUES (%s,%s)",
            (user_id, title)
        )

        return self.cursor.lastrowid


    def get_user_conversations(self, user_id):

        self.cursor.execute(
            "SELECT * FROM conversations WHERE user_id=%s ORDER BY is_pinned DESC, created_at DESC",
            (user_id,)
        )

        return self.cursor.fetchall()


    # 🔥 NEW
    def get_conversation(self, conversation_id):

        self.cursor.execute(
            "SELECT * FROM conversations WHERE id=%s",
            (conversation_id,)
        )

        return self.cursor.fetchone()


    # 🔥 NEW
    def update_conversation_title(self, conversation_id, title):

        self.cursor.execute(
            "UPDATE conversations SET title=%s WHERE id=%s",
            (title, conversation_id)
        )

    # 🔥 NEW: PIN
    def update_conversation_pin(self, conversation_id, is_pinned):
        self.cursor.execute(
            "UPDATE conversations SET is_pinned=%s WHERE id=%s",
            (1 if is_pinned else 0, conversation_id)
        )
    def delete_conversation(self, user_id, conversation_id):

        # xóa chunk RAG
        self.cursor.execute(
            "DELETE FROM conversation_chunks WHERE conversation_id=%s",
            (conversation_id,)
        )

        # xóa chat logs trước
        self.cursor.execute(
            "DELETE FROM chat_logs WHERE conversation_id=%s AND user_id=%s",
            (conversation_id, user_id)
        )

        # xóa conversation
        self.cursor.execute(
            "DELETE FROM conversations WHERE id=%s AND user_id=%s",
            (conversation_id, user_id)
        )
    # ===============================
    # CHAT LOG
    # ===============================

    def save_chat_log(
        self,
        user_id,
        conversation_id,
        question,
        answer,
        tokens_charged,
        chart,   # 🔥 THÊM
        chart_summary=None,
        chart_svg=None,
        partner_chart_svg=None,
        compatibility=None,
        label=None,
        partner_json=None,
        sources=None,
        raw_data=None
    ):

        import json

        summary_json = json.dumps(chart_summary) if chart_summary else None
        sources_json = json.dumps(sources, ensure_ascii=False) if sources else None

        raw_data_json = None
        if raw_data is not None:
            if isinstance(raw_data, (dict, list)):
                raw_data_json = json.dumps(raw_data, ensure_ascii=False)
            elif isinstance(raw_data, str):
                try:
                    json.loads(raw_data)
                    raw_data_json = raw_data
                except Exception:
                    raw_data_json = json.dumps(raw_data, ensure_ascii=False)
            else:
                raw_data_json = json.dumps(raw_data, ensure_ascii=False)

        self.cursor.execute(
            """
            INSERT INTO chat_logs
            (user_id,conversation_id,question,answer,tokens_charged,chart,chart_summary,chart_svg,partner_chart_svg,compatibility,label,partner_json,sources,raw_data)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            """,
            (
                user_id,
                conversation_id,
                question,
                answer,
                float(tokens_charged),
                chart,
                summary_json,
                chart_svg,
                partner_chart_svg,
                compatibility,       
                label,
                json.dumps(partner_json) if partner_json else None,
                sources_json,
                raw_data_json
            )
        )
    # 🚀 NEW: dùng cho history (1 query duy nhất)
    def get_all_user_logs(self, user_id):
        self.cursor.execute(
            "SELECT * FROM chat_logs WHERE user_id=%s ORDER BY created_at ASC",
            (user_id,)
        )
        return self.cursor.fetchall()
    def get_user_chat_logs(self, conversation_id):

        self.cursor.execute(
            "SELECT * FROM chat_logs WHERE conversation_id=%s ORDER BY created_at ASC",
            (conversation_id,)
        )

        rows = self.cursor.fetchall()

        result = []

        import json

        for row in rows:

            d = dict(row)

            if d.get("chart_summary"):
                try:
                    d["chart_summary"] = json.loads(d["chart_summary"])
                except:
                    pass

            if d.get("sources"):
                try:
                    d["sources"] = json.loads(d["sources"])
                except:
                    pass

            result.append(d)

        return result

    def delete_user_chat_logs(self, user_id):

        # 🔥 xóa chat logs
        self.cursor.execute(
            "DELETE FROM chat_logs WHERE user_id=%s",
            (user_id,)
        )

        # 🔥 xóa conversations
        self.cursor.execute(
            "DELETE FROM conversations WHERE user_id=%s",
            (user_id,)
        )
    def close(self):

        if self.conn:
            self.conn.close()

    # ===============================
    # 🧠 USER MEMORY
    # ===============================
    def get_user_memory(self, user_id):
        self.cursor.execute(
            "SELECT profile FROM user_memory WHERE user_id=%s",
            (user_id,)
        )
        row = self.cursor.fetchone()

        if row and row.get("profile"):
            import json
            return json.loads(row["profile"])

        return {}


    def update_user_memory(self, user_id, profile):
        import json

        self.cursor.execute(
            """
            INSERT INTO user_memory (user_id, profile)
            VALUES (%s, %s)
            ON DUPLICATE KEY UPDATE profile=%s
            """,
            (user_id, json.dumps(profile), json.dumps(profile))
        )

    # ===============================
    # 🧠 CHAT FEEDBACK
    # ===============================
    def save_chat_feedback(self, user_id, conversation_id, log_id, rating, comment=None):
        self.cursor.execute(
            """
            INSERT OR REPLACE INTO chat_feedback (user_id, conversation_id, log_id, rating, comment)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (user_id, conversation_id, log_id, rating, comment)
        )

    def get_chat_feedback(self, conversation_id):
        self.cursor.execute(
            "SELECT * FROM chat_feedback WHERE conversation_id=%s ORDER BY created_at DESC",
            (conversation_id,)
        )
        return self.cursor.fetchall()

    # ===============================
    # 🧠 RAG DOCUMENT CHUNKS
    # ===============================
    def save_document_chunks(self, conversation_id, chunks_data):
        import json
        for chunk in chunks_data:
            self.cursor.execute(
                """
                INSERT INTO conversation_chunks (conversation_id, user_id, section_name, domain, source_type, chunk_index, token_count, content, embedding)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    conversation_id, 
                    chunk.get("user_id"), 
                    chunk.get("section_name", "General"),
                    chunk.get("domain", "general"),
                    chunk.get("source_type", "natal_chart_interpretation"),
                    chunk["chunk_index"], 
                    chunk.get("token_count", 0),
                    chunk["content"], 
                    json.dumps(chunk["embedding"])
                )
            )

    def replace_document_chunks(self, conversation_id, chunks_data):
        self.cursor.execute(
            "DELETE FROM conversation_chunks WHERE conversation_id=%s",
            (conversation_id,)
        )
        if chunks_data:
            self.save_document_chunks(conversation_id, chunks_data)

    def get_document_chunks(self, conversation_id):
        import json
        self.cursor.execute(
            "SELECT * FROM conversation_chunks WHERE conversation_id=%s ORDER BY chunk_index ASC",
            (conversation_id,)
        )
        rows = self.cursor.fetchall()
        
        result = []
        for row in rows:
            d = dict(row)
            if d.get("embedding"):
                try:
                    d["embedding"] = json.loads(d["embedding"])
                except:
                    pass
            result.append(d)
        return result

    def log_retrieval(self, conversation_id, query, retrieved_chunks):
        import json
        self.cursor.execute(
            """
            INSERT INTO retrieval_logs (conversation_id, query, retrieved_chunks)
            VALUES (%s, %s, %s)
            """,
            (conversation_id, query, json.dumps(retrieved_chunks))
        )




class UserDB(BaseDB):

    def save_otp(self, email, otp, expires_at_seconds=300):
        import datetime
        expires_at = datetime.datetime.now() + datetime.timedelta(seconds=expires_at_seconds)
        expires_str = expires_at.strftime('%Y-%m-%d %H:%M:%S')
        
        self.cursor.execute(
            "INSERT OR REPLACE INTO email_otps (email, otp, expires_at) VALUES (%s, %s, %s)",
            (email.strip().lower(), otp, expires_str)
        )

    def verify_otp(self, email, otp):
        import datetime
        now_str = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        self.cursor.execute(
            "SELECT otp FROM email_otps WHERE email=%s AND expires_at > %s",
            (email.strip().lower(), now_str)
        )
        row = self.cursor.fetchone()
        if row and row.get("otp") == otp:
            self.cursor.execute("DELETE FROM email_otps WHERE email=%s", (email.strip().lower(),))
            return True
        return False

    def get_all(self):

        self.cursor.execute("SELECT * FROM users")
        return self.cursor.fetchall()

    def get_by_username(self,username):

        self.cursor.execute(
            "SELECT * FROM users WHERE username=%s",
            (username,)
        )

        return self.cursor.fetchone()

    def get_by_email(self,email):

        self.cursor.execute(
            "SELECT * FROM users WHERE email=%s",
            (email,)
        )

        return self.cursor.fetchone()

    def add(self,username,password,email,is_admin=0):

        import hashlib

        email_hash=hashlib.md5(
            email.strip().lower().encode()
        ).hexdigest()

        picture_url=f"https://www.gravatar.com/avatar/{email_hash}?d=identicon"

        self.cursor.execute(
            """INSERT INTO users
            (username,password,email,is_admin,token_balance,picture_url)
            VALUES (%s,%s,%s,%s,%s,%s)""",
            (username,password,email,is_admin,10,picture_url)
        )

        return self.cursor.lastrowid

    def change_token_balance(self,user_id,amount,description,tx_type):

        self.cursor.execute(
            "UPDATE users SET token_balance=token_balance+%s WHERE id=%s",
            (amount if tx_type=='in' else -amount,user_id)
        )

        self.cursor.execute(
            """INSERT INTO token_history
            (user_id,type,amount,description)
            VALUES (%s,%s,%s,%s)""",
            (user_id,tx_type,amount,description)
        )

        self.cursor.execute(
            "SELECT token_balance FROM users WHERE id=%s",
            (user_id,)
        )

        row=self.cursor.fetchone()

        return row["token_balance"] if row else None
        # ---------------- TOKEN HISTORY ----------------

    def get_token_history(self, user_id):
        self.cursor.execute(
            "SELECT * FROM token_history WHERE user_id=%s ORDER BY created_at DESC",
            (user_id,)
        )
        return self.cursor.fetchall()


    def get_all_token_history(self):

        query = """
        SELECT th.*, u.username, u.email
        FROM token_history th
        JOIN users u ON th.user_id = u.id
        ORDER BY th.created_at DESC
        """

        self.cursor.execute(query)

        return self.cursor.fetchall()


    # ---------------- PACKAGES ----------------

    def get_packages(self):

        self.cursor.execute(
            "SELECT * FROM packages ORDER BY amount_vnd ASC"
        )

        return self.cursor.fetchall()


    def add_package(self, name, tokens, amount_vnd):

        self.cursor.execute(
            "INSERT INTO packages (name, tokens, amount_vnd) VALUES (%s,%s,%s)",
            (name, tokens, amount_vnd)
        )


    def delete_package(self, package_id):

        self.cursor.execute(
            "DELETE FROM packages WHERE id=%s",
            (package_id,)
        )


    def update_package(self, package_id, name, tokens, amount_vnd):

        self.cursor.execute(
            "UPDATE packages SET name=%s, tokens=%s, amount_vnd=%s WHERE id=%s",
            (name, tokens, amount_vnd, package_id)
        )


    # ---------------- PAYMENTS ----------------

    def create_payment(self, user_id, package_id, amount_vnd, tokens):

        self.cursor.execute(
            """INSERT INTO payments
            (user_id, package_id, amount_vnd, tokens)
            VALUES (%s,%s,%s,%s)""",
            (user_id, package_id, amount_vnd, tokens)
        )

        return self.cursor.lastrowid


    def get_payment(self, payment_id):

        self.cursor.execute(
            "SELECT * FROM payments WHERE id=%s",
            (payment_id,)
        )

        row = self.cursor.fetchone()

        return dict(row) if row else None


    def get_payment_by_sepay_id(self, sepay_id):

        self.cursor.execute(
            "SELECT * FROM payments WHERE sepay_id=%s",
            (sepay_id,)
        )

        row = self.cursor.fetchone()

        return dict(row) if row else None


    def update_payment_status(self, payment_id, status, sepay_id=None):

        if sepay_id:

            self.cursor.execute(
                "UPDATE payments SET status=%s, sepay_id=%s WHERE id=%s",
                (status, sepay_id, payment_id)
            )

        else:

            self.cursor.execute(
                "UPDATE payments SET status=%s WHERE id=%s",
                (status, payment_id)
            )


    def get_pending_payments(self):

        self.cursor.execute(
            "SELECT * FROM payments WHERE status='pending'"
        )

        return self.cursor.fetchall()


    def get_all_payments(self):

        query = """
        SELECT p.*, u.username, u.email
        FROM payments p
        JOIN users u ON p.user_id = u.id
        ORDER BY p.created_at DESC
        """

        self.cursor.execute(query)

        return self.cursor.fetchall()


    # ---------------- PAYMENT REPORT ----------------

    def create_payment_report(self, report_code, user_id, title, report_type, invoice_code, transaction_code, description, attachment_url, payment_id=None):
        self.cursor.execute(
            """INSERT INTO payment_reports
            (report_code, user_id, title, report_type, invoice_code, transaction_code, description, attachment_url, payment_id, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 'pending')""",
            (report_code, user_id, title, report_type, invoice_code, transaction_code, description, attachment_url, payment_id)
        )
        return self.cursor.lastrowid


    def get_all_payment_reports(self):

        query = """
        SELECT pr.*, u.username, u.email
        FROM payment_reports pr
        JOIN users u ON pr.user_id = u.id
        ORDER BY pr.created_at DESC
        """

        self.cursor.execute(query)

        return self.cursor.fetchall()


    def update_payment_report_status(self, report_id, status, admin_note=None, adjustment_type=None, token_amount=None, resolved_at=None):
        self.cursor.execute(
            """UPDATE payment_reports 
            SET status=%s, admin_note=%s, adjustment_type=%s, token_amount=%s, resolved_at=%s 
            WHERE id=%s""",
            (status, admin_note, adjustment_type, token_amount, resolved_at, report_id)
        )

    def get_payment_report(self, report_id):
        query = """
        SELECT pr.*, u.username, u.email, u.full_name, u.token_balance
        FROM payment_reports pr
        JOIN users u ON pr.user_id = u.id
        WHERE pr.id = %s
        """
        self.cursor.execute(query, (report_id,))
        row = self.cursor.fetchone()
        return dict(row) if row else None
    def delete_user(self, user_id):

        # xóa theo thứ tự FK

        self.cursor.execute("DELETE FROM user_memory WHERE user_id=%s", (user_id,))
        self.cursor.execute("DELETE FROM chat_logs WHERE user_id=%s", (user_id,))
        self.cursor.execute("DELETE FROM conversations WHERE user_id=%s", (user_id,))
        self.cursor.execute("DELETE FROM token_history WHERE user_id=%s", (user_id,))
        self.cursor.execute("DELETE FROM payments WHERE user_id=%s", (user_id,))
        self.cursor.execute("DELETE FROM payment_reports WHERE user_id=%s", (user_id,))
        self.cursor.execute("DELETE FROM login_logs WHERE user_id=%s", (user_id,))
        self.cursor.execute("DELETE FROM users WHERE id=%s", (user_id,))

    def update_user_info(self, user_id, username=None, email=None, is_admin=None, full_name=None, picture_url=None):

        fields = []
        values = []

        if username is not None:
            fields.append("username=%s")
            values.append(username)

        if email is not None:
            fields.append("email=%s")
            values.append(email)

        if full_name is not None:
            fields.append("full_name=%s")
            values.append(full_name)

        if picture_url is not None:
            fields.append("picture_url=%s")
            values.append(picture_url)

        if is_admin is not None:
            fields.append("is_admin=%s")
            values.append(int(is_admin))

        if not fields:
            return

        values.append(user_id)

        query = f"""
            UPDATE users
            SET {",".join(fields)}
            WHERE id=%s
        """

        self.cursor.execute(query, tuple(values))

    def update_user_password(self, user_id, hashed_password):

        self.cursor.execute(
            "UPDATE users SET password=%s WHERE id=%s",
            (hashed_password, user_id)
        ) 
    
    def update_or_create_google_user(self, email, name, picture):
        # 1. Check user theo email
        self.cursor.execute(
            "SELECT * FROM users WHERE email=%s",
            (email,)
        )
        user = self.cursor.fetchone()

        if user:
            # 2. Nếu đã tồn tại → update info
            self.cursor.execute("""
                UPDATE users
                SET full_name=%s, picture_url=%s
                WHERE email=%s
            """, (name, picture, email))

            # lấy lại user mới nhất
            self.cursor.execute(
                "SELECT * FROM users WHERE email=%s",
                (email,)
            )
            return self.cursor.fetchone()

        else:
            # 3. Nếu chưa có → tạo user mới
            username = email.split("@")[0]

            self.cursor.execute("""
                INSERT INTO users
                (username, email, full_name, picture_url, password, is_admin, token_balance)
                VALUES (%s,%s,%s,%s,%s,%s,%s)
            """, (
                username,
                email,
                name,
                picture,
                None,   # Google không cần password
                0,
                10      # cho sẵn 10 token luôn cho đẹp 😎
            ))

            # lấy user vừa tạo
            self.cursor.execute(
                "SELECT * FROM users WHERE email=%s",
                (email,)
            )
            return self.cursor.fetchone()

    # ---------------- SUPPORT SYSTEM ----------------

    def get_or_create_support_conversation(self, user_id):
        self.cursor.execute(
            "SELECT * FROM support_conversations WHERE user_id = %s AND status = 'open'",
            (user_id,)
        )
        row = self.cursor.fetchone()
        if row:
            return dict(row)
        
        # Create new conversation
        self.cursor.execute(
            "INSERT INTO support_conversations (user_id, status) VALUES (%s, 'open')",
            (user_id,)
        )
        conv_id = self.cursor.lastrowid
        self.cursor.execute(
            "SELECT * FROM support_conversations WHERE id = %s",
            (conv_id,)
        )
        new_row = self.cursor.fetchone()
        return dict(new_row) if new_row else None

    def get_support_messages(self, conversation_id):
        self.cursor.execute(
            "SELECT * FROM support_messages WHERE conversation_id = %s ORDER BY created_at ASC",
            (conversation_id,)
        )
        return self.cursor.fetchall()

    def add_support_message(self, conversation_id, sender_type, sender_id, message):
        self.cursor.execute(
            """INSERT INTO support_messages (conversation_id, sender_type, sender_id, message)
               VALUES (%s, %s, %s, %s)""",
            (conversation_id, sender_type, sender_id, message)
        )
        message_id = self.cursor.lastrowid
        
        # Update last_message and last_message_at in conversation
        import datetime
        now = datetime.datetime.now()
        self.cursor.execute(
            """UPDATE support_conversations
               SET last_message = %s, last_message_at = %s, status = 'open'
               WHERE id = %s""",
            (message, now, conversation_id)
        )
        return message_id

    def get_all_support_conversations(self):
        query = """
            SELECT sc.*, u.username, u.email, u.full_name, u.picture_url
            FROM support_conversations sc
            JOIN users u ON sc.user_id = u.id
            ORDER BY sc.last_message_at DESC, sc.created_at DESC
        """
        self.cursor.execute(query)
        return self.cursor.fetchall()

    def resolve_support_conversation(self, conversation_id):
        self.cursor.execute(
            "UPDATE support_conversations SET status = 'resolved' WHERE id = %s",
            (conversation_id,)
        )

class ChatHistoryDB(BaseDB):
    def add_message(self, conversation_id, role, content, tokens_charged=0):
        """
        Lưu tin nhắn vào lịch sử chat. 
        Vì cấu trúc table chat_logs yêu cầu cả question và answer, 
        chúng ta sẽ lưu role='user' vào question và role='assistant' vào answer.
        """
        # Lấy user_id từ conversation_id
        self.cursor.execute("SELECT user_id FROM conversations WHERE id=%s", (conversation_id,))
        row = self.cursor.fetchone()
        if not row:
            return
            
        user_id = row['user_id']
        
        if role == 'user':
            self.save_chat_log(
                user_id=user_id,
                conversation_id=conversation_id,
                question=content,
                answer="",
                tokens_charged=tokens_charged,
                chart=None
            )
        else:
            # Tìm tin nhắn 'user' gần nhất chưa có câu trả lời để cập nhật hoặc tạo mới
            # Ở đây để đơn giản và phù hợp với logic 'add_message' gọi 2 lần, 
            # chúng ta sẽ cho phép answer trống hoặc question trống.
            self.save_chat_log(
                user_id=user_id,
                conversation_id=conversation_id,
                question="",
                answer=content,
                tokens_charged=tokens_charged,
                chart=None
            )
