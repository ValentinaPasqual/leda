/**
 * PolygonManager - Simplified version with only essential functions
 * Loads polygons from local repository using location name matching
 * Excludes Point geometries
 */

const base = import.meta.env.BASE_URL;


export class PolygonManager {
  constructor(map) {
    this.map = map;
    this.polygonLayers = new Map();
    this.polygonRepository = null;
    this.polygonLayerGroup = L.layerGroup().addTo(this.map);
  }

  /**
   * Check if geometry is valid for polygon display (not Point)
   */
  isValidGeometry(geojson) {
    if (!geojson?.type) return false;
    
    if (geojson.type === 'FeatureCollection') {
      return geojson.features?.some(f => this.isValidGeometry(f));
    }
    
    if (geojson.type === 'Feature') {
      return this.isValidGeometry(geojson.geometry);
    }
    
    return ['Polygon', 'MultiPolygon', 'LineString', 'MultiLineString'].includes(geojson.type);
  }

  /**
   * Filter out Point geometries from GeoJSON
   */
  filterValidGeometries(geojson) {
    if (!geojson?.type) return null;

    if (geojson.type === 'FeatureCollection') {
      const validFeatures = geojson.features.filter(f => this.isValidGeometry(f));
      return validFeatures.length > 0 ? { ...geojson, features: validFeatures } : null;
    }
    
    return this.isValidGeometry(geojson) ? geojson : null;
  }

  /**
   * Load polygon repository from local file
   */
  async loadPolygonRepository() {
    if (this.polygonRepository) return this.polygonRepository;

    try {
      console.log('Loading polygon repository...');
      const response = await fetch(`${base}/data/polygons.json`);
      if (!response.ok) throw new Error(`Failed to load: ${response.status}`);
      
      const rawData = await response.json();
      this.polygonRepository = {};
      
      // Clean data - only keep valid polygons
      for (const [key, info] of Object.entries(rawData)) {
        if (info?.osm_id && this.isValidGeometry(info.geojson)) {
          const filtered = this.filterValidGeometries(info.geojson);
          if (filtered) {
            this.polygonRepository[key] = { ...info, geojson: filtered };
          }
        }
      }
      
      console.log(`Loaded ${Object.keys(this.polygonRepository).length} valid polygons`);
      return this.polygonRepository;
    } catch (error) {
      console.error('Error loading polygon repository:', error);
      this.polygonRepository = {};
      return this.polygonRepository;
    }
  }

  /**
   * Find polygon by location name (fuzzy matching)
   */
  findPolygonByName(locationName) {
    if (!this.polygonRepository || !locationName) return null;

    const searchName = locationName.toLowerCase().trim();
    
    // First try exact match
    for (const [key, info] of Object.entries(this.polygonRepository)) {
      if (key.toLowerCase() === searchName) {
        return info.geojson;
      }
    }
    
    // Then try partial match
    for (const [key, info] of Object.entries(this.polygonRepository)) {
      if (key.toLowerCase().includes(searchName) || searchName.includes(key.toLowerCase())) {
        return info.geojson;
      }
    }
    
    return null;
  }

  /**
   * Create Leaflet layer from GeoJSON
   */
  createPolygonLayer(geojson, locationData) {
    return L.geoJSON(geojson, {
      style: this.defaultStyle,
      className: 'polygon', // Add the special CSS class
      onEachFeature: (feature, layer) => {
        layer.on({
          click: (e) => {
            L.DomEvent.stopPropagation(e);
          }
        });
      }
    });
  }

  /**
   * Clear all polygons
   */
  clearAllPolygons() {
    this.polygonLayerGroup.clearLayers();
    this.polygonLayers.clear();
  }

  /**
   * Fit map bounds to all polygons
   */
  fitBoundsToAll() {
    try {
      const layers = Array.from(this.polygonLayers.values()).map(p => p.layer);
      if (layers.length === 0) return;
      
      const group = new L.featureGroup(layers);
      const bounds = group.getBounds();
      
      if (bounds.isValid()) {
        this.map.fitBounds(bounds, { padding: [20, 20], maxZoom: 12 });
        console.log(`Fitted map bounds to ${layers.length} polygons`);
      }
    } catch (error) {
      console.warn('Could not fit bounds:', error);
    }
  }

  /**
   * Generate location ID
   */
  getLocationId(locationData) {
    if (locationData.lat && locationData.lon) {
      return `coord_${locationData.lat}_${locationData.lon}`;
    }
    return `name_${this.hash(locationData.display_name || 'unknown')}`;
  }

  /**
   * Simple hash function
   */
  hash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Cleanup
   */
  destroy() {
    this.clearAllPolygons();
    this.map.removeLayer(this.polygonLayerGroup);
    this.polygonLayers.clear();
    this.polygonRepository = null;
  }
}

export default PolygonManager;