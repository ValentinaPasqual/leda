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
  // CONTENUTO PRINCIPALE
  // =====================================================

  generateList() {
    const wrapper = document.createElement("div");
    wrapper.className = "bg-white rounded-lg shadow-sm";
    
    const entries = Object.entries(this.filteredData);
    
    if (entries.length === 0) {
      wrapper.innerHTML = `
        <div class="text-center py-8 text-slate-500">
          <p>Nessun risultato trovato</p>
        </div>
      `;
      return wrapper;
    }

    const sorted = this.sortOrder === 'alphabetical'
      ? entries.sort(([a], [b]) => a.localeCompare(b))
      : entries.sort(([a, itemsA], [b, itemsB]) => itemsB.length - itemsA.length);

    sorted.forEach(([key, items], index) => {
      const accordionItem = document.createElement("div");
      accordionItem.className = "border-b border-slate-200 last:border-b-0";

      const header = document.createElement("div");
      header.className = "flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50";
      
      const accordionId = `content-${index}`;

      const left = document.createElement("div");
      left.className = "flex items-center space-x-4 flex-1";

      const keyInfo = document.createElement("div");
      keyInfo.innerHTML = `
        <div class="font-semibold text-lg text-primary-900">${key}</div>
        <div class="text-sm text-slate-600">${items.length} luog${items.length !== 1 ? 'hi' : 'o'}</div>
      `;

      left.appendChild(keyInfo);

      const right = document.createElement("div");
      right.className = "flex items-center space-x-3";

      const badge = document.createElement("span");
      badge.className = "text-secondary-500 bg-secondary-100 px-3 py-1 rounded-full text-sm font-medium";
      badge.textContent = `${items.length}`;

      const chevron = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      chevron.setAttribute('class', 'w-5 h-5 text-slate-400 transform transition-transform');
      chevron.setAttribute('fill', 'none');
      chevron.setAttribute('stroke', 'currentColor');
      chevron.setAttribute('viewBox', '0 0 24 24');
      chevron.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>';

      const mapButton = document.createElement("button");
      mapButton.className = "p-2 text-secondary-600 hover:text-secondary-700 hover:bg-secondary-50 rounded";
      mapButton.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
        </svg>
      `;
      mapButton.onclick = (e) => {
        e.stopPropagation();
        window.location.href = createMapUrlWithFilter(this.indexKey, key);
      };

      right.appendChild(badge);
      right.appendChild(chevron);
      right.appendChild(mapButton);

      header.appendChild(left);
      header.appendChild(right);

      header.onclick = (e) => {
        if (e.target === mapButton || e.target.closest('button') === mapButton) return;
        this.toggleAccordion(index);
      };

      const content = document.createElement("div");
      content.id = accordionId;
      content.className = "accordion-content bg-slate-50 hidden";

      const detailsList = this.createDetailsList(key, items);
      content.appendChild(detailsList);

      accordionItem.appendChild(header);
      accordionItem.appendChild(content);
      wrapper.appendChild(accordionItem);
    });

    return wrapper;
  }

  createDetailsList(key, items) {
    const container = document.createElement("div");
    container.className = "p-4";

    const locationGroups = {};
    items.forEach(item => {
      const location = item.Location || 'Senza location';
      if (!locationGroups[location]) {
        locationGroups[location] = [];
      }
      locationGroups[location].push(item);
    });

    const sortedLocations = Object.keys(locationGroups).sort();

    if (sortedLocations.length === 0) {
      container.innerHTML = '<div class="text-sm text-slate-500 italic">Nessun elemento disponibile</div>';
      return container;
    }

    const table = document.createElement("div");
    table.className = "space-y-2";

    const headerRow = document.createElement("div");
    headerRow.className = "flex items-center font-medium text-sm text-slate-700 pb-2 border-b border-slate-200";
    headerRow.innerHTML = `
      <div class="flex-1 min-w-0">Luoghi</div>
      <div class="w-12 flex-shrink-0 text-center">Qty</div>
      <div class="w-16 flex-shrink-0 text-center">Azioni</div>
    `;
    table.appendChild(headerRow);

    sortedLocations.forEach(location => {
      const locationItems = locationGroups[location];
      
      const row = document.createElement("div");
      row.className = "flex items-center text-sm py-2 hover:bg-white rounded px-2";

      const locationCell = document.createElement("div");
      locationCell.className = "flex-1 min-w-0 text-slate-600";
      locationCell.textContent = location;

      const qtyCell = document.createElement("div");
      qtyCell.className = "w-12 flex-shrink-0 text-center";
      const qtyBadge = document.createElement("span");
      qtyBadge.className = "text-secondary-500 bg-secondary-100 px-2 py-0.5 rounded-full text-xs";
      qtyBadge.textContent = locationItems.length.toString();
      qtyCell.appendChild(qtyBadge);

      const actionCell = document.createElement("div");
      actionCell.className = "w-16 flex-shrink-0 text-center";
      
      const viewButton = document.createElement("button");
      viewButton.className = "text-secondary-600 hover:text-secondary-700 p-1 rounded hover:bg-secondary-50";
      viewButton.innerHTML = `
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
        </svg>
      `;
      viewButton.onclick = () => {
        window.location.href = createMapUrlWithFilter(this.indexKey, key);
      };
      viewButton.title = `Visualizza sulla mappa: ${location}`;
      
      actionCell.appendChild(viewButton);

      row.appendChild(locationCell);
      row.appendChild(qtyCell);
      row.appendChild(actionCell);

      table.appendChild(row);
    });

    container.appendChild(table);
    return container;
  }

  toggleAccordion(index) {
    const accordionId = `content-${index}`;
    const content = document.getElementById(accordionId);
    const chevron = content?.previousElementSibling?.querySelector('svg:nth-last-child(2)');
    
    if (!content || !chevron) return;
    
    const isHidden = content.classList.contains('hidden');
    
    content.classList.toggle('hidden');
    
    if (isHidden) {
      chevron.classList.add('rotate-180');
    } else {
      chevron.classList.remove('rotate-180');
    }
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
      content: [
        contentWrapper
      ]
    };
  }
}