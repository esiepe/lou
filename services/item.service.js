const LostItem = require('../models/lostItem.model');
const FoundItem = require('../models/foundItem.model');
const AppError = require('../utils/appError');
const { uploadImage, deleteImage } = require('./image.service');

/**
 * Create a lost item
 * @param {Object} itemData - Lost item data
 * @param {Array} files - Image files
 * @param {string} userId - User ID
 * @returns {Promise<LostItem>} Created lost item
 */
exports.createLostItem = async (itemData, files, userId) => {
  // Process images if provided
  const photos = [];
  if (files && files.length > 0) {
    for (const file of files) {
      const result = await uploadImage(file);
      photos.push({
        url: result.secure_url,
        publicId: result.public_id,
        caption: file.originalname
      });
    }
  }
  
  // Create lost item with processed data
  const lostItem = await LostItem.create({
    ...itemData,
    photos,
    user: userId,
    status: 'reported'
  });
  
  // Trigger matching algorithm in the background
  setTimeout(() => {
    require('./match.service').findMatchesForLostItem(lostItem._id);
  }, 0);
  
  return lostItem;
};

/**
 * Create a found item
 * @param {Object} itemData - Found item data
 * @param {Array} files - Image files
 * @param {string} userId - User ID
 * @returns {Promise<FoundItem>} Created found item
 */
exports.createFoundItem = async (itemData, files, userId) => {
  // Process images
  const photos = [];
  if (files && files.length > 0) {
    for (const file of files) {
      const result = await uploadImage(file);
      photos.push({
        url: result.secure_url,
        publicId: result.public_id,
        caption: file.originalname
      });
    }
  }
  
  // Create found item
  const foundItem = await FoundItem.create({
    ...itemData,
    photos,
    finder: userId,
    status: 'reported'
  });
  
  // Trigger matching algorithm in the background
  setTimeout(() => {
    require('./match.service').findMatchesForFoundItem(foundItem._id);
  }, 0);
  
  return foundItem;
};

/**
 * Update an item
 * @param {string} itemId - Item ID
 * @param {string} itemType - 'lost' or 'found'
 * @param {Object} updates - Update data
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Updated item
 */
exports.updateItem = async (itemId, itemType, updates, userId) => {
  const Model = itemType === 'lost' ? LostItem : FoundItem;
  const userField = itemType === 'lost' ? 'user' : 'finder';
  
  // Find item and check ownership
  const item = await Model.findById(itemId);
  
  if (!item) {
    throw new AppError('Item not found', 404);
  }
  
  // Check if user owns the item
  if (item[userField].toString() !== userId && req.user.role !== 'admin') {
    throw new AppError('You do not have permission to update this item', 403);
  }
  
  // Update item with filtered updates
  // Don't allow updating certain fields like status directly
  const allowedUpdates = ['title', 'description', 'category', 'features', 'location'];
  const filteredUpdates = {};
  
  Object.keys(updates).forEach(key => {
    if (allowedUpdates.includes(key)) {
      filteredUpdates[key] = updates[key];
    }
  });
  
  // Update item
  const updatedItem = await Model.findByIdAndUpdate(
    itemId,
    filteredUpdates,
    { new: true, runValidators: true }
  );
  
  return updatedItem;
};

/**
 * Delete an item
 * @param {string} itemId - Item ID
 * @param {string} itemType - 'lost' or 'found'
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} Success status
 */
exports.deleteItem = async (itemId, itemType, userId) => {
  const Model = itemType === 'lost' ? LostItem : FoundItem;
  const userField = itemType === 'lost' ? 'user' : 'finder';
  
  // Find item
  const item = await Model.findById(itemId);
  
  if (!item) {
    throw new AppError('Item not found', 404);
  }
  
  // Check if user owns the item
  if (item[userField].toString() !== userId && req.user.role !== 'admin') {
    throw new AppError('You do not have permission to delete this item', 403);
  }
  
  // Check if item has claims
  const hasClaims = await Claim.exists({ item: itemId });
  if (hasClaims) {
    throw new AppError('Cannot delete item with active claims', 400);
  }
  
  // Delete images from cloud storage
  if (item.photos && item.photos.length > 0) {
    for (const photo of item.photos) {
      if (photo.publicId) {
        await deleteImage(photo.publicId);
      }
    }
  }
  
  // Delete item
  await Model.findByIdAndDelete(itemId);
  
  return true;
};

/**
 * Search items with pagination, filtering, and sorting
 * @param {Object} query - Search parameters
 * @param {string} itemType - 'lost' or 'found'
 * @returns {Promise<Object>} Search results with pagination info
 */
exports.searchItems = async (query, itemType) => {
  const Model = itemType === 'lost' ? LostItem : FoundItem;
  
  // Build filter object
  const filter = {};
  
  // Category filter
  if (query.category) {
    filter.category = query.category;
  }
  
  // Status filter
  if (query.status) {
    filter.status = query.status;
  }
  
  // Date range filter
  if (query.startDate || query.endDate) {
    filter.date = {};
    if (query.startDate) filter.date.$gte = new Date(query.startDate);
    if (query.endDate) filter.date.$lte = new Date(query.endDate);
  }
  
  // Text search
  if (query.search) {
    filter.$or = [
      { title: { $regex: query.search, $options: 'i' } },
      { description: { $regex: query.search, $options: 'i' } }
    ];
  }
  
  // Geospatial search
  if (query.lat && query.lng && query.radius) {
    filter.location = {
      $nearSphere: {
        $geometry: {
          type: 'Point',
          coordinates: [parseFloat(query.lng), parseFloat(query.lat)]
        },
        $maxDistance: parseInt(query.radius) * 1000 // Convert to meters
      }
    };
  }
  
  // Pagination
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 20;
  const skip = (page - 1) * limit;
  
  // Sorting
  const sortBy = query.sortBy || 'date';
  const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
  const sort = { [sortBy]: sortOrder };
  
  // Execute query with pagination
  const items = await Model.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate(itemType === 'lost' ? 'user' : 'finder', 'name');
  
  // Get total count for pagination
  const total = await Model.countDocuments(filter);
  
  // Calculate pagination info
  const totalPages = Math.ceil(total / limit);
  const hasMore = page < totalPages;
  
  return {
    data: items,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasMore
    }
  };
}; 