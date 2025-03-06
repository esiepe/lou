const redis = require('redis');
const { promisify } = require('util');
const { createLogger } = require('../utils/logger');

const logger = createLogger(module);

// Create Redis client
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || '',
  db: process.env.REDIS_DB || 0,
  // If using Redis in a TLS environment (e.g., Redis Cloud):
  // tls: process.env.NODE_ENV === 'production' ? {} : undefined
});

// Promisify Redis commands
const getAsync = promisify(redisClient.get).bind(redisClient);
const setAsync = promisify(redisClient.set).bind(redisClient);
const delAsync = promisify(redisClient.del).bind(redisClient);
const expireAsync = promisify(redisClient.expire).bind(redisClient);
const keysAsync = promisify(redisClient.keys).bind(redisClient);

// Handle Redis connection events
redisClient.on('connect', () => {
  logger.info('Redis client connected');
});

redisClient.on('error', (err) => {
  logger.error(`Redis error: ${err.message}`);
});

// Wrap Redis client with promisified methods
exports.redisClient = {
  // Original client
  client: redisClient,
  
  // Promisified methods with error handling
  get: async (key) => {
    try {
      return await getAsync(key);
    } catch (error) {
      logger.error(`Redis GET error: ${error.message}`);
      return null;
    }
  },
  
  set: async (key, value, ...args) => {
    try {
      return await setAsync(key, value, ...args);
    } catch (error) {
      logger.error(`Redis SET error: ${error.message}`);
      return false;
    }
  },
  
  del: async (key) => {
    try {
      return await delAsync(key);
    } catch (error) {
      logger.error(`Redis DEL error: ${error.message}`);
      return 0;
    }
  },
  
  expire: async (key, seconds) => {
    try {
      return await expireAsync(key, seconds);
    } catch (error) {
      logger.error(`Redis EXPIRE error: ${error.message}`);
      return 0;
    }
  },
  
  keys: async (pattern) => {
    try {
      return await keysAsync(pattern);
    } catch (error) {
      logger.error(`Redis KEYS error: ${error.message}`);
      return [];
    }
  },
  
  // Additional utility methods
  setWithExpiry: async (key, value, expiry) => {
    try {
      await setAsync(key, value);
      return await expireAsync(key, expiry);
    } catch (error) {
      logger.error(`Redis SET with expiry error: ${error.message}`);
      return false;
    }
  },
  
  // Method to store and retrieve JSON objects
  setJSON: async (key, value, ...args) => {
    try {
      const jsonValue = JSON.stringify(value);
      return await setAsync(key, jsonValue, ...args);
    } catch (error) {
      logger.error(`Redis setJSON error: ${error.message}`);
      return false;
    }
  },
  
  getJSON: async (key) => {
    try {
      const value = await getAsync(key);
      if (!value) return null;
      return JSON.parse(value);
    } catch (error) {
      logger.error(`Redis getJSON error: ${error.message}`);
      return null;
    }
  }
}; 