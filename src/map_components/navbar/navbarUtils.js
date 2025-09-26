/**
 * Utility functions for NavBarRenderer
 */

/**
 * DOM Utilities
 */
export const DOMUtils = {
    /**
     * Show element immediately without animation
     */
    showElement(element) {
        if (!element) return;
        element.classList.remove('hidden');
        element.style.opacity = '1';
    },

    /**
     * Hide element immediately without animation
     */
    hideElement(element) {
        if (!element) return;
        element.classList.add('hidden');
        element.style.opacity = '0';
    },

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Wait for a global object to be available
     */
    waitForGlobal(globalName, callback, timeout = 10000) {
        const start = Date.now();
        const check = setInterval(() => {
            if (window[globalName]) {
                callback(window[globalName]);
                clearInterval(check);
            } else if (Date.now() - start > timeout) {
                console.warn(`Timeout waiting for ${globalName}`);
                clearInterval(check);
            }
        }, 100);
    }
};

/**
 * Positioning Utilities
 */
export const PositionUtils = {
    /**
     * Position popup relative to a reference element
     */
    positionPopup(popup, referenceElement, options = {}) {
        const { 
            offset = 10, 
            maxWidth = 288, 
            placement = 'above' 
        } = options;

        const rect = referenceElement.getBoundingClientRect();
        
        // Default positioning
        popup.style.left = `${rect.left}px`;
        
        if (placement === 'above') {
            popup.style.bottom = `${window.innerHeight - rect.top + offset}px`;
        } else {
            popup.style.top = `${rect.bottom + offset}px`;
        }
        
        // Adjust if popup would go off-screen
        if (rect.left + maxWidth > window.innerWidth) {
            popup.style.left = `${window.innerWidth - maxWidth - 16}px`;
        }
    }
};

/**
 * Event Utilities
 */
export const EventUtils = {
    /**
     * Emit a custom event
     */
    emit(eventName, detail = {}, element = document) {
        const event = new CustomEvent(eventName, {
            detail,
            bubbles: true,
            cancelable: true
        });
        element.dispatchEvent(event);
    },

    /**
     * Create outside click handler
     */
    createOutsideClickHandler(popup, triggerElement, callback) {
        return (e) => {
            if (!popup.contains(e.target) && !triggerElement.contains(e.target)) {
                callback();
            }
        };
    },

    /**
     * Create escape key handler
     */
    createEscapeKeyHandler(callback) {
        return (e) => {
            if (e.key === 'Escape') {
                callback();
            }
        };
    }
};

/**
 * Filter Utilities
 */
export const FilterUtils = {
    /**
     * Calculate the total number of active filters
     */
    calculateActiveFiltersCount(filters) {
        if (!filters || typeof filters !== 'object') return 0;
        
        let count = 0;
        Object.values(filters).forEach(filterValues => {
            if (Array.isArray(filterValues)) {
                if (filterValues.length === 2 && 
                    typeof filterValues[0] === 'number' && 
                    typeof filterValues[1] === 'number') {
                    count += 1; // Range filter
                } else {
                    count += filterValues.length; // Multiple values
                }
            } else if (filterValues && typeof filterValues === 'object') {
                if (filterValues.min !== undefined || filterValues.max !== undefined) {
                    count += 1; // Range object
                }
            }
        });
        
        return count;
    },

    /**
     * Format range filter for display
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
    },

    /**
     * Get human-readable label for a facet key
     */
    getFacetLabel(facetKey, config) {
        if (config && config.aggregations && config.aggregations[facetKey]) {
            return config.aggregations[facetKey].title || facetKey;
        }
        return facetKey.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
};

/**
 * Notification Utilities
 */
export const NotificationUtils = {
    /**
     * Get CSS classes for notification types
     */
    getNotificationClasses(type) {
        const classes = {
            success: 'bg-green-500 text-white',
            error: 'bg-red-500 text-white',
            warning: 'bg-yellow-500 text-white',
            info: 'bg-primary-500 text-white'
        };
        return classes[type] || classes.info;
    },

    /**
     * Show a notification
     */
    show(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-lg ${this.getNotificationClasses(type)}`;
        notification.style.opacity = '1';
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, duration);
    }
};

/**
 * Interface Reset Utilities
 */
export const ResetUtils = {
    /**
     * Reset all facets in the interface to their unchecked/default state
     */
    resetFacetsInterface() {
        const facetsContainer = document.getElementById('facets-container');
        if (!facetsContainer) return;

        // Reset checkboxes
        facetsContainer.querySelectorAll('input[type="checkbox"]')
            .forEach(checkbox => checkbox.checked = false);

        // Reset range sliders
        facetsContainer.querySelectorAll('[id$="-slider"]')
            .forEach(sliderElement => {
                if (sliderElement.noUiSlider) {
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
                }
            });

        // Reset taxonomy facets
        facetsContainer.querySelectorAll('.toggle-btn')
            .forEach(button => {
                const path = button.dataset.path;
                const childrenContainer = facetsContainer.querySelector(`[data-parent="${path}"]`);
                if (childrenContainer && childrenContainer.style.display !== 'none') {
                    childrenContainer.style.display = 'none';
                    button.textContent = '▶';
                }
            });
    },

    /**
     * Clear search input fields
     */
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
                break;
            }
        }
    }
};