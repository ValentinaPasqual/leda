/**
 * Navigation Bar Renderer - Ottimizzato
 * Coordina tutti i componenti della navbar
 */

import '../../styles/tailwind.css';
import { NavBarState } from './navbarState.js';
import { MobileMenuManager } from './mobileMenuManager.js';
import { DOMUtils, FilterUtils, NotificationUtils, ResetUtils } from './navbarUtils.js';
import { 
    ActiveFiltersPopupManager, 
    LayerSelectionPopupManager, 
    MarkersSelectionPopupManager, 
    LegendPopupManager 
} from './functionalitiesManager.js';

const ELEMENT_IDS = {
    filtersPanel: 'filters-panel',
    resultsPanel: 'results-panel',
    toggleFilters: 'toggle-filters',
    toggleResults: 'toggle-results',
    activeFiltersBadge: 'active-filters-badge',
    activeFiltersCount: 'active-filters-count',
    resultsCounter: 'results-counter',
    resultsCount: 'results-count',
    uniqueResultsCounter: 'unique-results-counter',
    uniqueResultsCount: 'unique-results-count',
    clearAllBtn: 'clear-all-btn',
    layerButton: 'map-layer-selector',
    markersButton: 'map-markers-selector',
    bottomNav: 'bottom-nav',
    bottomNavContent: 'bottom-nav-content',
    toggleLegendBtn: 'toggle-legend-btn'
};

export class NavBarRenderer {
    constructor() {
        this.state = new NavBarState();
        this.elements = {};
        this.popups = {};
        this.mobileMenu = null;
        this.cleanupFns = [];
        
        this.init();
    }

    // Getters per accesso globale
    get config() { 
        return window.ledaSearch?.config; 
    }

    get mapInstance() { 
        return window.ledaSearch?.mapInstance; 
    }

    get currentFilters() { 
        const state = window.ledaSearch?.stateManager?.state || 
                    window.ledaSearch?.filterManager?.stateManager?.state;
        
        return state?.filters || {};
    }

    get currentQuery() { 
        const state = window.ledaSearch?.stateManager?.state || 
                    window.ledaSearch?.filterManager?.stateManager?.state;
        return state?.query || ''; 
    }

    init() {
        try {
            this.initElements();
            this.initState();
            this.bindEvents();
            this.initPopups();
            this.initMobileMenu();
        } catch (error) {
            console.error('NavBarRenderer: Initialization error', error);
        }
    }

    initElements() {
        this.elements = Object.fromEntries(
            Object.entries(ELEMENT_IDS).map(([key, id]) => [
                key, 
                document.getElementById(id)
            ])
        );
    }

    initState() {
        // Sottoscrivi ai cambiamenti di stato
        const unsubscribe = this.state.subscribe((changes) => this.onStateChange(changes));
        this.cleanupFns.push(unsubscribe);

        // Inizializza stato pannelli
        this.elements.filtersPanel?.setAttribute('data-open', 'true');
        this.elements.resultsPanel?.setAttribute('data-open', 'true');
        this.elements.toggleFilters?.setAttribute('data-active', 'true');
        this.elements.toggleResults?.setAttribute('data-active', 'true');
        
        // se non ci sono filtri attivi non mostra il badge "attivi"
        if (this.state.activeFiltersCount === 0) {
            this.elements.activeFiltersBadge?.classList.add('hidden');
            this.elements.clearAllBtn?.classList.add('hidden');
        }
    }

    onStateChange(changes) {
        // Aggiorna UI in base ai cambiamenti di stato
        if ('activeFiltersCount' in changes) {
            this.updateFiltersUI(changes.activeFiltersCount.new);
        }

        if ('resultsCount' in changes || 'uniqueResultsCount' in changes) {
            this.updateResultsUI(
                this.state.resultsCount, 
                this.state.uniqueResultsCount
            );
        }

        if ('isFiltersOpen' in changes) {
            this.updatePanelUI('filters', changes.isFiltersOpen.new);
        }

        if ('isResultsOpen' in changes) {
            this.updatePanelUI('results', changes.isResultsOpen.new);
        }

        // Emetti eventi personalizzati
        this.emitStateChanges(changes);
    }

    updateFiltersUI(count) {
        if (this.elements.activeFiltersCount) {
            this.elements.activeFiltersCount.textContent = count;
        }
        
        this.elements.activeFiltersBadge?.setAttribute('data-visible', count > 0);
        this.elements.clearAllBtn?.setAttribute('data-visible', count > 0);
    }

    updateResultsUI(resultsCount, uniqueResultsCount) {
        if (this.elements.resultsCount) {
            this.elements.resultsCount.textContent = resultsCount;
        }
        
        this.elements.resultsCounter?.setAttribute('data-visible', resultsCount > 0);
        
        // Gestisci contatore risultati unici
        let uniqueEl = this.elements.uniqueResultsCount;
        
        if (!uniqueEl && uniqueResultsCount > 0 && this.elements.resultsCounter) {
            uniqueEl = document.createElement('span');
            uniqueEl.id = ELEMENT_IDS.uniqueResultsCount;
            uniqueEl.className = 'ml-2 text-xs text-gray-600 bg-blue-100 px-2 py-1 rounded-full';
            this.elements.resultsCounter.appendChild(uniqueEl);
            this.elements.uniqueResultsCount = uniqueEl;
        }
        
        if (uniqueEl) {
            uniqueEl.textContent = `${uniqueResultsCount}`;
            uniqueEl.setAttribute('data-visible', uniqueResultsCount > 0);
        }
    }

    updatePanelUI(panelType, isOpen) {
        const config = this.getPanelConfig(panelType);
        if (!config) return;

        config.panel?.setAttribute('data-open', isOpen);
        config.button?.setAttribute('data-active', isOpen);
    }

    emitStateChanges(changes) {
        Object.entries(changes).forEach(([key, change]) => {
            const eventMap = {
                activeFiltersCount: 'activeFiltersChanged',
                resultsCount: 'resultsCountChanged',
                isFiltersOpen: 'panelToggled',
                isResultsOpen: 'panelToggled'
            };

            const eventName = eventMap[key];
            if (eventName) {
                document.dispatchEvent(new CustomEvent(`navbar:${eventName}`, {
                    detail: { 
                        type: key.replace('is', '').replace('Open', '').toLowerCase(),
                        ...change 
                    }
                }));
            }
        });
    }

    bindEvents() {
        this.bindElement(this.elements.toggleFilters, () => this.togglePanel('filters'));
        this.bindElement(this.elements.toggleResults, () => this.togglePanel('results'));
        this.bindElement(this.elements.clearAllBtn, () => this.clearAllFilters());
    }

    bindElement(element, handler) {
        if (!element) return;
        
        element.addEventListener('click', handler);
        this.cleanupFns.push(() => element.removeEventListener('click', handler));
    }

    initPopups() {
        DOMUtils.waitForGlobal('ledaSearch', () => {
            this.popups.activeFilters = new ActiveFiltersPopupManager(this);
            this.popups.activeFilters.init();

            if (this.config?.map?.tileLayers) {
                this.popups.layers = new LayerSelectionPopupManager(this.config.map.tileLayers);
                this.popups.layers.init();
            }

            if (this.mapInstance) {
                this.popups.markers = new MarkersSelectionPopupManager(this.mapInstance);
                this.popups.markers.init();

                // Init legend con delay
                setTimeout(() => {
                    this.popups.legend = new LegendPopupManager(this);
                    this.popups.legend.init();
                }, 5000);
            }
        });
    }

    initMobileMenu() {
        this.mobileMenu = new MobileMenuManager(this.elements);
        this.cleanupFns.push(() => this.mobileMenu?.destroy());
    }

    // API Pubbliche

    updateFromSearchState(searchState, resultsCount = 0, options = {}) {
        if (!searchState) return;

        let filtersCount = FilterUtils.calculateActiveFiltersCount(searchState.filters);
        if (searchState.query?.trim()) filtersCount += 1;

        this.state.update({
            activeFiltersCount: filtersCount,
            resultsCount: resultsCount,
            uniqueResultsCount: options.uniqueResultsCount || 0
        });
    }

    updateFilters(count) {
        this.state.update({ activeFiltersCount: count });
    }

    updateResults(count, uniqueCount = 0) {
        this.state.update({ 
            resultsCount: count,
            uniqueResultsCount: uniqueCount 
        });
    }

    togglePanel(panelType) {
        const key = `is${panelType.charAt(0).toUpperCase() + panelType.slice(1)}Open`;
        this.state.update({ [key]: !this.state[key] });
    }

    getPanelConfig(panelType) {
        const configs = {
            filters: { 
                panel: this.elements.filtersPanel, 
                button: this.elements.toggleFilters 
            },
            results: { 
                panel: this.elements.resultsPanel, 
                button: this.elements.toggleResults 
            }
        };
        return configs[panelType];
    }

    closeAllPanels() {
        this.state.update({
            isFiltersOpen: false,
            isResultsOpen: false
        });
    }

    clearAllFilters() {
        // Chiudi popup attivi
        Object.values(this.popups).forEach(popup => popup?.hide());

        // Reset stato
        this.state.update({
            activeFiltersCount: 0,
            resultsCount: 0,
            uniqueResultsCount: 0
        });

        // Emetti evento
        document.dispatchEvent(new CustomEvent('navbar:clearAllFilters', {
            detail: {
                resetInterface: true,
                clearSearch: true,
                clearFacets: true,
                clearMap: true
            }
        }));

        // Reset interfaccia con delay
        setTimeout(() => {
            ResetUtils.resetFacetsInterface();
            ResetUtils.clearSearchInput();
        }, 100);

        NotificationUtils.show('Tutti i filtri sono stati rimossi', 'success', 2000);
    }

    // Utility Methods

    getState() {
        return {
            ...this.state.getSnapshot(),
            currentFilters: this.currentFilters,
            currentQuery: this.currentQuery,
            config: this.config,
            mapInstance: this.mapInstance
        };
    }

    setState(updates) {
        const stateUpdates = {};
        
        Object.entries(updates).forEach(([key, value]) => {
            if (this.state.hasOwnProperty(key)) {
                stateUpdates[key] = value;
            } else if (['currentFilters', 'currentQuery', 'config', 'mapInstance'].includes(key)) {
                console.warn(`NavBarRenderer: ${key} è read-only`);
            }
        });

        if (Object.keys(stateUpdates).length > 0) {
            this.state.update(stateUpdates);
        }
    }

    addEventListener(eventName, handler) {
        document.addEventListener(`navbar:${eventName}`, handler);
    }

    removeEventListener(eventName, handler) {
        document.removeEventListener(`navbar:${eventName}`, handler);
    }

    showNotification(message, type = 'info', duration = 3000) {
        NotificationUtils.show(message, type, duration);
    }

    resetInterface() {
        this.state.reset();
        Object.values(this.popups).forEach(popup => popup?.hide());
        ResetUtils.resetFacetsInterface();
        ResetUtils.clearSearchInput();
    }

    destroy() {
        // Cleanup di tutti i listener e risorse
        this.cleanupFns.forEach(cleanup => cleanup());
        Object.values(this.popups).forEach(popup => popup?.destroy());
        
        this.cleanupFns = [];
        this.elements = {};
        this.popups = {};
        this.mobileMenu = null;
    }
}

// Esporta istanza singleton
export const navBarRenderer = new NavBarRenderer();