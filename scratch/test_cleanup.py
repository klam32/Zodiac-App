import re
import sys
import io

# Set stdout to UTF-8
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def final_cleanup(text):
    # Nếu là list (AI trả về mảng các ý), gộp lại thành văn bản Markdown
    if isinstance(text, list):
        formatted_parts = []
        for item in text:
            if isinstance(item, dict):
                title = item.get('title') or item.get('heading') or ""
                points = item.get('points') or item.get('items') or []
                if title:
                    formatted_parts.append(f"### {title}")
                if isinstance(points, list):
                    for p in points:
                        formatted_parts.append(f"* {p}")
                elif points:
                    formatted_parts.append(f"* {points}")
                
                # Trường hợp dict không có title/points nhưng có nội dung khác
                if not title and not points:
                    formatted_parts.append(str(item))
            else:
                formatted_parts.append(str(item))
        text = "\n\n".join(formatted_parts)
        
    text = str(text or "").strip()
    if not text: return ""
    
    # Xóa các key JSON phổ biến nếu còn sót do lỗi bóc tách
    text = re.sub(r'"score":\s*\d+,?', "", text)
    text = re.sub(r'"cosmic_message":\s*".*?",?', "", text, flags=re.DOTALL)
    text = re.sub(r'"content":\s*"', "", text)
    
    # Chỉ xóa ngoặc nhọn nếu nó bao quanh toàn bộ nội dung (dấu hiệu JSON chưa sạch)
    if text.startswith('{') and text.endswith('}'):
        text = text[1:-1].strip()
    
    # Làm sạch các dấu ngoặc kép dư thừa ở đầu/cuối
    text = text.strip().strip('"').strip("'")
    # Xử lý các ký tự xuống dòng bị escape
    text = text.replace("\\n", "\n")
    
    return text.strip()

# Test Case 1: List of objects (the issue reported)
test1 = [
    {'title': 'Tác động chính', 'points': ['Sao Thổ...', 'Sao Hỏa...']},
    {'title': 'Cơ hội', 'points': ['Cơ hội 1']}
]
print("Test 1 Result:")
print(final_cleanup(test1))
print("-" * 20)

# Test Case 2: String with escaped newlines and JSON leftovers
test2 = '{"content": "Dòng 1\\nDòng 2"}'
print("Test 2 Result:")
print(final_cleanup(test2))
print("-" * 20)

# Test Case 3: Plain Markdown string
test3 = "### Hello\n* Item 1"
print("Test 3 Result:")
print(final_cleanup(test3))
