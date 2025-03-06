/**
 * Calculate similarity score between a lost item and found item
 * @param {Object} lostItem - Lost item object
 * @param {Object} foundItem - Found item object
 * @returns {number} Similarity score between 0 and 1
 */
exports.calculateSimilarity = (lostItem, foundItem) => {
  // Initialize weightage for different attributes
  const weights = {
    category: 0.2,
    title: 0.1,
    description: 0.2,
    color: 0.15,
    date: 0.15,
    location: 0.2
  };
  
  let totalScore = 0;
  
  // Category match (exact match)
  if (lostItem.category === foundItem.category) {
    totalScore += weights.category;
  }
  
  // Title similarity (using word overlap)
  if (lostItem.title && foundItem.title) {
    const lostWords = new Set(lostItem.title.toLowerCase().split(/\s+/));
    const foundWords = foundItem.title.toLowerCase().split(/\s+/);
    
    let matchCount = 0;
    for (const word of foundWords) {
      if (lostWords.has(word)) matchCount++;
    }
    
    const titleScore = foundWords.length > 0 ? 
      matchCount / Math.max(foundWords.length, lostWords.size) : 0;
    
    totalScore += weights.title * titleScore;
  }
  
  // Description similarity (using word overlap)
  if (lostItem.description && foundItem.description) {
    const lostWords = new Set(lostItem.description.toLowerCase().split(/\s+/));
    const foundWords = foundItem.description.toLowerCase().split(/\s+/);
    
    let matchCount = 0;
    for (const word of foundWords) {
      if (lostWords.has(word)) matchCount++;
    }
    
    const descriptionScore = foundWords.length > 0 ? 
      matchCount / Math.max(foundWords.length, lostWords.size) * 0.7 : 0;
    
    totalScore += weights.description * descriptionScore;
  }
  
  // Color match
  if (lostItem.color && foundItem.color) {
    const colorScore = lostItem.color === foundItem.color ? 1 : 0;
    totalScore += weights.color * colorScore;
  }
  
  // Date proximity
  if (lostItem.date && foundItem.date) {
    const lostDate = new Date(lostItem.date);
    const foundDate = new Date(foundItem.date);
    
    // Calculate difference in days
    const diffTime = Math.abs(foundDate - lostDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Score decreases as days difference increases (up to 7 days)
    const dateScore = Math.max(0, 1 - diffDays / 7);
    
    totalScore += weights.date * dateScore;
  }
  
  // Location proximity
  if (
    lostItem.location && 
    foundItem.location && 
    lostItem.location.coordinates && 
    foundItem.location.coordinates
  ) {
    // Calculate distance between coordinates (in kilometers)
    const distance = this.calculateDistance(
      lostItem.location.coordinates[1], // lat
      lostItem.location.coordinates[0], // lng
      foundItem.location.coordinates[1], // lat
      foundItem.location.coordinates[0]  // lng
    );
    
    // Score decreases as distance increases (up to 5km)
    const locationScore = Math.max(0, 1 - distance / 5);
    
    totalScore += weights.location * locationScore;
  } else if (
    lostItem.locationName && 
    foundItem.locationName && 
    lostItem.locationName.toLowerCase() === foundItem.locationName.toLowerCase()
  ) {
    // If coordinates aren't available but location names match
    totalScore += weights.location * 0.7;
  }
  
  return totalScore;
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
exports.calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in km
  const dLat = this.deg2rad(lat2 - lat1);
  const dLon = this.deg2rad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in km
  
  return distance;
};

/**
 * Convert degrees to radians
 * @param {number} deg - Degrees
 * @returns {number} Radians
 */
exports.deg2rad = (deg) => {
  return deg * (Math.PI/180);
}; 