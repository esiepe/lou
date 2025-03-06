const User = require('../models/user.model');
const AppError = require('../utils/appError');
const { filterObj } = require('../utils/helpers');

/**
 * Get user by ID
 * @param {string} id - User ID
 * @returns {Promise<User>} User object
 */
exports.getUserById = async (id) => {
  const user = await User.findById(id);
  
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  return user;
};

/**
 * Update user data
 * @param {string} userId - User ID
 * @param {Object} data - Updated user data
 * @returns {Promise<User>} Updated user
 */
exports.updateUser = async (userId, data) => {
  // Filter out unwanted fields that are not allowed to be updated
  const filteredBody = filterObj(
    data,
    'name',
    'contactDetails',
    'preferences'
  );
  
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    filteredBody,
    {
      new: true,
      runValidators: true
    }
  );
  
  if (!updatedUser) {
    throw new AppError('User not found', 404);
  }
  
  return updatedUser;
};

/**
 * Delete user account
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
exports.deleteUser = async (userId) => {
  // Soft delete or anonymize user data
  const result = await User.findByIdAndUpdate(userId, {
    email: `deleted-${userId}@example.com`,
    name: 'Deleted User',
    isDeleted: true,
    $unset: { 
      contactDetails: 1,
      preferences: 1
    }
  });
  
  if (!result) {
    throw new AppError('User not found', 404);
  }
  
  // In a real implementation, you would:
  // 1. Delete or anonymize associated data
  // 2. Handle GDPR compliance
  // 3. Revoke tokens
  
  return true;
};

/**
 * Get user activity history
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Activity history
 */
exports.getUserActivity = async (userId) => {
  // Get user with populated virtual fields
  const user = await User.findById(userId)
    .populate('lostItems')
    .populate('foundItems');
    
  // Get user's claims
  const claims = await Claim.find({ claimant: userId })
    .sort('-createdAt');
    
  return {
    lostItems: user.lostItems,
    foundItems: user.foundItems,
    claims
  };
};

/**
 * Update user password
 * @param {string} userId - User ID
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<User>} Updated user
 */
exports.updatePassword = async (userId, currentPassword, newPassword) => {
  // Get user with password
  const user = await User.findById(userId).select('+password');
  
  // Check if current password is correct
  if (!(await user.isValidPassword(currentPassword))) {
    throw new AppError('Current password is incorrect', 401);
  }
  
  // Update password
  user.password = newPassword;
  await user.save();
  
  return user;
}; 