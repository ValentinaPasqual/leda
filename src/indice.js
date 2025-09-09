// indice.js - File principale per la gestione dell'applicazione

import { parseData } from './utils/dataParser.js';
import { loadConfiguration } from './utils/configLoader.js';
import { getURLParameter } from './utils/urlHelper.js';
import { SimpleView } from './views/SimpleView.js';
import { TaxonomyView } from './views/TaxonomyView.js';
import { RangeView } from './views/RangeView.js';
import { UniversalNav } from './navigation/universalNav.js';
import { UniversalFooter } from './navigation/universalFooter.js';
import './styles/tailwind.css';

// ------------------------------
// Gestione principale delle visualizzazioni [disambiguazione tra indici, tassonomie e range + container per tutte le pagine prodotte]
// ------------------------------
class IndexPageManager {
  constructor() {
    this.container = document.querySelector('[data-content="index-content"]') || document.body;
    this.currentView = null;
    this.universalNav = null;
    this.universalFooter = null;
    this.indexInfo = {
      key: null,
      name: null,
      type: null,
      category: null
    };
  }

  clearContainer() {
    // Pulisce solo il contenuto, non la navigazione
    const existingContent = this.container.querySelector('.page-content');
    if (existingContent) {
      existingContent.remove();
    }
  }

  // Crea il layout responsive a due colonne (centralizzato)
  createTwoColumnLayout() {
    const layout = document.createElement('div');
    layout.className = 'min-h-screen flex flex-col lg:flex-row bg-slate-50';

    // Colonna sinistra (sidebar) - FISSA su desktop, scrollabile su mobile
    const sidebar = document.createElement('div');
    sidebar.className = `
      w-full lg:w-1/3 bg-white 
      lg:fixed lg:top-20 lg:left-0 lg:h-[calc(100vh-5rem)] lg:flex lg:flex-col lg:justify-center 
      p-6 lg:overflow-hidden
      order-1 lg:order-1
    `;

    // Container per il contenuto della sidebar
    const sidebarContent = document.createElement('div');
    sidebarContent.className = 'sidebar-content space-y-6';
    sidebar.appendChild(sidebarContent);

    // Colonna destra (contenuto scrollabile)
    const content = document.createElement('div');
    content.className = `
      flex-1 
      lg:ml-[33.333333%] 
      min-h-screen overflow-y-auto
      order-2 lg:order-2
    `;

    const contentList = document.createElement('div');
    contentList.className = 'content-list p-6';
    content.appendChild(contentList);

    layout.appendChild(sidebar);
    layout.appendChild(content);

    return { layout, sidebar: sidebarContent, content: contentList };
  }

  // Funzione centralizzata per il rendering di tutte le viste con layout a due colonne
  render(view, indexInfo) {
    // Crea il layout a due colonne
    const { layout, sidebar, content } = this.createTwoColumnLayout();

    // Ottiene i componenti dalla vista
    const viewComponents = view.generateViewComponents();

    // Separa i componenti tra sidebar e contenuto principale
    // La view deve fornire un oggetto con { sidebarComponents, contentComponents }
    if (viewComponents.sidebar && viewComponents.content) {
      // Nuova struttura: oggetto con sidebar e content separati
      viewComponents.sidebar.forEach(component => {
        sidebar.appendChild(component);
      });

      viewComponents.content.forEach(component => {
        content.appendChild(component);
      });
    } else {
      // Fallback: se la view restituisce ancora un array, usa il primo per sidebar e il resto per content
      console.warn('View dovrebbe restituire {sidebar: [...], content: [...]} invece di un array');
      
      if (Array.isArray(viewComponents) && viewComponents.length > 0) {
        // Fallback temporaneo per compatibilità
        sidebar.appendChild(viewComponents[0]);
        
        for (let i = 1; i < viewComponents.length; i++) {
          content.appendChild(viewComponents[i]);
        }
      }
    }

    // Contenitore per il contenuto della pagina
    const pageContent = document.createElement('div');
    pageContent.className = 'page-content';
    pageContent.appendChild(layout);

    // Pulisce il container e aggiunge il contenuto
    this.clearContainer();
    this.container.appendChild(pageContent);
  }

  // Converte il tipo di vista in nome visualizzabile
  getIndexTypeDisplayName(viewType) {
    const typeNames = {
      'simple': 'Indice Semplice',
      'taxonomy': 'Indice Tassonomico', 
      'range': 'Indice per Intervalli'
    };
    return typeNames[viewType] || 'Indice';
  }

  // Ottiene informazioni sull'indice dalla configurazione
  getIndexInfo(config, indexKey, viewType) {
    // Usa il key come fallback se non c'è configurazione
    let indexName = indexKey;
    let indexCategory = null;
    
    // Cerca prima in aggregations, poi in indices come fallback
    if (config && config.aggregations && config.aggregations[indexKey]) {
      indexName = config.aggregations[indexKey].title || indexKey;
      indexCategory = config.aggregations[indexKey].category;
    } else if (config && config.indices && config.indices[indexKey]) {
      indexName = config.indices[indexKey].displayName || config.indices[indexKey].title || indexKey;
      indexCategory = config.indices[indexKey].category;
    }

    return {
      key: indexKey,
      name: indexName,
      category: indexCategory,
      type: viewType
    };
  }

  async initialize() {
    const indexKey = getURLParameter('index');
    const viewType = getURLParameter('view') || 'simple'; // default a simple
    
    if (!indexKey) {
      console.error('Parametro index mancante nell\'URL');
      this.showError('Parametro index mancante nell\'URL');
      return;
    }

    try {
      // Carica configurazione e dati
      const [config, data] = await Promise.all([
        loadConfiguration(), 
        parseData()
      ]);

      // Ottieni informazioni sull'indice
      this.indexInfo = this.getIndexInfo(config, indexKey, viewType);

      // Debug per verificare indexInfo
      console.log('IndexInfo creato:', this.indexInfo);

      // Instanzia la vista appropriata passando indexInfo
      switch (viewType) {
        case 'simple':
          this.currentView = new SimpleView(data, indexKey, this.indexInfo);
          break;
        case 'taxonomy':
          this.currentView = new TaxonomyView(data, indexKey, this.indexInfo);
          break;
        case 'range':
          this.currentView = new RangeView(data, indexKey, this.indexInfo);
          break;
        default:
          console.warn(`Tipo di vista non riconosciuto: ${viewType}. Usando vista semplice.`);
          this.currentView = new SimpleView(data, indexKey, this.indexInfo);
          this.indexInfo.type = 'simple';
      }

      // Renderizza la vista usando la funzione centralizzata con layout a due colonne
      this.render(this.currentView, this.indexInfo);

    } catch (error) {
      console.error('Errore durante l\'inizializzazione:', error);
      this.showError('Errore nel caricamento dei dati');
    }
  }

  showError(message) {
    this.ensureBodyPadding();
    
    const errorContent = document.createElement('div');
    errorContent.className = 'page-content max-w-4xl mx-auto py-8';
    errorContent.innerHTML = `
      <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <strong>Errore:</strong> ${message}
      </div>
    `;
    
    this.clearContainer();
    this.container.appendChild(errorContent);
  }
}

// ------------------------------
// Inizializzazione quando il DOM è pronto
// ------------------------------
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Carica la configurazione prima di inizializzare qualsiasi cosa
    const config = await loadConfiguration();
    
    // Rende la configurazione disponibile globalmente se necessario
    window.appConfig = config;

    // Inizializza la navigazione universale (navbar e footer)
    const universalNav = new UniversalNav(config);
    universalNav.render();

    const universalFooter = new UniversalFooter(config);
    universalFooter.render();
    
    // Inizializza il page manager che gestirà tutto il resto
    const pageManager = new IndexPageManager();
    await pageManager.initialize();
    
  } catch (error) {
    console.error('Errore durante l\'inizializzazione dell\'applicazione:', error);
    
    // Fallback per errori critici
    document.body.innerHTML = `
      <div class="min-h-screen flex items-center justify-center bg-gray-50">
        <div class="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <div class="flex items-center mb-4">
            <div class="flex-shrink-0">
              <svg class="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 class="ml-3 text-lg font-medium text-gray-900">Errore di inizializzazione</h3>
          </div>
          <p class="text-sm text-gray-600">
            Si è verificato un errore durante il caricamento dell'applicazione. 
            Si prega di ricaricare la pagina o contattare l'amministratore.
          </p>
          <div class="mt-4">
            <button onclick="window.location.reload()" class="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded">
              Ricarica pagina
            </button>
          </div>
        </div>
      </div>
    `;
  }
});