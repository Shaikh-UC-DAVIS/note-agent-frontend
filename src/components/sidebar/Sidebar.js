import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Sidebar.css';
import { Home, FileText, Calendar } from 'lucide-react';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/';
    }
    return location.pathname === path;
  };

  return (
    <div className="sidebar">
      <div className="sidebar-content">
        {/* Note Agent Title */}
        <h1 className="sidebar-title">Note Agent</h1>

        {/* User Profile Section */}
        <div className="profile-section">
          <div className="profile-icon"></div>
          <div className="profile-info">
            <div className="profile-name">Profile Name</div>
            <div 
              className="profile-settings" 
              onClick={() => navigate('/settings')}
            >
              Settings
            </div>
          </div>
        </div>

        {/* Agent AI Button */}
        <button 
          className="agent-ai-btn"
          onClick={() => navigate('/agentAI')}
        >
          <span>Agent AI</span>
        </button>

        {/* Navigation Links */}
        <nav className="sidebar-nav">
          <div 
            className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`}
            onClick={() => navigate('/dashboard')}
          >
            <Home size={20} />
            <span>Home</span>
          </div>
          <div 
            className={`nav-item ${isActive('/notes') ? 'active' : ''}`}
            onClick={() => navigate('/notes')}
          >
            <FileText size={20} />
            <span>Notes</span>
          </div>
          <div 
            className={`nav-item ${isActive('/calendar') ? 'active' : ''}`}
            onClick={() => navigate('/calendar')}
          >
            <Calendar size={20} />
            <span>Calendar</span>
          </div>
        </nav>

        {/* Folders Section */}
        <div className="folders-section">
          <h3 className="folders-title">Folders</h3>
          <div className="folder-item">All Notes</div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;

