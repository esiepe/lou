const express = require('express');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const lostItemRoutes = require('./lostItem.routes');
const foundItemRoutes = require('./foundItem.routes');
const claimRoutes = require('./claim.routes');
const matchRoutes = require('./match.routes');

const router = express.Router();

// API health check
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API is running',
    timestamp: new Date()
  });
});

// Mount route groups
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/lost-items', lostItemRoutes);
router.use('/found-items', foundItemRoutes);
router.use('/claims', claimRoutes);
router.use('/matches', matchRoutes);

module.exports = router; 