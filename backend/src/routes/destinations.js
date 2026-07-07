const express = require('express');
const router = express.Router();
const destinationController = require('../controllers/destinationController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
  .get(destinationController.getDestinations)
  .post(protect, admin, destinationController.createDestination);

router.route('/:id')
  .get(destinationController.getDestinationById)
  .put(protect, admin, destinationController.updateDestination)
  .delete(protect, admin, destinationController.deleteDestination);

module.exports = router;
