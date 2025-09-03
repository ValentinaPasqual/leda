const base = import.meta.env.BASE_URL;

import { loadConfiguration, saveConfiguration } from './configLoader.js';

// Create a parser object with support for catalogue + geodata structure
const dataParser = {
  // Initialize with default config
  config: { datasetConfig: { multivalue_rows: {}, fields: {} } },
  
  // Initialize the parser
  async init() {
    try {
      // Load configuration
      const loadedConfig = await loadConfiguration();
      
      // Only update config if something valid was returned
      if (loadedConfig) {
        this.config = loadedConfig;
        
        // Ensure datasetConfig always exists
        if (!this.config.datasetConfig) {
          this.config.datasetConfig = { multivalue_rows: {}, fields: {} };
        } else {
          if (!this.config.datasetConfig.multivalue_rows) {
            this.config.datasetConfig.multivalue_rows = {};
          }
          if (!this.config.datasetConfig.fields) {
            this.config.datasetConfig.fields = {};
          }
        }
      } else {
        console.warn('loadConfiguration returned undefined or null, using default config');
      }
      
      return this;
    } catch (error) {
      console.error('Error loading configuration:', error);
      // Don't throw error, fall back to default config
      console.warn('Using default configuration due to error');
      return this;
    }
  },
  
  // New method to save configuration changes
  async saveConfig() {
    try {
      await saveConfiguration(this.config);
      console.log('Configuration saved successfully with updated fields');
      return true;
    } catch (error) {
      console.error('Error saving configuration:', error);
      return false;
    }
  },
  
  async parseData() {
    try {
      // Fetch both TSV files in parallel
      const [catalogueResponse, geodataResponse] = await Promise.all([
        fetch(`${base}/data/references.tsv`),
        fetch(`${base}/data/locations.tsv`)
      ]);
      
      const [catalogueText, geodataText] = await Promise.all([
        catalogueResponse.text(),
        geodataResponse.text()
      ]);
      
      // Parse both files to JSON and collect field information
      const catalogueData = this.parseTsvToJson(catalogueText);
      const geodataData = this.parseTsvToJson(geodataText);
      
      // Collect unique field names from both datasets
      const catalogueFields = catalogueData.length > 0 ? Object.keys(catalogueData[0]) : [];
      const geodataFields = geodataData.length > 0 ? Object.keys(geodataData[0]) : [];
      
      // Store field information in config
      const newFields = {
        catalogue: catalogueFields,
        geodata: geodataFields,
        all: [...new Set([...catalogueFields, ...geodataFields])] // Combined unique fields
      };
      
      // Check if fields have changed before saving
      const currentFields = this.config.datasetConfig.fields;
      const fieldsChanged = JSON.stringify(currentFields) !== JSON.stringify(newFields);
      
      if (fieldsChanged) {
        this.config.datasetConfig.fields = newFields;
        console.log('Dataset fields updated:', this.config.datasetConfig.fields);
        
        // Save the updated configuration to file
        const saveSuccess = await this.saveConfig();
        if (saveSuccess) {
          console.log('Fields permanently saved to config file');
        } else {
          console.warn('Failed to save fields to config file');
        }
      } else {
        console.log('Fields unchanged, no need to update config file');
      }
      
      // Determine which field to use for joining
      let joinField = null;
      
      // Check if both datasets have "Location" field
      if (catalogueFields.includes('Location') && geodataFields.includes('Location')) {
        joinField = 'Location';
      }
      // Check if both datasets have "Titolo" field
      else if (catalogueFields.includes('Titolo') && geodataFields.includes('Titolo')) {
        joinField = 'Titolo';
      }
      
      if (!joinField) {
        console.warn('No common join field found. Available fields:');
        console.warn('Catalogue fields:', catalogueFields);
        console.warn('Geodata fields:', geodataFields);
        // Return combined data without joining
        return this.processMultivalueFields([...catalogueData, ...geodataData]);
      }
      
      console.log(`Using "${joinField}" as join field`);
      
      // Create the final dataset by merging each geodata entry with ALL matching catalogue entries
      const finalData = [];
      
      geodataData.forEach(placeEntry => {
        // Find ALL catalogue entries that match this join field
        const matchingCatalogueEntries = catalogueData.filter(book => 
          book[joinField] === placeEntry[joinField]
        );
        
        if (matchingCatalogueEntries.length > 0) {
          // Create a merged entry for each matching catalogue entry
          matchingCatalogueEntries.forEach(catalogueEntry => {
            const mergedEntry = {
              ...catalogueEntry,  // Add all catalogue data first
              ...placeEntry       // Then add geodata (overwrites any duplicate keys)
            };
            finalData.push(mergedEntry);
          });
        } else {
          // If no catalogue match, just add the geodata entry
          finalData.push(placeEntry);
        }
      });
      
      // Process multivalue fields
      const jsonData = this.processMultivalueFields(finalData);
      
      return jsonData;
    } catch (error) {
      console.error('Error in parseData:', error);
      return []; // Return empty array instead of throwing
    }
  },
  
  // Process multivalue fields (unchanged)
  processMultivalueFields(preprocessJsonData) {
    // Safe access to multivalue_rows with double fallback
    const multivalueConfig = this.config?.datasetConfig?.multivalue_rows || {};
    
    preprocessJsonData.forEach(item => {
      Object.keys(multivalueConfig).forEach(field => {
        if (item[field] && typeof item[field] === 'string') {
          const separator = multivalueConfig[field];
          item[field] = item[field].split(separator).map(val => val.trim());
        }
      });
    });
    
    return preprocessJsonData;
  },
  
  // Helper method to parse TSV to JSON with proper cleaning
  parseTsvToJson(tsvText) {
    // Split the TSV text into rows, handling both \r\n and \n line endings
    const rows = tsvText.trim().split(/\r?\n/);
    
    // Extract headers from the first row and trim whitespace
    const headers = rows[0].split('\t').map(header => header.trim());
    
    // Convert each data row to a JSON object
    return rows.slice(1).map(row => {
      const values = row.split('\t');
      const item = {};
      
      // Map each value to its corresponding header
      headers.forEach((header, index) => {
        // Handle the case where cell is not empty
        if (index < values.length && values[index] !== '') {
          // Clean the value by removing carriage returns and trimming whitespace
          const value = values[index].replace(/\r/g, '').trim();
          
          // Skip empty values after cleaning
          if (value === '') return;
          
          // Try to parse numbers and booleans
          if (value.toLowerCase() === 'true') {
            item[header] = true;
          } else if (value.toLowerCase() === 'false') {
            item[header] = false;
          } else if (!isNaN(value) && value.trim() !== '') {
            // Special case for join fields - keep as string to ensure consistent matching
            if (header === 'Location' || header === 'Titolo') {
              item[header] = value;
            } else {
              item[header] = Number(value);
            }
          } else {
            item[header] = value;
          }
        } 
      });
      
      return item;
    });
  },
};

// Also export the parseData function for backward compatibility
export const parseData = async () => {
  // Always initialize first
  await dataParser.init();
  return dataParser.parseData();
};

// Export the parser object
export { dataParser };