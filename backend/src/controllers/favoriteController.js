const Favorite = require('../models/Favorite');
const Trip = require('../models/Trip');
const Destination = require('../models/Destination');
const ApiResponse = require('../utils/apiResponse');

// @desc    Toggle favorite on a trip
// @route   POST /api/favorites/toggle/:tripId
// @access  Private
const toggleFavorite = async (req, res, next) => {
  try {
    const { tripId } = req.params;

    // Check if trip exists and belongs to the user
    const trip = await Trip.findOne({ _id: tripId, user: req.user.id });
    if (!trip) {
      return ApiResponse.error(res, 'Trip not found', 404);
    }

    const favorite = await Favorite.findOne({ user: req.user.id, trip: tripId });

    if (favorite) {
      // Already favorited, remove it
      await Favorite.findByIdAndDelete(favorite._id);
      trip.isSaved = false;
      await trip.save();
      return ApiResponse.success(res, 'Trip removed from favorites', { isFavorited: false });
    } else {
      // Add to favorites
      await Favorite.create({ user: req.user.id, trip: tripId });
      trip.isSaved = true;
      await trip.save();
      return ApiResponse.success(res, 'Trip added to favorites', { isFavorited: true });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get user favorite trips
// @route   GET /api/favorites
// @access  Private
const getUserFavorites = async (req, res, next) => {
  try {
    const favorites = await Favorite.find({ user: req.user.id, trip: { $ne: null } })
      .populate({
        path: 'trip',
        model: 'Trip',
      })
      .sort({ createdAt: -1 });

    // Filter out favorites where trip was deleted
    const validFavorites = favorites.filter((f) => f.trip !== null);

    return ApiResponse.success(res, 'Favorites retrieved', {
      favorites: validFavorites,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle favorite on a destination
// @route   POST /api/favorites/toggle-destination/:destId
// @access  Private
const toggleFavoriteDestination = async (req, res, next) => {
  try {
    const { destId } = req.params;

    const dest = await Destination.findById(destId);
    if (!dest) {
      return ApiResponse.error(res, 'Destination not found', 404);
    }

    const favorite = await Favorite.findOne({ user: req.user.id, destination: destId });

    if (favorite) {
      await Favorite.findByIdAndDelete(favorite._id);
      return ApiResponse.success(res, 'Destination removed from favorites', { isFavorited: false });
    } else {
      await Favorite.create({ user: req.user.id, destination: destId });
      return ApiResponse.success(res, 'Destination added to favorites', { isFavorited: true });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get user favorite destinations
// @route   GET /api/favorites/destinations
// @access  Private
const getUserFavoriteDestinations = async (req, res, next) => {
  try {
    const favorites = await Favorite.find({ user: req.user.id, destination: { $ne: null } })
      .populate({
        path: 'destination',
        model: 'Destination',
      })
      .sort({ createdAt: -1 });

    const validFavorites = favorites.filter((f) => f.destination !== null);

    return ApiResponse.success(res, 'Favorite destinations retrieved', {
      favorites: validFavorites,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  toggleFavorite,
  getUserFavorites,
  toggleFavoriteDestination,
  getUserFavoriteDestinations,
};
