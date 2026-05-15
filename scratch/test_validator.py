import re
import json
import sys
import io

# Set stdout to UTF-8
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def validator_run(text):
    if not text: return ""

    # 1. Clear JSON strings if exist
    text = text.strip()
    
    # 🛡️ Robust Extraction
    chart_match = re.search(r'"chart"\s*:\s*"(.*?)"(?:\s*,|\s*\})', text, re.DOTALL)
    answer_match = re.search(r'"answer"\s*:\s*"(.*?)"(?:\s*,|\s*\})', text, re.DOTALL)
    
    if chart_match:
        text = chart_match.group(1)
    elif answer_match:
        text = answer_match.group(1)
    elif text.startswith('{') and ('"chart"' in text or '"answer"' in text):
        try:
            data = json.loads(text)
            text = data.get("chart", data.get("answer", text))
        except: pass
    
    # Mock _llm_refine for now (just returns text)
    refined = text
    
    # 3. Final Post-process
    refined = refined.replace("\\n", "\n")
    refined = re.sub(r"\n{3,}", "\n\n", refined)
    
    return refined.strip()

# Test Case 1: Messy JSON from screenshot
test1 = '{"chart": "# LUẬN GIẢI BẢN ĐỒ SAO - Nguyễn Quốc Đạt\\n\\nNội dung luận giải..."}'
print("Test 1 Result:")
print(validator_run(test1))
print("-" * 20)

# Test Case 2: JSON with extra text around it
test2 = 'Đây là kết quả: {"chart": "Nội dung sạch", "answer": "Câu trả lời"}'
print("Test 2 Result:")
print(validator_run(test2))
print("-" * 20)

# Test Case 3: Messy JSON with unescaped quotes (regex should catch it)
test3 = '{"chart": "Nội dung có "ngoặc kép" bên trong", "answer": "..."}'
print("Test 3 Result:")
print(validator_run(test3))
