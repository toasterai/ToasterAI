import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Scanner from './pages/Scanner';
import Dashboard from './pages/Dashboard';
import Pricing from './pages/Pricing';

export default function App() {
  // Warm up the backend on app load to mitigate Render cold start
  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || '/api';
    fetch(`${apiUrl}/health`, { method: 'GET' }).catch(() => {
      // Silently ignore — this is best-effort warmup
    });
  }, []);

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/scan" element={<Scanner />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/pricing" element={<Pricing />} />
      </Route>
    </Routes>
  );
}
