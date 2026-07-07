const User = require('../models/User');
const Trip = require('../models/Trip');
const Destination = require('../models/Destination');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');

// @desc    Get all users (Admin only)
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).select('-refreshTokens').sort({ createdAt: -1 });
    return ApiResponse.success(res, 'Users retrieved successfully', { users });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a user (Admin only)
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = async (req, res, next) => {
  try {
    const userId = req.params.id;
    if (userId === req.user.id) {
      return ApiResponse.error(res, 'You cannot delete your own admin account', 400);
    }

    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return ApiResponse.error(res, 'User not found', 404);
    }

    // Delete associated trips, itineraries, favorites, and reviews
    const Trip = require('../models/Trip');
    const Itinerary = require('../models/Itinerary');
    const Favorite = require('../models/Favorite');
    const Review = require('../models/Review');

    const userTrips = await Trip.find({ user: userId });
    const tripIds = userTrips.map((t) => t._id);

    await Trip.deleteMany({ user: userId });
    await Itinerary.deleteMany({ user: userId });
    await Favorite.deleteMany({ user: userId });
    await Review.deleteMany({ user: userId });

    logger.info(`Admin deleted user account: ${user.email} and all associated items.`);
    return ApiResponse.success(res, 'User and associated data deleted successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Get all trips in system (Admin only)
// @route   GET /api/admin/trips
// @access  Private/Admin
const getAllTrips = async (req, res, next) => {
  try {
    const trips = await Trip.find({})
      .populate('user', 'username email')
      .sort({ createdAt: -1 });
    return ApiResponse.success(res, 'All system trips retrieved', { trips });
  } catch (error) {
    next(error);
  }
};

// @desc    Get system-wide or user statistics (for charts and summary cards)
// @route   GET /api/admin/stats
// @access  Private (If user, returns personal stats. If admin, returns global stats)
const getStatistics = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const filter = isAdmin ? {} : { user: req.user.id };

    // 1. Total counts
    const totalTrips = await Trip.countDocuments(filter);
    
    let totalUsers = 0;
    let totalDestinations = 0;
    if (isAdmin) {
      totalUsers = await User.countDocuments({});
      totalDestinations = await Destination.countDocuments({});
    }

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

    // 3. Trip Type / Category Distribution
    const typeStats = await Trip.aggregate([
      { $match: filter },
      { $group: { _id: '$tripType', count: { $sum: 1 } } }
    ]);
    const tripTypeDistribution = { Solo: 0, Family: 0, Couple: 0, Friends: 0, Business: 0 };
    typeStats.forEach((stat) => {
      if (tripTypeDistribution[stat._id] !== undefined) {
        tripTypeDistribution[stat._id] = stat.count;
      }
    });

    // 4. Trips Per Month (last 6 months)
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

    // 5. Popular Destinations (Top 5)
    const destinationStats = await Trip.aggregate([
      { $match: filter },
      { $group: { _id: '$destination', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    const popularDestinations = destinationStats.map((stat) => ({
      destination: stat._id,
      count: stat.count
    }));

    return ApiResponse.success(res, 'Statistics retrieved successfully', {
      summary: {
        totalTrips,
        totalUsers: isAdmin ? totalUsers : undefined,
        totalDestinations: isAdmin ? totalDestinations : undefined
      },
      charts: {
        budgetDistribution,
        tripTypeDistribution,
        tripsPerMonth: tripsPerMonth.map((m) => ({ label: m.label, count: m.count })),
        popularDestinations
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  deleteUser,
  getAllTrips,
  getStatistics
};
