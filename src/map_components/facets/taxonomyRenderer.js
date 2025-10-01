// taxonomyRenderer.js

export class TaxonomyRenderer {
  constructor() {
    this.originalFacetData = null;
  }

renderTaxonomy(container, facetData, facetKey, state) {
  const currentFilters = state.filters || {};
  const checkedPaths = currentFilters[facetKey] || [];

  // Se non abbiamo ancora memorizzato i dati originali → salvali
  if (!this.originalFacetData) {
    this.originalFacetData = JSON.parse(JSON.stringify(facetData));
  }

  // 🔑 Se c’è almeno un filtro attivo → usa SEMPRE i dati originali
  const effectiveFacetData = checkedPaths.length > 0 
    ? this.originalFacetData 
    : facetData;

  const hierarchy = this._buildHierarchy(effectiveFacetData);
  this._calculateTotalCounts(hierarchy);

  container.className = 'taxonomy-container max-w-full overflow-x-auto max-h-80 overflow-y-auto';
  container.innerHTML = this._createTaxonomyHTML(hierarchy, [], 0, facetKey, checkedPaths);
  
  this._setCheckboxStates(container, hierarchy, checkedPaths);
  this._addEventListeners(container, hierarchy, facetKey);
}


  resetOriginalData() {
    this.originalFacetData = null;
  }

  _buildHierarchy(facetData) {
    const hierarchy = {};
    if (!Array.isArray(facetData)) return hierarchy;

    facetData.forEach(bucket => {
      const parts = bucket.key.split(' > ');
      let currentLevel = hierarchy;
      
      parts.forEach((part, index) => {
        if (!currentLevel[part]) {
          currentLevel[part] = { children: {}, docCount: 0, selfCount: 0 };
        }
        if (index === parts.length - 1) {
          currentLevel[part].selfCount = bucket.doc_count;
        }
        currentLevel = currentLevel[part].children;
      });
    });
    return hierarchy;
  }

  _calculateTotalCounts(hierarchy) {
    const calculateTotalCounts = (node) => {
      let totalCount = node.selfCount || 0;
      Object.values(node.children || {}).forEach(child => {
        totalCount += calculateTotalCounts(child);
      });
      node.docCount = totalCount;
      return totalCount;
    };

    Object.values(hierarchy).forEach(calculateTotalCounts);
  }

  _setCheckboxStates(container, hierarchy, checkedPaths) {
    const setStatesRecursively = (node, path = []) => {
      Object.entries(node).forEach(([key, value]) => {
        if (this._isMetadataKey(key)) return;

        const fullPath = [...path, key].join(' > ');
        const checkbox = container.querySelector(`input[value="${fullPath}"]`);
        if (!checkbox) return;

        checkbox.checked = checkedPaths.includes(fullPath);
        
        const childPaths = this._getAllChildPaths(value.children || {}, [...path, key]);
        const hasCheckedChild = childPaths.some(p => checkedPaths.includes(p));
        checkbox.indeterminate = hasCheckedChild && !checkbox.checked;

        setStatesRecursively(value.children, [...path, key]);
      });
    };

    setStatesRecursively(hierarchy);
  }

  _createTaxonomyHTML(node, path = [], level = 0, facetKey, checkedPaths) {
    let html = '<div class="space-y-1">';

    Object.entries(node).forEach(([key, value]) => {
      if (this._isMetadataKey(key)) return;

      const currentPath = [...path, key];
      const fullPath = currentPath.join(' > ');
      const hasChildren = Object.keys(value.children).length > 0;
      const isChecked = checkedPaths.includes(fullPath);
      const hasCheckedChild = hasChildren && this._hasSelectedChild(value.children, checkedPaths, currentPath);
      const shouldExpand = isChecked || hasCheckedChild;
      const isDisabled = value.docCount === 0;

      html += `
        <div class="taxonomy-item">
          <label class="block facet-option ${isDisabled ? 'text-gray-400 cursor-not-allowed opacity-50' : 'cursor-pointer'}" data-search-text="${key.toLowerCase()}">
            <div></div>
            ${this._createToggleButton(hasChildren, fullPath, shouldExpand)}
            <div class="flex items-center gap-2 min-w-0">
              <input type="checkbox" value="${fullPath}" data-facet-type="${facetKey}" class="form-checkbox flex-shrink-0" ${isChecked ? 'checked' : ''} ${isDisabled ? 'disabled' : ''}>
              <span class="text-sm">${key}</span>
            </div>
            <span class="text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${isDisabled ? 'text-gray-400 bg-gray-100' : 'text-secondary-500 bg-secondary-100'}">${value.docCount}</span>
          </label>
          ${this._createChildrenContainer(hasChildren, fullPath, shouldExpand, value.children, currentPath, level + 1, facetKey, checkedPaths)}
        </div>`;
    });

    return html + '</div>';
  }

  _createToggleButton(hasChildren, fullPath, shouldExpand) {
    return hasChildren ? 
      `<button class="toggle-btn flex-shrink-0 w-5 h-5 flex items-center justify-center rounded hover:bg-gray-200 transition-colors" data-path="${fullPath}">
        <svg class="w-3 h-3 text-gray-600 transform transition-transform duration-200 ${shouldExpand ? 'rotate-90' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
      </button>` : '<div class="w-5 h-5 flex-shrink-0"></div>';
  }

  _createChildrenContainer(hasChildren, fullPath, shouldExpand, children, currentPath, level, facetKey, checkedPaths) {
    return hasChildren ? 
      `<div class="children ${shouldExpand ? '' : 'hidden'}" data-parent="${fullPath}">
        ${this._createTaxonomyHTML(children, currentPath, level, facetKey, checkedPaths)}
      </div>` : '';
  }

  _isMetadataKey(key) {
    return ['children', 'docCount', 'selfCount'].includes(key);
  }

  _hasSelectedChild(node, checkedPaths, currentPathArray = []) {
    for (const [key, value] of Object.entries(node)) {
      if (this._isMetadataKey(key)) continue;

      const fullPath = [...currentPathArray, key].join(' > ');
      if (checkedPaths.includes(fullPath)) return true;

      if (Object.keys(value.children).length > 0) {
        if (this._hasSelectedChild(value.children, checkedPaths, [...currentPathArray, key])) return true;
      }
    }
    return false;
  }

  _getParentPaths(fullPath) {
    const parts = fullPath.split(' > ');
    const parentPaths = [];
    for (let i = 1; i < parts.length; i++) {
      parentPaths.push(parts.slice(0, i).join(' > '));
    }
    return parentPaths;
  }

  _getAllChildPaths(node, currentPath = []) {
    const paths = [];
    Object.entries(node).forEach(([key, value]) => {
      if (this._isMetadataKey(key)) return;
      const fullPath = [...currentPath, key].join(' > ');
      paths.push(fullPath);
      if (Object.keys(value.children).length > 0) {
        paths.push(...this._getAllChildPaths(value.children, [...currentPath, key]));
      }
    });
    return paths;
  }

  _getChildPathsForNode(hierarchy, fullPath) {
    const parts = fullPath.split(' > ');
    let currentNode = hierarchy;
    
    for (const part of parts) {
      if (currentNode[part]) {
        currentNode = currentNode[part];
      } else {
        return [];
      }
    }
    return this._getAllChildPaths(currentNode.children, parts);
  }

  _addEventListeners(container, hierarchy, facetKey) {
    container._hierarchy = hierarchy;
    this._addToggleListeners(container);
    this._addCheckboxListeners(container, hierarchy, facetKey);
  }

  _addToggleListeners(container) {
    container.addEventListener('click', (e) => {
      const toggleBtn = e.target.closest('.toggle-btn');
      if (!toggleBtn) return;

      const path = toggleBtn.dataset.path;
      const childrenContainer = container.querySelector(`[data-parent="${path}"]`);
      const arrow = toggleBtn.querySelector('svg');

      if (childrenContainer && arrow) {
        const isHidden = childrenContainer.classList.contains('hidden');
        childrenContainer.classList.toggle('hidden');
        arrow.classList.toggle('rotate-90', isHidden);
      }
    });
  }

  _addCheckboxListeners(container, hierarchy, facetKey) {
    container.addEventListener('change', (e) => {
      if (e.target.type !== 'checkbox') return;

      const checkbox = e.target;
      
      if (checkbox.disabled) {
        e.preventDefault();
        return;
      }

      const fullPath = checkbox.value;
      const isChecked = checkbox.checked;
      e.stopPropagation();

      const parentPaths = this._getParentPaths(fullPath);
      const allChildPaths = this._getChildPathsForNode(hierarchy, fullPath);

      this._updateRelatedCheckboxes(container, hierarchy, fullPath, isChecked, parentPaths, allChildPaths);

      container.dispatchEvent(new CustomEvent('taxonomyChange', {
        detail: { facetKey, path: fullPath, checked: isChecked, action: isChecked ? 'add' : 'remove' }
      }));
    });
  }

  _updateRelatedCheckboxes(container, hierarchy, clickedPath, isChecked, parentPaths, childPaths) {
    if (isChecked) {
      this._updateCheckboxes(container, parentPaths, true);
      this._updateCheckboxes(container, childPaths, true);
    } else {
      this._updateCheckboxes(container, childPaths, false);
      this._updateParentCheckboxes(container, hierarchy, parentPaths);
    }

    this._updateCheckboxVisuals(container.querySelector(`input[value="${clickedPath}"]`), isChecked);
  }

  _updateCheckboxes(container, paths, checked) {
    paths?.forEach(path => {
      const checkbox = container.querySelector(`input[value="${path}"]`);
      if (checkbox && checkbox.checked !== checked && !checkbox.disabled) {
        checkbox.checked = checked;
        this._updateCheckboxVisuals(checkbox, checked);
      }
    });
  }

  _updateParentCheckboxes(container, hierarchy, parentPaths) {
    parentPaths?.forEach(parentPath => {
      const parentCheckbox = container.querySelector(`input[value="${parentPath}"]`);
      if (!parentCheckbox?.checked || parentCheckbox.disabled) return;

      const parentChildPaths = this._getChildPathsForNode(hierarchy, parentPath);
      const hasCheckedChildren = parentChildPaths.some(childPath => {
        const childCheckbox = container.querySelector(`input[value="${childPath}"]`);
        return childCheckbox?.checked;
      });
      
      if (!hasCheckedChildren) {
        parentCheckbox.checked = false;
        this._updateCheckboxVisuals(parentCheckbox, false);
      }
    });
  }

  _updateCheckboxVisuals(checkbox, isChecked) {
    if (!checkbox) return;

    const textSpan = checkbox.closest('label')?.querySelector('span.text-sm');
    if (textSpan) {
      textSpan.classList.toggle('font-medium', isChecked);
      textSpan.classList.toggle('text-primary-700', isChecked);
    }
  }

  _renderTaxonomyFacet(facetGroup, facetKey, facetConfig, aggregations, checkedState, state, onStateChange) {    
    const taxonomyContainer = document.createElement('div');
    const facetData = aggregations[facetKey] || [];

    this.renderTaxonomy(taxonomyContainer, facetData, facetKey, state);

    taxonomyContainer.addEventListener('taxonomyChange', (e) => {
      const { facetKey, path, checked } = e.detail;
      onStateChange({
        type: 'FACET_CHANGE',
        facetType: facetKey,
        value: path,
        checked: checked,
      });
    });

    facetGroup.appendChild(taxonomyContainer);
  }
}