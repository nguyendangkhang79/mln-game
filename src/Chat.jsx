import { useState, useEffect, useRef } from 'react';
import { ref, push, onValue } from 'firebase/database';
import { db } from './firebase';

export default function Chat({ playerName, autoOpenOnce = false }) {
  const [messages, setMessages] = useState([]);
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const prevCountRef = useRef(0);
  const hasLoadedMessagesRef = useRef(false);
  const hasAutoOpenedRef = useRef(false);
  const messagesEndRef = useRef(null);

  // Lắng nghe real-time từ Firebase
  useEffect(() => {
    const messagesRef = ref(db, 'chat/messages');
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const msgList = Object.values(data).sort(
          (a, b) => a.timestamp - b.timestamp,
        );
        setMessages(msgList);
      } else {
        setMessages([]);
      }
      setMessagesLoaded(true);
    });
    return () => unsubscribe();
  }, []);

  // Auto scroll xuống cuối khi mở chat
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const toggleChat = () => {
    setIsOpen((open) => {
      if (!open) setUnread(0);
      return !open;
    });
  };

  // Đếm tin nhắn mới khi popup đang đóng
  useEffect(() => {
    if (!messagesLoaded) return;

    // Keep the existing history as the baseline on first load.
    if (!hasLoadedMessagesRef.current) {
      hasLoadedMessagesRef.current = true;
      prevCountRef.current = messages.length;

      // Show chat once when a player enters a room that already has messages.
      if (autoOpenOnce && messages.length > 0 && !hasAutoOpenedRef.current) {
        hasAutoOpenedRef.current = true;
        setUnread(0);
        setIsOpen(true);
      }
      return;
    }

    if (!isOpen && messages.length > prevCountRef.current) {
      const newMessageCount = messages.length - prevCountRef.current;

      if (autoOpenOnce && !hasAutoOpenedRef.current) {
        hasAutoOpenedRef.current = true;
        setUnread(0);
        setIsOpen(true);
      } else {
        setUnread((prev) => Math.min(prev + newMessageCount, 99));
      }
    }
    prevCountRef.current = messages.length;
  }, [messages.length, isOpen, messagesLoaded, autoOpenOnce]);

  const handleSend = (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    push(ref(db, 'chat/messages'), {
      name: playerName || 'Ẩn danh',
      text: trimmed,
      timestamp: Date.now(),
    });
    setInput('');
  };

  const formatTime = (ts) => {
    const d = new Date(ts);
    return d.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      {/* Nút chat nổi — thiết kế giống Messenger/Zalo */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={toggleChat}
          className="chat-launcher relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center shadow-[0_8px_28px_rgba(20,40,33,0.45)] hover:shadow-[0_8px_36px_rgba(59,130,246,0.4)] hover:scale-105 active:scale-95 transition-all duration-200 group"
          title="Chat tổng"
          aria-label={isOpen ? 'Đóng chat tổng' : `Mở chat tổng${unread > 0 ? `, ${unread} tin nhắn mới` : ''}`}
        >
          {/* Icon chat bubble SVG thay cho emoji */}
          {isOpen ? (
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" />
              <path d="M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-7 h-7 drop-shadow-sm" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM7 9h10c.55 0 1 .45 1 1s-.45 1-1 1H7c-.55 0-1-.45-1-1s.45-1 1-1zm0 3h6c.55 0 1 .45 1 1s-.45 1-1 1H7c-.55 0-1-.45-1-1s.45-1 1-1zm0 3h8c.55 0 1 .45 1 1s-.45 1-1 1H7c-.55 0-1-.45-1-1s.45-1 1-1z" />
            </svg>
          )}

          {/* Badge tin nhắn chưa đọc */}
          {unread > 0 && !isOpen && (
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[11px] min-w-[22px] h-[22px] rounded-full flex items-center justify-center font-bold shadow-[0_2px_8px_rgba(239,68,68,0.5)] px-1">
              {unread}
            </span>
          )}
        </button>
      </div>

      {/* Popup chat */}
      {isOpen && (
        <div className="chat-window fixed bottom-20 sm:bottom-24 left-3 right-3 sm:left-auto sm:right-6 z-50 sm:w-[400px] h-[min(480px,70dvh)] bg-white rounded-2xl shadow-[0_12px_60px_rgba(0,0,0,0.3)] border border-gray-100 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="chat-header bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-4 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-lg">
                💬
              </div>
              <div>
                <h3 className="font-semibold text-[15px] leading-tight">Chat Tổng</h3>
                <p className="text-[12px] text-blue-200 leading-tight">
                  {messages.length > 0
                    ? `${messages.length} tin nhắn`
                    : 'Hãy bắt đầu trò chuyện'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              aria-label="Đóng chat"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M18 6 6 18" /><path d="M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Danh sách tin nhắn */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f0f2f5]">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                <svg className="w-16 h-16 text-gray-300" viewBox="0 0 24 24" fill="currentColor" opacity="0.5">
                  <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM7 9h10c.55 0 1 .45 1 1s-.45 1-1 1H7c-.55 0-1-.45-1-1s.45-1 1-1zm0 3h6c.55 0 1 .45 1 1s-.45 1-1 1H7c-.55 0-1-.45-1-1s.45-1 1-1zm0 3h8c.55 0 1 .45 1 1s-.45 1-1 1H7c-.55 0-1-.45-1-1s.45-1 1-1z" />
                </svg>
                <p className="text-sm font-medium text-gray-400">Chưa có tin nhắn nào</p>
                <p className="text-xs text-gray-350">Hãy là người đầu tiên nhắn tin!</p>
              </div>
            )}
            {messages.map((msg, i) => {
              const isMe = msg.name === playerName;
              return (
                <div
                  key={i}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-[14px] leading-relaxed ${
                      isMe
                        ? 'bg-[#0084ff] text-white rounded-br-lg shadow-sm'
                        : 'bg-white text-gray-800 rounded-bl-lg shadow-[0_1px_2px_rgba(0,0,0,0.08)]'
                    }`}
                  >
                    {!isMe && (
                      <p className="text-[12px] font-semibold text-[#0084ff] mb-0.5 flex items-center gap-1">
                        {msg.name}
                        {msg.name === 'Trọng Tài' && (
                          <span className="inline-flex items-center justify-center w-[18px] h-[18px] bg-[#1d9bf0] rounded-full" title="Đã xác minh">
                            <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                            </svg>
                          </span>
                        )}
                      </p>
                    )}
                    <p className="break-words whitespace-pre-wrap">{msg.text}</p>
                  </div>
                  <span className="text-[11px] text-gray-400 mt-0.5 px-1.5">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Ô nhập tin nhắn */}
          <form
            onSubmit={handleSend}
            className="bg-white border-t border-gray-100 px-4 py-3 flex items-center gap-2.5 shrink-0"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Aa..."
              className="flex-1 bg-gray-100 rounded-full px-5 py-2.5 text-[14px] outline-none focus:bg-gray-50 focus:ring-2 focus:ring-blue-400/30 transition-all placeholder:text-gray-400"
              maxLength={500}
              autoFocus
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="chat-send bg-[#0084ff] disabled:bg-gray-300 disabled:cursor-not-allowed text-white w-10 h-10 min-w-[40px] rounded-full flex items-center justify-center hover:bg-blue-600 active:scale-90 transition-all shadow-sm"
              aria-label="Gửi tin nhắn"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
