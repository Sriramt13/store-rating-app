import React from 'react';
import {
  Star,
  Shield,
  Store,
  User,
  LogIn,
  UserPlus,
  Sparkles,
  ArrowRight,
  LogOut,
  LayoutDashboard
} from 'lucide-react';

export default function LandingPage({ user, onNavigate, onLogout }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navigation */}
      <header style={{
        borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        padding: '16px 28px'
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              background: 'var(--primary-gradient)',
              width: 38,
              height: 38,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 10px rgba(99, 102, 241, 0.4)'
            }}>
              <Star size={20} fill="#ffffff" color="#ffffff" />
            </div>
            <div>
              <span style={{ fontSize: '1.3rem', fontWeight: 800, background: 'linear-gradient(to right, #ffffff, #c7d2fe)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'block', lineHeight: 1.1 }}>
                StoreRate
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', letterSpacing: '0.04em' }}>
                STORE EVALUATION PLATFORM
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {user ? (
              <>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'rgba(30, 41, 59, 0.8)',
                  padding: '6px 14px',
                  borderRadius: 20,
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.85rem'
                }}>
                  <span style={{ color: 'var(--text-dim)' }}>Signed in as:</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{user.name}</span>
                  <span className={`badge ${user.role === 'ADMIN' ? 'badge-admin' : user.role === 'STORE_OWNER' ? 'badge-owner' : 'badge-user'}`} style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                    {user.role}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigate('dashboard')}
                  className="btn btn-primary"
                  id="landing-dashboard-btn"
                  style={{ padding: '8px 18px', fontSize: '0.88rem' }}
                >
                  <LayoutDashboard size={15} />
                  <span>Go to Dashboard</span>
                </button>

                <button
                  type="button"
                  onClick={onLogout}
                  className="btn btn-secondary"
                  id="landing-logout-btn"
                  style={{ padding: '8px 14px', fontSize: '0.88rem' }}
                >
                  <LogOut size={15} />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onNavigate('auth-login')}
                  className="btn btn-secondary"
                  id="landing-login-btn"
                  style={{ padding: '8px 20px', fontSize: '0.9rem' }}
                >
                  <LogIn size={15} />
                  <span>Login</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('auth-register')}
                  className="btn btn-primary"
                  id="landing-register-btn"
                  style={{ padding: '8px 20px', fontSize: '0.9rem' }}
                >
                  <UserPlus size={15} />
                  <span>Get Started</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main style={{ flex: 1, maxWidth: 1140, margin: '0 auto', padding: '50px 24px 70px', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(99, 102, 241, 0.12)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          padding: '6px 16px',
          borderRadius: 999,
          fontSize: '0.82rem',
          color: '#a5b4fc',
          marginBottom: 20
        }}>
          <Sparkles size={14} />
          <span>Community Store Ratings & Quality Assurance Platform</span>
        </div>

        <h1 style={{
          fontSize: '3.1rem',
          fontWeight: 800,
          lineHeight: 1.15,
          marginBottom: 20,
          background: 'linear-gradient(to right, #ffffff, #c7d2fe, #a5b4fc)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          maxWidth: 880,
          margin: '0 auto 20px'
        }}>
          Rate Stores with Confidence. Discover Verified Excellence.
        </h1>

        <p style={{
          color: 'var(--text-muted)',
          fontSize: '1.1rem',
          maxWidth: 720,
          margin: '0 auto 36px',
          lineHeight: 1.6
        }}>
          Empowering shoppers with authentic 1 to 5 star evaluations, supporting store owners with transparent customer feedback, and providing administrators with full platform governance.
        </p>

        {/* Hero Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 54 }}>
          {user ? (
            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              className="btn btn-primary"
              id="hero-dashboard-btn"
              style={{ padding: '14px 34px', fontSize: '1.05rem', boxShadow: '0 4px 20px rgba(99, 102, 241, 0.45)' }}
            >
              <LayoutDashboard size={18} />
              <span>Open My Dashboard ({user.role})</span>
              <ArrowRight size={16} />
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onNavigate('auth-login')}
                className="btn btn-primary"
                id="hero-signin-btn"
                style={{ padding: '14px 32px', fontSize: '1.05rem', boxShadow: '0 4px 20px rgba(99, 102, 241, 0.45)' }}
              >
                <LogIn size={18} />
                <span>Login / Access Portal</span>
                <ArrowRight size={16} />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('auth-register')}
                className="btn btn-secondary"
                id="hero-register-btn"
                style={{ padding: '14px 28px', fontSize: '1.05rem' }}
              >
                <UserPlus size={18} />
                <span>Create New Account</span>
              </button>
            </>
          )}
        </div>

        {/* Value Proposition Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 24, textAlign: 'left' }}>
          <div className="glass-card" style={{ padding: 28 }}>
            <div style={{
              background: 'rgba(245, 158, 11, 0.15)',
              width: 46,
              height: 46,
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fbbf24',
              marginBottom: 16
            }}>
              <Star size={24} fill="#fbbf24" />
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: 8, color: '#ffffff' }}>1–5 Star Rating System</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.55 }}>
              Submit honest evaluations from 1 to 5 stars for any registered store. Backed by single-rating integrity constraints and instant rating modification support.
            </p>
          </div>

          <div className="glass-card" style={{ padding: 28 }}>
            <div style={{
              background: 'rgba(99, 102, 241, 0.15)',
              width: 46,
              height: 46,
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary-400)',
              marginBottom: 16
            }}>
              <Store size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: 8, color: '#ffffff' }}>Store Owner Console</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.55 }}>
              Store owners access live computed average ratings, total verified evaluation counts, and detailed customer reviews sorted by customer name, rating, or date.
            </p>
          </div>

          <div className="glass-card" style={{ padding: 28 }}>
            <div style={{
              background: 'rgba(16, 185, 129, 0.15)',
              width: 46,
              height: 46,
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10b981',
              marginBottom: 16
            }}>
              <Shield size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: 8, color: '#ffffff' }}>Platform Governance</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.55 }}>
              Enforces strict validation (Name 20–60 characters, password complexity, address length), role-based JWT security, and relational persistent SQL storage.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-subtle)',
        padding: '22px 24px',
        textAlign: 'center',
        color: 'var(--text-dim)',
        fontSize: '0.84rem',
        background: 'rgba(15, 23, 42, 0.5)'
      }}>
        StoreRate Platform • Enterprise Grade Store Evaluation & Quality Assurance
      </footer>
    </div>
  );
}
