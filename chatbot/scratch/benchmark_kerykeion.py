import time
from kerykeion import AstrologicalSubject

t0 = time.time()
subject = AstrologicalSubject(
    "Test User",
    2000, 1, 1, 12, 0,
    city="Hanoi",
    nation="VN",
    lat=21.0285,
    lng=105.8542,
    tz_str="Asia/Ho_Chi_Minh",
    online=False
)
t1 = time.time()
print(f"AstrologicalSubject with online=False and tz_str took: {t1 - t0:.6f} seconds")
print(f"Sun Sign: {subject.sun.sign}")
