import React, { useState } from 'react';
import { X, Key, Check, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { checkPasswordCriteria, validatePassword } from '../utils/validators';

export default function PasswordModal({ isOpen, onClose, onNotify }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const criteria = checkPasswordCriteria(newPassword);
  const isCriteriaMet = criteria.length && criteria.uppercase && criteria.specialChar;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!currentPassword) {
      setError('Please provide your current password.');
      return;
    }

    const passErr = validatePassword(newPassword);
    if (passErr) {
      setError(passErr);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.updatePassword({ currentPassword, newPassword });
      onNotify('Password updated successfully!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              background: 'rgba(99, 102, 241, 0.2)',
              padding: 8,
              borderRadius: 8,
              color: 'var(--primary-400)'
            }}>
              <Key size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem' }}>Update Password</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Enhance your account security with a compliant password
              </p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        {error && (
          <div style={{
            background: 'var(--danger-bg)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 14px',
            marginBottom: 16,
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

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Current Password</label>
            <input
              type="password"
              placeholder="Enter current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              id="current-password-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">New Password</label>
            <input
              type="password"
              placeholder="Enter new secure password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              id="new-password-input"
            />

            {/* Criteria Checklist */}
            <div style={{
              marginTop: 10,
              padding: '10px 12px',
              background: 'rgba(15, 23, 42, 0.7)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.78rem',
              display: 'flex',
              flexDirection: 'column',
              gap: 4
            }}>
              <span style={{ fontWeight: 600, color: 'var(--text-muted)', marginBottom: 2 }}>
                Password Requirements:
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: criteria.length ? 'var(--success-text)' : 'var(--text-dim)' }}>
                <Check size={13} color={criteria.length ? 'var(--success-text)' : 'var(--text-dim)'} />
                <span>8 to 16 characters in length</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: criteria.uppercase ? 'var(--success-text)' : 'var(--text-dim)' }}>
                <Check size={13} color={criteria.uppercase ? 'var(--success-text)' : 'var(--text-dim)'} />
                <span>At least one uppercase letter (A-Z)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: criteria.specialChar ? 'var(--success-text)' : 'var(--text-dim)' }}>
                <Check size={13} color={criteria.specialChar ? 'var(--success-text)' : 'var(--text-dim)'} />
                <span>At least one special character (!@#$%^&* etc.)</span>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <input
              type="password"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              id="confirm-password-input"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !isCriteriaMet}
              id="submit-password-btn"
            >
              {loading ? 'Updating...' : 'Save New Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
