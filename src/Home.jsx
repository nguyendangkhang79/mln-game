import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import heroImage from '../anhnen.png';
import './Home.css';

function ArrowIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
}

function UserIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>;
}

export default function Home() {
  const [playerName, setPlayerName] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const navigate = useNavigate();
  const dialogRef = useRef(null);

  const handleJoinRoom = (event) => {
    event.preventDefault();
    const name = playerName.trim();
    if (name) navigate('/play', { state: { playerName: name } });
  };

  useEffect(() => {
    if (!showHelp) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setShowHelp(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    dialogRef.current?.focus();
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [showHelp]);

  return (
    <div className="light-home">
      <header className="home-header">
        <a className="home-brand" href="/" aria-label="Kết nối xã hội - Trang chủ">
          <span className="home-brand-mark"><img src="/brand-mark.svg" alt="" /></span>
          <span><strong>KẾT NỐI</strong><small>XÃ HỘI · SLOT 6</small></span>
        </a>
        <nav className="home-nav" aria-label="Điều hướng chính">
          <button type="button" onClick={() => setShowHelp(true)}>Cách chơi</button>
          <span className="nav-divider" />
          <span className="nav-theme">Chủ đề 4</span>
        </nav>
      </header>

      <main className="home-main">
        <section className="home-copy">
          <div className="topic-label"><span /> TRÒ CHƠI TƯƠNG TÁC · CHỦ ĐỀ 4</div>
          <h1>Khám phá cơ cấu xã hội<br />và sức mạnh của<br /><em>liên minh.</em></h1>
          <p className="home-lead">Một ván Bingo tương tác về giai cấp, tầng lớp và liên minh trong thời kỳ quá độ lên chủ nghĩa xã hội ở Việt Nam. Sắp xếp thẻ, lắng nghe từ khóa và kết nối đủ năm ô để chiến thắng.</p>

          <form className="join-card" onSubmit={handleJoinRoom}>
            <label htmlFor="player-name">Tên người chơi</label>
            <div className="join-row">
              <div className="home-input-wrap">
                <UserIcon />
                <input
                  id="player-name"
                  type="text"
                  value={playerName}
                  onChange={(event) => setPlayerName(event.target.value)}
                  placeholder="Nhập tên của bạn"
                  maxLength={30}
                  autoComplete="name"
                  autoFocus
                  required
                />
              </div>
              <button type="submit" className="join-button" disabled={!playerName.trim()}>
                Vào phòng chơi <ArrowIcon />
              </button>
            </div>
            <p><span className="online-dot" /> Phòng học đang mở · Không cần tài khoản</p>
          </form>

          <div className="home-features" aria-label="Thông tin trò chơi">
            <div><strong>25</strong><span>Từ khóa<br />chủ đề</span></div>
            <div><strong>5 × 5</strong><span>Bảng Bingo<br />tương tác</span></div>
            <div><strong>Live</strong><span>Kết nối<br />thời gian thực</span></div>
          </div>
        </section>

        <section className="topic-visual-column" aria-label="Chủ đề cơ cấu xã hội và liên minh giai cấp">
          <div className="topic-image-stage">
            <img
              className="topic-hero-image"
              src={heroImage}
              alt="Các giai cấp và tầng lớp xã hội Việt Nam kết nối với nhau"
            />
          </div>

          <div className="topic-steps" aria-label="Các bước chơi">
            <span className="topic-step" data-step="1"><strong>01</strong> SẮP XẾP THẺ</span>
            <span className="topic-step-divider" aria-hidden="true" />
            <span className="topic-step" data-step="2"><strong>02</strong> NGHE TỪ KHÓA</span>
            <span className="topic-step-divider" aria-hidden="true" />
            <span className="topic-step" data-step="3"><strong>03</strong> BINGO</span>
          </div>
        </section>
      </main>

      <footer className="home-footer">
        <span>© 2026 Kết nối xã hội</span>
        <span>Học tập · Kết nối · Khám phá</span>
      </footer>

      {showHelp && (
        <div className="help-overlay" onMouseDown={(event) => event.target === event.currentTarget && setShowHelp(false)}>
          <section className="help-modal" role="dialog" aria-modal="true" aria-labelledby="help-title" tabIndex="-1" ref={dialogRef}>
            <div className="help-header">
              <div><p className="topic-label"><span /> HƯỚNG DẪN</p><h2 id="help-title">Cách chơi Bingo</h2></div>
              <button type="button" className="modal-close" onClick={() => setShowHelp(false)} aria-label="Đóng hướng dẫn">×</button>
            </div>
            <ol className="help-steps">
              <li><span>01</span><div><strong>Tham gia phòng</strong><p>Nhập tên của bạn và chọn “Vào phòng chơi”.</p></div></li>
              <li><span>02</span><div><strong>Tạo thẻ Bingo</strong><p>Kéo thả hoặc chọn 25 từ khóa để điền vào bảng 5 × 5.</p></div></li>
              <li><span>03</span><div><strong>Xác nhận sẵn sàng</strong><p>Kiểm tra thẻ và chờ Trọng tài bắt đầu trò chơi.</p></div></li>
              <li><span>04</span><div><strong>Đánh dấu từ khóa</strong><p>Chọn các ô trùng với từ khóa được Trọng tài công bố.</p></div></li>
              <li><span>05</span><div><strong>Hoàn thành Bingo</strong><p>Đạt 5 ô liên tiếp theo hàng ngang, dọc hoặc chéo.</p></div></li>
            </ol>
            <button type="button" className="help-confirm" onClick={() => setShowHelp(false)}>Đã hiểu, bắt đầu chơi</button>
          </section>
        </div>
      )}
    </div>
  );
}
