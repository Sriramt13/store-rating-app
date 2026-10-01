const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getUsers,
  createUser,
  getStores,
  createStore,
  getAvailableOwners
} = require('../controllers/admin.controller');
const { requireAuth, requireRole } = require('../middleware/auth');
const {
  validateAdminCreateUser,
  validateStore
} = require('../middleware/validator');

// All admin routes require ADMIN role
router.use(requireAuth, requireRole(['ADMIN']));

router.get('/dashboard', getDashboardStats);
router.get('/users', getUsers);
router.post('/users', validateAdminCreateUser, createUser);
router.get('/stores', getStores);
router.post('/stores', validateStore, createStore);
router.get('/owners', getAvailableOwners);

module.exports = router;
