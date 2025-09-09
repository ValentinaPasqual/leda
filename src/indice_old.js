// indice.js - File principale per la gestione dell'applicazione

import { parseData } from './utils/dataParser.js';
import { loadConfiguration } from './utils/configLoader.js';
import { getURLParameter } from './utils/urlHelper.js';
import { SimpleView } from './views/SimpleView.js';
import { TaxonomyView } from './views/TaxonomyView.js';
import { RangeView } from './views/RangeView.js';
import './styles/tailwind.css';

// ------------------------------
// Gestione principale delle visualizzazioni [disambiguazione tra indici, tassonomie e range + container per tutte le pagine prodotte]
// ------------------------------
class IndexPageManager {
  constructor() {
    this.container = document.querySelector('[data-content="index-content"]') || document.body;
    this.currentView = null;
    this.indexInfo = {
      key: null,
      name: null,
      type: null,
      category: null
    };
  }

  clearContainer() {
    this.container.innerHTML = '';
  }

  // Funzione centralizzata per il rendering di tutte le viste
  render(view, indexInfo) {
    // Contenitore principale senza header
    const mainContainer = document.createElement('div');
    mainContainer.className = 'h-screen';

    // Genera i componenti specifici della vista
    const viewComponents = view.generateViewComponents();
    
    // Aggiunge ogni componente al container principale
    viewComponents.forEach(component => {
      mainContainer.appendChild(component);
    });

    // Pulisce il container e aggiunge il contenuto
    this.clearContainer();
    this.container.appendChild(mainContainer);
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

      // Renderizza la vista usando la funzione centralizzata
      this.render(this.currentView, this.indexInfo);

    } catch (error) {
      console.error('Errore durante l\'inizializzazione:', error);
      this.showError('Errore nel caricamento dei dati');
    }
  }

  showError(message) {
    this.container.innerHTML = `
      <div class="max-w-4xl mx-auto py-8">
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Errore:</strong> ${message}
        </div>
      </div>
    `;
  }
}

// ------------------------------
// Inizializzazione quando il DOM è pronto
// ------------------------------
document.addEventListener('DOMContentLoaded', () => {
  const pageManager = new IndexPageManager();
  pageManager.initialize();
});