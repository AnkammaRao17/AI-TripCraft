const mongoose = require('mongoose');

const DestinationSchema = new mongoose.Schema(
  {
    name:        { type: String, required: [true, 'Destination name is required'], unique: true, trim: true },
    country:     { type: String, required: [true, 'Country is required'], trim: true },
    state:       { type: String, default: '' },
    city:        { type: String, default: '' },
    category:    { type: String, default: 'Tourism' }, // Metro | Hill Station | Heritage | Beach | Tech Hub | Tourism
    description: { type: String, default: '' },
    history:     { type: String, default: '' },
    culture:     { type: String, default: '' },
    language:    { type: String, default: '' },
    currency:    { type: String, default: '' },

    coordinates: {
      lat: { type: Number, default: 0 },
      lng: { type: Number, default: 0 },
    },
    latitude:  { type: Number, default: 0 },
    longitude: { type: Number, default: 0 },

    imageUrl: { type: String, default: '' },
    gallery:  { type: [String], default: [] },

    climate:        { type: String, default: '' },
    weather:        { type: String, default: '' },
    avgTemperature: { type: String, default: '' },
    bestTime:       { type: String, default: '' },

    nearbyAirport:  { type: String, default: '' },
    metroAvailable: { type: Boolean, default: false },
    publicTransport:{ type: String, default: '' },

    budget:             { type: String, default: 'Moderate' },
    estimatedBudgetMin: { type: Number, default: 0 },
    estimatedBudgetMax: { type: Number, default: 0 },

    hotels:      { type: [String], default: [] },
    luxuryHotels:{ type: [String], default: [] },
    budgetHotels:{ type: [String], default: [] },

    restaurants:  { type: [String], default: [] },
    streetFood:   { type: [String], default: [] },
    localFoods:   { type: [String], default: [] },
    shoppingAreas:{ type: [String], default: [] },
    nightlife:    { type: [String], default: [] },

    attractions:      { type: [String], default: [] },
    hiddenGems:       { type: [String], default: [] },
    adventureActivities:{ type: [String], default: [] },
    familyActivities: { type: [String], default: [] },
    coupleActivities: { type: [String], default: [] },
    soloTravelTips:   { type: String, default: '' },

    safetyScore: { type: Number, default: 7, min: 0, max: 10 },

    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews:  { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Destination', DestinationSchema);
