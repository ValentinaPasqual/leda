import itemsjs from 'itemsjs';
import './styles/tailwind.css'
import { parseData } from './utils/dataParser.js';
import { loadConfiguration } from './utils/configLoader.js';
import { initMap } from './utils/initMap.js';
import { navBarRenderer } from './utils/navBarRenderer.js';

// Import the modules for facets Handling
import { FacetRenderer } from './utils/facetRenderer.js';
import { RangeRenderer } from './utils/rangeRenderer.js';
import { TaxonomyRenderer } from './utils/taxonomyRenderer.js';
import { SearchHandler } from './utils/searchHandler.js';
import { ResultsRenderer } from './utils/resultsRenderer.js';
import { Utilities } from './utils/facetsUtilities.js';

// Import nav and footer
import { UniversalNav } from './navigation/universalNav.js';
import { UniversalFooter } from './navigation/universalFooter.js';

class LEDASearch {
  constructor() {
    this.config = null;
    this.searchEngine = null;
    this.universalNav = null;
    this.universalFooter = null;
    this.state = {
      query: '',
      filters: {},
      sort: '',
      bounds: null,
    };

    this.isLoading = false;
    this.isInitialLoad = true; // Track if this is the first load
    this.isFullyLoaded = false; // Track if app is fully initialized
    this.initialize();
  }

  async initialize() {
    try {
      this.showFullScreenLoader();
      // Removed showProgressLoader() call
      
      // Load configuration and data
      this.config = await loadConfiguration();
      const jsonData = await parseData();
      this.config.searchConfig.per_page = jsonData.length;

      const universalNav = new UniversalNav(this.config);
      universalNav.render();

      const universalFooter = new UniversalFooter(this.config);
      universalFooter.render();
      
      // Initialize search engine
      this.searchEngine = itemsjs(jsonData, this.config);
      this.state.sort = this.config.searchConfig.defaultSort;
      this.state.filters = this.createEmptyFilters();
      
      // Initialize map and components
      await this.initializeComponents();
      
      // Setup event handlers
      this.bindEvents();
      this.bindNavBarEvents();
      
      // Perform initial search and load polygons
      await this.performSearch();
      
      // NUOVO: Applica filtri dall'URL dopo l'inizializzazione
      this.applyUrlFilters();
      
      // Mark initial load as complete
      this.isInitialLoad = false;
      this.isFullyLoaded = true;
      
      // Everything is loaded - hide all loaders
      // Removed hideProgressLoader() call
      this.hideFullScreenLoader();
      
    } catch (error) {
      console.error('Initialization error:', error);
      this.showNotification('Error loading application', 'error');
      // Removed hideProgressLoader() call
      this.hideFullScreenLoader();
    }
  }

  // NUOVO: Metodo per applicare filtri dall'URL
  applyUrlFilters() {
    const urlParams = new URLSearchParams(window.location.search);
    const filterKey = urlParams.get('filter');
    const filterValue = urlParams.get('value');
    
    console.log('Checking URL parameters:', { filterKey, filterValue });
    
    if (filterKey && filterValue) {
      console.log(`Applying URL filter: ${filterKey} = ${filterValue}`);
      
      // Verifica che il filtro esista nella configurazione
      if (this.config.aggregations && this.config.aggregations[filterKey]) {
        // Applica il filtro
        setTimeout(() => {
          this.handleStateChange({
            type: 'FACET_CHANGE',
            facetType: filterKey,
            value: filterValue,
            checked: true
          });
          
          console.log(`Filter applied: ${filterKey} = ${filterValue}`);
          this.showFilterNotification(filterKey, filterValue);
          
          // Opzionale: rimuovi i parametri dall'URL
          // window.history.replaceState({}, document.title, window.location.pathname);
        }, 1500); // Delay per assicurarsi che tutto sia inizializzato
      } else {
        console.warn(`Filter key '${filterKey}' not found in configuration`);
        this.showNotification(`Filtro '${filterKey}' non trovato`, 'warning');
      }
    }
  }

  // NUOVO: Metodo per mostrare notifica filtro applicato
  showFilterNotification(filterKey, filterValue) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300';
    notification.style.transform = 'translateX(100%)';
    notification.innerHTML = `
      <div class="flex items-center space-x-3">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
        </svg>
        <span>Filtro applicato: <strong>${filterKey}</strong> = "${filterValue}"</span>
        <button onclick="this.parentElement.parentElement.remove()" class="ml-2 text-white hover:text-gray-200">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animazione di entrata
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto-rimozione dopo 5 secondi
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentElement) {
          notification.parentElement.removeChild(notification);
        }
      }, 300);
    }, 5000);
  }

  createEmptyFilters() {
    const filters = {};
    for (const [field] of Object.entries(this.config.aggregations)) {
      filters[field] = [];
    }
    return filters;
  }

  async initializeComponents() {
    // Initialize map
    const mapResult = initMap(this.config); // Pass config directly since window.ledaSearch may not exist yet
    this.map = mapResult.map;
    this.markers = mapResult.markers;
    this.renderMarkers = mapResult.renderMarkers;
    this.setFocusResultCallback = mapResult.setFocusResultCallback;
    
    // CRITICAL: Store map instance for navigation bar access
    this.mapInstance = mapResult; // Store the entire map result object
    
    // Make map instance globally accessible for navigation bar
    if (!window.ledaSearch) {
      window.ledaSearch = {};
    }
    window.ledaSearch.config = this.config;
    window.ledaSearch.mapInstance = this.mapInstance;
    
    // Also make the switchMarkerType function globally accessible
    window.switchMarkerType = (markerType) => {
      if (this.mapInstance && this.mapInstance.switchMarkerType) {
        this.mapInstance.switchMarkerType(markerType);
      }
    };

    // Initialize polygon manager - polygons will be shown after initial load
    // this.polygonManager = new PolygonManager(this.map);
    // await this.polygonManager.loadPolygonRepository();

    // Initialize modules
    this.facetRenderer = new FacetRenderer(this.config);
    this.rangeRenderer = new RangeRenderer();
    this.taxonomyRenderer = new TaxonomyRenderer();
    this.searchHandler = new SearchHandler(this.searchEngine, this.config);
    this.resultsRenderer = new ResultsRenderer((lat, lng, zoom) => this.focusOnMap(lat, lng, zoom));
    
    // Setup navbar - this will now have access to the map instance
    this.navBar = navBarRenderer;
    
    // Connect map to results
    this.connectMapToResults();
    
    // Create debounced search without progress loader handling
    this.debouncedSearch = Utilities.debounce(async () => {
      await this.performSearch();
    }, 300);
  }

  connectMapToResults() {
    if (this.setFocusResultCallback) {
      this.setFocusResultCallback((idOpera) => {
        const success = this.resultsRenderer.focusOnResult(idOpera);
        if (!success) {
          this.showNotification('Item not found in current results', 'warning');
        }
        return success;
      });
    }
  }

  // Full screen loader for initial load
  showFullScreenLoader() {
    if (!this.fullScreenLoader) {
      this.fullScreenLoader = document.createElement('div');
      this.fullScreenLoader.className = 'fixed inset-0 z-[9999] bg-white flex items-center justify-center';
      this.fullScreenLoader.innerHTML = `
        <div class="text-center">
          <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <h2 class="text-xl font-semibold text-gray-700 mb-2">Loading LEDA Search</h2>
          <p class="text-gray-500">Initializing map, data, and components...</p>
        </div>
      `;
      document.body.appendChild(this.fullScreenLoader);
    }
    this.fullScreenLoader.style.display = 'flex';
  }

  hideFullScreenLoader() {
    if (this.fullScreenLoader) {
      this.fullScreenLoader.style.opacity = '0';
      this.fullScreenLoader.style.transition = 'opacity 0.3s ease-out';
      setTimeout(() => {
        if (this.fullScreenLoader) {
          this.fullScreenLoader.style.display = 'none';
        }
      }, 300);
    }
  }

  // Simplified notification system
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-3 rounded-lg shadow-lg max-w-sm text-white transition-all duration-300 ${
      type === 'error' ? 'bg-red-500' : type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
    }`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => notification.remove(), 300);
    }, 300);
  }

  // Main search method
  async performSearch() {
    // Removed all progress loader related code
    
    try {
      const results = this.searchHandler.performSearch(this.state, {
        onMarkersUpdate: (items) => this.renderMarkers(items),
        onResultsUpdate: (items) => this.resultsRenderer.updateResultsList(items, this.config, {
          filters: this.state.filters,
          query: this.state.query,
          sort: this.state.sort
        }),
        onAggregationsUpdate: (aggregations) => this.renderFacets(aggregations)
      });

    // Calculate unique pivot_ID count
    const uniqueResultsCount = this.calculateUniqueResultsCount(results.items);
    
    // Update navbar with both counts
    this.updateNavBar(results.items?.length || 0, { 
    uniqueResultsCount: uniqueResultsCount 
    });
      
      console.log('Search completed:', results.items?.length || 0, 'items found');
      return results;
    } catch (error) {
      console.error('Search error:', error);
      this.showNotification('Search failed', 'error');
    }
    // Removed finally block with hideProgressLoader()
  }

  // Helper method to calculate unique pivot_ID count
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

  // State management
  async handleStateChange(action) {
    console.log('handleStateChange called with action:', action);
        
    try {
      switch (action.type) {
        case 'FACET_CHANGE':
          this.updateFilters(action.facetType, action.value, action.checked);
          break;
        case 'RANGE_CHANGE':
          this.state.filters[action.facetKey] = action.value;
          break;
        case 'QUERY_CHANGE':
          this.state.query = action.query;
          break;
        case 'SORT_CHANGE':
          this.state.sort = action.sort;
          break;
      }
      
      console.log('State updated, triggering search. New state:', this.state);
      
      // Force a new search by bypassing the loading check
      this.isLoading = false;
      
      const results = this.searchHandler.performSearch(this.state, {
        onMarkersUpdate: (items) => this.renderMarkers(items),
        onResultsUpdate: (items) => this.resultsRenderer.updateResultsList(items, this.config, {
          filters: this.state.filters,
          query: this.state.query,
          sort: this.state.sort
        }),
        onAggregationsUpdate: (aggregations) => this.renderFacets(aggregations)
      });

    // Calculate unique pivot_ID count - FIX: Calculate it here
      const uniqueResultsCount = this.calculateUniqueResultsCount(results.items);
      
      // Update navbar with both counts - FIX: Use the calculated value
      this.updateNavBar(results.items?.length || 0, { 
        uniqueResultsCount: uniqueResultsCount 
      });
      
      console.log('Filter search completed:', results.items?.length || 0, 'items found');
      
    } catch (error) {
      console.error('Error in handleStateChange:', error);
    }
    // Removed finally block with hideProgressLoader()
  }

  // Check if any filters are currently active
  hasActiveFilters() {
    if (!this.state.filters) return false;
    
    for (const [key, values] of Object.entries(this.state.filters)) {
      if (Array.isArray(values) && values.length > 0) {
        return true;
      }
      if (!Array.isArray(values) && values) {
        return true;
      }
    }
    return false;
  }

  updateFilters(facetType, value, checked) {
    console.log(`Updating filter: ${facetType}, value: ${value}, checked: ${checked}`);
    
    if (checked) {
      if (!this.state.filters[facetType]) {
        this.state.filters[facetType] = [];
      }
      this.state.filters[facetType].push(value);
    } else {
      this.state.filters[facetType] = 
        this.state.filters[facetType]?.filter(v => v !== value) || [];
    }
    
    console.log('Updated filters:', this.state.filters);
  }

  // Event binding
  bindEvents() {
    this.setupSearchInput();
    this.setupSortSelect();
    this.setupMapEvents();
  }

  bindNavBarEvents() {
    this.navBar.addEventListener('clearAllFilters', () => this.clearAllFilters());
    this.navBar.addEventListener('removeFilter', (event) => {
      const { facetKey, value } = event.detail;
      this.removeFilter(facetKey, value);
    });
    this.navBar.addEventListener('clearSearchQuery', () => this.clearSearchQuery());
  }

  setupSearchInput() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        this.state.query = searchInput.value;
        // Removed progress loader call
        this.debouncedSearch();
      });
    }
  }

  setupSortSelect() {
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect && this.config.searchConfig.sortOptions) {
      sortSelect.innerHTML = this.config.searchConfig.sortOptions
        .map(option => `<option value="${option.value}">${option.label}</option>`)
        .join('');
      
      sortSelect.addEventListener('change', (e) => {
        this.state.sort = e.target.value;
        // Removed progress loader calls
        this.performSearch();
      });
    }
  }

  setupMapEvents() {
    // Debounced map move handler
    const debouncedMapMove = Utilities.debounce(async () => {
      // Removed progress loader calls
      await this.performSearch();
    }, 500);
    
    this.map.on('moveend', debouncedMapMove);
  }

  // Utility methods
  focusOnMap(lat, lng, zoom = 15) {
    if (this.map) {
      this.map.setView([parseFloat(lat), parseFloat(lng)], zoom);
    }
  }

  renderFacets(aggregations) {
    this.facetRenderer.renderFacets(aggregations, this.state, (action) => this.handleStateChange(action));
  }

  updateNavBar(resultsCount = 0, options = {}) {
      this.navBar.updateFromSearchState(this.state, resultsCount, options);
  }
  // Filter management
  clearAllFilters() {
    this.state.query = '';
    this.state.filters = this.createEmptyFilters();
    
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';
    
    // Removed progress loader calls
    this.performSearch();
  }

  removeFilter(facetKey, value) {
    if (!this.state.filters[facetKey]) return;
    
    if (value) {
      this.state.filters[facetKey] = this.state.filters[facetKey].filter(v => v !== value);
    } else {
      this.state.filters[facetKey] = [];
    }
    
    // Removed progress loader calls
    this.performSearch();
  }

  clearSearchQuery() {
    this.state.query = '';
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';
    
    // Removed progress loader calls
    this.performSearch();
  }

  getLoadingStatus() {
    return {
      isLoading: this.isLoading,
      isFullyLoaded: this.isFullyLoaded,
      searchEngineReady: !!this.searchEngine,
      mapReady: !!this.map,
      configLoaded: !!this.config
    };
  }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  window.ledaSearch = new LEDASearch();
});