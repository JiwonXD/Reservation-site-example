/*
  MyReservations.jsx
  ────────────────────────────────────────────────────────────
  “내 예약” 페이지 컴포넌트
  -------------------------------------------------------------------------
  • 서버(/reservations)에서 *로그인 사용자의 예약 목록*을 불러온 뒤
    - 날짜가 가까운 순 → 같은 날짜면 점심(lunch) 먼저 정렬
  • 카드 형태로 예약 내용을 보여주고
  • [예약취소] 버튼을 누르면 DELETE /reservations/<id> 로 취소 요청
*/

import { useEffect, useState } from 'react';

function MyReservations() {
  /* ① 예약 목록을 담을 상태배열 */
  const [reservations, setReservations] = useState([]);

  /* ② 서버에서 목록 조회 + 정렬 */
  const fetchReservations = async () => {
    // credentials:'include' → 세션 쿠키(로그인) 포함
    const res  = await fetch('/reservations', { credentials: 'include' });
    const data = await res.json();           // [{ id, date, time, … }, …]

    // 가까운 날짜 → 점심 → 저녁 순으로 소트
    data.sort((a, b) => {
      const diffDate = new Date(a.date) - new Date(b.date);
      if (diffDate !== 0) return diffDate;               // 다른 날짜
      // 같은 날짜라면 lunch(0) < dinner(1)
      return (a.time === 'lunch' ? 0 : 1) - (b.time === 'lunch' ? 0 : 1);
    });

    setReservations(data);                 // 상태 업데이트 → 리렌더
  };

  /* ③ 예약 취소 버튼 핸들러 */
  const cancelReservation = async (id) => {
    if (!window.confirm('정말 취소하시겠습니까?')) return; // UX 확인창

    const res  = await fetch(`/reservations/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    const data = await res.json();

    // 성공하면 목록을 다시 불러오고, 아니면 에러 alert
    res.ok ? (alert(data.message), fetchReservations())
           : alert(data.message || '취소 실패');
  };

  /* ④ 컴포넌트 마운트 시 단 한 번 목록 로드 */
  useEffect(() => {
    fetchReservations();
  }, []);                             // 빈 배열 → 최초 1회 실행

  /* ⑤ 화면(UI) 반환 */
  return (
    <div className="section">
      {/* 타이틀 */}
      <h2 style={{ textAlign: 'center' }}>내 예약</h2>
      <p style={{ textAlign: 'center', fontSize: '.9rem', color: '#666' }}>
        ※ 가까운 예약 순으로 정렬됩니다
      </p>

      {/* 예약이 없을 때 / 있을 때 분기 */}
      {reservations.length === 0 ? (
        <p style={{ textAlign: 'center' }}>예약 내역이 없습니다.</p>
      ) : (
        /* 카드 그리드 */
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 16,
            justifyContent: 'center',
            marginTop: 28,
          }}
        >
          {/* 예약 하나당 카드 하나 */}
          {reservations.map((r) => (
            <div
              key={r.id}
              style={{
                width: 200,                     // 카드 폭
                background: '#ffffff',
                boxShadow: '0 2px 8px rgba(0,0,0,.08)',
                borderRadius: 10,
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              {/* (1) 예약 날짜 */}
              <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#333' }}>
                {r.date}
              </h3>

              {/* (2) 정보 뱃지들 : 테이블번호 / 시간대 / 인원수 */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <span
                  style={{
                    background: '#efefef',
                    padding: '4px 8px',
                    borderRadius: 9999,
                    fontSize: '.8rem',
                  }}
                >
                  테이블 #{r.table_id}
                </span>

                <span
                  style={{
                    background: '#fff3e0',
                    color: '#ff9800',
                    padding: '4px 8px',
                    borderRadius: 9999,
                    fontSize: '.8rem',
                  }}
                >
                  {r.time === 'lunch' ? '점심' : '저녁'}
                </span>

                <span
                  style={{
                    background: '#e8f5e9',
                    color: '#2e7d32',
                    padding: '4px 8px',
                    borderRadius: 9999,
                    fontSize: '.8rem',
                  }}
                >
                  {r.guests}명
                </span>
              </div>

              {/* (3) 취소 버튼 : 카드 우하단 */}
              <button
                className="btn-danger"
                style={{
                  alignSelf: 'flex-end',
                  padding: '6px 14px',
                  marginTop: 'auto',    // 카드 하단으로 밀착
                }}
                onClick={() => cancelReservation(r.id)}
              >
                예약취소
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyReservations;
