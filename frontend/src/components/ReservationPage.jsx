/*
  ReservationPage.jsx
  ─────────────────────────────────────────────────────────────
  - “테이블 예약” 3-단계 마법사 화면
      STEP 1  날짜·시간 선택  → 다음
      STEP 2  예약자 정보/인원 → 테이블 보기
      STEP 3  테이블 카드 선택 → 예약 POST
  - 모든 입력은 useState 로 관리
  - 서버 통신
      /tables?date&time   (GET)  → 예약 가능 여부 표시
      /reservations       (POST) → 예약 생성
  - 유효성
      이름: 한글/영문
      전화: 숫자 10~11자
      카드: 숫자 16자
      인원: 1~6명, 그리고 테이블 capacity 이하
*/

import { useState } from 'react';

/* ───── 상수 & 헬퍼 ───────────────────────────── */
const todayStr = new Date().toISOString().split('T')[0];   // 오늘 YYYY-MM-DD
const re = {                                // 각 필드 정규식
  name : /^[가-힣a-zA-Z\s]+$/,
  phone: /^\d{10,11}$/,
  card : /^\d{16}$/,
};
const digits = (v) => v.replace(/\D/g, ''); // 숫자만 남기기

/* ───── 컴포넌트 ─────────────────────────────── */
function ReservationPage() {
  /* 1) 상태 값들 */
  const [step,   setStep]   = useState(1);   // 1→2→3 진행
  const [date,   setDate]   = useState('');
  const [time,   setTime]   = useState('lunch');
  const [tables, setTables] = useState([]);  // STEP3에서 카드 그릴 배열
  const [banner, setBanner] = useState('');  // “해당 시간대 예약 없음” 등 표시

  const [form, setForm] = useState({         // 예약자 정보 + 인원
    name: '', phone: '', credit_card: '', guests: 2,
  });
  const [err,  setErr]  = useState({         // 각 필드별 에러 메시지
    name: '', phone: '', credit_card: '',
  });

  /* 2) 입력값 유효성 검사 */
  const check = (key, val) => {
    let m = '';
    if (key==='name'        && !re.name.test(val))  m='한글/영문만';
    if (key==='phone'       && !re.phone.test(val)) m='10~11자리 숫자';
    if (key==='credit_card' && !re.card.test(val))  m='16자리 숫자';
    setErr(e => ({ ...e, [key]: m }));
  };
  const allOk =                // 모든 입력 OK?
    Object.values(err).every(m => m==='') &&
    form.name && form.phone && form.credit_card && form.guests;

  /* 3) onChange 헬퍼 */
  const update = (key, raw) => {
    const val = (key==='phone' || key==='credit_card') ? digits(raw) : raw;
    setForm(f => ({ ...f, [key]: val }));
    check(key, val);
  };
  const adjustGuests = diff =>
    setForm(f => ({ ...f, guests: Math.min(6, Math.max(1, f.guests + diff)) }));

  /* 4) 서버 통신 함수 */
  // (a) 특정 날짜·시간 테이블 목록 가져오기
  const fetchTables = async () => {
    const res = await fetch(`/tables?date=${date}&time=${time}`, {
      credentials: 'include',
    });
    const data = await res.json();
    setTables(data);
    setBanner(
      data.length && data.every(t => t.reserved)
        ? '해당 시간대에 예약 가능 없음'
        : ''
    );
    setStep(3);   
  };

  // (b) 실제 예약 요청
  const reserve = async (tableId) => {
    if (!allOk) return alert('입력 형식을 확인하세요!');
    const res = await fetch('/reservations', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ table_id: tableId, date, time, ...form }),
    });
    const data = await res.json();
    res.ok ? (alert('예약 완료!'), fetchTables())
           : alert(data.message || '예약 실패');
  };

  /* ───── JSX (UI) ───────────────────────────── */
  return (
    <div
      style={{
        display:'flex',flexDirection:'column',alignItems:'center',
        paddingBottom:60,
      }}
    >
      {/*1) 진행 점 (1·2·3) */}
      <div style={{ display:'flex',gap:10,margin:'20px 0' }}>
        {[1,2,3].map(n=>(
          <div key={n}
               style={{
                 width:12,height:12,borderRadius:'50%',
                 background: step>=n ? 'var(--primary)' : '#ccc',
               }}/>
        ))}
      </div>

      {/* 2) STEP 1  날짜·시간 선택 */}
      {step===1 && (
        <div className="step-card" style={{ maxWidth:480,width:'100%',textAlign:'center' }}>
          <h3>1. 날짜 · 시간 선택</h3>

          {/* 날짜 달력 */}
          <input type="date" min={todayStr} value={date}
                 onChange={e=>{
                   const v=e.target.value;
                   if(v && v<todayStr) return alert('과거 날짜 불가');
                   setDate(v);
                 }}
                 style={{ marginTop:10,width:'100%',padding:10 }}/>

          {/* 시간대 버튼 */}
          <div style={{ display:'flex',gap:14,marginTop:20,justifyContent:'center' }}>
            {[
              { key:'lunch',  label:'점심' },
              { key:'dinner', label:'저녁' },
            ].map(o=>(
              <button key={o.key}
                      onClick={()=>setTime(o.key)}
                      className={time===o.key?'btn-primary':'btn-secondary'}
                      style={{ width:110 }}>
                {o.label}
              </button>
            ))}
          </div>

          {/* 다음 단계 버튼 */}
          <button className="btn-primary"
                  style={{ width:180,marginTop:28 }}
                  onClick={()=> date ? setStep(2) : alert('날짜를 먼저 선택하세요')}>
            다음 단계
          </button>
        </div>
      )}

      {/* 3) STEP 2  예약자 정보 */}
      {step===2 && (
        <div className="step-card" style={{ maxWidth:480,width:'100%',textAlign:'center' }}>
          <h3>2. 예약자 정보 입력</h3>

          {/* 이름 / 전화 / 카드 번호 (한 줄씩) */}
          {[
            { key:'name',         ph:'이름 (한글/영문)' },
            { key:'phone',        ph:'전화번호 (숫자만)' },
            { key:'credit_card',  ph:'카드번호 16자리', max:16 },
          ].map(f=>(
            <div key={f.key} style={{ marginBottom:16 }}>
              <input placeholder={f.ph} maxLength={f.max}
                     value={form[f.key]}
                     onChange={e=>update(f.key,e.target.value)}
                     style={{ padding:10,width:'100%' }}/>
              {err[f.key] && <small style={{ color:'#ff4d4f' }}>{err[f.key]}</small>}
            </div>
          ))}

          {/* 인원수 스테퍼 */}
          <div style={{ display:'flex',gap:14,alignItems:'center',justifyContent:'center' }}>
            <button className="btn-secondary stepper-btn" onClick={()=>adjustGuests(-1)}>−</button>
            <span style={{ fontSize:'1.5rem',fontWeight:700 }}>{form.guests}명</span>
            <button className="btn-secondary stepper-btn" onClick={()=>adjustGuests(1)}>+</button>
          </div>

          {/* 이전 / 테이블 보기 버튼 */}
          <div style={{ display:'flex',gap:12,justifyContent:'center',marginTop:28 }}>
            <button className="btn-outline" style={{ width:110 }} onClick={()=>setStep(1)}>
              이전
            </button>
            <button className="btn-primary" style={{ width:180 }} disabled={!allOk}
                    onClick={fetchTables}>
              테이블 보기
            </button>
          </div>
        </div>
      )}

      {/* 4) STEP 3  테이블 카드 */}
      {step===3 && (
        <div className="step-card" style={{ maxWidth:640,width:'100%',textAlign:'center' }}>
          <h3>3. 테이블 선택</h3>

          {banner && <div className="banner">{banner}</div>}

          {/* 카드 그리드 */}
          <div style={{
            display:'flex',flexWrap:'wrap',gap:14,justifyContent:'center',marginTop:14,
          }}>
            {tables.map(t=>{
              const full  = t.reserved;                // 이미 예약됨?
              const fits  = form.guests <= t.capacity; // 인원수가 맞는가?
              const label = full ? '불가' : fits ? '예약' : '초과';
              const can   = label==='예약';            // 실제 클릭 가능 버튼

              /* 버튼 배경 색 */
              const bg = label==='예약' ? 'var(--primary)'
                       : label==='초과' ? '#ff8a80'
                       : '#ccc';

              return (
                <div key={t.id} className={`card ${!can?'disabled':''}`} style={{ width:140 }}>
                  <p>{t.location}석</p>
                  <p>{t.capacity}명</p>

                  <button className="tiny-btn" disabled={!can}
                          style={{
                            width:90,background:bg,
                            color: label==='불가' ? '#666':'#fff',
                            marginTop:6,
                          }}
                          onClick={()=> can && reserve(t.id)}>
                    {label}
                  </button>
                </div>
              );
            })}
          </div>

          {/* 이전 버튼 */}
          <button className="btn-outline" style={{ width:110,marginTop:28 }}
                  onClick={()=>setStep(2)}>
            이전
          </button>
        </div>
      )}
    </div>
  );
}

export default ReservationPage;
