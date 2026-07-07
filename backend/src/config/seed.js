const mongoose = require('mongoose');
const User = require('../models/User');
const Destination = require('../models/Destination');
const Trip = require('../models/Trip');
const Itinerary = require('../models/Itinerary');
const Favorite = require('../models/Favorite');
const Review = require('../models/Review');
require('dotenv').config();

const users = [
  {
    username: 'admin',
    email: 'admin@aitripcraft.com',
    password: 'adminpassword123',
    role: 'admin',
    profile: {
      firstName: 'System',
      lastName: 'Administrator',
      phone: '+15550100',
      avatarUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=admin',
    },
  },
  {
    username: 'john_doe',
    email: 'john@gmail.com',
    password: 'userpassword123',
    role: 'user',
    profile: {
      firstName: 'John',
      lastName: 'Doe',
      phone: '+15550199',
      avatarUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=john',
    },
  },
  {
    username: 'jane_traveler',
    email: 'jane@gmail.com',
    password: 'userpassword123',
    role: 'user',
    profile: {
      firstName: 'Jane',
      lastName: 'Smith',
      phone: '+15550188',
      avatarUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=jane',
    },
  },
];

const destinations = [
  {
    name: 'Paris',
    country: 'France',
    description: 'The City of Light is a global center for art, fashion, gastronomy, and culture.',
    coordinates: { lat: 48.8566, lng: 2.3522 },
    imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Tokyo',
    country: 'Japan',
    description: 'Japan’s busy capital mixes ultramodern neon skyscrapers with historic Shinto temples.',
    coordinates: { lat: 35.6762, lng: 139.6503 },
    imageUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'New York City',
    country: 'United States',
    description: 'The Big Apple is known for its iconic landmarks, Broadway shows, and bustling streets.',
    coordinates: { lat: 40.7128, lng: -74.0060 },
    imageUrl: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Rome',
    country: 'Italy',
    description: 'A sprawling, cosmopolitan city with nearly 3,000 years of globally influential art, architecture, and culture.',
    coordinates: { lat: 41.9028, lng: 12.4964 },
    imageUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Sydney',
    country: 'Australia',
    description: 'Capital of New South Wales and one of Australia\'s largest cities, best known for its Harbour Bridge and Opera House.',
    coordinates: { lat: -33.8688, lng: 151.2093 },
    imageUrl: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=800&q=80',
  },
];

const seedDatabaseInline = async (shouldExit = false) => {
  try {
    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Destination.deleteMany({});
    await Trip.deleteMany({});
    await Itinerary.deleteMany({});
    await Favorite.deleteMany({});
    await Review.deleteMany({});

    console.log('Seeding Users...');
    for (const u of users) {
      await User.create(u);
    }

    console.log('Seeding Destinations...');
    for (const d of destinations) {
      await Destination.create(d);
    }

    console.log('Database seeded successfully!');
    if (shouldExit) {
      process.exit(0);
    }
  } catch (error) {
    console.error('Error seeding database:', error);
    if (shouldExit) {
      process.exit(1);
    }
  }
};

const runStandalone = async () => {
  try {
    const connString = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/aitripcraft';
    console.log(`Connecting to database for seeding...`);
    await mongoose.connect(connString);
    await seedDatabaseInline(true);
  } catch (error) {
    console.error('Standalone seeding failed:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  runStandalone();
}

module.exports = { seedDatabaseInline };
