/**
 * Utility Functions - Ottimizzato
 * Funzioni helper per la navbar
 */

/**
 * DOM Utilities
 */
export const DOMUtils = {
    showElement(element) {
        if (!element) return;
        element.classList.remove('hidden');
        element.style.opacity = '1';
    },

    hideElement(element) {
        if (!element) return;
        element.classList.add('hidden');
        element.style.opacity = '0';
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    waitForGlobal(globalName, callback, timeout = 10000) {
        if (window[globalName]) {
            callback(window[globalName]);
            return;
        }

        const start = Date.now();
        const interval = setInterval(() => {
            if (window[globalName]) {
                clearInterval(interval);
                callback(window[globalName]);
            } else if (Date.now() - start > timeout) {
                clearInterval(interval);
                console.warn(`Timeout waiting for ${globalName}`);
            }
        }, 100);
    }
};

/**
 * Position Utilities
 */
export const PositionUtils = {
    positionPopup(popup, referenceElement, options = {}) {
        const { 
            offset = 10, 
            maxWidth = 288, 
            placement = 'above' 
        } = options;

        const rect = referenceElement.getBoundingClientRect();
        
        // Posizionamento base
        popup.style.left = `${rect.left}px`;
        
        if (placement === 'above') {
            popup.style.bottom = `${window.innerHeight - rect.top + offset}px`;
        } else {
            popup.style.top = `${rect.bottom + offset}px`;
        }
        
        // Aggiusta se esce dallo schermo
        if (rect.left + maxWidth > window.innerWidth) {
            popup.style.left = `${window.innerWidth - maxWidth - 16}px`;
        }
    }
};

/**
 * Filter Utilities
 */
export const FilterUtils = {
    calculateActiveFiltersCount(filters) {
        if (!filters || typeof filters !== 'object') return 0;
        
        let count = 0;
        
        for (const filterValues of Object.values(filters)) {
            if (Array.isArray(filterValues)) {
                // Range filter [min, max]
                if (filterValues.length === 2 && 
                    typeof filterValues[0] === 'number' && 
                    typeof filterValues[1] === 'number') {
                    count += 1;
                } else {
                    // Multiple values
                    count += filterValues.length;
                }
            } else if (filterValues && typeof filterValues === 'object') {
                // Range object {min, max}
                if (filterValues.min !== undefined || filterValues.max !== undefined) {
                    count += 1;
                }
            }
        }
        
        return count;
    },

    formatRangeFilter(rangeValues) {
        if (rangeValues.min !== undefined && rangeValues.max !== undefined) {
            return `${rangeValues.min} - ${rangeValues.max}`;
        }
        if (rangeValues.min !== undefined) {
            return `≥ ${rangeValues.min}`;
        }
        if (rangeValues.max !== undefined) {
            return `≤ ${rangeValues.max}`;
        }
        return 'Range filter';
    },

    getFacetLabel(facetKey, config) {
        if (config?.aggregations?.[facetKey]?.title) {
            return config.aggregations[facetKey].title;
        }
        return facetKey
            .replace(/[_-]/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
    }
};

/**
 * Notification Utilities
 */
export const NotificationUtils = {
    getNotificationClasses(type) {
        const classes = {
            success: 'bg-green-500 text-white',
            error: 'bg-red-500 text-white',
            warning: 'bg-yellow-500 text-white',
            info: 'bg-primary-500 text-white'
        };
        return classes[type] || classes.info;
    },

    show(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-lg ${this.getNotificationClasses(type)} transition-opacity duration-300`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Fade out e rimozione
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }
};

/**
 * Reset Utilities
 */
export const ResetUtils = {
    resetFacetsInterface() {
        const facetsContainer = document.getElementById('facets-container');
        if (!facetsContainer) return;

        // Reset checkboxes
        facetsContainer.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
        });

        // Reset range sliders
        facetsContainer.querySelectorAll('[id$="-slider"]').forEach(sliderElement => {
            if (!sliderElement.noUiSlider) return;
            
            try {
                const range = sliderElement.noUiSlider.options.range;
                sliderElement.noUiSlider.set([range.min, range.max]);
                
                const facetKey = sliderElement.id.replace('-slider', '');
                const minInput = document.getElementById(`${facetKey}-min-input`);
                const maxInput = document.getElementById(`${facetKey}-max-input`);
                
                if (minInput) minInput.value = range.min;
                if (maxInput) maxInput.value = range.max;
            } catch (error) {
                console.warn(`Failed to reset slider ${sliderElement.id}:`, error);
            }
        });

        // Reset taxonomy facets
        facetsContainer.querySelectorAll('.toggle-btn').forEach(button => {
            const path = button.dataset.path;
            const childrenContainer = facetsContainer.querySelector(`[data-parent="${path}"]`);
            
            if (childrenContainer && childrenContainer.style.display !== 'none') {
                childrenContainer.style.display = 'none';
                button.textContent = '▶';
            }
        });
    },

    clearSearchInput() {
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
                searchInput.dispatchEvent(new Event('input', { bubbles: true }));
                return;
            }
        }
    }
};

/**
 * Event Utilities (deprecato - usare DOM events nativi)
 */
export const EventUtils = {
    emit(eventName, detail = {}) {
        document.dispatchEvent(new CustomEvent(eventName, {
            detail,
            bubbles: true,
            cancelable: true
        }));
    },

    createOutsideClickHandler(popup, triggerElement, callback) {
        return (e) => {
            if (!popup.contains(e.target) && !triggerElement.contains(e.target)) {
                callback();
            }
        };
    },

    createEscapeKeyHandler(callback) {
        return (e) => {
            if (e.key === 'Escape') {
                callback();
            }
        };
    }
};