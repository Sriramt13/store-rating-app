const { query } = require('../config/db');

/**
 * Get Store Owner's dashboard:
 * - Store details
 * - Average rating
 * - Total count of ratings
 * - List of users who submitted ratings for their store
 */
async function getOwnerDashboard(req, res) {
  try {
    const ownerId = req.user.id;
    const {
      sortBy = 'updated_at',
      sortOrder = 'DESC'
    } = req.query;

    // Find stores owned by this user
    const stores = await query('SELECT id, name, email, address FROM stores WHERE owner_id = ?', [ownerId]);

    if (!stores || stores.length === 0) {
      return res.status(200).json({
        success: true,
        hasStore: false,
        message: 'No store is currently associated with your account. Please contact the administrator.',
        stores: [],
        store: null,
        averageRating: 0,
        totalRatings: 0,
        ratings: []
      });
    }

    const requestedStoreId = req.query.storeId ? parseInt(req.query.storeId, 10) : null;
    let store = stores[0];
    if (requestedStoreId) {
      store = stores.find(s => s.id === requestedStoreId);
      if (!store) {
        return res.status(403).json({
          success: false,
          message: 'Access Denied: You do not have permission to view ratings for this store.'
        });
      }
    }

    // Compute average rating and count
    const stats = await query(
      'SELECT ROUND(AVG(rating), 1) as avgRating, COUNT(id) as totalRatings FROM ratings WHERE store_id = ?',
      [store.id]
    );

    const averageRating = stats[0]?.avgRating !== null ? Number(stats[0].avgRating) : 0;
    const totalRatings = Number(stats[0]?.totalRatings || 0);

    // Sorting columns for ratings
    const allowedSortFields = {
      name: 'u.name',
      email: 'u.email',
      rating: 'r.rating',
      created_at: 'r.created_at',
      updated_at: 'r.updated_at'
    };

    const sortColumn = allowedSortFields[sortBy] || 'r.updated_at';
    const direction = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Fetch users who rated this store
    const ratingsQuery = `
      SELECT 
        r.id as rating_id,
        r.rating,
        r.created_at,
        r.updated_at,
        u.id as user_id,
        u.name as user_name,
        u.email as user_email,
        u.address as user_address
      FROM ratings r
      JOIN users u ON u.id = r.user_id
      WHERE r.store_id = ?
      ORDER BY ${sortColumn} ${direction}
    `;

    const ratings = await query(ratingsQuery, [store.id]);

    const formattedRatings = ratings.map(r => ({
      id: r.rating_id,
      rating: Number(r.rating),
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      user: {
        id: r.user_id,
        name: r.user_name,
        email: r.user_email,
        address: r.user_address
      }
    }));

    return res.status(200).json({
      success: true,
      hasStore: true,
      store,
      stores,
      averageRating,
      totalRatings,
      ratings: formattedRatings
    });
  } catch (error) {
    console.error('[Owner Dashboard Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve store owner dashboard.'
    });
  }
}

module.exports = {
  getOwnerDashboard
};
