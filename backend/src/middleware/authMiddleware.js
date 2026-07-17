const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Decode token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkey');

      // Get user from the token, excluding password
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return ApiResponse.error(res, 'Not authorized, user not found', 401);
      }

      next();
    } catch (error) {
      logger.error(`JWT verification error: ${error.message}`);
      if (error.name === 'TokenExpiredError') {
        return ApiResponse.error(res, 'Token expired', 401, { expired: true });
      }
      return ApiResponse.error(res, 'Not authorized, token failed', 401);
    }
  }

  if (!token) {
    return ApiResponse.error(res, 'Not authorized, token missing', 401);
  }
};

module.exports = {
  protect,
};
