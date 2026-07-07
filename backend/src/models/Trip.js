const mongoose = require('mongoose');

const TripSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    destination: {
      type: String,
      required: [true, 'Destination is required'],
      trim: true,
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    numberOfDays: {
      type: Number,
      required: [true, 'Number of days is required'],
      min: [1, 'Trip duration must be at least 1 day'],
      max: [30, 'Trip duration cannot exceed 30 days'],
    },
    budget: {
      type: String,
      enum: ['Budget', 'Moderate', 'Luxury'],
      required: [true, 'Budget tier is required'],
    },
    numberOfTravelers: {
      type: Number,
      required: true,
      default: 1,
      min: [1, 'Number of travelers must be at least 1'],
    },
    interests: {
      type: [String],
      default: [],
    },
    transportPreference: {
      type: String,
      enum: ['Public Transit', 'Car Rental', 'Walking', 'Flights', 'Taxi'],
      default: 'Public Transit',
    },
    hotelPreference: {
      type: String,
      enum: ['Hostel', 'Hotel', 'Resort', 'Airbnb', 'None'],
      default: 'Hotel',
    },
    foodPreference: {
      type: String,
      enum: ['Any', 'Vegetarian', 'Vegan', 'Halal', 'Kosher'],
      default: 'Any',
    },
    tripType: {
      type: String,
      enum: ['Solo', 'Family', 'Couple', 'Friends', 'Business'],
      required: [true, 'Trip type is required'],
    },
    isSaved: {
      type: Boolean,
      default: false,
    },
    estimatedBudgetBreakdown: {
      hotelCost: { type: Number, default: 0 },
      foodCost: { type: Number, default: 0 },
      transportCost: { type: Number, default: 0 },
      attractionsCost: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Trip', TripSchema);
