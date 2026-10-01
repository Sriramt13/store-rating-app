import React, { useState } from 'react';
import {
  Star,
  Shield,
  Store,
  User,
  LogIn,
  UserPlus,
  Lock,
  Mail,
  AlertCircle,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { api } from '../services/api';
import {
  validateName,
  validateEmail,
  validatePassword,
  validateAddress,
  checkPasswordCriteria
} from '../utils/validators';

export default function AuthView({ onAuthSuccess, onNotify, onBackToLanding, initialMode = 'login' }) {
  const [isLogin, setIsLogin] = useState(initialMode !== 'register');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formErrors, setFormErrors] = useState({});

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    address: ''
  });

  const regPasswordCriteria = checkPasswordCriteria(registerData.password);
  const isRegisterPasswordValid = regPasswordCriteria.length && regPasswordCriteria.uppercase && regPasswordCriteria.specialChar;

  // Demo accounts quick-fill
  const fillDemoAccount = (email, pwd) => {
    setIsLogin(true);
    setLoginEmail(email);
    setLoginPassword(pwd);
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await api.login({ email: loginEmail, password: loginPassword });
      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onNotify(`Welcome back, ${data.user.name}!`, 'success');
        onAuthSuccess(data.user);
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    const errors = {};

    const nameErr = validateName(registerData.name);
    if (nameErr) errors.name = nameErr;

    const emailErr = validateEmail(registerData.email);
    if (emailErr) errors.email = emailErr;

    const passErr = validatePassword(registerData.password);
    if (passErr) errors.password = passErr;

    const addrErr = validateAddress(registerData.address);
    if (addrErr) errors.address = addrErr;

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const data = await api.register(registerData);
      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onNotify('Registration successful! Welcome to StoreRate.', 'success');
        onAuthSuccess(data.user);
      }
    } catch (err) {
      if (err.errors) {
        setFormErrors(err.errors);
      } else {
        setError(err.message || 'Registration failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '40px 20px'
    }}>
      {/* Return to Landing Page Button */}
      {onBackToLanding && (
        <button
          type="button"
          onClick={onBackToLanding}
          className="btn btn-secondary"
          id="back-to-landing-btn"
          style={{ marginBottom: 20, fontSize: '0.85rem', padding: '6px 14px' }}
        >
          <ArrowLeft size={15} />
          <span>Back to Landing Page</span>
        </button>
      )}

      {/* Brand Hero */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{
          background: 'var(--primary-gradient)',
          width: 54,
          height: 54,
          borderRadius: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 14px',
          boxShadow: '0 4px 20px rgba(99, 102, 241, 0.45)'
        }}>
          <Star size={30} fill="#ffffff" color="#ffffff" />
        </div>
        <h1 style={{ fontSize: '2.2rem', marginBottom: 6, background: 'linear-gradient(to right, #ffffff, #c7d2fe)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          StoreRate Platform
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Transparent store ratings, verified customer feedback, and multi-role portal
        </p>
      </div>

      {/* Main Auth Card */}
      <div className="glass-card" style={{ width: '100%', maxWidth: 480, padding: 32 }}>
        {/* Toggle Switch */}
        <div style={{
          display: 'flex',
          background: 'rgba(15, 23, 42, 0.6)',
          padding: 4,
          borderRadius: 'var(--radius-sm)',
          marginBottom: 24,
          border: '1px solid var(--border-subtle)'
        }}>
          <button
            type="button"
            onClick={() => { setIsLogin(true); setError(''); setFormErrors({}); }}
            style={{
              flex: 1,
              padding: '9px 0',
              borderRadius: 6,
              fontSize: '0.9rem',
              fontWeight: 600,
              background: isLogin ? 'var(--primary-gradient)' : 'transparent',
              color: isLogin ? '#ffffff' : 'var(--text-dim)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6
            }}
            id="tab-login-btn"
          >
            <LogIn size={15} />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(false); setError(''); setFormErrors({}); }}
            style={{
              flex: 1,
              padding: '9px 0',
              borderRadius: 6,
              fontSize: '0.9rem',
              fontWeight: 600,
              background: !isLogin ? 'var(--primary-gradient)' : 'transparent',
              color: !isLogin ? '#ffffff' : 'var(--text-dim)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6
            }}
            id="tab-register-btn"
          >
            <UserPlus size={15} />
            <span>Register</span>
          </button>
        </div>

        {error && (
          <div style={{
            background: 'var(--danger-bg)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 14px',
            marginBottom: 18,
            color: 'var(--danger-text)',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        {isLogin ? (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input
                  type="email"
                  placeholder="admin@storerating.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  style={{ paddingLeft: 40 }}
                  required
                  id="login-email-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  style={{ paddingLeft: 40 }}
                  required
                  id="login-password-input"
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', marginTop: 8, padding: 12 }}
              id="submit-login-btn"
            >
              <LogIn size={16} />
              <span>{loading ? 'Authenticating...' : 'Sign In to Account'}</span>
            </button>
          </form>
        ) : (
          /* REGISTRATION FORM */
          <form onSubmit={handleRegister}>
            {/* Full Name */}
            <div className="form-group">
              <div className="form-label">
                <span>Full Name</span>
                <span className={`char-count ${registerData.name.trim().length >= 20 && registerData.name.trim().length <= 60 ? 'valid' : 'invalid'}`}>
                  {registerData.name.trim().length}/60 (min 20)
                </span>
              </div>
              <input
                type="text"
                placeholder="Christopher David Nolan"
                value={registerData.name}
                onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                required
                id="register-name-input"
              />
              {formErrors.name && <div className="form-error"><AlertCircle size={13} /> {formErrors.name}</div>}
            </div>

            {/* Email */}
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input
                  type="email"
                  placeholder="christopher@example.com"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  style={{ paddingLeft: 40 }}
                  required
                  id="register-email-input"
                />
              </div>
              {formErrors.email && <div className="form-error"><AlertCircle size={13} /> {formErrors.email}</div>}
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input
                  type="password"
                  placeholder="Password@123"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                  style={{ paddingLeft: 40 }}
                  required
                  id="register-password-input"
                />
              </div>

              {/* Password Checklist */}
              <div style={{
                marginTop: 8,
                padding: '8px 10px',
                background: 'rgba(15, 23, 42, 0.6)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.74rem',
                display: 'flex',
                gap: 12,
                flexWrap: 'wrap'
              }}>
                <span style={{ color: regPasswordCriteria.length ? 'var(--success-text)' : 'var(--text-dim)' }}>
                  ✓ 8-16 chars
                </span>
                <span style={{ color: regPasswordCriteria.uppercase ? 'var(--success-text)' : 'var(--text-dim)' }}>
                  ✓ 1 Uppercase
                </span>
                <span style={{ color: regPasswordCriteria.specialChar ? 'var(--success-text)' : 'var(--text-dim)' }}>
                  ✓ 1 Special Char
                </span>
              </div>
              {formErrors.password && <div className="form-error"><AlertCircle size={13} /> {formErrors.password}</div>}
            </div>

            {/* Physical Address */}
            <div className="form-group">
              <div className="form-label">
                <span>Address</span>
                <span className={`char-count ${registerData.address.trim().length <= 400 ? 'valid' : 'invalid'}`}>
                  {registerData.address.trim().length}/400
                </span>
              </div>
              <textarea
                rows="2"
                placeholder="12 Sunset Heights Boulevard, Oakridge Hills"
                value={registerData.address}
                onChange={(e) => setRegisterData({ ...registerData, address: e.target.value })}
                required
                id="register-address-input"
              />
              {formErrors.address && <div className="form-error"><AlertCircle size={13} /> {formErrors.address}</div>}
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !isRegisterPasswordValid}
              style={{ width: '100%', marginTop: 8, padding: 12 }}
              id="submit-register-btn"
            >
              <UserPlus size={16} />
              <span>{loading ? 'Creating Account...' : 'Complete Registration'}</span>
            </button>
          </form>
        )}

        {/* DEMO ACCOUNTS QUICK-FILL */}
        <div style={{
          marginTop: 26,
          paddingTop: 18,
          borderTop: '1px solid var(--border-subtle)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: 10 }}>
            <Sparkles size={14} color="var(--primary-400)" />
            <span>Fast Evaluator Demo Login:</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button
              type="button"
              onClick={() => fillDemoAccount('admin@storerating.com', 'Password@123')}
              className="btn btn-secondary"
              style={{ justifyContent: 'space-between', padding: '6px 12px', fontSize: '0.78rem' }}
              id="fill-demo-admin-btn"
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Shield size={13} color="#f472b6" /> Admin: admin@storerating.com
              </span>
              <span style={{ color: 'var(--text-dim)' }}>Password@123</span>
            </button>

            <button
              type="button"
              onClick={() => fillDemoAccount('alexander@hendersonretail.com', 'Password@123')}
              className="btn btn-secondary"
              style={{ justifyContent: 'space-between', padding: '6px 12px', fontSize: '0.78rem' }}
              id="fill-demo-owner-btn"
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Store size={13} color="#a78bfa" /> Store Owner: alexander@hendersonretail.com
              </span>
              <span style={{ color: 'var(--text-dim)' }}>Password@123</span>
            </button>

            <button
              type="button"
              onClick={() => fillDemoAccount('christopher@moviefan.com', 'Password@123')}
              className="btn btn-secondary"
              style={{ justifyContent: 'space-between', padding: '6px 12px', fontSize: '0.78rem' }}
              id="fill-demo-user-btn"
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <User size={13} color="#60a5fa" /> Normal User: christopher@moviefan.com
              </span>
              <span style={{ color: 'var(--text-dim)' }}>Password@123</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
