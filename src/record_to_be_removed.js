/**
 * File: recordDataExtractor.js
 * Description: Extracts work title from URL and retrieves all related data 
 * from the parsed data source.
 */

import { parseData } from './utils/dataParser.js';

/**
 * Extracts the record title from the URL query parameter
 * @returns {string} The decoded title of the work
 */
function getRecordTitleFromUrl() {
  // Get the current URL
  const currentUrl = window.location.href;
  
  // Create a URL object to easily parse query parameters
  const url = new URL(currentUrl);
  
  // Get the "scheda" parameter value
  const encodedTitle = url.searchParams.get('scheda');
  
  // Return decoded title if it exists, otherwise return null
  return encodedTitle ? decodeURIComponent(encodedTitle) : null;
}

/**
 * Finds a record by its title from the parsed data
 * @param {string} title - The title to search for
 * @param {Array} data - The parsed data to search through
 * @returns {Object|null} The found record or null if not found
 */
function findRecordByTitle(title, data) {
  if (!title || !data || !Array.isArray(data)) {
    return null;
  }
  
  // Search for record with matching title
  return data.find(record => record.Titolo === title) || null;
}

/**
 * Extracts all headers and their related data for a given record
 * @param {Object} record - The record to extract headers from
 * @returns {Object} Object with headers as keys and their data as values
 */
function extractHeadersAndData(record) {
  if (!record) {
    return {};
  }
  
  // Create a result object containing all properties from the record
  // This assumes all properties of the record are headers with their data
  const result = {};
  
  for (const [header, data] of Object.entries(record)) {
    result[header] = data;
  }
  
  return result;
}

/**
 * Main function to extract data for the record specified in the URL
 */
async function extractRecordData() {
  try {
    // Get the record title from URL
    const recordTitle = getRecordTitleFromUrl();
    
    if (!recordTitle) {
      console.error('No record title found in URL');
      return null;
    }
    
    // Get parsed data
    const data = await parseData();
    
    // Find the record matching the title
    const record = findRecordByTitle(recordTitle, data);
    
    if (!record) {
      console.error(`Record with title "${recordTitle}" not found`);
      return null;
    }
    
    // Extract headers and their data
    const headersAndData = extractHeadersAndData(record);
    
    console.log('Record Title:', recordTitle);
    console.log('Record Data:', headersAndData);
    
    return headersAndData;
    
  } catch (error) {
    console.error('Error extracting record data:', error);
    return null;
  }
}

// Execute when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  extractRecordData()
    .then(data => {
      if (data) {
        // You can output the data to the page or perform other operations here
        // For example, render the data to a specific container:
        const container = document.getElementById('record-data-container');
        if (container) {
          renderRecordData(container, data);
        }
      }
    })
    .catch(error => {
      console.error('Failed to extract record data:', error);
    });
});

/**
 * Renders the record data into a DOM container
 * @param {HTMLElement} container - The container to render the data into
 * @param {Object} data - The headers and data to render
 */
function renderRecordData(container, data) {
  // Clear the container
  container.innerHTML = '';
  
  // Create a header for the title
  const titleHeader = document.createElement('h1');
  titleHeader.textContent = getRecordTitleFromUrl() || 'Record Details';
  container.appendChild(titleHeader);
  
  // Create a section for each header and its data
  for (const [header, value] of Object.entries(data)) {
    const section = document.createElement('section');
    section.className = 'record-data-section';
    
    const headerElement = document.createElement('h2');
    headerElement.textContent = header;
    section.appendChild(headerElement);
    
    const valueElement = document.createElement('div');
    valueElement.className = 'record-data-value';
    
    // Handle different types of values
    if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        const list = document.createElement('ul');
        value.forEach(item => {
          const listItem = document.createElement('li');
          listItem.textContent = typeof item === 'object' ? JSON.stringify(item) : item;
          list.appendChild(listItem);
        });
        valueElement.appendChild(list);
      } else {
        valueElement.textContent = JSON.stringify(value, null, 2);
      }
    } else {
      valueElement.textContent = value;
    }
    
    section.appendChild(valueElement);
    container.appendChild(section);
  }
}

export { extractRecordData, getRecordTitleFromUrl };