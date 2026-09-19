import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Home';
import Player from './Player';
import Admin from './Admin';
import LiveDashboard from './LiveDashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/play" element={<Player />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/live" element={<LiveDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
