// Isrc/index.js
import { initMap } from './utils/initMap.js';
import { parseData } from './utils/dataParser.js';
import { loadConfiguration } from './utils/configLoader.js';
import { UniversalNav } from './navigation/universalNav.js';
import { UniversalFooter } from './navigation/universalFooter.js';
import './styles/tailwind.css'
import './styles/fonts.css'


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

function initializeScrollytelling() {
    const sectionsContainer = document.querySelector('.sections-container');
    const sections = document.querySelectorAll('.section-fullscreen[data-section-id]');
    const indicators = document.querySelectorAll('.indicator');
    const navLinks = document.querySelectorAll('.nav-link');
    const sectionButtons = document.querySelectorAll('.section-btn');
    
    let currentSection = 0;
    let isScrolling = false;
    let isManualScroll = false;

function ensureContainerHeight() {
    if (sectionsContainer) {
        sectionsContainer.style.height = '100vh';
        sectionsContainer.style.overflow = 'auto';
        sectionsContainer.style.display = 'block';
        // Add smooth scrolling if desired
        sectionsContainer.style.scrollBehavior = 'smooth';
    }
    
    // Ensure sections have correct height
    sections.forEach(section => {
        section.style.minHeight = '100vh';
        section.style.display = 'flex';
        section.style.justifyContent = 'center'; // Center content
        section.style.boxSizing = 'border-box'; // Include padding in calculations
    });
    
    // Remove browser defaults more comprehensively
    const resetStyles = {
        margin: '0',
        padding: '0',
        boxSizing: 'border-box'
    };
    
    Object.assign(document.body.style, resetStyles);
    Object.assign(document.documentElement.style, resetStyles);
    
    // Optional: Set html height for better consistency
    document.documentElement.style.height = '100%';
    document.body.style.height = '100%';
}

    // Funzione per navigare a una sezione specifica
    function goToSection(sectionIndex) {
        if (sectionIndex < 0 || sectionIndex >= sections.length || isScrolling) return;
        
        isScrolling = true;
        isManualScroll = true;
        currentSection = sectionIndex;
        
        // Scroll alla sezione con calcolo preciso
        const targetSection = sections[sectionIndex];
        const headerHeight = 80; // Altezza header fisso
        
        sectionsContainer.scrollTo({
            top: targetSection.offsetTop - headerHeight,
            behavior: 'smooth'
        });
        
        // Aggiorna indicatori e navigazione
        updateIndicators();
        updateNavigation();
        
        // Reset dei flag dopo l'animazione
        setTimeout(() => {
            isScrolling = false;
            setTimeout(() => {
                isManualScroll = false;
            }, 50);
        }, 600);
    }

    // Aggiorna gli indicatori attivi
    function updateIndicators() {
        indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === currentSection);
        });
    }

    // Aggiorna la navigazione
    function updateNavigation() {
        navLinks.forEach((link, index) => {
            const sectionId = parseInt(link.getAttribute('data-section'));
            if (sectionId === currentSection) {
                link.classList.remove('text-gray-600');
                link.classList.add('text-primary-900', 'border-b-2', 'border-primary-600', 'pb-1');
            } else {
                link.classList.remove('text-primary-900', 'border-b-2', 'border-primary-600', 'pb-1');
                link.classList.add('text-gray-600');
            }
        });
    }

    // Event listeners per gli indicatori
    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
            goToSection(index);
        });
    });

    // Event listeners per i link di navigazione
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionIndex = parseInt(link.getAttribute('data-section'));
            goToSection(sectionIndex);
        });
    });

    // Event listeners per i bottoni delle sezioni
    sectionButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionIndex = parseInt(button.getAttribute('data-section'));
            goToSection(sectionIndex);
        });
    });

    // FIX: Wheel scrolling migliorato con prevenzione della barra bianca
    let lastWheelTime = 0;
    let wheelTimeout;
    let isWheelBlocked = false;

    sectionsContainer.addEventListener('wheel', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Blocca se c'è già un'animazione in corso o se il wheel è temporaneamente bloccato
        if (isScrolling || isManualScroll || isWheelBlocked) return;
        
        // Soglia per movimenti minimi
        if (Math.abs(e.deltaY) < 15) return;
        
        const now = Date.now();
        
        // Throttling più efficace
        if (now - lastWheelTime < 300) return;
        
        lastWheelTime = now;
        isWheelBlocked = true;
        
        if (e.deltaY > 0 && currentSection < sections.length - 1) {
            goToSection(currentSection + 1);
        } else if (e.deltaY < 0 && currentSection > 0) {
            goToSection(currentSection - 1);
        }
        
        // Rilascia il blocco dopo l'animazione
        setTimeout(() => {
            isWheelBlocked = false;
        }, 650);
        
    }, { passive: false });

    // Gestione delle frecce da tastiera
    document.addEventListener('keydown', (e) => {
        if (isScrolling || isManualScroll) return;

        switch(e.key) {
            case 'ArrowDown':
            case 'PageDown':
                e.preventDefault();
                if (currentSection < sections.length - 1) {
                    goToSection(currentSection + 1);
                }
                break;
            case 'ArrowUp':
            case 'PageUp':
                e.preventDefault();
                if (currentSection > 0) {
                    goToSection(currentSection - 1);
                }
                break;
            case 'Home':
                e.preventDefault();
                goToSection(0);
                break;
            case 'End':
                e.preventDefault();
                goToSection(sections.length - 1);
                break;
        }
    });

    // FIX: Detecta la sezione attuale durante lo scroll manuale (MIGLIORATA)
    let scrollDetectionTimeout;
    sectionsContainer.addEventListener('scroll', () => {
        // Solo se non è uno scroll programmatico
        if (isScrolling || isManualScroll) return;

        clearTimeout(scrollDetectionTimeout);
        scrollDetectionTimeout = setTimeout(() => {
            const scrollTop = sectionsContainer.scrollTop + 80;
            let newSection = currentSection;
            
            // Trova la sezione più vicina al centro dello schermo
            let minDistance = Infinity;
            sections.forEach((section, index) => {
                const sectionCenter = section.offsetTop - 80 + (section.offsetHeight / 2);
                const distance = Math.abs(scrollTop + (window.innerHeight / 2) - sectionCenter);
                
                if (distance < minDistance) {
                    minDistance = distance;
                    newSection = index;
                }
            });
            
            if (currentSection !== newSection) {
                currentSection = newSection;
                updateIndicators();
                updateNavigation();
            }
        }, 50);
    });

    // FIX: Gestione del tocco per dispositivi mobili (MIGLIORATA)
    let touchStartY = 0;
    let touchEndY = 0;
    let touchStartTime = 0;

    sectionsContainer.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
        touchStartTime = Date.now();
    }, { passive: true });

    sectionsContainer.addEventListener('touchend', (e) => {
        if (isScrolling || isManualScroll) return;
        
        const touchEndTime = Date.now();
        const touchDuration = touchEndTime - touchStartTime;
        
        // Ignora tocchi troppo lunghi (probabilmente scroll normale)
        if (touchDuration > 300) return;
        
        touchEndY = e.changedTouches[0].clientY;
        const touchDiff = touchStartY - touchEndY;
        
        // Minimo movimento per attivare il cambio sezione
        if (Math.abs(touchDiff) > 80) {
            if (touchDiff > 0 && currentSection < sections.length - 1) {
                // Swipe verso l'alto - vai alla sezione successiva
                goToSection(currentSection + 1);
            } else if (touchDiff < 0 && currentSection > 0) {
                // Swipe verso il basso - vai alla sezione precedente
                goToSection(currentSection - 1);
            }
        }
    }, { passive: true });

    // FIX: Gestione del resize della finestra
    window.addEventListener('resize', () => {
        ensureContainerHeight();
    });

    // FIX: Inizializzazione con correzione dell'altezza
    ensureContainerHeight();
    updateIndicators();
    updateNavigation();
    
    // FIX: Forza un reflow dopo l'inizializzazione
    setTimeout(() => {
        ensureContainerHeight();
    }, 100);
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

function generateIndexCards(config) {
  // Verifica configurazione
  if (!config.aggregations || typeof config.aggregations !== 'object') {
    console.warn('Nessuna configurazione aggregations trovata');
    return null;
  }
  
  // Converte aggregations in array
  const aggregationsArray = Object.entries(config.aggregations).map(([key, value]) => ({
    name: key,
    ...value
  }));
  
  if (aggregationsArray.length === 0) {
    console.warn('Nessuna aggregation trovata');
    return null;
  }
  
  // Raggruppa per categoria
  const groupedByCategory = aggregationsArray.reduce((groups, aggregation) => {
    const category = aggregation.category || 'Altre categorie';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(aggregation);
    return groups;
  }, {});
  
  // Container principale con i tuoi colori
  const container = document.createElement('div');
  container.className = 'w-full bg-gradient-to-br from-primary-50 via-white to-secondary-50 relative overflow-hidden';
  
  // Elementi decorativi originali ma più piccoli
  const decorativeElement1 = document.createElement('div');
  decorativeElement1.className = 'absolute top-0 left-0 w-48 h-48 bg-primary-200 rounded-full opacity-20 -translate-x-1/2 -translate-y-1/2';
  container.appendChild(decorativeElement1);
  
  const decorativeElement2 = document.createElement('div');
  decorativeElement2.className = 'absolute bottom-0 right-0 w-64 h-64 bg-secondary-200 rounded-full opacity-10 translate-x-1/3 translate-y-1/3';
  container.appendChild(decorativeElement2);
  
  // Contenuto principale centrato nella viewport con spazio per nav e footer
  const mainContent = document.createElement('div');
  mainContent.className = 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-16';
  
  // Layout a 4 colonne: 1 titolo + 3 categorie (con scroll se ce ne sono di più)
  const layoutContainer = document.createElement('div');
  layoutContainer.className = 'flex gap-6 h-[calc(100vh-200px)]';
  
  // Prima colonna: Titolo e descrizione (fissa, larga)
  const titleColumn = createTitleColumn();
  layoutContainer.appendChild(titleColumn);
  
  // Container per le colonne delle categorie con scroll
  const categoriesContainer = document.createElement('div');
  categoriesContainer.className = 'flex gap-4 flex-1 overflow-x-auto pb-4';
  categoriesContainer.style.scrollBehavior = 'smooth';
  
  // Genera tutte le colonne delle categorie (sempre larghezza fissa per scroll)
  Object.entries(groupedByCategory).forEach(([categoryName, aggregations], index) => {
    const column = createCategoryColumn(categoryName, aggregations, index);
    categoriesContainer.appendChild(column);
  });
  
  layoutContainer.appendChild(categoriesContainer);
  mainContent.appendChild(layoutContainer);
  container.appendChild(mainContent);
  
  return container;
}

// Funzione per creare la colonna del titolo (fissa a sinistra)
function createTitleColumn() {
  const titleColumn = document.createElement('div');
  titleColumn.className = 'w-80 flex-shrink-0 bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-8 text-white relative overflow-hidden';
  
  // Elementi decorativi nel titolo
  const decorative1 = document.createElement('div');
  decorative1.className = 'absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/10 to-transparent rounded-bl-full';
  titleColumn.appendChild(decorative1);
  
  const decorative2 = document.createElement('div');
  decorative2.className = 'absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-white/5 to-transparent rounded-tr-full';
  titleColumn.appendChild(decorative2);
  
  // Badge
  const badge = document.createElement('div');
  badge.className = 'inline-flex items-center bg-white/20 text-white px-3 py-1.5 rounded-full text-xs font-medium mb-6 relative z-10';
  badge.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
    Navigazione per indici
  `;
  titleColumn.appendChild(badge);
  
  // Titolo principale
  const title = document.createElement('h1');
  title.className = 'text-3xl font-bold mb-4 leading-tight relative z-10';
  title.textContent = 'Esplora per categorie';
  titleColumn.appendChild(title);
  
  // Sottotitolo
  const subtitle = document.createElement('p');
  subtitle.className = 'text-white/80 leading-relaxed relative z-10';
  subtitle.textContent = 'Naviga attraverso le diverse categorie di contenuti per scoprire informazioni organizzate e strutturate secondo le tue esigenze.';
  titleColumn.appendChild(subtitle);
  
  return titleColumn;
}

function createCategoryColumn(categoryName, aggregations, index) {
  // I tuoi colori originali per le colonne
  const columnColors = [
    {
      gradient: 'from-accent-500 to-accent-700',
      shadowColor: 'shadow-accent-500/20',
      borderColor: 'border-accent-200',
      glowColor: 'shadow-accent-500/30'
    },
    {
      gradient: 'from-accent-600 to-accent-800', 
      shadowColor: 'shadow-accent-500/20',
      borderColor: 'border-accent-200',
      glowColor: 'shadow-accent-500/30'
    },
    {
      gradient: 'from-accent-400 to-accent-600',
      shadowColor: 'shadow-accent-500/20', 
      borderColor: 'border-accent-300',
      glowColor: 'shadow-accent-500/30'
    }
  ];
  
  const colorScheme = columnColors[index % 3];
  
  // Colonna con larghezza fissa per scroll orizzontale
  const column = document.createElement('div');
  column.className = `w-80 flex-shrink-0 bg-white rounded-xl overflow-hidden shadow-lg ${colorScheme.shadowColor} hover:${colorScheme.glowColor} border ${colorScheme.borderColor} transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-1 h-full flex flex-col`;
  
  // Header con i tuoi pattern
  const header = document.createElement('div');
  header.className = `bg-gradient-to-r ${colorScheme.gradient} px-5 py-4 relative overflow-hidden`;
  
  // I tuoi pattern decorativi originali
  const pattern = document.createElement('div');
  pattern.className = 'absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-white/10 to-transparent rounded-bl-full';
  header.appendChild(pattern);
  
  const pattern2 = document.createElement('div');
  pattern2.className = 'absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-white/5 to-transparent rounded-tr-full';
  header.appendChild(pattern2);
  
  // Titolo della categoria
  const categoryTitle = document.createElement('h3');
  categoryTitle.className = 'text-lg font-semibold text-white relative z-10';
  categoryTitle.textContent = categoryName;
  header.appendChild(categoryTitle);
  
  // Counter delle aggregazioni
  const counter = document.createElement('div');
  counter.className = 'text-white/80 text-xs mt-1 relative z-10';
  counter.textContent = `${aggregations.length} ${aggregations.length === 1 ? 'elemento' : 'elementi'}`;
  header.appendChild(counter);
  
  column.appendChild(header);
  
  // Container delle card con scroll verticale
  const cardsContainer = document.createElement('div');
  cardsContainer.className = 'overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 flex-1';
  
  // Genera le card
  aggregations.forEach(aggregation => {
    const card = createAggregationCard(aggregation);
    cardsContainer.appendChild(card);
  });
  
  column.appendChild(cardsContainer);
  return column;
}

// Mantiene le tue card originali ma più compatte
function createAggregationCard(aggregation) {
  // I tuoi colori originali
  let headerBgClass = 'bg-primary-800';
  let buttonTextColor = 'text-primary-600';
  let buttonHoverBg = 'hover:bg-gradient-to-r hover:from-white hover:to-primary-200';
  
  switch (aggregation.type) {
    case 'simple':
      headerBgClass = 'bg-gradient-to-r from-primary-600 to-primary-800';
      buttonTextColor = 'text-primary-600';
      buttonHoverBg = 'hover:bg-gradient-to-r hover:from-white hover:to-primary-200';
      break;
    case 'range':
      headerBgClass = 'bg-gradient-to-r from-secondary-600 to-secondary-800';
      buttonTextColor = 'text-secondary-600';
      buttonHoverBg = 'hover:bg-gradient-to-r hover:from-white hover:to-secondary-200';
      break;
    case 'taxonomy':
      headerBgClass = 'bg-gradient-to-r from-accent-600 to-accent-800';
      buttonTextColor = 'text-accent-600';
      buttonHoverBg = 'hover:bg-gradient-to-r hover:from-white hover:to-accent-200';
      break;
    default:
      headerBgClass = 'bg-gradient-to-r from-primary-600 to-primary-800';
      buttonTextColor = 'text-primary-600';
      buttonHoverBg = 'hover:bg-gradient-to-r hover:from-white hover:to-primary-200';
  }
  
  // Card compatta
  const card = document.createElement('div');
  card.className = 'bg-white rounded-xl overflow-hidden shadow-lg border border-gray-200 hover:shadow-2xl hover:scale-105 transition-all duration-300 transform flex flex-col group';
  
  // Header della card con i tuoi SVG originali
  const header = document.createElement('div');
  header.className = `${headerBgClass} px-4 py-4 relative overflow-hidden flex-grow flex items-center justify-between`;
  
  // I tuoi SVG di background originali
  const backgroundSvg = document.createElement('div');
  backgroundSvg.className = 'absolute right-0 top-0 bottom-0 flex items-center justify-center opacity-15 pointer-events-none group-hover:opacity-25 transition-opacity duration-300';
  backgroundSvg.style.transform = 'translateX(25%)';
  
  let svgContent = '';
  switch (aggregation.type) {
    case 'simple':
      svgContent = `
        <svg viewBox="0 0 100 100" class="w-20 h-20 text-white">
          <rect x="10" y="20" width="80" height="8" rx="4" fill="currentColor"/>
          <rect x="10" y="35" width="60" height="8" rx="4" fill="currentColor"/>
          <rect x="10" y="50" width="70" height="8" rx="4" fill="currentColor"/>
          <rect x="10" y="65" width="50" height="8" rx="4" fill="currentColor"/>
          <circle cx="90" cy="24" r="3" fill="currentColor"/>
          <circle cx="90" cy="39" r="3" fill="currentColor"/>
          <circle cx="90" cy="54" r="3" fill="currentColor"/>
          <circle cx="90" cy="69" r="3" fill="currentColor"/>
        </svg>
      `;
      break;
    case 'range':
      svgContent = `
        <svg viewBox="0 0 100 100" class="w-20 h-20 text-white">
          <line x1="10" y1="85" x2="90" y2="85" stroke="currentColor" stroke-width="2"/>
          <line x1="10" y1="85" x2="10" y2="15" stroke="currentColor" stroke-width="2"/>
          <rect x="15" y="65" width="12" height="20" fill="currentColor" rx="2"/>
          <rect x="32" y="45" width="12" height="40" fill="currentColor" rx="2"/>
          <rect x="49" y="35" width="12" height="50" fill="currentColor" rx="2"/>
          <rect x="66" y="55" width="12" height="30" fill="currentColor" rx="2"/>
          <rect x="83" y="25" width="12" height="60" fill="currentColor" rx="2"/>
        </svg>
      `;
      break;
    case 'taxonomy':
      svgContent = `
        <svg viewBox="0 0 100 100" class="w-20 h-20 text-white">
          <circle cx="50" cy="20" r="8" fill="currentColor"/>
          <line x1="50" y1="28" x2="50" y2="40" stroke="currentColor" stroke-width="3"/>
          <line x1="30" y1="40" x2="70" y2="40" stroke="currentColor" stroke-width="3"/>
          <line x1="30" y1="40" x2="30" y2="50" stroke="currentColor" stroke-width="3"/>
          <line x1="70" y1="40" x2="70" y2="50" stroke="currentColor" stroke-width="3"/>
          <circle cx="30" cy="55" r="6" fill="currentColor"/>
          <circle cx="70" cy="55" r="6" fill="currentColor"/>
          <line x1="30" y1="61" x2="30" y2="70" stroke="currentColor" stroke-width="2"/>
          <line x1="70" y1="61" x2="70" y2="70" stroke="currentColor" stroke-width="2"/>
          <line x1="20" y1="70" x2="80" y2="70" stroke="currentColor" stroke-width="2"/>
          <circle cx="20" cy="75" r="4" fill="currentColor"/>
          <circle cx="40" cy="75" r="4" fill="currentColor"/>
          <circle cx="60" cy="75" r="4" fill="currentColor"/>
          <circle cx="80" cy="75" r="4" fill="currentColor"/>
        </svg>
      `;
      break;
    default:
      svgContent = `
        <svg viewBox="0 0 100 100" class="w-20 h-20 text-white">
          <circle cx="35" cy="35" r="15" fill="none" stroke="currentColor" stroke-width="4"/>
          <circle cx="35" cy="35" r="6" fill="currentColor"/>
          <circle cx="65" cy="65" r="20" fill="none" stroke="currentColor" stroke-width="4"/>
          <circle cx="65" cy="65" r="8" fill="currentColor"/>
          <rect x="32" y="20" width="6" height="10" fill="currentColor"/>
          <rect x="32" y="40" width="6" height="10" fill="currentColor"/>
          <rect x="20" y="32" width="10" height="6" fill="currentColor"/>
          <rect x="40" y="32" width="10" height="6" fill="currentColor"/>
        </svg>
      `;
  }
  
  backgroundSvg.innerHTML = svgContent;
  header.appendChild(backgroundSvg);
  
  // Titolo dell'header
  const headerTitle = document.createElement('h4');
  headerTitle.className = 'text-lg font-bold text-white text-left relative z-10 flex-shrink-0 group-hover:scale-105 transition-transform duration-300';
  headerTitle.textContent = aggregation.title || aggregation.name || 'Categoria';
  header.appendChild(headerTitle);
  
  card.appendChild(header);
  
  // Footer della card minimalista con solo freccia
  const footer = document.createElement('div');
  footer.className = 'bg-gray-50 px-4 py-2 border-t border-gray-200 flex justify-end';
  
  // Link con solo freccia
  const link = document.createElement('a');
  const encodedIndex = encodeURIComponent(aggregation.name);
  const encodedView = encodeURIComponent(aggregation.type);
  link.href = `pages/indice.html?index=${encodedIndex}&view=${encodedView}`;
  link.className = `inline-flex items-center justify-center w-8 h-8 bg-white ${buttonTextColor} rounded-full ${buttonHoverBg} transition-all duration-300 shadow-md hover:shadow-lg border border-gray-200 group hover:scale-110`;
  
  // Solo icona freccia
  const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  arrow.setAttribute('class', 'w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-300');
  arrow.setAttribute('fill', 'none');
  arrow.setAttribute('stroke', 'currentColor');
  arrow.setAttribute('viewBox', '0 0 24 24');
  const arrowPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  arrowPath.setAttribute('stroke-linecap', 'round');
  arrowPath.setAttribute('stroke-linejoin', 'round');
  arrowPath.setAttribute('stroke-width', '2');
  arrowPath.setAttribute('d', 'M13 7l5 5-5 5M6 12h12');
  arrow.appendChild(arrowPath);
  link.appendChild(arrow);
  
  footer.appendChild(link);
  card.appendChild(footer);
  
  return card;
}

// Funzione di inizializzazione
async function initializeIndexCards(config) {
  try {
    const indexContainer = document.getElementById('index-cards-container');
    if (indexContainer) {
      const indexSection = generateIndexCards(config);
      if (indexSection) {
        indexContainer.innerHTML = '';
        indexContainer.appendChild(indexSection);
        console.log('Layout a 4 colonne con scroll orizzontale generato con successo');
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

// Chiama tutte le funzioni
async function initializeApp() {
  try {
    // Carica la configurazione
    const config = await loadConfiguration();
    console.log('Configurazione caricata:', config);
    
    // Inizializza la navigazione universale (navbar e footer)
    const universalNav = new UniversalNav(config);
    universalNav.render();

    const universalFooter = new UniversalFooter(config);
    universalFooter.render();

    // Aggiorna la descrizione del progetto
    updateProjectDescription(config);
    
    // Inizializza le schede degli indici
    await initializeIndexCards(config);
    
    // Carica e processa i dati
    const data = await parseData();
    console.log('Dati caricati:', data);
    
    // Inizializza la mappa
    await initializeMap(config, data);
    
    // Inizializza le sezioni della pagina con layout a 2 colonne
    await initializeFeaturedLocations(data);

    // FIX: Inizializza lo scrollytelling dopo che tutto è caricato
    setTimeout(() => {
      initializeScrollytelling();
    }, 200);
    
  } catch (error) {
    console.error('Errore durante l\'inizializzazione dell\'app:', error);
  }
}

// FIX: Avvia l'applicazione quando il DOM è pronto con controlli aggiuntivi
document.addEventListener('DOMContentLoaded', () => {
  // Assicura che il body abbia le giuste proprietà CSS
  document.body.style.margin = '0';
  document.body.style.padding = '0';
  document.body.style.overflow = 'hidden'; // Previene lo scroll del body
  document.documentElement.style.margin = '0';
  document.documentElement.style.padding = '0';
  
  // Inizializza l'app
  initializeApp();
  
  // FIX: Controllo aggiuntivo dopo il caricamento completo
  window.addEventListener('load', () => {
    setTimeout(() => {
      // Forza un reflow per assicurarsi che tutto sia visualizzato correttamente
      const sectionsContainer = document.querySelector('.sections-container');
      if (sectionsContainer) {
        sectionsContainer.style.height = '100vh';
        sectionsContainer.style.overflow = 'auto';
      }
    }, 300);
  });
});