// filterBadgesRenderer.js

import { DOMUtils } from '../navbar/navbarUtils.js';

export class FilterBadgesRenderer {
  constructor(config) {
    this.config = config || {};
    console.log(config)
  }

  render(searchState) {
    if (!searchState || !searchState.filters) {
      return '';
    }

    const filtersHtml = [];

    // Query badge
    if (searchState.query && searchState.query.trim()) {
      filtersHtml.push(`
        <div class="inline-flex items-center gap-2 px-3 py-1 bg-secondary-100 text-secondary-800 rounded-full text-sm font-medium">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <span>Ricerca: "${DOMUtils.escapeHtml(searchState.query)}"</span>
        </div>
      `);
    }

    // Facet filters
    Object.entries(searchState.filters).forEach(([facetKey, values]) => {
      if (!values) return;

      // prendo i metadati dal config
      const aggConfig = this.config?.aggregations?.[facetKey];
      const facetLabel = aggConfig?.title || facetKey;
      const facetType = aggConfig?.type || 'value';

      if (Array.isArray(values)) {
        values.forEach(value => {
          filtersHtml.push(this._buildBadge(facetLabel, value, facetType));
        });
      } else if (typeof values === 'object') {
        const range = this._formatRangeFilter(values);
        filtersHtml.push(this._buildBadge(facetLabel, range, 'range'));
      }
    });

    return filtersHtml.length
      ? `<div class="flex flex-wrap gap-2">${filtersHtml.join('')}</div>`
      : '';
  }

  _buildBadge(label, value, type) {
    const colors = {
      simple: 'bg-blue-100 text-blue-800',
      taxonomy: 'bg-green-100 text-green-800',
      range: 'bg-purple-100 text-purple-800',
      value: 'bg-primary-100 text-primary-800' // fallback
    };

    const colorClass = colors[type] || colors.value;

    return `
      <div class="inline-flex items-center gap-2 px-3 py-1 ${colorClass} rounded-full text-sm font-medium">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
          <path d="M2 3h12v1l-5 5v4l-2 2v-6L2 4z"/>
        </svg>
        <span>${label}: ${DOMUtils.escapeHtml(value)}</span>
      </div>
    `;
  }

  _formatRangeFilter(range) {
    if (range.min !== undefined && range.max !== undefined) return `${range.min} - ${range.max}`;
    if (range.min !== undefined) return `≥ ${range.min}`;
    if (range.max !== undefined) return `≤ ${range.max}`;
    return 'Range';
  }
}
