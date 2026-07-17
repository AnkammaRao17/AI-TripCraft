const mongoose = require('mongoose');
const logger = require('../utils/logger');
const User = require('../models/User');

const cleanAdminUsers = async () => {
  try {
    const res = await User.deleteMany({
      $or: [
        { role: 'admin' },
        { email: 'yarruankammarao25@gmail.com' }
      ]
    });
    if (res.deletedCount > 0) {
      logger.info(`Cleaned up ${res.deletedCount} admin users from the database.`);
    }
  } catch (error) {
    logger.error(`Error cleaning up admin users: ${error.message}`);
  }
};

const connectDB = async () => {
  try {
    let connString = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/aitripcraft';
    logger.info(`Checking MongoDB connection at: ${connString.replace(/:([^@]+)@/, ':****@')}`);
    
    try {
      await mongoose.connect(connString, {
        autoIndex: true,
        serverSelectionTimeoutMS: 2000 // Fast fail in 2 seconds
      });
      logger.info('MongoDB connected successfully.');
      await cleanAdminUsers();
    } catch (localError) {
      logger.warn(`Could not connect to MongoDB at ${connString}: ${localError.message}`);
      logger.info('Starting In-Memory MongoDB Server for demonstration...');
      
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      connString = mongoServer.getUri();
      
      logger.info(`In-Memory MongoDB Server running at: ${connString}`);
      await mongoose.connect(connString, {
        autoIndex: true
      });
      logger.info('MongoDB connected successfully (In-Memory).');

      // Seed data inline immediately in-process
      const { seedDatabaseInline } = require('./seed');
      await seedDatabaseInline(false);
      logger.info('Database seeded inline successfully.');
      await cleanAdminUsers();
    }
  } catch (error) {
    logger.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
