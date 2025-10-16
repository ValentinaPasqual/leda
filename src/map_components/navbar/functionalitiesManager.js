/**
 * Popup Managers - Ottimizzato
 * Gestisce tutti i popup della navbar
 */

import { PositionUtils } from './navbarUtils.js';
import { FilterBadgesRenderer } from '../utils/filterBadgesRenderer.js';

const POPUP_CONFIG = {
    zIndex: '9999',
    maxHeight: 'max-h-96',
    contentMaxHeight: 'max-h-64',
    defaultWidth: 'w-72'
};

const ICONS = {
    close: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path>
    </svg>`,
    check: `<svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
    </svg>`
};

/**
 * Base Popup Manager - Classe astratta semplificata
 */
class BasePopupManager {
    constructor(triggerId, popupId) {
        this.triggerId = triggerId;
        this.popupId = popupId;
        this.trigger = null;
        this.isOpen = false;
        this.cleanup = null;
    }

    init() {
        this.trigger = document.getElementById(this.triggerId);
        if (!this.trigger) {
            console.warn(`Trigger element ${this.triggerId} not found`);
            return false;
        }

        this.trigger.style.cursor = 'pointer';
        this.trigger.onclick = (e) => {
            e.stopPropagation();
            this.toggle();
        };
        return true;
    }

    toggle() {
        this.isOpen ? this.hide() : this.show();
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
        popup?.remove();
        this.cleanup?.();
        this.cleanup = null;
        this.isOpen = false;
    }

    bindEvents(popup) {
        // Unified event handler per chiusura
        const closeHandler = (e) => {
            if (e.key === 'Escape' || 
                (e.type === 'click' && !popup.contains(e.target) && !this.trigger.contains(e.target))) {
                this.hide();
            }
        };

        document.addEventListener('keydown', closeHandler);
        document.addEventListener('click', closeHandler);
        
        const closeBtn = popup.querySelector(`#close-${this.popupId}`);
        closeBtn?.addEventListener('click', () => this.hide());

        this.cleanup = () => {
            document.removeEventListener('keydown', closeHandler);
            document.removeEventListener('click', closeHandler);
        };
    }

    createBasePopup(title) {
        const popup = document.createElement('div');
        popup.id = this.popupId;
        popup.className = `fixed p-2 ${POPUP_CONFIG.defaultWidth} max-w-sm bg-white rounded-lg shadow-2xl border border-gray-200 ${POPUP_CONFIG.maxHeight} overflow-hidden`;
        popup.style.zIndex = POPUP_CONFIG.zIndex;

        PositionUtils.positionPopup(popup, this.trigger);

        const header = document.createElement('div');
        header.className = 'flex items-center justify-between mb-2';
        header.innerHTML = `
            <h3 class="p-2 text-sm font-semibold text-gray-800">${title}</h3>
            <button id="close-${this.popupId}" class="absolute top-2 right-2 p-1.5 bg-pink-100 hover:bg-pink-200 rounded-full text-red-500 shadow-md">
                ${ICONS.close}
            </button>
        `;
        
        popup.appendChild(header);
        return popup;
    }

    createPopup() {
        throw new Error('createPopup must be implemented by subclass');
    }

    destroy() {
        this.hide();
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
        const initialized = super.init();
        if (initialized && this.trigger) {
            this.trigger.title = 'Clicca per vedere i filtri attivi';
        }
        return initialized;
    }

    createPopup() {
        const popup = this.createBasePopup('Filtri Attivi');
        
        const content = document.createElement('div');
        content.className = `space-y-1 ${POPUP_CONFIG.contentMaxHeight} overflow-y-auto overflow-x-hidden`;
        
        // Recupera il searchState nello stesso modo della modale
        const searchState = this.getSearchState();
        
        const renderer = new FilterBadgesRenderer(this.navBar.config);
        const filterBadgesHtml = renderer.render(searchState);
        
        if (!filterBadgesHtml || filterBadgesHtml.trim() === '') {
            content.innerHTML = '<div class="p-3 text-sm text-gray-500 italic">Nessun filtro applicato</div>';
        } else {
            content.innerHTML = filterBadgesHtml;
        }
        
        popup.appendChild(content);
        return popup;
    }

    /**
     * Recupera il searchState corrente dal sistema globale
     */
    getSearchState() {
        // Prova prima da window.ledaSearch.state (fonte principale)
        if (window.ledaSearch?.state) {
            return window.ledaSearch.state;
        }
        
        // Fallback: costruisci manualmente
        return {
            query: this.navBar.currentQuery || '',
            filters: this.navBar.currentFilters || {}
        };
    }
}

/**
 * Legend Popup Manager
 */
export class LegendPopupManager extends BasePopupManager {
    constructor(navBarInstance) {
        super('toggle-legend-btn', 'map-legend-popup');
        this.navBar = navBarInstance;
    }

    init() {
        const initialized = super.init();
        if (initialized && this.trigger) {
            this.trigger.title = 'Clicca per leggere la legenda';
        }
        return initialized;
    }

    createPopup() {
        const popup = this.createBasePopup('Legenda');
        
        const content = document.createElement('div');
        content.className = `space-y-4 ${POPUP_CONFIG.contentMaxHeight} overflow-y-auto overflow-x-visible mb-3 p-3`;
        
        content.appendChild(this.createIntroSection());
        content.appendChild(this.createPinSection());
        content.appendChild(this.createFiltersSection());
        content.appendChild(this.createReferencesSection());
        content.appendChild(this.createPopupSection());
        
        popup.appendChild(content);
        return popup;
    }

    getElement(selector, fallback = '') {
        const element = document.querySelector(selector);
        if (!element) return document.createTextNode(fallback);

        const clone = element.cloneNode(true);
        clone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
        if (clone.hasAttribute('id')) clone.removeAttribute('id');
        return clone;
    }

    tooltip(text, contentNode, position = 'top') {
        const wrapper = document.createElement('span');
        wrapper.className = 'relative inline-block group cursor-help';

        const trigger = document.createElement('span');
        trigger.className = 'text-blue-600 underline decoration-dotted underline-offset-2 hover:text-blue-800 transition-colors';
        trigger.textContent = text;
        wrapper.appendChild(trigger);

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

        const container = document.createElement('div');
        container.className = `absolute ${positions[position]} z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 delay-100`;

        const tooltipBox = document.createElement('div');
        tooltipBox.className = 'bg-gray-900 text-white text-sm rounded-lg py-2 px-3 max-w-xs shadow-xl whitespace-normal relative';
        tooltipBox.appendChild(contentNode.cloneNode(true));

        const arrow = document.createElement('div');
        arrow.className = `absolute w-0 h-0 ${arrows[position]}`;
        tooltipBox.appendChild(arrow);

        container.appendChild(tooltipBox);
        wrapper.appendChild(container);

        return wrapper;
    }

    createIntroSection() {
        const intro = document.createElement('div');
        intro.className = 'space-y-2';
        intro.innerHTML = `
            <p class="text-sm font-medium text-gray-800">Legenda della mappa</p>
            <p class="text-xs text-gray-600">Mostra i diversi elementi presenti sulla mappa.</p>
        `;
        return intro;
    }

    createPinSection() {
        const section = document.createElement('div');
        section.className = 'border-t border-gray-200 pt-3 space-y-2';
        
        const p = document.createElement('p');
        p.className = 'text-sm text-gray-700 leading-relaxed';
        p.textContent = 'I ';
        p.appendChild(this.tooltip('pin della mappa', this.getElement('.leaflet-marker-icon svg'), 'top'));
        p.appendChild(document.createTextNode(' indicano i luoghi presenti sulla mappa.'));
        
        section.appendChild(p);
        return section;
    }

    createFiltersSection() {
        const section = document.createElement('div');
        section.className = 'border-t border-gray-200 pt-3 space-y-2';
        
        const p = document.createElement('p');
        p.className = 'text-sm text-gray-700 leading-relaxed';
        p.appendChild(document.createTextNode('I '));
        p.appendChild(this.tooltip('filtri', this.getElement('#toggle-filters'), 'right'));
        p.appendChild(document.createTextNode(' intervengono sul filtraggio sia dei luoghi sulla mappa sia dei riferimenti ad essi associati. Il numero di occorrenze dei filtri rappresenta il numero di volte in cui ciascun luogo è stato menzionato. '));
        
        section.appendChild(p);
        return section;
    }

    createReferencesSection() {
        const section = document.createElement('div');
        section.className = 'border-t border-gray-200 pt-3 space-y-2';
        
        const p = document.createElement('p');
        p.className = 'text-sm text-gray-700 leading-relaxed';
        p.appendChild(document.createTextNode('La sezione '));
        p.appendChild(this.tooltip('riferimenti', this.getElement('#toggle-results'), 'top'));
        p.appendChild(document.createTextNode(' mostra tutti i riferimenti ai luoghi presenti nella mappa.'));
        
        section.appendChild(p);
        return section;
    }

    createPopupSection() {
        const section = document.createElement('div');
        section.className = 'border-t border-gray-200 pt-3';
        
        const p = document.createElement('p');
        p.className = 'text-sm text-gray-700 leading-relaxed';
        p.appendChild(document.createTextNode('Ogni pin sulla mappa apre un '));
        p.appendChild(this.tooltip('popup informativo', this.getElement('.bg-gradient-to-r'), 'top'));
        p.appendChild(document.createTextNode(' con dettagli specifici del luogo.'));
        
        section.appendChild(p);
        return section;
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
        const initialized = super.init();
        if (initialized && this.trigger) {
            this.trigger.title = 'Clicca per cambiare layer';
        }
        return initialized;
    }

    createPopup() {
        const popup = this.createBasePopup('Seleziona uno strato cartografico');
        
        const content = document.createElement('div');
        content.className = `space-y-1 ${POPUP_CONFIG.contentMaxHeight} overflow-y-auto overflow-x-hidden mb-3 p-3`;
        content.innerHTML = this.buildLayersHTML();
        
        // Bind selection events
        content.querySelectorAll('.layer-item').forEach(item => {
            item.addEventListener('click', () => {
                const { layerName, layerUrl, layerAttribution } = item.dataset;
                this.selectLayer(layerName, layerUrl, layerAttribution);
                this.hide();
            });
        });
        
        popup.appendChild(content);
        return popup;
    }

    buildLayersHTML() {
        return Object.entries(this.layers).map(([name, data]) => `
            <div class="layer-item flex items-center justify-between p-2 rounded hover:bg-gray-100 cursor-pointer" 
                data-layer-name="${name}" 
                data-layer-url="${data.tileLayer}"
                data-layer-attribution="${data.attribution}">
                <span class="text-sm text-gray-700">${name}</span>
                ${name === this.currentLayerName ? ICONS.check : ''}
            </div>
        `).join('');
    }

    selectLayer(layerName, layerUrl, attribution) {
        if (this.currentTileLayer && window.map) {
            window.map.removeLayer(this.currentTileLayer);
        }
        
        if (window.L && window.map) {
            this.currentTileLayer = window.L.tileLayer(layerUrl, {
                attribution,
                maxZoom: 18
            });
            this.currentTileLayer.addTo(window.map);
        }
        
        this.currentLayerName = layerName;
        
        document.dispatchEvent(new CustomEvent('layerChanged', {
            detail: { layerName, layerUrl, attribution }
        }));
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
            clusters: {
                name: 'Clusters geografici',
                description: 'Raggruppamenti dinamici dei luoghi',
                icon: this.getClusterIcon()
            },
            pins: {
                name: 'Pin con numeri',
                description: 'Pin con numero dei riferimenti',
                icon: this.getPinIcon()
            },
            circles: {
                name: 'Cerchi Proporzionali',
                description: 'Cerchi con diametro basato sui riferimenti',
                icon: this.getCircleIcon()
            }
        };
    }

    init() {
        const initialized = super.init();
        if (initialized && this.trigger) {
            this.trigger.title = 'Clicca per cambiare tipo di marcatore';
        }
        return initialized;
    }

    createPopup() {
        const popup = this.createBasePopup('Seleziona un tipo di marcatore');
        
        const content = document.createElement('div');
        content.className = `space-y-1 ${POPUP_CONFIG.contentMaxHeight} overflow-y-auto overflow-x-hidden`;
        content.innerHTML = this.buildMarkersHTML();
        
        content.querySelectorAll('.marker-item').forEach(item => {
            item.addEventListener('click', () => {
                this.selectMarkerType(item.dataset.markerType);
                this.hide();
            });
        });
        
        popup.appendChild(content);
        return popup;
    }

    buildMarkersHTML() {
        return Object.entries(this.markerTypes).map(([type, data]) => `
            <div class="marker-item flex items-center justify-between p-2 rounded hover:bg-gray-50 hover:shadow-md cursor-pointer" 
                 data-marker-type="${type}">
                <div class="flex items-center space-x-3">
                    ${data.icon}
                    <div>
                        <span class="text-sm font-medium text-gray-700">${data.name}</span>
                        <p class="text-xs text-gray-500">${data.description}</p>
                    </div>
                </div>
                ${type === this.currentMarkerType ? ICONS.check : ''}
            </div>
        `).join('');
    }

    selectMarkerType(markerType) {
        this.currentMarkerType = markerType;
        
        const switchFn = window.switchMarkerType || this.mapInstance?.switchMarkerType;
        if (switchFn) {
            if (typeof switchFn === 'function') {
                switchFn(markerType);
            } else {
                switchFn.call(this.mapInstance, markerType);
            }
        }
        
        document.dispatchEvent(new CustomEvent('markerTypeChanged', {
            detail: { markerType, markerName: this.markerTypes[markerType].name }
        }));
    }

    getClusterIcon() {
        return `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 32 32">
            <path d="M27 21.75c-0.795 0.004-1.538 0.229-2.169 0.616l0.018-0.010-2.694-2.449c0.724-1.105 1.154-2.459 1.154-3.913 0-1.572-0.503-3.027-1.358-4.212l0.015 0.021 3.062-3.062c0.57 0.316 1.249 0.503 1.971 0.508h0.002c2.347 0 4.25-1.903 4.25-4.25s-1.903-4.25-4.25-4.25c-2.347 0-4.25 1.903-4.25 4.25v0c0.005 0.724 0.193 1.403 0.519 1.995l-0.011-0.022-3.062 3.062c-1.147-0.84-2.587-1.344-4.144-1.344-0.868 0-1.699 0.157-2.467 0.443l0.049-0.016-0.644-1.17c0.726-0.757 1.173-1.787 1.173-2.921 0-2.332-1.891-4.223-4.223-4.223s-4.223 1.891-4.223 4.223c0 2.332 1.891 4.223 4.223 4.223 0.306 0 0.605-0.033 0.893-0.095l-0.028 0.005 0.642 1.166c-1.685 1.315-2.758 3.345-2.758 5.627 0 0.605 0.076 1.193 0.218 1.754l-0.011-0.049-0.667 0.283c-0.78-0.904-1.927-1.474-3.207-1.474-2.334 0-4.226 1.892-4.226 4.226s1.892 4.226 4.226 4.226c2.334 0 4.226-1.892 4.226-4.226 0-0.008-0-0.017-0-0.025v0.001c-0.008-0.159-0.023-0.307-0.046-0.451l0.003 0.024 0.667-0.283c1.303 2.026 3.547 3.349 6.1 3.349 1.703 0 3.268-0.589 4.503-1.574l-0.015 0.011 2.702 2.455c-0.258 0.526-0.41 1.144-0.414 1.797v0.001c0 2.347 1.903 4.25 4.25 4.25s4.25-1.903 4.25-4.25c0-2.347-1.903-4.25-4.25-4.25v0z"></path>
        </svg>`;
    }

    getPinIcon() {
        return `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path>
        </svg>`;
    }

    getCircleIcon() {
        return `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clip-rule="evenodd"></path>
        </svg>`;
    }
}

export default BasePopupManager;