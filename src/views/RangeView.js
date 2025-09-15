// views/RangeView.js
import * as d3 from "d3";
import { createMapUrlWithFilter } from '../utils/urlHelper.js';

const base = import.meta.env.BASE_URL 

export class RangeView {
  constructor(data, indexKey, indexInfo) {
    this.data = data;
    this.indexKey = indexKey;
    this.indexInfo = indexInfo || {};
    this.rangeData = this.buildRangeData(data, indexKey);
    this.activeTab = 'range-list';
    this.currentSearchTerm = '';
    this.expandedItems = new Set();
    this.selectedRange = null;
  }

  // ===============================
  // FUNZIONI PER ELABORAZIONE DATI
  // ===============================
  buildRangeData(data, indexKey) {
    const ranges = {};
    const allValues = [];

    // Estrai tutti i valori numerici
    data.forEach(item => {
      const value = item[indexKey];
      if (value !== null && value !== undefined && value !== '') {
        const numValue = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
        if (!isNaN(numValue)) {
          allValues.push(numValue);
          if (!ranges[numValue]) {
            ranges[numValue] = [];
          }
          ranges[numValue].push(item);
        }
      }
    });

    // Ordina i valori
    allValues.sort((a, b) => a - b);

    // Crea i range automatici
    return this.createRanges(ranges, allValues);
  }

  createRanges(ranges, allValues) {
    if (allValues.length === 0) return {};

    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const range = max - min;

    // Determina il tipo di range basato sui dati
    let rangeType = 'decades';
    let rangeSize = 10;

    if (range <= 10) {
      rangeType = 'units';
      rangeSize = 1;
    } else if (range <= 50) {
      rangeType = 'fives';
      rangeSize = 5;
    } else if (range <= 200) {
      rangeType = 'tens';
      rangeSize = 10;
    } else if (range <= 1000) {
      rangeType = 'fifties';
      rangeSize = 50;
    } else {
      rangeType = 'hundreds';
      rangeSize = 100;
    }

    // Crea i bucket
    const buckets = {};
    
    Object.entries(ranges).forEach(([value, items]) => {
      const numValue = parseFloat(value);
      const bucketStart = Math.floor(numValue / rangeSize) * rangeSize;
      const bucketEnd = bucketStart + rangeSize - 1;
      const bucketKey = `${bucketStart}-${bucketEnd}`;
      
      if (!buckets[bucketKey]) {
        buckets[bucketKey] = {
          start: bucketStart,
          end: bucketEnd,
          items: [],
          values: new Set()
        };
      }
      
      buckets[bucketKey].items.push(...items);
      buckets[bucketKey].values.add(numValue);
    });

    return {
      type: rangeType,
      size: rangeSize,
      min,
      max,
      buckets,
      allValues: [...new Set(allValues)].sort((a, b) => a - b)
    };
  }

  // ===============================
  // COMPONENTI SIDEBAR (COLONNA SINISTRA)
  // ===============================

  generateHeader() {
    const header = document.createElement('div');
    header.className = 'mb-6';
    header.innerHTML = `
      <span class="font-medium border-b-2 border-primary-600 pb-1">${this.indexInfo.category || 'Range Numerici'}</span>
      <h1 class="text-3xl font-bold text-slate-800 my-2">Vista: <span class="text-secondary-700">${this.indexInfo.name || this.indexKey}</span></h1>
    `;
    return header;
  }

  generateSearchBar() {
    const container = document.createElement('div');
    container.className = 'mb-6';
    
    const input = document.createElement('input');
    input.placeholder = 'Cerca valore numerico...';
    input.className = 'w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500';
    
    let timeout;
    input.addEventListener('input', (e) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => this.filterBySearch(e.target.value), 300);
    });
    
    container.appendChild(input);
    return container;
  }

  generateTabsMenu() {
    const container = document.createElement('div');
    container.className = 'mb-6';
    
    const title = document.createElement('h3');
    title.className = 'text-sm font-medium text-slate-700 mb-2';
    title.textContent = 'Visualizzazione';
    
    const buttons = document.createElement('div');
    buttons.className = 'flex flex-col gap-2';
    
    const tabs = [
      { id: 'range-list', label: 'Lista degli intervalli', icon: '📋' },
      { id: 'timeline', label: 'Grafico di andamento', icon: '📊' },
      { id: 'histogram', label: 'Istogramma', icon: '📈' },
    ];

    const tabButtons = [];

    tabs.forEach(tab => {
      const button = this.createTabButton(tab.label, tab.icon, this.activeTab === tab.id, () => {
        this.switchTab(tab.id);
        this.setActiveButton(button, tabButtons);
      });
      tabButtons.push(button);
      buttons.appendChild(button);
    });
    
    container.appendChild(title);
    container.appendChild(buttons);
    return container;
  }

  generateRangeInfo() {
    const info = document.createElement('div');
    info.className = 'mb-6 p-4 bg-slate-50 rounded-lg';
    
    const totalItems = Object.values(this.rangeData.buckets || {}).reduce((sum, bucket) => sum + bucket.items.length, 0);
    
    info.innerHTML = `
      <h4 class="font-small text-slate-700 mb-3">Statistiche Range</h4>
      <div class="text-xs text-slate-600 space-y-2">
        <div class="flex justify-between"><span>Min:</span><strong>${this.rangeData.min || 0}</strong></div>
        <div class="flex justify-between"><span>Max:</span><strong>${this.rangeData.max || 0}</strong></div>
        <div class="flex justify-between"><span>Tipo:</span><strong>${this.getRangeTypeLabel()}</strong></div>
        <div class="flex justify-between"><span>Elementi:</span><strong>${totalItems}</strong></div>
        <div class="flex justify-between"><span>Range:</span><strong>${Object.keys(this.rangeData.buckets || {}).length}</strong></div>
        <div class="flex justify-between"><span>Valori unici:</span><strong>${this.rangeData.allValues?.length || 0}</strong></div>
      </div>
    `;
    return info;
  }

  // ===============================
  // COMPONENTI CONTENUTO (COLONNA DESTRA)
  // ===============================

  generateRangeContent() {
    const wrapper = document.createElement("div");
    wrapper.className = "range-content-wrapper";
    
    // Il contenuto verrà generato dinamicamente in base al tab attivo
    this.renderActiveView(wrapper);
    
    return wrapper;
  }

  // ===============================
  // UTILITY PER BOTTONI E CONTROLLI
  // ===============================

  createTabButton(text, icon, active, onClick) {
    const button = document.createElement('button');
    button.className = active 
      ? 'flex items-center gap-2 w-full px-3 py-2 text-sm bg-primary-600 text-white rounded hover:bg-primary-700'
      : 'flex items-center gap-2 w-full px-3 py-2 text-sm bg-slate-200 text-slate-700 rounded hover:bg-slate-300';
    button.innerHTML = `<span>${icon}</span><span>${text}</span>`;
    button.onclick = onClick;
    return button;
  }

  setActiveButton(activeButton, allButtons) {
    allButtons.forEach(btn => {
      btn.className = 'flex items-center gap-2 w-full px-3 py-2 text-sm bg-slate-200 text-slate-700 rounded hover:bg-slate-300';
    });
    activeButton.className = 'flex items-center gap-2 w-full px-3 py-2 text-sm bg-primary-600 text-white rounded hover:bg-primary-700';
  }

  getRangeTypeLabel() {
    const labels = {
      'units': 'Unità',
      'fives': 'Gruppi di 5',
      'tens': 'Decine',
      'fifties': 'Gruppi di 50',
      'hundreds': 'Centinaia',
      'decades': 'Decenni'
    };
    return labels[this.rangeData.type] || 'Automatico';
  }

  // ===============================
  // CONTROLLO TABS E RENDERING
  // ===============================

  switchTab(tabId) {
    this.activeTab = tabId;
    this.refreshContent();
    this.refreshSidebar();
  }

  renderActiveView(container) {
    container.innerHTML = '';
    
    switch(this.activeTab) {
      case 'timeline':
        this.renderTimeline(container);
        break;
      case 'histogram':
        this.renderHistogram(container);
        break;
      case 'range-list':
        this.renderRangeList(container);
        break;
    }
  }

  refreshContent() {
    const container = document.querySelector('.range-content-wrapper');
    if (container) {
      this.renderActiveView(container);
    }
  }

  refreshSidebar() {
    const sidebarContent = document.querySelector('.sidebar-content');
    if (sidebarContent) {
      sidebarContent.innerHTML = '';
      
      const sidebarComponents = [
        this.generateHeader(),
        this.generateTabsMenu(),
        this.generateRangeInfo(),
      ];
      
      sidebarComponents.forEach(component => {
        sidebarContent.appendChild(component);
      });
    }
  }

  // ===============================
  // NAVIGAZIONE ALLA MAPPA
  // ===============================

  goToMapWithFilter(rangeValue) {
    const filterAction = {
      type: "FACET_CHANGE",
      facetType: this.indexKey,
      value: rangeValue,
      checked: true
    };

    if (typeof window.handleStateChange === 'function') {
      window.handleStateChange(filterAction);
    }

    const mapUrl = createMapUrlWithFilter(this.indexKey, rangeValue);
    
    if (typeof window.navigateToMap === 'function') {
      window.navigateToMap(filterAction);
    } else {
      window.location = mapUrl;
    }
  }

  // ===============================
  // VISUALIZZAZIONE: Timeline
  // ===============================

  renderTimeline(container) {
    const wrapper = document.createElement("div");
    wrapper.className = "bg-white p-6 rounded-lg shadow-sm";

    if (!this.rangeData.allValues || this.rangeData.allValues.length === 0) {
      wrapper.innerHTML = '<div class="text-center py-8 text-slate-500">Nessun dato numerico disponibile</div>';
      container.appendChild(wrapper);
      return;
    }

    const width = Math.min(800, container.clientWidth || 800);
    const height = 400;
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };

    const svg = d3.select(wrapper).append("svg")
      .attr("width", width)
      .attr("height", height);

    // Crea scala temporale/numerica
    const xScale = d3.scaleLinear()
      .domain([this.rangeData.min, this.rangeData.max])
      .range([margin.left, width - margin.right]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(Object.values(this.rangeData.buckets), d => d.items.length)])
      .range([height - margin.bottom, margin.top]);

    // Asse X
    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.format("d")));

    // Asse Y
    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(yScale));

    // Linea timeline
    const line = d3.line()
      .x(d => xScale((d.start + d.end) / 2))
      .y(d => yScale(d.items.length))
      .curve(d3.curveMonotoneX);

    const bucketArray = Object.entries(this.rangeData.buckets)
      .map(([key, data]) => data)
      .sort((a, b) => a.start - b.start);

    svg.append("path")
      .datum(bucketArray)
      .attr("fill", "none")
      .attr("stroke", "#3B82F6")
      .attr("stroke-width", 3)
      .attr("d", line);

    // Punti interattivi
    svg.selectAll("circle")
      .data(bucketArray)
      .enter()
      .append("circle")
      .attr("cx", d => xScale((d.start + d.end) / 2))
      .attr("cy", d => yScale(d.items.length))
      .attr("r", 6)
      .attr("fill", "#3B82F6")
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .on("mouseover", function(event, d) {
        const tooltip = d3.select("body").append("div")
          .attr("class", "tooltip")
          .style("position", "absolute")
          .style("padding", "8px")
          .style("background", "rgba(0,0,0,0.8)")
          .style("color", "white")
          .style("border-radius", "4px")
          .style("font-size", "12px")
          .text(`Range: ${d.start}-${d.end} (${d.items.length} elementi)`)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 10) + "px");
        
        setTimeout(() => tooltip.remove(), 3000);
      })
      .on("click", (event, d) => {
        this.goToMapWithFilter(`${d.start}-${d.end}`);
      });

    // Etichette
    const labels = document.createElement("div");
    labels.className = "mt-4 text-center text-sm text-slate-600";
    labels.innerHTML = `
      <div><strong>Asse X:</strong> Valori numerici del campo "${this.indexKey}"</div>
      <div><strong>Asse Y:</strong> Numero di elementi per range</div>
    `;
    wrapper.appendChild(labels);

    container.appendChild(wrapper);
  }

  // ===============================
  // VISUALIZZAZIONE: Istogramma
  // ===============================

  renderHistogram(container) {
    const wrapper = document.createElement("div");
    wrapper.className = "bg-white p-6 rounded-lg shadow-sm";

    if (!this.rangeData.buckets || Object.keys(this.rangeData.buckets).length === 0) {
      wrapper.innerHTML = '<div class="text-center py-8 text-slate-500">Nessun dato numerico disponibile</div>';
      container.appendChild(wrapper);
      return;
    }

    const width = Math.min(800, container.clientWidth || 800);
    const height = 400;
    const margin = { top: 20, right: 30, bottom: 60, left: 50 };

    const svg = d3.select(wrapper).append("svg")
      .attr("width", width)
      .attr("height", height);

    const bucketArray = Object.entries(this.rangeData.buckets)
      .map(([key, data]) => ({ ...data, key }))
      .sort((a, b) => a.start - b.start);

    const xScale = d3.scaleBand()
      .domain(bucketArray.map(d => d.key))
      .range([margin.left, width - margin.right])
      .padding(0.1);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(bucketArray, d => d.items.length)])
      .range([height - margin.bottom, margin.top]);

    // Asse X
    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-45)");

    // Asse Y
    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(yScale));

    // Barre
    svg.selectAll("rect")
      .data(bucketArray)
      .enter()
      .append("rect")
      .attr("x", d => xScale(d.key))
      .attr("y", d => yScale(d.items.length))
      .attr("width", xScale.bandwidth())
      .attr("height", d => height - margin.bottom - yScale(d.items.length))
      .attr("fill", "#3B82F6")
      .style("cursor", "pointer")
      .on("mouseover", function(event, d) {
        d3.select(this).attr("fill", "#1E40AF");
        const tooltip = d3.select("body").append("div")
          .attr("class", "tooltip")
          .style("position", "absolute")
          .style("padding", "8px")
          .style("background", "rgba(0,0,0,0.8)")
          .style("color", "white")
          .style("border-radius", "4px")
          .style("font-size", "12px")
          .text(`Range: ${d.key} (${d.items.length} elementi)`)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 10) + "px");
        
        setTimeout(() => tooltip.remove(), 3000);
      })
      .on("mouseout", function() {
        d3.select(this).attr("fill", "#3B82F6");
      })
      .on("click", (event, d) => {
        this.goToMapWithFilter(d.key);
      });

    container.appendChild(wrapper);
  }

  // ===============================
  // VISUALIZZAZIONE: Lista Range
  // ===============================

  renderRangeList(container) {
    const wrapper = document.createElement("div");
    wrapper.className = "bg-white rounded-lg shadow-sm";

    if (!this.rangeData.buckets || Object.keys(this.rangeData.buckets).length === 0) {
      wrapper.innerHTML = '<div class="text-center py-8 text-slate-500">Nessun dato numerico disponibile</div>';
      container.appendChild(wrapper);
      return;
    }

    const bucketArray = Object.entries(this.rangeData.buckets)
      .map(([key, data]) => ({ ...data, key }))
      .sort((a, b) => a.start - b.start);

    bucketArray.forEach((bucket, index) => {

      const accordionItem = document.createElement("div");
      accordionItem.className = "border-b border-slate-200 last:border-b-0";

      // Header del range (sempre visibile)
      const header = document.createElement("div");
      header.className = "flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50";
      
      const accordionId = `range-accordion-${index}`;
      const isExpanded = this.expandedItems.has(accordionId);

      const left = document.createElement("div");
      left.className = "flex items-center space-x-4 flex-1";

      const rangeInfo = document.createElement("div");
      rangeInfo.innerHTML = `
        <div class="font-semibold text-lg text-primary-900">${bucket.key}</div>
      `;

      left.appendChild(rangeInfo);

      const right = document.createElement("div");
      right.className = "flex items-center space-x-3";

      const badge = document.createElement("span");
      badge.className = "text-secondary-500 bg-secondary-100 px-3 py-1 rounded-full text-sm font-medium";
      badge.textContent = `${bucket.items.length}`;

      // Chevron per espansione
      const chevron = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      chevron.setAttribute('class', `w-5 h-5 text-slate-400 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`);
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
        this.goToMapWithFilter(bucket.key);
      };

      right.appendChild(badge);
      right.appendChild(chevron);
      right.appendChild(mapButton);

      header.appendChild(left);
      header.appendChild(right);

      // Click handler per espansione
      header.onclick = (e) => {
        if (e.target === mapButton || e.target.closest('button') === mapButton) return;
        this.toggleRangeAccordion(accordionId);
      };

      // Contenuto accordion (lista dettagliata)
      const content = document.createElement("div");
      content.id = accordionId;
      content.className = `accordion-content bg-slate-50 ${isExpanded ? '' : 'hidden'}`;

      const detailsList = this.createRangeDetailsList(bucket);
      content.appendChild(detailsList);

      accordionItem.appendChild(header);
      accordionItem.appendChild(content);
      wrapper.appendChild(accordionItem);
    });

    container.appendChild(wrapper);
  }

  toggleRangeAccordion(accordionId) {
    const content = document.getElementById(accordionId);
    const chevron = content?.previousElementSibling?.querySelector('svg:nth-last-child(2)');
    
    if (!content || !chevron) return;
    
    content.classList.toggle('hidden');
    chevron.classList.toggle('rotate-180');
    
    if (content.classList.contains('hidden')) {
      this.expandedItems.delete(accordionId);
    } else {
      this.expandedItems.add(accordionId);
    }
  }

  createRangeDetailsList(bucket) {
    const container = document.createElement("div");
    container.className = "p-4";

    // Raggruppa gli item per valore specifico
    const itemsByValue = {};
    bucket.items.forEach(item => {
      const value = item[this.indexKey];
      if (!itemsByValue[value]) {
        itemsByValue[value] = [];
      }
      itemsByValue[value].push(item);
    });

    // Ordina i valori
    const sortedValues = Object.keys(itemsByValue).sort((a, b) => parseFloat(a) - parseFloat(b));

    if (sortedValues.length === 0) {
      container.innerHTML = '<div class="text-sm text-slate-500 italic">Nessun elemento disponibile</div>';
      return container;
    }

    // Header della tabella
    const table = document.createElement("div");
    table.className = "space-y-2";

    const headerRow = document.createElement("div");
    headerRow.className = "flex items-center font-medium text-sm text-slate-700 pb-2 border-b border-slate-200";
    headerRow.innerHTML = `
      <div class="w-24 flex-shrink-0">Valore</div>
      <div class="w-12 flex-shrink-0 text-center">Qty</div>
      <div class="flex-1 min-w-0">Location</div>
      <div class="w-16 flex-shrink-0 text-center">Azioni</div>
    `;
    table.appendChild(headerRow);

    // Righe dei dati
    sortedValues.forEach(value => {
      const items = itemsByValue[value];
      const locations = [...new Set(items.map(item => item.Location || 'N/A').filter(loc => loc && loc !== 'N/A'))];
      
      const row = document.createElement("div");
      row.className = "flex items-center text-sm py-2 hover:bg-white rounded px-2";

      // Valore
      const valueCell = document.createElement("div");
      valueCell.className = "w-24 flex-shrink-0 font-medium text-primary-700";
      valueCell.textContent = value;

      // Quantità
      const qtyCell = document.createElement("div");
      qtyCell.className = "w-12 flex-shrink-0 text-center";
      const qtyBadge = document.createElement("span");
      qtyBadge.className = "text-secondary-500 bg-secondary-100 px-2 py-0.5 rounded-full text-xs";
      qtyBadge.textContent = items.length.toString();
      qtyCell.appendChild(qtyBadge);

      // Location
      const locationCell = document.createElement("div");
      locationCell.className = "flex-1 min-w-0 text-slate-600";
      
      if (locations.length === 0) {
        locationCell.innerHTML = '<span class="italic text-slate-400">Nessuna location</span>';
      } else if (locations.length === 1) {
        locationCell.textContent = locations[0];
      } else {
        // Mostra le prime location con conteggio
        locationCell.innerHTML = `
          <div>${locations[0]}</div>
          ${locations.length > 1 ? `<div class="text-xs text-slate-500">+${locations.length - 1} altre</div>` : ''}
        `;
      }

      // Azioni
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
      viewButton.onclick = () => this.goToMapWithFilter(value);
      viewButton.title = `Visualizza sulla mappa gli elementi con valore ${value}`;
      
      actionCell.appendChild(viewButton);

      row.appendChild(valueCell);
      row.appendChild(qtyCell);
      row.appendChild(locationCell);
      row.appendChild(actionCell);

      table.appendChild(row);
    });

    container.appendChild(table);
    return container;
  }

  // ===============================
  // INTERFACCIA PRINCIPALE - COMPATIBILITA' CON IL SISTEMA CENTRALIZZATO
  // ===============================

  generateViewComponents() {
    return {
      sidebar: [
        this.generateHeader(),
        this.generateTabsMenu(),
        this.generateRangeInfo(),
      ],
      content: [
        this.generateRangeContent()
      ]
    };
  }

  // ===============================
  // METODI DEPRECATI (per compatibilità)
  // ===============================

  // Keep the old render method for backward compatibility (if needed elsewhere)
  render(container) {
    console.warn('render() method is deprecated. Use generateViewComponents() instead.');
    const components = this.generateViewComponents();
    
    // Se il sistema chiamante si aspetta ancora l'array, restituiamo un layout combinato
    const layout = document.createElement('div');
    layout.className = 'min-h-screen flex bg-slate-50';

    const sidebar = document.createElement('div');
    sidebar.className = 'w-1/3 p-6 bg-white flex flex-col justify-center';
    components.sidebar.forEach(comp => sidebar.appendChild(comp));

    const content = document.createElement('div');
    content.className = 'flex-1 flex flex-col justify-center pt-24 p-4';
    components.content.forEach(comp => content.appendChild(comp));

    layout.appendChild(sidebar);
    layout.appendChild(content);
    
    container.appendChild(layout);
  }
}