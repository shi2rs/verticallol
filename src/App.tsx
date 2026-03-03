import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from '@/pages/HomePage';
import ContentDetailPage from '@/pages/ContentDetailPage';
import SubmitContentPage from '@/pages/SubmitContentPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/content/:id" element={<ContentDetailPage />} />
        <Route path="/submit" element={<SubmitContentPage />} />
      </Routes>
    </BrowserRouter>
  );
}
