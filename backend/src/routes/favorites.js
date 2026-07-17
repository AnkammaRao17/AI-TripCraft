const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favoriteController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/toggle/:tripId', favoriteController.toggleFavorite);
router.post('/toggle-destination/:destId', favoriteController.toggleFavoriteDestination);
router.get('/destinations', favoriteController.getUserFavoriteDestinations);
router.get('/', favoriteController.getUserFavorites);

module.exports = router;
