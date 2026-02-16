import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/header/Header'; 
import Footer from '../../components/footer/Footer'; 
import { Eye, EyeOff } from 'lucide-react';
import './Login.css';
import { signInWithGoogle, auth } from '../../firebase/firebase';
import { authRequest } from '../../utils/authRequest';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '' });

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

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithGoogle();
      const user = result.user;
      console.log("Logged in:", user.email);
      
      // OPTIONAL: test backend request after login
      // Uncomment the following lines once your backend is set up to verify Firebase tokens
      // const response = await authRequest("http://localhost:3000/api/hello");
      // const data = await response.json();
      // console.log("Backend response:", data);
      
      // redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error("Login failed:", err);
      // You might want to show an error message to the user here
    }
  };

  const handleAppleLogin = () => {
    console.log('Apple login clicked');
    // Add your Apple OAuth logic here
  };

  const handleLogin = () => {
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
    setErrors({ email: '', password: '' });
    
    console.log('Login submitted', { email, password });
    // Add your authentication logic here
    // On success:
    navigate('/dashboard');
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

          {/* Social Login Buttons */}
          <div className="social-login">
            <button onClick={handleGoogleLogin} className="social-btn google-btn">
              <svg width="20" height="20" viewBox="0 0 20 20">
                <path fill="#4285F4" d="M19.6 10.23c0-.82-.1-1.42-.25-2.05H10v3.72h5.5c-.15.96-.74 2.31-2.04 3.22v2.45h3.16c1.89-1.73 2.98-4.3 2.98-7.34z"/>
                <path fill="#34A853" d="M13.46 15.13c-.83.59-1.96 1-3.46 1-2.64 0-4.88-1.74-5.68-4.15H1.07v2.52C2.72 17.75 6.09 20 10 20c2.7 0 4.96-.89 6.62-2.42l-3.16-2.45z"/>
                <path fill="#FBBC05" d="M3.99 10c0-.69.12-1.35.32-1.97V5.51H1.07A9.973 9.973 0 000 10c0 1.61.39 3.14 1.07 4.49l3.24-2.52c-.2-.62-.32-1.28-.32-1.97z"/>
                <path fill="#EA4335" d="M10 3.88c1.88 0 3.13.81 3.85 1.48l2.84-2.76C14.96.99 12.7 0 10 0 6.09 0 2.72 2.25 1.07 5.51l3.24 2.52C5.12 5.62 7.36 3.88 10 3.88z"/>
              </svg>
              Login with Google
            </button>
          </div>

          {/* Divider */}
          <div className="divider">
            <span>OR</span>
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

            {/* Login Button */}
            <button onClick={handleLogin} className="login-btn">
              Login
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