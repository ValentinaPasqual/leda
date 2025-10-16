// src/searchMap.js

import itemsjs from 'itemsjs';
import './styles/tailwind.css'
import { parseData } from './utils/dataParser.js';
import { loadConfiguration } from './utils/configLoader.js';

// Import nav and footer
import { UniversalNav } from './navigation/universalNav.js';
import { UniversalFooter } from './navigation/universalFooter.js';

// Import core managers
import { StateManager } from './map_components/core/StateManager.js';
import { SearchCoordinator } from './map_components/core/SearchCoordinator.js';
import { UIManager } from './map_components/core/UIManager.js';
import { FilterManager } from './map_components/core/FilterManager.js';
import { EventCoordinator } from './map_components/core/EventCoordinator.js';
import { ComponentsInitializer } from './map_components/core/ComponentsInitializer.js';

class LEDASearch {
  constructor() {
    this.config = null;
    this.searchEngine = null;
    this.universalNav = null;
    this.universalFooter = null;
    
    // Core managers
    this.stateManager = null;
    this.searchCoordinator = null;
    this.uiManager = null;
    this.filterManager = null;
    this.eventCoordinator = null;
    this.componentsInitializer = null;
    
    // Components
    this.components = {};
    
    // Flags
    this.isInitialLoad = true;
    this.isFullyLoaded = false;
    
    this.initialize();
  }

  async initialize() {
    try {
      // Initialize UI Manager first for loaders
      this.uiManager = new UIManager();
      this.uiManager.showFullScreenLoader();
      
      // Load configuration and data
      this.config = await loadConfiguration();
      const jsonData = await parseData();
      this.config.searchConfig.per_page = jsonData.length;

      // Render universal navigation
      const universalNav = new UniversalNav(this.config);
      universalNav.render();

      const universalFooter = new UniversalFooter(this.config);
      universalFooter.render();
      
      // Initialize search engine
      this.searchEngine = itemsjs(jsonData, this.config);
     
      // Initialize core managers
      this.initializeManagers();
      
      // Initialize components
      await this.initializeComponents();
      
      // Setup events
      this.setupEvents();
      
      // Perform initial search
      await this.performSearch();
      
      // Apply URL filters after initialization
      this.applyUrlFilters();
      
      // Mark as fully loaded
      this.isInitialLoad = false;
      this.isFullyLoaded = true;
      
      // Hide loader
      this.uiManager.hideFullScreenLoader();
      
    } catch (error) {
      console.error('Initialization error:', error);
      this.uiManager.showNotification('Error loading application', 'error');
      this.uiManager.hideFullScreenLoader();
    }
  }

  initializeManagers() {
    // Initialize State Manager
    this.stateManager = new StateManager(this.config);
    
    // Initialize Search Coordinator
    this.searchCoordinator = new SearchCoordinator(null, this.config); // searchHandler will be set later
    
    // Initialize Filter Manager
    this.filterManager = new FilterManager(this.stateManager, this.config);
    
    // Initialize Event Coordinator with callbacks
    this.eventCoordinator = new EventCoordinator(
      this.stateManager,
      this.config,
      {
        onSearch: () => this.searchCoordinator.debouncedSearch(
          this.stateManager.getState(),
          this.getSearchCallbacks()
        ),
        onSortChange: () => this.performSearch(),
        onClearAllFilters: () => this.clearAllFilters(),
        onRemoveFilter: (facetKey, value) => this.removeFilter(facetKey, value),
        onClearSearchQuery: () => this.clearSearchQuery()
      }
    );
  }

  async initializeComponents() {
    // Initialize Components Initializer
    this.componentsInitializer = new ComponentsInitializer(this.config, this.searchEngine);
    
    // Initialize all components
    this.components = await this.componentsInitializer.initializeComponents(
      (lat, lng, zoom) => this.focusOnMap(lat, lng, zoom)
    );
    
    // Update search coordinator with the search handler
    this.searchCoordinator.searchHandler = this.components.searchHandler;
    
    // Connect map to results
    this.componentsInitializer.connectMapToResults(
      this.components.resultsRenderer,
      this.components.setFocusResultCallback,
      (message, type) => this.uiManager.showNotification(message, type)
    );
  }

  setupEvents() {
    // Bind general events
    this.eventCoordinator.bindEvents();
    
    // Bind navbar events
    this.eventCoordinator.bindNavBarEvents(this.components.navBar);
  }

  getSearchCallbacks() {
    return {
      onMarkersUpdate: (items) => this.components.renderMarkers(items),
      onResultsUpdate: (items) => {
        this.components.resultsRenderer.updateResultsList(items, this.config, {
          filters: this.stateManager.getState().filters,
          query: this.stateManager.getState().query,
          sort: this.stateManager.getState().sort
        });
      },
      onAggregationsUpdate: (aggregations) => this.renderFacets(aggregations),
      onNavBarUpdate: (count, options) => this.updateNavBar(count, options),
      onError: (message, type) => this.uiManager.showNotification(message, type)
    };
  }

  async performSearch() {
    const state = this.stateManager.getState();
    return await this.searchCoordinator.performSearch(state, this.getSearchCallbacks());
  }

async handleStateChange(action) {
  await this.stateManager.handleStateChange(action, {
    onStateChange: async (state) => {
      window.ledaSearch.state = state;
      // Disabilita il debounce per i filtri - ricerca immediata
      const results = await this.searchCoordinator.performSearch(
        state, 
        this.getSearchCallbacks()
      );
      console.log('Filter search completed:', results.items?.length || 0, 'items found');
    }
  });
}

  renderFacets(aggregations) {
    this.components.facetRenderer.renderFacets(
      aggregations,
      this.stateManager.getState(),
      (action) => this.handleStateChange(action)
    );
  }

  updateNavBar(resultsCount = 0, options = {}) {
    this.components.navBar.updateFromSearchState(
      this.stateManager.getState(),
      resultsCount,
      options
    );
  }

focusOnMap(lat, lng, locationName) {
  if (this.components.mapInstance && this.components.mapInstance.focusOnLocation) {
    this.components.mapInstance.focusOnLocation(lat, lng, locationName);
  }
}

  applyUrlFilters() {
    this.filterManager.applyUrlFilters({
      onApplyFilters: async () => await this.performSearch(),
      onShowNotification: (filterKey, filterValue) => 
        this.uiManager.showFilterNotification(filterKey, filterValue),
      onError: (message, type) => this.uiManager.showNotification(message, type)
    });
  }

  clearAllFilters() {
    this.filterManager.clearAllFilters();
    this.performSearch();
  }

  removeFilter(facetKey, value) {
    this.filterManager.removeFilter(facetKey, value);
    this.performSearch();
  }

  clearSearchQuery() {
    this.filterManager.clearSearchQuery();
    this.performSearch();
  }

  getLoadingStatus() {
    return {
      isLoading: this.searchCoordinator.getLoadingStatus().isLoading,
      isFullyLoaded: this.isFullyLoaded,
      searchEngineReady: !!this.searchEngine,
      mapReady: !!this.components.map,
      configLoaded: !!this.config
    };
  }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  window.ledaSearch = new LEDASearch();
});