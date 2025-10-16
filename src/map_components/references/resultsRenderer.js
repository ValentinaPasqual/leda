// Enhanced resultsRenderer.js with Tailwind-customizable styling
import { ModalRenderer } from './modalRenderer.js';

export class ResultsRenderer {
  constructor(mapFocusCallback) {
    this.mapFocusCallback = mapFocusCallback;
    this.allWorks = [];
    this.modalRenderer = new ModalRenderer(mapFocusCallback);
  }

  updateResultsList(items, config, searchState = {}) {
  const resultsContainer = document.getElementById('results');
  if (!resultsContainer) {
    console.error('Results container not found');
    return;
  }

  this.items = items;
  this.searchState = searchState;

  const groupedItems = this._groupByIdOpera(items);
  this.allWorks = Object.values(groupedItems);
  
  // AGGIUNGI QUESTO: Riordina allWorks in base all'ordine di items
  const itemsOrder = items.map(item => item.pivot_ID);
  this.allWorks.sort((a, b) => {
    return itemsOrder.indexOf(a.pivot_ID) - itemsOrder.indexOf(b.pivot_ID);
  });
    
    // Set data, config, and search state for modal renderer
    this.modalRenderer.setData(this.allWorks, this.items);
    this.modalRenderer.setConfig(config);
    this.modalRenderer.setSearchState(searchState);
    
    resultsContainer.innerHTML = this.allWorks
      .map((work, index) => this._renderResultItem(work, index))
      .join('');

    // Add event listeners to the buttons
    this._addMapFocusListeners();
    this._addModalListeners();
  }

  /**
   * Focus on a specific result item by pivot_ID
   */
  focusOnResult(idOpera) {
    const resultElement = document.querySelector(`[data-result-id="${idOpera}"]`);
    if (resultElement) {
      this._openFiltersPanel();
      
      resultElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      
      this._highlightResult(resultElement);
      
      console.log(`Focused on result with pivot_ID: ${idOpera}`);
      return true;
    } else {
      console.warn(`Result with pivot_ID ${idOpera} not found in current results`);
      return false;
    }
  }

  _openFiltersPanel() {
    const filtersPanel = document.getElementById('results-panel');
    if (filtersPanel) {
      filtersPanel.classList.remove('panel-closed-right');
      console.log('Filters panel opened');
    } else {
      console.warn('Filters panel with ID "results-panel" not found');
    }
  }

  _highlightResult(element) {
    // Remove any existing highlight
    const previouslyHighlighted = document.querySelector('.result-highlighted');
    if (previouslyHighlighted) {
      previouslyHighlighted.classList.remove('result-highlighted');
    }
    
    // Add highlight class
    element.classList.add('result-highlighted');
    
    // Add temporary glow effect
    element.style.transition = 'all 0.3s ease';
    element.style.transform = 'scale(1.02)';
    
    // Remove glow effect after animation
    setTimeout(() => {
      element.style.transform = '';
    }, 1000);
    
    // Remove highlight class after a longer period
    setTimeout(() => {
      element.classList.remove('result-highlighted');
    }, 3000);
  }

  _groupByIdOpera(items) {
    const grouped = {};
    
    items.forEach(item => {
      const idOpera = item.pivot_ID;
      
      if (!grouped[idOpera]) {
        grouped[idOpera] = {
          pivot_ID: idOpera,
          Title: item[window.ledaSearch.config.result_cards.card_title],
          Subtitle: item[window.ledaSearch.config.result_cards.card_subtitle] || "",
          Subtitle2: item[window.ledaSearch.config.result_cards.card_subtitle_2] || "",
          Description: item[window.ledaSearch.config.result_cards.card_description] || "",
          Location: [],
          coordinates: []
        };
      }
      
      if (item["Location"]) {
        const spaces = Array.isArray(item["Location"]) 
          ? item["Location"] 
          : [item["Location"]];
        
        spaces.forEach((space, spaceIndex) => {
          if (!grouped[idOpera]["Location"].includes(space)) {
            grouped[idOpera]["Location"].push(space);
            
            const coords = this._extractCoordinatesFromItem(item, spaceIndex);
            grouped[idOpera].coordinates.push(coords);
          }
        });
      }
    });
    
    return grouped;
  }

  _renderResultItem(work, index) {
    // Create space buttons with coordinates
    const spacesButtons = work["Location"].map((space, spaceIndex) => {
      const coordinates = work.coordinates[spaceIndex];
      const hasCoords = coordinates && coordinates.lat && coordinates.lng;
      
      return `
        <button class="focus-map-btn inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 hover:shadow-sm hover:scale-105 active:scale-95 cursor-pointer transform 
                       ${hasCoords ? 'bg-secondary-100 hover:bg-secondary-200 text-secondary-700 border border-secondary-200' : 'bg-gray-100 text-gray-500 border border-gray-200'}" 
                data-space="${encodeURIComponent(space)}" 
                ${hasCoords ? `data-lat="${coordinates.lat}" data-lng="${coordinates.lng}"` : ''}
                title="${hasCoords ? 'Clicca per visualizzare sulla mappa' : 'Coordinate non disponibili'}">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="w-4 h-4 mr-1 ${hasCoords ? '' : 'opacity-50'}">
            <path fill-rule="evenodd" d="m7.539 14.841.003.003.002.002a.755.755 0 0 0 .912 0l.002-.002.003-.003.012-.009a5.57 5.57 0 0 0 .19-.153 15.588 15.588 0 0 0 2.046-2.082c1.101-1.362 2.291-3.342 2.291-5.597A5 5 0 0 0 3 7c0 2.255 1.19 4.235 2.292 5.597a15.591 15.591 0 0 0 2.046 2.082 8.916 8.916 0 0 0 .189.153l.012.01ZM8 8.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" clip-rule="evenodd" />
          </svg>
          ${space}
        </button>
      `;
    }).join('');

return `
  <div class="result-card bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-all duration-300 p-6" 
       data-result-id="${work.pivot_ID}">
    <!-- Header with Title, Subtitles and Button -->
    <div class="flex items-start justify-between gap-4 mb-4">
      <div class="min-w-0 flex-1">
        <h1 class="text-xl font-bold text-gray-900 leading-tight">${work.Title}</h1>
        <div class="flex items-center gap-4 mt-2">
          ${work.Subtitle ? `<p class="text-lg text-gray-700 font-medium truncate">${work.Subtitle}</p>` : ''}
          ${work.Subtitle && work.Subtitle2 ? `<span class="w-1.5 h-1.5 bg-gray-400 rounded-full flex-shrink-0"></span>` : ''}
          ${work.Subtitle2 ? `<p class="text-lg text-gray-600 font-mono flex-shrink-0">${work.Subtitle2}</p>` : ''}
        </div>
      </div>
      
      <!-- More button -->
      <button class="modal-toggle-btn inline-flex items-center px-4 py-2 rounded-full shadow-md hover:shadow-lg transition-all duration-200 flex-shrink-0 bg-primary-500 hover:bg-primary-600 text-white"
              data-work-index="${index}"
              title="Visualizza tutte le opere">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
        </svg>
      </button>
    </div>
    
    <!-- Description with vertical bar -->
    ${work.Description ? `
      <div class="flex items-stretch gap-2">
        <div class="w-1 bg-gradient-to-b from-primary-500 to-primary-600 rounded-full shadow-sm flex-shrink-0"></div>
        <p class="text-xs text-gray-600 flex-1">${work.Description}</p>
      </div>
    ` : ''}
    
    <!-- Locations -->
    ${spacesButtons ? `
      <div class="pt-4 border-t border-gray-200 mt-4">
        <div class="flex flex-wrap gap-2">
          ${spacesButtons}
        </div>
      </div>
    ` : ''}
  </div>
`;
  }

  _addModalListeners() {
    document.querySelectorAll('.modal-toggle-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const workIndex = parseInt(button.getAttribute('data-work-index'));
        this.modalRenderer.toggleModal(workIndex);
      });
    });
  }

  _extractCoordinatesFromItem(item, index) {
    let coordinates = { lat: null, lng: null };
    
    if (Array.isArray(item.lat_long) && item.lat_long.length > index) {
      const coordString = item.lat_long[index];
      if (coordString && typeof coordString === 'string') {
        const parts = coordString.split(',');
        if (parts.length === 2) {
          const lat = parseFloat(parts[0].trim());
          const lng = parseFloat(parts[1].trim());
          if (!isNaN(lat) && !isNaN(lng)) {
            coordinates.lat = lat;
            coordinates.lng = lng;
          }
        }
      }
    } else if (item.lat_long && typeof item.lat_long === 'string') {
      const parts = item.lat_long.split(',');
      if (parts.length === 2) {
        const lat = parseFloat(parts[0].trim());
        const lng = parseFloat(parts[1].trim());
        if (!isNaN(lat) && !isNaN(lng)) {
          coordinates.lat = lat;
          coordinates.lng = lng;
        }
      }
    }
    
    return coordinates;
  }

_addMapFocusListeners() {
  document.querySelectorAll('.focus-map-btn').forEach(button => {
    button.addEventListener('click', (e) => {
      const lat = button.getAttribute('data-lat');
      const lng = button.getAttribute('data-lng');
      const space = decodeURIComponent(button.getAttribute('data-space'));
            
      if (lat && lng && this.mapFocusCallback) {
        this.mapFocusCallback(parseFloat(lat), parseFloat(lng), space);
      } else {
        console.warn('Coordinate non disponibili per questo luogo:', space);
      }
    });
  });
}
}