// views/SimpleView.js
import { ViewComponents } from '../utils/ViewComponents.js';
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

  getInitials() {
    const initials = new Set();
    Object.keys(this.aggregatedData).forEach(key => {
      const initial = key.charAt(0).toUpperCase();
      initials.add(initial.match(/[A-Z0-9]/) ? initial : '#');
    });
    return Array.from(initials).sort();
  }

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

  filterBySearch(searchTerm) {
    this.currentSearchTerm = searchTerm.toLowerCase();
    this.applySearch();
    this.refreshList();
  }

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

  changeSortOrder(order) {
    this.sortOrder = order;
    this.refreshList();
  }

  refreshList() {
    const container = document.querySelector('.simple-view-wrapper');
    if (container) {
      container.innerHTML = '';
      container.appendChild(this.generateList());
    }
  }

  goToMapWithFilter(value) {
    window.location.href = createMapUrlWithFilter(this.indexKey, value);
  }

  // =====================================================
  // COMPONENTI SIDEBAR
  // =====================================================

  generateHeader() {
    const header = document.createElement('div');
    header.className = 'mb-6';
    header.innerHTML = `
      <span class="font-medium border-b-2 border-primary-600 pb-1">${this.indexInfo.category || 'Indice'}</span>
      <h1 class="text-3xl font-bold text-slate-800 my-2">Vista: <span class="text-secondary-700">${this.indexInfo.name || this.indexKey}</span></h1>
    `;
    return header;
  }

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

  // =====================================================
  // CONTENUTO PRINCIPALE - CON ViewComponents
  // =====================================================

  generateList() {
    const entries = Object.entries(this.filteredData);
    
    if (entries.length === 0) {
      return ViewComponents.createEmptyState('Nessun risultato trovato');
    }

    const wrapper = document.createElement("div");
    wrapper.className = "bg-white rounded-lg shadow-sm";

    const sorted = this.sortOrder === 'alphabetical'
      ? entries.sort(([a], [b]) => a.localeCompare(b))
      : entries.sort(([a, itemsA], [b, itemsB]) => itemsB.length - itemsA.length);

    sorted.forEach(([key, items], index) => {
      const accordionItem = ViewComponents.createAccordionItem({
        id: `simple-content-${index}`,
        title: key,
        subtitle: `${items.length} luog${items.length !== 1 ? 'hi' : 'o'}`,
        count: items.length,
        indexKey: this.indexKey,
        filterValue: key,
        content: ViewComponents.createLocationDetailsTable(
          items, 
          this.indexKey, 
          key,
          { onMapClick: (val) => this.goToMapWithFilter(val) }
        ),
        isExpanded: false
      });
      
      wrapper.appendChild(accordionItem);
    });

    return wrapper;
  }

  createButton(text, active, onClick) {
    const button = document.createElement('button');
    button.textContent = text;
    button.className = active 
      ? 'px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700'
      : 'px-3 py-1 text-sm bg-slate-200 text-slate-700 rounded hover:bg-slate-300';
    button.onclick = onClick;
    return button;
  }

  setActiveButton(activeButton, allButtons) {
    Array.from(allButtons).forEach(btn => {
      btn.className = 'px-3 py-1 text-sm bg-slate-200 text-slate-700 rounded hover:bg-slate-300';
    });
    activeButton.className = 'px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700';
  }

  generateViewComponents() {
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'simple-view-wrapper';
    contentWrapper.appendChild(this.generateList());
    
    return {
      sidebar: [
        this.generateHeader(),
        this.generateSearchBar(),
        this.generateSortMenu(),
        this.generateInitialsFilter()
      ],
      content: [contentWrapper]
    };
  }
}