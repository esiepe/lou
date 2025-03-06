const Claim = require('../models/claim.model');
const LostItem = require('../models/lostItem.model');
const FoundItem = require('../models/foundItem.model');
const User = require('../models/user.model');
const AppError = require('../utils/appError');
const { uploadImage } = require('./image.service');
const { sendEmail } = require('./email.service');

/**
 * Create a new claim
 * @param {Object} claimData - Claim data
 * @param {Array} files - Evidence files
 * @param {string} userId - User ID
 * @returns {Promise<Claim>} Created claim
 */
exports.createClaim = async (claimData, files, userId) => {
  // Validate item exists
  const itemType = claimData.itemType;
  const itemId = claimData.item;
  
  if (!itemType || !itemId) {
    throw new AppError('Item type and ID are required', 400);
  }
  
  const Model = itemType === 'LostItem' ? LostItem : FoundItem;
  const item = await Model.findById(itemId);
  
  if (!item) {
    throw new AppError('Item not found', 404);
  }
  
  // Check if user already has a claim for this item
  const existingClaim = await Claim.findOne({
    claimant: userId,
    item: itemId,
    itemType
  });
  
  if (existingClaim) {
    throw new AppError('You already have a claim for this item', 400);
  }
  
  // Process evidence files
  const evidence = [];
  if (claimData.evidence) {
    for (const evidenceItem of claimData.evidence) {
      evidence.push({
        type: evidenceItem.type,
        description: evidenceItem.description
      });
    }
  }
  
  // Process and upload files
  if (files && files.length > 0) {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const result = await uploadImage(file);
      
      if (evidence[i]) {
        evidence[i].fileUrl = result.secure_url;
        evidence[i].publicId = result.public_id;
      } else {
        evidence.push({
          type: 'photo',
          description: `Photo evidence ${i + 1}`,
          fileUrl: result.secure_url,
          publicId: result.public_id
        });
      }
    }
  }
  
  // Create claim
  const claim = await Claim.create({
    claimant: userId,
    item: itemId,
    itemType,
    evidence,
    status: 'pending',
    createdAt: new Date()
  });
  
  // Notify item owner
  if (itemType === 'FoundItem') {
    const owner = await User.findById(item.finder);
    
    if (owner && owner.preferences?.notifications?.email) {
      sendEmail({
        email: owner.email,
        subject: 'New claim for your found item',
        message: `A user has claimed your found item "${item.title}". Please check your account to review their claim.`
      });
    }
  }
  
  return claim;
};

/**
 * Get all claims (admin)
 * @param {Object} query - Query parameters
 * @returns {Promise<Object>} Claims and pagination info
 */
exports.getAllClaims = async (query) => {
  // Parse query parameters
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 20;
  const skip = (page - 1) * limit;
  
  // Filter
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.itemType) filter.itemType = query.itemType;
  
  // Execute query with pagination
  const claims = await Claim.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('claimant', 'name email')
    .populate({ 
      path: 'item',
      select: 'title category status',
      populate: {
        path: itemType === 'LostItem' ? 'user' : 'finder',
        select: 'name email'
      }
    });
  
  // Get total count
  const total = await Claim.countDocuments(filter);
  
  return {
    data: claims,
    pagination: {
      total,
      page,
      totalPages: Math.ceil(total / limit),
      limit
    }
  };
};

/**
 * Get claim by ID
 * @param {string} claimId - Claim ID
 * @returns {Promise<Claim>} Claim
 */
exports.getClaimById = async (claimId) => {
  const claim = await Claim.findById(claimId)
    .populate('claimant', 'name email')
    .populate({ 
      path: 'item',
      populate: {
        path: 'user finder',
        select: 'name email'
      }
    });
  
  if (!claim) {
    throw new AppError('Claim not found', 404);
  }
  
  return claim;
};

/**
 * Get user's claims
 * @param {string} userId - User ID
 * @param {Object} query - Query parameters
 * @returns {Promise<Object>} Claims and pagination info
 */
exports.getUserClaims = async (userId, query) => {
  // Parse query parameters
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 20;
  const skip = (page - 1) * limit;
  
  // Filter
  const filter = { claimant: userId };
  if (query.status) filter.status = query.status;
  if (query.itemType) filter.itemType = query.itemType;
  
  // Execute query with pagination
  const claims = await Claim.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate({ 
      path: 'item',
      select: 'title category status location date photos'
    });
  
  // Get total count
  const total = await Claim.countDocuments(filter);
  
  return {
    data: claims,
    pagination: {
      total,
      page,
      totalPages: Math.ceil(total / limit),
      limit
    }
  };
};

/**
 * Check if user is owner of the claimed item
 * @param {Claim} claim - Claim object
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} Whether user is item owner
 */
exports.isItemOwner = async (claim, userId) => {
  if (!claim) return false;
  
  const itemType = claim.itemType;
  const itemId = claim.item;
  
  const Model = itemType === 'LostItem' ? LostItem : FoundItem;
  const userField = itemType === 'LostItem' ? 'user' : 'finder';
  
  const item = await Model.findById(itemId);
  if (!item) return false;
  
  return item[userField].toString() === userId;
};

/**
 * Add message to claim
 * @param {string} claimId - Claim ID
 * @param {string} userId - User ID
 * @param {string} message - Message content
 * @returns {Promise<Claim>} Updated claim
 */
exports.addMessage = async (claimId, userId, message) => {
  const claim = await this.getClaimById(claimId);
  
  // Check if user has access to this claim
  if (
    claim.claimant.toString() !== userId && 
    !(await this.isItemOwner(claim, userId)) &&
    !(await User.findById(userId)).role === 'admin'
  ) {
    throw new AppError('You do not have permission to message on this claim', 403);
  }
  
  // Add message
  claim.communication.push({
    from: userId,
    message,
    date: new Date(),
    read: false
  });
  
  claim.updatedAt = new Date();
  await claim.save();
  
  // Notify other party
  let recipientId;
  
  if (claim.claimant.toString() === userId) {
    // Message is from claimant, notify item owner
    const itemType = claim.itemType;
    const itemId = claim.item;
    
    const Model = itemType === 'LostItem' ? LostItem : FoundItem;
    const userField = itemType === 'LostItem' ? 'user' : 'finder';
    
    const item = await Model.findById(itemId);
    if (item) {
      recipientId = item[userField];
    }
  } else {
    // Message is from item owner, notify claimant
    recipientId = claim.claimant;
  }
  
  if (recipientId) {
    const recipient = await User.findById(recipientId);
    
    if (recipient && recipient.preferences?.notifications?.email) {
      const sender = await User.findById(userId);
      sendEmail({
        email: recipient.email,
        subject: 'New message on your claim',
        message: `${sender.name} has sent you a new message regarding a claim. Please check your account to view and respond.`
      });
    }
  }
  
  return claim;
};

/**
 * Review claim (approve/reject)
 * @param {string} claimId - Claim ID
 * @param {string} status - 'approved' or 'rejected'
 * @param {string} note - Review note
 * @param {string} userId - User ID
 * @returns {Promise<Claim>} Updated claim
 */
exports.reviewClaim = async (claimId, status, note, userId) => {
  const claim = await this.getClaimById(claimId);
  
  // Validate status
  if (!['approved', 'rejected'].includes(status)) {
    throw new AppError('Status must be either approved or rejected', 400);
  }
  
  // Add verification note
  claim.verificationNotes.push({
    note: note || (status === 'approved' ? 'Claim approved' : 'Claim rejected'),
    by: userId,
    date: new Date()
  });
  
  // Update status
  claim.status = status;
  claim.updatedAt = new Date();
  await claim.save();
  
  // If approved, update item status
  if (status === 'approved') {
    const itemType = claim.itemType;
    const itemId = claim.item;
    
    const Model = itemType === 'LostItem' ? LostItem : FoundItem;
    const newStatus = itemType === 'LostItem' ? 'claimed' : 'claimed';
    
    const item = await Model.findById(itemId);
    if (item) {
      item.status = newStatus;
      await item.save();
    }
  }
  
  // Notify claimant
  const claimant = await User.findById(claim.claimant);
  
  if (claimant && claimant.preferences?.notifications?.email) {
    sendEmail({
      email: claimant.email,
      subject: `Your claim has been ${status}`,
      message: `Your claim has been ${status}. ${note || ''}. Please check your account for details on next steps.`
    });
  }
  
  return claim;
};

/**
 * Update claim status
 * @param {string} claimId - Claim ID
 * @param {string} status - New status
 * @returns {Promise<Claim>} Updated claim
 */
exports.updateClaimStatus = async (claimId, status) => {
  const claim = await this.getClaimById(claimId);
  
  // Validate status
  const validStatuses = ['pending', 'approved', 'rejected', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    throw new AppError(`Status must be one of: ${validStatuses.join(', ')}`, 400);
  }
  
  // Update status
  claim.status = status;
  claim.updatedAt = new Date();
  await claim.save();
  
  // If status is completed, update item status
  if (status === 'completed') {
    const itemType = claim.itemType;
    const itemId = claim.item;
    
    const Model = itemType === 'LostItem' ? LostItem : FoundItem;
    const newStatus = itemType === 'LostItem' ? 'resolved' : 'returned';
    
    const item = await Model.findById(itemId);
    if (item) {
      item.status = newStatus;
      await item.save();
    }
  }
  
  return claim;
};

/**
 * Add feedback to a claim
 * @param {string} claimId - Claim ID
 * @param {number} rating - Rating (1-5)
 * @param {string} comment - Feedback comment
 * @returns {Promise<Claim>} Updated claim
 */
exports.addFeedback = async (claimId, rating, comment) => {
  const claim = await this.getClaimById(claimId);
  
  // Validate rating
  if (rating < 1 || rating > 5) {
    throw new AppError('Rating must be between 1 and 5', 400);
  }
  
  // Add feedback
  claim.feedback = {
    rating,
    comment,
    date: new Date()
  };
  
  claim.updatedAt = new Date();
  await claim.save();
  
  return claim;
};

/**
 * Delete a claim
 * @param {string} claimId - Claim ID
 * @returns {Promise<void>}
 */
exports.deleteClaim = async (claimId) => {
  const result = await Claim.findByIdAndDelete(claimId);
  
  if (!result) {
    throw new AppError('Claim not found', 404);
  }
}; 