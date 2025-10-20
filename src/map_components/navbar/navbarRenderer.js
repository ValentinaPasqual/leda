/**
 * Navigation Bar Renderer - Ottimizzato con conteggi corretti
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
    filtersPanel: 'filters-panel', // Bottone pannello filtri
    resultsPanel: 'results-panel', // Bottone pannello Riferimenti
    toggleFilters: 'toggle-filters', // Avvia pannello filtri
    toggleResults: 'toggle-results', // Avvia pannello Riferimenti
    activeFiltersBadge: 'active-filters-badge', // badge con conteggio filtri attivi 
    activeFiltersCount: 'active-filters-count', // numero conteggio filtri attivi
    mentionsCounter: 'mentions-counter',  // numero conteggio menzioni di luoghi in riferimenti
    mentionsCount: 'mentions-count',  // conteggio menzioni di luoghi in riferimenti     
    resultsCounter: 'results-counter',  // numero conteggio riferimenti unici
    resultsCount: 'results-count',  // conteggio riferimenti unici
    uniqueResultsCounter: 'unique-results-counter', // numero conteggio luoghi (unici)
    uniqueResultsCount: 'unique-results-count', // conteggio luoghi (unici)
    clearAllBtn: 'clear-all-btn', // bottone cancella tuti i filtri
    layerButton: 'map-layer-selector', // bottone per scegliere layer mappa
    markersButton: 'map-markers-selector', // bottone per selettore tipo di marker
    bottomNav: 'bottom-nav', // contenitore barra di navigazione
    bottomNavContent: 'bottom-nav-content', // contenuto barra di navigazione
    toggleLegendBtn: 'toggle-legend-btn' // bottone legenda
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
            this.initTooltip(); 
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
        
        // se non ci sono filtri attivi non mostra il badge "attivi" e "cancella"
        if (this.state.activeFiltersCount === 0) {
            this.elements.activeFiltersBadge?.classList.add('hidden');
            this.elements.clearAllBtn?.classList.add('hidden');
        }
    }

    onStateChange(changes) {
        if ('activeFiltersCount' in changes) {
            this.updateFiltersUI(changes.activeFiltersCount.new);
        }

        if ('resultsCount' in changes || 'uniqueResultsCount' in changes || 'mentionsCount' in changes) {
            this.updateResultsUI(
                this.state.mentionsCount || 0,      // Menzioni totali
                this.state.uniqueResultsCount || 0, // Riferimenti (pivot_IDs)
                this.state.resultsCount || 0        // Luoghi (locations)
            );
        }

        if ('isFiltersOpen' in changes) {
            this.updatePanelUI('filters', changes.isFiltersOpen.new);
        }

        if ('isResultsOpen' in changes) {
            this.updatePanelUI('results', changes.isResultsOpen.new);
        }

        this.emitStateChanges(changes);
    }

    updateFiltersUI(count) {
        if (this.elements.activeFiltersCount) {
            this.elements.activeFiltersCount.textContent = count;
        }
        
        // Mostra/nascondi badge e bottone "cancella"
        if (count > 0) {
            this.elements.activeFiltersBadge?.classList.remove('hidden');
            this.elements.clearAllBtn?.classList.remove('hidden');
        } else {
            this.elements.activeFiltersBadge?.classList.add('hidden');
            this.elements.clearAllBtn?.classList.add('hidden');
        }
        
        this.elements.activeFiltersBadge?.setAttribute('data-visible', count > 0);
        this.elements.clearAllBtn?.setAttribute('data-visible', count > 0);
    }

    updateResultsUI(mentionsCount, pivotIdsCount, locationsCount) {
        // 1. MENZIONI (totale risultati)
        if (this.elements.mentionsCount) {
            this.elements.mentionsCount.textContent = mentionsCount;
        }
        if (this.elements.mentionsCounter) {
            this.elements.mentionsCounter.style.display = mentionsCount > 0 ? '' : 'none';
        }
        
        // 2. LUOGHI (locations uniche)
        if (this.elements.resultsCount) {
            this.elements.resultsCount.textContent = locationsCount;
        }
        if (this.elements.resultsCounter) {
            this.elements.resultsCounter.style.display = locationsCount > 0 ? '' : 'none';
        }
        
        // 3. RIFERIMENTI (pivot_IDs unici)
        if (this.elements.uniqueResultsCount) {
            this.elements.uniqueResultsCount.textContent = pivotIdsCount;
        }
        if (this.elements.uniqueResultsCounter) {
            this.elements.uniqueResultsCounter.style.display = pivotIdsCount > 0 ? '' : 'none';
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

    /**
     * Aggiorna i contatori dalla ricerca
     * @param {Object} searchState - Stato della ricerca
     * @param {Array} results - Array dei risultati
     * @param {Object} options - Opzioni aggiuntive
     */
    updateFromSearchState(searchState, results = [], options = {}) {
        if (!searchState) return;

        let filtersCount = FilterUtils.calculateActiveFiltersCount(searchState.filters);
        if (searchState.query?.trim()) filtersCount += 1;

        const counts = this.calculateUniqueCounts(results);

        this.state.update({
            activeFiltersCount: filtersCount,
            mentionsCount: counts.totalMentions,      // MENZIONI
            resultsCount: counts.uniqueLocations,     // LUOGHI
            uniqueResultsCount: counts.uniquePivotIds // RIFERIMENTI
        });
    }

    /**
     * Calcola conteggi unici dai risultati
     * @param {Array} results - Array di risultati
     * @returns {Object} Oggetto con uniquePivotIds, uniqueLocations e totalMentions
     */
    calculateUniqueCounts(results) {
        if (!Array.isArray(results) || results.length === 0) {
            return { 
                uniquePivotIds: 0, 
                uniqueLocations: 0,
                totalMentions: 0 
            };
        }

        const pivotIds = new Set();
        const locations = new Set();

        results.forEach(result => {
            // Aggiungi pivot_ID unico
            if (result.pivot_ID) {
                pivotIds.add(result.pivot_ID);
            }

            // Aggiungi Location unica (con la L maiuscola!)
            if (result.Location) {
                locations.add(result.Location);
            }
        });

        console.log('✅ CONTEGGI:', {
            totalMentions: results.length,
            uniquePivotIds: pivotIds.size,
            uniqueLocations: locations.size,
            'pivot_IDs': Array.from(pivotIds),
            'Locations': Array.from(locations)
        });

        return {
            uniquePivotIds: pivotIds.size,      // Riferimenti unici
            uniqueLocations: locations.size,    // Luoghi unici
            totalMentions: results.length       // Menzioni totali
        };
    }

    updateFilters(count) {
        this.state.update({ activeFiltersCount: count });
    }

    // Inizializza il tooltip del counter 
    initTooltip() {
        const resultsCounter = this.elements.resultsCounter;
        if (!resultsCounter) return;

        // Crea tooltip come elemento separato nel body
        const tooltip = document.createElement('div');
        tooltip.id = 'results-counter-tooltip';
        tooltip.className = 'fixed px-4 py-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl whitespace-nowrap opacity-0 pointer-events-none transition-opacity duration-200';
        tooltip.style.zIndex = '99999';
        tooltip.innerHTML = `
            <div class="space-y-1">
                <div><strong class="text-yellow-300">Menzioni:</strong> Numero delle menzioni di luoghi nei riferimenti</div>
                <div><strong class="text-green-300">Luoghi:</strong> Numero di luoghi unici menzionati</div>
                <div><strong class="text-blue-300">Riferimenti:</strong> Numero di riferimenti che menzionano i luoghi</div>
            </div>
            <div class="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                <div class="border-4 border-transparent border-t-gray-900"></div>
            </div>
        `;
        document.body.appendChild(tooltip);

        // Funzione per posizionare il tooltip
        const positionTooltip = () => {
            const rect = resultsCounter.getBoundingClientRect();
            tooltip.style.left = `${rect.left + rect.width / 2}px`;
            tooltip.style.top = `${rect.top - 10}px`;
            tooltip.style.transform = 'translate(-50%, -100%)';
        };

        // Event listeners
        resultsCounter.addEventListener('mouseenter', () => {
            positionTooltip();
            tooltip.style.opacity = '1';
        });

        resultsCounter.addEventListener('mouseleave', () => {
            tooltip.style.opacity = '0';
        });

        // Aggiorna posizione su scroll/resize
        window.addEventListener('scroll', positionTooltip);
        window.addEventListener('resize', positionTooltip);

        // Cleanup
        this.cleanupFns.push(() => {
            tooltip.remove();
            window.removeEventListener('scroll', positionTooltip);
            window.removeEventListener('resize', positionTooltip);
        });
    }

    /**
     * Aggiorna i contatori dei risultati
     * @param {number} pivotIdsCount - Numero di pivot_IDs unici (Riferimenti)
     * @param {number} locationsCount - Numero di locations uniche (Luoghi)
     */
    updateResults(pivotIdsCount, locationsCount = 0) {
        this.state.update({ 
            resultsCount: pivotIdsCount,        // Riferimenti
            uniqueResultsCount: locationsCount  // Luoghi
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