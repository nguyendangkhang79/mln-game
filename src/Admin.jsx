import { useEffect, useState } from 'react';
import { onValue, push, ref, set, update } from 'firebase/database';
import { db } from './firebase';
import Chat from './Chat';

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinCode, setPinCode] = useState('');
  const [wordList, setWordList] = useState([]);
  const [activeWords, setActiveWords] = useState([]);
  const [newWord, setNewWord] = useState('');
  const [gameStatus, setGameStatus] = useState('waiting');
  const [players, setPlayers] = useState([]);
  const ADMIN_PIN = '123456';

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    const unsubscribeWords = onValue(ref(db, 'gameState/wordList'), (snapshot) => setWordList(Object.values(snapshot.val() || {})));
    const unsubscribeActive = onValue(ref(db, 'gameState/activeWords'), (snapshot) => setActiveWords(Object.values(snapshot.val() || {})));
    const unsubscribeStatus = onValue(ref(db, 'gameState/status'), (snapshot) => setGameStatus(snapshot.val() || 'waiting'));
    const unsubscribePlayers = onValue(ref(db, 'gameState/players'), (snapshot) => setPlayers(Object.values(snapshot.val() || {})));
    return () => { unsubscribeWords(); unsubscribeActive(); unsubscribeStatus(); unsubscribePlayers(); };
  }, [isAuthenticated]);

  const handleLogin = (event) => {
    event.preventDefault();
    if (pinCode === ADMIN_PIN) setIsAuthenticated(true);
    else { alert('Sai mã PIN!'); setPinCode(''); }
  };

  const handleAddWord = (event) => {
    event.preventDefault();
    const word = newWord.trim();
    if (!word) return;
    if (wordList.includes(word)) { alert('Từ này đã tồn tại!'); return; }
    push(ref(db, 'gameState/wordList'), word)
      .catch(() => alert('Không thêm được từ khóa! Kiểm tra kết nối hoặc quyền Firebase.'));
    setNewWord('');
  };

  const unlockWord = (word) => {
    if (gameStatus !== 'playing') { alert('Vui lòng bắt đầu trò chơi trước khi phát lệnh!'); return; }
    if (!activeWords.includes(word)) push(ref(db, 'gameState/activeWords'), word);
  };

  const startGame = () => {
    const readyCount = players.filter((player) => player.ready).length;
    const notReadyCount = players.length - readyCount;
    if (notReadyCount > 0 && !window.confirm(`${notReadyCount}/${players.length} người chơi chưa sẵn sàng. Bạn vẫn muốn bắt đầu ván?`)) return;
    set(ref(db, 'gameState/status'), 'playing');
  };

  const resetMatch = () => {
    if (window.confirm('Bắt đầu ván mới? Toàn bộ dấu Bingo và bảng xếp hạng hiện tại sẽ bị xóa.')) {
      update(ref(db, 'gameState'), { activeWords: null, status: 'waiting', winners: null, winnerCount: null });
    }
  };

  if (!isAuthenticated) {
    return <div className="flex items-center justify-center h-screen bg-gray-100"><div className="bg-white p-8 rounded-xl shadow-lg border max-w-sm w-full"><h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Xác thực Trọng Tài</h2><form onSubmit={handleLogin} className="flex flex-col gap-4"><input type="password" placeholder="Nhập mã PIN..." value={pinCode} onChange={(event) => setPinCode(event.target.value)} className="border-2 p-3 rounded-lg text-center text-lg tracking-widest focus:border-blue-500 outline-none" autoFocus /><button type="submit" className="bg-blue-600 text-white font-bold py-3 rounded-lg">Mở khóa</button></form></div></div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto bg-gray-50 min-h-screen font-sans">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b-2 border-gray-200 pb-4 mb-6">
        <div><h1 className="text-3xl font-extrabold text-red-600 tracking-tight m-0">Trạm Quản Trị Bingo</h1><a href="/live" target="_blank" rel="noreferrer" className="inline-flex mt-2 text-sm font-bold text-blue-600 hover:underline">Mở màn hình trực tiếp ↗</a></div>
        <div className="text-sm font-medium">Trạng thái: <span className={`ml-2 font-bold ${gameStatus === 'playing' ? 'text-green-600' : gameStatus === 'ended' ? 'text-red-600' : 'text-amber-500'}`}>{gameStatus === 'playing' ? 'ĐANG CHƠI' : gameStatus === 'ended' ? 'ĐÃ KẾT THÚC' : 'ĐANG CHỜ BẮT ĐẦU'}</span></div>
      </header>
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <section className="flex-1 bg-white p-6 rounded-xl shadow-sm border border-gray-200"><h2 className="font-bold text-lg mb-3">1. Nạp từ khóa vào hệ thống</h2><form onSubmit={handleAddWord} className="flex gap-2"><input type="text" value={newWord} onChange={(event) => setNewWord(event.target.value)} placeholder="Nhập thuật ngữ..." className="flex-1 border-2 p-2.5 rounded-lg outline-none focus:border-blue-500" /><button type="submit" className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold">Thêm</button></form><div className="mt-3 text-sm bg-blue-50 p-3 rounded-lg border border-blue-100">Kho đang có: <strong>{wordList.length}</strong> từ</div></section>
        <section className="md:w-1/3 bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col gap-2 justify-center"><h2 className="font-bold text-lg mb-1">2. Điều khiển ván game</h2><div className={`text-sm px-3 py-2 rounded-lg border ${players.length > 0 && players.every((player) => player.ready) ? 'bg-green-50 border-green-200 text-green-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}><strong>{players.filter((player) => player.ready).length}/{players.length}</strong> người chơi đã sẵn sàng</div><div className="flex gap-2"><button onClick={startGame} disabled={gameStatus !== 'waiting'} className="flex-1 bg-green-500 disabled:bg-gray-300 text-white py-2 rounded-lg font-bold">Bắt đầu</button><button onClick={() => set(ref(db, 'gameState/status'), 'ended')} disabled={gameStatus !== 'playing'} className="flex-1 bg-red-500 disabled:bg-gray-300 text-white py-2 rounded-lg font-bold">Kết thúc</button></div><button onClick={resetMatch} className="bg-amber-500 text-white py-2 rounded-lg font-bold">Reset ván mới</button><button onClick={() => window.confirm('Xóa trắng toàn bộ kho từ khóa?') && update(ref(db, 'gameState'), { wordList: null, activeWords: null })} className="bg-gray-800 text-white py-1.5 rounded-lg font-bold text-sm mt-2">Xóa kho từ khóa</button><button onClick={() => window.confirm('Xóa sạch toàn bộ lịch sử chat?') && set(ref(db, 'chat/messages'), null)} className="bg-red-600 text-white py-1.5 rounded-lg font-bold text-sm mt-1">Xóa chat</button></section>
      </div>
      <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"><h2 className="text-xl font-bold mb-4">3. Bảng phát lệnh</h2><div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">{wordList.map((word) => { const unlocked = activeWords.includes(word); return <button key={word} onClick={() => unlockWord(word)} className={`p-3 rounded-lg font-semibold text-sm border-2 min-h-[60px] ${unlocked ? 'bg-green-500 text-white border-green-600' : 'bg-white hover:bg-blue-50'}`}>{word}</button>; })}</div></section>
      <Chat playerName="Trọng Tài" />
    </div>
  );
}
