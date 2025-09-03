// Importa la funzione di inizializzazione della mappa
import { initMap } from './utils/initMap.js';
import { parseData } from './utils/dataParser.js';
import { loadConfiguration } from './utils/configLoader.js';
import './styles/tailwind.css'

// Funzione per aggiornare i contenuti dinamicamente
function updateProjectDescription(config) {
  // Aggiorna elementi in base agli attributi data-*
  const projectTitle = document.querySelector('[data-content="project-title"]');
  if (projectTitle) projectTitle.textContent = config.project.projectTitle;
  
  const projectSubtitle = document.querySelector('[data-content="project-subtitle"]');
  if (projectSubtitle) projectSubtitle.textContent = config.project.projectSubtitle;
  
  const mapInfoTitle = document.querySelector('[data-content="map-info-title"]');
  if (mapInfoTitle) mapInfoTitle.textContent = config.project.mapInfoTitle;
  
  const mapInfoDescription = document.querySelector('[data-content="map-info-description"]');
  if (mapInfoDescription) mapInfoDescription.textContent = config.project.mapInfoDescription;
  
  // **NUOVA GESTIONE THUMBNAIL**
  // Aggiunge/aggiorna la thumbnail del progetto usando data-content
  const projectThumbnail = document.querySelector('[data-content="project-thumbnail"]');
  if (projectThumbnail && config.project.projectThumbnailURL) {
    // Controlla se esiste già un'immagine
    let existingImage = projectThumbnail.querySelector('img');
    
    if (existingImage) {
      // Se esiste già, aggiorna solo il src e l'alt
      existingImage.src = config.project.projectThumbnailURL;
      existingImage.alt = config.project.projectShortTitle || 'Logo del progetto';
    } else {
      // Pulisce il contenuto esistente
      projectThumbnail.innerHTML = '';
      
      // Crea una nuova immagine
      const thumbnailImage = document.createElement('img');
      thumbnailImage.src = config.project.projectThumbnailURL;
      thumbnailImage.alt = config.project.projectShortTitle || 'Logo del progetto';
      thumbnailImage.className = 'h-20 object-contain'; // Dimensioni appropriate per l'header
      
      projectThumbnail.appendChild(thumbnailImage);
    }
  } else if (projectThumbnail && !config.project.projectThumbnailURL) {
    // Se il container esiste ma non c'è thumbnail nel config, rimuovi eventuali immagini
    const existingImage = projectThumbnail.querySelector('img');
    if (existingImage) {
      existingImage.remove();
    }
  }
  
  // Per il testo del titolo del progetto (codice esistente)
  const projectNameElement = document.querySelector('[data-content="project-name"]');
  if (projectNameElement) {
    // Troviamo l'ultimo nodo di testo che contiene "Il Progetto"
    let lastTextNode = null;
    for (let i = 0; i < projectNameElement.childNodes.length; i++) {
      if (projectNameElement.childNodes[i].nodeType === Node.TEXT_NODE) {
        lastTextNode = projectNameElement.childNodes[i];
      }
    }
    
    if (lastTextNode) {
      lastTextNode.textContent = "Il " + config.project.projectName;
    }
  }
  
  // Aggiorna i paragrafi della descrizione (codice esistente)
  const descParts = config.project.projectDescription.split('<br><br>');
  const desc1 = document.querySelector('[data-content="project-description-1"]');
  const desc2 = document.querySelector('[data-content="project-description-2"]');
  
  if (desc1 && descParts.length > 0) desc1.textContent = descParts[0];
  if (desc2 && descParts.length > 1) desc2.textContent = descParts[1];
  
  console.log("Contenuti aggiornati con successo");
}

// Funzione principale asincrona per la mappa
async function initializeMap(config, data) {
  try {
    // Crea un elemento container con ID specifico per Leaflet preso dal config file 
    const mapId = 'map';
    
    // Verifica se il container esiste già
    let mapContainer = document.getElementById(mapId);
    
    // Assicurati che la struttura della configurazione sia completa
    if (!config.map) {
      console.warn('Configurazione della mappa mancante, utilizzo configurazione predefinita');
      config.map = {
        initialView: [45.9763, 7.6586],
        initialZoom: 8,
        tileLayer: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      };
    }
    
    // Passa l'ID del container alla configurazione
    config.map.containerId = mapId;
    
    console.log(`Inizializzazione mappa con container ID: "${mapId}"`);
    
    // Inizializza la mappa con la configurazione UNA SOLA VOLTA
    const mapResult = initMap(config);
    const map = mapResult.map;
    const markers = mapResult.markers;
    const renderMarkers = mapResult.renderMarkers;
    
      // Aggiungi i dati alla mappa
      if (data && Array.isArray(data)) {
        console.log(`Aggiunti ${data.length} punti alla mappa`);
        
        // Usa la funzione renderMarkers per aggiungere i marker alla mappa già inizializzata
        if (renderMarkers && typeof renderMarkers === 'function') {
          renderMarkers(data);
        } else {
          console.warn('La funzione renderMarkers non è disponibile');
        }
        
        // Rendi i dati disponibili globalmente per altri moduli
        window.alpinismData = data;
      } else {
        console.warn('Nessun dato valido trovato o formato dati non valido');
      }
    
    console.log('Mappa inizializzata con successo');
  } catch (error) {
    console.error('Errore durante l\'inizializzazione della mappa:', error);
    
    // Mostra un messaggio di errore visibile
    const errorContainer = document.querySelector('.map-container') || document.body;
    const errorMessage = document.createElement('div');
    errorMessage.className = 'error-message p-4 bg-red-100 text-red-700 border border-red-300 rounded';
    errorMessage.textContent = 'Si è verificato un errore durante il caricamento della mappa. Ricarica la pagina per riprovare.';
    errorContainer.appendChild(errorMessage);
  }
}

// Funzione per generare la sezione "In evidenza sulla mappa"
function generateFeaturedLocations(data) {
  // Seleziona solo gli elementi con in_evidence impostato a true
  const featuredItems = data.filter(item => item.in_evidence === true);
  
  // Se non ci sono elementi in evidenza, non mostrare la sezione
  if (featuredItems.length === 0) return null;
  
  // Crea il container principale
  const container = document.createElement('div');
  container.className = 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12';
  
  // Aggiungi il titolo della sezione
  const title = document.createElement('h2');
  title.className = 'text-3xl font-bold text-gray-900 mb-8';
  title.textContent = 'Luoghi d\'interesse';
  container.appendChild(title);
  
  // Crea la griglia per le schede
  const grid = document.createElement('div');
  grid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
  container.appendChild(grid);
  
  // Genera una scheda per ogni elemento in evidenza
  featuredItems.forEach(item => {
    // Crea la scheda
    const card = document.createElement('div');
    card.className = 'bg-white rounded-lg overflow-hidden shadow-lg border border-gray-200 card-hover transition duration-300';
    
    // Crea il contenuto della scheda
    const content = document.createElement('div');
    content.className = 'p-6';
    
    // Intestazione con nome e anno
    const header = document.createElement('div');
    header.className = 'flex justify-between items-center mb-2';
    
    const name = document.createElement('h3');
    name.className = 'text-xl font-bold';
    name.textContent = item.Name || 'Luogo senza nome';
    
    const year = document.createElement('span');
    year.className = 'text-sm bg-indigo-100 text-indigo-800 px-2 py-1 rounded';
    year.textContent = item.Date || '';
    
    header.appendChild(name);
    if (item.Date) {
      header.appendChild(year);
    }
    content.appendChild(header);
    
    // Descrizione
    const description = document.createElement('p');
    description.className = 'text-gray-600 mb-4';
    description.textContent = item.in_evidence_description || '';
    content.appendChild(description);
    
    // Link per esplorare
    const link = document.createElement('a');
    link.href = `#${item.id || ''}`;
    link.className = 'text-indigo-600 font-medium hover:text-indigo-800 inline-flex items-center';

    content.appendChild(link);
    card.appendChild(content);
    
    // Aggiungi la scheda alla griglia
    grid.appendChild(card);
  });
  
  return container;
}

// Funzione per inizializzare la sezione delle località in evidenza
async function initializeFeaturedLocations(data) {
  try {
      // Trova l'elemento container per le località in evidenza
      const featuredContainer = document.getElementById('featured-locations-container');
      if (featuredContainer) {
        const featuredSection = generateFeaturedLocations(data);
        if (featuredSection) {
          featuredContainer.appendChild(featuredSection);
          console.log('Sezione "In evidenza sulla mappa" generata con successo');
        } else {
          console.log('Nessun elemento in evidenza trovato nei dati');
        }
      } else {
        console.warn('Container per le località in evidenza non trovato (ID: featured-locations-container)');
        
        // Cerchiamo di trovare un punto logico dove inserire la sezione
        const mapContainer = document.querySelector('.map-container');
        if (mapContainer) {
          // Creiamo un container per la sezione e lo inseriamo dopo la mappa
          const newFeaturedContainer = document.createElement('div');
          newFeaturedContainer.id = 'featured-locations-container';
          mapContainer.parentNode.insertBefore(newFeaturedContainer, mapContainer.nextSibling);
          
          // Ora generiamo la sezione
          const featuredSection = generateFeaturedLocations(data);
          if (featuredSection) {
            newFeaturedContainer.appendChild(featuredSection);
            console.log('Sezione "In evidenza sulla mappa" generata e inserita automaticamente');
          }
        }
      }
  } catch (error) {
    console.error('Errore durante l\'inizializzazione delle località in evidenza:', error);
  }
}

// Funzione per generare la sezione degli indici basata sugli aggregations
function generateIndexCards(config) {
  // Verifica se esistono aggregations nella configurazione
  if (!config.aggregations || typeof config.aggregations !== 'object') {
    console.warn('Nessuna configurazione aggregations trovata');
    return null;
  }
  
  // Converte l'oggetto aggregations in array
  const aggregationsArray = Object.entries(config.aggregations).map(([key, value]) => ({
    name: key,
    ...value
  }));
  
  if (aggregationsArray.length === 0) {
    console.warn('Nessuna aggregation trovata');
    return null;
  }
  
  // Crea il container principale
  const container = document.createElement('div');
  container.className = 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12';
  
  // Aggiungi il titolo della sezione
  const title = document.createElement('h2');
  title.className = 'text-3xl font-bold text-gray-900 mb-8';
  title.textContent = 'Esplora per categorie';
  container.appendChild(title);
  
  // Crea la griglia per le schede
  const grid = document.createElement('div');
  grid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
  container.appendChild(grid);
  
  // Genera una scheda per ogni aggregation - USA aggregationsArray invece di config.aggregations
  aggregationsArray.forEach(aggregation => {
    // Crea la scheda
    const card = document.createElement('div');
    card.className = 'bg-white rounded-lg overflow-hidden shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300';
    
    // Crea il contenuto della scheda
    const content = document.createElement('div');
    content.className = 'p-6';
    
    // Titolo dell'aggregation (usa 'title' se presente, altrimenti 'name')
    const name = document.createElement('h3');
    name.className = 'text-xl font-bold text-gray-900 mb-3';
    name.textContent = aggregation.title || aggregation.name || 'Categoria';
    content.appendChild(name);
    
    // Categoria (se presente)
    if (aggregation.category) {
      const category = document.createElement('p');
      category.className = 'text-sm text-gray-500 mb-2';
      category.textContent = aggregation.category;
      content.appendChild(category);
    }
    
    // Badge per il tipo di aggregation
    const typeBadge = document.createElement('span');
    typeBadge.className = 'inline-block px-2 py-1 text-xs font-medium rounded mb-4';
    
    // Stile diverso in base al tipo
    switch (aggregation.type) {
      case 'simple':
        typeBadge.className += ' bg-blue-100 text-blue-800';
        typeBadge.textContent = 'Lista semplice';
        break;
      case 'range':
        typeBadge.className += ' bg-green-100 text-green-800';
        typeBadge.textContent = 'Per intervalli';
        break;
      case 'taxonomy':
        typeBadge.className += ' bg-purple-100 text-purple-800';
        typeBadge.textContent = 'Tassonomia';
        break;
      default:
        typeBadge.className += ' bg-gray-100 text-gray-800';
        typeBadge.textContent = 'Altro';
    }
    content.appendChild(typeBadge);
    
    // Link per esplorare
    const link = document.createElement('a');
    const encodedIndex = encodeURIComponent(aggregation.name);
    const encodedView = encodeURIComponent(aggregation.type);
    link.href = `pages/indice.html?index=${encodedIndex}&view=${encodedView}`;
    link.className = 'inline-flex items-center text-indigo-600 font-medium hover:text-indigo-800 transition-colors duration-200';
    
    const linkText = document.createElement('span');
    linkText.textContent = 'Esplora categoria';
    link.appendChild(linkText);
    
    // Icona freccia
    const arrow = document.createElement('svg');
    arrow.className = 'ml-2 w-4 h-4';
    arrow.setAttribute('fill', 'none');
    arrow.setAttribute('stroke', 'currentColor');
    arrow.setAttribute('viewBox', '0 0 24 24');
    arrow.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>';
    link.appendChild(arrow);
    
    content.appendChild(link);
    card.appendChild(content);
    
    // Aggiungi la scheda alla griglia
    grid.appendChild(card);
  });
  
  return container;
}

// Funzione per inizializzare la sezione degli indici
async function initializeIndexCards(config) {
  try {
    // Trova l'elemento container per le schede degli indici
    const indexContainer = document.getElementById('index-cards-container');
    if (indexContainer) {
      const indexSection = generateIndexCards(config);
      if (indexSection) {
        // Pulisci il container prima di aggiungere il nuovo contenuto
        indexContainer.innerHTML = '';
        indexContainer.appendChild(indexSection);
        console.log('Sezione degli indici generata con successo');
      } else {
        console.log('Nessuna aggregation trovata nella configurazione');
      }
    } else {
      console.warn('Container per le schede degli indici non trovato (ID: index-cards-container)');
    }
  } catch (error) {
    console.error('Errore durante l\'inizializzazione delle schede degli indici:', error);
  }
}

// Chiama tutte funzione
async function initializeApp() {
  try {
    // Carica la configurazione
    const config = await loadConfiguration();
    console.log('Configurazione caricata:', config);
    
    // Aggiorna la descrizione del progetto
    updateProjectDescription(config);
    
    // Inizializza le schede degli indici
    await initializeIndexCards(config);
    
    // Carica e processa i dati
    const data = await parseData();
    console.log('Dati caricati:', data);
    
    // Inizializza la mappa
    await initializeMap(config, data);
    
    // Inizializza le sezioni della pagina
    await initializeFeaturedLocations(data);
    
  } catch (error) {
    console.error('Errore durante l\'inizializzazione dell\'app:', error);
  }
}
// Avvia l'applicazione quando il DOM è pronto
document.addEventListener('DOMContentLoaded', initializeApp);