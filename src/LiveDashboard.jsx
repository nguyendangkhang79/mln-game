import { useEffect, useMemo, useState } from 'react';
import { onValue, ref } from 'firebase/database';
import { db } from './firebase';
import './LiveDashboard.css';

const STATUS_TEXT = { waiting: 'Đang chuẩn bị', playing: 'Đang diễn ra', ended: 'Đã kết thúc' };

const formatTime = (value, seconds = false) => value
  ? new Date(value).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', ...(seconds ? { second: '2-digit' } : {}) })
  : 'Vừa tham gia';

export default function LiveDashboard() {
  const [players, setPlayers] = useState([]);
  const [winners, setWinners] = useState([]);
  const [status, setStatus] = useState('waiting');

  useEffect(() => {
    const stopPlayers = onValue(ref(db, 'gameState/players'), (snapshot) => {
      setPlayers(Object.entries(snapshot.val() || {}).map(([id, value]) => ({ id, ...value })).sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0)));
    });
    const stopWinners = onValue(ref(db, 'gameState/winners'), (snapshot) => {
      setWinners(Object.entries(snapshot.val() || {}).map(([id, value]) => ({ id, ...value })).sort((a, b) => a.rank - b.rank));
    });
    const stopStatus = onValue(ref(db, 'gameState/status'), (snapshot) => setStatus(snapshot.val() || 'waiting'));
    return () => { stopPlayers(); stopWinners(); stopStatus(); };
  }, []);

  const winnerById = useMemo(() => new Map(winners.map((winner) => [winner.id, winner])), [winners]);

  return (
    <div className="live-page">
      <header className="live-header">
        <a href="/" className="live-brand"><img src="/brand-mark.svg" alt="" /><span><strong>BINGO HỘI NHẬP</strong><small>BẢNG TRỰC TIẾP</small></span></a>
        <div className={`live-status status-${status}`}><i /><span><small>TRẠNG THÁI VÁN</small>{STATUS_TEXT[status]}</span></div>
      </header>

      <main className="live-main">
        <section className="live-intro">
          <div><p>LIVE ROOM · REALTIME</p><h1>Phòng chơi<br /><span>đang trực tuyến.</span></h1></div>
          <div className="live-stats"><article><span>Người tham gia</span><strong>{String(players.length).padStart(2, '0')}</strong><small><i /> đang kết nối</small></article><article><span>Đã Bingo</span><strong>{String(winners.length).padStart(2, '0')}</strong><small>trong ván hiện tại</small></article></div>
        </section>

        <div className="live-grid">
          <section className="live-panel players-panel">
            <header><div><p>NGƯỜI CHƠI</p><h2>Đang tham gia</h2></div><span>{players.length} online</span></header>
            <div className="player-list">
              {players.length === 0 && <div className="live-empty"><span>○</span><strong>Phòng đang trống</strong><p>Danh sách sẽ tự cập nhật khi có người tham gia.</p></div>}
              {players.map((player, index) => {
                const result = winnerById.get(player.id);
                return <article className="live-player" key={player.id}><span className="player-order">{String(index + 1).padStart(2, '0')}</span><span className="player-avatar">{player.name?.trim().charAt(0).toUpperCase() || '?' }<i /></span><div><strong>{player.name}</strong><small>Tham gia lúc {formatTime(player.joinedAt)}</small></div><span className={`player-state ${result ? 'has-won' : ''}`}>{result ? `Hạng ${result.rank}` : status === 'playing' ? 'Đang chơi' : 'Đang chờ'}</span></article>;
              })}
            </div>
          </section>

          <section className="live-panel leaderboard-panel">
            <header><div><p>KẾT QUẢ VÁN</p><h2>Bảng xếp hạng</h2></div><span>Tự động cập nhật</span></header>
            <div className="leader-list">
              {winners.length === 0 && <div className="live-empty"><span>◇</span><strong>Chưa có kết quả</strong><p>Người chiến thắng sẽ xuất hiện tại đây.</p></div>}
              {winners.map((winner) => <article className={`leader-row rank-${winner.rank}`} key={winner.id}><span className="rank-number">{winner.rank <= 3 ? ['Ⅰ','Ⅱ','Ⅲ'][winner.rank - 1] : String(winner.rank).padStart(2, '0')}</span><div><strong>{winner.name}</strong><small>Hoàn thành lúc {formatTime(winner.timestamp, true)}</small></div>{winner.rank === 1 && <span className="winner-mark">★ DẪN ĐẦU</span>}</article>)}
            </div>
            <footer>Kết quả được lưu đến khi Trọng tài reset ván mới.</footer>
          </section>
        </div>
      </main>
      <footer className="live-footer"><span>BIÊN GIỚI MỀM</span><p>Hội nhập sâu rộng · Tự chủ vững vàng</p><span>{new Date().getFullYear()}</span></footer>
    </div>
  );
}
