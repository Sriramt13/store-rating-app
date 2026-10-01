import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import Navbar from './components/Navbar';
import AuthView from './components/AuthView';
import AdminDashboard from './components/AdminDashboard';
import UserDashboard from './components/UserDashboard';
import OwnerDashboard from './components/OwnerDashboard';
import PasswordModal from './components/PasswordModal';
import { api } from './services/api';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export default function App() {
  const navigate = useNavigate();

  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [toasts, setToasts] = useState([]);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Helper to determine role-based dashboard route
  const getDashboardPath = useCallback((role) => {
    if (role === 'ADMIN') return '/admin/dashboard';
    if (role === 'STORE_OWNER') return '/owner/dashboard';
    return '/user/dashboard';
  }, []);

  // Add toast notification helper
  const addToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    addToast('You have been logged out successfully.', 'info');
    navigate('/login', { replace: true });
  }, [navigate]);

  // Verify profile on initial mount if token exists
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.getProfile()
        .then((res) => {
          if (res.success && res.user) {
            setUser(res.user);
            localStorage.setItem('user', JSON.stringify(res.user));
          }
        })
        .catch(() => {
          handleLogout();
        });
    }

    const handleAuthLogout = () => {
      setUser(null);
      addToast('Session expired. Please sign in again.', 'info');
      navigate('/login', { replace: true });
    };

    window.addEventListener('auth:logout', handleAuthLogout);
    return () => window.removeEventListener('auth:logout', handleAuthLogout);
  }, [handleLogout, navigate]);

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    const targetDashboard = getDashboardPath(userData.role);
    navigate(targetDashboard, { replace: true });
  };

  const handleLandingNavigate = (view) => {
    if (view === 'dashboard') {
      if (user) {
        navigate(getDashboardPath(user.role));
      } else {
        navigate('/login');
      }
    } else if (view === 'auth-login') {
      navigate('/login');
    } else if (view === 'auth-register') {
      navigate('/register');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="app-container">
      {/* Toast Notification Container */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            {t.type === 'success' && <CheckCircle size={18} />}
            {t.type === 'error' && <AlertCircle size={18} />}
            {t.type === 'info' && <Info size={18} />}
            <span style={{ flex: 1 }}>{t.message}</span>
            <button
              onClick={() => removeToast(t.id)}
              style={{ background: 'transparent', color: 'inherit', padding: 2, display: 'flex' }}
            >
              <X size={15} />
            </button>
          </div>
        ))}
      </div>

      <Routes>
        {/* LANDING PAGE ROUTE */}
        <Route
          path="/"
          element={
            <LandingPage
              user={user}
              onNavigate={handleLandingNavigate}
              onLogout={handleLogout}
            />
          }
        />

        {/* SINGLE LOGIN PAGE FOR ALL 3 ROLES */}
        <Route
          path="/login"
          element={
            user ? (
              <Navigate to={getDashboardPath(user.role)} replace />
            ) : (
              <AuthView
                initialMode="login"
                onAuthSuccess={handleAuthSuccess}
                onBackToLanding={() => navigate('/')}
                onNotify={addToast}
              />
            )
          }
        />

        {/* REGISTRATION PAGE FOR NORMAL USERS */}
        <Route
          path="/register"
          element={
            user ? (
              <Navigate to={getDashboardPath(user.role)} replace />
            ) : (
              <AuthView
                initialMode="register"
                onAuthSuccess={handleAuthSuccess}
                onBackToLanding={() => navigate('/')}
                onNotify={addToast}
              />
            )
          }
        />

        {/* ROLE 1: SYSTEM ADMINISTRATOR DASHBOARD & SUB-VIEWS */}
        <Route
          path="/admin/dashboard"
          element={
            !user ? (
              <Navigate to="/login" replace />
            ) : user.role !== 'ADMIN' ? (
              <Navigate to={getDashboardPath(user.role)} replace />
            ) : (
              <>
                <Navbar
                  user={user}
                  onOpenPasswordModal={() => setIsPasswordModalOpen(true)}
                  onLogout={handleLogout}
                  onGoHome={() => navigate('/')}
                />
                <main>
                  <AdminDashboard user={user} onNotify={addToast} defaultTab="users" />
                </main>
              </>
            )
          }
        />

        <Route
          path="/admin/users"
          element={
            !user ? (
              <Navigate to="/login" replace />
            ) : user.role !== 'ADMIN' ? (
              <Navigate to={getDashboardPath(user.role)} replace />
            ) : (
              <>
                <Navbar
                  user={user}
                  onOpenPasswordModal={() => setIsPasswordModalOpen(true)}
                  onLogout={handleLogout}
                  onGoHome={() => navigate('/')}
                />
                <main>
                  <AdminDashboard user={user} onNotify={addToast} defaultTab="users" />
                </main>
              </>
            )
          }
        />

        <Route
          path="/admin/stores"
          element={
            !user ? (
              <Navigate to="/login" replace />
            ) : user.role !== 'ADMIN' ? (
              <Navigate to={getDashboardPath(user.role)} replace />
            ) : (
              <>
                <Navbar
                  user={user}
                  onOpenPasswordModal={() => setIsPasswordModalOpen(true)}
                  onLogout={handleLogout}
                  onGoHome={() => navigate('/')}
                />
                <main>
                  <AdminDashboard user={user} onNotify={addToast} defaultTab="stores" />
                </main>
              </>
            )
          }
        />

        {/* ROLE 2: NORMAL USER DASHBOARD */}
        <Route
          path="/user/dashboard"
          element={
            !user ? (
              <Navigate to="/login" replace />
            ) : user.role !== 'USER' ? (
              <Navigate to={getDashboardPath(user.role)} replace />
            ) : (
              <>
                <Navbar
                  user={user}
                  onOpenPasswordModal={() => setIsPasswordModalOpen(true)}
                  onLogout={handleLogout}
                  onGoHome={() => navigate('/')}
                />
                <main>
                  <UserDashboard user={user} onNotify={addToast} />
                </main>
              </>
            )
          }
        />

        {/* ROLE 3: STORE OWNER DASHBOARD */}
        <Route
          path="/owner/dashboard"
          element={
            !user ? (
              <Navigate to="/login" replace />
            ) : user.role !== 'STORE_OWNER' ? (
              <Navigate to={getDashboardPath(user.role)} replace />
            ) : (
              <>
                <Navbar
                  user={user}
                  onOpenPasswordModal={() => setIsPasswordModalOpen(true)}
                  onLogout={handleLogout}
                  onGoHome={() => navigate('/')}
                />
                <main>
                  <OwnerDashboard user={user} onNotify={addToast} />
                </main>
              </>
            )
          }
        />

        {/* FALLBACK REDIRECT */}
        <Route
          path="*"
          element={<Navigate to={user ? getDashboardPath(user.role) : '/'} replace />}
        />
      </Routes>

      {/* PASSWORD MODAL */}
      <PasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onNotify={addToast}
      />
    </div>
  );
}
