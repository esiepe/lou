const itemService = require('../services/item.service');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

/**
 * Create a found item
 * @route POST /api/v1/found-items
 */
exports.createFoundItem = catchAsync(async (req, res, next) => {
  const foundItem = await itemService.createFoundItem(req.body, req.files, req.user.id);
  
  res.status(201).json({
    status: 'success',
    data: {
      foundItem
    }
  });
});

/**
 * Get all found items
 * @route GET /api/v1/found-items
 */
exports.getAllFoundItems = catchAsync(async (req, res, next) => {
  const result = await itemService.searchItems(req.query, 'found');
  
  res.status(200).json({
    status: 'success',
    results: result.data.length,
    data: {
      foundItems: result.data,
      pagination: result.pagination
    }
  });
});

/**
 * Get found item by ID
 * @route GET /api/v1/found-items/:id
 */
exports.getFoundItem = catchAsync(async (req, res, next) => {
  const foundItem = await itemService.getItemById(req.params.id, 'found');
  
  if (!foundItem) {
    return next(new AppError('Found item not found', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      foundItem
    }
  });
});

/**
 * Update found item
 * @route PATCH /api/v1/found-items/:id
 */
exports.updateFoundItem = catchAsync(async (req, res, next) => {
  const updatedItem = await itemService.updateItem(req.params.id, 'found', req.body, req.user.id);
  
  res.status(200).json({
    status: 'success',
    data: {
      foundItem: updatedItem
    }
  });
});

/**
 * Delete found item
 * @route DELETE /api/v1/found-items/:id
 */
exports.deleteFoundItem = catchAsync(async (req, res, next) => {
  await itemService.deleteItem(req.params.id, 'found', req.user.id);
  
  res.status(204).json({
    status: 'success',
    data: null
  });
});

/**
 * Search found items
 * @route GET /api/v1/found-items/search
 */
exports.searchFoundItems = catchAsync(async (req, res, next) => {
  const result = await itemService.searchItems(req.query, 'found');
  
  res.status(200).json({
    status: 'success',
    results: result.data.length,
    data: {
      foundItems: result.data,
      pagination: result.pagination
    }
  });
});

/**
 * Get user's found items
 * @route GET /api/v1/found-items/user/:userId
 */
exports.getUserFoundItems = catchAsync(async (req, res, next) => {
  // Check if user is requesting their own items or is an admin
  const userId = req.params.userId;
  if (userId !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You do not have permission to access these items', 403));
  }
  
  const result = await itemService.getUserItems(userId, 'found', req.query);
  
  res.status(200).json({
    status: 'success',
    results: result.data.length,
    data: {
      foundItems: result.data,
      pagination: result.pagination
    }
  });
});

/**
 * Update found item status (admin only)
 * @route PATCH /api/v1/found-items/:id/status
 */
exports.updateFoundItemStatus = catchAsync(async (req, res, next) => {
  const { status } = req.body;
  
  if (!status) {
    return next(new AppError('Status is required', 400));
  }
  
  const updatedItem = await itemService.updateItemStatus(req.params.id, 'found', status);
  
  res.status(200).json({
    status: 'success',
    data: {
      foundItem: updatedItem
    }
  });
}); 