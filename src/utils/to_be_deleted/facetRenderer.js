// facetRenderer.js
import { TaxonomyRenderer } from './taxonomyRenderer.js';
import { RangeRenderer } from './rangeRenderer.js';
import '../styles/tailwind.css'

export class FacetRenderer {
  constructor(config) {
    this.config = config;
    this.taxonomyRenderer = new TaxonomyRenderer(); 
    this.rangeRenderer = new RangeRenderer();
    this.searchTerms = {}; // Store search terms for each facet
  }

  renderFacets(aggregations, state, onStateChange) {
    if (!aggregations || !this.config.aggregations) {
      console.error('No aggregations data or configuration available.');
      return;
    }

    const facetsContainer = document.getElementById('facets-container');

    // Store current checked state before clearing
    const checkedState = this._getCheckedState();

    // Clear existing facets
    facetsContainer.innerHTML = '';

    // Group facets by category
    const categorizedFacets = {};

    Object.entries(this.config.aggregations).forEach(([facetKey, facetConfig]) => {
      const category = facetConfig.category || 'Other'; // Default category if none specified
      
      if (!categorizedFacets[category]) {
        categorizedFacets[category] = [];
      }
      
      categorizedFacets[category].push({ facetKey, facetConfig });
    });

    // Create category divs and render facets within them
    Object.entries(categorizedFacets).forEach(([categoryName, facets]) => {
      // Create category container
      const categoryDiv = document.createElement('div');
      categoryDiv.className = 'facet-category';
      categoryDiv.setAttribute('data-category', categoryName);
      
      // Create category title
      const categoryTitle = document.createElement('h3');
      categoryTitle.className = 'facet-category-title';
      categoryTitle.textContent = categoryName;
      categoryDiv.appendChild(categoryTitle);
      
      // Create container for facets within this category
      const categoryFacetsContainer = document.createElement('div');
      categoryFacetsContainer.className = 'facet-category-content';
      
      // Render each facet in this category
      facets.forEach(({ facetKey, facetConfig }) => {
        const facetGroup = this._createFacetGroup(facetKey, facetConfig);
        
        if (facetConfig.type === 'range') {
          this.rangeRenderer._renderRangeFacet(facetGroup, facetKey, facetConfig, aggregations, checkedState, state, onStateChange);
        } else if (facetConfig.type === 'taxonomy') {
          this.taxonomyRenderer._renderTaxonomyFacet(facetGroup, facetKey, facetConfig, aggregations, checkedState, onStateChange);
        } else {
          this._renderStandardFacet(facetGroup, facetKey, facetConfig, aggregations, checkedState);
        }
        
        categoryFacetsContainer.appendChild(facetGroup);
      });
      
      categoryDiv.appendChild(categoryFacetsContainer);
      facetsContainer.appendChild(categoryDiv);
    });

    this._addFacetEventListeners(onStateChange);
  }

  _filterFacetOptions(facetGroup, searchTerm) {
    const options = facetGroup.querySelectorAll('label');
    let visibleCount = 0;
    
    options.forEach(option => {
      const text = option.textContent.toLowerCase();
      const isVisible = searchTerm === '' || text.includes(searchTerm);
      
      option.style.display = isVisible ? 'block' : 'none';
      if (isVisible) visibleCount++;
    });
    
    // Hide the entire facet group if no options are visible
    const facetContent = facetGroup.querySelector('.facet-options') || facetGroup.querySelector('div');
    if (facetContent) {
      facetGroup.style.display = visibleCount > 0 ? 'block' : 'none';
    }
  }

  _updateCategoryVisibility() {
    const categories = document.querySelectorAll('.facet-category');
    
    categories.forEach(category => {
      const visibleFacets = category.querySelectorAll('.facet-group[style*="display: block"], .facet-group:not([style*="display: none"])');
      const hasVisibleFacets = Array.from(visibleFacets).some(facet => 
        facet.style.display !== 'none'
      );
      
      category.style.display = hasVisibleFacets ? 'block' : 'none';
    });
  }

  _getCheckedState() {
    const checkedState = {};
    Object.keys(this.config.aggregations).forEach(facetKey => {
      const facetElement = document.getElementById(`${facetKey}-facet`);
      if (facetElement) {
        checkedState[facetKey] = Array.from(facetElement.querySelectorAll('input:checked')).map(input => input.value);
      }
    });
    return checkedState;
  }

  _createFacetGroup(facetKey, facetConfig) {
    const facetGroup = document.createElement('div');
    facetGroup.className = 'facet-group mb-4 p-4 bg-white rounded-lg shadow';
    facetGroup.id = `${facetKey}-facet`;

    const facetHeader = document.createElement('div');
    facetHeader.className = 'facet-header mb-3';

    const title = document.createElement('h3');
    title.className = 'text-lg font-semibold mb-2';
    title.textContent = facetConfig.title || facetKey;
    facetHeader.appendChild(title);

    // Add individual facet search bar (for non-range facets)
    if (facetConfig.type !== 'range') {
      const searchContainer = document.createElement('div');
      searchContainer.className = 'facet-search mb-2';
      
      const searchInput = document.createElement('input');
      searchInput.type = 'text';
      searchInput.className = 'facet-search-input w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500';
      searchInput.placeholder = `Cerca...`;
      searchInput.id = `search-${facetKey}`;
      
      const debouncedSearch = this._debounce((searchTerm) => {
        this._searchWithinFacet(facetKey, searchTerm);
      }, 300);
      
      searchInput.addEventListener('input', (e) => {
        debouncedSearch(e.target.value);
      });
      
      searchContainer.appendChild(searchInput);
      facetHeader.appendChild(searchContainer);
    }

    facetGroup.appendChild(facetHeader);
    return facetGroup;
  }

  _searchWithinFacet(facetKey, searchTerm) {
    const facetGroup = document.getElementById(`${facetKey}-facet`);
    if (!facetGroup) return;
    
    this.searchTerms[facetKey] = searchTerm.toLowerCase().trim();
    this._filterFacetOptions(facetGroup, this.searchTerms[facetKey]);
  }

  _renderStandardFacet(facetGroup, facetKey, facetConfig, aggregations, checkedState) {
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'facet-options space-y-2';

    const facetData = aggregations[facetKey] || [];
    facetData.forEach(bucket => {
      const label = document.createElement('label');
      label.className = 'cursor-pointer block facet-option flex items-center justify-between';
      label.style.display = 'flex';
      label.setAttribute('data-search-text', bucket.key.toLowerCase());
      
      // Add grey styling if count is 0
      if (bucket.doc_count === 0) {
        label.classList.add('text-gray-400');
      }

      // Left side container for checkbox and text
      const leftContainer = document.createElement('div');
      leftContainer.className = 'flex items-center';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = bucket.key;
      checkbox.className = 'form-checkbox mr-2';
      checkbox.dataset.facetType = facetKey;

      if (checkedState[facetKey]?.includes(bucket.key)) {
        checkbox.checked = true;
      }

      const text = document.createElement('span');
      text.textContent = bucket.key;
      text.className = 'text-sm';

      // Right side container for count
      const countContainer = document.createElement('span');
      countContainer.textContent = bucket.doc_count;
      countContainer.className = `text-xs text-secondary-500 bg-secondary-100 px-2 py-0.5 rounded-full flex-shrink-0 ml-auto ${bucket.doc_count === 0 ? 'text-seconday-800 bg-secondary-100' : ''}`;

      leftContainer.appendChild(checkbox);
      leftContainer.appendChild(text);
      
      label.appendChild(leftContainer);
      label.appendChild(countContainer);
      optionsContainer.appendChild(label);
    });

    facetGroup.appendChild(optionsContainer);
}

  _addFacetEventListeners(onStateChange) {
    if (!this.config.aggregations) {
      console.error('Aggregations configuration not found');
      return;
    }

    Object.keys(this.config.aggregations).forEach(facetKey => {
      const facetContainer = document.getElementById(`${facetKey}-facet`);
      
      if (facetContainer) {
        facetContainer.querySelectorAll('input[type="checkbox"]').forEach(input => {
          input.addEventListener('change', (event) => {
            this._onFacetChange(event, onStateChange);
          });
        });
      }
    });
  }

  _onFacetChange(event, onStateChange) {
    const { value, checked } = event.target;
    const facetType = event.target.dataset.facetType;
    onStateChange({ type: 'FACET_CHANGE', facetType, value, checked });
  }

  // Clear all search terms and show all facet options
  clearAllSearches() {
    this.searchTerms = {};
    
    // Clear individual facet searches
    Object.keys(this.config.aggregations).forEach(facetKey => {
      const searchInput = document.getElementById(`search-${facetKey}`);
      if (searchInput) {
        searchInput.value = '';
      }
    });
    
    // Show all options and categories
    const options = document.querySelectorAll('.facet-option, label');
    options.forEach(option => {
      option.style.display = 'block';
    });
    
    const facetGroups = document.querySelectorAll('.facet-group');
    facetGroups.forEach(group => {
      group.style.display = 'block';
    });
    
    const categories = document.querySelectorAll('.facet-category');
    categories.forEach(category => {
      category.style.display = 'block';
    });
  }

  _debounce(func, delay) {
    let timer;
    return function () {
      clearTimeout(timer);  
      timer = setTimeout(() => func.apply(this, arguments), delay);
    };
  }
}