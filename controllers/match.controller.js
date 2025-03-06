const matchService = require('../services/match.service');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

/**
 * Get potential matches for a lost item
 * @route GET /api/v1/matches/lost/:lostItemId
 */
exports.getMatchesForLostItem = catchAsync(async (req, res, next) => {
  const lostItemId = req.params.lostItemId;
  
  // Verify ownership of the lost item
  const hasAccess = await matchService.verifyItemAccess(lostItemId, 'lost', req.user.id);
  
  if (!hasAccess && req.user.role !== 'admin') {
    return next(new AppError('You do not have permission to view matches for this item', 403));
  }
  
  const matches = await matchService.findMatchesForLostItem(lostItemId);
  
  res.status(200).json({
    status: 'success',
    results: matches.length,
    data: {
      matches
    }
  });
});

/**
 * Get potential matches for a found item
 * @route GET /api/v1/matches/found/:foundItemId
 */
exports.getMatchesForFoundItem = catchAsync(async (req, res, next) => {
  const foundItemId = req.params.foundItemId;
  
  // Verify ownership of the found item
  const hasAccess = await matchService.verifyItemAccess(foundItemId, 'found', req.user.id);
  
  if (!hasAccess && req.user.role !== 'admin') {
    return next(new AppError('You do not have permission to view matches for this item', 403));
  }
  
  const matches = await matchService.findMatchesForFoundItem(foundItemId);
  
  res.status(200).json({
    status: 'success',
    results: matches.length,
    data: {
      matches
    }
  });
});

/**
 * Confirm a match between lost and found items
 * @route POST /api/v1/matches/confirm
 */
exports.confirmMatch = catchAsync(async (req, res, next) => {
  const { lostItemId, foundItemId } = req.body;
  
  if (!lostItemId || !foundItemId) {
    return next(new AppError('Both lost item ID and found item ID are required', 400));
  }
  
  // Verify ownership of at least one of the items
  const hasLostAccess = await matchService.verifyItemAccess(lostItemId, 'lost', req.user.id);
  const hasFoundAccess = await matchService.verifyItemAccess(foundItemId, 'found', req.user.id);
  
  if ((!hasLostAccess && !hasFoundAccess) && req.user.role !== 'admin') {
    return next(new AppError('You do not have permission to confirm this match', 403));
  }
  
  const match = await matchService.confirmMatch(lostItemId, foundItemId);
  
  res.status(200).json({
    status: 'success',
    data: {
      match
    }
  });
});

/**
 * Remove a match
 * @route DELETE /api/v1/matches/:lostItemId/:foundItemId
 */
exports.removeMatch = catchAsync(async (req, res, next) => {
  const { lostItemId, foundItemId } = req.params;
  
  // Verify ownership of at least one of the items
  const hasLostAccess = await matchService.verifyItemAccess(lostItemId, 'lost', req.user.id);
  const hasFoundAccess = await matchService.verifyItemAccess(foundItemId, 'found', req.user.id);
  
  if ((!hasLostAccess && !hasFoundAccess) && req.user.role !== 'admin') {
    return next(new AppError('You do not have permission to remove this match', 403));
  }
  
  await matchService.removeMatch(lostItemId, foundItemId);
  
  res.status(204).json({
    status: 'success',
    data: null
  });
}); 