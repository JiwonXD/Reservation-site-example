"""
─────────────────────────────────────────────────────────────────────────────
• sqlite:///restaurant.db” 로컬 DB 한 개만 사용
• 엔드포인트
    /signup           POST   회원 가입
    /login            POST   로그인
    /logout           POST   로그아웃
    /tables           GET    특정 날짜/시간에 예약 여부가 표시된 테이블 목록
    /reservations     GET    로그인 사용자의 예약 조회
    /reservations     POST   새 예약
    /reservations/<id>DELETE 예약 취소
─────────────────────────────────────────────────────────────────────────────
"""

from datetime import datetime, timedelta

from flask import Flask, jsonify, request, session
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///restaurant.db"
app.config["SECRET_KEY"] = "secretkey"  # session cookie 암호화
db = SQLAlchemy(app)
CORS(app, supports_credentials=True)     # 프론트엔드(React) → 쿠키 포함 요청 허용

# ──────────────────────────────#
#  1) SQLAlchemy Model 정의     #
# ──────────────────────────────#
class User(db.Model):
    """
    회원 정보
    - username: 로그인 ID (unique)
    - password: 평문 저장(과제 범위)  ※실서비스라면 해시 필요
    - name    : 실명
    """
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)
    name = db.Column(db.String(120), nullable=False)


class Table(db.Model):
    """
    레스토랑 테이블 마스터
    ex) 창가 2인석 · 중앙 4인석 · 룸 6인석 …
    """
    id = db.Column(db.Integer, primary_key=True)
    location = db.Column(db.String(50))   # 창가 / 홀 중앙 / 룸
    capacity = db.Column(db.Integer)      # 최대 수용 인원


class Reservation(db.Model):
    """
    예약 테이블
    • user_id   : 예약한 사용자
    • table_id  : 예약한 식탁
    • date, time: YYYY-MM-DD, 'lunch' | 'dinner'
    """
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"))
    table_id = db.Column(db.Integer, db.ForeignKey("table.id"))
    date = db.Column(db.Date)
    time = db.Column(db.String(10))  # lunch / dinner
    name = db.Column(db.String(100))
    phone = db.Column(db.String(20))
    credit_card = db.Column(db.String(30))
    guests = db.Column(db.Integer)


class CancelledReservation(db.Model):
    """
    취소 이력(로그용). 실제 좌석 반환은 Reservation 삭제로 처리.
    """
    id = db.Column(db.Integer, primary_key=True)
    reservation_id = db.Column(db.Integer)
    cancelled_at = db.Column(db.DateTime, default=datetime.utcnow)


# ──────────────────────────────#
#  2) Auth & User Endpoints     #
# ──────────────────────────────#
@app.route("/signup", methods=["POST"])
def signup():
    """회원 가입"""
    data = request.json or {}
    if User.query.filter_by(username=data.get("username")).first():
        return jsonify({"message": "이미 존재하는 ID입니다"}), 409

    new_user = User(
        username=data["username"],
        password=data["password"],
        name=data["name"],
    )
    db.session.add(new_user)
    db.session.commit()
    return jsonify({"message": "회원가입이 완료되었습니다"}), 201


@app.route("/login", methods=["POST"])
def login():
    """로그인 → 세션에 user_id 저장"""
    data = request.json or {}
    user = User.query.filter_by(username=data.get("username")).first()
    if not user:
        return jsonify({"message": "존재하지 않는 ID입니다"}), 404
    if user.password != data.get("password"):
        return jsonify({"message": "비밀번호가 일치하지 않습니다"}), 401

    session["user_id"] = user.id
    return jsonify({"message": "로그인 성공"})


@app.route("/logout", methods=["POST"])
def logout():
    """세션 파기"""
    session.pop("user_id", None)
    return jsonify({"message": "로그아웃 완료"})


# ──────────────────────────────#
#  3) Table 조회                #
# ──────────────────────────────#
@app.route("/tables", methods=["GET"])
def get_tables():
    """
    특정 날짜·시간(lunch/dinner)에
    • 모든 테이블 목록 + 'reserved': 해당 시간에 이미 예약됐는지 여부 반환
    """
    date = request.args.get("date")
    time = request.args.get("time")
    if not date or not time:
        return jsonify({"message": "날짜와 시간대를 선택해주세요"}), 400

    all_tables = Table.query.all()
    reserved_ids = {
        r.table_id
        for r in Reservation.query.filter_by(date=date, time=time).all()
    }

    return jsonify(
        [
            {
                "id": t.id,
                "location": t.location,
                "capacity": t.capacity,
                "reserved": t.id in reserved_ids,
            }
            for t in all_tables
        ]
    )


# ──────────────────────────────#
#  4) Reservation CRUD          #
# ──────────────────────────────#
@app.route("/reservations", methods=["POST"])
def make_reservation():
    """새 예약 생성 (로그인 필요)"""
    if "user_id" not in session:
        return jsonify({"message": "로그인이 필요합니다"}), 401

    data = request.json
    res_date = datetime.strptime(data["date"], "%Y-%m-%d").date()
    today = datetime.today().date()

    # 날짜 유효성
    if res_date < today:
        return jsonify({"message": "오늘 이전 날짜는 예약할 수 없습니다"}), 400
    if res_date > today + timedelta(days=30):
        return jsonify({"message": "1개월 이내의 테이블만 예약이 가능합니다"}), 400

    # 테이블 존재 & 수용 인원 검사
    table = Table.query.get(data["table_id"])
    if not table:
        return jsonify({"message": "존재하지 않는 테이블입니다"}), 404
    if data["guests"] > table.capacity:
        return jsonify(
            {"message": f"해당 테이블의 최대 수용 인원은 {table.capacity}명입니다"}
        ), 400

    new_res = Reservation(
        user_id=session["user_id"],
        table_id=data["table_id"],
        date=res_date,
        time=data["time"],
        name=data["name"],
        phone=data["phone"],
        credit_card=data["credit_card"],
        guests=data["guests"],
    )
    db.session.add(new_res)
    db.session.commit()
    return jsonify({"message": "예약이 완료되었습니다"}), 201


@app.route("/reservations", methods=["GET"])
def view_reservations():
    """로그인 사용자의 예약 목록"""
    if "user_id" not in session:
        return jsonify([])

    reservations = Reservation.query.filter_by(user_id=session["user_id"]).all()
    return jsonify(
        [
            {
                "id": r.id,
                "table_id": r.table_id,
                "date": r.date.isoformat(),
                "time": r.time,
                "guests": r.guests,
            }
            for r in reservations
        ]
    )


@app.route("/reservations/<int:res_id>", methods=["DELETE"])
def cancel_reservation(res_id):
    """예약 취소 (D-1 까지 허용)"""
    if "user_id" not in session:
        return jsonify({"message": "로그인이 필요합니다"}), 401

    reservation = Reservation.query.get(res_id)
    if not reservation or reservation.user_id != session["user_id"]:
        return jsonify({"message": "예약을 찾을 수 없거나 권한이 없습니다"}), 403
    if reservation.date == datetime.today().date():
        return jsonify({"message": "예약 당일에는 취소할 수 없습니다"}), 400

    db.session.add(CancelledReservation(reservation_id=reservation.id))
    db.session.delete(reservation)
    db.session.commit()
    return jsonify({"message": "예약이 취소되었습니다"})


# ──────────────────────────────#
#  5) 초기 데이터 로드           #
# ──────────────────────────────#
def init_tables():
    """서버 최초 실행 시 5개의 기본 테이블 생성"""
    if Table.query.count() == 0:
        db.session.add_all(
            [
                Table(location="창가", capacity=2),
                Table(location="창가", capacity=2),
                Table(location="홀 중앙", capacity=4),
                Table(location="홀 중앙", capacity=4),
                Table(location="룸", capacity=6),
            ]
        )
        db.session.commit()
        print("테이블 초기화 완료")


# ──────────────────────────────#
#  6) 앱 실행                   #
# ──────────────────────────────#
if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        init_tables()      # 초기 데이터 세팅
    app.run(debug=True)     # 개발 편의를 위한 debug 모드
