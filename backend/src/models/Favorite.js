const mongoose = require('mongoose');

const FavoriteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
    },
    destination: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Destination',
    },
  },
  {
    timestamps: true,
  }
);

// Sparse compound indexes to ensure uniqueness per user for both trips and destinations
FavoriteSchema.index({ user: 1, trip: 1 }, { unique: true, partialFilterExpression: { trip: { $exists: true } } });
FavoriteSchema.index({ user: 1, destination: 1 }, { unique: true, partialFilterExpression: { destination: { $exists: true } } });

module.exports = mongoose.model('Favorite', FavoriteSchema);
