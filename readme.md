# Zodiac Whisper - Trí Tuệ Chiêm Tinh AI

Dự án chatbot luận giải Chiêm tinh (Astrology) cá nhân hóa, kết hợp giữa thuật toán tính toán tinh tú chính xác và sức mạnh của các mô hình ngôn ngữ lớn (LLM).

## 🔮 Tính năng chính
- **Bản đồ sao cá nhân (Natal Chart):** Tự động tính toán và vẽ bản đồ sao SVG dựa trên thông tin ngày giờ và nơi sinh chính xác.
- **Hệ thống Đa Đại lý (Multi-Agent System):**
    - **Astrology Agent:** Phân tích tổng quan bản đồ sao.
    - **Career Agent:** Tư vấn sự nghiệp và định hướng công việc.
    - **Love Agent:** Luận giải tình duyên và độ tương hợp (Synastry).
    - **Health Agent:** Cảnh báo và lời khuyên về sức khỏe.
    - **Daily Agent:** Dự đoán vận trình năng lượng hàng ngày.
- **Phân tích Tương hợp:** So sánh bản đồ sao giữa hai người để đánh giá mức độ hòa hợp.
- **Quản lý Tokens & Bộ nhớ:** Hệ thống ghi nhớ ngữ cảnh người dùng và quản lý số dư token thông minh.

## 🛠 Công nghệ sử dụng
- **Backend:** FastAPI, LangChain, LangGraph, SQLite.
- **Astrology Core:** [Kerykeion](https://github.com/Gue9X/Kerykeion) (Dựa trên Swiss Ephemeris).
- **Frontend:** React, Tailwind CSS, Lucide Icons.
- **LLM:** Hỗ trợ Google Gemini (mặc định), OpenAI, và Local LLM.

## 🚀 Hướng dẫn cài đặt
1. Cấu hình biến môi trường trong file `.env` (API Keys, DB Config).
2. Cài đặt thư viện Python:
   ```bash
   pip install -r requirements.txt
   ```
3. Khởi chạy Backend:
   ```bash
   python run_api.py
   ```
4. Khởi chạy Frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
## 📐 Sơ đồ Hệ thống (Pipeline)
Để xem sơ đồ pipeline của hệ thống bằng **PlantUML**, bạn có thể:
1. Mở file `system_pipeline.puml` bằng VS Code và nhấn `Alt + D` để xem trực tiếp (nếu cài extension PlantUML).
2. Hoặc chạy lệnh để xuất ra ảnh (yêu cầu Java và PlantUML jar):
```bash
java -jar plantuml.jar system_pipeline.puml
```
Hoặc đơn giản là copy nội dung file `system_pipeline.puml` và dán vào [PlantUML Online Server](http://www.plantuml.com/plantuml/).

#
1.cloudflared tunnel --url http://localhost:2643