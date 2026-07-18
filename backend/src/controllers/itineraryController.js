const Itinerary = require('../models/Itinerary');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');

// @desc    Update specific day plan inside an itinerary
// @route   PUT /api/itineraries/:id/days/:dayNum
// @access  Private
const updateItineraryDay = async (req, res, next) => {
  try {
    const { morningPlan, afternoonPlan, eveningPlan, recommendedAttractions, restaurants, localFood, transportationTips, estimatedDailyBudget } = req.body;
    const { id, dayNum } = req.params;

    const itinerary = await Itinerary.findOne({ trip: id, user: req.user.id });
    if (!itinerary) {
      return ApiResponse.error(res, 'Itinerary not found', 404);
    }

    const day = itinerary.days.find((d) => d.dayNumber === parseInt(dayNum));
    if (!day) {
      return ApiResponse.error(res, `Day ${dayNum} not found in itinerary`, 404);
    }

    // Update plans if provided
    if (morningPlan !== undefined) day.morningPlan = morningPlan;
    if (afternoonPlan !== undefined) day.afternoonPlan = afternoonPlan;
    if (eveningPlan !== undefined) day.eveningPlan = eveningPlan;
    if (recommendedAttractions !== undefined) day.recommendedAttractions = recommendedAttractions;
    if (restaurants !== undefined) day.restaurants = restaurants;
    if (localFood !== undefined) day.localFood = localFood;
    if (transportationTips !== undefined) day.transportationTips = transportationTips;
    if (estimatedDailyBudget !== undefined) day.estimatedDailyBudget = estimatedDailyBudget;

    await itinerary.save();
    logger.info(`Itinerary day plan updated: Itinerary ${id}, Day ${dayNum}`);

    return ApiResponse.success(res, `Day ${dayNum} updated successfully`, { itinerary });
  } catch (error) {
    next(error);
  }
};

// @desc    Add or remove travel tips for itinerary
// @route   PUT /api/itineraries/:id/tips
// @access  Private
const updateItineraryTips = async (req, res, next) => {
  try {
    const { travelTips } = req.body;
    const { id } = req.params;

    const itinerary = await Itinerary.findOne({ trip: id, user: req.user.id });
    if (!itinerary) {
      return ApiResponse.error(res, 'Itinerary not found', 404);
    }

    itinerary.travelTips = travelTips || [];
    await itinerary.save();

    return ApiResponse.success(res, 'Itinerary travel tips updated', { itinerary });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  updateItineraryDay,
  updateItineraryTips,
};
