import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Store,
  Star,
  Plus,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  Mail,
  MapPin,
  Shield,
  UserCheck,
  AlertCircle,
  Eye,
  Calendar
} from 'lucide-react';
import { api } from '../services/api';
import StarRating from './StarRating';
import {
  validateName,
  validateEmail,
  validatePassword,
  validateAddress,
  checkPasswordCriteria
} from '../utils/validators';

export default function AdminDashboard({ user: _user, onNotify, defaultTab = 'users' }) {
  const [stats, setStats] = useState({ totalUsers: 0, totalStores: 0, totalRatings: 0 });
  const [activeTab, setActiveTab] = useState(defaultTab);

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);

  // Users state
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userNameFilter, setUserNameFilter] = useState('');
  const [userEmailFilter, setUserEmailFilter] = useState('');
  const [userAddressFilter, setUserAddressFilter] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userSortBy, setUserSortBy] = useState('created_at');
  const [userSortOrder, setUserSortOrder] = useState('DESC');

  // Stores state
  const [stores, setStores] = useState([]);
  const [loadingStores, setLoadingStores] = useState(false);
  const [storeNameFilter, setStoreNameFilter] = useState('');
  const [storeEmailFilter, setStoreEmailFilter] = useState('');
  const [storeAddressFilter, setStoreAddressFilter] = useState('');
  const [storeSortBy, setStoreSortBy] = useState('name');
  const [storeSortOrder, setStoreSortOrder] = useState('ASC');

  // Modals state
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAddStoreModal, setShowAddStoreModal] = useState(false);
  const [selectedUserDetails, setSelectedUserDetails] = useState(null);
  const [availableOwners, setAvailableOwners] = useState([]);

  // Form states for New User
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    address: '',
    role: 'USER'
  });
  const [userFormErrors, setUserFormErrors] = useState({});
  const [savingUser, setSavingUser] = useState(false);

  // Form states for New Store
  const [newStore, setNewStore] = useState({
    name: '',
    email: '',
    address: '',
    ownerId: ''
  });
  const [storeFormErrors, setStoreFormErrors] = useState({});
  const [savingStore, setSavingStore] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const data = await api.getDashboardStats();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchOwners = useCallback(async () => {
    try {
      const data = await api.getAvailableOwners();
      if (data.success) {
        setAvailableOwners(data.owners || []);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const params = {
        name: userNameFilter,
        email: userEmailFilter,
        address: userAddressFilter,
        role: userRoleFilter,
        sortBy: userSortBy,
        sortOrder: userSortOrder
      };
      const data = await api.getAdminUsers(params);
      if (data.success) {
        setUsers(data.users || []);
      }
    } catch {
      onNotify('Failed to fetch users directory', 'error');
    } finally {
      setLoadingUsers(false);
    }
  }, [userNameFilter, userEmailFilter, userAddressFilter, userRoleFilter, userSortBy, userSortOrder, onNotify]);

  const fetchStores = useCallback(async () => {
    setLoadingStores(true);
    try {
      const params = {
        name: storeNameFilter,
        email: storeEmailFilter,
        address: storeAddressFilter,
        sortBy: storeSortBy,
        sortOrder: storeSortOrder
      };
      const data = await api.getAdminStores(params);
      if (data.success) {
        setStores(data.stores || []);
      }
    } catch {
      onNotify('Failed to fetch stores directory', 'error');
    } finally {
      setLoadingStores(false);
    }
  }, [storeNameFilter, storeEmailFilter, storeAddressFilter, storeSortBy, storeSortOrder, onNotify]);

  // Load initial data
  useEffect(() => {
    fetchStats();
    fetchOwners();
  }, [fetchStats, fetchOwners]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  // Toggle user sorting
  const handleUserSort = (column) => {
    if (userSortBy === column) {
      setUserSortOrder(userSortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setUserSortBy(column);
      setUserSortOrder('ASC');
    }
  };

  // Toggle store sorting
  const handleStoreSort = (column) => {
    if (storeSortBy === column) {
      setStoreSortOrder(storeSortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setStoreSortBy(column);
      setStoreSortOrder('ASC');
    }
  };

  const renderSortIndicator = (currentCol, activeCol, order) => {
    if (currentCol !== activeCol) return <ArrowUpDown size={13} style={{ opacity: 0.3 }} />;
    return order === 'ASC' ? <ArrowUp size={14} color="var(--primary-400)" /> : <ArrowDown size={14} color="var(--primary-400)" />;
  };

  // Handle Add User
  const handleCreateUser = async (e) => {
    e.preventDefault();
    const errors = {};

    const nameErr = validateName(newUser.name);
    if (nameErr) errors.name = nameErr;

    const emailErr = validateEmail(newUser.email);
    if (emailErr) errors.email = emailErr;

    const passErr = validatePassword(newUser.password);
    if (passErr) errors.password = passErr;

    const addrErr = validateAddress(newUser.address);
    if (addrErr) errors.address = addrErr;

    if (Object.keys(errors).length > 0) {
      setUserFormErrors(errors);
      return;
    }

    setSavingUser(true);
    try {
      await api.createAdminUser(newUser);
      onNotify(`${newUser.role} user created successfully!`, 'success');
      setShowAddUserModal(false);
      setNewUser({ name: '', email: '', password: '', address: '', role: 'USER' });
      setUserFormErrors({});
      fetchUsers();
      fetchStats();
      fetchOwners();
    } catch (err) {
      if (err.errors) {
        setUserFormErrors(err.errors);
      } else {
        setUserFormErrors({ general: err.message || 'Failed to create user.' });
      }
    } finally {
      setSavingUser(false);
    }
  };

  // Handle Add Store
  const handleCreateStore = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!newStore.name || !newStore.name.trim()) {
      errors.name = 'Store name is required.';
    } else if (newStore.name.trim().length > 60) {
      errors.name = 'Store name must not exceed 60 characters.';
    }

    const emailErr = validateEmail(newStore.email);
    if (emailErr) errors.email = emailErr;

    const addrErr = validateAddress(newStore.address);
    if (addrErr) errors.address = addrErr;

    if (Object.keys(errors).length > 0) {
      setStoreFormErrors(errors);
      return;
    }

    setSavingStore(true);
    try {
      await api.createAdminStore(newStore);
      onNotify('Store registered successfully!', 'success');
      setShowAddStoreModal(false);
      setNewStore({ name: '', email: '', address: '', ownerId: '' });
      setStoreFormErrors({});
      fetchStores();
      fetchStats();
    } catch (err) {
      if (err.errors) {
        setStoreFormErrors(err.errors);
      } else {
        setStoreFormErrors({ general: err.message || 'Failed to register store.' });
      }
    } finally {
      setSavingStore(false);
    }
  };

  const newUserPasswordCriteria = checkPasswordCriteria(newUser.password);

  return (
    <div style={{ padding: '32px 24px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Page Title & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: '1.9rem', marginBottom: 4 }}>System Administrator Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            Platform metrics, user governance, and store catalog management
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => setShowAddUserModal(true)}
            className="btn btn-secondary"
            id="admin-add-user-btn"
          >
            <Plus size={16} />
            <span>Add User</span>
          </button>
          <button
            onClick={() => setShowAddStoreModal(true)}
            className="btn btn-primary"
            id="admin-add-store-btn"
          >
            <Plus size={16} />
            <span>Add Store</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 20,
        marginBottom: 36
      }}>
        {/* Total Users */}
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{
            background: 'rgba(59, 130, 246, 0.15)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            padding: 16,
            borderRadius: 'var(--radius-md)',
            color: '#60a5fa'
          }}>
            <Users size={28} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Users
            </span>
            <h2 style={{ fontSize: '2.1rem', marginTop: 2 }}>{stats.totalUsers}</h2>
          </div>
        </div>

        {/* Total Stores */}
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{
            background: 'rgba(139, 92, 246, 0.15)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            padding: 16,
            borderRadius: 'var(--radius-md)',
            color: '#a78bfa'
          }}>
            <Store size={28} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Stores
            </span>
            <h2 style={{ fontSize: '2.1rem', marginTop: 2 }}>{stats.totalStores}</h2>
          </div>
        </div>

        {/* Total Ratings */}
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            padding: 16,
            borderRadius: 'var(--radius-md)',
            color: '#fbbf24'
          }}>
            <Star size={28} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Submitted Ratings
            </span>
            <h2 style={{ fontSize: '2.1rem', marginTop: 2 }}>{stats.totalRatings}</h2>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: 8,
        borderBottom: '1px solid var(--border-subtle)',
        marginBottom: 24
      }}>
        <button
          onClick={() => setActiveTab('users')}
          style={{
            background: 'transparent',
            color: activeTab === 'users' ? 'var(--text-main)' : 'var(--text-dim)',
            padding: '12px 20px',
            fontSize: '0.98rem',
            fontWeight: 600,
            borderBottom: activeTab === 'users' ? '2px solid var(--primary-500)' : '2px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
          id="tab-users-btn"
        >
          <Users size={18} />
          <span>Users Directory ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('stores')}
          style={{
            background: 'transparent',
            color: activeTab === 'stores' ? 'var(--text-main)' : 'var(--text-dim)',
            padding: '12px 20px',
            fontSize: '0.98rem',
            fontWeight: 600,
            borderBottom: activeTab === 'stores' ? '2px solid var(--primary-500)' : '2px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
          id="tab-stores-btn"
        >
          <Store size={18} />
          <span>Stores Directory ({stores.length})</span>
        </button>
      </div>

      {/* USERS TAB CONTENT */}
      {activeTab === 'users' && (
        <div>
          {/* User Filters Bar */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 12,
            marginBottom: 20,
            alignItems: 'center'
          }}>
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input
                type="text"
                placeholder="Search Name..."
                value={userNameFilter}
                onChange={(e) => setUserNameFilter(e.target.value)}
                style={{ paddingLeft: 36, fontSize: '0.88rem' }}
                id="admin-filter-user-name"
              />
            </div>

            <div style={{ position: 'relative' }}>
              <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input
                type="text"
                placeholder="Search Email..."
                value={userEmailFilter}
                onChange={(e) => setUserEmailFilter(e.target.value)}
                style={{ paddingLeft: 36, fontSize: '0.88rem' }}
                id="admin-filter-user-email"
              />
            </div>

            <div style={{ position: 'relative' }}>
              <MapPin size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input
                type="text"
                placeholder="Search Address..."
                value={userAddressFilter}
                onChange={(e) => setUserAddressFilter(e.target.value)}
                style={{ paddingLeft: 36, fontSize: '0.88rem' }}
                id="admin-filter-user-address"
              />
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                style={{ flex: 1, fontSize: '0.88rem' }}
                id="admin-user-role-select"
              >
                <option value="">Role [ All ]</option>
                <option value="ADMIN">System Administrator</option>
                <option value="USER">Normal User</option>
                <option value="STORE_OWNER">Store Owner</option>
              </select>

              {(userNameFilter || userEmailFilter || userAddressFilter || userRoleFilter) && (
                <button
                  type="button"
                  onClick={() => {
                    setUserNameFilter('');
                    setUserEmailFilter('');
                    setUserAddressFilter('');
                    setUserRoleFilter('');
                  }}
                  className="btn btn-secondary"
                  style={{ padding: '8px 12px', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
                  title="Clear all user filters"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Users Table */}
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th className="sortable" onClick={() => handleUserSort('name')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>Name</span>
                      {renderSortIndicator('name', userSortBy, userSortOrder)}
                    </div>
                  </th>
                  <th className="sortable" onClick={() => handleUserSort('email')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>Email</span>
                      {renderSortIndicator('email', userSortBy, userSortOrder)}
                    </div>
                  </th>
                  <th className="sortable" onClick={() => handleUserSort('address')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>Address</span>
                      {renderSortIndicator('address', userSortBy, userSortOrder)}
                    </div>
                  </th>
                  <th className="sortable" onClick={() => handleUserSort('role')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>Role</span>
                      {renderSortIndicator('role', userSortBy, userSortOrder)}
                    </div>
                  </th>
                  <th className="sortable" onClick={() => handleUserSort('store_rating')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>Store Rating (Owners)</span>
                      {renderSortIndicator('store_rating', userSortBy, userSortOrder)}
                    </div>
                  </th>
                  <th style={{ textAlign: 'center' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {loadingUsers ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                      Loading user records...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                      No users match the specified criteria.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 600 }}>{u.name}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                      <td style={{ color: 'var(--text-muted)', maxWidth: 280, whiteSpace: 'normal' }}>{u.address}</td>
                      <td>
                        {u.role === 'ADMIN' && <span className="badge badge-admin"><Shield size={11} /> Admin</span>}
                        {u.role === 'STORE_OWNER' && <span className="badge badge-owner"><Store size={11} /> Store Owner</span>}
                        {u.role === 'USER' && <span className="badge badge-user"><Users size={11} /> Normal User</span>}
                      </td>
                      <td>
                        {u.role === 'STORE_OWNER' ? (
                          u.store ? (
                            <div>
                              <StarRating rating={u.store.rating || 0} size={15} showValue />
                              <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: 2 }}>
                                {u.store.name} ({u.store.ratingCount} reviews)
                              </div>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                              No store assigned
                            </span>
                          )
                        ) : (
                          <span style={{ color: 'var(--text-dim)' }}>—</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => setSelectedUserDetails(u)}
                          style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                          id={`view-user-details-btn-${u.id}`}
                          title="View user details"
                        >
                          <Eye size={13} />
                          <span>Details</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* STORES TAB CONTENT */}
      {activeTab === 'stores' && (
        <div>
          {/* Store Filters Bar */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 12,
            marginBottom: 20,
            alignItems: 'center'
          }}>
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input
                type="text"
                placeholder="Search Store Name..."
                value={storeNameFilter}
                onChange={(e) => setStoreNameFilter(e.target.value)}
                style={{ paddingLeft: 36, fontSize: '0.88rem' }}
                id="admin-filter-store-name"
              />
            </div>

            <div style={{ position: 'relative' }}>
              <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input
                type="text"
                placeholder="Search Email..."
                value={storeEmailFilter}
                onChange={(e) => setStoreEmailFilter(e.target.value)}
                style={{ paddingLeft: 36, fontSize: '0.88rem' }}
                id="admin-filter-store-email"
              />
            </div>

            <div style={{ position: 'relative' }}>
              <MapPin size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input
                type="text"
                placeholder="Search Address..."
                value={storeAddressFilter}
                onChange={(e) => setStoreAddressFilter(e.target.value)}
                style={{ paddingLeft: 36, fontSize: '0.88rem' }}
                id="admin-filter-store-address"
              />
            </div>

            {(storeNameFilter || storeEmailFilter || storeAddressFilter) && (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => {
                    setStoreNameFilter('');
                    setStoreEmailFilter('');
                    setStoreAddressFilter('');
                  }}
                  className="btn btn-secondary"
                  style={{ padding: '8px 14px', fontSize: '0.82rem' }}
                  title="Clear all store filters"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>

          {/* Stores Table */}
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th className="sortable" onClick={() => handleStoreSort('name')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>Store Name</span>
                      {renderSortIndicator('name', storeSortBy, storeSortOrder)}
                    </div>
                  </th>
                  <th className="sortable" onClick={() => handleStoreSort('email')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>Email</span>
                      {renderSortIndicator('email', storeSortBy, storeSortOrder)}
                    </div>
                  </th>
                  <th className="sortable" onClick={() => handleStoreSort('address')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>Address</span>
                      {renderSortIndicator('address', storeSortBy, storeSortOrder)}
                    </div>
                  </th>
                  <th className="sortable" onClick={() => handleStoreSort('rating')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>Rating</span>
                      {renderSortIndicator('rating', storeSortBy, storeSortOrder)}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {loadingStores ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                      Loading store directory...
                    </td>
                  </tr>
                ) : stores.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                      No stores found.
                    </td>
                  </tr>
                ) : (
                  stores.map((s) => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 600, color: '#ffffff' }}>{s.name}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{s.email}</td>
                      <td style={{ color: 'var(--text-muted)', maxWidth: 300, whiteSpace: 'normal' }}>{s.address}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 700, color: 'var(--gold-star)', fontSize: '0.92rem' }}>
                            {s.rating ? Number(s.rating).toFixed(1) : '0.0'}
                          </span>
                          <StarRating rating={s.rating || 0} size={15} />
                          <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                            ({s.ratingCount})
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD USER MODAL */}
      {showAddUserModal && (
        <div className="modal-overlay" onClick={() => setShowAddUserModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ background: 'rgba(99, 102, 241, 0.2)', padding: 8, borderRadius: 8, color: 'var(--primary-400)' }}>
                  <UserCheck size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem' }}>Add New User</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Create an Admin, Store Owner, or Normal User</p>
                </div>
              </div>
              <button className="modal-close" onClick={() => setShowAddUserModal(false)}><X size={20} /></button>
            </div>

            {userFormErrors.general && (
              <div style={{
                background: 'var(--danger-bg)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 14px',
                marginBottom: 16,
                color: 'var(--danger-text)',
                fontSize: '0.85rem'
              }}>
                {userFormErrors.general}
              </div>
            )}

            <form onSubmit={handleCreateUser}>
              {/* Role Selector */}
              <div className="form-group">
                <label className="form-label">User Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  id="new-user-role"
                >
                  <option value="USER">Normal User</option>
                  <option value="STORE_OWNER">Store Owner</option>
                  <option value="ADMIN">System Administrator</option>
                </select>
              </div>

              {/* Name */}
              <div className="form-group">
                <div className="form-label">
                  <span>Full Name</span>
                  <span className={`char-count ${newUser.name.trim().length >= 20 && newUser.name.trim().length <= 60 ? 'valid' : 'invalid'}`}>
                    {newUser.name.trim().length}/60 (min 20)
                  </span>
                </div>
                <input
                  type="text"
                  placeholder="e.g. Jonathan Alexander Vance"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  required
                  id="new-user-name"
                />
                {userFormErrors.name && <div className="form-error"><AlertCircle size={13} /> {userFormErrors.name}</div>}
              </div>

              {/* Email */}
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  placeholder="user@example.com"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  required
                  id="new-user-email"
                />
                {userFormErrors.email && <div className="form-error"><AlertCircle size={13} /> {userFormErrors.email}</div>}
              </div>

              {/* Password */}
              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  placeholder="8-16 chars, uppercase & special symbol"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  required
                  id="new-user-password"
                />
                {/* Requirements indicator */}
                <div style={{
                  marginTop: 6,
                  padding: '8px 10px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.74rem',
                  display: 'flex',
                  gap: 12,
                  flexWrap: 'wrap'
                }}>
                  <span style={{ color: newUserPasswordCriteria.length ? 'var(--success-text)' : 'var(--text-dim)' }}>
                    ✓ 8-16 chars
                  </span>
                  <span style={{ color: newUserPasswordCriteria.uppercase ? 'var(--success-text)' : 'var(--text-dim)' }}>
                    ✓ 1 Uppercase
                  </span>
                  <span style={{ color: newUserPasswordCriteria.specialChar ? 'var(--success-text)' : 'var(--text-dim)' }}>
                    ✓ 1 Special Char
                  </span>
                </div>
                {userFormErrors.password && <div className="form-error"><AlertCircle size={13} /> {userFormErrors.password}</div>}
              </div>

              {/* Address */}
              <div className="form-group">
                <div className="form-label">
                  <span>Physical Address</span>
                  <span className={`char-count ${newUser.address.trim().length <= 400 ? 'valid' : 'invalid'}`}>
                    {newUser.address.trim().length}/400
                  </span>
                </div>
                <textarea
                  rows="2"
                  placeholder="Street address, City, Postal Code"
                  value={newUser.address}
                  onChange={(e) => setNewUser({ ...newUser, address: e.target.value })}
                  required
                  id="new-user-address"
                />
                {userFormErrors.address && <div className="form-error"><AlertCircle size={13} /> {userFormErrors.address}</div>}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddUserModal(false)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingUser}
                  id="submit-create-user-btn"
                >
                  {savingUser ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD STORE MODAL */}
      {showAddStoreModal && (
        <div className="modal-overlay" onClick={() => setShowAddStoreModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ background: 'rgba(139, 92, 246, 0.2)', padding: 8, borderRadius: 8, color: '#a78bfa' }}>
                  <Store size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem' }}>Register New Store</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Add a store and assign a store owner</p>
                </div>
              </div>
              <button className="modal-close" onClick={() => setShowAddStoreModal(false)}><X size={20} /></button>
            </div>

            {storeFormErrors.general && (
              <div style={{
                background: 'var(--danger-bg)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 14px',
                marginBottom: 16,
                color: 'var(--danger-text)',
                fontSize: '0.85rem'
              }}>
                {storeFormErrors.general}
              </div>
            )}

            <form onSubmit={handleCreateStore}>
              {/* Store Name */}
              <div className="form-group">
                <div className="form-label">
                  <span>Store Name</span>
                  <span className={`char-count ${newStore.name.trim().length <= 60 ? 'valid' : 'invalid'}`}>
                    {newStore.name.trim().length}/60
                  </span>
                </div>
                <input
                  type="text"
                  placeholder="e.g. Apex Organic Gourmet Market"
                  value={newStore.name}
                  onChange={(e) => setNewStore({ ...newStore, name: e.target.value })}
                  required
                  id="new-store-name"
                />
                {storeFormErrors.name && <div className="form-error"><AlertCircle size={13} /> {storeFormErrors.name}</div>}
              </div>

              {/* Store Email */}
              <div className="form-group">
                <label className="form-label">Official Email</label>
                <input
                  type="email"
                  placeholder="store@example.com"
                  value={newStore.email}
                  onChange={(e) => setNewStore({ ...newStore, email: e.target.value })}
                  required
                  id="new-store-email"
                />
                {storeFormErrors.email && <div className="form-error"><AlertCircle size={13} /> {storeFormErrors.email}</div>}
              </div>

              {/* Store Address */}
              <div className="form-group">
                <div className="form-label">
                  <span>Store Address</span>
                  <span className={`char-count ${newStore.address.trim().length <= 400 ? 'valid' : 'invalid'}`}>
                    {newStore.address.trim().length}/400
                  </span>
                </div>
                <textarea
                  rows="2"
                  placeholder="Store location, Street, Plaza, City"
                  value={newStore.address}
                  onChange={(e) => setNewStore({ ...newStore, address: e.target.value })}
                  required
                  id="new-store-address"
                />
                {storeFormErrors.address && <div className="form-error"><AlertCircle size={13} /> {storeFormErrors.address}</div>}
              </div>

              {/* Assign Store Owner */}
              <div className="form-group">
                <label className="form-label">Assign Store Owner (Optional)</label>
                <select
                  value={newStore.ownerId}
                  onChange={(e) => setNewStore({ ...newStore, ownerId: e.target.value })}
                  id="new-store-owner"
                >
                  <option value="">— Unassigned (Can assign later) —</option>
                  {availableOwners.map((owner) => (
                    <option key={owner.id} value={owner.id}>
                      {owner.name} ({owner.email})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddStoreModal(false)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingStore}
                  id="submit-create-store-btn"
                >
                  {savingStore ? 'Registering...' : 'Register Store'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* USER DETAILS MODAL */}
      {selectedUserDetails && (
        <div className="modal-overlay" onClick={() => setSelectedUserDetails(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  color: '#ffffff'
                }}>
                  {selectedUserDetails.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: 2 }}>User Profile</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {selectedUserDetails.role === 'ADMIN' && <span className="badge badge-admin"><Shield size={11} /> System Administrator</span>}
                    {selectedUserDetails.role === 'STORE_OWNER' && <span className="badge badge-owner"><Store size={11} /> Store Owner</span>}
                    {selectedUserDetails.role === 'USER' && <span className="badge badge-user"><Users size={11} /> Normal User</span>}
                  </div>
                </div>
              </div>
              <button className="modal-close" onClick={() => setSelectedUserDetails(null)} id="close-user-details-modal">
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 10 }}>
              {/* Name */}
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 4 }}>
                  Full Name
                </span>
                <span style={{ fontSize: '1rem', fontWeight: 600, color: '#ffffff' }}>
                  {selectedUserDetails.name}
                </span>
              </div>

              {/* Email */}
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 4 }}>
                  Email Address
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-main)' }}>
                  <Mail size={15} color="var(--primary-400)" />
                  <span>{selectedUserDetails.email}</span>
                </div>
              </div>

              {/* Address */}
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 4 }}>
                  Address
                </span>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, color: 'var(--text-muted)' }}>
                  <MapPin size={15} color="var(--text-dim)" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>{selectedUserDetails.address}</span>
                </div>
              </div>

              {/* Account Created At */}
              {selectedUserDetails.created_at && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-dim)', fontSize: '0.82rem', paddingLeft: 4 }}>
                  <Calendar size={14} />
                  <span>Account registered: {new Date(selectedUserDetails.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
              )}

              {/* Store Owner Section */}
              {selectedUserDetails.role === 'STORE_OWNER' && (
                <div style={{
                  background: 'rgba(99, 102, 241, 0.08)',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  borderRadius: 'var(--radius-md)',
                  padding: 16,
                  marginTop: 6
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--primary-400)', fontWeight: 600, fontSize: '0.85rem', marginBottom: 10 }}>
                    <Store size={16} />
                    <span>Associated Store Information</span>
                  </div>

                  {selectedUserDetails.store ? (
                    <div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', marginBottom: 6 }}>
                        {selectedUserDetails.store.name}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <StarRating rating={selectedUserDetails.store.rating || 0} size={16} showValue />
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
                          ({selectedUserDetails.store.ratingCount} evaluations)
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.86rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                      No store currently linked to this owner.
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedUserDetails(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
