const express = require('express');
const matchController = require('../controllers/match.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

// All match routes are protected
router.use(protect);

router.get('/lost/:lostItemId', matchController.getMatchesForLostItem);
router.get('/found/:foundItemId', matchController.getMatchesForFoundItem);
router.post('/confirm', matchController.confirmMatch);
router.delete('/:lostItemId/:foundItemId', matchController.removeMatch);

module.exports = router; 