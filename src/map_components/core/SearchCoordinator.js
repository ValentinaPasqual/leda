// src/map_components/core/SearchCoordinator.js

import { Utilities } from '../facets/facetsUtilities.js';

export class SearchCoordinator {
  constructor(searchHandler, config) {
    this.searchHandler = searchHandler;
    this.config = config;
    this.isLoading = false;
    
    // Create debounced search
    this.debouncedSearch = Utilities.debounce(async (state, callbacks) => {
      await this.performSearch(state, callbacks);
    }, 300);
  }

  async performSearch(state, callbacks) {
    try {
      const results = this.searchHandler.performSearch(state, {
        onMarkersUpdate: callbacks.onMarkersUpdate,
        onResultsUpdate: callbacks.onResultsUpdate,
        onAggregationsUpdate: callbacks.onAggregationsUpdate
      });

      // Calculate unique pivot_ID count
      const uniqueResultsCount = this.calculateUniqueResultsCount(results.items);
      
    if (callbacks.onNavBarUpdate) {
        callbacks.onNavBarUpdate(results.items || []);
    }
      
      console.log('Search completed:', results.items?.length || 0, 'items found');
      return results;
    } catch (error) {
      console.error('Search error:', error);
      if (callbacks.onError) {
        callbacks.onError('Search failed', 'error');
      }
    }
  }

  calculateUniqueResultsCount(items) {
    if (!items || !Array.isArray(items)) {
      return 0;
    }
    
    const uniqueResultsIds = new Set();
    
    items.forEach(item => {
      // Check different possible locations for pivot_ID
      const pivotId = item.pivot_ID || 
                    item.pivotID || 
                    item.pivot_id || 
                    item._source?.pivot_ID || 
                    item._source?.pivotID || 
                    item._source?.pivot_id ||
                    item.source?.pivot_ID ||
                    item.source?.pivotID ||
                    item.source?.pivot_id;
      
      if (pivotId !== undefined && pivotId !== null && pivotId !== '') {
        uniqueResultsIds.add(pivotId);
      }
    });
    
    return uniqueResultsIds.size;
  }

  getLoadingStatus() {
    return {
      isLoading: this.isLoading
    };
  }
}
