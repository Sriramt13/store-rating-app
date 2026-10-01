import React from 'react';
import { Star, Shield, Store, User, Key, LogOut } from 'lucide-react';

export default function Navbar({ user, onOpenPasswordModal, onLogout, onGoHome }) {
  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN':
        return <span className="badge badge-admin"><Shield size={12} /> Administrator</span>;
      case 'STORE_OWNER':
        return <span className="badge badge-owner"><Store size={12} /> Store Owner</span>;
      case 'USER':
      default:
        return <span className="badge badge-user"><User size={12} /> Normal User</span>;
    }
  };

  return (
    <header style={{
      background: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border-subtle)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      padding: '14px 24px'
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        {/* Brand */}
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
            <h2 style={{ fontSize: '1.25rem', lineHeight: 1.1, background: 'linear-gradient(to right, #ffffff, #c7d2fe)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              StoreRate
            </h2>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', letterSpacing: '0.04em' }}>
              RATING & EVALUATION PLATFORM
            </span>
          </div>
        </div>

        {/* User Info & Actions */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'rgba(30, 41, 59, 0.8)',
              padding: '6px 14px',
              borderRadius: 30,
              border: '1px solid var(--border-subtle)'
            }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #4f46e5, #ec4899)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.85rem'
              }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.name}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  {user.email}
                </span>
              </div>
              {getRoleBadge(user.role)}
            </div>

            <button
              onClick={onOpenPasswordModal}
              className="btn btn-secondary"
              style={{ fontSize: '0.82rem', padding: '8px 14px' }}
              title="Update Password"
              id="change-password-nav-btn"
            >
              <Key size={15} />
              <span>Change Password</span>
            </button>

            <button
              onClick={onLogout}
              className="btn btn-danger"
              style={{ fontSize: '0.82rem', padding: '8px 14px' }}
              title="Sign Out"
              id="logout-nav-btn"
            >
              <LogOut size={15} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
