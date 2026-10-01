import React, { useState, useEffect, useCallback } from 'react';
import {
  Store,
  Star,
  Users,
  MapPin,
  Mail,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import StarRating from './StarRating';

export default function OwnerDashboard({ user, onNotify }) {
  const [data, setData] = useState({
    hasStore: false,
    store: null,
    stores: [],
    averageRating: 0,
    totalRatings: 0,
    ratings: []
  });
  const [selectedStoreId, setSelectedStoreId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState('updated_at');
  const [sortOrder, setSortOrder] = useState('DESC');

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const params = { sortBy, sortOrder };
      if (selectedStoreId) params.storeId = selectedStoreId;
      const res = await api.getOwnerDashboard(params);
      if (res.success) {
        setData(res);
        if (res.store && !selectedStoreId) {
          setSelectedStoreId(res.store.id);
        }
      }
    } catch {
      onNotify('Failed to retrieve store dashboard metrics.', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedStoreId, sortBy, sortOrder, onNotify]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(column);
      setSortOrder('ASC');
    }
  };

  const renderSortIndicator = (currentCol) => {
    if (currentCol !== sortBy) return <ArrowUpDown size={13} style={{ opacity: 0.3 }} />;
    return sortOrder === 'ASC' ? <ArrowUp size={14} color="var(--primary-400)" /> : <ArrowDown size={14} color="var(--primary-400)" />;
  };

  if (loading && !data.store) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
        <p>Loading your store performance dashboard...</p>
      </div>
    );
  }

  if (!data.hasStore) {
    return (
      <div style={{ padding: '40px 24px', maxWidth: 800, margin: '0 auto' }}>
        <div className="glass-card" style={{ textAlign: 'center', padding: '48px 32px' }}>
          <div style={{
            background: 'rgba(245, 158, 11, 0.15)',
            width: 56,
            height: 56,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            color: '#fbbf24'
          }}>
            <Info size={28} />
          </div>
          <h2 style={{ fontSize: '1.4rem', marginBottom: 8 }}>No Store Assigned Yet</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: 480, margin: '0 auto 20px' }}>
            Your account has the Store Owner role, but the System Administrator hasn't linked your account to a registered store yet.
          </p>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
            Please contact your system administrator to assign your store.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px 24px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(99, 102, 241, 0.05) 100%)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '32px 28px',
        marginBottom: 32,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 20
      }}>
        <div style={{ maxWidth: 640 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(139, 92, 246, 0.15)', color: '#c4b5fd', padding: '4px 10px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600, marginBottom: 8 }}>
            <Store size={12} /> STORE OWNER CONSOLE
          </div>
          <h1 style={{ fontSize: '2rem', marginBottom: 6 }}>{data.store.name}</h1>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Mail size={14} color="var(--text-dim)" /> {data.store.email}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={14} color="var(--text-dim)" /> {data.store.address}
            </span>
          </div>

          {/* Owner details */}
          {user && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
              fontSize: '0.82rem',
              color: 'var(--text-dim)',
              marginTop: 12
            }}>
              <span>Owner: <strong style={{ color: 'var(--text-main)' }}>{user.name}</strong></span>
              <span>•</span>
              <span>{user.email}</span>
            </div>
          )}
        </div>

        {/* Store Selector if owner manages multiple stores */}
        {data.stores && data.stores.length > 1 && (
          <div style={{
            background: 'var(--bg-card)',
            padding: '12px 18px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)'
          }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block', marginBottom: 6 }}>
              Switch Managed Store:
            </label>
            <select
              value={selectedStoreId || data.store.id}
              onChange={(e) => setSelectedStoreId(parseInt(e.target.value, 10))}
              id="owner-store-switcher-select"
              style={{ minWidth: 220 }}
            >
              {data.stores.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 20,
        marginBottom: 36
      }}>
        {/* Average Rating KPI */}
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            padding: 18,
            borderRadius: 'var(--radius-md)',
            color: '#fbbf24'
          }}>
            <Star size={34} fill="#fbbf24" />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Average Store Rating
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 2 }}>
              <h2 style={{ fontSize: '2.4rem', color: 'var(--text-main)', lineHeight: 1 }}>
                {data.averageRating > 0 ? Number(data.averageRating).toFixed(1) : '0.0'}
              </h2>
              <span style={{ fontSize: '1rem', color: 'var(--text-dim)' }}>/ 5.0</span>
            </div>
            <div style={{ marginTop: 4 }}>
              <StarRating rating={data.averageRating} size={16} />
            </div>
          </div>
        </div>

        {/* Total Customers / Reviews */}
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{
            background: 'rgba(59, 130, 246, 0.15)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            padding: 18,
            borderRadius: 'var(--radius-md)',
            color: '#60a5fa'
          }}>
            <Users size={34} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Customer Ratings
            </span>
            <h2 style={{ fontSize: '2.4rem', marginTop: 2, lineHeight: 1 }}>{data.totalRatings}</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginTop: 6 }}>
              Verified customer submissions
            </p>
          </div>
        </div>
      </div>

      {/* Users who rated section */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', marginBottom: 2 }}>Users Who Rated My Store</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Evaluators and normal users who submitted ratings for {data.store.name}
            </p>
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th className="sortable" onClick={() => handleSort('name')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>Customer Name</span>
                    {renderSortIndicator('name')}
                  </div>
                </th>
                <th className="sortable" onClick={() => handleSort('email')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>Email Address</span>
                    {renderSortIndicator('email')}
                  </div>
                </th>
                <th>Address</th>
                <th className="sortable" onClick={() => handleSort('rating')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>Submitted Rating</span>
                    {renderSortIndicator('rating')}
                  </div>
                </th>
                <th className="sortable" onClick={() => handleSort('updated_at')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>Date Evaluated</span>
                    {renderSortIndicator('updated_at')}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                    Loading review entries...
                  </td>
                </tr>
              ) : data.ratings.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
                    No customer ratings have been submitted for your store yet.
                  </td>
                </tr>
              ) : (
                data.ratings.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600 }}>{r.user.name}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{r.user.email}</td>
                    <td style={{ color: 'var(--text-dim)', maxWidth: 260, whiteSpace: 'normal' }}>{r.user.address}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <StarRating rating={r.rating} size={15} />
                        <span style={{
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          background: 'rgba(245, 158, 11, 0.15)',
                          color: '#fbbf24',
                          padding: '2px 8px',
                          borderRadius: 6
                        }}>
                          {r.rating} / 5
                        </span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                      {new Date(r.updatedAt || r.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
