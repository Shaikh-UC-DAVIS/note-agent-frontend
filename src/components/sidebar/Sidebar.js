import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Sidebar.css';
import { Home, FileText, Calendar } from 'lucide-react';
import { fetchWorkspaces } from '../../api/client';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [workspaces, setWorkspaces] = useState([]);

  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/';
    }
    return location.pathname === path;
  };

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await fetchWorkspaces();
        if (cancelled) return;
        setWorkspaces(data || []);
      } catch {
        // ignore sidebar errors
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

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

        {/* Workspaces Section */}
        <div className="folders-section">
          <h3 className="folders-title">Workspaces</h3>
          {workspaces.length === 0 ? (
            <div className="folder-item">Default</div>
          ) : (
            workspaces.map((ws) => (
              <div
                key={ws.id}
                className="folder-item"
                onClick={() =>
                  navigate('/notes', { state: { workspaceId: ws.id } })
                }
              >
                {ws.name}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;

