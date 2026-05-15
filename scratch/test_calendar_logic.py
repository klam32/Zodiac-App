import json
import re

def surgical_repair(raw_json):
    raw_json = re.sub(r"[\u200b-\u200d\ufeff\u0000-\u0009\u000b-\u001f]", " ", raw_json)
    raw_json = re.sub(r",\s*([\]\}])", r"\1", raw_json)
    for field in ["reason", "summary"]:
        pattern = f'("{field}"\\s*:\\s*")(.*?)("(?=\\s*[,\\}}\\]]))'
        raw_json = re.sub(pattern, lambda m: m.group(1) + m.group(2).replace('"', '\\"') + m.group(3), raw_json, flags=re.DOTALL)
    return raw_json

def regex_harvest(text):
    days = []
    day_pattern = r'\{\s*"day"\s*:\s*(\d+).*?"quality"\s*:\s*"(good|bad|neutral)".*?"reason"\s*:\s*"(.*?)"\s*\}'
    day_matches = re.finditer(day_pattern, text, re.DOTALL)
    for m in day_matches:
        days.append({"day": int(m.group(1)), "quality": m.group(2), "reason": m.group(3).strip()})
    
    summary = ""
    summary_match = re.search(r'"summary"\s*:\s*"(.*?)"(?=\s*\}|\s*$)', text, re.DOTALL)
    if summary_match:
        summary = summary_match.group(1).strip()
    return days, summary

# Disaster case: Totally broken JSON structure but content exists
disaster_content = """
Here is the calendar:
{
  "days": [
    {"day": 1, "quality": "good", "reason": "This is a "badly" quoted reason},
    {"day": 2, "quality": "neutral", "reason": "Missing quote here
  ],
  "summary": "This summary is also "broken" but we want it."
}
"""

print("--- Testing Disaster Content ---")
repaired = surgical_repair(disaster_content)
try:
    json.loads(repaired)
    print("Parsed as JSON!")
except:
    print("JSON failed, harvesting...")
    days, summary = regex_harvest(disaster_content)
    print(f"Harvested {len(days)} days.")
    print(f"Summary: {summary}")

# Real-world long content simulation
long_content = '{"days": [' + ','.join([f'{{"day": {i}, "quality": "good", "reason": "Reason for day {i}"}}' for i in range(1, 31)]) + '], "summary": "Full month summary"}'
print("\n--- Testing Long Content ---")
try:
    json.loads(long_content)
    print("Long content OK")
except:
    print("Long content failed")
