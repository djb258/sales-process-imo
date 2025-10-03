import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { FactfinderEnhanced } from './components/FactfinderEnhanced';
import { DashboardEnhanced } from './components/DashboardEnhanced';
import { HomePage } from './pages/HomePage';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/factfinder" element={<FactfinderEnhanced />} />
          <Route path="/dashboard/:prospectId" element={<DashboardRoute />} />
        </Routes>
      </Layout>
    </Router>
  );
}

// Route wrapper to extract prospectId param
function DashboardRoute() {
  const prospectId = window.location.pathname.split('/dashboard/')[1];
  return <DashboardEnhanced prospectId={prospectId} />;
}

export default App;
