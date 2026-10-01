const express = require('express');
const router = express.Router();
const { register, login, getProfile, updatePassword } = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth');
const {
  validateRegistration,
  validateLogin,
  validatePasswordUpdate
} = require('../middleware/validator');

router.post('/register', validateRegistration, register);
router.post('/login', validateLogin, login);
router.get('/me', requireAuth, getProfile);
router.put('/password', requireAuth, validatePasswordUpdate, updatePassword);

module.exports = router;
