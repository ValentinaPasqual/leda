// src/map_components/core/EventCoordinator.js

export class EventCoordinator {
  constructor(stateManager, config, callbacks) {
    this.stateManager = stateManager;
    this.config = config;
    this.callbacks = callbacks;
  }

  bindEvents() {
    this.setupSearchInput();
    this.setupSortSelect();
  }

  bindNavBarEvents(navBar) {
    navBar.addEventListener('clearAllFilters', () => {
      if (this.callbacks.onClearAllFilters) {
        this.callbacks.onClearAllFilters();
      }
    });
    
    navBar.addEventListener('removeFilter', (event) => {
      const { facetKey, value } = event.detail;
      if (this.callbacks.onRemoveFilter) {
        this.callbacks.onRemoveFilter(facetKey, value);
      }
    });
    
    navBar.addEventListener('clearSearchQuery', () => {
      if (this.callbacks.onClearSearchQuery) {
        this.callbacks.onClearSearchQuery();
      }
    });
  }

  setupSearchInput() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        const state = this.stateManager.getState();
        state.query = searchInput.value;
        this.stateManager.setState(state);
        
        if (this.callbacks.onSearch) {
          this.callbacks.onSearch();
        }
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
        const state = this.stateManager.getState();
        state.sort = e.target.value;
        this.stateManager.setState(state);
        
        if (this.callbacks.onSortChange) {
          this.callbacks.onSortChange();
        }
      });
    }
  }
}
