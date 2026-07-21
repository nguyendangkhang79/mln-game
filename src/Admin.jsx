import { useState, useEffect } from 'react';
import { ref, set, push, onValue } from 'firebase/database';
import { db } from './firebase';

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinCode, setPinCode] = useState('');
  const ADMIN_PIN = '123456'; 

  const [wordList, setWordList] = useState([]);
  const [activeWords, setActiveWords] = useState([]);
  const [newWord, setNewWord] = useState('');
  const [gameStatus, setGameStatus] = useState('waiting'); // waiting, playing, ended

  useEffect(() => {
    if (!isAuthenticated) return;
    
    onValue(ref(db, 'gameState/wordList'), (snapshot) => {
      setWordList(Object.values(snapshot.val() || {}));
    });

    onValue(ref(db, 'gameState/activeWords'), (snapshot) => {
      setActiveWords(Object.values(snapshot.val() || {}));
    });

    onValue(ref(db, 'gameState/status'), (snapshot) => {
      setGameStatus(snapshot.val() || 'waiting');
    });
  }, [isAuthenticated]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (pinCode === ADMIN_PIN) setIsAuthenticated(true);
    else { alert("Sai mã PIN!"); setPinCode(''); }
  };

  const handleAddWord = (e) => {
    e.preventDefault();
    const trimmedWord = newWord.trim();
    if (!trimmedWord) return;
    if (wordList.includes(trimmedWord)) {
      alert("Từ này đã tồn tại!"); return;
    }
    push(ref(db, 'gameState/wordList'), trimmedWord);
    setNewWord('');
  };

  const unlockWord = (word) => {
    if (gameStatus !== 'playing') {
      alert("Vui lòng bấm BẮT ĐẦU TRÒ CHƠI trước khi phát lệnh!");
      return;
    }
    if (!activeWords.includes(word)) {
      push(ref(db, 'gameState/activeWords'), word);
    }
  };

  const startGame = () => set(ref(db, 'gameState/status'), 'playing');
  const endGame = () => set(ref(db, 'gameState/status'), 'ended');
  
  const resetMatch = () => {
    if(window.confirm("Bắt đầu ván mới? Toàn bộ dấu Bingo sẽ bị xóa.")) {
      set(ref(db, 'gameState/activeWords'), null);
      set(ref(db, 'gameState/status'), 'waiting');
    }
  };

  const clearAllWords = () => {
    if(window.confirm("Xóa trắng toàn bộ kho từ khóa?")) {
      set(ref(db, 'gameState'), { wordList: null, activeWords: null, status: 'waiting' });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-xl shadow-lg border max-w-sm w-full">
          <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Xác thực Trọng Tài</h2>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input 
              type="password" placeholder="Nhập mã PIN..." value={pinCode} onChange={(e) => setPinCode(e.target.value)}
              className="border-2 p-3 rounded-lg text-center text-lg tracking-widest focus:border-blue-500 outline-none" autoFocus
            />
            <button type="submit" className="bg-blue-600 text-white font-bold py-3 rounded-lg">Mở Khóa</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto bg-gray-50 min-h-screen font-sans">
      <div className="flex justify-between items-end border-b-2 border-gray-200 pb-4 mb-6">
        <h1 className="text-3xl font-extrabold text-red-600 tracking-tight">Trạm Quản Trị Bingo</h1>
        <div className="text-sm font-medium">Trạng thái: 
          <span className={`ml-2 font-bold ${gameStatus === 'playing' ? 'text-green-600' : gameStatus === 'ended' ? 'text-red-600' : 'text-amber-500'}`}>
            {gameStatus === 'playing' ? 'ĐANG CHƠI' : gameStatus === 'ended' ? 'ĐÃ KẾT THÚC' : 'ĐANG CHỜ BẮT ĐẦU'}
          </span>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <div className="flex-1 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="font-bold text-lg mb-3">1. Nạp từ khóa vào hệ thống</h2>
          <form onSubmit={handleAddWord} className="flex gap-2">
            <input type="text" value={newWord} onChange={(e) => setNewWord(e.target.value)} placeholder="Nhập thuật ngữ..." className="flex-1 border-2 p-2.5 rounded-lg outline-none focus:border-blue-500"/>
            <button type="submit" className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold">Thêm</button>
          </form>
          <div className="mt-3 text-sm bg-blue-50 p-3 rounded-lg border border-blue-100">Kho đang có: <strong>{wordList.length}</strong> từ</div>
        </div>

        <div className="md:w-1/3 bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col gap-2 justify-center">
          <h2 className="font-bold text-lg mb-1">2. Điều khiển ván Game</h2>
          <div className="flex gap-2">
            <button onClick={startGame} disabled={gameStatus === 'playing'} className="flex-1 bg-green-500 disabled:bg-gray-300 text-white py-2 rounded-lg font-bold">Bắt Đầu</button>
            <button onClick={endGame} disabled={gameStatus !== 'playing'} className="flex-1 bg-red-500 disabled:bg-gray-300 text-white py-2 rounded-lg font-bold">Kết Thúc</button>
          </div>
          <button onClick={resetMatch} className="bg-amber-500 text-white py-2 rounded-lg font-bold">Reset Ván Mới (Giữ từ khóa)</button>
          <button onClick={clearAllWords} className="bg-gray-800 text-white py-1.5 rounded-lg font-bold text-sm mt-2">Xóa sạch Kho Từ Khóa</button>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold mb-4">3. Bảng Phát Lệnh (Click để mở khóa)</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {wordList.map((word) => {
            const isUnlocked = activeWords.includes(word);
            return (
              <button key={word} onClick={() => unlockWord(word)} className={`p-3 rounded-lg font-semibold text-sm border-2 min-h-[60px] ${isUnlocked ? 'bg-green-500 text-white border-green-600' : 'bg-white hover:bg-blue-50'}`}>
                {word}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  );
}