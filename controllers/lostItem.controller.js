const itemService = require('../services/item.service');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

/**
 * Create a lost item
 * @route POST /api/v1/lost-items
 */
exports.createLostItem = catchAsync(async (req, res, next) => {
  const lostItem = await itemService.createLostItem(req.body, req.files, req.user.id);
  
  res.status(201).json({
    status: 'success',
    data: {
      lostItem
    }
  });
});

/**
 * Get all lost items
 * @route GET /api/v1/lost-items
 */
exports.getAllLostItems = catchAsync(async (req, res, next) => {
  const result = await itemService.searchItems(req.query, 'lost');
  
  res.status(200).json({
    status: 'success',
    results: result.data.length,
    data: {
      lostItems: result.data,
      pagination: result.pagination
    }
  });
});

/**
 * Get lost item by ID
 * @route GET /api/v1/lost-items/:id
 */
exports.getLostItem = catchAsync(async (req, res, next) => {
  const lostItem = await itemService.getItemById(req.params.id, 'lost');
  
  if (!lostItem) {
    return next(new AppError('Lost item not found', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      lostItem
    }
  });
});

/**
 * Update lost item
 * @route PATCH /api/v1/lost-items/:id
 */
exports.updateLostItem = catchAsync(async (req, res, next) => {
  const updatedItem = await itemService.updateItem(req.params.id, 'lost', req.body, req.user.id);
  
  res.status(200).json({
    status: 'success',
    data: {
      lostItem: updatedItem
    }
  });
});

/**
 * Delete lost item
 * @route DELETE /api/v1/lost-items/:id
 */
exports.deleteLostItem = catchAsync(async (req, res, next) => {
  await itemService.deleteItem(req.params.id, 'lost', req.user.id);
  
  res.status(204).json({
    status: 'success',
    data: null
  });
});

/**
 * Search lost items
 * @route GET /api/v1/lost-items/search
 */
exports.searchLostItems = catchAsync(async (req, res, next) => {
  const result = await itemService.searchItems(req.query, 'lost');
  
  res.status(200).json({
    status: 'success',
    results: result.data.length,
    data: {
      lostItems: result.data,
      pagination: result.pagination
    }
  });
});

/**
 * Get user's lost items
 * @route GET /api/v1/lost-items/user/:userId
 */
exports.getUserLostItems = catchAsync(async (req, res, next) => {
  // Check if user is requesting their own items or is an admin
  const userId = req.params.userId;
  if (userId !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You do not have permission to access these items', 403));
  }
  
  const result = await itemService.getUserItems(userId, 'lost', req.query);
  
  res.status(200).json({
    status: 'success',
    results: result.data.length,
    data: {
      lostItems: result.data,
      pagination: result.pagination
    }
  });
});

/**
 * Update lost item status (admin only)
 * @route PATCH /api/v1/lost-items/:id/status
 */
exports.updateLostItemStatus = catchAsync(async (req, res, next) => {
  const { status } = req.body;
  
  if (!status) {
    return next(new AppError('Status is required', 400));
  }
  
  const updatedItem = await itemService.updateItemStatus(req.params.id, 'lost', status);
  
  res.status(200).json({
    status: 'success',
    data: {
      lostItem: updatedItem
    }
  });
}); 