import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Player from './Player';
import Admin from './Admin';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <div className="flex flex-col items-center justify-center h-screen space-y-4">
            <h1 className="text-3xl font-bold">BINGO THẶNG DƯ</h1>
            <Link to="/play" className="bg-blue-500 text-white px-6 py-2 rounded">Vào Phòng Chơi</Link>
            <Link to="/admin" className="bg-red-500 text-white px-6 py-2 rounded">Màn Hình Quản Trị</Link>
          </div>
        } />
        <Route path="/play" element={<Player />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Router>
  );
}

export default App;