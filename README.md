# 🍽️ 식당 예약 사이트 (Restaurant Reservation)

> React 프론트엔드와 Flask 백엔드로 구성한 **풀스택 식당 예약 웹 애플리케이션**입니다.
> 회원가입·로그인부터 날짜·시간대별 테이블 예약, 내 예약 조회·취소까지의 전체 흐름을 구현했습니다.
> **2인 협업 실습**으로 진행했으며, 본 README는 **백엔드(서버·DB·API)** 관점에서 정리했습니다.

![Python](https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-000000?style=flat&logo=flask&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=flat&logo=sqlite&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)

---

## 📌 한눈에 보기

| 항목 | 내용 |
|------|------|
| **프로젝트 유형** | 2인 협업 풀스택 실습 |
| **아키텍처** | React(Vite) ↔ REST API ↔ Flask ↔ SQLite |
| **인증 방식** | 세션(쿠키) 기반 로그인 |
| **주요 기능** | 회원 인증 · 테이블 예약 · 예약 조회/취소 · 취소 이력 관리 |

---

## 👥 역할 분담

| 담당 | 영역 | 주요 작업 |
|------|------|-----------|
| **본인** | **Backend** | Flask 서버, DB 모델 설계, REST API, 예약 비즈니스 로직 (`backend/server.py`) |
| 팀원 | Frontend | React 컴포넌트, 화면 구성, API 연동 (`frontend/src/`) |

---

## 🧩 시스템 아키텍처

프론트엔드(React)는 Vite 개발 서버의 **프록시**를 통해 백엔드(Flask, `:5000`)로 API를 요청하고,
백엔드는 **세션 쿠키**로 로그인 상태를 관리하며 SQLite DB와 통신합니다.

```
[ React (Vite :5173) ]
        │  fetch (credentials: include)
        ▼
[ Vite Dev Proxy ]  /login, /reservations, /tables ...  →  http://localhost:5000
        │
        ▼
[ Flask (:5000) ]  세션 인증 · 비즈니스 로직 · ORM
        │
        ▼
[ SQLite (restaurant.db) ]
```

> 📸 **이미지 영역 ①** — 시스템 아키텍처 다이어그램
> (React → Vite Proxy → Flask → SQLite 흐름을 시각화한 그림)
> 권장 파일: `docs/architecture.png`
> ```markdown
> ![아키텍처](docs/architecture.png)
> ```

---

## 🗄️ 데이터베이스 설계 (Backend)

SQLAlchemy ORM으로 4개의 모델을 설계했습니다.

| 모델 | 설명 | 주요 컬럼 |
|------|------|-----------|
| **User** | 회원 정보 | `username`(unique), `password`, `name` |
| **Table** | 레스토랑 테이블 마스터 | `location`(창가/홀 중앙/룸), `capacity`(수용 인원) |
| **Reservation** | 예약 정보 | `user_id`, `table_id`, `date`, `time`(lunch/dinner), `guests` 등 |
| **CancelledReservation** | 예약 취소 이력(로그) | `reservation_id`, `cancelled_at` |

**관계** — `Reservation`은 `User`와 `Table`을 외래키로 참조합니다.

```
User (1) ──< Reservation >── (1) Table
                  │
                  ▼ (취소 시 기록)
          CancelledReservation
```

> 📸 **이미지 영역 ②** — ERD (엔티티 관계도)
> (User / Table / Reservation / CancelledReservation 관계 다이어그램)
> 권장 파일: `docs/erd.png`

> 💡 서버 최초 실행 시 `init_tables()`가 기본 테이블 5개(창가 2인석 ×2, 홀 중앙 4인석 ×2, 룸 6인석 ×1)를 자동 생성합니다.

---

## 🔌 REST API 명세 (Backend)

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|:----:|
| `POST` | `/signup` | 회원가입 (ID 중복 검사) | – |
| `POST` | `/login` | 로그인 → 세션에 `user_id` 저장 | – |
| `POST` | `/logout` | 로그아웃 (세션 파기) | – |
| `GET`  | `/tables?date=&time=` | 해당 날짜·시간대 테이블 목록 + 예약 여부 | – |
| `GET`  | `/reservations` | 로그인 사용자의 예약 목록 | ✅ |
| `POST` | `/reservations` | 새 예약 생성 | ✅ |
| `DELETE` | `/reservations/<id>` | 예약 취소 | ✅ |

---

## ⚙️ 핵심 비즈니스 로직 (Backend)

단순 CRUD를 넘어, 실제 예약 서비스에 필요한 **검증과 정책**을 서버에서 처리했습니다.

**1. 예약 날짜 유효성 검증** — 과거 날짜 차단, 1개월 이내만 허용
```python
if res_date < today:
    return jsonify({"message": "오늘 이전 날짜는 예약할 수 없습니다"}), 400
if res_date > today + timedelta(days=30):
    return jsonify({"message": "1개월 이내의 테이블만 예약이 가능합니다"}), 400
```

**2. 테이블 수용 인원 초과 방지**
```python
if data["guests"] > table.capacity:
    return jsonify({"message": f"해당 테이블의 최대 수용 인원은 {table.capacity}명입니다"}), 400
```

**3. 예약 중복 표시** — 특정 날짜·시간에 이미 예약된 테이블을 `reserved: true`로 표시하여 프론트가 선택을 막을 수 있게 함
```python
reserved_ids = {
    r.table_id for r in Reservation.query.filter_by(date=date, time=time).all()
}
```

**4. 취소 정책 및 권한 검사** — 본인 예약만, 당일 취소 불가, 취소 시 이력 별도 기록
```python
if not reservation or reservation.user_id != session["user_id"]:
    return jsonify({"message": "예약을 찾을 수 없거나 권한이 없습니다"}), 403
if reservation.date == datetime.today().date():
    return jsonify({"message": "예약 당일에는 취소할 수 없습니다"}), 400
db.session.add(CancelledReservation(reservation_id=reservation.id))  # 이력 보존
```

---

## 🖥️ 프론트엔드 (팀원 담당)

| 구성 | 내용 |
|------|------|
| **스택** | React 19 + Vite, `react-toastify`(알림) |
| **컴포넌트** | `SignupForm` · `LoginForm` · `ReservationPage` · `MyReservations` |
| **화면 전환** | 라우터 대신 `App.jsx`의 `view` 상태로 화면 전환 (home / signup / login / reservation / my-reservations) |

> 📸 **이미지 영역 ③** — 실제 동작 화면
> (예약 페이지 / 로그인 / 내 예약 목록 등 주요 화면 스크린샷 또는 데모 GIF)
> 권장 파일: `docs/demo.png` 또는 `docs/demo.gif`

---

## 📂 프로젝트 구조

```
Reservation-site-example/
├── backend/
│   ├── server.py              # [Backend] Flask 앱: 모델 · API · 비즈니스 로직
│   └── instance/
│       └── restaurant.db      # SQLite DB (자동 생성)
└── frontend/
    ├── index.html
    ├── vite.config.js         # API 프록시 설정 (→ localhost:5000)
    ├── package.json
    └── src/
        ├── App.jsx            # 화면 전환 · 로그인 상태 관리
        ├── main.jsx
        └── components/
            ├── SignupForm.jsx
            ├── LoginForm.jsx
            ├── ReservationPage.jsx
            └── MyReservations.jsx
```

---

## 🚀 실행 방법

**1) 백엔드 (Flask)**
```bash
cd backend
pip install flask flask-sqlalchemy flask-cors
python server.py            # http://localhost:5000 에서 실행
```

**2) 프론트엔드 (React + Vite)**
```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173 (API는 :5000으로 프록시)
```

> 백엔드를 먼저 실행해야 DB 초기화와 API 응답이 정상 동작합니다.

---

## 🧠 배운 점

> ✍️ **작성 영역** — 아래는 예시입니다. 본인의 경험에 맞게 다듬어 주세요.

- **프론트와 백엔드를 분리한 협업**에서, API 명세가 곧 두 사람의 약속(인터페이스)이 된다는 점을 체감했습니다.
- 세션·쿠키 기반 인증과 CORS(`supports_credentials`) 설정을 직접 다루며 **로그인 상태 유지의 원리**를 이해했습니다.
- 단순 CRUD가 아니라 날짜 유효성·수용 인원·취소 정책 같은 **도메인 규칙을 서버에서 검증**하는 경험을 했습니다.

---

## 🔧 개선할 점 (회고)

> ✍️ **작성 영역** — 솔직한 회고를 담으면 좋습니다. 예시:

- **비밀번호 평문 저장** → 실서비스라면 해시(`werkzeug.security` 등) 적용 필요 *(현재는 실습 범위로 평문 저장)*
- `requirements.txt` 추가로 의존성 관리 명확화
- 동일 시간대 동시 예약에 대한 **동시성/유니크 제약** 보강
- 예외 처리 및 입력 검증(필수값 누락 등) 강화