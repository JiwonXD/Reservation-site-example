// src/App.jsx
import { useState } from 'react';

import SignupForm from './components/SignupForm';
import LoginForm from './components/LoginForm';
import ReservationPage from './components/ReservationPage';
import MyReservations from './components/MyReservations';

function App() {
  /* ── 화면 전환용 전역 상태 ───────────────────────────────
     view 값에 따라 어떤 컴포넌트를 보여줄지 결정
       home  |  signup  |  login  |  reservation  |  my-reservations
  -----------------------------------------------------------------*/
  const [view, setView] = useState('home');
  const [isLoggedIn, setIsLoggedIn] = useState(false);  // 로그인 여부

  /* 로그아웃: 세션 쿠키 삭제 후 홈으로 이동 */
  const handleLogout = async () => {
    await fetch('/logout', { method: 'POST', credentials: 'include' });
    setIsLoggedIn(false);
    setView('home');
  };

  /* ── 렌더링 시작 ──────────────────────────────────────────*/
  return (
    <>
      {/* ===================== 헤더 ===================== */}
      <header>
        <nav
          className="nav"
          style={{ justifyContent: 'center', position: 'relative', gap: 12 }}
        >
          {/* (중앙) 로고1 */}
          <img
            src="/logo1.png"
            alt="logo1"
            style={{ height: 100, objectFit: 'contain' }}
          />

          {/* (오른쪽) 로그인 후 메뉴 */}
          {isLoggedIn && (
            <div
              style={{
                position: 'absolute',
                right: 20,
                display: 'flex',
                gap: 8,
              }}
            >
              <button className="btn-outline" onClick={() => setView('reservation')}>
                예약
              </button>
              <button className="btn-outline" onClick={() => setView('my-reservations')}>
                내 예약
              </button>
              <button className="btn-danger" onClick={handleLogout}>
                로그아웃
              </button>
            </div>
          )}
        </nav>
      </header>

      {/* ===================== 메인 ===================== */}
      <main>
        {/* ① 홈(히어로) 화면 */}
        {view === 'home' && (
          <section className="hero">
            <h1>동국식당에 오신 것을 환영합니다!</h1>
            <p>회원가입 또는 로그인을 하고 원하는 날짜와 시간에 테이블을 예약해 보세요.</p>

            {/* CTA 버튼 */}
            <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="btn-primary" style={{ width: 160 }} onClick={() => setView('signup')}>
                회원가입
              </button>
              <button className="btn-outline" style={{ width: 160 }} onClick={() => setView('login')}>
                로그인
              </button>
            </div>

            {/* 하단 로고2 */}
            <img
              src="/logo2.png"
              alt="logo2"
              style={{ display: 'block', margin: '32px auto 0', height: 200, objectFit: 'contain' }}
            />
          </section>
        )}

        {/* ② 회원가입 화면 */}
        {view === 'signup' && (
          <SignupForm
            onSuccess={() => setView('login')} // 가입 성공 → 로그인 화면
            onBack={() => setView('home')}     // 뒤로가기 → 홈
          />
        )}

        {/* ③ 로그인 화면 */}
        {view === 'login' && (
          <LoginForm
            onSuccess={() => {
              setIsLoggedIn(true);
              setView('reservation');          // 로그인 성공 → 예약 화면
            }}
            onBack={() => setView('home')}     // 뒤로가기 → 홈
          />
        )}

        {/* ④ 예약 페이지 */}
        {view === 'reservation' && <ReservationPage />}

        {/* ⑤ 내 예약 목록 페이지 */}
        {view === 'my-reservations' && <MyReservations />}
      </main>
    </>
  );
}

export default App;
