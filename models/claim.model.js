const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const claimSchema = new Schema({
  claimant: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  item: {
    type: Schema.Types.ObjectId,
    refPath: 'itemType',
    required: true
  },
  itemType: {
    type: String,
    required: true,
    enum: ['LostItem', 'FoundItem']
  },
  evidence: [{
    type: {
      type: String,
      enum: ['description', 'photo', 'receipt', 'serial', 'other'],
      required: true
    },
    description: {
      type: String,
      required: true
    },
    fileUrl: String,
    publicId: String
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed', 'cancelled'],
    default: 'pending'
  },
  verificationNotes: [{
    note: String,
    by: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    date: {
      type: Date,
      default: Date.now
    }
  }],
  resolutionDetails: {
    method: {
      type: String,
      enum: ['in-person', 'shipping', 'authority', 'other']
    },
    date: Date,
    location: String,
    notes: String
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    date: Date
  },
  communication: [{
    from: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    message: String,
    date: {
      type: Date,
      default: Date.now
    },
    read: {
      type: Boolean,
      default: false
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date
}, {
  timestamps: true
});

// Indexes for performance
claimSchema.index({ claimant: 1, item: 1 }, { unique: true });
claimSchema.index({ item: 1, status: 1 });
claimSchema.index({ claimant: 1, status: 1 });
claimSchema.index({ createdAt: -1 });

const Claim = mongoose.model('Claim', claimSchema);

module.exports = Claim; 