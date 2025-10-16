// facetsUtilities.js
export class Utilities {
  
  /**
   * Debounce function to limit the frequency of function calls
   * @param {Function} func - The function to debounce
   * @param {number} delay - The delay in milliseconds
   * @returns {Function} - The debounced function
   */
  static debounce(func, delay) {
    let timer;
    return function () {
      clearTimeout(timer);  
      timer = setTimeout(() => func.apply(this, arguments), delay);
    };
  }

  /**
   * Extract coordinates from lat_long string
   * @param {string} coordString - Comma-separated lat,lng string
   * @returns {Object} - Object with lat and lng properties
   */
  static parseCoordinates(coordString) {
    if (!coordString || typeof coordString !== 'string') {
      return { lat: null, lng: null };
    }
    
    const parts = coordString.split(',');
    if (parts.length === 2) {
      return {
        lat: parseFloat(parts[0].trim()),
        lng: parseFloat(parts[1].trim())
      };
    }
    
    return { lat: null, lng: null };
  }

  /**
   * Safely encode text for HTML attributes
   * @param {string} text - Text to encode
   * @returns {string} - Encoded text
   */
  static encodeForAttribute(text) {
    return encodeURIComponent(text || '');
  }

  /**
   * Create a unique ID for DOM elements
   * @param {string} prefix - Prefix for the ID
   * @returns {string} - Unique ID
   */
  static createUniqueId(prefix = 'element') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if a value is empty (null, undefined, empty string, or empty array)
   * @param {*} value - Value to check
   * @returns {boolean} - True if empty
   */
  static isEmpty(value) {
    if (value == null) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  }
}