const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');
const itineraryController = require('../controllers/itineraryController');
const { protect } = require('../middleware/authMiddleware');
const { tripValidator } = require('../utils/validator');
const validate = require('../middleware/validationMiddleware');

router.use(protect); // protect all trip-related routes

router.route('/')
  .post(tripValidator, validate, tripController.createTrip)
  .get(tripController.getUserTrips);

router.get('/stats', tripController.getUserStats);

router.route('/:id')
  .get(tripController.getTripById)
  .put(tripController.updateTrip)
  .delete(tripController.deleteTrip);

router.post('/:id/duplicate', tripController.duplicateTrip);
router.get('/:id/weather', tripController.getTripWeather);

// Itinerary customization sub-routes
router.put('/:id/itinerary/days/:dayNum', itineraryController.updateItineraryDay);
router.put('/:id/itinerary/tips', itineraryController.updateItineraryTips);

module.exports = router;
