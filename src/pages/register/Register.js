import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/header/Header'; 
import Footer from '../../components/footer/Footer'; 
import { Eye, EyeOff } from 'lucide-react';
import './Register.css';
import { registerUser, loginWithPassword } from '../../api/client';

const Register = () => {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' });

const validateFirstName = (firstName) => {
  if (!firstName) {
    return 'First name is required';
  }
  if (firstName.length < 2) {
    return 'First name must be at least 2 characters';
  }
  return '';
};

const validateLastName = (lastName) => {
  if (!lastName) {
    return 'Last name is required';
  }
  if (lastName.length < 2) {
    return 'Last name must be at least 2 characters';
  }
  return '';
};

  const validateEmail = (email) => {
    if (!email) {
      return 'Email is required';
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    
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
    if (!password) {
      return 'required';
    }
    
    const requirements = getPasswordRequirements(password);
    const allValid = requirements.every(req => req.valid);
    
    return allValid ? '' : 'invalid';
  };

  const validateConfirmPassword = (confirmPassword) => {
    if (!confirmPassword) {
      return 'Please confirm your password';
    }
    if (confirmPassword !== password) {
      return 'Passwords do not match';
    }
    return '';
  };

const handleFirstNameChange = (e) => {
  const newFirstName = e.target.value;
  setFirstName(newFirstName);
  if (errors.firstName) {
    setErrors({ ...errors, firstName: '' });
  }
};

const handleLastNameChange = (e) => {
  const newLastName = e.target.value;
  setLastName(newLastName);
  if (errors.lastName) {
    setErrors({ ...errors, lastName: '' });
  }
};

  const handleEmailChange = (e) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    if (errors.email) {
      setErrors({ ...errors, email: '' });
    }
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    if (errors.password) {
      setErrors({ ...errors, password: '' });
    }
    // Revalidate confirm password if it's already filled
    if (confirmPassword) {
      setErrors({ ...errors, password: '', confirmPassword: '' });
    }
  };

  const handleConfirmPasswordChange = (e) => {
    const newConfirmPassword = e.target.value;
    setConfirmPassword(newConfirmPassword);
    if (errors.confirmPassword) {
      setErrors({ ...errors, confirmPassword: '' });
    }
  };

  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleRegister = async () => {
    // Validate all fields
    const firstNameError = validateFirstName(firstName);
    const lastNameError = validateLastName(lastName);
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    const confirmPasswordError = validateConfirmPassword(confirmPassword);
    
    if (firstNameError || lastNameError || emailError || passwordError || confirmPasswordError) {
      setErrors({
        firstName: firstNameError,
        lastName: lastNameError,
        email: emailError,
        password: passwordError,
        confirmPassword: confirmPasswordError
      });
      return;
    }

    setErrors({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' });
    setSubmitError('');

    try {
      setSubmitting(true);
      await registerUser(email, password);
      // After successful registration, immediately log in to get a token
      await loginWithPassword(email, password);
      navigate('/dashboard');
    } catch (err) {
      console.error('Registration failed:', err);
      setSubmitError(err.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <div className="register-page">
      <Header />

      <main className="register-main">
        <div className="register-container">
          {/* Title */}
          <div className="register-title">
            <h1>Create Account</h1>
            <h2>Note Agent</h2>
          </div>

          {/* Registration Form */}
          <div className="register-form">
            {/* Name Input */}
            <div className="input-group">
  <label>Name</label>
  <div className="input-wrapper">
    <span className="input-icon">
  <svg width="20" height="20" viewBox="0 0 24 18" fill="black">
    <path d="M12 2a5 5 0 110 10 5 5 0 010-10zm0 12c-4.4 0-8 2.2-8 5v3h16v-3c0-2.8-3.6-5-8-5z"/>
  </svg>
</span>
    <input
      type="text"
      value={firstName}
      onChange={handleFirstNameChange}
      placeholder="First Name"
      className={errors.firstName ? 'input-error' : ''}
    />
  </div>
  {errors.firstName && <span className="error-message">{errors.firstName}</span>}
</div>

{/* Last Name Input */}
<div className="input-group">
  <div className="input-wrapper">
    <span className="input-icon">
  <svg width="20" height="20" viewBox="0 0 24 18" fill="black">
    <path d="M12 2a5 5 0 110 10 5 5 0 010-10zm0 12c-4.4 0-8 2.2-8 5v3h16v-3c0-2.8-3.6-5-8-5z"/>
  </svg>
</span>
    <input
      type="text"
      value={lastName}
      onChange={handleLastNameChange}
      placeholder="Last Name"
      className={errors.lastName ? 'input-error' : ''}
    />
  </div>
  {errors.lastName && <span className="error-message">{errors.lastName}</span>}
</div>

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
                  placeholder="Create a password"
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

            {/* Confirm Password Input */}
            <div className="input-group">
              <label>Confirm Password</label>
              <div className="input-wrapper">
                <span className="input-icon">🔑︎</span>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  placeholder="Confirm your password"
                  className={errors.confirmPassword ? 'input-error' : ''}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="password-toggle"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
            </div>

            {/* Error message */}
            {submitError && (
              <span className="error-message" style={{ display: 'block', marginBottom: 8 }}>
                {submitError}
              </span>
            )}

            {/* Register Button */}
            <button onClick={handleRegister} className="register-btn" disabled={submitting}>
              {submitting ? 'Creating account…' : 'Create Account'}
            </button>

            {/* Login Link */}
            <div className="login-link">
              Already have an account?{' '}
              <span onClick={handleLogin} className="login-text">
                Login
              </span>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Register;