const mongoose = require('mongoose');
const Item = require('./item.model');

// Additional fields specific to lost items
const lostItemSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required for lost items']
  },
  reward: {
    amount: Number,
    currency: {
      type: String,
      default: 'USD'
    },
    description: String
  },
  possibleLocations: [{
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: [Number],
    address: String,
    probability: Number // User's confidence level
  }],
  timeLastSeen: Date,
  isMatched: {
    type: Boolean,
    default: false
  },
  matchedWith: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FoundItem'
  }],
  status: {
    type: String,
    enum: ['reported', 'matched', 'claimed', 'resolved', 'cancelled'],
    default: 'reported'
  }
}, {
  // DO NOT include the timestamps option here!
  // Only include other options that are allowed
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create a discriminator for LostItem
const LostItem = Item.discriminator('LostItem', lostItemSchema);

module.exports = LostItem; 