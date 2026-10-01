const express = require('express');
const router = express.Router();
const { getStoresForUser, submitRating, modifyRating, deleteRating } = require('../controllers/stores.controller');
const { requireAuth } = require('../middleware/auth');
const { validateRatingSubmission } = require('../middleware/validator');

router.use(requireAuth);

router.get('/', getStoresForUser);
router.post('/:id/ratings', validateRatingSubmission, submitRating);
router.put('/:id/ratings', validateRatingSubmission, modifyRating);
router.delete('/:id/ratings', deleteRating);

module.exports = router;
