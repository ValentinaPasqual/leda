// views/SimpleView.js
import { createMapUrlWithFilter } from '../utils/urlHelper.js';

export class SimpleView {
  constructor(data, indexKey, indexInfo) {
    this.data = data;
    this.indexKey = indexKey;
    this.indexInfo = indexInfo || {};
    this.aggregatedData = this.aggregateData(data, indexKey);
    this.filteredData = { ...this.aggregatedData };
    this.currentSearchTerm = '';
    this.sortOrder = 'alphabetical';
  }

  // Aggrega i dati
  aggregateData(data, indexKey) {
    const aggregated = {};
    
    data.forEach(item => {
      const value = item[indexKey];
      const values = Array.isArray(value) ? value : [value];
      
      values.forEach(val => {
        const key = val || 'Non specificato';
        if (!aggregated[key]) aggregated[key] = [];
        aggregated[key].push(item);
      });
    });
    
    return aggregated;
  }

  // Ottieni iniziali
  getInitials() {
    const initials = new Set();
    Object.keys(this.aggregatedData).forEach(key => {
      const initial = key.charAt(0).toUpperCase();
      initials.add(initial.match(/[A-Z0-9]/) ? initial : '#');
    });
    return Array.from(initials).sort();
  }

  // Filtra per iniziale
  filterByInitial(initial) {
    if (initial === 'Tutti') {
      this.filteredData = { ...this.aggregatedData };
    } else {
      this.filteredData = {};
      Object.entries(this.aggregatedData).forEach(([key, items]) => {
        const keyInitial = key.charAt(0).toUpperCase();
        const match = initial === '#' ? !keyInitial.match(/[A-Z0-9]/) : keyInitial === initial;
        if (match) this.filteredData[key] = items;
      });
    }
    this.applySearch();
    this.refreshList();
  }

  // Filtra per ricerca
  filterBySearch(searchTerm) {
    this.currentSearchTerm = searchTerm.toLowerCase();
    this.applySearch();
    this.refreshList();
  }

  // Applica ricerca
  applySearch() {
    if (!this.currentSearchTerm) return;
    
    const filtered = {};
    Object.entries(this.filteredData).forEach(([key, items]) => {
      if (key.toLowerCase().includes(this.currentSearchTerm) ||
          items.some(item => 
            (item.Name && item.Name.toLowerCase().includes(this.currentSearchTerm)) ||
            (item.Location && item.Location.toLowerCase().includes(this.currentSearchTerm))
          )) {
        filtered[key] = items;
      }
    });
    this.filteredData = filtered;
  }

  // Cambia ordinamento
  changeSortOrder(order) {
    this.sortOrder = order;
    this.refreshList();
  }

  // Aggiorna lista
  refreshList() {
    const container = document.querySelector('.content-list');
    if (container) {
      container.innerHTML = '';
      container.appendChild(this.generateList());
    }
  }

  // Toggle accordion
  toggleAccordion(id) {
    const content = document.getElementById(`content-${id}`);
    const chevron = document.getElementById(`chevron-${id}`);
    if (!content || !chevron) return;
    
    content.classList.toggle('hidden');
    chevron.classList.toggle('rotate-180');
  }

  // Genera header (titolo e sottotitolo)
  generateHeader() {
    const header = document.createElement('div');
    header.className = 'mb-6';
    header.innerHTML = `
      <div class="font-medium text-black">HIHI${this.indexInfo.type}</div>
      <h1 class="text-3xl font-bold text-slate-800 mb-2 mt-24">Vista ${this.indexInfo.name}</h1>
      <span class="font-medium">Categoria: ${this.indexInfo.category}</span>
    `;
    console.log(this.indexKey)
    return header;
  }

  // Genera barra di ricerca
  generateSearchBar() {
    const container = document.createElement('div');
    container.className = 'mb-6';
    
    const input = document.createElement('input');
    input.placeholder = 'Cerca...';
    input.className = 'w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500';
    
    let timeout;
    input.addEventListener('input', (e) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => this.filterBySearch(e.target.value), 300);
    });
    
    container.appendChild(input);
    return container;
  }

  // Genera menu ordinamento
  generateSortMenu() {
    const container = document.createElement('div');
    container.className = 'mb-6';
    
    const title = document.createElement('h3');
    title.className = 'text-sm font-medium text-slate-700 mb-2';
    title.textContent = 'Ordinamento';
    
    const buttons = document.createElement('div');
    buttons.className = 'flex gap-2';
    
    const alphabetical = this.createButton(
      'Alfabetico', 
      this.sortOrder === 'alphabetical',
      () => {
        this.changeSortOrder('alphabetical');
        this.setActiveButton(alphabetical, [alphabetical, occurrences]);
      }
    );
    
    const occurrences = this.createButton(
      'Occorrenze', 
      this.sortOrder === 'occurrences',
      () => {
        this.changeSortOrder('occurrences');
        this.setActiveButton(occurrences, [alphabetical, occurrences]);
      }
    );
    
    buttons.appendChild(alphabetical);
    buttons.appendChild(occurrences);
    
    container.appendChild(title);
    container.appendChild(buttons);
    return container;
  }

  // Genera filtri per iniziali
  generateInitialsFilter() {
    const container = document.createElement('div');
    container.className = 'mb-6';
    
    const title = document.createElement('h3');
    title.className = 'text-sm font-medium text-slate-700 mb-2';
    title.textContent = 'Filtri';
    
    const buttons = document.createElement('div');
    buttons.className = 'flex flex-wrap gap-1';
    
    const allButton = this.createButton('Tutti', true, () => {
      this.filterByInitial('Tutti');
      this.setActiveButton(allButton, buttons.children);
    });
    buttons.appendChild(allButton);
    
    this.getInitials().forEach(initial => {
      const button = this.createButton(initial, false, () => {
        this.filterByInitial(initial);
        this.setActiveButton(button, buttons.children);
      });
      buttons.appendChild(button);
    });
    
    container.appendChild(title);
    container.appendChild(buttons);
    return container;
  }

  // Crea bottone
  createButton(text, active, onClick) {
    const button = document.createElement('button');
    button.textContent = text;
    button.className = active 
      ? 'px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700'
      : 'px-3 py-1 text-sm bg-slate-200 text-slate-700 rounded hover:bg-slate-300';
    button.onclick = onClick;
    return button;
  }

  // Imposta bottone attivo
  setActiveButton(activeButton, allButtons) {
    Array.from(allButtons).forEach(btn => {
      btn.className = 'px-3 py-1 text-sm bg-slate-200 text-slate-700 rounded hover:bg-slate-300';
    });
    activeButton.className = 'px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700';
  }

  // Genera lista principale
  generateList() {
    const container = document.createElement('div');
    container.className = 'space-y-3';
    
    const entries = Object.entries(this.filteredData);
    
    if (entries.length === 0) {
      container.innerHTML = `
        <div class="text-center py-8 text-slate-500">
          <p>Nessun risultato trovato</p>
        </div>
      `;
      return container;
    }

    const sorted = this.sortOrder === 'alphabetical'
      ? entries.sort(([a], [b]) => a.localeCompare(b))
      : entries.sort(([a, itemsA], [b, itemsB]) => itemsB.length - itemsA.length);

    sorted.forEach(([key, items], index) => {
      const item = document.createElement('div');
      item.className = 'bg-white border rounded-lg shadow-sm';

      const header = document.createElement('button');
      header.className = 'w-full flex items-center justify-between p-4 hover:bg-slate-50';
      header.onclick = () => this.toggleAccordion(index);

      const left = document.createElement('div');
      left.className = 'flex items-center space-x-3';
      
      const title = document.createElement('span');
      title.className = 'font-medium text-slate-800';
      title.textContent = key;
      
      const badge = document.createElement('span');
      badge.className = 'px-2 py-1 text-xs bg-slate-200 text-slate-700 rounded';
      badge.textContent = items.length;
      
      left.appendChild(title);
      left.appendChild(badge);

      const right = document.createElement('div');
      right.className = 'flex items-center space-x-2';
      
      const mapButton = document.createElement('a');
      mapButton.href = createMapUrlWithFilter(this.indexKey, key);
      mapButton.className = 'p-1 text-primary-600 hover:text-primary-700';
      mapButton.onclick = e => e.stopPropagation();
      mapButton.innerHTML = `
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
        </svg>
      `;
      
      const chevron = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      chevron.id = `chevron-${index}`;
      chevron.setAttribute('class', 'w-4 h-4 text-slate-400 transform transition-transform');
      chevron.setAttribute('fill', 'none');
      chevron.setAttribute('stroke', 'currentColor');
      chevron.setAttribute('viewBox', '0 0 24 24');
      chevron.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>';
      
      right.appendChild(mapButton);
      right.appendChild(chevron);
      
      header.appendChild(left);
      header.appendChild(right);

      const content = document.createElement('div');
      content.id = `content-${index}`;
      content.className = 'hidden px-4 pb-4 space-y-2 border-t bg-slate-50';

      // Raggruppa per location
      const locationGroups = {};
      items.forEach(item => {
        const location = item.Location || 'Senza location';
        if (!locationGroups[location]) locationGroups[location] = [];
        locationGroups[location].push(item);
      });

      Object.entries(locationGroups).forEach(([location, locationItems]) => {
        const locationDiv = document.createElement('div');
        locationDiv.className = 'flex justify-between items-center py-2 px-3 bg-white rounded border';
        
        const locationText = document.createElement('span');
        locationText.className = 'text-sm text-slate-700';
        locationText.textContent = location;
        
        const count = document.createElement('span');
        count.className = 'text-xs px-2 py-1 bg-slate-200 rounded';
        count.textContent = locationItems.length;
        
        locationDiv.appendChild(locationText);
        locationDiv.appendChild(count);
        content.appendChild(locationDiv);
      });

      item.appendChild(header);
      item.appendChild(content);
      container.appendChild(item);
    });

    return container;
  }

  // Genera layout completo a 2 colonne
  generateLayout() {
    const layout = document.createElement('div');
    layout.className = 'h-screen flex bg-slate-50';

    // Colonna sinistra (sidebar)
    const sidebar = document.createElement('div');
    sidebar.className = 'w-1/3 p-6 bg-white border-r border-slate-200 flex flex-col';

    sidebar.appendChild(this.generateHeader());
    sidebar.appendChild(this.generateSearchBar());
    sidebar.appendChild(this.generateSortMenu());
    sidebar.appendChild(this.generateInitialsFilter());

    // Colonna destra (contenuto scrollabile)
    const content = document.createElement('div');
    content.className = 'flex-1 flex flex-col';

    const contentHeader = document.createElement('div');
    contentHeader.className = 'p-6 bg-white border-b border-slate-200';
    contentHeader.innerHTML = `
      <h2 class="text-xl font-semibold text-slate-800">Risultati</h2>
      <p class="text-sm text-slate-600">Clicca per espandere i dettagli</p>
    `;

    const contentList = document.createElement('div');
    contentList.className = 'content-list flex-1 overflow-y-auto p-6';
    contentList.appendChild(this.generateList());

    content.appendChild(contentHeader);
    content.appendChild(contentList);

    layout.appendChild(sidebar);
    layout.appendChild(content);

    return layout;
  }

  // Metodo per compatibilità con il sistema esistente
  // Ritorna il layout completo come singolo componente
  generateViewComponents() {
    return [this.generateLayout()];
  }
}