const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Base Item schema for both lost and found items
const itemSchema = new Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['electronics', 'clothing', 'documents', 'accessories', 'pets', 'other']
  },
  date: {
    type: Date,
    required: [true, 'Date is required']
  },
  locationName: {
    type: String,
    required: [true, 'Location name is required'],
    trim: true
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
    }
  },
  color: {
    type: String,
    trim: true
  },
  brand: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['reported', 'claimed', 'returned', 'matched', 'closed'],
    default: 'reported'
  },
  images: [{
    url: String,
    publicId: String
  }],
  itemType: {
    type: String,
    required: true,
    enum: ['lost', 'found']
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  discriminatorKey: 'itemType'
});

// Index for geospatial queries
itemSchema.index({ location: '2dsphere' });
// Index for common queries
itemSchema.index({ category: 1, status: 1 });
itemSchema.index({ date: 1 });

const Item = mongoose.model('Item', itemSchema);

module.exports = Item; 