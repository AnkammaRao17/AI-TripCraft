const logger = require('../utils/logger');
const ApiResponse = require('../utils/apiResponse');

const errorHandler = (err, req, res, next) => {
  logger.error(`Error: ${err.message}`);
  logger.error(err.stack);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    return ApiResponse.error(res, 'Validation Error', 400, messages);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return ApiResponse.error(res, `Duplicate field value entered: ${field}`, 400);
  }

  // Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    return ApiResponse.error(res, `Resource not found with id of ${err.value}`, 404);
  }

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  return ApiResponse.error(
    res,
    err.message || 'Internal Server Error',
    statusCode,
    process.env.NODE_ENV === 'production' ? null : err.stack
  );
};

module.exports = errorHandler;
