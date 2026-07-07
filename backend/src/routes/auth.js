const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { registerValidator, loginValidator } = require('../utils/validator');
const validate = require('../middleware/validationMiddleware');

router.post('/register', registerValidator, validate, authController.registerUser);
router.post('/login', loginValidator, validate, authController.loginUser);
router.post('/refresh', authController.refreshAccessToken);
router.post('/logout', protect, authController.logoutUser);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);

router.route('/profile')
  .get(protect, authController.getUserProfile)
  .put(protect, authController.updateUserProfile);

module.exports = router;
