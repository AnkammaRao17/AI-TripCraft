const Review = require('../models/Review');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');

// @desc    Add review for a destination
// @route   POST /api/reviews
// @access  Private
const addReview = async (req, res, next) => {
  try {
    const { destinationId, rating, comment } = req.body;

    const exists = await Review.findOne({ user: req.user.id, destination: destinationId });
    if (exists) {
      return ApiResponse.error(res, 'You have already reviewed this destination', 400);
    }

    const review = await Review.create({
      user: req.user.id,
      destination: destinationId,
      rating,
      comment,
    });

    // Populate user profile before sending back response
    await review.populate('user', 'username profile');

    logger.info(`Review added for destination ${destinationId} by user ${req.user.email}`);
    return ApiResponse.success(res, 'Review added successfully', { review }, 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Get reviews for a destination
// @route   GET /api/reviews/destination/:id
// @access  Public
const getDestinationReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ destination: req.params.id })
      .populate('user', 'username profile')
      .sort({ createdAt: -1 });

    return ApiResponse.success(res, 'Reviews retrieved successfully', { reviews });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  Private
const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return ApiResponse.error(res, 'Review not found', 404);
    }

    // Verify ownership
    if (review.user.toString() !== req.user.id) {
      return ApiResponse.error(res, 'Not authorized to delete this review', 403);
    }

    await Review.findByIdAndDelete(req.params.id);
    logger.info(`Review ${req.params.id} deleted.`);

    return ApiResponse.success(res, 'Review deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addReview,
  getDestinationReviews,
  deleteReview,
};
