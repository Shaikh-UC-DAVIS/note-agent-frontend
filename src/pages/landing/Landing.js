import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from 'components/header/Header'; 
import Footer from 'components/footer/Footer'; 
import './Landing.css'; 

import BrainIcon from 'images/BrainIcon.png'; 
import SearchIcon from 'images/SearchIcon.png'; 
import GlobeIcon from 'images/GlobeIcon.png'; 

const Landing = () => {
  const navigate = useNavigate();

  const handleSignUpClick = () => {
    // Navigates to the dashboard route
    navigate('/register'); 
  };

  return (
    <div className="landing-page">
      {/* 1. Header Component */}
      <Header />

      {/* 2. Hero Section */}
      <section className="hero">
        <h1 className="hero-title">Welcome to Note Agent</h1>
        <p className="hero-subtitle">
          An AI-powered note-taking app that helps users create, organize, and summarize notes, tasks, and events seamlessly
        </p>
        <button className="cta-btn" onClick={handleSignUpClick}>
          Sign Up
        </button>
      </section>

      {/* 3. Features Section  */}
      <section className="features">
        <h2>Features</h2>
        <div className="features-grid">

          {/* Feature 1 */}
          <div className="feature-card">
            <img src={BrainIcon} alt="Smart Note Creation Icon" className="feature-icon" />
            <h3>Smart Note Creation</h3>
            <p>Turn any lecture or PDF into clear, organized notes instantly</p>
          </div>

          {/* Feature 2 */}
          <div className="feature-card">
            <img src={SearchIcon} alt="Ask & Find Anything Icon" className="feature-icon" />
            <h3>Ask & Find Anything</h3>
            <p>Search your notes just by asking questions</p>
          </div>

          {/* Feature 3 */}
          <div className="feature-card">
            <img src={GlobeIcon} alt="Connected Ideas Icon" className="feature-icon" />
            <h3>Connected Ideas</h3>
            <p>See how your thoughts and topics link together</p>
          </div>

        </div>
      </section>

      {/* 4. Footer Component */}
      <Footer />
    </div>
  );
};

// Helper component for the feature cards, now taking a Component as a prop
const FeatureCard = ({ IconComponent, title, description }) => (
  <div className="feature-card">
    {/* RENDER THE ICON COMPONENT */}
    <IconComponent className="feature-icon" />
    <h3>{title}</h3>
    <p>{description}</p>
  </div>
);

export default Landing;