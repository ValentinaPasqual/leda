// src/map_components/core/FilterManager.js

export class FilterManager {
  constructor(stateManager, config) {
    this.stateManager = stateManager;
    this.config = config;
  }

  applyUrlFilters(callbacks) {
    const urlParams = new URLSearchParams(window.location.search);
    const filterKey = urlParams.get('filter');
    const filterValue = urlParams.get('value');
    
    console.log('Checking URL parameters:', { filterKey, filterValue });
    
    if (filterKey && filterValue) {
      console.log(`Applying URL filter: ${filterKey} = ${filterValue}`);
      
      if (this.config.aggregations && this.config.aggregations[filterKey]) {
        const facetConfig = this.config.aggregations[filterKey];
        let processedValue = filterValue;
        
        // Se è un range, converti la stringa in array [min, max]
        if (facetConfig.type === 'range') {
          const parts = filterValue.includes('-') 
            ? filterValue.split('-').map(v => parseInt(v.trim(), 10))
            : filterValue.split(',').map(v => parseInt(v.trim(), 10));
          
          if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            processedValue = parts;
          } else {
            console.error(`Invalid range format: ${filterValue}`);
            return;
          }
        }
        
        const state = this.stateManager.getState();
        
        // Applica il filtro direttamente allo stato
        if (facetConfig.type === 'range') {
          state.filters[filterKey] = processedValue;
        } else {
          if (!state.filters[filterKey]) {
            state.filters[filterKey] = [];
          }
          if (!state.filters[filterKey].includes(processedValue)) {
            state.filters[filterKey].push(processedValue);
          }
        }
        
        this.stateManager.setState(state);
        
        console.log('State filters after URL application:', state.filters);
        
        // Esegui la ricerca
        setTimeout(async () => {
          if (callbacks.onApplyFilters) {
            await callbacks.onApplyFilters();
          }
          
          console.log(`Filter applied and search completed: ${filterKey} = ${filterValue}`);
          
          if (callbacks.onShowNotification) {
            callbacks.onShowNotification(filterKey, filterValue);
          }
        }, 1500);
      } else {
        console.warn(`Filter key '${filterKey}' not found in configuration`);
        if (callbacks.onError) {
          callbacks.onError(`Filtro '${filterKey}' non trovato`, 'warning');
        }
      }
    }
  }

  clearAllFilters() {
    const state = this.stateManager.getState();
    state.query = '';
    state.filters = this.stateManager.createEmptyFilters();
    this.stateManager.setState(state);
    
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';
  }

  removeFilter(facetKey, value) {
    const state = this.stateManager.getState();
    
    if (!state.filters[facetKey]) return;
    
    if (value) {
      state.filters[facetKey] = state.filters[facetKey].filter(v => v !== value);
    } else {
      state.filters[facetKey] = [];
    }
    
    this.stateManager.setState(state);
  }

  clearSearchQuery() {
    const state = this.stateManager.getState();
    state.query = '';
    this.stateManager.setState(state);
    
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';
  }
}
