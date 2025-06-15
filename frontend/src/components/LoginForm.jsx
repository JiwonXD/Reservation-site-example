/*
  LoginForm.jsx
  ───────────────────────────────────────────────────────────
  - 로그인 화면에 사용하는 단일 React 컴포넌트
  - 입력값을 브라우저 state(useState)로 관리
  - 제출 시 서버(/login)로 POST 요청 → 성공하면 onSuccess() 콜백 호출
    ※ onSuccess, onBack 은 부모(App.jsx)로부터 전달받음
*/

import { useState } from 'react';

function LoginForm({ onSuccess, onBack }) {
  /* -------------------- 상태 (입력값) -------------------- */
  // username / password 라는 두 개의 문자열 state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  /* -------------------- 제출 이벤트 -------------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();          // <form> 기본 새로고침 방지

    // Fetch API 로 /login 엔드포인트 호출
    const response = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',    // 세션 쿠키 포함
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();        // { message: ... }

    // HTTP 200~299 → 로그인 성공
    if (response.ok) {
      alert('로그인 성공!');
      onSuccess();   // 부모(App)에게 알림 → 다음 화면으로 전환
    } else {
      alert(data.message || '로그인 실패');  // 에러 메시지 출력
    }
  };

  /* -------------------- 화면 렌더링 -------------------- */
  return (
    /* form-box : 가운데 정렬된 카드 모양 컨테이너 */
    <div
      className="form-box"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginTop: 40,
      }}
    >
      {/* 실제 로그인 <form> */}
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          width: '100%',
          maxWidth: 260,
        }}
      >
        <h2 style={{ textAlign: 'center' }}>로그인</h2>

        {/* 아이디 입력 */}
        <input
          className="input-narrow"
          placeholder="아이디"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        {/* 비밀번호 입력(type=password) */}
        <input
          type="password"
          className="input-narrow"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {/* 버튼 두 개: 뒤로가기 / 로그인  */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            justifyContent: 'center',
            marginTop: 8,
          }}
        >
          {/* 뒤로가기: 홈화면으로 돌아감(onBack 콜백) */}
          <button
            type="button"
            className="btn-outline"
            style={{ width: 110, padding: '6px 0', whiteSpace: 'nowrap' }}
            onClick={onBack}
          >
            뒤로가기
          </button>

          {/* 로그인: <form> submit → handleSubmit 실행 */}
          <button
            className="btn-primary"
            style={{ width: 140, padding: '6px 0' }}
          >
            로그인
          </button>
        </div>
      </form>
    </div>
  );
}

export default LoginForm;
