/**
 * Navigation Bar Renderer Module
 * Handles navigation bar functionality with separated concerns
 */

import '../../styles/tailwind.css'
import { DOMUtils, EventUtils, FilterUtils, NotificationUtils, ResetUtils } from './navbarUtils.js';
import { ActiveFiltersPopupManager, LayerSelectionPopupManager, MarkersSelectionPopupManager } from './functionalitiesManager.js';

export class NavBarRenderer {
    constructor() {
        this.elements = {};
        this.state = {
            activeFiltersCount: 0,
            resultsCount: 0,
            uniqueResultsCount: 0,
            isInitialized: false
        };
        this.currentFilters = {};
        this.currentQuery = '';
        this.config = null;
        this.mapInstance = null;
        
        // Popup managers
        this.popupManagers = {
            activeFilters: null,
            layers: null,
            markers: null
        };
        
        this.init();
    }

    /**
     * Initialize the navigation bar
     */
    init() {
        this.initializeElements();
        this.initializeConfiguration();
        this.initializePanelStates();
        this.bindEventHandlers();
        this.setupResponsiveBehavior();
        this.styleClearAllButton();
        
        this.state.isInitialized = true;
    }

    /**
     * Initialize DOM elements
     */
    initializeElements() {
        this.elements = {
            filtersPanel: document.getElementById('filters-panel'),
            resultsPanel: document.getElementById('results-panel'),
            toggleFilters: document.getElementById('toggle-filters'),
            toggleResults: document.getElementById('toggle-results'),
            activeFiltersBadge: document.getElementById('active-filters-badge'),
            activeFiltersCount: document.getElementById('active-filters-count'),
            resultsCounter: document.getElementById('results-counter'),
            resultsCount: document.getElementById('results-count'),
            uniqueResultsCounter: document.getElementById('unique-results-counter'),
            uniqueResultsCount: document.getElementById('unique-results-count'),
            clearAllBtn: document.getElementById('clear-all-btn'),
            layerButton: document.getElementById('map-layer-selector'),
            markersButton: document.getElementById('map-markers-selector')
        };
    }

    /**
     * Initialize configuration and popup managers
     */
    initializeConfiguration() {
        DOMUtils.waitForGlobal('ledaSearch', (ledaSearch) => {
            this.config = ledaSearch.config;
            this.mapInstance = ledaSearch.mapInstance;
            this.initializePopupManagers();
        });
    }

    /**
     * Initialize popup managers
     */
    initializePopupManagers() {
        // Active filters popup
        this.popupManagers.activeFilters = new ActiveFiltersPopupManager(this);
        this.popupManagers.activeFilters.init();

        // Layer selection popup
        if (this.config && this.config.map && this.config.map.tileLayers) {
            this.popupManagers.layers = new LayerSelectionPopupManager(this.config.map.tileLayers);
            this.popupManagers.layers.init();
        }

        // Markers selection popup
        this.popupManagers.markers = new MarkersSelectionPopupManager(this.mapInstance);
        this.popupManagers.markers.init();
    }

    /**
     * Style the clear all button
     */
    styleClearAllButton() {
        if (this.elements.clearAllBtn) {
            this.elements.clearAllBtn.className = 'ml-2 px-3 py-1 bg-pink-100 hover:bg-pink-200 text-red-500 text-xs rounded-full hidden';
            this.elements.clearAllBtn.innerHTML = '<i class="fas fa-times mr-1"></i>Cancella tutto';
        }
    }

    /**
     * Update from search state
     */
    updateFromSearchState(searchState, resultsCount = 0, options = {}) {
        if (!searchState) return;

        this.currentFilters = { ...searchState.filters };
        this.currentQuery = searchState.query || '';

        const uniqueResultsCount = options.uniqueResultsCount || 0;
        const filtersCount = FilterUtils.calculateActiveFiltersCount(searchState.filters);
        
        this.updateActiveFiltersCount(filtersCount);
        this.updateResultsCount(resultsCount, uniqueResultsCount);
    }

    /**
     * Update active filters count display
     */
    updateActiveFiltersCount(count) {
        this.state.activeFiltersCount = count;
        this.elements.activeFiltersCount.textContent = count;
        
        if (count > 0) {
            DOMUtils.showElement(this.elements.activeFiltersBadge);
            DOMUtils.showElement(this.elements.clearAllBtn);
        } else {
            DOMUtils.hideElement(this.elements.activeFiltersBadge);
            DOMUtils.hideElement(this.elements.clearAllBtn);
        }
        
        EventUtils.emit('navbar:activeFiltersChanged', { count });
    }

    /**
     * Update results count display
     */
    updateResultsCount(count, uniqueResultsCount = 0) {
        this.state.resultsCount = count;
        this.state.uniqueResultsCount = uniqueResultsCount;

        this.elements.resultsCount.textContent = count;
        this.updateUniqueResultsDisplay(uniqueResultsCount);
        
        if (count > 0) {
            DOMUtils.showElement(this.elements.resultsCounter);
        } else {
            DOMUtils.hideElement(this.elements.resultsCounter);
        }

        if (uniqueResultsCount > 0 && this.elements.uniqueResultsCounter) {
            DOMUtils.showElement(this.elements.uniqueResultsCounter);
        } else if (this.elements.uniqueResultsCounter) {
            DOMUtils.hideElement(this.elements.uniqueResultsCounter);
        }
        
        EventUtils.emit('navbar:resultsCountChanged', { 
            totalCount: count,
            uniqueResultsCount: uniqueResultsCount 
        });
    }

    /**
     * Update unique results count display
     */
    updateUniqueResultsDisplay(uniqueResultsCount) {
        let uniqueResultsElement = document.getElementById('unique-results-count');
        
        if (!uniqueResultsElement) {
            uniqueResultsElement = document.createElement('span');
            uniqueResultsElement.id = 'unique-results-count';
            uniqueResultsElement.className = 'ml-2 text-xs text-gray-600 bg-blue-100 px-2 py-1 rounded-full';
            
            const resultsCounter = this.elements.resultsCounter;
            if (resultsCounter) {
                resultsCounter.appendChild(uniqueResultsElement);
            }
        }
        
        if (uniqueResultsCount > 0) {
            uniqueResultsElement.textContent = `${uniqueResultsCount}`;
            uniqueResultsElement.style.display = 'inline';
        } else {
            uniqueResultsElement.style.display = 'none';
        }
    }

    /**
     * Bind all event handlers
     */
    bindEventHandlers() {
        // Panel toggles
        this.elements.toggleFilters?.addEventListener('click', () => {
            this.togglePanel('filters');
        });

        this.elements.toggleResults?.addEventListener('click', () => {
            this.togglePanel('results');
        });

        // Clear all filters
        this.elements.clearAllBtn?.addEventListener('click', () => {
            this.handleClearAllFilters();
        });
    }

    /**
     * Initialize panel states (open by default)
     */
    initializePanelStates() {
        this.elements.filtersPanel?.classList.remove('panel-closed');
        this.elements.resultsPanel?.classList.remove('panel-closed-right');
        
        this.elements.toggleFilters?.classList.add('active');
        this.elements.toggleResults?.classList.add('active');
        
        this.elements.filtersPanel?.classList.add('panel-open');
        this.elements.resultsPanel?.classList.add('panel-open');
    }

    /**
     * Toggle a specific panel
     */
    togglePanel(panelType) {
        const panelConfig = this.getPanelConfig(panelType);
        if (!panelConfig) return;

        const { panel, button, closedClass } = panelConfig;
        const isCurrentlyOpen = !panel.classList.contains(closedClass);
        
        if (isCurrentlyOpen) {
            this.closePanel(panel, button, closedClass);
        } else {
            this.openPanel(panel, button, closedClass);
        }
        
        EventUtils.emit('navbar:panelToggled', { 
            type: panelType, 
            isOpen: !isCurrentlyOpen 
        });
    }

    /**
     * Get panel configuration
     */
    getPanelConfig(panelType) {
        const configs = {
            filters: {
                panel: this.elements.filtersPanel,
                button: this.elements.toggleFilters,
                closedClass: 'panel-closed'
            },
            results: {
                panel: this.elements.resultsPanel,
                button: this.elements.toggleResults,
                closedClass: 'panel-closed-right'
            }
        };
        
        return configs[panelType];
    }

    /**
     * Close a panel
     */
    closePanel(panel, button, closedClass) {
        panel?.classList.add(closedClass);
        panel?.classList.remove('panel-open');
        button?.classList.remove('active');
    }

    /**
     * Open a panel
     */
    openPanel(panel, button, closedClass) {
        panel?.classList.remove(closedClass);
        panel?.classList.add('panel-open');
        button?.classList.add('active');
    }

    /**
     * Close all panels
     */
    closeAllPanels() {
        this.closePanel(this.elements.filtersPanel, this.elements.toggleFilters, 'panel-closed');
        this.closePanel(this.elements.resultsPanel, this.elements.toggleResults, 'panel-closed-right');
    }

    /**
     * Handle clear all filters action
     */
    handleClearAllFilters() {
        // Hide popup if open
        this.popupManagers.activeFilters?.hide();
        
        // Reset local state
        this.currentFilters = {};
        this.currentQuery = '';
        
        // Update UI immediately
        this.updateActiveFiltersCount(0);
        this.updateResultsCount(0);
        
        // Emit event for external handling
        EventUtils.emit('navbar:clearAllFilters', { 
            resetInterface: true,
            clearSearch: true,
            clearFacets: true,
            clearMap: true
        });
        
        // Reset interfaces after delay
        setTimeout(() => {
            ResetUtils.resetFacetsInterface();
            ResetUtils.clearSearchInput();
        }, 100);
        
        NotificationUtils.show('Tutti i filtri sono stati rimossi', 'success', 2000);
    }

    /**
     * Setup responsive behavior
     */
    setupResponsiveBehavior() {
        window.addEventListener('resize', () => {
            if (window.innerWidth < 768) {
                this.closeAllPanels();
            }
        });

        if (window.innerWidth < 768) {
            this.closeAllPanels();
        }
    }

    /**
     * Get current state
     */
    getState() {
        return {
            ...this.state,
            isFiltersOpen: !this.elements.filtersPanel?.classList.contains('panel-closed'),
            isResultsOpen: !this.elements.resultsPanel?.classList.contains('panel-closed-right'),
            currentFilters: { ...this.currentFilters },
            currentQuery: this.currentQuery
        };
    }

    /**
     * Set state
     */
    setState(newState) {
        Object.entries(newState).forEach(([key, value]) => {
            switch (key) {
                case 'activeFiltersCount':
                    this.updateActiveFiltersCount(value);
                    break;
                case 'resultsCount':
                    this.updateResultsCount(value, newState.uniqueResultsCount);
                    break;
                case 'isFiltersOpen':
                    this.setPanelState('filters', value);
                    break;
                case 'isResultsOpen':
                    this.setPanelState('results', value);
                    break;
                case 'currentFilters':
                    this.currentFilters = { ...value };
                    break;
                case 'currentQuery':
                    this.currentQuery = value;
                    break;
                default:
                    if (this.state.hasOwnProperty(key)) {
                        this.state[key] = value;
                    }
            }
        });
    }

    /**
     * Set panel state
     */
    setPanelState(panelType, shouldBeOpen) {
        const panelConfig = this.getPanelConfig(panelType);
        if (!panelConfig) return;

        const { panel, closedClass } = panelConfig;
        const isCurrentlyOpen = !panel?.classList.contains(closedClass);
        
        if (shouldBeOpen !== isCurrentlyOpen) {
            this.togglePanel(panelType);
        }
    }

    /**
     * Event listener management
     */
    addEventListener(eventName, handler) {
        document.addEventListener(`navbar:${eventName}`, handler);
    }

    removeEventListener(eventName, handler) {
        document.removeEventListener(`navbar:${eventName}`, handler);
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info', duration = 3000) {
        NotificationUtils.show(message, type, duration);
    }

    /**
     * Reset interface completely
     */
    resetInterface() {
        this.currentFilters = {};
        this.currentQuery = '';
        this.updateActiveFiltersCount(0);
        this.updateResultsCount(0);
        this.popupManagers.activeFilters?.hide();
        this.closeAllPanels();
        ResetUtils.resetFacetsInterface();
        ResetUtils.clearSearchInput();
    }

    /**
     * Destroy and cleanup
     */
    destroy() {
        // Destroy popup managers
        Object.values(this.popupManagers).forEach(manager => {
            manager?.destroy();
        });
        
        // Clear references
        this.elements = {};
        this.currentFilters = {};
        this.currentQuery = '';
        this.config = null;
        this.mapInstance = null;
        this.popupManagers = {};
        this.state.isInitialized = false;
    }
}

// Export singleton instance
export const navBarRenderer = new NavBarRenderer();