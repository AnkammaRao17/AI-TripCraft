const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

router.use(protect); // protect all stats/admin routes

// Analytics is available to all users (scoped personally for users, globally for admins)
router.get('/stats', adminController.getStatistics);

// Core admin panels
router.get('/users', admin, adminController.getAllUsers);
router.delete('/users/:id', admin, adminController.deleteUser);
router.get('/trips', admin, adminController.getAllTrips);

module.exports = router;
