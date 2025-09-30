/**
 * Base Popup Manager
 */
import { DOMUtils, PositionUtils, EventUtils } from './navbarUtils.js';
import { FilterBadgesRenderer } from '../../utils/filterBadgesRenderer.js';

class BasePopupManager {
    constructor(triggerId, popupId) {
        this.triggerId = triggerId;
        this.popupId = popupId;
        this.triggerElement = null;
        this.isOpen = false;
        this.outsideClickHandler = null;
        this.escapeKeyHandler = null;
    }

    init() {
        this.triggerElement = document.getElementById(this.triggerId);
        if (!this.triggerElement) {
            console.warn(`Trigger element ${this.triggerId} not found`);
            return;
        }

        this.triggerElement.style.cursor = 'pointer';
        this.triggerElement.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle();
        });
    }

    toggle() {
        if (this.isOpen) {
            this.hide();
        } else {
            this.show();
        }
    }

    show() {
        if (this.isOpen) return;

        const popup = this.createPopup();
        if (!popup) return;

        document.body.appendChild(popup);
        this.isOpen = true;

        this.bindEvents(popup);
    }

    hide() {
        const popup = document.getElementById(this.popupId);
        if (popup && popup.parentNode) {
            popup.parentNode.removeChild(popup);
        }

        this.cleanup();
        this.isOpen = false;
    }

    createPopup() {
        // To be implemented by subclasses
        throw new Error('createPopup must be implemented by subclass');
    }

    bindEvents(popup) {
        // Close button
        const closeBtn = popup.querySelector(`#close-${this.popupId}`);
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hide());
        }

        // Outside click handler
        this.outsideClickHandler = EventUtils.createOutsideClickHandler(
            popup, 
            this.triggerElement, 
            () => this.hide()
        );
        document.addEventListener('click', this.outsideClickHandler);

        // Escape key handler
        this.escapeKeyHandler = EventUtils.createEscapeKeyHandler(() => this.hide());
        document.addEventListener('keydown', this.escapeKeyHandler);
    }

    cleanup() {
        if (this.outsideClickHandler) {
            document.removeEventListener('click', this.outsideClickHandler);
            this.outsideClickHandler = null;
        }
        if (this.escapeKeyHandler) {
            document.removeEventListener('keydown', this.escapeKeyHandler);
            this.escapeKeyHandler = null;
        }
    }

    createBasePopup(title) {
        const popup = document.createElement('div');
        popup.id = this.popupId;
        popup.className = 'fixed p-2 w-72 max-w-sm bg-white rounded-lg shadow-2xl border border-gray-200 max-h-96 overflow-hidden';
        popup.style.zIndex = '9999';

        PositionUtils.positionPopup(popup, this.triggerElement);

        const header = document.createElement('div');
        header.className = 'flex items-center justify-between mb-2';
        header.innerHTML = `
            <h3 class="p-2 text-sm font-semibold text-gray-800">${title}</h3>
            <button id="close-${this.popupId}" class="absolute top-2 right-2 p-1.5 bg-pink-100 hover:bg-pink-200 active:bg-pink-200 rounded-full text-red-500 shadow-md hover:shadow-lg group">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        `;

        popup.appendChild(header);
        return popup;
    }

    destroy() {
        this.hide();
        this.cleanup();
    }
}

/**
 * Active Filters Popup Manager
 */
export class ActiveFiltersPopupManager extends BasePopupManager {
    constructor(navBarInstance) {
        super('active-filters-badge', 'active-filters-popup');
        this.navBar = navBarInstance;
    }

    init() {
        super.init();
        if (this.triggerElement) {
            this.triggerElement.title = 'Clicca per vedere i filtri attivi';
        }
    }

    createPopup() {
        const popup = this.createBasePopup('Filtri Attivi');
        
        const content = document.createElement('div');
        content.className = 'space-y-1 max-h-64 overflow-y-auto overflow-x-hidden';
        content.innerHTML = this.buildFiltersContent();

        popup.appendChild(content);
        return popup;
    }


    buildFiltersContent() {
    const searchState = {
        query: this.navBar.currentQuery,
        filters: this.navBar.currentFilters
    };
    console.log('NAVBAR - searchState:', searchState);
    
    const renderer = new FilterBadgesRenderer(this.navBar.config);
    return renderer.render(searchState);
    }

    groupFiltersByCategory() {
        const { currentFilters, config } = this.navBar;
        const groupedFilters = {};

        Object.entries(currentFilters).forEach(([facetKey, values]) => {
            if (!values || (Array.isArray(values) && values.length === 0)) return;
            
            const facetLabel = this.getFacetLabel(facetKey);
            
            if (!groupedFilters[facetLabel]) {
                groupedFilters[facetLabel] = [];
            }
            
            this.processFilterValues(groupedFilters[facetLabel], values, facetKey);
        });

        return groupedFilters;
    }

    processFilterValues(filterItems, values, facetKey) {
        if (Array.isArray(values)) {
            if (values.length === 2 && 
                typeof values[0] === 'number' && 
                typeof values[1] === 'number') {
                filterItems.push({
                    type: 'range',
                    value: this.formatRangeFilter({ min: values[0], max: values[1] }),
                    facetKey
                });
            } else {
                values.forEach(value => {
                    filterItems.push({
                        type: 'value',
                        value: value,
                        facetKey
                    });
                });
            }
        } else if (typeof values === 'object') {
            filterItems.push({
                type: 'range',
                value: this.formatRangeFilter(values),
                facetKey
            });
        }
    }

    buildCategorySection(categoryLabel, filterItems) {
        let section = `
            <div class="mb-3 p-3">
                <div class="flex items-start">
                    <div class="w-2 h-2 rounded-full bg-indigo-500 mt-2 mr-3 flex-shrink-0"></div>
                    <div class="flex-1 min-w-0">
                        <h4 class="text-sm font-semibold text-gray-800 mb-2">${categoryLabel}</h4>
                        <div class="flex flex-wrap gap-1.5">
        `;
        
        filterItems.forEach((item) => {
            const isRange = item.type === 'range';
            const bgColor = isRange ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-indigo-100 text-indigo-700 border-indigo-200';
            const icon = this.getFilterIcon(isRange);
            
            section += `
                <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${bgColor} hover:shadow-sm">
                    ${icon}
                    ${DOMUtils.escapeHtml(item.value)}
                </span>
            `;
        });
        
        section += `
                        </div>
                    </div>
                </div>
            </div>
        `;

        return section;
    }

    getFilterIcon(isRange) {
        return isRange ? 
            `<svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
            </svg>` :
            `<svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>`;
    }

    getFacetLabel(facetKey) {
        const { config } = this.navBar;
        if (config && config.aggregations && config.aggregations[facetKey]) {
            return config.aggregations[facetKey].title || facetKey;
        }
        return facetKey.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

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
}

/**
 * Legend Popup Manager
 */
/**
 * Legend Popup Manager con tooltip Tailwind migliorati
 */
export class LegendPopupManager extends BasePopupManager {
    constructor(navBarInstance) {
        super('toggle-legend-btn', 'map-legend-popup');
        this.navBar = navBarInstance;
    }

    init() {
        super.init();
        if (this.triggerElement) {
            this.triggerElement.title = 'Clicca per vedere leggere la legenda';
        }
    }

    // Get first element safely
    getElement(selector, fallback = '') {
        const element = document.querySelector(selector);
        if (element) {
            // Clone to avoid moving original
            const clone = element.cloneNode(true);
            // Remove IDs to avoid duplicates
            clone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
            if (clone.hasAttribute('id')) clone.removeAttribute('id');
            return clone;
        }
        return document.createTextNode(fallback);
    }

    // Tooltip builder using DOM nodes (keeps buttons, SVGs, etc.)
    tooltip(text, contentNode, position = 'top') {
        const positions = {
            top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
            bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
            left: 'right-full top-1/2 -translate-y-1/2 mr-2',
            right: 'left-full top-1/2 -translate-y-1/2 ml-2'
        };

        const arrows = {
            top: 'top-full left-1/2 -translate-x-1/2 border-l-8 border-r-8 border-t-8 border-transparent border-t-gray-900',
            bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-8 border-r-8 border-b-8 border-transparent border-b-gray-900',
            left: 'left-full top-1/2 -translate-y-1/2 border-t-8 border-b-8 border-l-8 border-transparent border-l-gray-900',
            right: 'right-full top-1/2 -translate-y-1/2 border-t-8 border-b-8 border-r-8 border-transparent border-r-gray-900'
        };

        // Wrapper
        const wrapper = document.createElement('span');
        wrapper.className = 'relative inline-block group cursor-help';

        // Trigger text
        const trigger = document.createElement('span');
        trigger.className = 'text-blue-600 underline decoration-dotted underline-offset-2 hover:text-blue-800 transition-colors';
        trigger.textContent = text;
        wrapper.appendChild(trigger);

        // Tooltip container
        const container = document.createElement('div');
        container.className = `absolute ${positions[position]} z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 delay-100`;

        const tooltipBox = document.createElement('div');
        tooltipBox.className = 'bg-gray-900 text-white text-sm rounded-lg py-2 px-3 max-w-xs shadow-xl whitespace-normal relative';

        // Append actual DOM content
        tooltipBox.appendChild(contentNode.cloneNode(true));

        // Arrow
        const arrow = document.createElement('div');
        arrow.className = `absolute w-0 h-0 ${arrows[position]}`;
        tooltipBox.appendChild(arrow);

        container.appendChild(tooltipBox);
        wrapper.appendChild(container);

        return wrapper;
    }

    createPopup() {
        const popup = this.createBasePopup('Legenda');

        const content = document.createElement('div');
        content.className = 'space-y-4 max-h-64 overflow-y-auto overflow-x-visible mb-3 p-3';

        // Grab DOM elements
        const pin = this.getElement('.leaflet-marker-icon svg', document.createTextNode('Pin'));
        const filtri = this.getElement('#toggle-filters', document.createTextNode('Filtri'));
        const categorie = this.getElement('h3.facet-category-title', document.createTextNode('Categoria'));
        const sezioni = this.getElement('.facet-header h3', document.createTextNode('Sezione'));
        const opzioni = this.getElement('label.facet-option', document.createTextNode('Opzione'));
        const results = this.getElement('#toggle-results', document.createTextNode('Riferimenti'));
        const resultsCounter = this.getElement('#results-counter', document.createTextNode('Conteggio riferimenti'));
        const playControls = this.getElement('.play-controls', document.createTextNode('Play Controls'));
        const popupMap = this.getElement('.bg-gradient-to-r .from-secondary-500 .via-secondary-600 .to-primary-600 .text-white .p-3 .relative .overflow-hidden', document.createTextNode('PopUp Map'))

        // Build sections
        const addSection = (htmlText, tooltips = []) => {
            const div = document.createElement('div');
            div.className = 'border-t border-gray-200 pt-3 space-y-2';
            const p = document.createElement('p');
            p.className = 'text-sm text-gray-700 leading-relaxed';
            p.innerHTML = htmlText;
            tooltips.forEach(t => p.appendChild(t));
            div.appendChild(p);
            content.appendChild(div);
        };

        // Intro
        const intro = document.createElement('div');
        intro.className = 'space-y-2';
        const introTitle = document.createElement('p');
        introTitle.className = 'text-sm font-medium text-gray-800';
        introTitle.textContent = 'Legenda della mappa';
        const introDesc = document.createElement('p');
        introDesc.className = 'text-xs text-gray-600';
        introDesc.textContent = 'Mostra i diversi elementi presenti sulla mappa.';
        intro.appendChild(introTitle);
        intro.appendChild(introDesc);
        content.appendChild(intro);

        // Map pin section
        const pinSection = document.createElement('div');
        pinSection.className = 'border-t border-gray-200 pt-3 space-y-2';
        const pinP = document.createElement('p');
        pinP.className = 'text-sm text-gray-700 leading-relaxed';
        pinP.textContent = 'I ';
        pinP.appendChild(this.tooltip('pin della mappa', pin, 'top'));
        pinP.appendChild(document.createTextNode(' indicano i luoghi presenti sulla mappa.'));
        pinSection.appendChild(pinP);
        content.appendChild(pinSection);

        // Filters section
        const filtersSection = document.createElement('div');
        filtersSection.className = 'border-t border-gray-200 pt-3 space-y-2';
        const filtersP = document.createElement('p');
        filtersP.className = 'text-sm text-gray-700 leading-relaxed';
        filtersP.appendChild(document.createTextNode('I '));
        filtersP.appendChild(this.tooltip('filtri', filtri, 'right'));
        filtersP.appendChild(document.createTextNode(' permettono di selezionare elementi rilevanti nella mappa. Sono raggruppati in '));
        filtersP.appendChild(this.tooltip('categorie', categorie, 'top'));
        filtersP.appendChild(document.createTextNode(' come '));
        filtersP.appendChild(this.tooltip('sezioni', sezioni, 'right'));
        filtersP.appendChild(document.createTextNode('. Ciascuno contiene il valore filtrabile e il relativo '));
        filtersP.appendChild(this.tooltip('conteggio', opzioni, 'bottom'));
        filtersP.appendChild(document.createTextNode('.'));
        filtersSection.appendChild(filtersP);

        const playP = document.createElement('p');
        playP.className = 'text-sm text-gray-700 leading-relaxed';
        playP.appendChild(document.createTextNode('I tasti '));
        playP.appendChild(this.tooltip('Play/Pause', playControls, 'top'));
        playP.appendChild(document.createTextNode(' controllano la riproduzione temporale.'));
        filtersSection.appendChild(playP);

        content.appendChild(filtersSection);

        // References section
        const refSection = document.createElement('div');
        refSection.className = 'border-t border-gray-200 pt-3 space-y-2';
        const refP = document.createElement('p');
        refP.className = 'text-sm text-gray-700 leading-relaxed';
        refP.appendChild(document.createTextNode('La sezione '));
        refP.appendChild(this.tooltip('riferimenti', results, 'top'));
        refP.appendChild(document.createTextNode(' mostra tutti i riferimenti ai luoghi presenti nella mappa. Il '));
        refP.appendChild(this.tooltip('contatore', resultsCounter, 'top'));
        refP.appendChild(document.createTextNode(' indica il numero di risultati trovati.'));
        refSection.appendChild(refP);
        content.appendChild(refSection);

        // Popup section
        const popupSection = document.createElement('div');
        popupSection.className = 'border-t border-gray-200 pt-3';
        const popupP = document.createElement('p');
        popupP.className = 'text-sm text-gray-700 leading-relaxed';
        popupP.appendChild(document.createTextNode('Ogni pin sulla mappa apre un '));
        popupP.appendChild(this.tooltip('popup informativo', popupMap, 'top'));
        popupP.appendChild(document.createTextNode(' con dettagli specifici del luogo.'));
        popupSection.appendChild(popupP);
        content.appendChild(popupSection);

        popup.appendChild(content);
        return popup;
    }
}



/**
 * Layer Selection Popup Manager
 */
export class LayerSelectionPopupManager extends BasePopupManager {
    constructor(layers) {
        super('map-layer-selector', 'layer-selection-popup');
        this.layers = layers;
        this.currentLayerName = 'Default';
        this.currentTileLayer = null;
    }

    init() {
        super.init();
        if (this.triggerElement) {
            this.triggerElement.title = 'Clicca per cambiare layer';
        }
    }

    createPopup() {
        const popup = this.createBasePopup('Seleziona uno strato cartografico');
        
        const content = document.createElement('div');
        content.className = 'space-y-1 max-h-64 overflow-y-auto overflow-x-hidden mb-3 p-3';
        content.innerHTML = this.buildLayersContent();

        popup.appendChild(content);
        return popup;
    }

    buildLayersContent() {
        let content = '';
        
        for (let layerName in this.layers) {
            const isSelected = layerName === this.currentLayerName;
            const layerData = this.layers[layerName];
            
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
    }

    bindEvents(popup) {
        super.bindEvents(popup);

        // Layer selection
        const layerItems = popup.querySelectorAll('.layer-item');
        layerItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const layerName = item.dataset.layerName;
                const layerUrl = item.dataset.layerUrl;
                const attribution = item.dataset.layerAttribution;
                
                this.selectLayer(layerName, layerUrl, attribution);
                this.hide();
            });
        });
    }

    selectLayer(layerName, layerUrl, attribution) {
        
        if (this.currentTileLayer && window.map) {
            window.map.removeLayer(this.currentTileLayer);
        }
        
        if (window.L && window.map) {
            this.currentTileLayer = window.L.tileLayer(layerUrl, {
                attribution: attribution,
                maxZoom: 18
            });
            this.currentTileLayer.addTo(window.map);
        }
        
        this.currentLayerName = layerName;
        
        EventUtils.emit('layerChanged', {
            layerName,
            layerUrl,
            attribution
        });
    }
}

/**
 * Markers Selection Popup Manager
 */
export class MarkersSelectionPopupManager extends BasePopupManager {
    constructor(mapInstance) {
        super('map-markers-selector', 'markers-selection-popup');
        this.mapInstance = mapInstance;
        this.currentMarkerType = 'clusters';
        this.markerTypes = {
            'clusters': {
                name: 'Clusters geografici',
                description: 'Raggruppamenti dinamici dei luoghi sulla mappa'
            },
            'pins': {
                name: 'Pin con numeri',
                description: 'Pin con numero dei riferimenti associati'
            },
            'circles': {
                name: 'Cerchi Proporzionali',
                description: 'Cerchi con diametro basato sul numero di riferimenti associati'
            }
        };
    }

    init() {
        super.init();
        if (this.triggerElement) {
            this.triggerElement.title = 'Clicca per cambiare tipo di marcatore';
        }
    }

    createPopup() {
        const popup = this.createBasePopup('Seleziona un tipo di marcatore');
        
        const content = document.createElement('div');
        content.className = 'space-y-1 max-h-64 overflow-y-auto overflow-x-hidden';
        content.innerHTML = this.buildMarkersContent();

        popup.appendChild(content);
        return popup;
    }

    buildMarkersContent() {
        let content = '';
        
        for (let markerType in this.markerTypes) {
            const isSelected = markerType === this.currentMarkerType;
            const markerData = this.markerTypes[markerType];
            const iconSvg = this.getMarkerIcon(markerType);
            
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
    }

    getMarkerIcon(markerType) {
        const icons = {
            'clusters': `
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 32 32">
                    <path d="M27 21.75c-0.795 0.004-1.538 0.229-2.169 0.616l0.018-0.010-2.694-2.449c0.724-1.105 1.154-2.459 1.154-3.913 0-1.572-0.503-3.027-1.358-4.212l0.015 0.021 3.062-3.062c0.57 0.316 1.249 0.503 1.971 0.508h0.002c2.347 0 4.25-1.903 4.25-4.25s-1.903-4.25-4.25-4.25c-2.347 0-4.25 1.903-4.25 4.25v0c0.005 0.724 0.193 1.403 0.519 1.995l-0.011-0.022-3.062 3.062c-1.147-0.84-2.587-1.344-4.144-1.344-0.868 0-1.699 0.157-2.467 0.443l0.049-0.016-0.644-1.17c0.726-0.757 1.173-1.787 1.173-2.921 0-2.332-1.891-4.223-4.223-4.223s-4.223 1.891-4.223 4.223c0 2.332 1.891 4.223 4.223 4.223 0.306 0 0.605-0.033 0.893-0.095l-0.028 0.005 0.642 1.166c-1.685 1.315-2.758 3.345-2.758 5.627 0 0.605 0.076 1.193 0.218 1.754l-0.011-0.049-0.667 0.283c-0.78-0.904-1.927-1.474-3.207-1.474-2.334 0-4.226 1.892-4.226 4.226s1.892 4.226 4.226 4.226c2.334 0 4.226-1.892 4.226-4.226 0-0.008-0-0.017-0-0.025v0.001c-0.008-0.159-0.023-0.307-0.046-0.451l0.003 0.024 0.667-0.283c1.303 2.026 3.547 3.349 6.1 3.349 1.703 0 3.268-0.589 4.503-1.574l-0.015 0.011 2.702 2.455c-0.258 0.526-0.41 1.144-0.414 1.797v0.001c0 2.347 1.903 4.25 4.25 4.25s4.25-1.903 4.25-4.25c0-2.347-1.903-4.25-4.25-4.25v0zM8.19 5c0-0.966 0.784-1.75 1.75-1.75s1.75 0.784 1.75 1.75c0 0.966-0.784 1.75-1.75 1.75v0c-0.966-0.001-1.749-0.784-1.75-1.75v-0zM5 22.42c-0.966-0.001-1.748-0.783-1.748-1.749s0.783-1.749 1.749-1.749c0.966 0 1.748 0.782 1.749 1.748v0c-0.001 0.966-0.784 1.749-1.75 1.75h-0zM27 3.25c0.966 0 1.75 0.784 1.75 1.75s-0.784 1.75-1.75 1.75c-0.966 0-1.75-0.784-1.75-1.75v0c0.001-0.966 0.784-1.749 1.75-1.75h0zM11.19 16c0-0.001 0-0.002 0-0.003 0-2.655 2.152-4.807 4.807-4.807 1.328 0 2.53 0.539 3.4 1.409l0.001 0.001 0.001 0.001c0.87 0.87 1.407 2.072 1.407 3.399 0 2.656-2.153 4.808-4.808 4.808s-4.808-2.153-4.808-4.808c0-0 0-0 0-0v0zM27 27.75c-0.966 0-1.75-0.784-1.75-1.75s0.784-1.75 1.75-1.75c0.966 0 1.75 0.784 1.75 1.75v0c-0.001 0.966-0.784 1.749-1.75 1.75h-0z"></path>
                </svg>
            `,
            'pins': `
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path>
                </svg>
            `,
            'circles': `
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clip-rule="evenodd"></path>
                </svg>
            `
        };
        return icons[markerType] || icons.clusters;
    }

    bindEvents(popup) {
        super.bindEvents(popup);

        // Marker selection
        const markerItems = popup.querySelectorAll('.marker-item');
        markerItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const markerType = item.dataset.markerType;
                this.selectMarkerType(markerType);
                this.hide();
            });
        });
    }

    selectMarkerType(markerType) {
        this.currentMarkerType = markerType;
        
        // Apply the selected marker type to the map
        if (window.switchMarkerType) {
            window.switchMarkerType(markerType);
        } else if (this.mapInstance && this.mapInstance.switchMarkerType) {
            this.mapInstance.switchMarkerType(markerType);
        } else {
            console.warn('No switchMarkerType function available');
        }
        
        EventUtils.emit('markerTypeChanged', {
            markerType,
            markerName: this.markerTypes[markerType].name
        });
    }
}