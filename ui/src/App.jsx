import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import ApiDashboard from './components/ApiDashboard';
import ResourceBrowser from './components/ResourceBrowser';

function App() {
  return (
    <Router>
      <div className="flex flex-col h-screen bg-gray-50">
        <Header />
        <main className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<ApiDashboard />} />
            <Route path="/resources" element={<ResourceBrowser />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
