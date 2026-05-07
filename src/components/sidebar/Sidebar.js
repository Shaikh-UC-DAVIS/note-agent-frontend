import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Sidebar.css';
import { Home, FileText, Calendar, Upload } from 'lucide-react';
import {
  fetchWorkspaces,
  getCurrentUserEmail,
  setCurrentUserEmail,
  getCurrentUserName,
  setCurrentUserName,
  fetchCurrentUser,
} from '../../api/client';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [workspaces, setWorkspaces] = useState([]);
  const [userEmail, setUserEmail] = useState(getCurrentUserEmail());
  const [userName, setUserName] = useState(getCurrentUserName());
  const [selectedPdfName, setSelectedPdfName] = useState('');
  const [pdfError, setPdfError] = useState('');
  const [uploadState, setUploadState] = useState('idle'); // idle | uploading | processing | ready | error

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

  useEffect(() => {
    // Always reconcile with /auth/me so users who logged in before the name
    // columns existed (or whose localStorage was wiped) see the real name.
    let cancelled = false;
    (async () => {
      try {
        const me = await fetchCurrentUser();
        if (cancelled || !me) return;
        if (me.email) {
          setCurrentUserEmail(me.email);
          setUserEmail(me.email);
        }
        if (me.first_name || me.last_name) {
          setCurrentUserName({ first_name: me.first_name, last_name: me.last_name });
          setUserName({ first_name: me.first_name || '', last_name: me.last_name || '' });
        }
      } catch {
        // ignore — sidebar will show fallback label
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const displayName = (() => {
    const fullName = [userName.first_name, userName.last_name]
      .filter(Boolean)
      .join(' ')
      .trim();
    if (fullName) return fullName;
    if (userEmail) {
      const local = userEmail.split('@')[0] || userEmail;
      return local.charAt(0).toUpperCase() + local.slice(1);
    }
    return 'Guest';
  })();

  const handlePdfSelected = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setPdfError('Only PDF files are supported.');
      setSelectedPdfName('');
      setUploadState('error');
      return;
    }

    setPdfError('');
    setSelectedPdfName(file.name);
    setUploadState('uploading');

    // Temporary visual state flow until backend upload + ML processing API is wired.
    window.setTimeout(() => setUploadState('processing'), 800);
    window.setTimeout(() => setUploadState('ready'), 2600);
  };

  const getUploadStatusLabel = () => {
    if (!selectedPdfName && uploadState === 'idle') return 'No file selected';
    if (uploadState === 'uploading') return 'Uploading PDF...';
    if (uploadState === 'processing') return 'Processing with ML...';
    if (uploadState === 'ready') return 'Ready for summary and insights';
    if (uploadState === 'error') return 'Upload failed';
    return 'Waiting for upload';
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
            <div className="profile-name" title={userEmail || ''}>
              {displayName}
            </div>
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

        <div className="upload-section">
          <h3 className="upload-title">Upload PDF</h3>
          <label
            className={`upload-pdf-btn ${uploadState === 'uploading' || uploadState === 'processing' ? 'is-busy' : ''}`}
          >
            <Upload size={16} />
            <span>Choose PDF</span>
            <input
              type="file"
              accept="application/pdf,.pdf"
              onChange={handlePdfSelected}
              disabled={uploadState === 'uploading' || uploadState === 'processing'}
            />
          </label>
          {selectedPdfName && (
            <div className="upload-file-name" title={selectedPdfName}>
              {selectedPdfName}
            </div>
          )}
          <div className={`upload-status upload-status-${uploadState}`}>
            {(uploadState === 'uploading' || uploadState === 'processing') && (
              <span className="upload-status-dot" />
            )}
            <span>{getUploadStatusLabel()}</span>
          </div>
          {pdfError && <div className="upload-error">{pdfError}</div>}
        </div>

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

