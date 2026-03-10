import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/header/Header'; 
import Footer from '../../components/footer/Footer'; 
import { Eye, EyeOff } from 'lucide-react';
import './Login.css';
import { loginWithPassword } from '../../api/client';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '', submit: '' });
  const [submitting, setSubmitting] = useState(false);

  const validateEmail = (email) => {
    // Check if email is empty
    if (!email) {
      return 'Email is required';
    }
    
    // Check email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    
    // Check if email ends with allowed domains
    const allowedDomains = ['@gmail.com', '@yahoo.com', '@outlook.com', '@hotmail.com'];
    const hasValidDomain = allowedDomains.some(domain => email.toLowerCase().endsWith(domain));
    
    if (!hasValidDomain) {
      return 'Email must end with @gmail.com, @yahoo.com, @outlook.com, or @hotmail.com';
    }
    
    return '';
  };

  const getPasswordRequirements = (password) => {
    return [
      { text: 'At least 8 characters long', valid: password.length >= 8 },
      { text: 'One uppercase letter', valid: /[A-Z]/.test(password) },
      { text: 'One lowercase letter', valid: /[a-z]/.test(password) },
      { text: 'One number', valid: /[0-9]/.test(password) },
      { text: 'One special character', valid: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) }
    ];
  };

  const validatePassword = (password) => {
    // Check if password is empty
    if (!password) {
      return 'required';
    }
    
    const requirements = getPasswordRequirements(password);
    const allValid = requirements.every(req => req.valid);
    
    return allValid ? '' : 'invalid';
  };

  const handleEmailChange = (e) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    // Clear email error when user starts typing
    if (errors.email) {
      setErrors({ ...errors, email: '' });
    }
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    // Clear password error when user starts typing
    if (errors.password) {
      setErrors({ ...errors, password: '' });
    }
  };

  const handleLogin = async () => {
    // Validate email and password
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    
    // If there are errors, set them and don't proceed
    if (emailError || passwordError) {
      setErrors({
        email: emailError,
        password: passwordError
      });
      return;
    }
    
    // Clear any existing errors
    setErrors({ email: '', password: '', submit: '' });

    try {
      setSubmitting(true);
      await loginWithPassword(email, password);
      navigate('/dashboard');
    } catch (err) {
      console.error("Login failed:", err);
      setErrors((prev) => ({
        ...prev,
        submit: err.message || 'Login failed',
      }));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = () => {
    navigate('/register');
  };

  return (
    <div className="login-page">
      {/* Header Component */}
      <Header />

      {/* Main Content */}
      <main className="login-main">
        <div className="login-container">
          {/* Title */}
          <div className="login-title">
            <h1>Welcome to</h1>
            <h2>Note Agent</h2>
          </div>

          {/* Login Form */}
          <div className="login-form">
            {/* Email Input */}
            <div className="input-group">
              <label>Email</label>
              <div className="input-wrapper">
                <span className="input-icon">🖂</span>
                <input
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  placeholder="your@email.com"
                  className={errors.email ? 'input-error' : ''}
                />
              </div>
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            {/* Password Input */}
            <div className="input-group">
              <label>Password</label>
              <div className="input-wrapper">
                <span className="input-icon">🔑︎</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="Enter your password"
                  className={errors.password ? 'input-error' : ''}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {(password || errors.password) && (
                <div className="password-requirements">
                  <span className="requirements-title">Password must contain:</span>
                  <ul className="requirements-list">
                    {getPasswordRequirements(password).map((requirement, index) => (
                      <li key={index} className={requirement.valid ? 'valid' : 'invalid'}>
                        <span className="requirement-icon">{requirement.valid ? '✓' : '✗'}</span>
                        {requirement.text}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Error message */}
            {errors.submit && (
              <span className="error-message" style={{ display: 'block', marginBottom: 8 }}>
                {errors.submit}
              </span>
            )}

            {/* Login Button */}
            <button onClick={handleLogin} className="login-btn" disabled={submitting}>
              {submitting ? 'Logging in…' : 'Login'}
            </button>

            {/* Register Link */}
            <div className="register-link">
              Don't have an account?{' '}
              <span onClick={handleRegister} className="register-text">
                Register
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Component */}
      <Footer />
    </div>
  );
};

export default Login;