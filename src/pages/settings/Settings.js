import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/sidebar/Sidebar";
import DashboardHeader from "../../components/dashboard-header/DashboardHeader";
import { auth } from "../../firebase/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  User,
  Shield,
  Info,
  LogOut,
} from "lucide-react";
import "./Settings.css";

function Settings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setDisplayName(currentUser.displayName || currentUser.email?.split("@")[0] || "User");
      } else {
        setDisplayName("User");
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (err) {
      console.error("Sign out failed:", err);
    }
  };

  const handleSaveProfile = () => {
    // In a real app, would update user profile in Firebase/backend
    setSavedMessage("Profile saved!");
    setTimeout(() => setSavedMessage(""), 2000);
  };

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="dashboard-main">
        <DashboardHeader />
        <div className="dashboard-content settings-content">
          <h1 className="settings-page-title">Settings</h1>
          <p className="settings-subtitle">Manage your profile and preferences</p>

          {/* Profile Section */}
          <section className="settings-section">
            <div className="settings-section-header">
              <User size={22} className="settings-section-icon" />
              <h2>Profile</h2>
            </div>
            <div className="settings-section-body">
              <div className="profile-avatar">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Profile" />
                ) : (
                  <div className="avatar-placeholder">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="settings-form">
                <div className="form-group">
                  <label>Display Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name"
                    disabled={!user}
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={user?.email || "Not signed in"}
                    disabled
                    className="read-only"
                  />
                </div>
                {user && (
                  <button className="btn-primary" onClick={handleSaveProfile}>
                    Save changes
                  </button>
                )}
                {savedMessage && (
                  <span className="saved-message">{savedMessage}</span>
                )}
              </div>
            </div>
          </section>

          {/* Account Section */}
          <section className="settings-section">
            <div className="settings-section-header">
              <Shield size={22} className="settings-section-icon" />
              <h2>Account</h2>
            </div>
            <div className="settings-section-body">
              <div className="settings-row account-actions">
                <button className="btn-danger" onClick={handleSignOut}>
                  <LogOut size={18} />
                  Sign out
                </button>
              </div>
            </div>
          </section>

          {/* About Section */}
          <section className="settings-section">
            <div className="settings-section-header">
              <Info size={22} className="settings-section-icon" />
              <h2>About</h2>
            </div>
            <div className="settings-section-body">
              <div className="about-info">
                <p><strong>Note Agent</strong> v1.0.0</p>
                <p className="about-description">
                  Your AI-powered note-taking and organization assistant.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default Settings;
