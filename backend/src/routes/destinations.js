const express = require('express');
const router = express.Router();
const destinationController = require('../controllers/destinationController');

router.route('/')
  .get(destinationController.getDestinations);

router.route('/:id')
  .get(destinationController.getDestinationById);

module.exports = router;
