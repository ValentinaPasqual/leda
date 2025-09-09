// ===== FILE: js/utils/visualiser.js =====

export class VisualizationManager {
  constructor(data, config) {
    this.data = data;
    this.config = config;
    this.aggregations = config.aggregations || {};
  }

  render(visualizationType = 'simple') {
    switch(visualizationType) {
      case 'simple':
        return this.createSimpleVisualization();
      case 'range':
        return this.createRangeVisualization();
      case 'taxonomy':
        return this.createTaxonomyVisualization();
      default:
        return this.createSimpleVisualization();
    }
  }

  createTypeSelector(currentType = 'simple') {
    const selector = document.createElement('div');
    selector.className = 'mb-6 flex justify-center space-x-4';
    
    const types = [
      { key: 'simple', label: 'Indice Semplice', description: 'Visualizzazione a card per campi semplici' },
      { key: 'range', label: 'Timeline', description: 'Visualizzazione temporale per range' },
      { key: 'taxonomy', label: 'Categorie', description: 'Visualizzazione gerarchica per tassonomie' }
    ];

    types.forEach(({ key, label, description }) => {
      const button = document.createElement('button');
      const isActive = currentType === key;
      
      button.className = `px-6 py-3 rounded-lg font-medium transition-all duration-200 text-center ${
        isActive 
          ? 'bg-primary-600 text-white shadow-lg' 
          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
      }`;
      
      button.innerHTML = `
        <div class="font-semibold">${label}</div>
        <div class="text-xs mt-1 opacity-80">${description}</div>
      `;
      
      button.addEventListener('click', () => this.switchVisualization(key));
      selector.appendChild(button);
    });

    return selector;
  }

  switchVisualization(type) {
    const url = new URL(window.location);
    url.searchParams.set('view', type);
    window.history.pushState({}, '', url);
    window.location.reload(); // Semplice reload per ora
  }

  // ===== VISUALIZZAZIONE SIMPLE (INDICE A CARD) =====
  createSimpleVisualization() {
    const container = document.createElement('div');
    container.className = 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8';

    // Header
    const header = this.createHeader(
      'Visualizzazione Indice Semplice',
      'Esplora i dati organizzati per campi semplici'
    );
    container.appendChild(header);

    // Filtra solo i campi di tipo 'simple'
    const simpleFields = Object.entries(this.aggregations)
      .filter(([_, config]) => config.type === 'simple');

    if (simpleFields.length === 0) {
      container.appendChild(this.createNoDataMessage('Nessun campo di tipo "simple" trovato'));
      return container;
    }

    // Selector per campo
    const fieldSelector = this.createFieldSelector(simpleFields, 'simple');
    container.appendChild(fieldSelector);

    // Container per la visualizzazione del campo selezionato
    const fieldContainer = document.createElement('div');
    fieldContainer.id = 'simple-field-container';
    container.appendChild(fieldContainer);

    // Visualizza il primo campo di default
    const defaultField = simpleFields[0][0];
    this.renderSimpleField(defaultField, fieldContainer);

    return container;
  }

  renderSimpleField(fieldName, container) {
    const fieldConfig = this.aggregations[fieldName];
    const fieldData = this.processSimpleField(fieldName, fieldConfig);

    container.innerHTML = '';

    // Statistiche del campo
    const statsContainer = this.createStatsContainer([
      { value: fieldData.uniqueValues, label: 'Valori Unici', color: 'blue' },
      { value: fieldData.totalItems, label: 'Elementi Totali', color: 'green' },
      { value: Math.round(fieldData.totalItems / fieldData.uniqueValues * 10) / 10, label: 'Media per Valore', color: 'purple' }
    ]);
    container.appendChild(statsContainer);

    // Griglia di card
    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-8';

    Object.entries(fieldData.data)
      .sort(([,a], [,b]) => b - a)
      .forEach(([value, count]) => {
        const card = this.createSimpleCard(value, count, fieldData.totalItems);
        grid.appendChild(card);
      });

    container.appendChild(grid);
  }

  createSimpleCard(value, count, total) {
    const percentage = Math.round((count / total) * 100);
    
    const card = document.createElement('div');
    card.className = 'bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-4 border border-gray-200';
    
    card.innerHTML = `
      <div class="flex items-center justify-between mb-2">
        <h3 class="font-semibold text-gray-900 text-sm truncate" title="${value}">${value}</h3>
        <span class="bg-primary-100 text-primary-800 px-2 py-1 rounded-full text-xs font-medium">${count}</span>
      </div>
      <div class="w-full bg-gray-200 rounded-full h-2 mb-2">
        <div class="bg-primary-600 h-2 rounded-full transition-all duration-300" style="width: ${percentage}%"></div>
      </div>
      <div class="text-xs text-gray-500">${percentage}% del totale</div>
    `;
    
    return card;
  }

  // ===== VISUALIZZAZIONE RANGE (TIMELINE) =====
  createRangeVisualization() {
    const container = document.createElement('div');
    container.className = 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8';

    // Header
    const header = this.createHeader(
      'Visualizzazione Timeline',
      'Esplora l\'evoluzione dei dati nel tempo'
    );
    container.appendChild(header);

    // Filtra solo i campi di tipo 'range'
    const rangeFields = Object.entries(this.aggregations)
      .filter(([_, config]) => config.type === 'range');

    if (rangeFields.length === 0) {
      container.appendChild(this.createNoDataMessage('Nessun campo di tipo "range" trovato'));
      return container;
    }

    // Selector per campo
    const fieldSelector = this.createFieldSelector(rangeFields, 'range');
    container.appendChild(fieldSelector);

    // Container per la timeline
    const timelineContainer = document.createElement('div');
    timelineContainer.id = 'range-field-container';
    container.appendChild(timelineContainer);

    // Visualizza il primo campo di default
    const defaultField = rangeFields[0][0];
    this.renderRangeField(defaultField, timelineContainer);

    return container;
  }

  renderRangeField(fieldName, container) {
    const fieldConfig = this.aggregations[fieldName];
    const fieldData = this.processRangeField(fieldName, fieldConfig);

    container.innerHTML = '';

    // Statistiche del range
    const statsContainer = this.createStatsContainer([
      { value: `${fieldData.min} - ${fieldData.max}`, label: 'Range Completo', color: 'blue' },
      { value: fieldData.span, label: 'Ampiezza', color: 'green' },
      { value: fieldData.totalItems, label: 'Elementi Totali', color: 'purple' }
    ]);
    container.appendChild(statsContainer);

    // Timeline
    const timeline = this.createTimeline(fieldData);
    container.appendChild(timeline);
  }

  createTimeline(fieldData) {
    const timelineContainer = document.createElement('div');
    timelineContainer.className = 'mt-8 bg-white rounded-lg shadow-lg p-6';

    const timelineTitle = document.createElement('h3');
    timelineTitle.className = 'text-lg font-semibold text-gray-900 mb-6';
    timelineTitle.textContent = 'Distribuzione Temporale';
    timelineContainer.appendChild(timelineTitle);

    // Timeline orizzontale
    const timeline = document.createElement('div');
    timeline.className = 'relative';

    // Linea principale
    const mainLine = document.createElement('div');
    mainLine.className = 'absolute top-1/2 left-0 right-0 h-1 bg-primary-300 transform -translate-y-1/2';
    timeline.appendChild(mainLine);

    // Container per i punti
    const pointsContainer = document.createElement('div');
    pointsContainer.className = 'relative flex justify-between items-center h-32';

    const maxCount = Math.max(...Object.values(fieldData.groupedData));
    
    Object.entries(fieldData.groupedData)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .forEach(([period, count], index, arr) => {
        const point = this.createTimelinePoint(period, count, maxCount, index === 0, index === arr.length - 1);
        pointsContainer.appendChild(point);
      });

    timeline.appendChild(pointsContainer);
    timelineContainer.appendChild(timeline);

    return timelineContainer;
  }

  createTimelinePoint(period, count, maxCount, isFirst, isLast) {
    const pointContainer = document.createElement('div');
    pointContainer.className = 'relative flex flex-col items-center';

    // Calcola l'altezza proporzionale
    const heightPercent = (count / maxCount) * 100;
    const minHeight = 20;
    const maxHeight = 80;
    const barHeight = Math.max(minHeight, (heightPercent / 100) * maxHeight);

    // Barra verticale
    const bar = document.createElement('div');
    bar.className = `bg-primary-600 rounded-t-lg mb-2 transition-all duration-300 hover:bg-primary-700 cursor-pointer`;
    bar.style.height = `${barHeight}px`;
    bar.style.width = '24px';
    bar.title = `${period}: ${count} elementi`;

    // Punto sulla linea
    const point = document.createElement('div');
    point.className = 'w-4 h-4 bg-primary-600 rounded-full border-4 border-white shadow-lg z-10';

    // Etichetta
    const label = document.createElement('div');
    label.className = 'mt-2 text-xs font-medium text-gray-700 text-center';
    label.textContent = period;

    // Contatore
    const countLabel = document.createElement('div');
    countLabel.className = 'text-xs text-gray-500 text-center mt-1';
    countLabel.textContent = count;

    pointContainer.appendChild(bar);
    pointContainer.appendChild(point);
    pointContainer.appendChild(label);
    pointContainer.appendChild(countLabel);

    return pointContainer;
  }

  // ===== VISUALIZZAZIONE TAXONOMY (CATEGORIALE) =====
  createTaxonomyVisualization() {
    const container = document.createElement('div');
    container.className = 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8';

    // Header
    const header = this.createHeader(
      'Visualizzazione Categorie Tassonomiche',
      'Esplora le relazioni gerarchiche tra categorie'
    );
    container.appendChild(header);

    // Filtra solo i campi di tipo 'taxonomy'
    const taxonomyFields = Object.entries(this.aggregations)
      .filter(([_, config]) => config.type === 'taxonomy');

    if (taxonomyFields.length === 0) {
      container.appendChild(this.createNoDataMessage('Nessun campo di tipo "taxonomy" trovato'));
      return container;
    }

    // Selector per campo
    const fieldSelector = this.createFieldSelector(taxonomyFields, 'taxonomy');
    container.appendChild(fieldSelector);

    // Container per la visualizzazione tassonomica
    const taxonomyContainer = document.createElement('div');
    taxonomyContainer.id = 'taxonomy-field-container';
    container.appendChild(taxonomyContainer);

    // Visualizza il primo campo di default
    const defaultField = taxonomyFields[0][0];
    this.renderTaxonomyField(defaultField, taxonomyContainer);

    return container;
  }

  renderTaxonomyField(fieldName, container) {
    const fieldConfig = this.aggregations[fieldName];
    const fieldData = this.processTaxonomyField(fieldName, fieldConfig);

    container.innerHTML = '';

    // Statistiche della tassonomia
    const statsContainer = this.createStatsContainer([
      { value: fieldData.uniqueValues, label: 'Categorie Uniche', color: 'blue' },
      { value: fieldData.totalItems, label: 'Elementi Totali', color: 'green' },
      { value: fieldData.originalItems, label: 'Record Originali', color: 'purple' }
    ]);
    container.appendChild(statsContainer);

    // Visualizzazione a bubble/sunburst semplificata
    const bubbleContainer = this.createBubbleVisualization(fieldData);
    container.appendChild(bubbleContainer);

    // Lista dettagliata
    const detailsList = this.createTaxonomyDetailsList(fieldData);
    container.appendChild(detailsList);
  }

  createBubbleVisualization(fieldData) {
    const container = document.createElement('div');
    container.className = 'mt-8 bg-white rounded-lg shadow-lg p-6';

    const title = document.createElement('h3');
    title.className = 'text-lg font-semibold text-gray-900 mb-6';
    title.textContent = 'Distribuzione per Categoria';
    container.appendChild(title);

    // Area per le bubble
    const bubbleArea = document.createElement('div');
    bubbleArea.className = 'flex flex-wrap gap-4 justify-center items-center min-h-64 p-4 bg-gray-50 rounded-lg';

    const maxCount = Math.max(...Object.values(fieldData.data));
    const minSize = 60;
    const maxSize = 120;

    Object.entries(fieldData.data)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20) // Mostra solo i top 20
      .forEach(([category, count]) => {
        const bubble = this.createBubble(category, count, maxCount, minSize, maxSize);
        bubbleArea.appendChild(bubble);
      });

    container.appendChild(bubbleArea);
    return container;
  }

  createBubble(category, count, maxCount, minSize, maxSize) {
    const sizePercent = count / maxCount;
    const size = minSize + (sizePercent * (maxSize - minSize));
    
    const bubble = document.createElement('div');
    bubble.className = 'relative flex items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-white font-medium text-center cursor-pointer transition-all duration-300 hover:scale-110 hover:shadow-lg';
    bubble.style.width = `${size}px`;
    bubble.style.height = `${size}px`;
    bubble.style.fontSize = `${Math.max(10, size / 8)}px`;
    bubble.title = `${category}: ${count} elementi`;

    // Testo della categoria (troncato se necessario)
    const text = document.createElement('div');
    text.className = 'p-2 leading-tight';
    const displayText = category.length > 15 ? category.substring(0, 12) + '...' : category;
    text.innerHTML = `${displayText}<br><span class="text-xs opacity-75">${count}</span>`;
    
    bubble.appendChild(text);
    return bubble;
  }

  createTaxonomyDetailsList(fieldData) {
    const container = document.createElement('div');
    container.className = 'mt-8 bg-white rounded-lg shadow-lg p-6';

    const title = document.createElement('h3');
    title.className = 'text-lg font-semibold text-gray-900 mb-6';
    title.textContent = 'Elenco Dettagliato delle Categorie';
    container.appendChild(title);

    // Lista a colonne
    const list = document.createElement('div');
    list.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3';

    Object.entries(fieldData.data)
      .sort(([,a], [,b]) => b - a)
      .forEach(([category, count]) => {
        const item = document.createElement('div');
        item.className = 'flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors';
        
        item.innerHTML = `
          <span class="text-sm font-medium text-gray-900 truncate" title="${category}">${category}</span>
          <span class="bg-primary-100 text-primary-800 px-2 py-1 rounded-full text-xs font-medium ml-2">${count}</span>
        `;
        
        list.appendChild(item);
      });

    container.appendChild(list);
    return container;
  }

  // ===== UTILITY METHODS =====
  createHeader(title, subtitle) {
    const header = document.createElement('div');
    header.className = 'text-center mb-8';
    header.innerHTML = `
      <h2 class="text-3xl font-bold text-gray-900 mb-4">${title}</h2>
      <p class="text-lg text-gray-600">${subtitle}</p>
    `;
    return header;
  }

  createFieldSelector(fields, type) {
    const container = document.createElement('div');
    container.className = 'mb-8 bg-white rounded-lg shadow-sm p-6';

    const title = document.createElement('h3');
    title.className = 'text-lg font-semibold text-gray-900 mb-4';
    title.textContent = 'Seleziona Campo da Visualizzare:';
    container.appendChild(title);

    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'flex flex-wrap gap-3';

    fields.forEach(([fieldName, config]) => {
      const button = document.createElement('button');
      button.className = 'px-4 py-2 bg-gray-100 hover:bg-primary-100 hover:text-primary-700 rounded-lg transition-colors text-sm font-medium';
      button.textContent = config.title || fieldName;
      button.addEventListener('click', () => {
        // Rimuovi selezione da altri bottoni
        buttonsContainer.querySelectorAll('button').forEach(btn => {
          btn.className = 'px-4 py-2 bg-gray-100 hover:bg-primary-100 hover:text-primary-700 rounded-lg transition-colors text-sm font-medium';
        });
        // Seleziona questo bottone
        button.className = 'px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium';
        
        // Aggiorna la visualizzazione
        const containerId = `${type}-field-container`;
        const targetContainer = document.getElementById(containerId);
        if (targetContainer) {
          if (type === 'simple') {
            this.renderSimpleField(fieldName, targetContainer);
          } else if (type === 'range') {
            this.renderRangeField(fieldName, targetContainer);
          } else if (type === 'taxonomy') {
            this.renderTaxonomyField(fieldName, targetContainer);
          }
        }
      });
      buttonsContainer.appendChild(button);
    });

    container.appendChild(buttonsContainer);
    return container;
  }

  createStatsContainer(stats) {
    const container = document.createElement('div');
    container.className = 'grid grid-cols-1 md:grid-cols-3 gap-4 mb-6';

    stats.forEach(({ value, label, color }) => {
      const stat = document.createElement('div');
      stat.className = `text-center p-4 bg-${color}-50 rounded-lg`;
      stat.innerHTML = `
        <div class="text-2xl font-bold text-${color}-600">${value}</div>
        <div class="text-sm text-gray-600">${label}</div>
      `;
      container.appendChild(stat);
    });

    return container;
  }

  createNoDataMessage(message) {
    const container = document.createElement('div');
    container.className = 'text-center py-12 bg-white rounded-lg shadow';
    container.innerHTML = `
      <div class="text-gray-500 text-lg">${message}</div>
    `;
    return container;
  }

  // ===== DATA PROCESSING METHODS =====
  processSimpleField(fieldName, config) {
    const fieldData = this.data
      .map(item => item[fieldName])
      .filter(val => val && val !== '');

    const counts = {};
    fieldData.forEach(value => {
      counts[value] = (counts[value] || 0) + 1;
    });

    return {
      data: counts,
      uniqueValues: Object.keys(counts).length,
      totalItems: fieldData.length
    };
  }

  processRangeField(fieldName, config) {
    const fieldData = this.data
      .map(item => item[fieldName])
      .filter(val => val && val !== '')
      .map(val => parseInt(val.toString().substring(0, 4)))
      .filter(val => !isNaN(val));

    const min = Math.min(...fieldData);
    const max = Math.max(...fieldData);
    const span = max - min;

    // Raggruppa per decade
    const groupedData = {};
    fieldData.forEach(year => {
      const decade = Math.floor(year / 10) * 10;
      groupedData[decade] = (groupedData[decade] || 0) + 1;
    });

    return {
      data: fieldData,
      groupedData,
      min,
      max,
      span,
      totalItems: fieldData.length
    };
  }

  processTaxonomyField(fieldName, config) {
    const delimiter = this.config.datasetConfig?.multivalue_rows?.[fieldName] || '; ';
    const rawData = this.data
      .map(item => item[fieldName])
      .filter(val => val !== null && val !== undefined && val !== '');

    const allValues = [];
    rawData.forEach(value => {
      const strValue = String(value).trim();
      if (strValue) {
        if (strValue.includes(delimiter)) {
          allValues.push(...strValue.split(delimiter).map(v => String(v).trim()).filter(v => v));
        } else {
          allValues.push(strValue);
        }
      }
    });

    const counts = {};
    allValues.forEach(value => {
      if (value) {
        counts[value] = (counts[value] || 0) + 1;
      }
    });

    return {
      data: counts,
      uniqueValues: Object.keys(counts).length,
      totalItems: allValues.length,
      originalItems: rawData.length
    };
  }
}