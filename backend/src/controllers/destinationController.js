const Destination = require('../models/Destination');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');

// @desc    Get all destinations
// @route   GET /api/destinations
// @access  Public
const getDestinations = async (req, res, next) => {
  try {
    const { search } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { country: { $regex: search, $options: 'i' } },
      ];
    }

    const destinations = await Destination.find(query).sort({ averageRating: -1 });
    return ApiResponse.success(res, 'Destinations retrieved successfully', { destinations });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single destination by ID
// @route   GET /api/destinations/:id
// @access  Public
const getDestinationById = async (req, res, next) => {
  try {
    const destination = await Destination.findById(req.params.id);
    if (!destination) {
      return ApiResponse.error(res, 'Destination not found', 404);
    }
    return ApiResponse.success(res, 'Destination retrieved', { destination });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDestinations,
  getDestinationById,
};
