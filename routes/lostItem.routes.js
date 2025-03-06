const express = require('express');
const lostItemController = require('../controllers/lostItem.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

const router = express.Router();

// Public routes
router.get('/', lostItemController.getAllLostItems);
router.get('/search', lostItemController.searchLostItems);
router.get('/:id', lostItemController.getLostItem);

// Protected routes
router.use(protect);
router.post('/', lostItemController.createLostItem);
router.patch('/:id', lostItemController.updateLostItem);
router.delete('/:id', lostItemController.deleteLostItem);
router.get('/user/:userId', lostItemController.getUserLostItems);

// Admin routes
router.use(restrictTo('admin'));
router.patch('/:id/status', lostItemController.updateLostItemStatus);

module.exports = router; 