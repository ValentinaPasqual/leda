/**
 * Enhanced Storymap JS - Fixed Version
 * This script enhances the existing storymap implementation with:
 * - Autoplay functionality
 * - Improved transitions
 * - Connected path between locations
 * - Tailwind styling for the UI
 * - FIXED: Control panel positioning over the map
 */

import { parseData } from './utils/dataParser.js';

// Function to initialize the enhanced storymap
function initializeEnhancedStorymap(items, pathName) {
  const mainContainer = document.getElementById('main-content');
  if (!mainContainer) return;
  
  mainContainer.innerHTML = '';
  
  // Create the header
  const header = document.createElement('div');
  header.className = 'bg-indigo-600 text-white py-4';
  
  const headerContainer = document.createElement('div');
  headerContainer.className = 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8';
  
  // Add back link
  const backLink = document.createElement('a');
  backLink.href = 'index.html';
  backLink.className = 'text-indigo-100 hover:text-white mb-2 inline-block transition duration-300';
  backLink.innerHTML = '&larr; Torna ai percorsi';
  
  const title = document.createElement('h1');
  title.className = 'text-3xl font-bold mt-2';
  title.textContent = pathName;
  
  if (items.length > 0 && items[0].storytelling_path_description) {
    const description = document.createElement('p');
    description.className = 'text-lg text-indigo-100 mt-1';
    description.textContent = items[0].storytelling_path_description;
    headerContainer.appendChild(description);
  }
  
  headerContainer.appendChild(backLink);
  headerContainer.appendChild(title);
  header.appendChild(headerContainer);
  mainContainer.appendChild(header);
  
  // Create the container for the storymap
  const mapContainer = document.createElement('div');
  mapContainer.className = 'flex flex-col md:flex-row w-full';
  
  // Map area
  const mapArea = document.createElement('div');
  mapArea.className = 'w-full md:w-3/5 h-[60vh] md:h-[calc(100vh-90px)] relative';
  mapArea.id = 'map';
  
  // Side panel for descriptions
  const sidePanel = document.createElement('div');
  sidePanel.className = 'w-full md:w-2/5 bg-white md:h-[calc(100vh-90px)] overflow-y-auto shadow-lg border-l border-gray-200';
  sidePanel.id = 'location-details';
  
  mapContainer.appendChild(mapArea);
  mapContainer.appendChild(sidePanel);
  mainContainer.appendChild(mapContainer);
  
  // Add progress bar at the bottom of the map
  const progressBar = document.createElement('div');
  progressBar.className = 'absolute left-0 right-0 bottom-0 h-1 bg-gray-200';
  
  const progressIndicator = document.createElement('div');
  progressIndicator.className = 'h-full bg-indigo-600 transition-all duration-1000 ease-in-out';
  progressIndicator.style.width = '0%';
  progressIndicator.id = 'progress-indicator';
  
  progressBar.appendChild(progressIndicator);
  mapArea.appendChild(progressBar);
  
  // Add dots navigation for mobile
  if (mainContainer) {
    const dotsNavigation = document.createElement('div');
    dotsNavigation.className = 'md:hidden flex justify-center py-4 bg-white border-t border-gray-200';
    dotsNavigation.id = 'dots-navigation';
    mainContainer.appendChild(dotsNavigation);
  }
  
  // Initialize the map with Leaflet
  initializeEnhancedLeafletMap(items, sidePanel);
}

// Function to initialize the enhanced Leaflet map
function initializeEnhancedLeafletMap(items, sidePanel) {
  // Verify if Leaflet is available
  if (!window.L) {
    // If Leaflet is not loaded, insert the stylesheet and script
    const leafletCSS = document.createElement('link');
    leafletCSS.rel = 'stylesheet';
    leafletCSS.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(leafletCSS);
    
    const leafletScript = document.createElement('script');
    leafletScript.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    document.head.appendChild(leafletScript);
    
    // Wait for Leaflet to load before initializing
    leafletScript.onload = () => {
      createEnhancedMap(items, sidePanel);
    };
  } else {
    // Leaflet is already loaded, initialize map right away
    createEnhancedMap(items, sidePanel);
  }
}

// Function to create the enhanced map once Leaflet is loaded
function createEnhancedMap(items, sidePanel) {
  // Check for valid coordinates
  const validItems = items.filter(item => 
    item.latitude && item.longitude && 
    !isNaN(parseFloat(item.latitude)) && !isNaN(parseFloat(item.longitude))
  );
  
  if (validItems.length === 0) {
    document.getElementById('map').innerHTML = `
      <div class="flex h-full items-center justify-center bg-gray-100">
        <div class="text-center p-6">
          <svg class="w-12 h-12 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
          </svg>
          <h3 class="mt-2 text-lg font-medium text-gray-900">Nessuna coordinata valida</h3>
          <p class="mt-1 text-sm text-gray-500">Non ci sono luoghi con coordinate geografiche valide per visualizzare la mappa.</p>
        </div>
      </div>
    `;
    return;
  }
  
  // Add custom styles for markers and animations
  addCustomStyles();
  
  // Create the map centered on the first element
  const map = L.map('map').setView(
    [parseFloat(validItems[0].latitude), parseFloat(validItems[0].longitude)], 
    13
  );
  
  // Add the OpenStreetMap base layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
  
  const markers = [];
  const markerGroup = L.featureGroup().addTo(map);
  const pathLayer = L.layerGroup().addTo(map);
  
  // Add custom markers for each valid location
  validItems.forEach((item, index) => {
    const lat = parseFloat(item.latitude);
    const lng = parseFloat(item.longitude);
    
    // Create a custom icon for the marker
    const customIcon = L.divIcon({
      className: 'custom-marker',
      html: `<div class="marker-container ${index === 0 ? 'active' : ''}">
              <div class="marker-point"></div>
              <div class="marker-pulse"></div>
              <div class="marker-number">${index + 1}</div>
            </div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });
    
    // Create the marker
    const marker = L.marker([lat, lng], {
      icon: customIcon,
      title: item.Name || `Luogo ${index + 1}`
    }).addTo(markerGroup);
    
    // Add the marker to the array
    markers.push(marker);
    
    // Add popup to the marker
    marker.bindPopup(`<b>${item.Name || 'Senza nome'}</b><br>${item.Description || ''}`);
    
    // Add click event to the marker
    marker.on('click', () => {
      // Select this location
      navigateTo(index, validItems, markers, map, pathLayer, false);
      
      // If autoplay is running, pause it
      if (isAutoPlaying) {
        toggleAutoPlay();
      }
    });
  });
  
  // Make sure all markers are visible on the map
  map.fitBounds(markerGroup.getBounds(), { padding: [30, 30] });
  
  // Show the details of the first location
  showEnhancedLocationDetails(validItems[0], 0, validItems.length);
  updateMarkers(0, markers);
  
  // Initialize dots navigation for mobile
  createDotsNavigation(validItems.length);
  
  // State variables
  let currentIndex = 0;
  let isAutoPlaying = false;
  let autoPlayInterval = null;
  let isTransitioning = false;
  
  // FIX: Create control panel
  createControlPanel(map, validItems, markers, pathLayer);
  
  // Update progress bar
  updateProgressBar(0, validItems.length);
  
  // Function to create control panel
  function createControlPanel(map, items, markers, pathLayer) {
    // Create custom Leaflet control for the panel
    const customControl = L.Control.extend({
      options: {
        position: 'bottomright'
      },
      
      onAdd: function() {
        // Create control container
        const container = L.DomUtil.create('div', 'leaflet-custom-control');
        container.style.backgroundColor = 'white';
        container.style.padding = '6px';
        container.style.borderRadius = '24px';
        container.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.id = 'control-panel';
        
        // Previous button
        const prevButton = L.DomUtil.create('button', '', container);
        prevButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>';
        prevButton.className = 'p-2 hover:bg-gray-100 rounded-full transition duration-300 focus:outline-none mr-1';
        prevButton.title = 'Precedente';
        prevButton.id = 'prev-location';
        prevButton.style.cursor = 'pointer';
        prevButton.style.border = 'none';
        prevButton.style.background = 'transparent';
        prevButton.style.borderRadius = '50%';
        prevButton.style.width = '36px';
        prevButton.style.height = '36px';
        
        // Play/Pause button
        const playPauseButton = L.DomUtil.create('button', '', container);
        playPauseButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" /></svg>';
        playPauseButton.className = 'p-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-full transition duration-300 focus:outline-none mx-1';
        playPauseButton.title = 'Riproduci';
        playPauseButton.id = 'play-pause-button';
        playPauseButton.style.cursor = 'pointer';
        playPauseButton.style.border = 'none';
        playPauseButton.style.background = '#4f46e5';
        playPauseButton.style.color = 'white';
        playPauseButton.style.borderRadius = '50%';
        playPauseButton.style.width = '36px';
        playPauseButton.style.height = '36px';
        
        // Next button
        const nextButton = L.DomUtil.create('button', '', container);
        nextButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" /></svg>';
        nextButton.className = 'p-2 hover:bg-gray-100 rounded-full transition duration-300 focus:outline-none ml-1';
        nextButton.title = 'Successivo';
        nextButton.id = 'next-location';
        nextButton.style.cursor = 'pointer';
        nextButton.style.border = 'none';
        nextButton.style.background = 'transparent';
        nextButton.style.borderRadius = '50%';
        nextButton.style.width = '36px';
        nextButton.style.height = '36px';
        
        // Stop events from propagating to the map (prevents clicks on buttons from panning the map)
        L.DomEvent.disableClickPropagation(container);
        L.DomEvent.disableScrollPropagation(container);
        
        // Add event listeners
        prevButton.addEventListener('click', function() {
          if (currentIndex > 0 && !isTransitioning) {
            if (isAutoPlaying) toggleAutoPlay();
            navigateTo(currentIndex - 1, items, markers, map, pathLayer, false);
          }
        });
        
        playPauseButton.addEventListener('click', function() {
          toggleAutoPlay();
        });
        
        nextButton.addEventListener('click', function() {
          if (currentIndex < items.length - 1 && !isTransitioning) {
            if (isAutoPlaying) toggleAutoPlay();
            navigateTo(currentIndex + 1, items, markers, map, pathLayer, false);
          }
        });
        
        return container;
      }
    });
    
    // Add the custom control to the map
    new customControl().addTo(map);
    
    // Initial button states
    updateControlButtonsState(currentIndex, validItems.length);
  }
  
  // Function to toggle autoplay
  function toggleAutoPlay() {
    isAutoPlaying = !isAutoPlaying;
    const playPauseButton = document.getElementById('play-pause-button');
    
    if (!playPauseButton) {
      console.error('Play/Pause button not found');
      return;
    }
    
    if (isAutoPlaying) {
      // Update button to show pause icon
      playPauseButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 00-1 1v2a1 1 0 001 1h6a1 1 0 001-1V9a1 1 0 00-1-1H7z" clip-rule="evenodd" /></svg>';
      playPauseButton.title = 'Pausa';
      
      // Start autoplay if not at the end
      if (currentIndex < validItems.length - 1 && !isTransitioning) {
        autoPlayInterval = setTimeout(() => {
          navigateTo(currentIndex + 1, validItems, markers, map, pathLayer, true);
        }, 1000);
      } else if (currentIndex === validItems.length - 1) {
        // If at the end, go back to the beginning
        navigateTo(0, validItems, markers, map, pathLayer, true);
      }
    } else {
      // Update button to show play icon
      playPauseButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" /></svg>';
      playPauseButton.title = 'Riproduci';
      
      // Clear autoplay interval
      if (autoPlayInterval) {
        clearTimeout(autoPlayInterval);
        autoPlayInterval = null;
      }
    }
  }
  
  // Navigation function
  function navigateTo(index, items, markers, map, pathLayer, autoTriggered = false) {
    if (index >= 0 && index < items.length && !isTransitioning) {
      isTransitioning = true;
      
      // Update current index
      currentIndex = index;
      
      // Update markers
      updateMarkers(index, markers);
      
      // Update path
      drawPath(items, index, pathLayer);
      
      // Show location details with animation
      const detailsPanel = document.getElementById('location-details');
      detailsPanel.classList.add('fade-out');
      
      setTimeout(() => {
        showEnhancedLocationDetails(items[index], index, items.length);
        detailsPanel.classList.remove('fade-out');
        detailsPanel.classList.add('fade-in');
        
        setTimeout(() => {
          detailsPanel.classList.remove('fade-in');
        }, 500);
      }, 500);
      
      // Center the map on the current marker with animation
      map.flyTo(
        [parseFloat(items[index].latitude), parseFloat(items[index].longitude)],
        15,
        {
          duration: 1.5,
          easeLinearity: 0.25
        }
      );
      
      // Update dots navigation
      updateDotsNavigation(index);
      
      // Update progress bar
      updateProgressBar(index, items.length);
      
      // Enable navigation after animation completes
      setTimeout(() => {
        isTransitioning = false;
        
        // If autoplay is on and this wasn't triggered by a manual click
        if (isAutoPlaying && autoTriggered && currentIndex < items.length - 1) {
          // Continue to the next item
          autoPlayInterval = setTimeout(() => {
            navigateTo(currentIndex + 1, items, markers, map, pathLayer, true);
          }, 5000); // Wait 5 seconds between locations
        } else if (isAutoPlaying && autoTriggered && currentIndex === items.length - 1) {
          // Reached the end, stop autoplay
          toggleAutoPlay();
        }
      }, 1500);
      
      // Update control buttons state
      updateControlButtonsState(currentIndex, items.length);
    }
  }
  
  // Function to update control buttons state
  function updateControlButtonsState(index, totalItems) {
    const prevButton = document.getElementById('prev-location');
    const nextButton = document.getElementById('next-location');
    
    // Update button states
    if (prevButton) {
      prevButton.disabled = index === 0;
      prevButton.style.opacity = index === 0 ? '0.5' : '1';
      prevButton.style.cursor = index === 0 ? 'not-allowed' : 'pointer';
    }
    
    if (nextButton) {
      nextButton.disabled = index === totalItems - 1;
      nextButton.style.opacity = index === totalItems - 1 ? '0.5' : '1';
      nextButton.style.cursor = index === totalItems - 1 ? 'not-allowed' : 'pointer';
    }
  }
  
  // Function to create dots navigation for mobile
  function createDotsNavigation(totalItems) {
    const dotsContainer = document.getElementById('dots-navigation');
    if (!dotsContainer) return;
    
    const dotsWrapper = document.createElement('div');
    dotsWrapper.className = 'flex space-x-2';
    
    for (let i = 0; i < totalItems; i++) {
      const dot = document.createElement('button');
      dot.className = `w-3 h-3 rounded-full transition-all ${i === 0 ? 'bg-indigo-600 w-6' : 'bg-gray-300'}`;
      dot.setAttribute('aria-label', `Vai a ${i + 1}`);
      dot.setAttribute('data-index', i);
      
      dot.addEventListener('click', () => {
        // If autoplay is running, pause it
        if (isAutoPlaying) {
          toggleAutoPlay();
        }
        
        navigateTo(i, validItems, markers, map, pathLayer, false);
      });
      
      dotsWrapper.appendChild(dot);
    }
    
    dotsContainer.appendChild(dotsWrapper);
  }
  
  // Function to update dots navigation
  function updateDotsNavigation(currentIndex) {
    const dotsContainer = document.getElementById('dots-navigation');
    if (!dotsContainer) return;
    
    const dots = dotsContainer.querySelectorAll('button');
    
    dots.forEach((dot, index) => {
      if (index === currentIndex) {
        dot.className = 'w-6 h-3 rounded-full transition-all bg-indigo-600';
      } else if (index < currentIndex) {
        dot.className = 'w-3 h-3 rounded-full transition-all bg-indigo-300';
      } else {
        dot.className = 'w-3 h-3 rounded-full transition-all bg-gray-300';
      }
    });
  }
  
  // Function to update progress bar
  function updateProgressBar(currentIndex, totalItems) {
    const progressIndicator = document.getElementById('progress-indicator');
    if (progressIndicator) {
      const progressPercentage = ((currentIndex + 1) / totalItems) * 100;
      progressIndicator.style.width = `${progressPercentage}%`;
    }
  }
}

// Function to show the enhanced location details
function showEnhancedLocationDetails(item, index, totalItems) {
  const detailsPanel = document.getElementById('location-details');
  if (!detailsPanel) return;
  
  // Update the panel content with enhanced styling
  detailsPanel.innerHTML = `
    <div class="p-6">
      ${item.image_url ? `
        <div class="relative mb-6 overflow-hidden rounded-xl h-48 md:h-64 shadow-md">
          <img src="${item.image_url}" alt="${item.Name || 'Immagine luogo'}" class="w-full h-full object-cover transition-transform duration-10000 hover:scale-110">
          <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-4 py-3">
            <div class="flex items-center justify-between">
              <h2 class="text-white text-xl font-bold">${item.Name || 'Luogo senza nome'}</h2>
              <span class="bg-indigo-600 text-white px-2 py-1 rounded-full text-xs">
                ${index + 1}/${totalItems}
              </span>
            </div>
          </div>
        </div>
      ` : `
        <div class="mb-4 flex justify-between items-center">
          <h2 class="text-xl font-bold text-gray-900">${item.Name || 'Luogo senza nome'}</h2>
          <span class="bg-indigo-600 text-white px-2 py-1 rounded-full text-xs">
            ${index + 1}/${totalItems}
          </span>
        </div>
      `}
      
      <div class="mb-4 flex flex-wrap gap-2">
        ${item.Date ? `
          <span class="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full">
            ${item.Date}
          </span>
        ` : ''}
        ${item.Type ? `
          <span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
            ${item.Type}
          </span>
        ` : ''}
        ${item.Category ? `
          <span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
            ${item.Category}
          </span>
        ` : ''}
        ${item.Location ? `
          <span class="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
            ${item.Location}
          </span>
        ` : ''}
      </div>
      
      <div class="prose text-gray-700 mb-6">
        ${item.Description || 'Nessuna descrizione disponibile.'}
      </div>
      
      <div class="mt-6 pt-4 border-t border-gray-200">
        <a href="elemento.html?id=${item.id || ''}" class="text-indigo-600 font-medium hover:text-indigo-800 transition duration-300">
          Visualizza dettagli completi
        </a>
      </div>
    </div>
  `;
}

// Function to update markers
function updateMarkers(currentIndex, markers) {
  // Reset all markers to their default style
  markers.forEach((marker, i) => {
    // Create a new custom icon based on the marker state
    const customIcon = L.divIcon({
      className: 'custom-marker',
      html: `<div class="marker-container ${i === currentIndex ? 'active' : ''}">
              <div class="marker-point"></div>
              <div class="marker-pulse"></div>
              <div class="marker-number">${i + 1}</div>
            </div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });
    
    // Update the marker icon
    marker.setIcon(customIcon);
    
    // Close all popups
    if (marker.isPopupOpen()) {
      marker.closePopup();
    }
  });
  
  // Highlight the current marker
  if (markers[currentIndex]) {
    markers[currentIndex].setZIndexOffset(1000);
    markers[currentIndex].openPopup();
  }
}

// Function to draw the path connecting visited locations
function drawPath(items, currentIndex, pathLayer) {
  // Clear the existing path
  pathLayer.clearLayers();
  
  if (currentIndex > 0) {
    // Create points for all visited locations
    const pathPoints = items.slice(0, currentIndex + 1).map(item => 
      [parseFloat(item.latitude), parseFloat(item.longitude)]
    );
    
    // Create a polyline with dashed style
    const path = L.polyline(pathPoints, {
      color: '#4f46e5',
      weight: 3,
      opacity: 0.8,
      dashArray: '10, 10',
      className: 'animated-path'
    });
    
    pathLayer.addLayer(path);
  }
}

// Function to add custom styles
function addCustomStyles() {
  if (!document.getElementById('custom-storymap-styles')) {
    const style = document.createElement('style');
    style.id = 'custom-storymap-styles';
    style.innerHTML = `
      /* Marker styles */
      .custom-marker {
        background: transparent;
        border: none;
      }
      .marker-container {
        position: relative;
        width: 40px;
        height: 40px;
      }
      .marker-point {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 16px;
        height: 16px;
        background: #4f46e5;
        border-radius: 50%;
        transform: translate(-50%, -50%);
        z-index: 2;
        box-shadow: 0 0 0 2px white;
        transition: all 0.3s ease;
      }
      .marker-container.active .marker-point {
        background: #ef4444;
        width: 20px;
        height: 20px;
      }
      .marker-pulse {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 40px;
        height: 40px;
        background: rgba(79, 70, 229, 0.2);
        border-radius: 50%;
        z-index: 1;
        animation: pulse 1.5s infinite;
      }
      .marker-container.active .marker-pulse {
        background: rgba(239, 68, 68, 0.2);
      }
      .marker-number {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: white;
        font-size: 10px;
        font-weight: bold;
        z-index: 3;
      }
      
      /* Animation for pulsing effect */
      @keyframes pulse {
        0% {
          transform: translate(-50%, -50%) scale(0.5);
          opacity: 1;
        }
        100% {
          transform: translate(-50%, -50%) scale(1.5);
          opacity: 0;
        }
      }
      
      /* Animation for path line */
      @keyframes dash {
        to {
          stroke-dashoffset: -20;
        }
      }
      .animated-path {
        animation: dash 1s linear infinite;
      }
      
      /* Fade animations for content transitions */
      .fade-out {
        opacity: 0;
        transition: opacity 0.5s ease;
      }
      .fade-in {
        opacity: 1;
        transition: opacity 0.5s ease;
      }
      
      /* Control panel styles */
      .leaflet-custom-control {
        z-index: 1000 !important;
        pointer-events: auto !important;
      }
      
      /* Make sure Leaflet container has correct z-index stacking */
      .leaflet-control-container {
        z-index: 800;
      }
      
      /* Ensure control buttons remain above map elements */
      .leaflet-bottom.leaflet-right {
        z-index: 1000 !important;
      }
      
      /* Fix SVG icon display in control buttons */
      .leaflet-custom-control svg {
        width: 20px;
        height: 20px;
        display: block;
      }
    `;
    document.head.appendChild(style);
  }
}

// Export the function
window.initializeEnhancedStorymap = initializeEnhancedStorymap;

// Debugging function to check control panel visibility
function debugControlPanel() {
  setTimeout(() => {
    const controlPanel = document.getElementById('control-panel');
    if (controlPanel) {
      console.log('Control panel found in DOM:', controlPanel);
      console.log('Control panel style:', window.getComputedStyle(controlPanel));
      
      // Check if control panel is in the viewport
      const rect = controlPanel.getBoundingClientRect();
      const isVisible = (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
      );
      
      console.log('Control panel visible in viewport:', isVisible);
      console.log('Control panel position:', rect);
      
      // In case of visibility issues, force the control panel to be visible
      if (!isVisible) {
        console.log('Fixing control panel visibility...');
        controlPanel.style.zIndex = '10000';
        controlPanel.style.position = 'fixed';
        controlPanel.style.bottom = '20px';
        controlPanel.style.right = '20px';
      }
    } else {
      console.error('Control panel not found in DOM');
    }
  }, 2000); // Check after map initialization
}

// Example of how to integrate with your existing code
document.addEventListener('DOMContentLoaded', async function() {
  try {
    // Use your existing functions to load data
    const data = await parseData(); // Your data loading function
    
    // Get the path name from URL (using your existing function)
    const pathName = getPathNameFromUrl();
    
    // Filter items for the current path
    const pathItems = data.filter(item => item.storytelling_path === pathName);
    
    if (pathItems.length === 0) {
      throw new Error('Nessun elemento trovato per questo percorso.');
    }
    
    // Initialize the enhanced storymap instead of your original function
    // Replace initializeStorymap(pathItems, pathName) with:
    initializeEnhancedStorymap(pathItems, pathName);
    
    // Run debug check for control panel visibility
    debugControlPanel();
    
  } catch (error) {
    console.error('Errore nel caricamento del percorso:', error);
    // Use your existing error function
    showError('Si è verificato un errore nel caricamento del percorso: ' + error.message);
  }
});

// You can continue using other functions from your original code
// Such as getPathNameFromUrl() and showError()

function getPathNameFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('percorso');
}

function showError(message) {
  const mainContainer = document.getElementById('main-content');
  if (!mainContainer) return;
  
  mainContainer.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
      <div class="bg-red-50 border border-red-200 rounded-lg p-6 inline-block mx-auto">
        <svg class="w-12 h-12 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
        </svg>
        <h2 class="text-xl font-bold text-red-700 mt-4">${message}</h2>
        <a href="index.html" class="mt-6 inline-block text-indigo-600 hover:text-indigo-800">&larr; Torna alla pagina principale</a>
      </div>
    </div>
  `;
}