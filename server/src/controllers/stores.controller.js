const { query, getActiveDialect } = require('../config/db');

/**
 * Get all registered stores with overall rating and current user's submitted rating
 * Supports search by Name and Address, and sorting
 */
async function getStoresForUser(req, res) {
  try {
    const userId = req.user.id;
    const {
      search = '',
      sortBy = 'name',
      sortOrder = 'ASC'
    } = req.query;

    const conditions = [];
    const params = [userId, userId];

    if (search.trim()) {
      const term = `%${search.trim()}%`;
      conditions.push('(s.name LIKE ? OR s.address LIKE ?)');
      params.push(term, term);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const allowedSortFields = {
      name: 's.name',
      address: 's.address',
      overall_rating: 'overall_rating',
      user_rating: 'user_rating'
    };

    const sortColumn = allowedSortFields[sortBy] || 's.name';
    const direction = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const sql = `
      SELECT 
        s.id,
        s.name,
        s.email,
        s.address,
        ROUND(AVG(r.rating), 1) as overall_rating,
        COUNT(r.id) as total_ratings,
        MAX(CASE WHEN r.user_id = ? THEN r.rating ELSE NULL END) as user_rating,
        MAX(CASE WHEN r.user_id = ? THEN r.updated_at ELSE NULL END) as user_rated_at
      FROM stores s
      LEFT JOIN ratings r ON r.store_id = s.id
      ${whereClause}
      GROUP BY s.id
      ORDER BY ${sortColumn} ${direction}
    `;

    const stores = await query(sql, params);

    const formatted = stores.map(s => ({
      id: s.id,
      name: s.name,
      email: s.email,
      address: s.address,
      overallRating: s.overall_rating !== null ? Number(s.overall_rating) : null,
      totalRatings: Number(s.total_ratings || 0),
      userRating: s.user_rating !== null ? Number(s.user_rating) : null,
      userRatedAt: s.user_rated_at
    }));

    return res.status(200).json({
      success: true,
      stores: formatted
    });
  } catch (error) {
    console.error('[Get Stores For User Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve stores.'
    });
  }
}

/**
 * Submit rating for a store (1 to 5)
 * Checks for existing rating to prevent accidental duplicates
 */
async function submitRating(req, res) {
  try {
    const userId = req.user.id;
    const storeId = parseInt(req.params.id, 10);
    const { rating } = req.body;

    // Check store exists
    const store = await query('SELECT id, name FROM stores WHERE id = ?', [storeId]);
    if (!store || store.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Store not found.'
      });
    }

    // Check if user already submitted a rating
    const existing = await query('SELECT id, rating FROM ratings WHERE user_id = ? AND store_id = ?', [userId, storeId]);
    if (existing && existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'You have already submitted a rating for this store. Please use the modify option to update your rating.',
        currentRating: existing[0].rating
      });
    }

    await query(
      'INSERT INTO ratings (user_id, store_id, rating) VALUES (?, ?, ?)',
      [userId, storeId, rating]
    );

    // Compute updated store average
    const stats = await query(
      'SELECT ROUND(AVG(rating), 1) as avgRating, COUNT(id) as count FROM ratings WHERE store_id = ?',
      [storeId]
    );

    return res.status(201).json({
      success: true,
      message: 'Rating submitted successfully!',
      rating: {
        storeId,
        userRating: Number(rating),
        overallRating: Number(stats[0]?.avgRating || rating),
        totalRatings: Number(stats[0]?.count || 1)
      }
    });
  } catch (error) {
    console.error('[Submit Rating Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit rating.'
    });
  }
}

/**
 * Modify an existing submitted rating (1 to 5)
 */
async function modifyRating(req, res) {
  try {
    const userId = req.user.id;
    const storeId = parseInt(req.params.id, 10);
    const { rating } = req.body;

    const existing = await query('SELECT id FROM ratings WHERE user_id = ? AND store_id = ?', [userId, storeId]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No existing rating found to modify. Please submit a new rating first.'
      });
    }

    await query(
      'UPDATE ratings SET rating = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND store_id = ?',
      [rating, userId, storeId]
    );

    const stats = await query(
      'SELECT ROUND(AVG(rating), 1) as avgRating, COUNT(id) as count FROM ratings WHERE store_id = ?',
      [storeId]
    );

    return res.status(200).json({
      success: true,
      message: 'Rating modified successfully!',
      rating: {
        storeId,
        userRating: Number(rating),
        overallRating: Number(stats[0]?.avgRating || rating),
        totalRatings: Number(stats[0]?.count || 1)
      }
    });
  } catch (error) {
    console.error('[Modify Rating Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to modify rating.'
    });
  }
}

/**
 * Delete a user's submitted rating for a store
 */
async function deleteRating(req, res) {
  try {
    const userId = req.user.id;
    const storeId = parseInt(req.params.id, 10);

    const existing = await query('SELECT id FROM ratings WHERE user_id = ? AND store_id = ?', [userId, storeId]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No existing rating found to delete.'
      });
    }

    await query('DELETE FROM ratings WHERE user_id = ? AND store_id = ?', [userId, storeId]);

    const stats = await query(
      'SELECT ROUND(AVG(rating), 1) as avgRating, COUNT(id) as count FROM ratings WHERE store_id = ?',
      [storeId]
    );

    return res.status(200).json({
      success: true,
      message: 'Rating deleted successfully!',
      rating: {
        storeId,
        userRating: null,
        overallRating: stats[0]?.avgRating !== null ? Number(stats[0]?.avgRating) : null,
        totalRatings: Number(stats[0]?.count || 0)
      }
    });
  } catch (error) {
    console.error('[Delete Rating Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete rating.'
    });
  }
}

module.exports = {
  getStoresForUser,
  submitRating,
  modifyRating,
  deleteRating
};
