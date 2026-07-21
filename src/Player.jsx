import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from './firebase';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function Player() {
  const [playerName, setPlayerName] = useState('');
  const [hasJoined, setHasJoined] = useState(false);
  const [gameStatus, setGameStatus] = useState('waiting');
  
  const [board, setBoard] = useState(Array(25).fill(null));
  const [allWords, setAllWords] = useState([]);
  const [availableWords, setAvailableWords] = useState([]);
  const [unlockedWords, setUnlockedWords] = useState([]);
  const [isReady, setIsReady] = useState(false);
  const [markedCells, setMarkedCells] = useState(Array(25).fill(false));

  useEffect(() => {
    onValue(ref(db, 'gameState/status'), (snapshot) => {
      setGameStatus(snapshot.val() || 'waiting');
    });

    onValue(ref(db, 'gameState/wordList'), (snapshot) => {
      const words = Object.values(snapshot.val() || {});
      setAllWords(words);
      setAvailableWords(words.filter(w => !board.includes(w)));
    });

    onValue(ref(db, 'gameState/activeWords'), (snapshot) => {
      if (!snapshot.exists()) {
        setUnlockedWords([]);
        setMarkedCells(Array(25).fill(false));
        setIsReady(false); 
      } else {
        setUnlockedWords(Object.values(snapshot.val()));
      }
    });
  }, [board]);

  const handleJoin = (e) => {
    e.preventDefault();
    if (gameStatus === 'playing') {
      alert("Ván game đang diễn ra, bạn không thể tham gia lúc này!");
      return;
    }
    if (playerName.trim()) setHasJoined(true);
  };

  const isLocked = isReady || gameStatus !== 'waiting';

  const onDragEnd = (result) => {
    if (isLocked) return;
    const { source, destination } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const newBoard = [...board];
    const newAvailable = [...availableWords];
    let draggedItem = null;

    if (source.droppableId === 'word-list') {
      draggedItem = newAvailable[source.index];
      newAvailable.splice(source.index, 1);
    } else if (source.droppableId.startsWith('cell-')) {
      const cellIndex = parseInt(source.droppableId.replace('cell-', ''));
      draggedItem = newBoard[cellIndex];
      newBoard[cellIndex] = null; 
    }

    if (destination.droppableId === 'word-list') {
      newAvailable.splice(destination.index, 0, draggedItem);
    } else if (destination.droppableId.startsWith('cell-')) {
      const destIndex = parseInt(destination.droppableId.replace('cell-', ''));
      if (newBoard[destIndex]) newAvailable.push(newBoard[destIndex]);
      newBoard[destIndex] = draggedItem;
    }

    setBoard(newBoard);
    setAvailableWords(newAvailable);
  };

  const markCell = (index, word) => {
    if (!isReady || gameStatus !== 'playing' || !word) return;
    if (unlockedWords.includes(word)) {
      const newMarked = [...markedCells];
      newMarked[index] = !newMarked[index];
      setMarkedCells(newMarked);
      checkWinCondition(newMarked);
    }
  };

  const checkWinCondition = (currentMarks) => {
    const lines = [
      [0, 1, 2, 3, 4], [5, 6, 7, 8, 9], [10, 11, 12, 13, 14], [15, 16, 17, 18, 19], [20, 21, 22, 23, 24],
      [0, 5, 10, 15, 20], [1, 6, 11, 16, 21], [2, 7, 12, 17, 22], [3, 8, 13, 18, 23], [4, 9, 14, 19, 24],
      [0, 6, 12, 18, 24], [4, 8, 12, 16, 20]
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c, d, e] = lines[i];
      if (currentMarks[a] && currentMarks[b] && currentMarks[c] && currentMarks[d] && currentMarks[e]) {
        setTimeout(() => alert(`BINGO! Chúc mừng ${playerName}! TỰ CHỦ VỮNG VÀNG!`), 100);
        return;
      }
    }
  };

  // --- MÀN HÌNH ĐĂNG NHẬP ---
  if (!hasJoined) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg border max-w-sm w-full text-center">
          <h2 className="text-2xl font-bold mb-6 text-blue-800">Vào Phòng Chơi</h2>
          {gameStatus === 'playing' ? (
            <div className="text-red-600 font-bold p-4 bg-red-50 rounded border border-red-200">
              Ván game đang diễn ra.<br/>Bạn không thể tham gia lúc này!
            </div>
          ) : (
            <form onSubmit={handleJoin} className="flex flex-col gap-4">
              <input type="text" placeholder="Nhập tên của bạn..." value={playerName} onChange={(e) => setPlayerName(e.target.value)} className="border-2 p-3 rounded-lg text-center text-lg outline-none focus:border-blue-500" required/>
              <button type="submit" className="bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition">Tham gia ngay</button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // --- MÀN HÌNH CHƠI GAME ---
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex flex-col md:flex-row h-screen bg-gray-50 p-4">
        {/* CỘT TRÁI: BẢNG BINGO */}
        <div className="w-full md:w-2/3 pr-0 md:pr-4 md:border-r mb-8 md:mb-0">
          <h1 className="text-2xl font-bold mb-4 text-center text-blue-800">Thẻ Bingo: {playerName}</h1>
          
          <div className="grid grid-cols-5 gap-1 md:gap-2 aspect-square max-w-2xl mx-auto p-2 bg-gray-200 rounded-xl shadow-inner">
            {board.map((word, index) => {
              const isUnlockedByAdmin = unlockedWords.includes(word);
              const isMarked = markedCells[index];
              const cellId = `cell-${index}`;

              // XÁC ĐỊNH STYLE CHO TỪNG TRẠNG THÁI CỦA Ô
              let cellBaseClass = "border-2 flex items-center justify-center text-center text-xs md:text-sm font-bold min-h-[60px] md:min-h-[80px] transition-all duration-200 rounded-lg overflow-hidden ";
              
              if (!word) {
                // Ô trống
                cellBaseClass += "bg-gray-100 border-dashed border-gray-300 text-gray-400";
              } else if (isMarked) {
                // Ô đã được người chơi click đánh dấu
                cellBaseClass += "bg-green-600 border-green-700 text-white shadow-inner scale-95 opacity-90";
              } else if (gameStatus === 'playing' && isUnlockedByAdmin) {
                // Ô được Admin mở khóa, chờ người chơi click
                cellBaseClass += "bg-yellow-100 border-yellow-500 text-yellow-900 ring-2 ring-yellow-400 animate-pulse cursor-pointer shadow-md transform hover:scale-105";
              } else {
                // Ô bình thường đã có chữ
                cellBaseClass += "bg-white border-gray-300 text-gray-700 shadow-sm";
              }

              return (
                <Droppable droppableId={cellId} key={cellId} isDropDisabled={isLocked}>
                  {(provided, snapshot) => (
                    <div 
                      ref={provided.innerRef} 
                      {...provided.droppableProps} 
                      onClick={() => markCell(index, word)}
                      className={`${cellBaseClass} ${snapshot.isDraggingOver ? 'bg-blue-200 ring-2 ring-blue-500' : ''}`}
                    >
                      {word ? (
                        <Draggable draggableId={word} index={index} isDragDisabled={isLocked}>
                          {(provided, snapshot) => (
                            <div 
                              ref={provided.innerRef} 
                              {...provided.draggableProps} 
                              {...provided.dragHandleProps}
                              // Fix lỗi nền trắng đè chữ: Bắt buộc dùng bg-transparent và text-inherit khi không kéo thả
                              className={`w-full h-full flex items-center justify-center p-1 md:p-2 select-none 
                                ${snapshot.isDragging ? 'bg-blue-500 text-white scale-110 rounded z-50 shadow-2xl' : 'bg-transparent text-inherit'}`}
                            >
                              {word}
                            </div>
                          )}
                        </Draggable>
                      ) : <span className="hidden md:block"></span>}
                      <div className="hidden">{provided.placeholder}</div>
                    </div>
                  )}
                </Droppable>
              );
            })}
          </div>
          
          {!isReady && (
            <div className="text-center mt-6">
              <button onClick={() => setIsReady(true)} disabled={board.includes(null) || gameStatus !== 'waiting'}
                className={`px-10 py-3 rounded text-white font-bold text-xl tracking-wider shadow-md transition-all ${board.includes(null) ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 hover:scale-105'}`}>
                READY!
              </button>
              {board.includes(null) && <p className="text-red-500 text-sm mt-2 font-semibold">Hãy lấp đầy 25 ô để sẵn sàng</p>}
            </div>
          )}
          {isReady && gameStatus === 'waiting' && (
             <div className="text-center mt-6 text-green-600 font-bold animate-pulse text-xl">
                Đã sẵn sàng! Chờ Trọng tài bắt đầu...
             </div>
          )}
        </div>

        {/* CỘT PHẢI: DANH SÁCH TỪ KHÓA */}
        {!isLocked && (
          <div className="w-full md:w-1/3 pl-0 md:pl-4 flex flex-col h-full">
            <h2 className="text-xl font-bold bg-gray-50 py-2 border-b-2 mb-2 text-gray-800">Từ khóa ({availableWords.length})</h2>
            <Droppable droppableId="word-list" isDropDisabled={isLocked}>
              {(provided, snapshot) => (
                <div 
                  ref={provided.innerRef} 
                  {...provided.droppableProps} 
                  className={`flex-1 flex flex-wrap gap-2 content-start mt-2 p-2 rounded min-h-[200px] transition-colors ${snapshot.isDraggingOver ? 'bg-gray-200' : 'bg-transparent'}`}
                >
                  {availableWords.map((word, index) => (
                    <Draggable key={word} draggableId={word} index={index} isDragDisabled={isLocked}>
                      {(provided, snapshot) => (
                        <div 
                          ref={provided.innerRef} 
                          {...provided.draggableProps} 
                          {...provided.dragHandleProps}
                          className={`border p-2 text-sm rounded font-medium shadow-sm transition-transform
                            ${snapshot.isDragging ? 'bg-blue-600 text-white scale-110 shadow-xl' : 'bg-white border-gray-300 text-gray-700 hover:border-blue-400 hover:bg-blue-50'}`}
                        >
                          {word}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        )}
      </div>
    </DragDropContext>
  );
}