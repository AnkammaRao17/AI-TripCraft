const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    destination: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Destination',
      required: true,
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required between 1 and 5'],
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: [true, 'Review comment is required'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent user from submitting multiple reviews for the same destination
ReviewSchema.index({ user: 1, destination: 1 }, { unique: true });

// Static method to calculate average rating of destination
ReviewSchema.statics.calculateAverageRating = async function (destinationId) {
  const stats = await this.aggregate([
    {
      $match: { destination: destinationId },
    },
    {
      $group: {
        _id: '$destination',
        numberOfRatings: { $sum: 1 },
        averageRating: { $avg: '$rating' },
      },
    },
  ]);

  try {
    if (stats.length > 0) {
      await mongoose.model('Destination').findByIdAndUpdate(destinationId, {
        averageRating: Math.round(stats[0].averageRating * 10) / 10,
        totalReviews: stats[0].numberOfRatings,
      });
    } else {
      await mongoose.model('Destination').findByIdAndUpdate(destinationId, {
        averageRating: 0,
        totalReviews: 0,
      });
    }
  } catch (err) {
    console.error('Error calculating average rating:', err);
  }
};

// Call calculateAverageRating after save
ReviewSchema.post('save', function () {
  this.constructor.calculateAverageRating(this.destination);
});

// Call calculateAverageRating after remove
ReviewSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    await doc.constructor.calculateAverageRating(doc.destination);
  }
});

module.exports = mongoose.model('Review', ReviewSchema);
