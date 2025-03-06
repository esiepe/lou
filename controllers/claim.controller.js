const claimService = require('../services/claim.service');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

/**
 * Create a claim
 * @route POST /api/v1/claims
 */
exports.createClaim = catchAsync(async (req, res, next) => {
  const claim = await claimService.createClaim(req.body, req.files, req.user.id);
  
  res.status(201).json({
    status: 'success',
    data: {
      claim
    }
  });
});

/**
 * Get all claims (admin only)
 * @route GET /api/v1/claims
 */
exports.getAllClaims = catchAsync(async (req, res, next) => {
  const result = await claimService.getAllClaims(req.query);
  
  res.status(200).json({
    status: 'success',
    results: result.data.length,
    data: {
      claims: result.data,
      pagination: result.pagination
    }
  });
});

/**
 * Get claim by ID
 * @route GET /api/v1/claims/:id
 */
exports.getClaim = catchAsync(async (req, res, next) => {
  const claim = await claimService.getClaimById(req.params.id);
  
  // Check if user has permission to view this claim
  if (
    claim.claimant.toString() !== req.user.id && 
    req.user.role !== 'admin'
  ) {
    // Check if user owns the item being claimed
    const isItemOwner = await claimService.isItemOwner(claim, req.user.id);
    if (!isItemOwner) {
      return next(new AppError('You do not have permission to view this claim', 403));
    }
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      claim
    }
  });
});

/**
 * Get user's claims
 * @route GET /api/v1/claims/my-claims
 */
exports.getMyClaims = catchAsync(async (req, res, next) => {
  const result = await claimService.getUserClaims(req.user.id, req.query);
  
  res.status(200).json({
    status: 'success',
    results: result.data.length,
    data: {
      claims: result.data,
      pagination: result.pagination
    }
  });
});

/**
 * Add a message to a claim
 * @route POST /api/v1/claims/:id/messages
 */
exports.addMessage = catchAsync(async (req, res, next) => {
  const { message } = req.body;
  
  if (!message) {
    return next(new AppError('Message is required', 400));
  }
  
  const updatedClaim = await claimService.addMessage(
    req.params.id,
    req.user.id,
    message
  );
  
  res.status(200).json({
    status: 'success',
    data: {
      claim: updatedClaim
    }
  });
});

/**
 * Cancel a claim
 * @route PATCH /api/v1/claims/:id/cancel
 */
exports.cancelClaim = catchAsync(async (req, res, next) => {
  const claim = await claimService.getClaimById(req.params.id);
  
  // Check if user is the claimant
  if (claim.claimant.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You do not have permission to cancel this claim', 403));
  }
  
  const updatedClaim = await claimService.updateClaimStatus(req.params.id, 'cancelled');
  
  res.status(200).json({
    status: 'success',
    data: {
      claim: updatedClaim
    }
  });
});

/**
 * Review a claim (item owner)
 * @route PATCH /api/v1/claims/:id/review
 */
exports.reviewClaim = catchAsync(async (req, res, next) => {
  const { status, note } = req.body;
  
  if (!status || !['approved', 'rejected'].includes(status)) {
    return next(new AppError('Valid status (approved/rejected) is required', 400));
  }
  
  const claim = await claimService.getClaimById(req.params.id);
  
  // Check if user is the item owner
  const isItemOwner = await claimService.isItemOwner(claim, req.user.id);
  if (!isItemOwner && req.user.role !== 'admin') {
    return next(new AppError('You do not have permission to review this claim', 403));
  }
  
  const updatedClaim = await claimService.reviewClaim(req.params.id, status, note, req.user.id);
  
  res.status(200).json({
    status: 'success',
    data: {
      claim: updatedClaim
    }
  });
});

/**
 * Provide feedback on a completed claim
 * @route POST /api/v1/claims/:id/provide-feedback
 */
exports.provideFeedback = catchAsync(async (req, res, next) => {
  const { rating, comment } = req.body;
  
  if (!rating || rating < 1 || rating > 5) {
    return next(new AppError('Rating (1-5) is required', 400));
  }
  
  const claim = await claimService.getClaimById(req.params.id);
  
  // Check if user is the claimant or item owner
  if (
    claim.claimant.toString() !== req.user.id && 
    !(await claimService.isItemOwner(claim, req.user.id)) &&
    req.user.role !== 'admin'
  ) {
    return next(new AppError('You do not have permission to provide feedback', 403));
  }
  
  // Check if claim is completed
  if (claim.status !== 'completed') {
    return next(new AppError('Feedback can only be provided for completed claims', 400));
  }
  
  const updatedClaim = await claimService.addFeedback(req.params.id, rating, comment);
  
  res.status(200).json({
    status: 'success',
    data: {
      claim: updatedClaim
    }
  });
});

/**
 * Update claim status (admin only)
 * @route PATCH /api/v1/claims/:id/status
 */
exports.updateClaimStatus = catchAsync(async (req, res, next) => {
  const { status } = req.body;
  
  if (!status) {
    return next(new AppError('Status is required', 400));
  }
  
  const updatedClaim = await claimService.updateClaimStatus(req.params.id, status);
  
  res.status(200).json({
    status: 'success',
    data: {
      claim: updatedClaim
    }
  });
});

/**
 * Delete a claim (admin only)
 * @route DELETE /api/v1/claims/:id
 */
exports.deleteClaim = catchAsync(async (req, res, next) => {
  await claimService.deleteClaim(req.params.id);
  
  res.status(204).json({
    status: 'success',
    data: null
  });
}); 