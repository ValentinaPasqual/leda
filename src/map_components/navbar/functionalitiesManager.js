/**
 * Base Popup Manager
 */
import { DOMUtils, PositionUtils, EventUtils } from './navbarUtils.js';

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
        const { currentFilters, currentQuery, config } = this.navBar;

        if (!currentFilters || Object.keys(currentFilters).length === 0) {
            return `
                <div class="flex items-center p-4 rounded-lg bg-gray-50">
                    <span class="text-sm text-gray-700">Nessun filtro attivo</span>
                </div>
            `;
        }

        let content = '';

        // Add search query if present
        if (currentQuery && currentQuery.trim()) {
            content += `
                <div class="mb-3 p-3 rounded-lg bg-primary-50 border border-primary-100">
                    <div class="flex items-center">
                        <svg class="w-4 h-4 text-primary-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                        <div class="flex-1 min-w-0">
                            <span class="text-sm font-medium text-primary-700">Ricerca:</span>
                            <span class="text-sm text-primary-600 ml-1 font-mono bg-primary-100 px-2 py-1 rounded text-xs">"${DOMUtils.escapeHtml(currentQuery)}"</span>
                        </div>
                    </div>
                </div>
            `;
        }

        // Group filters by category
        const groupedFilters = this.groupFiltersByCategory();
        
        Object.entries(groupedFilters).forEach(([categoryLabel, filterItems]) => {
            content += this.buildCategorySection(categoryLabel, filterItems);
        });

        return content || `
            <div class="flex items-center p-4 rounded-lg bg-gray-50">
                <span class="text-sm text-gray-700">Nessun filtro attivo</span>
            </div>
        `;
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
            <div class="mb-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
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
            this.updateButtonText(this.currentLayerName);
        }
    }

    createPopup() {
        const popup = this.createBasePopup('Seleziona Layer');
        
        const content = document.createElement('div');
        content.className = 'space-y-1 max-h-64 overflow-y-auto overflow-x-hidden mb-3 p-3 rounded-lg bg-gray-50 border border-gray-200';
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
        this.updateButtonText(layerName);
        
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

    updateButtonText(layerName) {
        const icon = this.triggerElement.querySelector('i') || this.triggerElement.querySelector('.icon');
        
        if (icon) {
            this.triggerElement.innerHTML = '';
            this.triggerElement.appendChild(icon);
            this.triggerElement.appendChild(document.createTextNode('Strati cartografici'));
        } else {
            this.triggerElement.textContent = layerName;
        }
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
    }

    init() {
        super.init();
        if (this.triggerElement) {
            this.triggerElement.title = 'Clicca per cambiare tipo di marker';
            this.updateButtonText(this.markerTypes[this.currentMarkerType].name);
        }
    }

    createPopup() {
        const popup = this.createBasePopup('Tipo di Marker');
        
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
                <svg class="w-4 h-4 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"></path>
                </svg>
            `,
            'pins': `
                <svg class="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path>
                </svg>
            `,
            'circles': `
                <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
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
        this.updateButtonText(this.markerTypes[markerType].name);
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

    updateButtonText(markerName) {
        const icon = this.triggerElement.querySelector('i') || this.triggerElement.querySelector('.icon');
        
        if (icon) {
            this.triggerElement.innerHTML = '';
            this.triggerElement.appendChild(icon);
            this.triggerElement.appendChild(document.createTextNode(` ${markerName}`));
        } else {
            this.triggerElement.textContent = markerName;
        }
    }
}