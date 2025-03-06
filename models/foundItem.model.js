const mongoose = require('mongoose');
const Item = require('./item.model');

// Additional fields specific to found items
const foundItemSchema = new mongoose.Schema({
  finder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Finder (User ID) is required for found items']
  },
  currentHolder: {
    type: String,
    enum: ['finder', 'authority', 'organization', 'owner'],
    default: 'finder'
  },
  holderDetails: {
    name: String,
    contactInfo: String,
    location: String
  },
  isMatched: {
    type: Boolean,
    default: false
  },
  matchedWith: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LostItem'
  }],
  handoverRequirement: {
    identificationType: {
      type: String,
      enum: ['description', 'photo', 'receipt', 'serial', 'other']
    },
    identificationDetails: String
  },
  status: {
    type: String,
    enum: ['reported', 'matched', 'claimed', 'returned', 'unclaimed'],
    default: 'reported'
  },
  storedLocation: {
    type: String,
    trim: true
  }
}, {
  // DO NOT include the timestamps option here!
  // Only include other options that are allowed
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create a discriminator for FoundItem
const FoundItem = Item.discriminator('FoundItem', foundItemSchema);

module.exports = FoundItem; 