import React from 'react';
import { Factfinder } from './components/Factfinder';
import { DashboardEnhanced } from './components/DashboardEnhanced';

function App() {
  // Simple routing based on URL path
  const path = window.location.pathname;
  const dashboardMatch = path.match(/^\/dashboard\/(.+)$/);

  if (dashboardMatch) {
    const prospectId = dashboardMatch[1];
    return <DashboardEnhanced prospectId={prospectId} />;
  }

  return <Factfinder />;
}

export default App;
