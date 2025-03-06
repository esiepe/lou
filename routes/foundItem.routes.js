const express = require('express');
const foundItemController = require('../controllers/foundItem.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

const router = express.Router();

// Public routes
router.get('/', foundItemController.getAllFoundItems);
router.get('/search', foundItemController.searchFoundItems);
router.get('/:id', foundItemController.getFoundItem);

// Protected routes
router.use(protect);
router.post('/', foundItemController.createFoundItem);
router.patch('/:id', foundItemController.updateFoundItem);
router.delete('/:id', foundItemController.deleteFoundItem);
router.get('/user/:userId', foundItemController.getUserFoundItems);

// Admin routes
router.use(restrictTo('admin'));
router.patch('/:id/status', foundItemController.updateFoundItemStatus);

module.exports = router; 