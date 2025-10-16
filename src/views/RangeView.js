// views/RangeView.js
import * as d3 from "d3";
import { ViewComponents } from '../utils/ViewComponents.js';
import { createMapUrlWithFilter } from '../utils/urlHelper.js';

const base = import.meta.env.BASE_URL;

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
  // COMPONENTI SIDEBAR
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
      const button = ViewComponents.createTabButton(
        tab.label,
        tab.icon,
        this.activeTab === tab.id,
        () => {
          this.switchTab(tab.id);
          this.setActiveButton(button, tabButtons);
        }
      );
      tabButtons.push(button);
      buttons.appendChild(button);
    });
    
    container.appendChild(title);
    container.appendChild(buttons);
    return container;
  }

  setActiveButton(activeButton, allButtons) {
    allButtons.forEach(btn => {
      btn.className = 'flex items-center gap-2 w-full px-3 py-2 text-sm bg-slate-200 text-slate-700 rounded hover:bg-slate-300';
    });
    activeButton.className = 'flex items-center gap-2 w-full px-3 py-2 text-sm bg-primary-600 text-white rounded hover:bg-primary-700';
  }

  generateRangeInfo() {
    const info = document.createElement('div');
    info.className = 'mb-6 p-4 bg-slate-50 rounded-lg';
    
    const totalItems = Object.values(this.rangeData.buckets || {}).reduce((sum, bucket) => sum + bucket.items.length, 0);
    
    info.innerHTML = `
      <h4 class="font-small text-slate-700 mb-3">Statistiche Range</h4>
      <div class="text-xs text-slate-600 space-y-2">
        <div class="flex justify-between"><span>Elementi:</span><strong>${totalItems}</strong></div>
        <div class="flex justify-between"><span>Range:</span><strong>${Object.keys(this.rangeData.buckets || {}).length}</strong></div>
        <div class="flex justify-between"><span>Valori unici:</span><strong>${this.rangeData.allValues?.length || 0}</strong></div>
      </div>
    `;
    return info;
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
  // COMPONENTI CONTENUTO
  // ===============================

  generateRangeContent() {
    const wrapper = document.createElement("div");
    wrapper.className = "range-content-wrapper";
    this.renderActiveView(wrapper);
    return wrapper;
  }

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

  filterBySearch(searchTerm) {
    this.currentSearchTerm = searchTerm.toLowerCase();
    this.refreshContent();
  }

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
  // VISUALIZZAZIONE: Lista Range - CON ViewComponents
  // ===============================

  renderRangeList(container) {
    if (!this.rangeData.buckets || Object.keys(this.rangeData.buckets).length === 0) {
      container.appendChild(ViewComponents.createEmptyState('Nessun dato numerico disponibile'));
      return;
    }

    const wrapper = document.createElement("div");
    wrapper.className = "bg-white rounded-lg shadow-sm";

    const bucketArray = Object.entries(this.rangeData.buckets)
      .map(([key, data]) => ({ ...data, key }))
      .sort((a, b) => a.start - b.start);

    bucketArray.forEach((bucket, index) => {
      const accordionItem = ViewComponents.createAccordionItem({
        id: `range-accordion-${index}`,
        title: bucket.key,
        subtitle: null,
        count: bucket.items.length,
        indexKey: this.indexKey,
        filterValue: bucket.key,
        content: this.createRangeDetailsList(bucket),
        onToggle: (id, isOpen) => {
          if (isOpen) {
            this.expandedItems.add(id);
          } else {
            this.expandedItems.delete(id);
          }
        },
        onMapClick: (val) => this.goToMapWithFilter(val),
        isExpanded: this.expandedItems.has(`range-accordion-${index}`)
      });

      wrapper.appendChild(accordionItem);
    });

    container.appendChild(wrapper);
  }

  createRangeDetailsList(bucket) {
    const container = document.createElement("div");
    container.className = "p-4";

    // Raggruppa gli item per valore specifico e location
    const itemsByValueAndLocation = {};
    bucket.items.forEach(item => {
      const value = item[this.indexKey];
      const location = item.Location || 'Senza location';
      
      if (!itemsByValueAndLocation[value]) {
        itemsByValueAndLocation[value] = {};
      }
      
      if (!itemsByValueAndLocation[value][location]) {
        itemsByValueAndLocation[value][location] = [];
      }
      
      itemsByValueAndLocation[value][location].push(item);
    });

    const sortedValues = Object.keys(itemsByValueAndLocation).sort((a, b) => parseFloat(a) - parseFloat(b));

    if (sortedValues.length === 0) {
      container.innerHTML = '<div class="text-sm text-slate-500 italic">Nessun elemento disponibile</div>';
      return container;
    }

    // Crea tabella
    const table = document.createElement("div");
    table.className = "space-y-2";

    const headerRow = document.createElement("div");
    headerRow.className = "flex items-center font-medium text-sm text-slate-700 pb-2 border-b border-slate-200";
    headerRow.innerHTML = `
      <div class="w-24 flex-shrink-0">Valore</div>
      <div class="flex-1 min-w-0">Location</div>
      <div class="w-12 flex-shrink-0 text-center">Qty</div>
      <div class="w-16 flex-shrink-0 text-center">Azioni</div>
    `;
    table.appendChild(headerRow);

    // Per ogni valore, crea una riga per ogni location
    sortedValues.forEach((value, valueIndex) => {
      const locationGroups = itemsByValueAndLocation[value];
      const sortedLocations = Object.keys(locationGroups).sort();
      
      sortedLocations.forEach((location, locationIndex) => {
        const items = locationGroups[location];
        
        const row = document.createElement("div");
        row.className = "flex items-center text-sm py-2 hover:bg-white rounded px-2";

        // Valore (mostra solo nella prima riga di ogni valore)
        const valueCell = document.createElement("div");
        valueCell.className = "w-24 flex-shrink-0 font-medium text-primary-700";
        if (locationIndex === 0) {
          valueCell.textContent = value;
        } else {
          valueCell.innerHTML = '<span class="text-slate-300">│</span>';
        }

        // Location
        const locationCell = document.createElement("div");
        locationCell.className = "flex-1 min-w-0 text-slate-600 truncate";
        locationCell.textContent = location;
        locationCell.title = location; // Tooltip per location lunghe

        // Quantity badge
        const qtyCell = document.createElement("div");
        qtyCell.className = "w-12 flex-shrink-0 text-center";
        qtyCell.appendChild(ViewComponents.createCountBadge(items.length, 'text-xs px-2 py-0.5'));

        // Bottone azione
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
        viewButton.title = `Visualizza sulla mappa: ${location} con valore ${value}`;
        
        actionCell.appendChild(viewButton);

        row.appendChild(valueCell);
        row.appendChild(locationCell);
        row.appendChild(qtyCell);
        row.appendChild(actionCell);

        table.appendChild(row);
      });
    });

    container.appendChild(table);
    return container;
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
  // INTERFACCIA PRINCIPALE
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
}