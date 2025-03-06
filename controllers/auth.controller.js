const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { sendEmail } = require('../services/email.service');
const { redisClient } = require('../services/redis.service');

// Helper function to create and sign JWT token
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

// Helper function to create response with token
const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);
  const refreshToken = crypto.randomBytes(32).toString('hex');
  
  // Store refresh token in Redis with user ID
  redisClient.set(refreshToken, user._id.toString(), 'EX', 60 * 60 * 24 * 30); // 30 days
  
  // Remove password from output
  user.password = undefined;
  
  res.status(statusCode).json({
    status: 'success',
    token,
    refreshToken,
    expiresIn: process.env.JWT_EXPIRES_IN,
    data: {
      user
    }
  });
};

/**
 * Register a new user
 * @route POST /api/v1/auth/register
 */
exports.register = catchAsync(async (req, res, next) => {
  // Create verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const verificationTokenHash = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
    
  // Create new user
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    emailVerificationToken: verificationTokenHash,
    emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
  });
  
  // Send verification email
  try {
    await sendEmail({
      email: newUser.email,
      subject: 'Verify your email address',
      message: `Please verify your email by clicking on this link: ${process.env.FRONTEND_URL}/verify-email/${verificationToken}`,
      html: `<p>Please verify your email by clicking on this link: <a href="${process.env.FRONTEND_URL}/verify-email/${verificationToken}">Verify Email</a></p>`
    });
    
    res.status(201).json({
      status: 'success',
      message: 'User registered. Please check your email to verify your account.'
    });
  } catch (err) {
    // If email fails, still create user but update verification token
    newUser.emailVerificationToken = undefined;
    newUser.emailVerificationExpires = undefined;
    await newUser.save({ validateBeforeSave: false });
    
    return next(new AppError('Error sending verification email. Please try again.', 500));
  }
});

/**
 * Login user
 * @route POST /api/v1/auth/login
 */
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  
  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }
  
  // 2) Check if user exists && password is correct
  const user = await User.findOne({ email }).select('+password');
  
  if (!user || !(await user.isValidPassword(password))) {
    // Increment login attempts and possibly lock account
    if (user) {
      user.loginAttempts += 1;
      if (user.loginAttempts >= 5) {
        user.lockUntil = Date.now() + 15 * 60 * 1000; // 15 minutes lock
      }
      await user.save();
    }
    return next(new AppError('Incorrect email or password', 401));
  }
  
  // 3) Check if account is locked
  if (user.lockUntil && user.lockUntil > Date.now()) {
    return next(new AppError('Account is temporarily locked. Please try again later.', 401));
  }
  
  // 4) Reset login attempts on successful login
  user.loginAttempts = 0;
  user.lockUntil = undefined;
  await user.save();
  
  // 5) Send token to client
  createSendToken(user, 200, req, res);
});

/**
 * Logout user - invalidate refresh token
 * @route POST /api/v1/auth/logout
 */
exports.logout = catchAsync(async (req, res, next) => {
  const { refreshToken } = req.body;
  
  if (refreshToken) {
    // Delete refresh token from Redis
    await redisClient.del(refreshToken);
  }
  
  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully'
  });
});

/**
 * Refresh access token
 * @route POST /api/v1/auth/refresh-token
 */
exports.refreshToken = catchAsync(async (req, res, next) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return next(new AppError('No refresh token provided', 400));
  }
  
  // Get user ID from Redis using refresh token
  const userId = await redisClient.get(refreshToken);
  
  if (!userId) {
    return next(new AppError('Invalid or expired refresh token', 401));
  }
  
  // Find user
  const user = await User.findById(userId);
  
  if (!user) {
    return next(new AppError('The user belonging to this token no longer exists', 401));
  }
  
  // Create new access token
  const token = signToken(user._id);
  
  res.status(200).json({
    status: 'success',
    token,
    expiresIn: process.env.JWT_EXPIRES_IN
  });
});

/**
 * Initiate forgot password process
 * @route POST /api/v1/auth/forgot-password
 */
exports.forgotPassword = catchAsync(async (req, res, next) => {
  // Get user by email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with that email address.', 404));
  }
  
  // Generate random reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
    
  user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  
  await user.save({ validateBeforeSave: false });
  
  // Send token to user's email
  try {
    await sendEmail({
      email: user.email,
      subject: 'Password Reset Request',
      message: `You requested a password reset. Please click on the link to reset your password: ${process.env.FRONTEND_URL}/reset-password/${resetToken}\nIf you didn't request this, please ignore this email.`,
      html: `<p>You requested a password reset. Please click on the link to reset your password:</p><p><a href="${process.env.FRONTEND_URL}/reset-password/${resetToken}">Reset Password</a></p><p>If you didn't request this, please ignore this email.</p>`
    });
    
    res.status(200).json({
      status: 'success',
      message: 'Password reset email sent!'
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    
    return next(new AppError('Error sending password reset email. Please try again.', 500));
  }
});

/**
 * Reset password with token
 * @route PATCH /api/v1/auth/reset-password/:token
 */
exports.resetPassword = catchAsync(async (req, res, next) => {
  // Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
    
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });
  
  // If token has expired or no user found
  if (!user) {
    return next(new AppError('Password reset token is invalid or has expired', 400));
  }
  
  // Update password
  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  
  await user.save();
  
  // Log the user in, send JWT
  createSendToken(user, 200, req, res);
});

/**
 * Verify email with token
 * @route GET /api/v1/auth/verify-email/:token
 */
exports.verifyEmail = catchAsync(async (req, res, next) => {
  // Get hashed token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
    
  // Find user with verification token
  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() }
  });
  
  // If no user found or token expired
  if (!user) {
    return next(new AppError('Email verification token is invalid or has expired', 400));
  }
  
  // Mark email as verified
  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  
  await user.save({ validateBeforeSave: false });
  
  // Log the user in, send JWT
  createSendToken(user, 200, req, res);
});

/**
 * Update password when logged in
 * @route PATCH /api/v1/auth/update-password
 */
exports.updatePassword = catchAsync(async (req, res, next) => {
  // Get user from database
  const user = await User.findById(req.user.id).select('+password');
  
  // Check if current password is correct
  if (!(await user.isValidPassword(req.body.currentPassword))) {
    return next(new AppError('Your current password is incorrect', 401));
  }
  
  // Update password
  user.password = req.body.newPassword;
  await user.save();
  
  // Log user in, send JWT
  createSendToken(user, 200, req, res);
});

// Additional auth controller methods (forgot password, reset password, etc.)
// ... 