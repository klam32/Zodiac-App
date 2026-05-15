import subprocess
import re
import sys
import os
import time

def run_command(command, cwd=None):
    print(f"Executing: {command}")
    # Use shell=True for Windows to handle commands properly
    return subprocess.run(command, shell=True, cwd=cwd)

def main():
    print("🚀 Đang khởi tạo Cloudflare Tunnel...")
    
    # Check if cloudflared is installed
    try:
        subprocess.run(['cloudflared', '--version'], check=True, capture_output=True)
    except:
        print("❌ Lỗi: Chưa cài đặt cloudflared hoặc chưa thêm vào PATH.")
        return

    # Chạy cloudflared và lấy output
    process = subprocess.Popen(
        ['cloudflared', 'tunnel', '--url', 'http://localhost:2643'],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )

    tunnel_url = None
    # Đọc output để tìm link .trycloudflare.com
    # Thường mất khoảng vài giây để link hiện ra
    start_time = time.time()
    for line in process.stdout:
        print(line, end='')
        match = re.search(r'https://[a-z0-9-]+\.trycloudflare\.com', line)
        if match:
            tunnel_url = match.group(0)
            print(f"\n✅ Đã tìm thấy URL mới: {tunnel_url}")
            break
        
        # Timeout sau 30 giây nếu không thấy link
        if time.time() - start_time > 30:
            break
    
    if not tunnel_url:
        print("\n❌ Không tìm thấy URL Cloudflare sau 30s. Vui lòng kiểm tra lại terminal!")
        process.terminate()
        return

    # 1. Cập nhật file .env (Gốc)
    print("\n📝 Đang cập nhật file .env...")
    if os.path.exists('.env'):
        with open('.env', 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        with open('.env', 'w', encoding='utf-8') as f:
            for line in lines:
                if line.strip().startswith('GOOGLE_REDIRECT_URI='):
                    f.write(f'GOOGLE_REDIRECT_URI={tunnel_url}/api/v1/auth/google/callback\n')
                else:
                    f.write(line)
        print("✅ Đã cập nhật .env")
    else:
        print("⚠️ Cảnh báo: Không tìm thấy file .env")

    # 2. Cập nhật Vercel (Yêu cầu đã cài Vercel CLI và Login)
    print("\n☁️ Đang cập nhật biến môi trường Vercel...")
    run_command(f'vercel env rm VITE_API_URL production -y', cwd='frontend')
    
    # Sử dụng subprocess.run với input để tránh lỗi whitespace và quotes từ lệnh echo của shell
    subprocess.run(['vercel', 'env', 'add', 'VITE_API_URL', 'production'], 
                   input=tunnel_url, 
                   text=True, 
                   cwd='frontend', 
                   shell=True)
    
    # 3. Cập nhật thêm vào file .env.production của frontend cho đồng bộ
    print("\n📝 Đang cập nhật file frontend/.env.production...")
    with open('frontend/.env.production', 'w', encoding='utf-8') as f:
        f.write(f'VITE_API_URL={tunnel_url}\n')
    print("✅ Đã cập nhật frontend/.env.production")
    
    print("\n📦 Đang Deploy lại Frontend lên Vercel...")
    run_command('vercel --prod', cwd='frontend')

    print("\n" + "="*70)
    print(f"🎉 TẤT CẢ ĐÃ XONG!")
    print(f"🔗 Backend URL: {tunnel_url}")
    print(f"🔗 Vercel URL: https://frontend-omega-pink-49.vercel.app")
    print(f"\n👉 BƯỚC CUỐI CÙNG (BẮT BUỘC):")
    print(f"   Copy link dưới đây dán vào 'Authorized redirect URIs' trên Google Console:")
    print(f"   {tunnel_url}/api/v1/auth/google/callback")
    print("="*70 + "\n")
    print("Giữ cửa sổ này để duy trì Tunnel. Nhấn Ctrl+C để tắt.")

    # Tiếp tục in ra logs của cloudflared
    try:
        for line in process.stdout:
            print(line, end='')
    except KeyboardInterrupt:
        process.terminate()
        print("\n👋 Đã đóng Tunnel.")

if __name__ == "__main__":
    main()
