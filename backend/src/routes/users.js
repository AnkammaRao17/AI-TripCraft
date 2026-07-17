const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { profileValidator } = require('../utils/validator');
const validate = require('../middleware/validationMiddleware');

router.route('/profile')
  .get(protect, authController.getUserProfile)
  .put(protect, profileValidator, validate, authController.updateUserProfile);

module.exports = router;
