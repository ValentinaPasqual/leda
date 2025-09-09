/**
 * Navigation Bar Renderer Module
 * Handles all navigation bar functionality including panel toggles, 
 * active filters display, results counter, map legend, and filter popup
 */

import '../styles/tailwind.css'

export class NavBarRenderer {
    constructor() {
        this.elements = {};
        this.activeFiltersCount = 0;
        this.resultsCount = 0;
        this.uniqueResultsCount = 0
        this.isInitialized = false;
        this.currentFilters = {};
        this.currentQuery = '';
        this.config = null;
        this.mapInstance = null; // Store reference to map instance
        
        // Initialize elements after DOM is ready
        this.init();
    }

    /**
     * Initialize the navigation bar and bind all event handlers
     */
    init() {
        // Get all DOM elements
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
            markersButton: document.getElementById('map-markers-selector'),
            // toggleLegendBtn: document.getElementById('toggle-legend-btn'),
            // mapLegend: document.getElementById('map-legend'),
            // closeLegendBtn: document.getElementById('close-legend-btn')
        };


        const waitForLedaSearch = (callback, timeout = 10000) => {
            const start = Date.now();
            const check = setInterval(() => {
                if (window.ledaSearch) {
                    callback(window.ledaSearch);
                    clearInterval(check);
                } else if (Date.now() - start > timeout) {
                    console.warn('Timeout waiting for ledaSearch');
                    clearInterval(check);
                }
            }, 100); // Check every 100ms for faster response
        };

        // Initialize buttons which are customised via the config file
        waitForLedaSearch((ledaSearch) => {
            this.config = ledaSearch.config
            this.mapInstance = ledaSearch.mapInstance; // Store map instance reference
            // Initialize the Tile Layers via its related button
            this.initializeLayerButton(this.config);
        });

        this.initializeMarkersSelector();

        // Bind event handlers
        this.bindEventHandlers();
        
        // Initialize panels as closed for better mobile experience
        this.initializePanelStates();
        
        // Handle responsive behavior
        this.setupResponsiveBehavior();
        
        // Style the clear all button as red and position it properly
        this.styleClearAllButton();
        
        this.isInitialized = true;

    }

    /**
     * Style the clear all button to be red and positioned next to active filters badge
     */
    styleClearAllButton() {
        if (this.elements.clearAllBtn) {
            // Add red styling classes
            this.elements.clearAllBtn.className = 'ml-2 px-3 py-1 bg-pink-100 hover:bg-pink-200 text-red-500 text-xs rounded-full hidden';
            this.elements.clearAllBtn.innerHTML = '<i class="fas fa-times mr-1"></i>Cancella tutto';
        }
    }

    /**
     * Update the navigation bar with current search state
     * @param {Object} searchState - Current search state from main application
     * @param {number} resultsCount - Number of search results
     * @param {Object} options - Update options including skipAnimation
     */
    updateFromSearchState(searchState, resultsCount = 0, options = {}) {
        if (!searchState) return;

        // Store current state
        this.currentFilters = { ...searchState.filters };
        this.currentQuery = searchState.query || '';

        // Extract unique results count from options
        const uniqueResultsCount = options.uniqueResultsCount || 0;

        console.log('hhihiihhi', uniqueResultsCount)

        // Calculate active filters count
        const filtersCount = this.calculateActiveFiltersCount(searchState.filters);
        
        // Update displays
        this.updateActiveFiltersCount(filtersCount);
        this.updateResultsCount(resultsCount, uniqueResultsCount);

        console.log(uniqueResultsCount)
    }

    /**
     * Calculate the total number of active filters
     * @param {Object} filters - Current filters object
     * @returns {number} Total count of active filters
     */
    calculateActiveFiltersCount(filters) {
        if (!filters || typeof filters !== 'object') return 0;
        
        let count = 0;
        Object.values(filters).forEach(filterValues => {
            if (Array.isArray(filterValues)) {
                // For range filters stored as [min, max], count as 1
                // For standard facets stored as array of values, count each value
                if (filterValues.length === 2 && 
                    typeof filterValues[0] === 'number' && 
                    typeof filterValues[1] === 'number') {
                    // This looks like a range filter [min, max]
                    count += 1;
                } else {
                    // This is a standard facet with multiple selected values
                    count += filterValues.length;
                }
            } else if (filterValues && typeof filterValues === 'object') {
                // Handle range filters stored as objects or other object-type filters
                if (filterValues.min !== undefined || filterValues.max !== undefined) {
                    count += 1;
                }
            }
        });
        
        return count;
    }

    /**
     * Update the active filters count display
     * @param {number} count - Number of active filters
     */
    updateActiveFiltersCount(count) {
        this.activeFiltersCount = count;
        this.elements.activeFiltersCount.textContent = count;
        
        if (count > 0) {
            this.showElement(this.elements.activeFiltersBadge);
            this.showElement(this.elements.clearAllBtn);
        } else {
            this.hideElement(this.elements.activeFiltersBadge);
            this.hideElement(this.elements.clearAllBtn);
        }
        
        this.emitEvent('activeFiltersChanged', { count });
    }

    /**
     * Update the results count display
     * @param {number} count - Number of results
     */
    updateResultsCount(count, uniqueResultsCount = 0) {
        this.resultsCount = count;
        this.uniqueResultsCount = uniqueResultsCount;

        // Update total results display
        this.elements.resultsCount.textContent = count;
        
        // Update or create unique results count display
        this.updateUniqueResultsDisplay(uniqueResultsCount);
        
        if (count > 0) {
            this.showElement(this.elements.resultsCounter);
        } else {
            this.hideElement(this.elements.resultsCounter);
        }

        // Show/hide unique results counter
        if (uniqueResultsCount > 0 && this.elements.uniqueResultsCounter) {
            this.showElement(this.elements.uniqueResultsCounter);
        } else if (this.elements.uniqueResultsCounter) {
            this.hideElement(this.elements.uniqueResultsCounter);
        }

    
        
        this.emitEvent('resultsCountChanged', { 
        totalCount: count,
        uniqueResultsCount: uniqueResultsCount 
    });
    }

    // Method to update unique results count display
    updateUniqueResultsDisplay(uniqueResultsCount) {
        // Find or create the unique results count element
        let uniqueResultsElement = document.getElementById('unique-results-count');
        
        if (!uniqueResultsElement) {
            // Create the element if it doesn't exist
            uniqueResultsElement = document.createElement('span');
            uniqueResultsElement.id = 'unique-results-count';
            uniqueResultsElement.className = 'ml-2 text-xs text-gray-600 bg-blue-100 px-2 py-1 rounded-full';
            
            // Insert it after the main results counter
            const resultsCounter = this.elements.resultsCounter;
            if (resultsCounter) {
                resultsCounter.appendChild(uniqueResultsElement);
            }
        }
        
        // Update the content
        if (uniqueResultsCount > 0) {
            uniqueResultsElement.textContent = `${uniqueResultsCount}`;
            uniqueResultsElement.style.display = 'inline';
        } else {
            uniqueResultsElement.style.display = 'none';
        }
    }

    /**
     * Show element immediately without animation
     */
    showElement(element) {
        if (!element) return;
        element.classList.remove('hidden');
        element.style.opacity = '1';
    }

    /**
     * Hide element immediately without animation
     */
    hideElement(element) {
        if (!element) return;
        element.classList.add('hidden');
        element.style.opacity = '0';
    }

    /**
     * Create and show the active filters popup positioned exactly over the badge
     */
    showActiveFiltersPopup() {
        // Check if popup already exists - if so, close it
        const existingPopup = document.getElementById('active-filters-popup');
        if (existingPopup) {
            this.hideActiveFiltersPopup();
            return;
        }

        // Get badge position for precise positioning
        const badgeRect = this.elements.activeFiltersBadge.getBoundingClientRect();
        
        // Create popup with high z-index to appear over everything
        const popup = document.createElement('div');
        popup.id = 'active-filters-popup';
        popup.className = 'fixed p-2 w-72 max-w-sm bg-white rounded-lg shadow-2xl border border-gray-200 max-h-96 overflow-hidden';
        popup.style.zIndex = '9999'; // Very high z-index to appear over everything
        
        // Position popup exactly over the badge
        popup.style.left = `${badgeRect.left}px`;
        popup.style.bottom = `${window.innerHeight - badgeRect.top + 10}px`; // 10px above the badge
        
        // Adjust if popup would go off-screen
        const popupWidth = 288; // w-72 = 18rem = 288px
        if (badgeRect.left + popupWidth > window.innerWidth) {
            popup.style.left = `${window.innerWidth - popupWidth - 16}px`; // 16px margin from edge
        }
        
        // Popup header
        const header = document.createElement('div');
        header.className = 'flex items-center justify-between mb-2';
        header.innerHTML = `
            <h3 class="p-2 text-sm font-semibold text-gray-800 bg-primary-500">Filtri Attivi</h3>
            <button id="close-filters-popup" class="absolute top-2 right-2 p-1.5 bg-pink-100 hover:bg-pink-200 active:bg-pink-200 rounded-full text-red-500 shadow-md hover:shadow-lg group">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        `;

        // Popup content
        const content = document.createElement('div');
        content.className = 'space-y-1 max-h-64 overflow-y-auto overflow-x-hidden';
        
        // Build filters content
        const filtersContent = this.buildFiltersContent();
        content.innerHTML = filtersContent;

        // Assemble popup
        popup.appendChild(header);
        popup.appendChild(content);
        
        // Add to DOM
        document.body.appendChild(popup);

        // Bind close events and popup-specific clear all button
        this.bindPopupEvents(popup);
    }

    /**
     * Build the HTML content for active filters display with grouped categories
     * @returns {string} HTML content
     */
    buildFiltersContent() {
        if (!this.currentFilters || Object.keys(this.currentFilters).length === 0) {
            return `
                <div class="flex items-center p-4 rounded-lg bg-gray-50">
                    <span class="text-sm text-gray-700">Nessun filtro attivo</span>
                </div>
            `;
        }

        let content = '';

        // Add search query if present with enhanced styling
        if (this.currentQuery && this.currentQuery.trim()) {
            content += `
                <div class="mb-3 p-3 rounded-lg bg-primary-50 border border-primary-100">
                    <div class="flex items-center">
                        <svg class="w-4 h-4 text-primary-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                        <div class="flex-1 min-w-0">
                            <span class="text-sm font-medium text-primary-700">Ricerca:</span>
                            <span class="text-sm text-primary-600 ml-1 font-mono bg-primary-100 px-2 py-1 rounded text-xs">"${this.escapeHtml(this.currentQuery)}"</span>
                        </div>
                    </div>
                </div>
            `;
        }

        // Group filters by category (facet label)
        const groupedFilters = {};
        Object.entries(this.currentFilters).forEach(([facetKey, values]) => {
            if (!values || (Array.isArray(values) && values.length === 0)) return;
            
            const facetLabel = this.getFacetLabel(facetKey);
            
            if (!groupedFilters[facetLabel]) {
                groupedFilters[facetLabel] = [];
            }
            
            if (Array.isArray(values)) {
                // Handle multiple values for the same facet
                if (values.length === 2 && 
                    typeof values[0] === 'number' && 
                    typeof values[1] === 'number') {
                    // This looks like a range filter [min, max]
                    groupedFilters[facetLabel].push({
                        type: 'range',
                        value: this.formatRangeFilter({ min: values[0], max: values[1] }),
                        facetKey
                    });
                } else {
                    // Multiple discrete values - add each one
                    values.forEach(value => {
                        groupedFilters[facetLabel].push({
                            type: 'value',
                            value: value,
                            facetKey
                        });
                    });
                }
            } else if (typeof values === 'object') {
                // Handle range or object filters
                groupedFilters[facetLabel].push({
                    type: 'range',
                    value: this.formatRangeFilter(values),
                    facetKey
                });
            }
        });

        // Build content for each category
        Object.entries(groupedFilters).forEach(([categoryLabel, filterItems]) => {
            content += `
                <div class="mb-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                    <div class="flex items-start">
                        <div class="w-2 h-2 rounded-full bg-indigo-500 mt-2 mr-3 flex-shrink-0"></div>
                        <div class="flex-1 min-w-0">
                            <h4 class="text-sm font-semibold text-gray-800 mb-2">${categoryLabel}</h4>
                            <div class="flex flex-wrap gap-1.5">
            `;
            
            // Add values for this category as inline pills
            filterItems.forEach((item, index) => {
                const isRange = item.type === 'range';
                const bgColor = isRange ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-indigo-100 text-indigo-700 border-indigo-200';
                const icon = isRange ? 
                    `<svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                    </svg>` :
                    `<svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>`;
                
                content += `
                    <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${bgColor} hover:shadow-sm">
                        ${icon}
                        ${this.escapeHtml(item.value)}
                    </span>
                `;
            });
            
            content += `
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        return content || `
            <div class="flex items-center p-4 rounded-lg bg-gray-50">
                <span class="text-sm text-gray-700">Nessun filtro attivo</span>
            </div>
        `;
    }

    /**
     * Get human-readable label for a facet key
     * @param {string} facetKey - The facet key
     * @returns {string} Human-readable label
     */
    getFacetLabel(facetKey) {
        if (this.config && this.config.aggregations && this.config.aggregations[facetKey]) {
            return this.config.aggregations[facetKey].title || facetKey;
        }
        // Fallback: capitalize and replace underscores/dashes
        return facetKey.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    /**
     * Format range filter for display
     * @param {Object} rangeValues - Range filter object
     * @returns {string} Formatted range text
     */
    formatRangeFilter(rangeValues) {
        if (rangeValues.min !== undefined && rangeValues.max !== undefined) {
            return `${rangeValues.min} - ${rangeValues.max}`;
        } else if (rangeValues.min !== undefined) {
            return `≥ ${rangeValues.min}`;
        } else if (rangeValues.max !== undefined) {
            return `≤ ${rangeValues.max}`;
        }
        return 'Range filter';
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Hide the active filters popup
     */
    hideActiveFiltersPopup() {
        const popup = document.getElementById('active-filters-popup');
        if (popup && popup.parentNode) {
            popup.parentNode.removeChild(popup);
        }
    }

    /**
     * Bind events for the popup (simplified - only close and clear all)
     * @param {HTMLElement} popup - Popup element
     */
    bindPopupEvents(popup) {
        // Close button
        const closeBtn = popup.querySelector('#close-filters-popup');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hideActiveFiltersPopup());
        }

        // Popup clear all button
        const popupClearAllBtn = popup.querySelector('#popup-clear-all-btn');
        if (popupClearAllBtn) {
            popupClearAllBtn.addEventListener('click', () => this.handleClearAllFilters());
        }

        // Close on escape key
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.hideActiveFiltersPopup();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);

        // Close when clicking outside (but not the badge that opens it)
        const outsideClickHandler = (e) => {
            if (!popup.contains(e.target) && !this.elements.activeFiltersBadge.contains(e.target)) {
                this.hideActiveFiltersPopup();
                document.removeEventListener('click', outsideClickHandler);
            }
        };
        
        // Add click handler immediately
        document.addEventListener('click', outsideClickHandler);
    }

    /**
     * Bind all event handlers for navigation elements
     */
    bindEventHandlers() {
        // Panel toggle handlers
        this.elements.toggleFilters.addEventListener('click', () => {
            this.togglePanel('filters');
        });

        this.elements.toggleResults.addEventListener('click', () => {
            this.togglePanel('results');
        });

        // Clear all filters handler - now resets interface including facets
        this.elements.clearAllBtn.addEventListener('click', () => {
            this.handleClearAllFilters();
        });

        // Map center handler
        this.elements.layerButton.addEventListener('click', () => {
            this.handleMapCenter();
        });

        // Legend toggle handlers
        // this.elements.toggleLegendBtn.addEventListener('click', () => {
        //     this.toggleLegend();
        // });

        // this.elements.closeLegendBtn.addEventListener('click', () => {
        //     this.closeLegend();
        // });

        // Active filters badge click handler - show popup
        if (this.elements.activeFiltersBadge) {
            this.elements.activeFiltersBadge.addEventListener('click', () => {
                this.showActiveFiltersPopup();
            });
            
            // Make it look clickable
            this.elements.activeFiltersBadge.style.cursor = 'pointer';
            this.elements.activeFiltersBadge.title = 'Clicca per vedere i filtri attivi';
        }
    }

    /**
     * Initialize panel states (closed by default)
     */
    initializePanelStates() {
        this.elements.filtersPanel.classList.add('panel-closed');
        this.elements.resultsPanel.classList.add('panel-closed-right');
        this.elements.toggleFilters.classList.remove('active');
        this.elements.toggleResults.classList.remove('active');
    }

    /**
     * Toggle a specific panel (filters or results)
     * @param {string} panelType - 'filters' or 'results'
     */
    togglePanel(panelType) {
        if (panelType === 'filters') {
            const isClosing = !this.elements.filtersPanel.classList.contains('panel-closed');
            this.elements.filtersPanel.classList.toggle('panel-closed');
            this.elements.toggleFilters.classList.toggle('active', !isClosing);
            
            // Emit custom event for external handling
            this.emitEvent('panelToggled', { 
                type: 'filters', 
                isOpen: !isClosing 
            });
        } else if (panelType === 'results') {
            const isClosing = !this.elements.resultsPanel.classList.contains('panel-closed-right');
            this.elements.resultsPanel.classList.toggle('panel-closed-right');
            this.elements.toggleResults.classList.toggle('active', !isClosing);
            
            // Emit custom event for external handling
            this.emitEvent('panelToggled', { 
                type: 'results', 
                isOpen: !isClosing 
            });
        }
    }

    /**
     * Close all panels
     */
    closeAllPanels() {
        this.elements.filtersPanel.classList.add('panel-closed');
        this.elements.resultsPanel.classList.add('panel-closed-right');
        this.elements.toggleFilters.classList.remove('active');
        this.elements.toggleResults.classList.remove('active');
    }

    /**
     * Handle clear all filters action - Enhanced with proper interface reset
     */
    handleClearAllFilters() {
        // Hide popup if open
        this.hideActiveFiltersPopup();
        
        // Reset local state immediately
        this.currentFilters = {};
        this.currentQuery = '';
        
        // Update UI immediately to provide instant feedback
        this.updateActiveFiltersCount(0);
        this.updateResultsCount(0);
        
        // Emit custom event for external handling with interface reset flag FIRST
        this.emitEvent('clearAllFilters', { 
            resetInterface: true,
            clearSearch: true,
            clearFacets: true,
            clearMap: true
        });
        
        // Reset the facets interface after a delay to avoid conflicts
        setTimeout(() => {
            this.resetFacetsInterface();
        }, 100);
        
        // Clear search input if it exists
        this.clearSearchInput();
        
        // Show confirmation notification
        this.showNotification('Tutti i filtri sono stati rimossi', 'success', 2000);
    }

    /**
     * Handle map center action
     */
    handleMapCenter() {
        // Emit custom event for external handling
        this.emitEvent('centerMap');
    }

    /**
     * Toggle the map legend visibility
     */
    // toggleLegend() {
    //     const isHidden = this.elements.mapLegend.classList.contains('legend-hidden');
    //     this.elements.mapLegend.classList.toggle('legend-hidden');
    //     this.elements.toggleLegendBtn.classList.toggle('active', isHidden);

    //     // Emit custom event
    //     this.emitEvent('legendToggled', { isVisible: isHidden });
    // }

    /**
     * Close the map legend
     */
    // closeLegend() {
    //     this.elements.mapLegend.classList.add('legend-hidden');
    //     this.elements.toggleLegendBtn.classList.remove('active');

    //     // Emit custom event
    //     this.emitEvent('legendClosed');
    // }

    /**
     * Update the map legend with new items
     * @param {Array} legendItems - Array of legend items with color, label, count, and optional onClick
     */
    // updateMapLegend(legendItems) {
    //     const legendContent = document.querySelector('.map-legend-content');
    //     if (!legendContent) return;

    //     legendContent.innerHTML = '';
        
    //     legendItems.forEach((item, index) => {
    //         const legendItem = document.createElement('div');
    //         legendItem.className = 'legend-item flex items-center p-2 rounded-lg cursor-pointer';
    //         legendItem.dataset.legendIndex = index;
            
    //         legendItem.innerHTML = `
    //             <div class="w-4 h-4 rounded-full mr-3 flex-shrink-0" style="background-color: ${item.color}"></div>
    //             <span class="text-sm text-gray-700 flex-1">${item.label}</span>
    //             ${item.count !== undefined ? `<span class="text-xs text-gray-500 ml-2">${item.count}</span>` : ''}
    //         `;
            
    //         // Add click handler if provided
    //         if (item.onClick && typeof item.onClick === 'function') {
    //             legendItem.addEventListener('click', (e) => {
    //                 item.onClick(item, index, e);
    //             });
    //         }
            
    //         legendContent.appendChild(legendItem);
    //     });

    //     // Emit custom event
    //     this.emitEvent('legendUpdated', { items: legendItems });
    // }

    /**
     * Setup responsive behavior for mobile devices
     */
    setupResponsiveBehavior() {
        // Handle window resize for better mobile experience
        window.addEventListener('resize', () => {
            if (window.innerWidth < 768) {
                // On mobile, close panels by default
                this.closeAllPanels();
            }
        });

        // Initial mobile check
        if (window.innerWidth < 768) {
            this.closeAllPanels();
        }
    }

    /**
     * Get current state of the navigation bar
     * @returns {Object} Current state object
     */
    getState() {
        return {
            activeFiltersCount: this.activeFiltersCount,
            resultsCount: this.resultsCount,
            uniqueResultsCount: this.uniqueResultsCount,
            isFiltersOpen: !this.elements.filtersPanel.classList.contains('panel-closed'),
            isResultsOpen: !this.elements.resultsPanel.classList.contains('panel-closed-right'),
            // isLegendVisible: !this.elements.mapLegend.classList.contains('legend-hidden'),
            currentFilters: { ...this.currentFilters },
            currentQuery: this.currentQuery
        };
    }

    /**
     * Set the state of the navigation bar
     * @param {Object} state - State object to apply
     */
    setState(state) {
        if (state.activeFiltersCount !== undefined) {
            this.updateActiveFiltersCount(state.activeFiltersCount);
        }
        
        if (state.resultsCount !== undefined) {
            this.updateResultsCount(state.resultsCount);
        }
        
        if (state.isFiltersOpen !== undefined) {
            const isCurrentlyOpen = !this.elements.filtersPanel.classList.contains('panel-closed');
            if (state.isFiltersOpen !== isCurrentlyOpen) {
                this.togglePanel('filters');
            }
        }
        
        if (state.isResultsOpen !== undefined) {
            const isCurrentlyOpen = !this.elements.resultsPanel.classList.contains('panel-closed-right');
            if (state.isResultsOpen !== isCurrentlyOpen) {
                this.togglePanel('results');
            }
        }
        
        // if (state.isLegendVisible !== undefined) {
        //     const isCurrentlyVisible = !this.elements.mapLegend.classList.contains('legend-hidden');
        //     if (state.isLegendVisible !== isCurrentlyVisible) {
        //         this.toggleLegend();
        //     }
        // }

        if (state.currentFilters !== undefined) {
            this.currentFilters = { ...state.currentFilters };
        }

        if (state.currentQuery !== undefined) {
            this.currentQuery = state.currentQuery;
        }
    }

    /**
     * Emit a custom event from the navigation bar
     * @param {string} eventName - Name of the event
     * @param {Object} detail - Event detail data
     */
    emitEvent(eventName, detail = {}) {
        const event = new CustomEvent(`navbar:${eventName}`, {
            detail,
            bubbles: true,
            cancelable: true
        });
        document.dispatchEvent(event);
    }

    /**
     * Add event listener for navigation bar events
     * @param {string} eventName - Event name (without 'navbar:' prefix)
     * @param {Function} handler - Event handler function
     */
    addEventListener(eventName, handler) {
        document.addEventListener(`navbar:${eventName}`, handler);
    }

    /**
     * Remove event listener for navigation bar events
     * @param {string} eventName - Event name (without 'navbar:' prefix)
     * @param {Function} handler - Event handler function
     */
    removeEventListener(eventName, handler) {
        document.removeEventListener(`navbar:${eventName}`, handler);
    }

    /**
     * Show a notification in the navigation bar
     * @param {string} message - Notification message
     * @param {string} type - Notification type ('success', 'error', 'info', 'warning')
     * @param {number} duration - Duration in milliseconds (default: 3000)
     */
    showNotification(message, type = 'info', duration = 3000) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-lg ${this.getNotificationClasses(type)}`;
        notification.style.opacity = '1';
        notification.textContent = message;
        
        // Add to DOM
        document.body.appendChild(notification);
        
        // Remove after duration
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, duration);
    }

    /**
     * Get CSS classes for notification types
     * @param {string} type - Notification type
     * @returns {string} CSS classes
     */
    getNotificationClasses(type) {
        const classes = {
            success: 'bg-green-500 text-white',
            error: 'bg-red-500 text-white',
            warning: 'bg-yellow-500 text-white',
            info: 'bg-primary-500 text-white'
        };
        return classes[type] || classes.info;
    }

    /**
     * Destroy the navigation bar and clean up event listeners
     */
    destroy() {
        // Remove event listeners
        window.removeEventListener('resize', this.setupResponsiveBehavior);
        
        // Remove popup if exists
        this.hideActiveFiltersPopup();
        
        // Clear references
        this.elements = {};
        this.currentFilters = {};
        this.currentQuery = '';
        this.config = null;
        this.isInitialized = false;
    }

    /**
     * Reset the entire interface to initial state
     */
    resetInterface() {
        this.currentFilters = {};
        this.currentQuery = '';
        this.updateActiveFiltersCount(0);
        this.updateResultsCount(0);
        this.hideActiveFiltersPopup();
        this.closeAllPanels();
        this.resetFacetsInterface();
        this.clearSearchInput();
    }

    /**
     * Reset all facets in the interface to their unchecked/default state
     */
    resetFacetsInterface() {
        const facetsContainer = document.getElementById('facets-container');
        if (!facetsContainer) return;

        // Reset all checkboxes
        const checkboxes = facetsContainer.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });

        // Reset all range sliders to their min/max values
        const sliders = facetsContainer.querySelectorAll('[id$="-slider"]');
        sliders.forEach(sliderElement => {
            if (sliderElement.noUiSlider) {
                try {
                    // Get the original range from the slider configuration
                    const range = sliderElement.noUiSlider.options.range;
                    sliderElement.noUiSlider.set([range.min, range.max]);
                    
                    // Reset associated input fields
                    const facetKey = sliderElement.id.replace('-slider', '');
                    const minInput = document.getElementById(`${facetKey}-min-input`);
                    const maxInput = document.getElementById(`${facetKey}-max-input`);
                    if (minInput) minInput.value = range.min;
                    if (maxInput) maxInput.value = range.max;
                    
                    // Reset chart highlight if it exists
                    const chartElement = document.getElementById(`${facetKey}-chart`);
                    if (chartElement) {
                        const highlight = chartElement.querySelector(`#${facetKey}-chart-highlight`);
                        if (highlight) {
                            highlight.style.left = '0%';
                            highlight.style.width = '100%';
                        }
                    }
                } catch (error) {
                    console.warn(`Failed to reset slider ${sliderElement.id}:`, error);
                }
            }
        });

        // Reset taxonomy facets (collapse all expanded items)
        const toggleButtons = facetsContainer.querySelectorAll('.toggle-btn');
        toggleButtons.forEach(button => {
            const path = button.dataset.path;
            const childrenContainer = facetsContainer.querySelector(`[data-parent="${path}"]`);
            if (childrenContainer && childrenContainer.style.display !== 'none') {
                childrenContainer.style.display = 'none';
                button.textContent = '▶';
            }
        });
    }

    /**
     * Clear the search input field if it exists
     */
    clearSearchInput() {
        // Common search input selectors
        const searchSelectors = [
            '#search-input',
            '#query-input', 
            '.search-input',
            'input[type="search"]',
            'input[placeholder*="search" i]',
            'input[placeholder*="cerca" i]'
        ];

        for (const selector of searchSelectors) {
            const searchInput = document.querySelector(selector);
            if (searchInput) {
                searchInput.value = '';
                // Trigger input event to notify any listeners
                searchInput.dispatchEvent(new Event('input', { bubbles: true }));
                break;
            }
        }
    }

    /**
     * Helper method to update chart highlight (similar to FacetRenderer._updateChartHighlight)
     * @param {HTMLElement} chartElement - Chart element
     * @param {Array} buckets - Bucket data
     * @param {number} startValue - Start value
     * @param {number} endValue - End value
     */
    _updateChartHighlight(chartElement, buckets, startValue, endValue) {
        if (!chartElement || !buckets || buckets.length === 0) return;
        
        const highlight = chartElement.querySelector(`#${chartElement.id}-highlight`);
        if (!highlight) return;
        
        const range = buckets[buckets.length - 1].value - buckets[0].value;
        if (range <= 0) return;
        
        // Calculate the left position and width as percentages
        const leftPos = ((startValue - buckets[0].value) / range) * 100;
        const width = ((endValue - startValue) / range) * 100;
        
        highlight.style.left = `${Math.max(0, leftPos)}%`;
        highlight.style.width = `${Math.max(0, Math.min(100, width))}%`;
    }

    initializeLayerButton(config) {
        const layerButton = document.querySelector('#map-layer-selector');
        if (!layerButton) return;

        // Get available layers from config
        const layers = config.map.tileLayers;
        
        // Track current layer
        let currentTileLayer = null;
        let currentLayerName = 'Default';
        
        // Make button clickable
        layerButton.style.cursor = 'pointer';
        layerButton.title = 'Clicca per cambiare layer';
        
        // Add button click handler
        layerButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showLayerSelectionPopup();
        });
        
        // Layer selection popup
        this.showLayerSelectionPopup = () => {
            // Check if popup already exists - if so, close it
            const existingPopup = document.getElementById('layer-selection-popup');
            if (existingPopup) {
                this.hideLayerSelectionPopup();
                return;
            }

            // Get button position for precise positioning
            const buttonRect = layerButton.getBoundingClientRect();
            
            // Create popup with high z-index to appear over everything
            const popup = document.createElement('div');
            popup.id = 'layer-selection-popup';
            popup.className = 'fixed p-2 w-72 max-w-sm bg-white rounded-lg shadow-2xl border border-gray-200 max-h-96 overflow-hidden';
            popup.style.zIndex = '9999';
            
            // Position popup exactly over the button
            popup.style.left = `${buttonRect.left}px`;
            popup.style.bottom = `${window.innerHeight - buttonRect.top + 10}px`;
            
            // Adjust if popup would go off-screen
            const popupWidth = 288;
            if (buttonRect.left + popupWidth > window.innerWidth) {
                popup.style.left = `${window.innerWidth - popupWidth - 16}px`;
            }
            
            // Popup header
            const header = document.createElement('div');
            header.className = 'flex items-center justify-between mb-2';
            header.innerHTML = `
                <h3 class="p-2 text-sm font-semibold text-gray-800">Seleziona Layer</h3>
                <button id="close-layer-popup" class="absolute top-2 right-2 p-1.5 bg-pink-100 hover:bg-pink-200 active:bg-pink-200 rounded-full text-red-500 shadow-md hover:shadow-lg group">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            `;

            // Popup content
            const content = document.createElement('div');
            content.className = 'space-y-1 max-h-64 overflow-y-auto overflow-x-hidden mb-3 p-3 rounded-lg bg-gray-50 border border-gray-200';
            
            // Build layers content
            const layersContent = this.buildLayersContent(layers);
            content.innerHTML = layersContent;

            // Assemble popup
            popup.appendChild(header);
            popup.appendChild(content);
            
            // Add to DOM
            document.body.appendChild(popup);

            // Bind close events and layer selection
            this.bindLayerPopupEvents(popup);
        };

        // Build layers content with checkmarks
        this.buildLayersContent = (layers) => {
            let content = '';
            
            for (let layerName in layers) {
                const isSelected = layerName === currentLayerName;
                const layerData = layers[layerName];
                
                content += `
                    <div class="layer-item flex items-center justify-between p-2 rounded hover:bg-gray-100 cursor-pointer" 
                        data-layer-name="${layerName}" 
                        data-layer-url="${layerData.tileLayer}"
                        data-layer-attribution="${layerData.attribution}">
                        <div class="flex items-center space-x-2">
                            <span class="text-sm text-gray-700">${layerName}</span>
                        </div>
                        <div class="flex items-center">
                            ${isSelected ? `
                                <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                                </svg>
                            ` : ''}
                        </div>
                    </div>
                `;
            }
            
            return content;
        };

        // Bind popup events
        this.bindLayerPopupEvents = (popup) => {
            // Close button
            const closeButton = popup.querySelector('#close-layer-popup');
            if (closeButton) {
                closeButton.addEventListener('click', () => {
                    this.hideLayerSelectionPopup();
                });
            }

            // Layer selection
            const layerItems = popup.querySelectorAll('.layer-item');
            layerItems.forEach(item => {
                item.addEventListener('click', (e) => {
                    const layerName = item.dataset.layerName;
                    const layerUrl = item.dataset.layerUrl;
                    const attribution = item.dataset.layerAttribution;
                    
                    selectLayer(layerName, layerUrl, attribution);
                    this.hideLayerSelectionPopup();
                });
            });

            // Close on outside click
            document.addEventListener('click', this.handleOutsideClick);
            
            // Close on escape key
            document.addEventListener('keydown', this.handleEscapeKey);
        };

        // Hide popup
        this.hideLayerSelectionPopup = () => {
            const popup = document.getElementById('layer-selection-popup');
            if (popup) {
                popup.remove();
                document.removeEventListener('click', this.handleOutsideClick);
                document.removeEventListener('keydown', this.handleEscapeKey);
            }
        };

        // Handle outside click
        this.handleOutsideClick = (e) => {
            const popup = document.getElementById('layer-selection-popup');
            if (popup && !popup.contains(e.target) && !layerButton.contains(e.target)) {
                this.hideLayerSelectionPopup();
            }
        };

        // Handle escape key
        this.handleEscapeKey = (e) => {
            if (e.key === 'Escape') {
                this.hideLayerSelectionPopup();
            }
        };
        
        // Layer selection function
        function selectLayer(layerName, layerUrl, attribution) {
            // Update button text
            updateLayerButtonText(layerName);
            
            // Remove current tile layer if it exists
            if (currentTileLayer) {
                window.map.removeLayer(currentTileLayer);
            }
            
            // Add new tile layer with the correct attribution
            currentTileLayer = L.tileLayer(layerUrl, {
                attribution: attribution,
                maxZoom: 18
            });
            
            currentTileLayer.addTo(window.map);
            
            // Store current layer info
            currentLayerName = layerName;
            
            // Trigger layer change event
            console.log(`Layer changed to: ${layerName}`);
            window.dispatchEvent(new CustomEvent('layerChanged', {
                detail: { 
                    layerName: layerName,
                    layerUrl: layerUrl,
                    attribution: attribution
                }
            }));
        }
        
        function updateLayerButtonText(layerName) {
            // Update button text while keeping any icons
            const icon = layerButton.querySelector('i') || layerButton.querySelector('.icon');
            
            if (icon) {
                layerButton.innerHTML = '';
                layerButton.appendChild(icon);
                layerButton.appendChild(document.createTextNode('Strati cartografici'));
            } else {
                layerButton.textContent = layerName;
            }
        }
        
        // Set initial button text
        updateLayerButtonText(currentLayerName);
    }

    /** HANDLE MARKERS CHANGES */
    /* NOTE THAT THE 3 LOGICS TO ACTUALLY CHANGE THE MAP MARKERS ARE IMPORTED FROM INITMAP MODULE*/
    initializeMarkersSelector() {
        const markersButton = document.querySelector('#map-markers-selector');
        if (!markersButton) return;

        // Available marker types
        const markerTypes = {
            'clusters': {
                name: 'Clusters geografici',
                description: 'Raggruppamenti dinamici'
            },
            'pins': {
                name: 'Pin con numeri',
                description: 'Pin con conteggio occorrenze'
            },
            'circles': {
                name: 'Cerchi Proporzionali',
                description: 'Cerchi con diametro basato su occorrenze'
            }
        };
        
        // Track current marker type
        let currentMarkerType = 'clusters'; // Default to clusters
        
        // Make button clickable
        markersButton.style.cursor = 'pointer';
        markersButton.title = 'Clicca per cambiare tipo di marker';
        
        // Add button click handler
        markersButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showMarkersSelectionPopup();
        });
        
        // Markers selection popup
        this.showMarkersSelectionPopup = () => {
            // Check if popup already exists - if so, close it
            const existingPopup = document.getElementById('markers-selection-popup');
            if (existingPopup) {
                this.hideMarkersSelectionPopup();
                return;
            }

            // Get button position for precise positioning
            const buttonRect = markersButton.getBoundingClientRect();
            
            // Create popup with high z-index to appear over everything
            const popup = document.createElement('div');
            popup.id = 'markers-selection-popup';
            popup.className = 'fixed p-2 w-72 max-w-sm bg-white rounded-lg shadow-2xl border border-gray-200 max-h-96 overflow-hidden';
            popup.style.zIndex = '9999';
            
            // Position popup exactly over the button
            popup.style.left = `${buttonRect.left}px`;
            popup.style.bottom = `${window.innerHeight - buttonRect.top + 10}px`;
            
            // Adjust if popup would go off-screen
            const popupWidth = 288;
            if (buttonRect.left + popupWidth > window.innerWidth) {
                popup.style.left = `${window.innerWidth - popupWidth - 16}px`;
            }
            
            // Popup header
            const header = document.createElement('div');
            header.className = 'flex items-center justify-between mb-2';
            header.innerHTML = `
                <h3 class="p-2 text-sm font-semibold text-gray-800">Tipo di Marker</h3>
                <button id="close-markers-popup" class="absolute top-2 right-2 p-1.5 bg-pink-100 hover:bg-pink-200 active:bg-pink-200 rounded-full text-red-500 shadow-md hover:shadow-lg group">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            `;

            // Popup content
            const content = document.createElement('div');
            content.className = 'space-y-1 max-h-64 overflow-y-auto overflow-x-hidden';
            
            // Build markers content
            const markersContent = this.buildMarkersContent(markerTypes);
            content.innerHTML = markersContent;

            // Assemble popup
            popup.appendChild(header);
            popup.appendChild(content);
            
            // Add to DOM
            document.body.appendChild(popup);

            // Bind close events and marker selection
            this.bindMarkersPopupEvents(popup);
        };

        // Build markers content with checkmarks and icons
        this.buildMarkersContent = (markerTypes) => {
            let content = '';
            
            for (let markerType in markerTypes) {
                const isSelected = markerType === currentMarkerType;
                const markerData = markerTypes[markerType];
                
                // Different icons for each marker type
                let iconSvg = '';
                switch(markerType) {
                    case 'clusters':
                        iconSvg = `
                            <svg class="w-4 h-4 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"></path>
                            </svg>
                        `;
                        break;
                    case 'pins':
                        iconSvg = `
                            <svg class="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path>
                            </svg>
                        `;
                        break;
                    case 'circles':
                        iconSvg = `
                            <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clip-rule="evenodd"></path>
                            </svg>
                        `;
                        break;
                }
                
                content += `
                    <div class="marker-item flex items-center justify-between p-2 rounded hover:bg-gray-50 hover:shadow-md cursor-pointer" 
                         data-marker-type="${markerType}">
                        <div class="flex items-center space-x-3">
                            ${iconSvg}
                            <div>
                                <span class="text-sm font-medium text-gray-700">${markerData.name}</span>
                                <p class="text-xs text-gray-500">${markerData.description}</p>
                            </div>
                        </div>
                        <div class="flex items-center">
                            ${isSelected ? `
                                <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                                </svg>
                            ` : ''}
                        </div>
                    </div>
                `;
            }
            
            return content;
        };

        // Bind popup events
        this.bindMarkersPopupEvents = (popup) => {
            // Close button
            const closeButton = popup.querySelector('#close-markers-popup');
            if (closeButton) {
                closeButton.addEventListener('click', () => {
                    this.hideMarkersSelectionPopup();
                });
            }

            // Marker selection
            const markerItems = popup.querySelectorAll('.marker-item');
            markerItems.forEach(item => {
                item.addEventListener('click', (e) => {
                    const markerType = item.dataset.markerType;
                    selectMarkerType(markerType);
                    this.hideMarkersSelectionPopup();
                });
            });

            // Close on outside click
            document.addEventListener('click', this.handleMarkersOutsideClick);
            
            // Close on escape key
            document.addEventListener('keydown', this.handleMarkersEscapeKey);
        };

        // Hide popup
        this.hideMarkersSelectionPopup = () => {
            const popup = document.getElementById('markers-selection-popup');
            if (popup) {
                popup.remove();
                document.removeEventListener('click', this.handleMarkersOutsideClick);
                document.removeEventListener('keydown', this.handleMarkersEscapeKey);
            }
        };

        // Handle outside click
        this.handleMarkersOutsideClick = (e) => {
            const popup = document.getElementById('markers-selection-popup');
            if (popup && !popup.contains(e.target) && !markersButton.contains(e.target)) {
                this.hideMarkersSelectionPopup();
            }
        };

        // Handle escape key
        this.handleMarkersEscapeKey = (e) => {
            if (e.key === 'Escape') {
                this.hideMarkersSelectionPopup();
            }
        };
        
        // Marker type selection function
        const selectMarkerType = (markerType) => {
            // Update button text
            updateMarkersButtonText(markerTypes[markerType].name);
            
            // Store current marker type
            currentMarkerType = markerType;
            
            // Apply the selected marker type to the map via the global function
            if (window.switchMarkerType) {
                window.switchMarkerType(markerType);
            } else if (this.mapInstance && this.mapInstance.switchMarkerType) {
                this.mapInstance.switchMarkerType(markerType);
            } else {
                console.warn('No switchMarkerType function available');
            }
            
            // Trigger marker type change event
            console.log(`Marker type changed to: ${markerType}`);
            window.dispatchEvent(new CustomEvent('markerTypeChanged', {
                detail: { 
                    markerType: markerType,
                    markerName: markerTypes[markerType].name
                }
            }));
        };
        
        const updateMarkersButtonText = (markerName) => {
            // Update button text while keeping any icons
            const icon = markersButton.querySelector('i') || markersButton.querySelector('.icon');
            
            if (icon) {
                markersButton.innerHTML = '';
                markersButton.appendChild(icon);
                markersButton.appendChild(document.createTextNode(` ${markerName}`));
            } else {
                markersButton.textContent = markerName;
            }
        };
        
        // Set initial button text
        updateMarkersButtonText(markerTypes[currentMarkerType].name);
    }
}

// Export singleton instance
export const navBarRenderer = new NavBarRenderer();