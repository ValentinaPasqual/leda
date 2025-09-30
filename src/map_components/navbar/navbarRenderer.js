/**
 * Navigation Bar Renderer Module
 * Handles navigation bar functionalities on the map
 */

import '../../styles/tailwind.css'
import { DOMUtils, EventUtils, FilterUtils, NotificationUtils, ResetUtils } from './navbarUtils.js';
import { ActiveFiltersPopupManager, LayerSelectionPopupManager, MarkersSelectionPopupManager, LegendPopupManager } from './functionalitiesManager.js';

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
            markers: null, 
            legend: null,
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
        // bottom nav references (possono non esistere in HTML; verranno create se mancanti)
        bottomNav: document.getElementById('bottom-nav') || document.querySelector('nav#bottom-nav') || document.querySelector('nav'),
        bottomNavContent: document.getElementById('bottom-nav-content')
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

        // Legend  popup - Usa Timeout per prendere tutti gli elementi già caricati nel DOM nella spiegazione
        setTimeout(() => {
            this.popupManagers.legend = new LegendPopupManager(this.mapInstance);
            this.popupManagers.legend.init();
        }, 5000);

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
    // inizializza hamburger/menu dinamico
    this.setupHamburgerMenu();

    // comportamento legacy: chiude i pannelli su schermi piccoli
    const handleSmallScreens = () => {
        if (window.innerWidth < 768) {
            this.closeAllPanels();
            // nascondo anche il container desktop se presente
            this.elements.bottomNavContent?.classList.add('hidden');
        } else {
            // su desktop apro (o lascio come prima)
            this.elements.bottomNavContent?.classList.remove('hidden');
            this.elements.bottomNavContent?.classList.add('flex');
        }
    };

    window.addEventListener('resize', handleSmallScreens);
    // chiamata iniziale
    handleSmallScreens();
}



/**
 * Crea hamburger + menu mobile (se non esistono) e inizializza layout
 */
setupHamburgerMenu() {
    // crea i nodi se mancano
    this.createHamburgerAndMobileMenu();
    // allinea elementi subito
    this.updateMenuLayout();
    // resize listener per spostare dentro/fuori
    window.addEventListener('resize', () => {
        this.updateMenuLayout();
    });
}

/**
 * Crea DOM per hamburger e mobile menu se non esistono
 */
createHamburgerAndMobileMenu() {
    const bottomNav = this.elements.bottomNav || document.querySelector('nav#bottom-nav') || document.querySelector('nav') || document.body;
    this.elements.bottomNav = bottomNav;

    // Hamburger button
    if (!document.getElementById('hamburger-btn')) {
        const btn = document.createElement('button');
        btn.id = 'hamburger-btn';
        btn.className = 'md:hidden p-2 z-60'; // visibile solo su small screens
        btn.setAttribute('aria-label', 'Apri menu');
        btn.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <line x1="5" y1="7" x2="19" y2="7" stroke="currentColor" stroke-width="2" stroke-linecap="round"></line>
                <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"></line>
                <line x1="5" y1="17" x2="19" y2="17" stroke="currentColor" stroke-width="2" stroke-linecap="round"></line>
            </svg>
        `;
        bottomNav.appendChild(btn);

        btn.addEventListener('click', () => {
            const mobileMenu = document.getElementById('bottom-nav-mobile-menu');
            if (mobileMenu) {
                mobileMenu.classList.toggle('hidden');
            }
        });
    }

    // Mobile menu container (appears above bottom nav)
    if (!document.getElementById('bottom-nav-mobile-menu')) {
        const menu = document.createElement('div');
        menu.id = 'bottom-nav-mobile-menu';
        // posizione fissa sopra la bottom nav; hidden di default
        menu.className = 'hidden md:hidden fixed bottom-14 left-4 right-4 bg-white shadow-lg p-3 rounded-lg flex flex-col gap-2 z-50';
        // aggiungo una classe di transizione per fluidità
        menu.style.transition = 'transform .18s ease, opacity .18s ease';
        document.body.appendChild(menu);
    }
}

/**
 * Decide se mettere gli elementi nel menu mobile o rimetterli nel bottom nav (desktop)
 */
updateMenuLayout() {
    const isMobile = window.innerWidth < 768;
    const mobileMenu = document.getElementById('bottom-nav-mobile-menu');
    let desktopContainer = this.elements.bottomNavContent || document.getElementById('bottom-nav-content');

    // se non esiste container desktop, crealo dentro bottomNav (non rompere layout desktop)
    if (!desktopContainer) {
        desktopContainer = document.createElement('div');
        desktopContainer.id = 'bottom-nav-content';
        // default: visibile su desktop, nascosto su mobile
        desktopContainer.className = 'hidden md:flex items-center space-x-3';
        this.elements.bottomNav?.appendChild(desktopContainer);
        this.elements.bottomNavContent = desktopContainer;
    }

    if (isMobile) {
        // nascondi la porzione desktop (se presente) e sposta dentro mobile menu
        desktopContainer.classList.remove('flex');
        desktopContainer.classList.add('hidden');
        this.moveToMobileMenu(mobileMenu);
    } else {
        // desktop: assicurati che il container sia visibile e riporta gli elementi
        desktopContainer.classList.remove('hidden');
        desktopContainer.classList.add('flex');
        this.moveToDesktop(mobileMenu, desktopContainer);
    }
}

/**
 * Sposta i nostri elementi dentro il mobile menu (preservando event listeners)
 */
moveToMobileMenu(menu) {
    if (!menu) return;
    const ids = [
        'toggle-filters',
        'active-filters-badge',
        'clear-all-btn',
        'map-layer-selector',
        'map-markers-selector',
        'toggle-legend-btn',
        'results-counter',
        'unique-results-counter',
        'toggle-results',
    ];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el && el.parentNode !== menu) {
            // aggiungo full width per rendere più comodo il tap su mobile
            el.classList.add('w-full', 'block');
            menu.appendChild(el);
        }
    });
    // di default il menu resta nascosto finché non si clicca hamburger
    menu.classList.add('hidden');
}

/**
 * Riporta gli elementi nel container desktop
 */
moveToDesktop(menu, desktopContainer) {
    if (!desktopContainer) return;
    if (!menu) return;

    // Prendo una copia dei figli perché stiamo spostando nodi
    const nodes = Array.from(menu.childNodes);
    nodes.forEach(node => {
        // ignora nodi non-elemento
        if (!(node instanceof HTMLElement)) return;
        // rimuovo classi di full width usate per mobile
        node.classList.remove('w-full', 'block');
        desktopContainer.appendChild(node);
    });

    // nascondi menu mobile
    menu.classList.add('hidden');
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