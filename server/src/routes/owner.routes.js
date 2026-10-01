const express = require('express');
const router = express.Router();
const { getOwnerDashboard } = require('../controllers/owner.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

// Require STORE_OWNER role
router.use(requireAuth, requireRole(['STORE_OWNER']));

router.get('/dashboard', getOwnerDashboard);

module.exports = router;
