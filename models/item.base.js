// Base schema for both lost and found items
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const itemBaseSchema = new Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'electronics', 'clothing', 'jewelry', 'documents', 
      'accessories', 'pets', 'keys', 'bags', 'other'
    ]
  },
  subCategory: String,
  date: {
    type: Date,
    required: [true, 'Date is required']
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: [true, 'Coordinates are required']
    },
    address: {
      type: String,
      required: [true, 'Address is required']
    },
    landmark: String
  },
  photos: [{
    url: String,
    publicId: String, // For cloud storage reference
    caption: String
  }],
  status: {
    type: String,
    required: true
  },
  features: [{
    name: String,
    value: String
  }],
  reportedAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date
}, {
  discriminatorKey: 'itemType',
  timestamps: true
});

// Geospatial index for location-based queries
itemBaseSchema.index({ location: '2dsphere' });
// Index for category and status for filtering
itemBaseSchema.index({ category: 1, status: 1 });
// Compound index for date and status (common query pattern)
itemBaseSchema.index({ date: -1, status: 1 });

module.exports = itemBaseSchema; 