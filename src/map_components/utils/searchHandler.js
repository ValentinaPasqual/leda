// searchHandler.js
export class SearchHandler {
  constructor(searchEngine, config) {
    this.searchEngine = searchEngine;
    this.config = config;
  }

  performSearch(state, callbacks = {}) {
    if (!this.searchEngine) {
      console.error('Search engine not initialized');
      return;
    }

    const { filters } = state;
    
    // Separate filters by type to handle them differently
    const { regularFilters, dateFilters, taxonomyFilters } = this._separateFilters(filters);

    const results = this.searchEngine.search({
      query: state.query || '',
      filters: regularFilters,
      sort: state.sort || 'title_asc',
      per_page: 1000,
      filter: (item) => this._customFilter(item, dateFilters, taxonomyFilters)
    });


    // Extract coordinates for map
    const coordinates = this._extractCoordinates(results.data.items);

    // Execute callbacks
    if (callbacks.onMarkersUpdate) {
      callbacks.onMarkersUpdate(results.data.items);
    }
    
    if (callbacks.onResultsUpdate) {
      callbacks.onResultsUpdate(results.data.items);
    }
    
    if (callbacks.onAggregationsUpdate) {
      const aggregations = this._formatAggregations(results.data.aggregations);
      callbacks.onAggregationsUpdate(aggregations);
    }

    return {
      items: results.data.items,
      coordinates,
      aggregations: this._formatAggregations(results.data.aggregations)
    };
  }

  _separateFilters(filters) {
    const regularFilters = {};
    const dateFilters = {};
    const taxonomyFilters = {};

    Object.entries(filters).forEach(([key, values]) => {
      if (!values || values.length === 0) return;
      
      const config = this.config.aggregations[key];
      if (!config) return;

      switch (config.type) {
        case 'range':
          dateFilters[key] = values;
          break;
        case 'taxonomy':
          taxonomyFilters[key] = values;
          break;
        default:
          regularFilters[key] = values;
      }
    });

    return { regularFilters, dateFilters, taxonomyFilters };
  }

  _customFilter(item, dateFilters, taxonomyFilters) {
    // Check date filters
    for (const [field, range] of Object.entries(dateFilters)) {
      if (range.length === 2) {
        const [startDate, endDate] = range;
        const itemDate = new Date(item[field]).getTime();
        if (!(itemDate >= startDate && itemDate <= endDate)) {
          return false;
        }
      }
    }

    // Check taxonomy filters
    for (const [field, paths] of Object.entries(taxonomyFilters)) {
      if (!item[field]) return false;
      
      // Check if any of the selected paths match the item's taxonomy
      const itemValue = item[field];
      
      // Handle different data types for itemValue
      let itemValueStr;
      if (Array.isArray(itemValue)) {
        // If it's an array, join with comma or take first element
        itemValueStr = itemValue.length > 0 ? String(itemValue[0]) : '';
      } else if (typeof itemValue === 'string') {
        itemValueStr = itemValue;
      } else {
        // Convert to string for other types (null, undefined, objects, etc.)
        itemValueStr = String(itemValue || '');
      }
      
      const matches = paths.some(path => {
        return itemValueStr === path || itemValueStr.startsWith(path + ' > ');
      });
      
      if (!matches) return false;
    }

    return true;
  }

  _extractCoordinates(items) {
    return items
      .filter(item => item.lat_long && item.lat_long.length > 0)
      .map(item => {  
        // Get the string from the array's first element
        const coordString = item.lat_long[0];
        const [latitude, longitude] = coordString.split(",");
        return [parseFloat(latitude), parseFloat(longitude)];
      });
  }

  _formatAggregations(aggregations) {
    const formatted = {};
    for (const key in aggregations) {
      if (aggregations.hasOwnProperty(key)) {
        formatted[key] = aggregations[key].buckets;
      }
    }
    return formatted;
  }
}