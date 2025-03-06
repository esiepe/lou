const User = require('../models/user.model');
const Claim = require('../models/claim.model');
const userService = require('../services/user.service');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

/**
 * Get current user
 * @route GET /api/v1/users/me
 */
exports.getMe = catchAsync(async (req, res, next) => {
  const user = await userService.getUserById(req.user.id);
  
  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  });
});

/**
 * Update current user
 * @route PATCH /api/v1/users/me
 */
exports.updateMe = catchAsync(async (req, res, next) => {
  const updatedUser = await userService.updateUser(req.user.id, req.body);
  
  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });
});

/**
 * Delete current user
 * @route DELETE /api/v1/users/me
 */
exports.deleteMe = catchAsync(async (req, res, next) => {
  await userService.deleteUser(req.user.id);
  
  res.status(204).json({
    status: 'success',
    data: null
  });
});

/**
 * Get user activity history
 * @route GET /api/v1/users/me/activity
 */
exports.getMyActivity = catchAsync(async (req, res, next) => {
  const activity = await userService.getUserActivity(req.user.id);
  
  res.status(200).json({
    status: 'success',
    data: activity
  });
});

/**
 * Get all users (admin only)
 * @route GET /api/v1/users
 */
exports.getAllUsers = catchAsync(async (req, res, next) => {
  // Parse query parameters
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  
  // Get users with pagination
  const users = await User.find()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
  
  // Get total count
  const total = await User.countDocuments();
  
  res.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      users,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      }
    }
  });
});

/**
 * Get user by ID (admin only)
 * @route GET /api/v1/users/:id
 */
exports.getUser = catchAsync(async (req, res, next) => {
  const user = await userService.getUserById(req.params.id);
  
  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  });
});

/**
 * Update user (admin only)
 * @route PATCH /api/v1/users/:id
 */
exports.updateUser = catchAsync(async (req, res, next) => {
  const updatedUser = await userService.updateUser(req.params.id, req.body);
  
  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });
});

/**
 * Delete user (admin only)
 * @route DELETE /api/v1/users/:id
 */
exports.deleteUser = catchAsync(async (req, res, next) => {
  await userService.deleteUser(req.params.id);
  
  res.status(204).json({
    status: 'success',
    data: null
  });
}); 