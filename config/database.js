const mongoose = require('mongoose');
const { createLogger } = require('../utils/logger');

const logger = createLogger(module);

// Set strictQuery option for Mongoose 7 compatibility
mongoose.set('strictQuery', false);

// Log the MongoDB URI being used (remove sensitive info in production)
logger.info(`Connecting to MongoDB: ${process.env.MONGODB_URI?.split('@')[1] || 'URI not found'}`);

// Connect to MongoDB
const connectDB = async () => {
  try {
    // Ensure MONGODB_URI is defined
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }
    
    const connection = await mongoose.connect(process.env.MONGODB_URI);
    
    logger.info(`MongoDB Connected: ${connection.connection.host}`);
    return connection;
  } catch (error) {
    logger.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB; 