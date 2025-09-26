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
            isInitialized: false,
            isMobileMenuOpen: false
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
        this.createMobileMenu();
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
            markersButton: document.getElementById('map-markers-selector'),
            toggleLegendBtn: document.getElementById('toggle-legend-btn')
        };
    }

    /**
     * Create mobile hamburger menu
     */
    createMobileMenu() {
        // Create hamburger button
        const hamburgerBtn = document.createElement('button');
        hamburgerBtn.id = 'mobile-menu-toggle';
        hamburgerBtn.className = 'md:hidden p-2 text-gray-600 hover:text-gray-800 focus:outline-none';
        hamburgerBtn.innerHTML = `
            <div class="w-6 h-6 flex flex-col justify-center items-center">
                <span class="block w-5 h-0.5 bg-current mb-1 transition-all duration-200"></span>
                <span class="block w-5 h-0.5 bg-current mb-1 transition-all duration-200"></span>
                <span class="block w-5 h-0.5 bg-current transition-all duration-200"></span>
            </div>
        `;

        // Create mobile menu overlay
        const mobileMenu = document.createElement('div');
        mobileMenu.id = 'mobile-menu';
        mobileMenu.className = 'md:hidden fixed inset-0 bg-black bg-opacity-50 z-50 hidden';
        
        // Create mobile menu content
        const mobileMenuContent = document.createElement('div');
        mobileMenuContent.className = 'fixed top-0 right-0 h-full w-80 bg-white shadow-lg transform translate-x-full transition-transform duration-300 ease-in-out overflow-y-auto';
        mobileMenuContent.innerHTML = `
            <div class="p-4 border-b">
                <div class="flex justify-between items-center">
                    <h3 class="text-lg font-semibold">Pannello di Controllo</h3>
                    <button id="mobile-menu-close" class="p-2 text-gray-600 hover:text-gray-800">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <div class="p-4 space-y-4">
                <div id="mobile-menu-items" class="space-y-3"></div>
            </div>
        `;

        mobileMenu.appendChild(mobileMenuContent);

        // Insert elements into navbar
        const navbar = document.querySelector('nav, .navbar, [role="navigation"]') || document.body.firstElementChild;
        if (navbar) {
            navbar.appendChild(hamburgerBtn);
            document.body.appendChild(mobileMenu);
        }

        // Store references
        this.elements.hamburgerBtn = hamburgerBtn;
        this.elements.mobileMenu = mobileMenu;
        this.elements.mobileMenuContent = mobileMenuContent;
        this.elements.mobileMenuItems = document.getElementById('mobile-menu-items');

        this.populateMobileMenu();
    }

    /**
     * Populate mobile menu with existing DOM elements
     */
    populateMobileMenu() {
        if (!this.elements.mobileMenuItems) return;

        // Store original elements and their parents for restoration
        this.originalPositions = {};
        
        // Gruppo FILTRI [layout 2 colonne]
        const filtersGroup = document.createElement('div');
        filtersGroup.className = 'mobile-group mb-4 pb-4';

        const filtersContainer = document.createElement('div');
        filtersContainer.className = 'flex gap-4';

        const leftColumnFilters = document.createElement('div');
        leftColumnFilters.className = 'flex-1';

        if (this.elements.toggleFilters) {
            this.moveElementToMobile(this.elements.toggleFilters, leftColumnFilters);
        }

        const rightColumnFilters = document.createElement('div');
        rightColumnFilters.className = 'flex-1 flex flex-col gap-2';

        if (this.elements.activeFiltersBadge) {
            this.moveElementToMobile(this.elements.activeFiltersBadge, rightColumnFilters);
        }

        if (this.elements.clearAllBtn) {
            this.moveElementToMobile(this.elements.clearAllBtn, rightColumnFilters);
        }

        filtersContainer.appendChild(leftColumnFilters);
        filtersContainer.appendChild(rightColumnFilters);
        filtersGroup.appendChild(filtersContainer);

        this.elements.mobileMenuItems.appendChild(filtersGroup);
        
        // Gruppo 2: RISULTATI [layout 2 colonne]
        const resultsGroup = document.createElement('div');
        resultsGroup.className = 'mobile-group mb-4 pb-4';

        const resultsContainer = document.createElement('div');
        resultsContainer.className = 'flex gap-4';

        const leftColumnResults = document.createElement('div');
        leftColumnResults.className = 'flex-1';

        if (this.elements.toggleResults) {
            this.moveElementToMobile(this.elements.toggleResults, leftColumnResults);
        }

        const rightColumnResults = document.createElement('div');
        rightColumnResults.className = 'flex-1 flex flex-col gap-2';

        if (this.elements.resultsCounter) {
            this.moveElementToMobile(this.elements.resultsCounter, rightColumnResults);
        }

        if (this.elements.uniqueResultsCounter) {
            this.moveElementToMobile(this.elements.uniqueResultsCounter, rightColumnResults);
        }

        resultsContainer.appendChild(leftColumnResults);
        resultsContainer.appendChild(rightColumnResults);
        resultsGroup.appendChild(resultsContainer);

        this.elements.mobileMenuItems.appendChild(resultsGroup);
                
        // Spazio
        const spacer = document.createElement('div');
        spacer.className = 'h-4';
        this.elements.mobileMenuItems.appendChild(spacer);
        
        // Altri elementi singoli [legenda, strati cartografici, markers]
        const otherElements = [
            this.elements.layerButton,
            this.elements.markersButton,
            this.elements.toggleLegendBtn
        ];
        
        otherElements.forEach(element => {
            if (element && element.parentNode) {
                const wrapper = document.createElement('div');
                wrapper.className = 'mobile-menu-item w-full mb-2';
                this.moveElementToMobile(element, wrapper);
                this.elements.mobileMenuItems.appendChild(wrapper);
            }
        });

        this.bindMobileMenuEvents();
    }
    
    /**
     * Move element to mobile menu
     */
    moveElementToMobile(element, targetContainer) {
        if (!element || !element.parentNode || !targetContainer) return;
        
        // Store original position
        this.originalPositions[element.id] = {
            parent: element.parentNode,
            nextSibling: element.nextElementSibling,
            originalClasses: element.className
        };

        // Move element maintaining original style
        targetContainer.appendChild(element);
    }

    /**
     * Style mobile elements - Mantiene grafica originale, sposta gli elementi al menù hambrurger
     */
    styleMobileElements() {
        // Non fare niente - mantieni la grafica originale degli elementi
        // Gli elementi mantengono la loro grafica originale
    }

    /**
     * Bind mobile menu events
     */
    bindMobileMenuEvents() {
        // Chiudi hamburger quando clicchi toggle-filters o toggle-results
        this.elements.mobileMenuItems.addEventListener('click', (e) => {
            const clickedElement = e.target.closest('button, [onclick]');
            if (clickedElement) {
                // Chiudi SEMPRE l'hamburger per toggle-filters e toggle-results
                if (['toggle-filters', 'toggle-results'].includes(clickedElement.id)) {
                    setTimeout(() => this.closeMobileMenu(), 100);
                } else {
                    // Per gli altri elementi chiudi dopo un delay più lungo
                    setTimeout(() => this.closeMobileMenu(), 300);
                }
            }
        });
    }

    /**
     * Restore elements to their original positions (for desktop)
     */
    restoreOriginalPositions() {
        Object.entries(this.originalPositions).forEach(([elementId, position]) => {
            const element = document.getElementById(elementId);
            if (element && position.parent) {
                // Restore original classes EXACTLY as they were
                element.className = position.originalClasses;
                
                // Move back to original position
                if (position.nextSibling) {
                    position.parent.insertBefore(element, position.nextSibling);
                } else {
                    position.parent.appendChild(element);
                }
            }
        });
        
        // Clear mobile menu
        if (this.elements.mobileMenuItems) {
            this.elements.mobileMenuItems.innerHTML = '';
        }
    }

    /**
     * Toggle mobile menu
     */
    toggleMobileMenu() {
        if (this.state.isMobileMenuOpen) {
            this.closeMobileMenu();
        } else {
            this.openMobileMenu();
        }
    }

    /**
     * Open mobile menu
     */
    openMobileMenu() {
        this.state.isMobileMenuOpen = true;
        this.elements.mobileMenu.classList.remove('hidden');
        
        setTimeout(() => {
            this.elements.mobileMenuContent.style.transform = 'translateX(0)';
        }, 10);

        // Transform hamburger to X
        const spans = this.elements.hamburgerBtn.querySelectorAll('span');
        spans[0].style.transform = 'rotate(45deg) translate(6px, 6px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(6px, -6px)';
    }

    /**
     * Close mobile menu
     */
    closeMobileMenu() {
        this.state.isMobileMenuOpen = false;
        this.elements.mobileMenuContent.style.transform = 'translateX(100%)';
        
        setTimeout(() => {
            this.elements.mobileMenu.classList.add('hidden');
        }, 300);

        // Reset hamburger
        const spans = this.elements.hamburgerBtn.querySelectorAll('span');
        spans[0].style.transform = '';
        spans[1].style.opacity = '';
        spans[2].style.transform = '';
    }

    /**
     * Update mobile menu elements (they're the same DOM elements, so no separate update needed)
     */
    updateMobileCounters() {
        // No need to update separately - using the same DOM elements
        // The cloned elements in mobile menu will reflect the same state
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
            this.elements.clearAllBtn.className = 'ml-2 px-3 py-1 bg-pink-100 hover:bg-pink-200 text-red-500 text-xs rounded-full';
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
        
        this.updateMobileCounters();
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
        
        this.updateMobileCounters();
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
        // Panel toggles (sempre visibili)
        this.elements.toggleFilters?.addEventListener('click', () => {
            this.togglePanel('filters');
        });

        this.elements.toggleResults?.addEventListener('click', () => {
            this.togglePanel('results');
        });

        // Clear all filters (desktop only)
        this.elements.clearAllBtn?.addEventListener('click', () => {
            this.handleClearAllFilters();
        });

        // Mobile menu toggle
        this.elements.hamburgerBtn?.addEventListener('click', () => {
            this.toggleMobileMenu();
        });

        // Mobile menu close
        const closeBtn = document.getElementById('mobile-menu-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeMobileMenu();
            });
        }

        // Close mobile menu on overlay click
        this.elements.mobileMenu?.addEventListener('click', (e) => {
            if (e.target === this.elements.mobileMenu) {
                this.closeMobileMenu();
            }
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
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                // Desktop: restore original positions
                this.restoreOriginalPositions();
                this.closeMobileMenu();
            } else {
                // Mobile: move elements to hamburger menu if not already there
                if (this.elements.mobileMenuItems && this.elements.mobileMenuItems.children.length === 0) {
                    this.populateMobileMenu();
                }
            }
        };

        window.addEventListener('resize', handleResize);

        // Initial setup
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
        this.closeMobileMenu();
        ResetUtils.resetFacetsInterface();
        ResetUtils.clearSearchInput();
    }

    /**
     * Destroy and cleanup
     */
    destroy() {
        // Restore original positions before destroying
        this.restoreOriginalPositions();
        
        // Destroy popup managers
        Object.values(this.popupManagers).forEach(manager => {
            manager?.destroy();
        });

        // Remove mobile menu elements
        this.elements.hamburgerBtn?.remove();
        this.elements.mobileMenu?.remove();
        
        // Clear references
        this.elements = {};
        this.originalPositions = {};
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