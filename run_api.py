import os
import re
import subprocess

# Ép kiểu encoding UTF-8 cho console Windows
os.environ["PYTHONIOENCODING"] = "utf-8"

def get_ngrok_domain_from_env():
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    if not os.path.exists(env_path):
        return None
    try:
        with open(env_path, "r", encoding="utf-8") as f:
            content = f.read()
        
        # Tìm domain ngrok trong GOOGLE_REDIRECT_URI hoặc ALLOW_ORIGINS
        match = re.search(r"https://([^/:\s\"',]+ngrok-free\.dev)", content)
        if match:
            return match.group(1)
        
        match = re.search(r"https://([^/:\s\"',]+ngrok\.io)", content)
        if match:
            return match.group(1)
    except Exception as e:
        print(f"[RunAPI] Lỗi khi đọc tệp .env: {e}")
    return None

if __name__ == "__main__":
    domain = get_ngrok_domain_from_env()
    
    if domain:
        print("=" * 60)
        print(f"🚀 PHÁT HIỆN TÊN MIỀN NGROK TRONG .ENV: {domain}")
        print("💡 Đang khởi chạy ngrok trong một cửa sổ terminal mới...")
        print("=" * 60)
        try:
            # Chạy ngrok trong cửa sổ Command Prompt mới trên Windows để hiển thị log riêng biệt
            creation_flags = subprocess.CREATE_NEW_CONSOLE if os.name == 'nt' else 0
            subprocess.Popen(
                ["ngrok", "http", f"--domain={domain}", "2643"],
                creationflags=creation_flags
            )
        except Exception as e:
            print(f"❌ Không thể chạy ngrok tự động: {e}")
    else:
        print("=" * 60)
        print("⚠️ Không tìm thấy tên miền ngrok trong tệp .env.")
        print("💡 Chỉ khởi chạy uvicorn FastAPI backend...")
        print("=" * 60)

    # Chạy FastAPI backend bằng uvicorn
    subprocess.run(["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "2643", "--reload"])

