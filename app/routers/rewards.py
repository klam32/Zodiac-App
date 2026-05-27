from fastapi import APIRouter, Depends, HTTPException
from app.security.security import get_current_user
from app.models.base_db import UserDB
from pydantic import BaseModel
import asyncio
import json
import hashlib
from datetime import datetime, timedelta, timezone

router = APIRouter(prefix="/rewards", tags=["Rewards"])

# ----------------- ASTROLOGY QUIZ DATABASE -----------------
ASTROLOGY_QUESTIONS = [
    {
        "id": 1,
        "question": "Bạch Dương (Aries) thuộc nguyên tố nào trong Chiêm tinh học?",
        "options": ["A. Lửa", "B. Đất", "C. Khí", "D. Nước"],
        "correct": "A",
        "explanation": "Bạch Dương là cung hoàng đạo đầu tiên trên vòng tròn hoàng đạo, thuộc nguyên tố Lửa cùng với Sư Tử và Nhân Mã."
    },
    {
        "id": 2,
        "question": "Hành tinh nào cai trị cung Song Tử (Gemini) và Xử Nữ (Virgo)?",
        "options": ["A. Sao Kim", "B. Sao Hỏa", "C. Sao Thủy", "D. Sao Mộc"],
        "correct": "C",
        "explanation": "Sao Thủy (Mercury) đại diện cho giao tiếp, trí tuệ, suy nghĩ, là hành tinh chủ quản của cả Song Tử và Xử Nữ."
    },
    {
        "id": 3,
        "question": "Nhà (House) thứ mấy trong bản đồ sao cá nhân đại diện cho sự nghiệp, danh vọng và địa vị xã hội?",
        "options": ["A. Nhà 4", "B. Nhà 7", "C. Nhà 10", "D. Nhà 12"],
        "correct": "C",
        "explanation": "Nhà 10 (Midheaven - MC) đại diện cho đỉnh cao sự nghiệp, danh tiếng và sự công nhận của xã hội."
    },
    {
        "id": 4,
        "question": "Cung hoàng đạo nào có biểu tượng là con cua, thuộc nguyên tố Nước?",
        "options": ["A. Cự Giải", "B. Bọ Cạp", "C. Song Ngư", "D. Kim Ngưu"],
        "correct": "A",
        "explanation": "Cự Giải (Cancer) có biểu tượng là con Cua, mang năng lượng bảo bọc, nhạy cảm và hướng về gia đình."
    },
    {
        "id": 5,
        "question": "Trong bản đồ sao, thiên thể nào đại diện cho cảm xúc, trực giác và thế giới nội tâm sâu kín?",
        "options": ["A. Mặt Trời", "B. Mặt Trăng", "C. Sao Kim", "D. Sao Thổ"],
        "correct": "B",
        "explanation": "Mặt Trăng (Moon Sign) biểu thị thế giới cảm xúc, phản xạ tự nhiên và nhu cầu an toàn nội tâm của con người."
    },
    {
        "id": 6,
        "question": "Sao Thổ (Saturn) trong Chiêm tinh học mang ý nghĩa chủ đạo nào sau đây?",
        "options": ["A. Sự may mắn và mở rộng", "B. Tình yêu và nghệ thuật", "C. Sự kỷ luật, bài học nghiệp quả và giới hạn", "D. Sự đột phá và nổi loạn"],
        "correct": "C",
        "explanation": "Sao Thổ đại diện cho thời gian, giới hạn, kỷ luật, trách nhiệm và những bài học nghiệp quả trong cuộc sống."
    },
    {
        "id": 7,
        "question": "Cung Mọc (Ascendant / AC) thể hiện điều gì ở một người?",
        "options": ["A. Bản ngã và lý trí sâu xa", "B. Chiếc mặt nạ xã hội, cách hành xử và ấn tượng đầu tiên", "C. Cách yêu thương và thu hút tài lộc", "D. Những nỗi sợ tiềm thức sâu thẳm"],
        "correct": "B",
        "explanation": "Cung Mọc đại diện cho chiếc mặt nạ bạn đeo khi giao tiếp với xã hội, ngoại hình và ấn tượng đầu tiên đối với người khác."
    },
    {
        "id": 8,
        "question": "Góc chiếu (Aspect) 120 độ giữa hai hành tinh mang lại năng lượng như thế nào?",
        "options": ["A. Xung đột và căng thẳng dữ dội", "B. Hài hòa, trôi chảy và hỗ trợ tự nhiên (Góc Tam hợp)", "C. Đối nghịch và mâu thuẫn cần giải quyết", "D. Sự xa cách và lạnh nhạt"],
        "correct": "B",
        "explanation": "Góc Tam hợp (Trine - 120 độ) là góc chiếu cực kỳ may mắn, đem lại sự trôi chảy, hài hòa và tài năng thiên bẩm."
    },
    {
        "id": 9,
        "question": "Cung hoàng đạo nào thuộc nhóm tính chất Biến đổi (Mutable), nguyên tố Nước?",
        "options": ["A. Cự Giải", "B. Song Ngư", "C. Bọ Cạp", "D. Song Tử"],
        "correct": "B",
        "explanation": "Song Ngư (Pisces) là cung hoàng đạo thuộc nhóm tính chất Biến đổi và thuộc nguyên tố Nước, đại diện cho lòng trắc ẩn và sự bao dung."
    },
    {
        "id": 10,
        "question": "Hành tinh nào đại diện cho tình yêu, sắc đẹp, nghệ thuật và các giá trị tài chính?",
        "options": ["A. Sao Kim", "B. Sao Hỏa", "C. Sao Diêm Vương", "D. Sao Mộc"],
        "correct": "A",
        "explanation": "Sao Kim (Venus) là hành tinh của sự thu hút, tình yêu, cái đẹp, nghệ thuật và mối quan hệ lãng mạn."
    },
    {
        "id": 11,
        "question": "Nhà 8 (House 8) trong chiêm tinh học KHÔNG liên quan đến khía cạnh nào dưới đây?",
        "options": ["A. Tiền bạc của người khác / tài sản chung", "B. Sự lột xác, cái chết và tái sinh", "C. Sức khỏe thể chất hàng ngày và thói quen làm việc", "D. Tâm linh, huyền học và bí ẩn tâm lý"],
        "correct": "C",
        "explanation": "Sức khỏe thể chất hàng ngày và thói quen làm việc thuộc quản lý của Nhà 6. Nhà 8 liên quan đến tài sản chung, sự lột xác và tâm linh sâu sắc."
    },
    {
        "id": 12,
        "question": "Hành tinh nào có chu kỳ quay quanh Mặt Trời lâu nhất (khoảng 248 năm)?",
        "options": ["A. Sao Thiên Vương", "B. Sao Hải Vương", "C. Sao Thổ", "D. Sao Diêm Vương"],
        "correct": "D",
        "explanation": "Sao Diêm Vương (Pluto) có quỹ đạo xa nhất và chu kỳ quay lâu nhất trên vòng tròn hoàng đạo (248 năm), đại diện cho sự tái sinh và chuyển hóa sâu sắc."
    },
    {
        "id": 13,
        "question": "Cung hoàng đạo nào có biểu tượng là người bắn cung, thuộc nguyên tố Lửa?",
        "options": ["A. Nhân Mã", "B. Sư Tử", "C. Bạch Dương", "D. Song Tử"],
        "correct": "A",
        "explanation": "Nhân Mã (Sagittarius) có biểu tượng là Nhân Mã cầm cung tên, tràn đầy đam mê phiêu lưu, lạc quan và triết lý."
    },
    {
        "id": 14,
        "question": "Sao Mộc (Jupiter) cai quản cung hoàng đạo nào?",
        "options": ["A. Ma Kết", "B. Nhân Mã", "C. Bọ Cạp", "D. Kim Ngưu"],
        "correct": "B",
        "explanation": "Sao Mộc là hành tinh của sự mở rộng, may mắn và trí tuệ cao quý, là hành tinh chủ quản của cung Nhân Mã."
    },
    {
        "id": 15,
        "question": "Nhóm cung hoàng đạo Kiên định (Fixed Signs) bao gồm những cung nào?",
        "options": ["A. Bạch Dương, Cự Giải, Thiên Bình, Ma Kết", "B. Kim Ngưu, Sư Tử, Bọ Cạp, Bảo Bình", "C. Song Tử, Xử Nữ, Nhân Mã, Song Ngư", "D. Bạch Dương, Sư Tử, Nhân Mã, Kim Ngưu"],
        "correct": "B",
        "explanation": "Nhóm Kiên định bao gồm Kim Ngưu, Sư Tử, Bọ Cạp và Bảo Bình - đại diện cho sự kiên trì, vững vàng và trung thành."
    }
]

# ----------------- REWARDS DATABASE OPERATION CLASS -----------------
class RewardsDB(UserDB):
    def get_checkin_record(self, user_id: int, date_str: str):
        self.cursor.execute(
            "SELECT * FROM daily_checkins WHERE user_id=%s AND checkin_date=%s",
            (user_id, date_str)
        )
        return self.cursor.fetchone()

    def get_last_checkin(self, user_id: int):
        self.cursor.execute(
            "SELECT * FROM daily_checkins WHERE user_id=%s ORDER BY checkin_date DESC LIMIT 1",
            (user_id,)
        )
        return self.cursor.fetchone()

    def add_checkin_record(self, user_id: int, date_str: str, streak: int):
        self.cursor.execute(
            "INSERT INTO daily_checkins (user_id, checkin_date, streak) VALUES (%s, %s, %s)",
            (user_id, date_str, streak)
        )

    def get_quiz_record(self, user_id: int, date_str: str):
        self.cursor.execute(
            "SELECT * FROM daily_quizzes WHERE user_id=%s AND quiz_date=%s",
            (user_id, date_str)
        )
        return self.cursor.fetchone()

    def create_quiz_record(self, user_id: int, date_str: str, answers_json: str):
        self.cursor.execute(
            "INSERT INTO daily_quizzes (user_id, quiz_date, answers_json) VALUES (%s, %s, %s)",
            (user_id, date_str, answers_json)
        )

    def update_quiz_record(self, user_id: int, date_str: str, questions_answered: int, correct_answers: int, answers_json: str):
        self.cursor.execute(
            """
            UPDATE daily_quizzes 
            SET questions_answered=%s, correct_answers=%s, answers_json=%s
            WHERE user_id=%s AND quiz_date=%s
            """,
            (questions_answered, correct_answers, answers_json, user_id, date_str)
        )

    def claim_quiz_milestone(self, user_id: int, date_str: str, milestone: int):
        field = "claimed_3_correct" if milestone == 3 else "claimed_5_correct"
        self.cursor.execute(
            f"UPDATE daily_quizzes SET {field}=1 WHERE user_id=%s AND quiz_date=%s",
            (user_id, date_str)
        )

# ----------------- UTILS -----------------
def get_vietnam_date() -> str:
    vn_tz = timezone(timedelta(hours=7))
    return datetime.now(vn_tz).strftime("%Y-%m-%d")

def get_daily_questions(date_str: str):
    hash_val = int(hashlib.sha256(date_str.encode()).hexdigest(), 16)
    selected = []
    questions_copy = list(ASTROLOGY_QUESTIONS)
    # Pick 5 questions deterministically based on date_str
    for i in range(5):
        idx = (hash_val + i * 17) % len(questions_copy)
        q = dict(questions_copy.pop(idx))
        # Mask out correct option and explanation so users cannot see them in response
        masked_q = {
            "id": q["id"],
            "question": q["question"],
            "options": q["options"]
        }
        selected.append((masked_q, q["correct"], q["explanation"]))
    return selected

# ----------------- PAYLOADS -----------------
class QuizAnswerRequest(BaseModel):
    question_index: int
    answer_option: str

class QuizClaimRequest(BaseModel):
    milestone: int

# ----------------- ENDPOINTS -----------------
@router.get("/status")
async def get_rewards_status(current_user: dict = Depends(get_current_user)):
    db = None
    try:
        db = await asyncio.to_thread(RewardsDB)
        user_id = current_user["id"]
        today = get_vietnam_date()
        yesterday = (datetime.now(timezone(timedelta(hours=7))) - timedelta(days=1)).strftime("%Y-%m-%d")

        # 1. Check daily checkin status
        checkin_today = await asyncio.to_thread(db.get_checkin_record, user_id, today)
        last_checkin = await asyncio.to_thread(db.get_last_checkin, user_id)
        
        checked_in_today = checkin_today is not None
        
        # Calculate current streak preview
        streak = 0
        if checked_in_today:
            streak = checkin_today["streak"]
        elif last_checkin:
            if last_checkin["checkin_date"].strftime("%Y-%m-%d") == yesterday:
                streak = last_checkin["streak"]
            else:
                streak = 0
        else:
            streak = 0

        # 2. Get questions for today
        questions_with_answers = get_daily_questions(today)
        questions_list = [q[0] for q in questions_with_answers]

        # 3. Check daily quiz status
        quiz_record = await asyncio.to_thread(db.get_quiz_record, user_id, today)
        
        quiz_answered = 0
        quiz_correct = 0
        claimed_3_correct = False
        claimed_5_correct = False
        answers_state = []

        if quiz_record:
            quiz_answered = quiz_record["questions_answered"]
            quiz_correct = quiz_record["correct_answers"]
            claimed_3_correct = bool(quiz_record["claimed_3_correct"])
            claimed_5_correct = bool(quiz_record["claimed_5_correct"])
            try:
                answers_state = json.loads(quiz_record["answers_json"])
            except:
                answers_state = []
        else:
            # Initialize answers state
            answers_state = [None] * 5
            await asyncio.to_thread(db.create_quiz_record, user_id, today, json.dumps(answers_state))

        return {
            "today": today,
            "checked_in_today": checked_in_today,
            "streak": streak,
            "quiz_answered": quiz_answered,
            "quiz_correct": quiz_correct,
            "claimed_3_correct": claimed_3_correct,
            "claimed_5_correct": claimed_5_correct,
            "questions": questions_list,
            "answers_state": answers_state
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if db:
            db.close()

@router.post("/checkin")
async def do_checkin(current_user: dict = Depends(get_current_user)):
    db = None
    try:
        db = await asyncio.to_thread(RewardsDB)
        user_id = current_user["id"]
        today = get_vietnam_date()
        yesterday = (datetime.now(timezone(timedelta(hours=7))) - timedelta(days=1)).strftime("%Y-%m-%d")

        # Check if already checked in today
        checkin_today = await asyncio.to_thread(db.get_checkin_record, user_id, today)
        if checkin_today:
            raise HTTPException(status_code=400, detail="Bạn đã điểm danh hôm nay rồi!")

        # Calculate streak
        last_checkin = await asyncio.to_thread(db.get_last_checkin, user_id)
        streak = 1
        if last_checkin:
            last_date_str = last_checkin["checkin_date"].strftime("%Y-%m-%d")
            if last_date_str == yesterday:
                streak = last_checkin["streak"] + 1
            elif last_date_str == today:
                streak = last_checkin["streak"]

        # Insert checkin record
        await asyncio.to_thread(db.add_checkin_record, user_id, today, streak)

        # Reward 2 tokens
        new_balance = await asyncio.to_thread(
            db.change_token_balance,
            user_id,
            2.0,
            f"Điểm danh hàng ngày (Chuỗi {streak} ngày)",
            "in"
        )

        return {
            "success": True,
            "message": "Điểm danh thành công! Bạn nhận được +2 tokens.",
            "streak": streak,
            "token_balance": new_balance
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if db:
            db.close()

@router.post("/quiz/answer")
async def answer_quiz(request: QuizAnswerRequest, current_user: dict = Depends(get_current_user)):
    db = None
    try:
        db = await asyncio.to_thread(RewardsDB)
        user_id = current_user["id"]
        today = get_vietnam_date()

        if request.question_index < 0 or request.question_index >= 5:
            raise HTTPException(status_code=400, detail="Câu hỏi không hợp lệ!")

        # Get quiz questions
        questions_with_answers = get_daily_questions(today)
        masked_q, correct_option, explanation = questions_with_answers[request.question_index]

        # Get quiz record
        quiz_record = await asyncio.to_thread(db.get_quiz_record, user_id, today)
        if not quiz_record:
            raise HTTPException(status_code=400, detail="Vui lòng kiểm tra trạng thái trước.")

        answers_state = json.loads(quiz_record["answers_json"])
        
        # Check if already answered this index
        if answers_state[request.question_index] is not None:
            raise HTTPException(status_code=400, detail="Bạn đã trả lời câu hỏi này rồi!")

        # Check if they answer sequentially
        ans_opt = request.answer_option.strip().upper()
        corr_opt = str(correct_option).strip().upper()
        is_correct = ans_opt == corr_opt
        
        # Save state
        answer_data = {
            "selected_option": request.answer_option,
            "is_correct": is_correct,
            "correct_option": correct_option,
            "explanation": explanation
        }
        answers_state[request.question_index] = answer_data

        # Calculate new totals
        questions_answered = sum(1 for a in answers_state if a is not None)
        correct_answers = sum(1 for a in answers_state if a is not None and a["is_correct"])

        # Save to DB
        await asyncio.to_thread(
            db.update_quiz_record,
            user_id,
            today,
            questions_answered,
            correct_answers,
            json.dumps(answers_state)
        )

        return {
            "is_correct": is_correct,
            "correct_option": correct_option,
            "explanation": explanation,
            "quiz_answered": questions_answered,
            "quiz_correct": correct_answers,
            "answers_state": answers_state
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if db:
            db.close()

@router.post("/quiz/claim")
async def claim_quiz_reward(request: QuizClaimRequest, current_user: dict = Depends(get_current_user)):
    db = None
    try:
        db = await asyncio.to_thread(RewardsDB)
        user_id = current_user["id"]
        today = get_vietnam_date()

        if request.milestone not in [3, 5]:
            raise HTTPException(status_code=400, detail="Mốc phần thưởng không hợp lệ!")

        # Get quiz record
        quiz_record = await asyncio.to_thread(db.get_quiz_record, user_id, today)
        if not quiz_record:
            raise HTTPException(status_code=400, detail="Không tìm thấy thông tin lượt chơi hôm nay!")

        if request.milestone == 3:
            if quiz_record["claimed_3_correct"]:
                raise HTTPException(status_code=400, detail="Bạn đã nhận phần thưởng mốc này rồi!")
            if quiz_record["correct_answers"] < 3:
                raise HTTPException(status_code=400, detail="Bạn chưa đủ số câu đúng để nhận mốc này!")
            
            # Reward 1 token
            reward_amount = 1.0
            description = "Thưởng trả lời đúng 3/5 câu hỏi Chiêm tinh"
        else: # milestone == 5
            if quiz_record["claimed_5_correct"]:
                raise HTTPException(status_code=400, detail="Bạn đã nhận phần thưởng mốc này rồi!")
            if quiz_record["correct_answers"] < 5:
                raise HTTPException(status_code=400, detail="Bạn chưa đủ số câu đúng để nhận mốc này!")
            
            # Reward 2 tokens
            reward_amount = 2.0
            description = "Thưởng xuất sắc trả lời đúng 5/5 câu hỏi Chiêm tinh"

        # Update claim flag
        await asyncio.to_thread(db.claim_quiz_milestone, user_id, today, request.milestone)

        # Change user balance
        new_balance = await asyncio.to_thread(
            db.change_token_balance,
            user_id,
            reward_amount,
            description,
            "in"
        )

        return {
            "success": True,
            "message": f"Nhận thưởng thành công! Bạn nhận được +{int(reward_amount)} tokens.",
            "token_balance": new_balance,
            "claimed_3_correct": True if request.milestone == 3 else bool(quiz_record["claimed_3_correct"]),
            "claimed_5_correct": True if request.milestone == 5 else bool(quiz_record["claimed_5_correct"])
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if db:
            db.close()
