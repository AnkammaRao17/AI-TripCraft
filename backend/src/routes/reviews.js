const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');
const { reviewValidator } = require('../utils/validator');
const validate = require('../middleware/validationMiddleware');

router.post('/', protect, reviewValidator, validate, reviewController.addReview);
router.get('/destination/:id', reviewController.getDestinationReviews);
router.delete('/:id', protect, reviewController.deleteReview);

module.exports = router;
