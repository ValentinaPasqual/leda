export class TaxonomyRenderer {
  constructor() {
    this.originalFacetData = null; // Store original data on first render
  }

  renderTaxonomy(container, facetData, facetKey, checkedState) {
    // Preserve original facet data on first render
    if (!this.originalFacetData) {
      this.originalFacetData = JSON.parse(JSON.stringify(facetData));
    }

    // Always build hierarchy from original data to keep counts stable
    const hierarchy = this._buildHierarchy(this.originalFacetData);
    this._calculateTotalCounts(hierarchy);
    
    container.className = 'taxonomy-container max-w-full overflow-x-auto max-h-80 overflow-y-auto border border-gray-200 rounded-lg p-2';
    container.innerHTML = this._createTaxonomyHTML(hierarchy, [], 0, facetKey, checkedState);
    this._addToggleListeners(container);
    this._addCheckboxListeners(container, hierarchy, facetKey);
  }

  // Method to reset original data if needed (e.g., when completely new data is loaded)
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
          currentLevel[part] = {
            children: {},
            docCount: 0,
            selfCount: 0
          };
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

    Object.values(hierarchy).forEach(node => {
      calculateTotalCounts(node);
    });
  }

  _hasSelectedChild(node, checkedPaths, currentPathArray = []) {
    for (const [key, value] of Object.entries(node)) {
      if (['children', 'docCount', 'selfCount'].includes(key)) continue;

      const fullPath = [...currentPathArray, key].join(' > ');
      if (checkedPaths.includes(fullPath)) return true;

      if (Object.keys(value.children).length > 0) {
        if (this._hasSelectedChild(value.children, checkedPaths, [...currentPathArray, key])) return true;
      }
    }
    return false;
  }

  _createTaxonomyHTML(node, path = [], level = 0, facetKey, checkedState) {
    const checkedPaths = checkedState[facetKey] || [];
    let html = '<div class="space-y-1">';

    Object.entries(node).forEach(([key, value]) => {
      if (['children', 'docCount', 'selfCount'].includes(key)) return;

      const currentPath = [...path, key];
      const fullPath = currentPath.join(' > ');
      const hasChildren = Object.keys(value.children).length > 0;
      const isChecked = checkedPaths.includes(fullPath);
      const hasCheckedChild = hasChildren && this._hasSelectedChild(value.children, checkedPaths, currentPath);
      const shouldExpand = isChecked || hasCheckedChild;
      const indentClass = level > 0 ? `ml-${Math.min(level * 4, 12)}` : '';

      html += `
        <div class="taxonomy-item">
          <label class="cursor-pointer block facet-option" style="display: grid; grid-template-columns: ${level * 20}px auto 1fr auto; gap: 8px; align-items: center;" data-search-text="${key.toLowerCase()}">
            <!-- Indentation spacer -->
            <div></div>
            
            <!-- Toggle button -->
            ${hasChildren ? 
              `<button class="toggle-btn flex-shrink-0 w-5 h-5 flex items-center justify-center rounded hover:bg-gray-200 transition-colors" data-path="${fullPath}">
                <svg class="w-3 h-3 text-gray-600 transform transition-transform duration-200 ${shouldExpand ? 'rotate-90' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
              </button>` : '<div class="w-5 h-5 flex-shrink-0"></div>'}
            
            <!-- Content container with checkbox and text -->
            <div class="flex items-center gap-2 min-w-0">
              <input type="checkbox" value="${fullPath}" data-facet-type="${facetKey}" class="form-checkbox flex-shrink-0" ${isChecked ? 'checked' : ''}>
              <span class="text-sm ${isChecked ? 'font-medium text-primary-700' : ''} truncate">${key}</span>
            </div>
            
            <!-- Count (always in the last column) -->
            <span class="text-xs text-secondary-500 bg-secondary-100 px-2 py-0.5 rounded-full flex-shrink-0 ${value.docCount === 0 ? 'text-secondary-800 bg-secondary-100' : ''}">${value.docCount}</span>
          </label>
          
          ${hasChildren ? 
            `<div class="children ${shouldExpand ? '' : 'hidden'}" data-parent="${fullPath}">
              ${this._createTaxonomyHTML(value.children, currentPath, level + 1, facetKey, checkedState)}
            </div>` : ''}
        </div>`;
    });

    return html + '</div>';
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
      if (['children', 'docCount', 'selfCount'].includes(key)) return;
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

  _addToggleListeners(container) {
    container.addEventListener('click', (e) => {
      if (e.target.closest('.toggle-btn')) {
        const toggleBtn = e.target.closest('.toggle-btn');
        const path = toggleBtn.dataset.path;
        const childrenContainer = container.querySelector(`[data-parent="${path}"]`);
        const arrow = toggleBtn.querySelector('svg');

        if (childrenContainer && arrow) {
          const isHidden = childrenContainer.classList.contains('hidden');
          childrenContainer.classList.toggle('hidden');
          arrow.classList.toggle('rotate-90', isHidden);
        }
      }
    });
  }

  _addCheckboxListeners(container, hierarchy, facetKey) {
    container._hierarchy = hierarchy;

    container.addEventListener('change', (e) => {
      if (e.target.type === 'checkbox') {
        const checkbox = e.target;
        const fullPath = checkbox.value;
        const isChecked = checkbox.checked;
        e.stopPropagation();

        const parentPaths = this._getParentPaths(fullPath) || [];
        const allChildPaths = this._getChildPathsForNode(hierarchy, fullPath) || [];

        // Update the visual state of related checkboxes (but don't dispatch events for them)
        this._updateRelatedCheckboxes(container, hierarchy, fullPath, isChecked, parentPaths, allChildPaths);

        // Only dispatch event for the path that was actually clicked
        const changeEvent = new CustomEvent('taxonomyChange', {
          detail: {
            facetKey,
            path: fullPath,  // Only the clicked path
            checked: isChecked,
            action: isChecked ? 'add' : 'remove'
          }
        });
        container.dispatchEvent(changeEvent);
      }
    });
  }

  _updateRelatedCheckboxes(container, hierarchy, clickedPath, isChecked, parentPaths, childPaths) {
    if (isChecked) {
      // When checking a child, check all parent paths (visual only)
      parentPaths?.forEach(parentPath => {
        const parentCheckbox = container.querySelector(`input[value="${parentPath}"]`);
        if (parentCheckbox && !parentCheckbox.checked) {
          parentCheckbox.checked = true;
          this._updateCheckboxVisuals(parentCheckbox, true);
        }
      });

      // When checking a parent, check all child paths (visual only)
      childPaths?.forEach(childPath => {
        const childCheckbox = container.querySelector(`input[value="${childPath}"]`);
        if (childCheckbox && !childCheckbox.checked) {
          childCheckbox.checked = true;
          this._updateCheckboxVisuals(childCheckbox, true);
        }
      });

    } else {
      // When unchecking a parent, uncheck all child paths (visual only)
      childPaths?.forEach(childPath => {
        const childCheckbox = container.querySelector(`input[value="${childPath}"]`);
        if (childCheckbox && childCheckbox.checked) {
          childCheckbox.checked = false;
          this._updateCheckboxVisuals(childCheckbox, false);
        }
      });

      // When unchecking a child, check if parents should be unchecked (visual only)
      parentPaths?.forEach(parentPath => {
        const parentCheckbox = container.querySelector(`input[value="${parentPath}"]`);
        if (parentCheckbox && parentCheckbox.checked) {
          const parentChildPaths = this._getChildPathsForNode(hierarchy, parentPath) || [];
          const hasCheckedChildren = parentChildPaths.some(childPath => {
            const childCheckbox = container.querySelector(`input[value="${childPath}"]`);
            return childCheckbox && childCheckbox.checked;
          });
          if (!hasCheckedChildren) {
            parentCheckbox.checked = false;
            this._updateCheckboxVisuals(parentCheckbox, false);
          }
        }
      });
    }

    // Update visuals for the clicked checkbox
    this._updateCheckboxVisuals(container.querySelector(`input[value="${clickedPath}"]`), isChecked);
  }

  _updateCheckboxVisuals(checkbox, isChecked) {
    if (!checkbox) return;

    const label = checkbox.closest('label');
    const textSpan = label?.querySelector('span.text-sm');
    if (textSpan) {
      textSpan.classList.toggle('font-medium', isChecked);
      textSpan.classList.toggle('text-primary-700', isChecked);
    }
  }

  _renderTaxonomyFacet(facetGroup, facetKey, facetConfig, aggregations, checkedState, onStateChange) {
    // Create container for the taxonomy
    const taxonomyContainer = document.createElement('div');

    // Get facet data (e.g., hierarchy of terms)
    const facetData = aggregations[facetKey] || [];

    // Render the taxonomy into the container
    this.renderTaxonomy(taxonomyContainer, facetData, facetKey, checkedState);

    // Listen for custom 'taxonomyChange' events dispatched by taxonomyRenderer
    taxonomyContainer.addEventListener('taxonomyChange', (e) => {
      const { facetKey, path, checked, action } = e.detail;  

      // Notify the main application state handler for the single affected path
      onStateChange({
        type: 'FACET_CHANGE',
        facetType: facetKey,
        value: path,           
        checked: checked,
      });
    });

    // Append the taxonomy UI to the DOM
    facetGroup.appendChild(taxonomyContainer);
  }
}