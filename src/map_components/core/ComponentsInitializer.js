// src/map_components/core/ComponentsInitializer.js

import { initMap } from '../map/initMap.js';
import { navBarRenderer } from '../navbar/navbarRenderer.js';
import { FacetRenderer } from '../facets/facetRenderer.js';
import { RangeRenderer } from '../facets/rangeRenderer.js';
import { TaxonomyRenderer } from '../facets/taxonomyRenderer.js';
import { SearchHandler } from '../utils/searchHandler.js';
import { ResultsRenderer } from '../references/resultsRenderer.js';

export class ComponentsInitializer {
  constructor(config, searchEngine) {
    this.config = config;
    this.searchEngine = searchEngine;
    this.components = {};
  }

  async initializeComponents(focusOnMapCallback) {
    // Initialize map
    const mapResult = initMap(this.config);
    this.components.map = mapResult.map;
    this.components.markers = mapResult.markers;
    this.components.renderMarkers = mapResult.renderMarkers;
    this.components.setFocusResultCallback = mapResult.setFocusResultCallback;
    this.components.mapInstance = mapResult;
    
    // Make map instance globally accessible for navigation bar
    if (!window.ledaSearch) {
      window.ledaSearch = {};
    }
    window.ledaSearch.config = this.config;
    window.ledaSearch.mapInstance = this.components.mapInstance;
    
    // Make the switchMarkerType function globally accessible
    window.switchMarkerType = (markerType) => {
      if (this.components.mapInstance && this.components.mapInstance.switchMarkerType) {
        this.components.mapInstance.switchMarkerType(markerType);
      }
    };

    // Initialize modules
    this.components.facetRenderer = new FacetRenderer(this.config);
    this.components.rangeRenderer = new RangeRenderer();
    this.components.taxonomyRenderer = new TaxonomyRenderer();
    this.components.searchHandler = new SearchHandler(this.searchEngine, this.config);
    this.components.resultsRenderer = new ResultsRenderer((lat, lng, locationName) => {
  if (this.components.mapInstance && this.components.mapInstance.focusOnLocation) {
    this.components.mapInstance.focusOnLocation(lat, lng, locationName);
  }
});
    
    // Setup map navbar 
    this.components.navBar = navBarRenderer;
    
    return this.components;
  }

  connectMapToResults(resultsRenderer, setFocusResultCallback, notificationCallback) {
    if (setFocusResultCallback) {
      setFocusResultCallback((idOpera) => {
        const success = resultsRenderer.focusOnResult(idOpera);
        if (!success && notificationCallback) {
          notificationCallback('Item not found in current results', 'warning');
        }
        return success;
      });
    }
  }

  getComponents() {
    return this.components;
  }
}
