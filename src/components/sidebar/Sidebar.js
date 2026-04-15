import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Sidebar.css';
import { Home, FileText, Calendar, Upload } from 'lucide-react';
import { fetchWorkspaces } from '../../api/client';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [workspaces, setWorkspaces] = useState([]);
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

