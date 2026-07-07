const { body } = require('express-validator');

const registerValidator = [
  body('username')
    .trim()
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters long')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain alphanumeric characters and underscores'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('firstName').optional().trim(),
  body('lastName').optional().trim(),
  body('phone').optional().trim(),
];

const loginValidator = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

const tripValidator = [
  body('destination')
    .trim()
    .notEmpty()
    .withMessage('Destination is required'),
  body('country')
    .trim()
    .notEmpty()
    .withMessage('Country is required'),
  body('startDate')
    .isISO8601()
    .withMessage('Please provide a valid start date (YYYY-MM-DD)')
    .custom((value) => {
      const date = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) {
        throw new Error('Start date cannot be in the past');
      }
      return true;
    }),
  body('numberOfDays')
    .isInt({ min: 1, max: 30 })
    .withMessage('Number of days must be between 1 and 30'),
  body('budget')
    .isIn(['Budget', 'Moderate', 'Luxury'])
    .withMessage('Budget must be one of: Budget, Moderate, Luxury'),
  body('numberOfTravelers')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Number of travelers must be at least 1'),
  body('interests')
    .optional()
    .isArray()
    .withMessage('Interests must be an array of strings'),
  body('transportPreference')
    .optional()
    .isIn(['Public Transit', 'Car Rental', 'Walking', 'Flights', 'Taxi'])
    .withMessage('Invalid transport preference'),
  body('hotelPreference')
    .optional()
    .isIn(['Hostel', 'Hotel', 'Resort', 'Airbnb', 'None'])
    .withMessage('Invalid hotel preference'),
  body('foodPreference')
    .optional()
    .isIn(['Any', 'Vegetarian', 'Vegan', 'Halal', 'Kosher'])
    .withMessage('Invalid food preference'),
  body('tripType')
    .isIn(['Solo', 'Family', 'Couple', 'Friends', 'Business'])
    .withMessage('Trip type must be one of: Solo, Family, Couple, Friends, Business'),
];

const reviewValidator = [
  body('destinationId')
    .isMongoId()
    .withMessage('Invalid destination ID'),
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be an integer between 1 and 5'),
  body('comment')
    .trim()
    .isLength({ min: 3 })
    .withMessage('Comment must be at least 3 characters long'),
];

module.exports = {
  registerValidator,
  loginValidator,
  tripValidator,
  reviewValidator,
};
