import React from 'react';
import { useLocation } from 'react-router-dom';
import { Search } from 'lucide-react';
import './DashboardHeader.css';

const DashboardHeader = () => {
  const location = useLocation();
  
  const getBreadcrumb = () => {
    const path = location.pathname;
    if (path === '/dashboard' || path === '/') return 'Home';
    if (path === '/agentAI') return 'Agent AI';
    if (path === '/notes') return 'Notes';
    if (path === '/calendar') return 'Calendar';
    if (path === '/settings') return 'Settings';
    return 'Home';
  };

  const isNotesPage = location.pathname === '/notes';

  return (
    <div className="dashboard-header">
      <div className="header-content">
        <div className="breadcrumb-container">
          <div className="breadcrumb">{getBreadcrumb()}</div>
          {isNotesPage && (
            <div className="filepath">All Notes</div>
          )}
        </div>
        <div className="search-container">
          <input 
            type="text" 
            placeholder="Search" 
            className="search-input"
          />
          <Search size={18} className="search-icon" />
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;

