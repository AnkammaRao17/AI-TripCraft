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

// @desc    Create a destination (Admin only)
// @route   POST /api/destinations
// @access  Private/Admin
const createDestination = async (req, res, next) => {
  try {
    const { name, country, description, imageUrl, lat, lng } = req.body;

    const exists = await Destination.findOne({ name });
    if (exists) {
      return ApiResponse.error(res, 'Destination name already exists', 400);
    }

    const destination = await Destination.create({
      name,
      country,
      description,
      imageUrl,
      coordinates: {
        lat: lat || 0,
        lng: lng || 0,
      },
    });

    logger.info(`Destination created by Admin: ${name}`);
    return ApiResponse.success(res, 'Destination created successfully', { destination }, 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a destination (Admin only)
// @route   PUT /api/destinations/:id
// @access  Private/Admin
const updateDestination = async (req, res, next) => {
  try {
    const { name, country, description, imageUrl, lat, lng } = req.body;

    const destination = await Destination.findById(req.params.id);
    if (!destination) {
      return ApiResponse.error(res, 'Destination not found', 404);
    }

    if (name !== undefined) destination.name = name;
    if (country !== undefined) destination.country = country;
    if (description !== undefined) destination.description = description;
    if (imageUrl !== undefined) destination.imageUrl = imageUrl;
    if (lat !== undefined) destination.coordinates.lat = lat;
    if (lng !== undefined) destination.coordinates.lng = lng;

    await destination.save();
    logger.info(`Destination updated by Admin: ${destination.name}`);

    return ApiResponse.success(res, 'Destination updated successfully', { destination });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a destination (Admin only)
// @route   DELETE /api/destinations/:id
// @access  Private/Admin
const deleteDestination = async (req, res, next) => {
  try {
    const destination = await Destination.findByIdAndDelete(req.params.id);
    if (!destination) {
      return ApiResponse.error(res, 'Destination not found', 404);
    }

    // Delete reviews associated with this destination
    const Review = require('../models/Review');
    await Review.deleteMany({ destination: req.params.id });

    logger.info(`Destination deleted by Admin: ${destination.name}`);
    return ApiResponse.success(res, 'Destination deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDestinations,
  getDestinationById,
  createDestination,
  updateDestination,
  deleteDestination,
};
