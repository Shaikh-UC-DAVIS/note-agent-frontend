import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Header.css';

const Header = () => {
  const navigate = useNavigate();

  return (
    <header className="header">
      <div className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
        Note Agent
      </div>
      <nav className="nav">
        <a href="#about" className="nav-link">About Us</a>
        <button className="login-btn" onClick={() => navigate('/login')}>
          Login
        </button>
      </nav>
    </header>
  );
};

export default Header;