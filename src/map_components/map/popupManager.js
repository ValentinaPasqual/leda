// popupManager.js

/**
 * Controlla se esiste un poligono per una determinata location
 */
function hasPolygonForLocation(locationName) {
  if (!window.polygonState.polygonManager || !locationName) {
    return false;
  }
  const polygon = window.polygonState.polygonManager.findPolygonByName(locationName);
  return polygon !== null;
}

/**
 * Genera un ID univoco per la location
 */
function getLocationId(coords, locationName) {
  if (coords && coords.length >= 2) {
    return `coord_${coords[0]}_${coords[1]}`;
  }
  return `name_${locationName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`;
}

/**
 * Controlla se un poligono è attualmente visibile
 */
function isPolygonVisible(coords, locationName) {
  const locationId = getLocationId(coords, locationName);
  return window.polygonState.visiblePolygons.has(locationId);
}

/**
 * Aggiorna il bottone nel popup aperto
 */
function updatePopupButton(locationId, locationName, coords) {
  const openPopup = document.querySelector('.leaflet-popup-content');
  if (!openPopup) return;

  const polygonButton = openPopup.querySelector('.polygon-btn');
  if (!polygonButton) return;

  const isVisible = window.polygonState.visiblePolygons.has(locationId);
  const hasPolygon = hasPolygonForLocation(locationName);

const eyeIcon = isVisible
    ? `<svg class="w-6 h-6 text-white-800 dark:text-white" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><polygon points="12,4 20,9 20,17 12,22 4,17 4,9" fill="currentColor" fill-opacity="0.3" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="4" r="1.5" fill="currentColor"/><circle cx="20" cy="9" r="1.5" fill="currentColor"/><circle cx="20" cy="17" r="1.5" fill="currentColor"/><circle cx="12" cy="22" r="1.5" fill="currentColor"/><circle cx="4" cy="17" r="1.5" fill="currentColor"/><circle cx="4" cy="9" r="1.5" fill="currentColor"/></svg>`
    : `<svg class="w-6 h-6 text-white-800 dark:text-white" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><polygon points="12,4 20,9 20,17 12,22 4,17 4,9" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3,2" opacity="0.5"/><circle cx="12" cy="4" r="1.5" fill="currentColor" opacity="0.5"/><circle cx="20" cy="9" r="1.5" fill="currentColor" opacity="0.5"/><circle cx="20" cy="17" r="1.5" fill="currentColor" opacity="0.5"/><circle cx="12" cy="22" r="1.5" fill="currentColor" opacity="0.5"/><circle cx="4" cy="17" r="1.5" fill="currentColor" opacity="0.5"/><circle cx="4" cy="9" r="1.5" fill="currentColor" opacity="0.5"/><line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
  const title = hasPolygon
    ? (isVisible ? 'Nascondi poligono' : 'Mostra poligono')
    : 'Poligono non disponibile';

  polygonButton.innerHTML = eyeIcon;
  polygonButton.title = title;
  polygonButton.className = hasPolygon
    ? 'polygon-btn ml-1 polygon-enabled'
    : 'polygon-btn ml-1 polygon-disabled';
}

/**
 * Toggle per mostrare/nascondere poligoni
 */
window.togglePolygonDisplay = function(locationId, locationName, coords) {
  const polygonManager = window.polygonState.polygonManager;

  if (!polygonManager) {
    console.error('PolygonManager non inizializzato');
    return;
  }

  const hasPolygon = hasPolygonForLocation(locationName);
  if (!hasPolygon) {
    console.log('Nessun poligono disponibile per:', locationName);
    return;
  }

  const isCurrentlyVisible = window.polygonState.visiblePolygons.has(locationId);

  if (isCurrentlyVisible) {
    const polygonInfo = polygonManager.polygonLayers.get(locationId);
    if (polygonInfo) {
      polygonManager.polygonLayerGroup.removeLayer(polygonInfo.layer);
      polygonManager.polygonLayers.delete(locationId);
    }
    window.polygonState.visiblePolygons.delete(locationId);
  } else {
    const geojson = polygonManager.findPolygonByName(locationName);
    if (geojson) {
      const layer = polygonManager.createPolygonLayer(geojson, {
        display_name: locationName,
        lat: coords[0],
        lon: coords[1]
      });
      polygonManager.polygonLayerGroup.addLayer(layer);
      polygonManager.polygonLayers.set(locationId, { layer, locationData: { display_name: locationName, lat: coords[0], lon: coords[1] } });
      window.polygonState.visiblePolygons.add(locationId);
      setTimeout(() => polygonManager.fitBoundsToAll(), 100);
    }
  }

  updatePopupButton(locationId, locationName, coords);
};

/**
 * Bottone "Mostra nei risultati"
 * Nota che chiama si lega alla funzione _highlightResult() in resultsRenderer.js
 */
function createFocusButton(item) {
  return `
    <button class="focus-result-btn w-full text-left p-1 rounded text-xs" 
            data-item-id="${item.pivot_ID}"
            onclick="window.focusOnResult('${item.pivot_ID}')"
            title="Vai al risultato nella lista">
      <div class="flex items-center gap-1">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="w-3 h-3 flex-shrink-0">
            <path fill-rule="evenodd" d="M6.5 1.75a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 .75.75V3h-3V1.75ZM8 4a.75.75 0 0 1 .75.75v3.5h3.5a.75.75 0 0 1 0 1.5h-3.5v3.5a.75.75 0 0 1-1.5 0v-3.5h-3.5a.75.75 0 0 1 0-1.5h3.5v-3.5A.75.75 0 0 1 8 4Z" clip-rule="evenodd" />
        </svg>
        <span>Vai al riferimento</span>
      </div>
    </button>
  `;
}

/**
 * Bottone per mostrare/nascondere poligoni
 */
function createPolygonButton(coords, locationName) {
  const hasPolygon = hasPolygonForLocation(locationName);
  const isVisible = isPolygonVisible(coords, locationName);
  const locationId = getLocationId(coords, locationName);

  const buttonClass = hasPolygon
    ? 'polygon-btn ml-1 polygon-enabled'
    : 'polygon-btn ml-1 polygon-disabled';

  const title = hasPolygon
    ? (isVisible ? 'Nascondi poligono' : 'Mostra poligono')
    : 'Poligono non disponibile';

// Icona SVG - cambia in base allo stato
const eyeIcon = isVisible ? 
    // Poligono visibile (quando il poligono è visibile)
    `<svg class="w-6 h-6 text-white-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
      <polygon points="12,4 20,9 20,17 12,22 4,17 4,9" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3,2" opacity="0.5"/>
      <circle cx="12" cy="4" r="1.5" fill="currentColor" opacity="0.5"/>
      <circle cx="20" cy="9" r="1.5" fill="currentColor" opacity="0.5"/>
      <circle cx="20" cy="17" r="1.5" fill="currentColor" opacity="0.5"/>
      <circle cx="12" cy="22" r="1.5" fill="currentColor" opacity="0.5"/>
      <circle cx="4" cy="17" r="1.5" fill="currentColor" opacity="0.5"/>
      <circle cx="4" cy="9" r="1.5" fill="currentColor" opacity="0.5"/>
      <line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>` :
    // Poligono nascosto (quando il poligono NON è visibile)
    `<svg class="w-6 h-6 text-white-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
      <polygon points="12,4 20,9 20,17 12,22 4,17 4,9" fill="currentColor" fill-opacity="0.3" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="12" cy="4" r="1.5" fill="currentColor"/>
      <circle cx="20" cy="9" r="1.5" fill="currentColor"/>
      <circle cx="20" cy="17" r="1.5" fill="currentColor"/>
      <circle cx="12" cy="22" r="1.5" fill="currentColor"/>
      <circle cx="4" cy="17" r="1.5" fill="currentColor"/>
      <circle cx="4" cy="9" r="1.5" fill="currentColor"/>
    </svg>`
;

  return `
    <button class="${buttonClass}" 
            onclick="window.togglePolygonDisplay('${locationId}', '${locationName.replace(/'/g, "\\'")}', [${coords[0]}, ${coords[1]}])"
            title="${title}"
            ${!hasPolygon ? 'disabled' : ''}>
      ${eyeIcon}
    </button>
  `;
}

/**
 * Crea il contenuto dei popup (speciale o normale)
 */
const createPopupContent = (name, items, coords, isSpecial, config) => {
      
      const cardConfig = config.result_cards;
      
      if (isSpecial) {
          // Special popup format showing opera name and location
          // Group items by title and year, collecting unique locations
          const operaGroups = {};
          items.forEach(item => {
              const key = `${item[cardConfig.card_title] || ''} (${item[cardConfig.card_subtitle] || ''})`;
              if (!operaGroups[key]) {
                  operaGroups[key] = {
                      title: item[cardConfig.card_title] || '',
                      year: item[cardConfig.card_subtitle] || '',
                      locations: new Set(),
                      type: item[cardConfig.card_subtitle_2],
                      description: item[cardConfig.popup_description] || '',
                      item: item // Store reference to item for focus button
                  };
              }
              if (item["Location"]) {
                  operaGroups[key].locations.add(item["Location"]);
              }
          });
          
          return `
          <div class="max-w-sm bg-white rounded-xl shadow-2xl overflow-hidden border border-primary-100/50 backdrop-blur-sm">
              <!-- Header con gradiente animato -->
              <div class="bg-gradient-to-r from-primary-500 via-primary-600 to-secondary-600 text-white p-3 relative overflow-hidden">
                  <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"></div>
                  <h2 class="font-bold text-base flex items-center justify-between relative z-10">
                      <div class="flex items-center gap-2">
                          <div class="p-1 bg-white/20 rounded-lg backdrop-blur-sm">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="w-4 h-4">
                                  <path fill-rule="evenodd" d="m7.539 14.841.003.003.002.002a.755.755 0 0 0 .912 0l.002-.002.003-.003.012-.009a5.57 5.57 0 0 0 .19-.153 15.588 15.588 0 0 0 2.046-2.082c1.101-1.362 2.291-3.342 2.291-5.597A5 5 0 0 0 3 7c0 2.255 1.19 4.235 2.292 5.597a15.591 15.591 0 0 0 2.046 2.082 8.916 8.916 0 0 0 .189.153l.012.01ZM8 8.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" clip-rule="evenodd" />
                              </svg>
                          </div>
                          <span class="text-white/90 font-medium">Luogo non geolocalizzabile</span>
                      </div>
                      <button class="custom-close-btn p-1 hover:bg-white/20 rounded-lg transition-colors duration-200" onclick="document.querySelector('.leaflet-popup-close-button').click()">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="w-4 h-4">
                              <path d="M.293.293a1 1 0 0 1 1.414 0L8 6.586 14.293.293a1 1 0 1 1 1.414 1.414L9.414 8l6.293 6.293a1 1 0 0 1-1.414 1.414L8 9.414l-6.293 6.293a1 1 0 0 1-1.414-1.414L6.586 8 .293 1.707a1 1 0 0 1 0-1.414z"/>
                          </svg>
                      </button>
                  </h2>
              </div>

              <div class="p-4 bg-gradient-to-br from-primary-50/50 to-secondary-50/30">

                  <!-- Header risultati -->
                  <div class="flex items-center gap-2 mb-3">
                      <div class="p-1.5 bg-gradient-to-br from-primary-500 to-secondary-600 rounded-lg">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="w-4 h-4 text-white">
                              <path d="M3 3a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H3ZM3 7.5a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1a1 1 0 0 0-1-1H3ZM2 12.5a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-1ZM7 4a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6A.5.5 0 0 1 7 4ZM7.5 8a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1h-6ZM7 12.5a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5Z"/>
                          </svg>
                      </div>
                      <h3 class="font-semibold text-gray-800 text-sm">
                          <span class="bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent font-bold">
                              ${Object.keys(operaGroups).length}
                          </span> 
                          riferimenti relativi a questo luogo
                      </h3>
                  </div>

                  <!-- Lista risultati con scrollbar personalizzata -->
                  <div class="space-y-2 max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-primary-300 scrollbar-track-primary-50 hover:scrollbar-thumb-primary-400">
                  ${Object.values(operaGroups).map((group, index) => `
                    <div class="group bg-white/90 backdrop-blur-sm rounded-lg shadow-sm border border-primary-100/50 hover:shadow-lg hover:border-primary-200 transition-all duration-300">
                      <div class="p-3">
                        <!-- Accordion Header -->
                        ${group.description ? `
                        <button onclick="const content = this.nextElementSibling; const chevron = this.querySelector('.chevron-icon'); content.style.maxHeight = content.style.maxHeight ? null : content.scrollHeight + 'px'; chevron.classList.toggle('rotate-180');" class="w-full flex items-start gap-2 text-left hover:bg-gray-50/50 rounded transition-colors mb-2">
                        ` : `
                        <div class="flex items-start gap-2 mb-2">
                        `}
                          <div class="p-1 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-lg group-hover:from-primary-200 group-hover:to-secondary-200 transition-colors duration-300">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="w-3 h-3 text-primary-600">
                              <path d="M3.75 2A1.75 1.75 0 0 0 2 3.75v8.5c0 .966.784 1.75 1.75 1.75h8.5A1.75 1.75 0 0 0 14 12.25v-8.5A1.75 1.75 0 0 0 12.25 2h-8.5ZM3.5 3.75a.25.25 0 0 1 .25-.25h8.5a.25.25 0 0 1 .25.25v8.5a.25.25 0 0 1-.25.25h-8.5a.25.25 0 0 1-.25-.25v-8.5Z"/>
                              <path d="M5.5 5.75a.75.75 0 0 1 .75-.75h3.5a.75.75 0 0 1 0 1.5h-3.5a.75.75 0 0 1-.75-.75ZM5.5 8.25a.75.75 0 0 1 .75-.75h3.5a.75.75 0 0 1 0 1.5h-3.5a.75.75 0 0 1-.75-.75ZM6.25 10.5a.75.75 0 0 0 0 1.5h2a.75.75 0 0 0 0-1.5h-2Z"/>
                            </svg>
                          </div>
                          
                          <div class="min-w-0 flex-1">
                            <h3 class="text-lg font-bold text-gray-800 leading-tight group-hover:text-gray-900 transition-colors">${group.title}</h3>
                            <div class="flex items-center gap-3 mt-1">
                              ${group.year ? `<span class="text-sm text-gray-700 font-medium">${group.year}</span>` : ''}
                              ${group.year && group.type ? `<span class="w-1.5 h-1.5 bg-gray-400 rounded-full flex-shrink-0"></span>` : ''}
                              ${group.type ? `<span class="text-sm text-gray-600 font-mono">${group.type}</span>` : ''}
                            </div>
                          </div>
                          
                          ${group.description ? `
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="chevron-icon w-4 h-4 text-gray-400 transition-transform duration-300 ease-in-out flex-shrink-0 mt-1">
                            <path fill-rule="evenodd" d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" />
                          </svg>
                          ` : ''}
                        ${group.description ? `</button>` : `</div>`}

                        <!-- Locations -->
                          ${Array.from(group.locations).length > 0 ? `
                            <div class="flex items-center gap-1 mb-2">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="w-3 h-3 text-primary-400 flex-shrink-0">
                                <path fill-rule="evenodd" d="m7.539 14.841.003.003.002.002a.755.755 0 0 0 .912 0l.002-.002.003-.003.012-.009a5.57 5.57 0 0 0 .19-.153 15.588 15.588 0 0 0 2.046-2.082c1.101-1.362 2.291-3.342 2.291-5.597A5 5 0 0 0 3 7c0 2.255 1.19 4.235 2.292 5.597a15.591 15.591 0 0 0 2.046 2.082 8.916 8.916 0 0 0 .189.153l.012.01ZM8 8.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" clip-rule="evenodd" />
                              </svg>
                              <span class="text-xs text-gray-500 truncate">${Array.from(group.locations).join(', ')}</span>
                            </div>
                          ` : ''}
                        
<!-- Accordion Content -->
${group.description ? `
<div style="max-height: 0; overflow: hidden; transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1);">
  <div class="max-h-24 overflow-y-auto mb-2 p-2 bg-gray-50 rounded animate-fadeIn">
    <p class="text-sm text-gray-700">${group.description}</p>
  </div>
</div>
` : ''}
                        
                        <!-- Focus Button - Always outside accordion -->
                        ${createFocusButton(group.item)}
                      </div>
                    </div>
                  `).join('')}
                  </div>
              </div>
          </div>
          `;
      } else {
          // Regular popup format
          return `
          <div class="max-w-sm bg-white rounded-xl shadow-2xl overflow-hidden border border-secondary-100/50 backdrop-blur-sm">
              <!-- Header con gradiente animato -->
              <div class="bg-gradient-to-r from-primary-500 via-primary-600 to-secondary-600 text-white p-3 relative overflow-hidden">
                  <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"></div>
                  <h2 class="font-bold text-base flex items-center justify-between relative z-10">
                      <div class="flex items-center gap-2 min-w-0 flex-1">
                          <div class="p-1 bg-white/20 rounded-lg backdrop-blur-sm flex-shrink-0">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="w-4 h-4">
                                  <path fill-rule="evenodd" d="m7.539 14.841.003.003.002.002a.755.755 0 0 0 .912 0l.002-.002.003-.003.012-.009a5.57 5.57 0 0 0 .19-.153 15.588 15.588 0 0 0 2.046-2.082c1.101-1.362 2.291-3.342 2.291-5.597A5 5 0 0 0 3 7c0 2.255 1.19 4.235 2.292 5.597a15.591 15.591 0 0 0 2.046 2.082 8.916 8.916 0 0 0 .189.153l.012.01ZM8 8.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" clip-rule="evenodd" />
                              </svg>
                          </div>
                          <span class="text-white/90 font-medium word-break">${name}</span>
                          ${createPolygonButton(coords, name)}
                      </div>
                      <button class="custom-close-btn p-1 hover:bg-white/20 rounded-lg transition-colors duration-200 flex-shrink-0 ml-2" onclick="document.querySelector('.leaflet-popup-close-button').click()">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="w-4 h-4">
                              <path d="M.293.293a1 1 0 0 1 1.414 0L8 6.586 14.293.293a1 1 0 1 1 1.414 1.414L9.414 8l6.293 6.293a1 1 0 0 1-1.414 1.414L8 9.414l-6.293 6.293a1 1 0 0 1-1.414-1.414L6.586 8 .293 1.707a1 1 0 0 1 0-1.414z"/>
                          </svg>
                      </button>
                  </h2>
              </div>

              <div class="p-4 bg-gradient-to-br from-secondary-50/50 to-primary-50/30">
                  <!-- Header risultati -->
                  <div class="flex items-center gap-2 mb-3">
                      <div class="p-1.5 bg-gradient-to-br from-secondary-500 to-primary-600 rounded-lg">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="w-4 h-4 text-white">
                              <path d="M3 3a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H3ZM3 7.5a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1a1 1 0 0 0-1-1H3ZM2 12.5a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-1ZM7 4a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6A.5.5 0 0 1 7 4ZM7.5 8a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1h-6ZM7 12.5a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5Z"/>
                          </svg>
                      </div>
                      <h3 class="font-semibold text-gray-800 text-sm">
                          <span class="bg-gradient-to-r from-secondary-600 to-primary-600 bg-clip-text text-transparent font-bold">
                              ${items.length}
                          </span> 
                          riferimenti relativi a questo luogo
                      </h3>
                  </div>

                  <!-- Lista risultati con scrollbar personalizzata -->
                  <div class="space-y-2 max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-primary-300 scrollbar-track-primary-50 hover:scrollbar-thumb-primary-400">
                    ${items.map((item, index) => `
                    <div class="group bg-white/90 backdrop-blur-sm rounded-lg shadow-sm border border-primary-100/50 hover:shadow-lg hover:border-primary-200 transition-all duration-300">
                      <div class="p-3">
                        <!-- Accordion Header -->
                        ${item[config.result_cards.popup_description] ? `
                        <button onclick="const content = this.nextElementSibling; const chevron = this.querySelector('.chevron-icon'); content.style.maxHeight = content.style.maxHeight ? null : content.scrollHeight + 'px'; chevron.classList.toggle('rotate-180');" class="w-full flex items-start gap-2 text-left hover:bg-gray-50/50 rounded transition-colors mb-2">
                        ` : `
                        <div class="flex items-start gap-2 mb-2">
                        `}
                        <div class="p-1 bg-gradient-to-br from-seconary-100 to-primary-100 rounded-lg group-hover:from-secondary-200 group-hover:to-primary-200 transition-colors duration-300">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="w-3 h-3 text-primary-600">
                            <path d="M3.75 2A1.75 1.75 0 0 0 2 3.75v8.5c0 .966.784 1.75 1.75 1.75h8.5A1.75 1.75 0 0 0 14 12.25v-8.5A1.75 1.75 0 0 0 12.25 2h-8.5ZM3.5 3.75a.25.25 0 0 1 .25-.25h8.5a.25.25 0 0 1 .25.25v8.5a.25.25 0 0 1-.25.25h-8.5a.25.25 0 0 1-.25-.25v-8.5Z"/>
                            <path d="M5.5 5.75a.75.75 0 0 1 .75-.75h3.5a.75.75 0 0 1 0 1.5h-3.5a.75.75 0 0 1-.75-.75ZM5.5 8.25a.75.75 0 0 1 .75-.75h3.5a.75.75 0 0 1 0 1.5h-3.5a.75.75 0 0 1-.75-.75ZM6.25 10.5a.75.75 0 0 0 0 1.5h2a.75.75 0 0 0 0-1.5h-2Z"/>
                            </svg>
                        </div>
                        
                        <div class="min-w-0 flex-1">
                            <h3 class="text-lg font-bold text-gray-800 leading-tight group-hover:text-gray-900 transition-colors">${item[config.result_cards.card_title] || 'Unnamed'}</h3>
                            <div class="flex items-center gap-3 mt-1">
                                ${item[config.result_cards.card_subtitle] ? `<span class="text-sm text-gray-700 font-medium">${item[config.result_cards.card_subtitle]}</span>` : ''}
                                ${item[config.result_cards.card_subtitle] && item[config.result_cards.card_subtitle_2] ? `<span class="w-1.5 h-1.5 bg-gray-400 rounded-full flex-shrink-0"></span>` : ''}
                                ${item[config.result_cards.card_subtitle_2] ? `<span class="text-sm text-gray-600 font-mono">${item[config.result_cards.card_subtitle_2]}</span>` : ''}
                            </div>
                        </div>
                        
                        ${item[config.result_cards.popup_description] ? `
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="chevron-icon w-4 h-4 text-gray-400 transition-transform duration-300 ease-in-out flex-shrink-0 mt-1">
                          <path fill-rule="evenodd" d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" />
                        </svg>
                        ` : ''}
                        ${item[config.result_cards.popup_description] ? `</button>` : `</div>`}
                        
                        <!-- Accordion Content -->
                        ${item[config.result_cards.popup_description] ? `
                        <div style="max-height: 0; overflow: hidden; transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1);">
                            ${item[config.result_cards.description] ? `
                            <div class="flex items-center gap-1 mb-2">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="w-3 h-3 text-primary-400 flex-shrink-0">
                                <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12.735 14c.618 0 1.093-.561.872-1.139a6.002 6.002 0 0 0-11.215 0c-.22.578.254 1.139.872 1.139h9.47Z"/>
                                </svg>
                                <span class="text-xs text-gray-500">${item[config.result_cards.description]}</span>
                            </div>
                            ` : ''}

                            <div class="max-h-24 overflow-y-auto mb-2 p-2 bg-gray-50 rounded animate-fadeIn">
                              <p class="text-xs text-gray-600">${item[config.result_cards.popup_description]}</p>
                            </div>
                        </div>
                        ` : ''}
                        
                        <!-- Focus Button - Always outside accordion -->
                        ${createFocusButton(item)}
                      </div>
                    </div>
                    `).join('')}
                  </div>
              </div>
          </div>
          `;
      }
    };

export { createPopupContent };