import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Footer.css';
import { FaFacebook, FaLinkedin, FaYoutube, FaInstagram } from 'react-icons/fa';

const Footer = () => {
  const navigate = useNavigate();

  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="footer-logo">Note Agent</div>
        <div className="footer-links">
          <a onClick={() => navigate('/register')} style={{ cursor: 'pointer' }}>Sign Up</a>
          <a onClick={() => navigate('/login')} style={{ cursor: 'pointer' }}>Login</a>
          <a href="#about">About Us</a>
          <a href="#contact">Contact Us</a>
        </div>
      </div>
      <div className="footer-social">
        <FaFacebook className="social-icon" />
        <FaLinkedin className="social-icon" />
        <FaYoutube className="social-icon" />
        <FaInstagram className="social-icon" />
      </div>
    </footer>
  );
};

export default Footer;