const mongoose = require('mongoose');
const logger = require('../utils/logger');
const User = require('../models/User');

const cleanAdminUsers = async () => {
  // Disabled to prevent deleting user records during startup in production.
  logger.info('Admin user cleanup is disabled.');
};

const connectDB = async () => {
  try {
    const connString = process.env.MONGODB_URI;
    if (!connString) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }
    logger.info(`Checking MongoDB connection at: ${connString.replace(/:([^@]+)@/, ':****@')}`);
    
    await mongoose.connect(connString, {
      autoIndex: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4
    });
    console.log('MongoDB Connected Successfully');
    logger.info('✓ Connected to MongoDB');

    let dbName = 'Unknown';
    let version = 'Unknown';
    let collectionCount = 0;
    let userCount = 0;

    try {
      const conn = mongoose.connection;
      dbName = conn.db.databaseName;
      const admin = conn.db.admin();
      const buildInfo = await admin.buildInfo();
      version = buildInfo.version;
      const collections = await conn.db.listCollections().toArray();
      collectionCount = collections.length;
      userCount = await User.countDocuments({});
    } catch (statsError) {
      logger.warn(`Failed to gather MongoDB stats: ${statsError.message}`);
    }

    logger.info(`Database Name: ${dbName}`);
    logger.info(`MongoDB Version: ${version}`);
    logger.info(`Collection Count: ${collectionCount}`);
    logger.info(`User Count: ${userCount}`);

    // Auto-seed database if empty
    try {
      const Destination = require('../models/Destination');
      const destinationCount = await Destination.countDocuments({});
      if (destinationCount === 0) {
        logger.info('No destinations found in database. Initiating automatic seeding...');
        const { seedDatabaseInline } = require('./seed');
        await seedDatabaseInline(false);
        logger.info('✓ Database auto-seeded successfully!');
        
        // Update statistics
        userCount = await User.countDocuments({});
        logger.info(`Updated User Count post-seed: ${userCount}`);
      }
    } catch (seedError) {
      logger.error(`Database auto-seeding failed: ${seedError.message}`);
    }
  } catch (error) {
    console.error('MongoDB connection error:', error);
    logger.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
