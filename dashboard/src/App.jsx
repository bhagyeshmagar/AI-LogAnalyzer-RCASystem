import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Incidents from './pages/Incidents';
import IncidentDetail from './pages/IncidentDetail';
import LogExplorer from './pages/LogExplorer';
import Clusters from './pages/Clusters';
import Services from './pages/Services';
import './App.css';

import { useState } from 'react';
import { useWebSocket } from './services/useWebSocket';

// Lazy load ApiFlows to avoid blocking the app with dagre ESM issues
const ApiFlows = lazy(() => import('./pages/ApiFlows'));

function App() {
  const [toasts, setToasts] = useState([]);

  useWebSocket('/topic/logs', (log) => {
    if (log.level === 'ERROR') {
      const id = Date.now();
      setToasts(prev => [...prev, { id, message: `🔥 ${log.serviceName}: ${log.message}`, type: 'error' }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
    }
  });

  return (
    <Router>
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <Suspense fallback={<div className="loading"><div className="spinner"></div></div>}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/incidents" element={<Incidents />} />
              <Route path="/incidents/:id" element={<IncidentDetail />} />
              <Route path="/logs" element={<LogExplorer />} />
              <Route path="/clusters" element={<Clusters />} />
              <Route path="/services" element={<Services />} />
              <Route path="/flows" element={<ApiFlows />} />
            </Routes>
          </Suspense>

          <div className="toast-container">
            {toasts.map(t => (
              <div key={t.id} className={`toast ${t.type}`}>
                {t.message}
              </div>
            ))}
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;
