// Enhanced initMap.js with polygon toggle system integrated

import 'leaflet/dist/leaflet.css'; 
import L from 'leaflet';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import 'leaflet-providers';

import '../styles/tailwind.css'
import { PolygonManager } from './polygonManager.js';
import { createPopupContent } from './popupManager.js';

function initMap(config) {
    const { initialView, initialZoom, tileLayer = config.map.tileLayers[Object.keys(config.map.tileLayers)[0]].tileLayer, attribution = config.map.tileLayers[Object.keys(config.map.tileLayers)[0]].attribution } = config.map;

    const map = L.map('map').setView(initialView, initialZoom);
    L.tileLayer(tileLayer, { attribution }).addTo(map);

    window.map = map; 

    // Special coordinates that get unique treatment
    const SPECIAL_COORDS = [38.7200, -24.2200];
    const SPECIAL_COORDS_KEY = `${SPECIAL_COORDS[0]},${SPECIAL_COORDS[1]}`;

    // Store reference to focus callback and polygon manager
    let focusResultCallback = null;
    let polygonManager = null;

    polygonManager = new PolygonManager(map);
    polygonManager.loadPolygonRepository();

    // ===========================================
    // POLYGON TOGGLE SYSTEM - INTEGRATED
    // ===========================================
    
    // Variabile globale per tracciare lo stato dei poligoni
    window.polygonState = {
        visiblePolygons: new Set(),
        polygonManager: polygonManager
    };

    /**
     * Genera un ID univoco per la location
     */
    function getLocationId(coords, locationName) {
        if (coords && coords.length >= 2) {
            return `coord_${coords[0]}_${coords[1]}`;
        }
        return `name_${locationName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`;
    }

    // Create a custom icon using Lucide MapPin
    const createCustomIcon = (count, isSpecial = false) => {
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" class="${isSpecial ? 'fill-red-500' : 'fill-secondary-700'} stroke-white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
      `;

      return L.divIcon({
        html: svg,
        className: isSpecial ? 'custom-marker special-marker' : 'custom-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 24],
        popupAnchor: [0, -24]
      });
    };
    
    // Initialize marker cluster group
    const markers = L.markerClusterGroup({
      disableClusteringAtZoom: 15,
      showCoverageOnHover: true,
      zoomToBoundsOnClick: true,
      spiderfyOnMaxZoom: true,
      removeOutsideVisibleBounds: true,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        const svg = `
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="18" class="fill-secondary-700 stroke-white" stroke-width="2"/>
            <text x="20" y="20" text-anchor="middle" dy=".3em" class="fill-secondary-200 text-sm font-sans" font-size="14">${count}</text>
          </svg>
        `;

        return L.divIcon({
          html: svg,
          className: 'custom-cluster',
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        });
      }
    }).addTo(map);

    // Add custom CSS
    const style = document.createElement('style');
    document.head.appendChild(style);

    // Store reference to special circle for cleanup
    let specialCircle = null;
    
    // Storage for different marker types
    let pinMarkers = [];
    let circleMarkers = [];
    let circleLabels = [];

    // FIXED: Function to load polygon for a specific location (legacy support)
    const loadPolygonForLocation = async (lat, lon, locationName) => {
      if (!polygonManager) {
        console.warn('PolygonManager not initialized');
        return;
      }

      // Clear existing polygons
      polygonManager.clearAllPolygons();

      // Create location data with coordinates only (no OSM data needed)
      const locationData = {
        display_name: locationName,
        lat: lat,
        lon: lon
      };

      try {
        console.log(`Loading polygon for ${locationName} at ${lat}, ${lon}`);
        
        // Try to find polygon by location name in the repository
        await polygonManager.loadPolygonRepository();
        const polygon = polygonManager.findPolygonByName(locationName);
        
        if (polygon) {
          const layer = polygonManager.createPolygonLayer(polygon, locationData);
          polygonManager.polygonLayers.set(polygonManager.getLocationId(locationData), {
            layer,
            data: locationData,
            highlighted: false
          });
          polygonManager.polygonLayerGroup.addLayer(layer);
          
          // Fit map to show the polygon
          setTimeout(() => {
            polygonManager.fitBoundsToAll();
          }, 100);
          console.log(`Successfully loaded polygon for ${locationName}`);
        } else {
          console.log(`No polygon found for ${locationName}`);
        }
      } catch (error) {
        console.error(`Error loading polygon for ${locationName}:`, error);
      }
    };

    // Function to create focus button for an item
    const createFocusButton = (item) => {
      return `
        <button class="focus-result-btn w-full text-left p-1 rounded text-xs" 
                data-item-id="${item.pivot_ID}"
                onclick="window.focusOnResult('${item.pivot_ID}')"
                title="Vai al risultato nella lista">
          <div class="flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="w-3 h-3 flex-shrink-0">
              <path fill-rule="evenodd" d="M6.5 1.75a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 .75.75V3h-3V1.75ZM8 4a.75.75 0 0 1 .75.75v3.5h3.5a.75.75 0 0 1 0 1.5h-3.5v3.5a.75.75 0 0 1-1.5 0v-3.5h-3.5a.75.75 0 0 1 0-1.5h3.5v-3.5A.75.75 0 0 1 8 4Z" clip-rule="evenodd" />
            </svg>
            <span class="truncate">Mostra nei risultati</span>
          </div>
        </button>
      `;
    };

    // Add these variables at the top of your initMap function, after the existing variables
    let currentMarkerType = 'clusters'; // default
    let currentFilteredItems = []; // store current filtered items

    // Function to clear all markers from map
    const clearAllMarkers = () => {
        console.log('Clearing all markers...');
        
        // Clear cluster markers (remove from map and clear the group)
        if (markers) {
            map.removeLayer(markers);
            markers.clearLayers();
            // Re-add the empty cluster group to the map
            markers.addTo(map);
        }
        
        // Clear pin markers
        pinMarkers.forEach(marker => {
            if (map.hasLayer(marker)) {
                map.removeLayer(marker);
            }
        });
        pinMarkers.length = 0; // Clear array completely
        
        // Clear circle markers and labels
        circleMarkers.forEach(circle => {
            if (map.hasLayer(circle)) {
                map.removeLayer(circle);
            }
        });
        circleLabels.forEach(label => {
            if (map.hasLayer(label)) {
                map.removeLayer(label);
            }
        });
        circleMarkers.length = 0; // Clear array completely
        circleLabels.length = 0; // Clear array completely
        
        // Clear special circle
        if (specialCircle && map.hasLayer(specialCircle)) {
            map.removeLayer(specialCircle);
            specialCircle = null;
        }
        
        console.log('All markers cleared. Arrays reset.');
    };

    // Function to show clusters (your existing logic)
    const showClusters = () => {
        // Group filtered items by coordinates
        const locationGroups = {};
        
        currentFilteredItems.forEach(item => {    
            if (!item.lat_long) return;
            
            const coords = item.lat_long.split(',').map(coord => parseFloat(coord.trim()));
            if (coords.length !== 2 || isNaN(coords[0]) || isNaN(coords[1])) {
                console.error('Invalid coordinates:', item.lat_long);
                return;
            }
            
            const [latitude, longitude] = coords;
            const key = `${latitude},${longitude}`;
            const locationName = item["Location"] || "Unknown Location";
            
            if (!locationGroups[key]) {
                locationGroups[key] = {
                    name: locationName, 
                    items: [],
                    coords: [latitude, longitude]
                };
            }
            
            locationGroups[key].items.push(item);
        });

        // Create clustered markers
        Object.values(locationGroups).forEach(group => {
          const { name, items, coords } = group;
          const coordsKey = `${coords[0]},${coords[1]}`;
          const isSpecial = coordsKey === SPECIAL_COORDS_KEY;

          const marker = L.marker(coords, {
            icon: createCustomIcon(items.length, isSpecial)
          });

          if (isSpecial) {
                specialCircle = L.circle(coords, {
                    className: 'special',
                    fillOpacity: 0.15,
                    radius: 50000,
                    weight: 4
                }).addTo(map);
            }

          marker.bindPopup(() => createPopupContent(group.name, group.items, group.coords, isSpecial, config));

          markers.addLayer(marker);
        });

    };

    const showPinsWithNumbers = () => {
        const locationGroups = {};
        
        currentFilteredItems.forEach(item => {    
            if (!item.lat_long) return;
            
            const coords = item.lat_long.split(',').map(coord => parseFloat(coord.trim()));
            if (coords.length !== 2 || isNaN(coords[0]) || isNaN(coords[1])) {
                return;
            }
            
            const [latitude, longitude] = coords;
            const key = `${latitude},${longitude}`;
            const locationName = item["Location"] || "Unknown Location";
            
            if (!locationGroups[key]) {
                locationGroups[key] = {
                    name: locationName, 
                    items: [],
                    coords: [latitude, longitude]
                };
            }
            
            locationGroups[key].items.push(item);
        });

        // Get all occurrence counts to determine color scale
        const allCounts = Object.values(locationGroups).map(group => group.items.length);
        const maxCount = Math.max(...allCounts);
        const minCount = Math.min(...allCounts);

        // Function to get primary color shade based on count (from lightest to darkest)
        const getPrimaryShade = (count) => {
            if (maxCount === minCount) {
                return { bg: 'bg-secondary-500', text: 'text-white' }; // Default shade if all counts are the same
            }
            
            // Normalize count to 0-1 range
            const normalized = (count - minCount) / (maxCount - minCount);
            
            // Map to shade range (100-900, where 100 is lightest for lowest count, 900 is darkest for highest count)
            const shadeValue = 1 + Math.round(normalized * 8); // 1-9 range
            const shade = shadeValue * 100; // 100-900
            
            // Determine text color based on shade (light backgrounds get dark text, dark backgrounds get light text)
            const textColor = shade <= 400 ? 'text-secondary-900' : 'text-white';
            
            return { bg: `bg-secondary-${shade}`, text: textColor };
        };

        // Create individual pin markers with numbers
        Object.values(locationGroups).forEach(group => {
            const { name, items, coords } = group;
            const coordsKey = `${coords[0]},${coords[1]}`;
            const isSpecial = coordsKey === SPECIAL_COORDS_KEY;
            const count = items.length;

            // Get the appropriate color classes
            const colorClasses = isSpecial ? 
                { bg: '', text: '' } : 
                getPrimaryShade(count);

            // Create a numbered pin icon
            const numberedIcon = L.divIcon({
                html: `<div class="numbered-pin">
                        <div class="pin-number ${colorClasses.bg} ${colorClasses.text}">${count}</div>
                        <div class="pin-point"></div>
                      </div>`,
                className: 'numbered-pin-container',
                iconSize: [30, 40],
                iconAnchor: [15, 40],
                popupAnchor: [0, -40]
            });

            const marker = L.marker(coords, {
                icon: numberedIcon
            });

            // Bind popup con evento per aggiornare stato quando si apre
            marker.bindPopup(() => {
                // Ricrea il contenuto del popup ogni volta che viene aperto
                return createPopupContent(group.name, group.items, group.coords, isSpecial, config);
            });

            if (isSpecial) {
                specialCircle = L.circle(coords, {
                    className: 'special',
                    fillOpacity: 0.15,
                    radius: 8000,
                    weight: 4
                }).addTo(map);
            }

            // Add to pin markers array and map
            pinMarkers.push(marker);
            marker.addTo(map);
        });
    };

    // Function to show proportional circles without displaying counts
    const showProportionalCircles = () => {
        const locationGroups = {};
        
        currentFilteredItems.forEach(item => {    
            if (!item.lat_long) return;
            
            const coords = item.lat_long.split(',').map(coord => parseFloat(coord.trim()));
            if (coords.length !== 2 || isNaN(coords[0]) || isNaN(coords[1])) {
                return;
            }
            
            const [latitude, longitude] = coords;
            const key = `${latitude},${longitude}`;
            const locationName = item["Location"] || "Unknown Location";
            
            if (!locationGroups[key]) {
                locationGroups[key] = {
                    name: locationName, 
                    items: [],
                    coords: [latitude, longitude]
                };
            }
            
            locationGroups[key].items.push(item);
        });

        // Find max count for proportional sizing
        const maxCount = Math.max(...Object.values(locationGroups).map(g => g.items.length));
        
        Object.values(locationGroups).forEach(group => {
            const { name, items, coords } = group;
            const coordsKey = `${coords[0]},${coords[1]}`;
            const isSpecial = coordsKey === SPECIAL_COORDS_KEY;
            
            // Calculate proportional radius based on square root for better visual scaling
            const minRadius = 800;
            const maxRadius = 5000;
            const normalizedCount = Math.sqrt(items.length / maxCount); // Square root for better visual proportion
            const radius = minRadius + (maxRadius - minRadius) * normalizedCount;
            
            // Get colors from Tailwind classes
            const getTailwindColor = (className) => {
                const element = document.createElement('div');
                element.className = className;
                element.style.display = 'none';
                document.body.appendChild(element);
                const color = getComputedStyle(element).backgroundColor;
                document.body.removeChild(element);
                return color;
            };
            
            const specialColor = getTailwindColor('bg-primary-500');
            const normalColor = getTailwindColor('bg-secondary-500');
            
            const circleColors = {
                color: isSpecial ? specialColor : normalColor,
                fillColor: isSpecial ? specialColor : normalColor
            };
            
            // Create proportional circle without count display
            const circle = L.circle(coords, {
                color: circleColors.color,
                fillColor: circleColors.fillColor,
                fillOpacity: 0.3,
                radius: radius,
                weight: items.length === 1 ? 2 : Math.min(2 + Math.floor(items.length / 5), 6) // Vary border thickness too
            });

            // Create popup content and bind it dynamically
            circle.bindPopup(() => {
                // Ricrea il contenuto del popup ogni volta che viene aperto
                return createPopupContent(group.name, group.items, group.coords, isSpecial, config);
            });

            // Add special circle if needed
            if (isSpecial) {
                specialCircle = L.circle(coords, {
                    radius: 8000,
                    className: 'special'
                }).addTo(map);
            }

            // Add to array and map
            circleMarkers.push(circle);
            circle.addTo(map);
        });
    };

    // Modify the renderMarkers function to store filtered items and delegate to marker type functions
    var renderMarkers = (filteredItems) => {
        // Store current filtered items for marker type switching
        currentFilteredItems = filteredItems;
        
        // Clear previous markers and special circle
        clearAllMarkers();
        
        // Delegate to appropriate marker rendering function
        switch(currentMarkerType) {
            case 'clusters':
                showClusters();
                break;
            case 'pins':
                showPinsWithNumbers();
                break;
            case 'circles':
                showProportionalCircles();
                break;
            default:
                showClusters();
        }

        // If no markers were added, log a message
        if (currentFilteredItems.length === 0) {
            console.log('No markers to display for current filter selection');
        } else {
            console.log(`Processed ${currentFilteredItems.length} items for map display`);
        }
    };

    // Function to switch marker type
    const switchMarkerType = (markerType) => {
        currentMarkerType = markerType;
        console.log(`Switching to marker type: ${markerType}`);
        // Re-render with current filtered items
        renderMarkers(currentFilteredItems);
    };

    // Function to set the focus callback
    const setFocusResultCallback = (callback) => {
        focusResultCallback = callback;
        // Make it globally accessible for the onclick handlers
        window.focusOnResult = callback;
    };

    // Make marker type switching globally accessible
    window.switchMarkerType = switchMarkerType;

    // Store references globally for external access
    window.pinMarkers = pinMarkers;
    window.circleMarkers = circleMarkers;
    window.circleLabels = circleLabels;
    window.markerClusterGroup = markers;

    // Return the API
    return {
        map,
        markers,
        renderMarkers,
        setFocusResultCallback,
        switchMarkerType,
        clearAllMarkers
    };
}

export { initMap };