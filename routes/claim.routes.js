const express = require('express');
const claimController = require('../controllers/claim.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

const router = express.Router();

// All claim routes are protected
router.use(protect);

// User routes
router.post('/', claimController.createClaim);
router.get('/my-claims', claimController.getMyClaims);
router.get('/:id', claimController.getClaim);
router.post('/:id/messages', claimController.addMessage);
router.patch('/:id/cancel', claimController.cancelClaim);
router.post('/:id/provide-feedback', claimController.provideFeedback);

// Item owner routes
router.patch('/:id/review', claimController.reviewClaim);

// Admin routes
router.use(restrictTo('admin'));
router.get('/', claimController.getAllClaims);
router.patch('/:id/status', claimController.updateClaimStatus);
router.delete('/:id', claimController.deleteClaim);

module.exports = router; 