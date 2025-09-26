/**
 * Constants and configuration for NavBar components
 */

export const DOM_SELECTORS = {
    FILTERS_PANEL: 'filters-panel',
    RESULTS_PANEL: 'results-panel',
    TOGGLE_FILTERS: 'toggle-filters',
    TOGGLE_RESULTS: 'toggle-results',
    ACTIVE_FILTERS_BADGE: 'active-filters-badge',
    ACTIVE_FILTERS_COUNT: 'active-filters-count',
    RESULTS_COUNTER: 'results-counter',
    RESULTS_COUNT: 'results-count',
    UNIQUE_RESULTS_COUNTER: 'unique-results-counter',
    UNIQUE_RESULTS_COUNT: 'unique-results-count',
    CLEAR_ALL_BTN: 'clear-all-btn',
    LAYER_BUTTON: 'map-layer-selector',
    MARKERS_BUTTON: 'map-markers-selector',
    FACETS_CONTAINER: 'facets-container'
};

export const CSS_CLASSES = {
    PANEL_CLOSED: 'panel-closed',
    PANEL_CLOSED_RIGHT: 'panel-closed-right',
    PANEL_OPEN: 'panel-open',
    ACTIVE: 'active',
    HIDDEN: 'hidden'
};

export const POPUP_SETTINGS = {
    Z_INDEX: '9999',
    MAX_WIDTH: 288,
    OFFSET: 10,
    TIMEOUT: 10000
};

export const NOTIFICATION_TYPES = {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info'
};

export const MARKER_TYPES = {
    CLUSTERS: {
        id: 'clusters',
        name: 'Clusters geografici',
        description: 'Raggruppamenti dinamici'
    },
    PINS: {
        id: 'pins',
        name: 'Pin con numeri',
        description: 'Pin con conteggio occorrenze'
    },
    CIRCLES: {
        id: 'circles',
        name: 'Cerchi Proporzionali',
        description: 'Cerchi con diametro basato su occorrenze'
    }
};

export const SEARCH_INPUT_SELECTORS = [
    '#search-input',
    '#query-input', 
    '.search-input',
    'input[type="search"]',
    'input[placeholder*="search" i]',
    'input[placeholder*="cerca" i]'
];

export const EVENT_NAMES = {
    ACTIVE_FILTERS_CHANGED: 'activeFiltersChanged',
    RESULTS_COUNT_CHANGED: 'resultsCountChanged',
    PANEL_TOGGLED: 'panelToggled',
    CLEAR_ALL_FILTERS: 'clearAllFilters',
    LAYER_CHANGED: 'layerChanged',
    MARKER_TYPE_CHANGED: 'markerTypeChanged'
};

export const RESPONSIVE_BREAKPOINTS = {
    MOBILE: 768
};

export const ANIMATION_DELAYS = {
    FACETS_RESET: 100,
    NOTIFICATION_DURATION: 2000
};