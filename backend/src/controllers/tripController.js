const Trip = require('../models/Trip');
const Itinerary = require('../models/Itinerary');
const Favorite = require('../models/Favorite');
const geminiService = require('../services/geminiService');
const weatherService = require('../services/weatherService');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');

// Auto calculate budget based on preferences and budget tier
const calculateEstimatedBudget = (days, budgetTier, travelers, transportPref, hotelPref) => {
  // Rates per day per traveler in INR
  const rates = {
    Budget: { hotel: 1500, food: 600, transport: 400, attractions: 300 },
    Moderate: { hotel: 4500, food: 1500, transport: 1000, attractions: 800 },
    Luxury: { hotel: 15000, food: 4500, transport: 3000, attractions: 2000 }
  };

  const selectedRate = rates[budgetTier] || rates.Moderate;

  // Modifiers based on preferences
  let hotelModifier = 1.0;
  if (hotelPref === 'Hostel') hotelModifier = 0.5;
  if (hotelPref === 'Resort') hotelModifier = 1.6;
  if (hotelPref === 'Airbnb') hotelModifier = 0.8;
  if (hotelPref === 'None') hotelModifier = 0.0;

  let transportModifier = 1.0;
  if (transportPref === 'Walking') transportModifier = 0.1;
  if (transportPref === 'Car Rental') transportModifier = 1.5;
  if (transportPref === 'Taxi') transportModifier = 1.3;
  if (transportPref === 'Flights') transportModifier = 2.0;

  const hotelCost = Math.round(selectedRate.hotel * days * travelers * hotelModifier);
  const foodCost = Math.round(selectedRate.food * days * travelers);
  const transportCost = Math.round(selectedRate.transport * days * travelers * transportModifier);
  const attractionsCost = Math.round(selectedRate.attractions * days * travelers);

  const total = hotelCost + foodCost + transportCost + attractionsCost;

  return {
    hotelCost,
    foodCost,
    transportCost,
    attractionsCost,
    total
  };
};

// @desc    Create a new trip and generate its AI itinerary
// @route   POST /api/trips
// @access  Private
const createTrip = async (req, res, next) => {
  try {
    const {
      destination,
      country,
      startDate,
      numberOfDays,
      budget,
      numberOfTravelers,
      interests,
      transportPreference,
      hotelPreference,
      foodPreference,
      tripType
    } = req.body;

    // Calculate budget breakdown
    const estimatedBudgetBreakdown = calculateEstimatedBudget(
      parseInt(numberOfDays),
      budget,
      parseInt(numberOfTravelers || 1),
      transportPreference,
      hotelPreference
    );

    // Create Trip configuration
    const trip = new Trip({
      user: req.user.id,
      destination,
      country,
      startDate,
      numberOfDays,
      budget,
      numberOfTravelers: numberOfTravelers || 1,
      interests: interests || [],
      transportPreference: transportPreference || 'Public Transit',
      hotelPreference: hotelPreference || 'Hotel',
      foodPreference: foodPreference || 'Any',
      tripType,
      estimatedBudgetBreakdown
    });

    await trip.save();
    logger.info(`Trip created in DB: ${trip._id} for user ${req.user.email}`);

    // Generate AI Itinerary using Gemini
    let itineraryData;
    try {
      itineraryData = await geminiService.generateItinerary(trip);
    } catch (aiError) {
      logger.error(`AI Generation failed for Trip ${trip._id}: ${aiError.message}`);
      // Return mock itinerary details so the client succeeds
      itineraryData = geminiService.generateMockItinerary(trip);
    }

    const itinerary = new Itinerary({
      trip: trip._id,
      user: req.user.id,
      days: itineraryData.days,
      travelTips: itineraryData.travelTips || []
    });

    await itinerary.save();
    logger.info(`Itinerary linked to Trip: ${trip._id}`);

    return ApiResponse.success(res, 'Trip and AI Itinerary generated successfully', {
      trip,
      itinerary
    }, 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's trips with search, filter, and pagination
// @route   GET /api/trips
// @access  Private
const getUserTrips = async (req, res, next) => {
  try {
    const {
      search,      // Search city/country
      budget,      // Budget tier
      tripType,    // Trip Type
      duration,    // Number of days filter
      country,     // Country exact filter
      page = 1,
      limit = 6
    } = req.query;

    const query = { user: req.user.id };

    // Apply Search
    if (search) {
      query.$or = [
        { destination: { $regex: search, $options: 'i' } },
        { country: { $regex: search, $options: 'i' } }
      ];
    }

    // Apply Filters
    if (budget) query.budget = budget;
    if (tripType) query.tripType = tripType;
    if (country) query.country = { $regex: country, $options: 'i' };
    if (duration) {
      // Allow exact match or ranges
      if (duration === 'short') query.numberOfDays = { $lte: 3 };
      else if (duration === 'medium') query.numberOfDays = { $gt: 3, $lte: 7 };
      else if (duration === 'long') query.numberOfDays = { $gt: 7 };
      else query.numberOfDays = parseInt(duration);
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const totalTrips = await Trip.countDocuments(query);
    const trips = await Trip.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    return ApiResponse.success(res, 'Trips retrieved successfully', {
      trips,
      pagination: {
        total: totalTrips,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalTrips / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get trip and itinerary details by ID
// @route   GET /api/trips/:id
// @access  Private
const getTripById = async (req, res, next) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, user: req.user.id });
    if (!trip) {
      return ApiResponse.error(res, 'Trip not found', 404);
    }

    const itinerary = await Itinerary.findOne({ trip: trip._id });
    
    // Check if favorited
    const isFavorited = await Favorite.exists({ user: req.user.id, trip: trip._id });

    return ApiResponse.success(res, 'Trip details retrieved', {
      trip,
      itinerary,
      isFavorited: !!isFavorited
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a trip config and budget
// @route   PUT /api/trips/:id
// @access  Private
const updateTrip = async (req, res, next) => {
  try {
    const {
      destination,
      country,
      startDate,
      numberOfDays,
      budget,
      numberOfTravelers,
      interests,
      transportPreference,
      hotelPreference,
      foodPreference,
      tripType
    } = req.body;

    const trip = await Trip.findOne({ _id: req.params.id, user: req.user.id });
    if (!trip) {
      return ApiResponse.error(res, 'Trip not found', 404);
    }

    // Update fields
    if (destination !== undefined) trip.destination = destination;
    if (country !== undefined) trip.country = country;
    if (startDate !== undefined) trip.startDate = startDate;
    if (numberOfDays !== undefined) trip.numberOfDays = numberOfDays;
    if (budget !== undefined) trip.budget = budget;
    if (numberOfTravelers !== undefined) trip.numberOfTravelers = numberOfTravelers;
    if (interests !== undefined) trip.interests = interests;
    if (transportPreference !== undefined) trip.transportPreference = transportPreference;
    if (hotelPreference !== undefined) trip.hotelPreference = hotelPreference;
    if (foodPreference !== undefined) trip.foodPreference = foodPreference;
    if (tripType !== undefined) trip.tripType = tripType;

    // Recalculate budget breakdown
    trip.estimatedBudgetBreakdown = calculateEstimatedBudget(
      trip.numberOfDays,
      trip.budget,
      trip.numberOfTravelers,
      trip.transportPreference,
      trip.hotelPreference
    );

    await trip.save();
    logger.info(`Trip ${trip._id} configuration updated.`);

    return ApiResponse.success(res, 'Trip configuration updated successfully', { trip });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a trip and its resources
// @route   DELETE /api/trips/:id
// @access  Private
const deleteTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!trip) {
      return ApiResponse.error(res, 'Trip not found', 404);
    }

    // Delete corresponding itinerary
    await Itinerary.findOneAndDelete({ trip: trip._id });
    // Delete favorites
    await Favorite.deleteMany({ trip: trip._id });

    logger.info(`Trip ${req.params.id} and its itineraries deleted.`);
    return ApiResponse.success(res, 'Trip deleted successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Duplicate an existing trip (clones options and itinerary)
// @route   POST /api/trips/:id/duplicate
// @access  Private
const duplicateTrip = async (req, res, next) => {
  try {
    const sourceTrip = await Trip.findOne({ _id: req.params.id, user: req.user.id });
    if (!sourceTrip) {
      return ApiResponse.error(res, 'Source trip not found', 404);
    }

    const sourceItinerary = await Itinerary.findOne({ trip: sourceTrip._id });

    // Create cloned Trip
    const clonedTrip = new Trip({
      user: req.user.id,
      destination: `${sourceTrip.destination} (Copy)`,
      country: sourceTrip.country,
      startDate: sourceTrip.startDate,
      numberOfDays: sourceTrip.numberOfDays,
      budget: sourceTrip.budget,
      numberOfTravelers: sourceTrip.numberOfTravelers,
      interests: sourceTrip.interests,
      transportPreference: sourceTrip.transportPreference,
      hotelPreference: sourceTrip.hotelPreference,
      foodPreference: sourceTrip.foodPreference,
      tripType: sourceTrip.tripType,
      estimatedBudgetBreakdown: sourceTrip.estimatedBudgetBreakdown
    });

    await clonedTrip.save();

    // Create cloned Itinerary
    if (sourceItinerary) {
      const clonedItinerary = new Itinerary({
        trip: clonedTrip._id,
        user: req.user.id,
        days: sourceItinerary.days,
        travelTips: sourceItinerary.travelTips
      });
      await clonedItinerary.save();
    }

    logger.info(`Trip duplicated successfully: cloned ${sourceTrip._id} to ${clonedTrip._id}`);

    return ApiResponse.success(res, 'Trip duplicated successfully', {
      trip: clonedTrip
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current weather & 5-day forecast for trip destination
// @route   GET /api/trips/:id/weather
// @access  Private
const getTripWeather = async (req, res, next) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, user: req.user.id });
    if (!trip) {
      return ApiResponse.error(res, 'Trip not found', 404);
    }

    const weather = await weatherService.getWeatherByCity(trip.destination);
    return ApiResponse.success(res, 'Weather forecast retrieved', weather);
  } catch (error) {
    next(error);
  }
};

// @desc    Get user personal statistics
// @route   GET /api/trips/stats
// @access  Private
const getUserStats = async (req, res, next) => {
  try {
    const filter = { user: req.user.id };

    // 1. Total counts
    const totalTrips = await Trip.countDocuments(filter);

    // 2. Budget Distribution
    const budgetStats = await Trip.aggregate([
      { $match: filter },
      { $group: { _id: '$budget', count: { $sum: 1 } } }
    ]);
    const budgetDistribution = { Budget: 0, Moderate: 0, Luxury: 0 };
    budgetStats.forEach((stat) => {
      if (budgetDistribution[stat._id] !== undefined) {
        budgetDistribution[stat._id] = stat.count;
      }
    });

    // 3. Trips Per Month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1); // Start of month

    const monthlyStats = await Trip.aggregate([
      { 
        $match: {
          ...filter,
          createdAt: { $gte: sixMonthsAgo }
        } 
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const tripsPerMonth = [];

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      tripsPerMonth.push({
        label: `${months[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`,
        year: d.getFullYear(),
        month: d.getMonth() + 1,
        count: 0
      });
    }

    monthlyStats.forEach((stat) => {
      const target = tripsPerMonth.find(
        (m) => m.year === stat._id.year && m.month === stat._id.month
      );
      if (target) {
        target.count = stat.count;
      }
    });

    return ApiResponse.success(res, 'Statistics retrieved successfully', {
      summary: {
        totalTrips
      },
      charts: {
        budgetDistribution,
        tripsPerMonth: tripsPerMonth.map((m) => ({ label: m.label, count: m.count }))
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTrip,
  getUserTrips,
  getTripById,
  updateTrip,
  deleteTrip,
  duplicateTrip,
  getTripWeather,
  getUserStats
};
