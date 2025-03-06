const LostItem = require('../models/lostItem.model');
const FoundItem = require('../models/foundItem.model');
const User = require('../models/user.model');
const AppError = require('../utils/appError');
const { calculateSimilarity } = require('../utils/similarity');
const { sendEmail } = require('./email.service');

/**
 * Find potential matches for a lost item
 * @param {string} lostItemId - Lost item ID
 * @returns {Promise<Array>} Array of potential matches
 */
exports.findMatchesForLostItem = async (lostItemId) => {
  // Get lost item
  const lostItem = await LostItem.findById(lostItemId);
  if (!lostItem) {
    throw new AppError('Lost item not found', 404);
  }
  
  // Create query for potential matches
  const query = {
    category: lostItem.category,
    status: { $in: ['reported', 'matched'] },
    // Date range within 7 days before and 2 days after the lost date
    date: {
      $gte: new Date(lostItem.date.getTime() - 7 * 24 * 60 * 60 * 1000),
      $lte: new Date(lostItem.date.getTime() + 2 * 24 * 60 * 60 * 1000)
    }
  };
  
  // Geospatial query if coordinates available
  if (lostItem.location && lostItem.location.coordinates) {
    // Get user's preferred search radius or default to 10km
    const user = await User.findById(lostItem.user);
    const searchRadius = user?.preferences?.locationRadius || 10;
    
    query.location = {
      $nearSphere: {
        $geometry: {
          type: 'Point',
          coordinates: lostItem.location.coordinates
        },
        $maxDistance: searchRadius * 1000 // Convert to meters
      }
    };
  }
  
  // Find potential matches
  const foundItems = await FoundItem.find(query).populate('finder', 'name email');
  
  // Calculate similarity scores and rank matches
  const matches = foundItems.map(foundItem => {
    const similarityScore = calculateSimilarity(lostItem, foundItem);
    
    return {
      foundItem,
      score: similarityScore,
      matchDate: new Date()
    };
  });
  
  // Sort by similarity score
  matches.sort((a, b) => b.score - a.score);
  
  // Only return matches with a score above a certain threshold
  const validMatches = matches.filter(match => match.score >= 0.3);
  
  // If there are new matches, notify the user
  if (validMatches.length > 0) {
    const user = await User.findById(lostItem.user);
    
    if (user && user.preferences?.notifications?.email) {
      sendEmail({
        email: user.email,
        subject: 'New potential matches for your lost item',
        message: `We've found ${validMatches.length} potential matches for your lost item "${lostItem.title}". Please check your account for details.`
      });
    }
  }
  
  return validMatches;
};

/**
 * Find potential matches for a found item
 * @param {string} foundItemId - Found item ID
 * @returns {Promise<Array>} Array of potential matches
 */
exports.findMatchesForFoundItem = async (foundItemId) => {
  // Get found item
  const foundItem = await FoundItem.findById(foundItemId);
  if (!foundItem) {
    throw new AppError('Found item not found', 404);
  }
  
  // Create query for potential matches
  const query = {
    category: foundItem.category,
    status: { $in: ['reported', 'matched'] },
    // Date range within 7 days before and after the found date
    date: {
      $gte: new Date(foundItem.date.getTime() - 7 * 24 * 60 * 60 * 1000),
      $lte: new Date(foundItem.date.getTime() + 7 * 24 * 60 * 60 * 1000)
    }
  };
  
  // Geospatial query if coordinates available
  if (foundItem.location && foundItem.location.coordinates) {
    // Get user's preferred search radius or default to 10km
    const user = await User.findById(foundItem.finder);
    const searchRadius = user?.preferences?.locationRadius || 10;
    
    query.location = {
      $nearSphere: {
        $geometry: {
          type: 'Point',
          coordinates: foundItem.location.coordinates
        },
        $maxDistance: searchRadius * 1000 // Convert to meters
      }
    };
  }
  
  // Find potential matches
  const lostItems = await LostItem.find(query).populate('user', 'name email');
  
  // Calculate similarity scores and rank matches
  const matches = lostItems.map(lostItem => {
    const similarityScore = calculateSimilarity(lostItem, foundItem);
    
    return {
      lostItem,
      score: similarityScore,
      matchDate: new Date()
    };
  });
  
  // Sort by similarity score
  matches.sort((a, b) => b.score - a.score);
  
  // Only return matches with a score above a certain threshold
  const validMatches = matches.filter(match => match.score >= 0.3);
  
  // If there are new matches, notify the user
  if (validMatches.length > 0) {
    const user = await User.findById(foundItem.finder);
    
    if (user && user.preferences?.notifications?.email) {
      sendEmail({
        email: user.email,
        subject: 'New potential matches for your found item',
        message: `We've found ${validMatches.length} potential lost items that may match your found item "${foundItem.title}". Please check your account for details.`
      });
    }
  }
  
  return validMatches;
};

/**
 * Confirm a match between lost and found items
 * @param {string} lostItemId - Lost item ID
 * @param {string} foundItemId - Found item ID
 * @returns {Promise<Object>} Match details
 */
exports.confirmMatch = async (lostItemId, foundItemId) => {
  // Get items
  const lostItem = await LostItem.findById(lostItemId);
  const foundItem = await FoundItem.findById(foundItemId);
  
  if (!lostItem || !foundItem) {
    throw new AppError('Item not found', 404);
  }
  
  // Update lost item
  lostItem.isMatched = true;
  lostItem.matchedWith = foundItemId;
  lostItem.status = 'matched';
  await lostItem.save();
  
  // Update found item
  foundItem.isMatched = true;
  
  // Add to matched array if it's not already there
  if (!foundItem.matchedWith.includes(lostItemId)) {
    foundItem.matchedWith.push(lostItemId);
  }
  
  foundItem.status = 'matched';
  await foundItem.save();
  
  // Notify users
  const lostItemUser = await User.findById(lostItem.user);
  const foundItemUser = await User.findById(foundItem.finder);
  
  if (lostItemUser && lostItemUser.preferences?.notifications?.email) {
    sendEmail({
      email: lostItemUser.email,
      subject: 'Your lost item has been matched!',
      message: `Good news! Your lost item "${lostItem.title}" has been matched with a found item. Please check your account for details on how to proceed.`
    });
  }
  
  if (foundItemUser && foundItemUser.preferences?.notifications?.email) {
    sendEmail({
      email: foundItemUser.email,
      subject: 'Your found item has been matched!',
      message: `Good news! Your found item "${foundItem.title}" has been matched with a lost item. Please check your account for details on how to proceed.`
    });
  }
  
  return {
    lostItem,
    foundItem,
    matchDate: new Date()
  };
};

/**
 * Remove a match between lost and found items
 * @param {string} lostItemId - Lost item ID
 * @param {string} foundItemId - Found item ID
 * @returns {Promise<void>}
 */
exports.removeMatch = async (lostItemId, foundItemId) => {
  // Get items
  const lostItem = await LostItem.findById(lostItemId);
  const foundItem = await FoundItem.findById(foundItemId);
  
  if (!lostItem || !foundItem) {
    throw new AppError('Item not found', 404);
  }
  
  // Update lost item
  if (lostItem.matchedWith && lostItem.matchedWith.toString() === foundItemId) {
    lostItem.isMatched = false;
    lostItem.matchedWith = null;
    lostItem.status = 'reported';
    await lostItem.save();
  }
  
  // Update found item
  if (foundItem.matchedWith) {
    foundItem.matchedWith = foundItem.matchedWith.filter(
      id => id.toString() !== lostItemId
    );
    
    foundItem.isMatched = foundItem.matchedWith.length > 0;
    if (!foundItem.isMatched) {
      foundItem.status = 'reported';
    }
    
    await foundItem.save();
  }
};

/**
 * Verify if a user has access to an item
 * @param {string} itemId - Item ID
 * @param {string} itemType - 'lost' or 'found'
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} Whether user has access
 */
exports.verifyItemAccess = async (itemId, itemType, userId) => {
  const Model = itemType === 'lost' ? LostItem : FoundItem;
  const userField = itemType === 'lost' ? 'user' : 'finder';
  
  const item = await Model.findById(itemId);
  if (!item) return false;
  
  return item[userField].toString() === userId;
}; 