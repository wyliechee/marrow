import { BrowserRouter, Routes, Route } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import Home from './pages/Home';
import Library from './pages/Library';
import Review from './pages/Review';

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex-1 flex flex-col">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/library" element={<Library />} />
          <Route path="/review" element={<Review />} />
        </Routes>
      </div>
      <BottomNav />
    </BrowserRouter>
  );
}
