/**
 * Collection of general helper functions for the application
 */

/**
 * Parse query parameters for pagination, sorting, and filtering
 * @param {Object} queryParams - Request query parameters
 * @returns {Object} Parsed query options
 */
exports.parseQueryOptions = (queryParams) => {
  // Pagination
  const page = parseInt(queryParams.page, 10) || 1;
  const limit = parseInt(queryParams.limit, 10) || 20;
  const skip = (page - 1) * limit;
  
  // Sorting
  let sort = {};
  if (queryParams.sort) {
    const sortFields = queryParams.sort.split(',');
    sortFields.forEach(field => {
      if (field.startsWith('-')) {
        sort[field.substring(1)] = -1;
      } else {
        sort[field] = 1;
      }
    });
  } else {
    // Default sort by creation date, newest first
    sort = { createdAt: -1 };
  }
  
  // Filtering
  const filter = { ...queryParams };
  const excludedFields = ['page', 'sort', 'limit', 'fields'];
  excludedFields.forEach(field => delete filter[field]);
  
  // Advanced filtering
  let filterStr = JSON.stringify(filter);
  filterStr = filterStr.replace(/\b(gt|gte|lt|lte|eq|ne)\b/g, match => `$${match}`);
  const parsedFilter = JSON.parse(filterStr);
  
  return {
    filter: parsedFilter,
    sort,
    skip,
    limit,
    page
  };
};

/**
 * Generate a random string of specified length
 * @param {number} length - Length of string to generate
 * @returns {string} Random string
 */
exports.generateRandomString = (length = 10) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const charactersLength = characters.length;
  
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  
  return result;
};

/**
 * Remove sensitive fields from user object
 * @param {Object} user - User object
 * @returns {Object} Sanitized user object
 */
exports.sanitizeUser = (user) => {
  const sanitizedUser = { ...user };
  
  // Remove sensitive fields
  const sensitiveFields = [
    'password',
    'passwordResetToken',
    'passwordResetExpires',
    'emailVerificationToken',
    'emailVerificationExpires'
  ];
  
  sensitiveFields.forEach(field => {
    if (sanitizedUser[field]) delete sanitizedUser[field];
  });
  
  return sanitizedUser;
};

/**
 * Format date to YYYY-MM-DD
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
exports.formatDate = (date) => {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

/**
 * Format error message for validation errors
 * @param {Object} error - Mongoose validation error
 * @returns {string} Formatted error message
 */
exports.formatValidationError = (error) => {
  const errors = Object.values(error.errors).map(err => err.message);
  return errors.join('. ');
}; 