const mongoose = require('mongoose');

const DayPlanSchema = new mongoose.Schema({
  dayNumber: { type: Number, required: true },
  morningPlan: { type: String, required: true },
  afternoonPlan: { type: String, required: true },
  eveningPlan: { type: String, required: true },
  recommendedAttractions: { type: [String], default: [] },
  restaurants: { type: [String], default: [] },
  localFood: { type: [String], default: [] },
  transportationTips: { type: String, default: '' },
  estimatedDailyBudget: { type: Number, default: 0 },
});

const ItinerarySchema = new mongoose.Schema(
  {
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      required: true,
      unique: true, // each trip has exactly one generated itinerary
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    days: [DayPlanSchema],
    travelTips: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Itinerary', ItinerarySchema);
