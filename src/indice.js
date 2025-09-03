// main.js - File principale per la gestione dell'applicazione

import { parseData } from './utils/dataParser.js';
import { loadConfiguration } from './utils/configLoader.js';
import { getURLParameter } from './utils/urlHelper.js';
import { SimpleView } from './views/SimpleView.js';
import { TaxonomyView } from './views/TaxonomyView.js';
import { RangeView } from './views/RangeView.js';
import './styles/tailwind.css';

// ------------------------------
// Gestione principale delle visualizzazioni
// ------------------------------
class IndexPageManager {
  constructor() {
    this.container = document.querySelector('[data-content="index-content"]') || document.body;
    this.currentView = null;
  }

  clearContainer() {
    this.container.innerHTML = '';
  }

  async initialize() {
    const indexKey = getURLParameter('index');
    const viewType = getURLParameter('view'); // simple, taxonomy, range
    
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

      this.clearContainer();

      // Instanzia la vista appropriata
      switch (viewType) {
        case 'simple':
          this.currentView = new SimpleView(data, indexKey);
          break;
        case 'taxonomy':
          this.currentView = new TaxonomyView(data, indexKey);
          break;
        case 'range':
          this.currentView = new RangeView(data, indexKey);
          break;
        default:
          console.warn(`Tipo di vista non riconosciuto: ${viewType}. Usando vista semplice.`);
          this.currentView = new SimpleView(data, indexKey);
      }

      // Renderizza la vista
      this.currentView.render(this.container);

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