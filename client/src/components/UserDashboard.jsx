import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Store,
  Star,
  MapPin,
  Mail,
  Edit3,
  X,
  SlidersHorizontal
} from 'lucide-react';
import { api } from '../services/api';
import StarRating from './StarRating';

export default function UserDashboard({ user, onNotify }) {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('ASC');

  // In-card rating interactive states
  // activeRatingMode: { [storeId]: 'idle' | 'rating' | 'editing' }
  const [activeRatingMode, setActiveRatingMode] = useState({});
  const [cardRatings, setCardRatings] = useState({});
  const [submittingStoreId, setSubmittingStoreId] = useState(null);

  const fetchStores = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getStores({ search, sortBy, sortOrder });
      if (data.success) {
        setStores(data.stores || []);
      }
    } catch {
      onNotify('Failed to retrieve stores.', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, sortBy, sortOrder, onNotify]);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  // Submit new rating directly on card
  const handleCardSubmitRating = async (store, score) => {
    setSubmittingStoreId(store.id);
    try {
      await api.submitRating(store.id, score);
      onNotify(`Your rating (${score} stars) for "${store.name}" submitted successfully!`, 'success');
      setActiveRatingMode(prev => ({ ...prev, [store.id]: 'idle' }));
      fetchStores();
    } catch (err) {
      onNotify(err.message || 'Failed to submit rating.', 'error');
    } finally {
      setSubmittingStoreId(null);
    }
  };

  // Modify rating directly on card
  const handleCardModifyRating = async (store, score) => {
    setSubmittingStoreId(store.id);
    try {
      await api.modifyRating(store.id, score);
      onNotify(`Your rating for "${store.name}" updated to ${score} stars!`, 'success');
      setActiveRatingMode(prev => ({ ...prev, [store.id]: 'idle' }));
      fetchStores();
    } catch (err) {
      onNotify(err.message || 'Failed to update rating.', 'error');
    } finally {
      setSubmittingStoreId(null);
    }
  };

  return (
    <div style={{ padding: '24px 20px', maxWidth: 1240, margin: '0 auto' }}>
      {/* Streamlined, Compact Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(139, 92, 246, 0.05) 100%)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '18px 22px',
        marginBottom: 22,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(99, 102, 241, 0.18)', color: '#a5b4fc', padding: '2px 8px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700, marginBottom: 4 }}>
            <span>NORMAL USER DASHBOARD</span>
          </div>
          <h1 style={{ fontSize: '1.65rem', marginBottom: 2, lineHeight: 1.2 }}>Explore & Rate Stores</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem' }}>
            Discover registered stores, evaluate platform ratings, and manage your personal ratings from 1 to 5 stars.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          {user && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(15, 23, 42, 0.6)',
              padding: '6px 14px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.82rem',
              color: 'var(--text-muted)'
            }}>
              <span style={{ color: '#ffffff', fontWeight: 600 }}>👤 {user.name}</span>
              <span style={{ color: 'var(--text-dim)' }}>•</span>
              <span>{user.email}</span>
            </div>
          )}

          <div style={{
            background: 'var(--bg-card)',
            padding: '8px 16px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}>
            <Store size={18} color="var(--primary-400)" />
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block' }}>
                Stores Registered
              </span>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1 }}>
                {stores.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Sort Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 14,
        marginBottom: 22,
        flexWrap: 'wrap'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 280, maxWidth: 540 }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          <input
            type="text"
            placeholder="Search stores by Name or Address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 40, paddingRight: 36, fontSize: '0.88rem' }}
            id="user-store-search-input"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                color: 'var(--text-dim)',
                cursor: 'pointer'
              }}
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Sort Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <SlidersHorizontal size={16} color="var(--text-dim)" />
          <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>Sort by:</span>
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [f, o] = e.target.value.split('-');
              setSortBy(f);
              setSortOrder(o);
            }}
            style={{ width: 200, fontSize: '0.85rem' }}
            id="user-store-sort-select"
          >
            <option value="name-ASC">Store Name (A-Z)</option>
            <option value="name-DESC">Store Name (Z-A)</option>
            <option value="overall_rating-DESC">Rating (High-Low)</option>
            <option value="overall_rating-ASC">Rating (Low-High)</option>
            <option value="address-ASC">Address (A-Z)</option>
            <option value="address-DESC">Address (Z-A)</option>
          </select>
        </div>
      </div>

      {/* Stores Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <p>Loading stores...</p>
        </div>
      ) : stores.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <Store size={44} color="var(--text-dim)" style={{ marginBottom: 12 }} />
          <h3 style={{ fontSize: '1.2rem', marginBottom: 6 }}>No Stores Found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {search ? 'Try clearing your search query to see all registered stores.' : 'No stores have been added yet.'}
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: 22
        }}>
          {stores.map((s) => {
            const hasUserRated = s.userRating !== null && s.userRating !== undefined;
            const mode = activeRatingMode[s.id] || 'idle';
            const selectedStars = cardRatings[s.id] !== undefined
              ? cardRatings[s.id]
              : (hasUserRated ? s.userRating : 5);

            return (
              <div
                key={s.id}
                className="glass-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: 22
                }}
              >
                <div>
                  {/* Card Header: Store Name & Icon */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                    <div>
                      <h3 style={{ fontSize: '1.25rem', lineHeight: 1.25, marginBottom: 4, color: '#ffffff', fontWeight: 700 }}>
                        {s.name}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-dim)', fontSize: '0.82rem' }}>
                        <Mail size={13} />
                        <span>{s.email}</span>
                      </div>
                    </div>
                    <div style={{
                      background: 'rgba(99, 102, 241, 0.12)',
                      padding: 8,
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--primary-400)',
                      flexShrink: 0
                    }}>
                      <Store size={22} />
                    </div>
                  </div>

                  {/* Store Address */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 16 }}>
                    <MapPin size={15} style={{ flexShrink: 0, marginTop: 2 }} color="var(--text-dim)" />
                    <span>{s.address}</span>
                  </div>

                  {/* SECTION 1: PLATFORM RATING */}
                  <div style={{
                    background: 'rgba(15, 23, 42, 0.55)',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    marginBottom: 16
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                        PLATFORM RATING
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        {s.totalRatings} {s.totalRatings === 1 ? 'evaluation' : 'evaluations'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <StarRating rating={s.overallRating || 0} size={18} />
                      <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--gold-star)' }}>
                        {s.overallRating ? Number(s.overallRating).toFixed(1) : '0.0'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* SECTION 2: YOUR RATING (Separated by clean divider) */}
                <div style={{
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: 16
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                      YOUR RATING
                    </span>
                  </div>

                  {/* CASE A1: User has NOT rated this store yet, and hasn't clicked "Rate This Store" */}
                  {!hasUserRated && mode === 'idle' && (
                    <div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                        You haven't rated this store yet.
                      </p>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                        <StarRating rating={0} size={22} interactive={false} />
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                          (Not rated yet)
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveRatingMode(prev => ({ ...prev, [s.id]: 'rating' }));
                          setCardRatings(prev => ({ ...prev, [s.id]: 5 }));
                        }}
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '8px 16px', fontSize: '0.86rem', justifyContent: 'center' }}
                        id={`rate-store-btn-${s.id}`}
                      >
                        <Star size={14} fill="#ffffff" />
                        <span>Rate This Store</span>
                      </button>
                    </div>
                  )}

                  {/* CASE A2: User has NOT rated this store yet, and is actively selecting stars */}
                  {!hasUserRated && mode === 'rating' && (
                    <div style={{
                      background: 'rgba(99, 102, 241, 0.08)',
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid rgba(99, 102, 241, 0.3)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                          Click to select 1 to 5 stars:
                        </span>
                        <span style={{ fontWeight: 800, color: 'var(--gold-star)', fontSize: '0.95rem' }}>
                          {selectedStars} / 5
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
                        <StarRating
                          rating={selectedStars}
                          interactive={true}
                          size={28}
                          onChange={(val) => setCardRatings(prev => ({ ...prev, [s.id]: val }))}
                        />
                      </div>

                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveRatingMode(prev => ({ ...prev, [s.id]: 'idle' }));
                          }}
                          className="btn btn-secondary"
                          style={{ flex: 1, padding: '7px 12px', fontSize: '0.82rem', justifyContent: 'center' }}
                          id={`cancel-rate-btn-${s.id}`}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCardSubmitRating(s, selectedStars)}
                          disabled={submittingStoreId === s.id}
                          className="btn btn-primary"
                          style={{ flex: 1, padding: '7px 12px', fontSize: '0.82rem', justifyContent: 'center' }}
                          id={`submit-rating-btn-${s.id}`}
                        >
                          {submittingStoreId === s.id ? 'Submitting...' : 'Submit Rating'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* CASE B1: User HAS rated, normal view mode */}
                  {hasUserRated && mode !== 'editing' && (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                        <StarRating rating={s.userRating} size={22} interactive={false} />
                        <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--gold-star)' }}>
                          {s.userRating} / 5
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveRatingMode(prev => ({ ...prev, [s.id]: 'editing' }));
                          setCardRatings(prev => ({ ...prev, [s.id]: s.userRating }));
                        }}
                        className="btn btn-secondary"
                        style={{ width: '100%', padding: '8px 14px', fontSize: '0.86rem', justifyContent: 'center' }}
                        id={`edit-rating-btn-${s.id}`}
                      >
                        <Edit3 size={13} />
                        <span>Edit Rating</span>
                      </button>
                    </div>
                  )}

                  {/* CASE B2: User HAS rated, in edit mode */}
                  {hasUserRated && mode === 'editing' && (
                    <div style={{
                      background: 'rgba(99, 102, 241, 0.08)',
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid rgba(99, 102, 241, 0.3)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                          Select updated rating:
                        </span>
                        <span style={{ fontWeight: 800, color: 'var(--gold-star)', fontSize: '0.95rem' }}>
                          {selectedStars} / 5
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
                        <StarRating
                          rating={selectedStars}
                          interactive={true}
                          size={28}
                          onChange={(val) => setCardRatings(prev => ({ ...prev, [s.id]: val }))}
                        />
                      </div>

                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveRatingMode(prev => ({ ...prev, [s.id]: 'idle' }));
                          }}
                          className="btn btn-secondary"
                          style={{ flex: 1, padding: '7px 12px', fontSize: '0.82rem', justifyContent: 'center' }}
                          id={`cancel-edit-btn-${s.id}`}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCardModifyRating(s, selectedStars)}
                          disabled={submittingStoreId === s.id}
                          className="btn btn-primary"
                          style={{ flex: 1, padding: '7px 12px', fontSize: '0.82rem', justifyContent: 'center' }}
                          id={`update-rating-btn-${s.id}`}
                        >
                          {submittingStoreId === s.id ? 'Saving...' : 'Update Rating'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
