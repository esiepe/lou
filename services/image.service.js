const cloudinary = require('cloudinary').v2;
const { createLogger } = require('../utils/logger');
const AppError = require('../utils/appError');

const logger = createLogger(module);

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload an image to cloud storage
 * @param {Object} file - File object
 * @param {string} folder - Folder name (optional)
 * @returns {Promise<Object>} Uploaded image details
 */
exports.uploadImage = async (file, folder = 'lost-and-found') => {
  try {
    // Convert file buffer to base64 string
    const fileStr = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    
    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(fileStr, {
      folder,
      resource_type: 'auto',
      allowed_formats: ['jpg', 'png', 'jpeg', 'gif'],
      transformation: [
        { width: 1000, crop: 'limit' },
        { quality: 'auto:good' }
      ]
    });
    
    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      format: result.format,
      width: result.width,
      height: result.height,
      created_at: result.created_at
    };
  } catch (error) {
    logger.error(`Image upload error: ${error.message}`);
    throw new AppError('Error uploading image. Please try again.', 500);
  }
};

/**
 * Delete an image from cloud storage
 * @param {string} publicId - Image public ID
 * @returns {Promise<Object>} Deletion result
 */
exports.deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    logger.error(`Image deletion error: ${error.message}`);
    throw new AppError('Error deleting image. Please try again.', 500);
  }
};

/**
 * Upload multiple images
 * @param {Array} files - Array of file objects
 * @param {string} folder - Folder name (optional)
 * @returns {Promise<Array>} Array of uploaded image details
 */
exports.uploadMultipleImages = async (files, folder = 'lost-and-found') => {
  try {
    const promises = files.map(file => this.uploadImage(file, folder));
    return await Promise.all(promises);
  } catch (error) {
    logger.error(`Multiple image upload error: ${error.message}`);
    throw new AppError('Error uploading images. Please try again.', 500);
  }
}; 