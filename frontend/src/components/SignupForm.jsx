/*
  SignupForm.jsx
  ────────────────────────────────────────────────────────────
    - form      : { username, password, name }  ➜   useState 로 보관
    - 이름 검증 : 한글/영문 정규식(nameRe)      ➜   실시간 오류 메시지
    - handleSubmit()
       • nameErr 남아있으면 alert 후 리턴
       • fetch('/signup', { body: JSON.stringify(form) })
       • 성공 시 alert + onSuccess()
*/

import { useState } from 'react';

/* 0) 정규식: 이름은 한글/영문/공백만 허용 */
const nameRe = /^[가-힣a-zA-Z\s]+$/;

function SignupForm({ onSuccess, onBack }) {
  /* 1) 입력 상태값 */
  const [form,    setForm]    = useState({ username: '', password: '', name: '' });
  const [nameErr, setNameErr] = useState('');   // 이름 유효성 오류 메시지

  /* 2) 이름 입력 시 실시간 검증 */
  const handleName = (value) => {
    setForm((f) => ({ ...f, name: value }));      // 상태 업데이트
    setNameErr(nameRe.test(value) ? '' : '한글/영문만 입력');  // 에러 갱신
  };

  /* 3) 폼 제출 → 회원가입 요청 */
  const handleSubmit = async (e) => {
    e.preventDefault();             // 페이지 새로고침 방지

    if (nameErr) return alert('이름 형식을 확인하세요!');

    // /signup POST
    const res = await fetch('/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();

    res.ok
      ? (alert('회원가입 완료!'), onSuccess())   // 성공 시: 알림 + 콜백
      : alert(data.message || '회원가입 실패');  // 실패 시: 서버 메시지
  };

  /* 4) JSX 렌더 */
  return (
    <div
      className="form-box"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginTop: 40,
      }}
    >
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
        <h2 style={{ textAlign: 'center' }}>회원가입</h2>

        {/* 아이디 입력 */}
        <input
          className="input-narrow"
          placeholder="아이디"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          required
        />

        {/* 비밀번호 입력 (type=password) */}
        <input
          type="password"
          className="input-narrow"
          placeholder="비밀번호"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />

        {/* 이름 입력 + 실시간 오류 표시 */}
        <input
          className="input-narrow"
          placeholder="이름 (한글/영문)"
          value={form.name}
          onChange={(e) => handleName(e.target.value)}
          required
        />
        {nameErr && <small style={{ color: '#ff4d4f' }}>{nameErr}</small>}

        {/* 버튼 줄: 뒤로가기 / 가입 */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            justifyContent: 'center',
            marginTop: 8,
          }}
        >
          {/* 뒤로가기 → onBack() */}
          <button
            type="button"
            className="btn-outline"
            style={{ width: 110, padding: '6px 0', whiteSpace: 'nowrap' }}
            onClick={onBack}
          >
            뒤로가기
          </button>

          {/* 가입 제출 */}
          <button
            type="submit"
            className="btn-primary"
            style={{ width: 140, padding: '6px 0' }}
          >
            가입
          </button>
        </div>
      </form>
    </div>
  );
}

export default SignupForm;
