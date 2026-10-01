const bcrypt = require('bcryptjs');
const { query } = require('../config/db');

/**
 * Get Admin dashboard summary stats
 */
async function getDashboardStats(req, res) {
  try {
    const userCountRes = await query('SELECT COUNT(*) as count FROM users');
    const storeCountRes = await query('SELECT COUNT(*) as count FROM stores');
    const ratingCountRes = await query('SELECT COUNT(*) as count FROM ratings');

    const totalUsers = userCountRes[0]?.count || 0;
    const totalStores = storeCountRes[0]?.count || 0;
    const totalRatings = ratingCountRes[0]?.count || 0;

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers: Number(totalUsers),
        totalStores: Number(totalStores),
        totalRatings: Number(totalRatings)
      }
    });
  } catch (error) {
    console.error('[Admin Dashboard Stats Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard statistics.'
    });
  }
}

/**
 * Get users list with filters, sorting, and store owner rating
 */
async function getUsers(req, res) {
  try {
    const {
      search = '',
      name = '',
      email = '',
      address = '',
      role = '',
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const conditions = [];
    const params = [];

    if (search.trim()) {
      const term = `%${search.trim()}%`;
      conditions.push('(u.name LIKE ? OR u.email LIKE ? OR u.address LIKE ?)');
      params.push(term, term, term);
    }
    if (name.trim()) {
      conditions.push('u.name LIKE ?');
      params.push(`%${name.trim()}%`);
    }
    if (email.trim()) {
      conditions.push('u.email LIKE ?');
      params.push(`%${email.trim()}%`);
    }
    if (address.trim()) {
      conditions.push('u.address LIKE ?');
      params.push(`%${address.trim()}%`);
    }
    if (role.trim()) {
      conditions.push('u.role = ?');
      params.push(role.trim());
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const allowedSortFields = {
      name: 'u.name',
      email: 'u.email',
      address: 'u.address',
      role: 'u.role',
      created_at: 'u.created_at',
      store_rating: 'store_rating'
    };

    const sortColumn = allowedSortFields[sortBy] || 'u.created_at';
    const direction = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const isTextCol = ['u.name', 'u.email', 'u.address'].includes(sortColumn);
    const orderClause = isTextCol ? `LOWER(${sortColumn}) ${direction}` : `${sortColumn} ${direction}`;

    const sql = `
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.address, 
        u.role, 
        u.created_at,
        s.id as store_id,
        s.name as store_name,
        ROUND(AVG(r.rating), 1) as store_rating,
        COUNT(r.id) as rating_count
      FROM users u
      LEFT JOIN stores s ON s.owner_id = u.id
      LEFT JOIN ratings r ON r.store_id = s.id
      ${whereClause}
      GROUP BY u.id, s.id
      ORDER BY ${orderClause}
    `;

    const users = await query(sql, params);

    const formattedUsers = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      address: u.address,
      role: u.role,
      created_at: u.created_at,
      store: u.store_id ? {
        id: u.store_id,
        name: u.store_name,
        rating: u.store_rating !== null ? Number(u.store_rating) : null,
        ratingCount: Number(u.rating_count || 0)
      } : null
    }));

    return res.status(200).json({
      success: true,
      users: formattedUsers
    });
  } catch (error) {
    console.error('[Admin Get Users Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve users.'
    });
  }
}

/**
 * Admin creates new user (Admin, Normal User, or Store Owner)
 */
async function createUser(req, res) {
  try {
    const { name, email, password, address, role } = req.body;

    const existing = await query('SELECT id FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (existing && existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email address already exists.',
        errors: { email: 'Email is already registered.' }
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await query(
      'INSERT INTO users (name, email, password, address, role) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), email.trim().toLowerCase(), hashedPassword, address.trim(), role]
    );

    return res.status(201).json({
      success: true,
      message: `${role} user created successfully!`,
      user: {
        id: result.insertId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        address: address.trim(),
        role
      }
    });
  } catch (error) {
    console.error('[Admin Create User Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create user.'
    });
  }
}

/**
 * Get stores list for Admin with rating, owner, filters, and sorting
 */
async function getStores(req, res) {
  try {
    const {
      search = '',
      name = '',
      email = '',
      address = '',
      sortBy = 'name',
      sortOrder = 'ASC'
    } = req.query;

    const conditions = [];
    const params = [];

    if (search.trim()) {
      const term = `%${search.trim()}%`;
      conditions.push('(s.name LIKE ? OR s.email LIKE ? OR s.address LIKE ?)');
      params.push(term, term, term);
    }
    if (name.trim()) {
      conditions.push('s.name LIKE ?');
      params.push(`%${name.trim()}%`);
    }
    if (email.trim()) {
      conditions.push('s.email LIKE ?');
      params.push(`%${email.trim()}%`);
    }
    if (address.trim()) {
      conditions.push('s.address LIKE ?');
      params.push(`%${address.trim()}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const allowedSortFields = {
      name: 's.name',
      email: 's.email',
      address: 's.address',
      rating: 'rating',
      created_at: 's.created_at'
    };

    const sortColumn = allowedSortFields[sortBy] || 's.name';
    const direction = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    const isTextCol = ['s.name', 's.email', 's.address'].includes(sortColumn);
    const orderClause = isTextCol ? `LOWER(${sortColumn}) ${direction}` : `${sortColumn} ${direction}`;

    const sql = `
      SELECT 
        s.id, 
        s.name, 
        s.email, 
        s.address, 
        s.created_at,
        s.owner_id,
        u.name as owner_name,
        u.email as owner_email,
        ROUND(AVG(r.rating), 1) as rating,
        COUNT(r.id) as rating_count
      FROM stores s
      LEFT JOIN users u ON u.id = s.owner_id
      LEFT JOIN ratings r ON r.store_id = s.id
      ${whereClause}
      GROUP BY s.id
      ORDER BY ${orderClause}
    `;

    const stores = await query(sql, params);

    const formattedStores = stores.map(s => ({
      id: s.id,
      name: s.name,
      email: s.email,
      address: s.address,
      rating: s.rating !== null ? Number(s.rating) : null,
      ratingCount: Number(s.rating_count || 0),
      created_at: s.created_at,
      owner: s.owner_id ? {
        id: s.owner_id,
        name: s.owner_name,
        email: s.owner_email
      } : null
    }));

    return res.status(200).json({
      success: true,
      stores: formattedStores
    });
  } catch (error) {
    console.error('[Admin Get Stores Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve stores.'
    });
  }
}

/**
 * Admin creates a new store
 */
async function createStore(req, res) {
  try {
    const { name, email, address, ownerId } = req.body;

    const existing = await query('SELECT id FROM stores WHERE email = ?', [email.trim().toLowerCase()]);
    if (existing && existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'A store with this email already exists.',
        errors: { email: 'Email is already taken by another store.' }
      });
    }

    let ownerIdValue = null;
    if (ownerId) {
      const ownerCheck = await query('SELECT id, role FROM users WHERE id = ?', [ownerId]);
      if (ownerCheck.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Specified owner user does not exist.'
        });
      }
      ownerIdValue = ownerId;
    }

    const result = await query(
      'INSERT INTO stores (name, email, address, owner_id) VALUES (?, ?, ?, ?)',
      [name.trim(), email.trim().toLowerCase(), address.trim(), ownerIdValue]
    );

    return res.status(201).json({
      success: true,
      message: 'Store created successfully!',
      store: {
        id: result.insertId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        address: address.trim(),
        ownerId: ownerIdValue
      }
    });
  } catch (error) {
    console.error('[Admin Create Store Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create store.'
    });
  }
}

/**
 * Get available store owners for assignment
 */
async function getAvailableOwners(req, res) {
  try {
    const owners = await query(`
      SELECT u.id, u.name, u.email 
      FROM users u
      WHERE u.role = 'STORE_OWNER'
      ORDER BY u.name ASC
    `);

    return res.status(200).json({
      success: true,
      owners
    });
  } catch (error) {
    console.error('[Admin Get Owners Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve store owners.'
    });
  }
}

module.exports = {
  getDashboardStats,
  getUsers,
  createUser,
  getStores,
  createStore,
  getAvailableOwners
};
