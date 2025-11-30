import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import TopicSelectionPage from './pages/TopicSelectionPage';
import GamePage from './pages/GamePage';
import SummaryPage from './pages/SummaryPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<TopicSelectionPage />} />
          <Route path="game/:topicId" element={<GamePage />} />
          <Route path="summary" element={<SummaryPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
