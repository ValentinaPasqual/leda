// views/TaxonomyView.js
import * as d3 from "d3";
import { createMapUrlWithFilter } from '../utils/urlHelper.js';

const base = import.meta.env.BASE_URL 

export class TaxonomyView {
  constructor(data, indexKey, indexInfo) {
    this.data = data;
    this.indexKey = indexKey;
    this.indexInfo = indexInfo || {};
    this.hierarchyData = this.buildHierarchy(data, indexKey);
    this.activeTab = 'nested-list';
    this.currentSearchTerm = '';
    this.expandedItems = new Set(); // Inizialmente vuoto, ma tutti i nodi saranno aperti
  }

  // ===============================
  // FUNZIONI PER ELABORAZIONE DATI
  // ===============================
  buildHierarchy(data, indexKey) {
    const root = {};

    data.forEach(item => {
      const rawValues = String(item[indexKey] || "Non specificato").split(',');
      rawValues.forEach(val => {
        const path = val.split('>').map(s => s.trim());
        let current = root;
        
        path.forEach(segment => {
          if (!current[segment]) current[segment] = {};
          current = current[segment];
        });
        
        if (!current._items) current._items = [];
        current._items.push(item);
      });
    });

    return root;
  }

  // ===============================
  // COMPONENTI SIDEBAR
  // ===============================

  generateHeader() {
    const header = document.createElement('div');
    header.className = 'mb-6';
    header.innerHTML = `
      <span class="font-medium border-b-2 border-primary-600 pb-1">${this.indexInfo.category || 'Tassonomia'}</span>
      <h1 class="text-3xl font-bold text-slate-800 my-2">Vista: <span class="text-secondary-700">${this.indexInfo.name || this.indexKey}</span></h1>
    `;
    return header;
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
      { id: 'nested-list', label: 'Lista Annidata', icon: '📋' },
      { id: 'treemap', label: 'Treemap', icon: '🔲' },
      { id: 'sunburst', label: 'Sunburst', icon: '☀️' }
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

  // ===============================
  // COMPONENTI CONTENUTO
  // ===============================

  generateTaxonomyContent() {
    const wrapper = document.createElement("div");
    wrapper.className = "taxonomy-content-wrapper";
    
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

  // ===============================
  // CONTROLLO TABS E RENDERING
  // ===============================

  switchTab(tabId) {
    this.activeTab = tabId;
    this.refreshContent();
  }

  renderActiveView(container) {
    container.innerHTML = '';
    
    switch(this.activeTab) {
      case 'nested-list':
        this.renderNestedList(container);
        break;
      case 'treemap':
        this.renderTreemap(container);
        break;
      case 'sunburst':
        this.renderSunburst(container);
        break;
    }
  }

  refreshContent() {
    const container = document.querySelector('.taxonomy-content-wrapper');
    if (container) {
      this.renderActiveView(container);
    }
  }

  // ===============================
  // RICERCA E FILTRI
  // ===============================

  filterBySearch(searchTerm) {
    this.currentSearchTerm = searchTerm.toLowerCase();
    this.refreshContent();
  }

  shouldShowItem(key, items, currentPath) {
    if (!this.currentSearchTerm) return true;
    
    if (key.toLowerCase().includes(this.currentSearchTerm)) return true;
    
    if (items && items.some(item => 
      (item.Name && item.Name.toLowerCase().includes(this.currentSearchTerm)) ||
      (item.Location && item.Location.toLowerCase().includes(this.currentSearchTerm))
    )) return true;
    
    if (currentPath.toLowerCase().includes(this.currentSearchTerm)) return true;
    
    return false;
  }

  // ===============================
  // NAVIGAZIONE ALLA MAPPA
  // ===============================

  goToMapWithFilter(taxonomyValue) {
    const filterAction = {
      type: "FACET_CHANGE",
      facetType: this.indexKey,
      value: taxonomyValue,
      checked: true
    };

    if (typeof window.handleStateChange === 'function') {
      window.handleStateChange(filterAction);
    }

    const mapUrl = createMapUrlWithFilter(this.indexKey, taxonomyValue);
    
    if (typeof window.navigateToMap === 'function') {
      window.navigateToMap(filterAction);
    } else {
      window.location = mapUrl;
    }
  }

  // ===============================
  // VISUALIZZAZIONE: Lista Annidata Sempre Espansa
  // ===============================

  renderNestedList(container) {
    const buildList = (obj, level = 0, parentPath = '') => {
      const listContainer = document.createElement("div");
      
      Object.entries(obj).forEach(([key, value]) => {
        if (key === "_items") return;

        const currentPath = parentPath ? `${parentPath} > ${key}` : key;
        const items = value._items || [];
        
        if (!this.shouldShowItem(key, items, currentPath)) return;

        const itemContainer = document.createElement("div");
        itemContainer.className = "overflow-hidden";

        // Conteggio ricorsivo
        const countItems = (node) => {
          let val = Array.isArray(node._items) ? node._items.length : 0;
          Object.entries(node).forEach(([k, v]) => {
            if (k !== "_items") val += countItems(v);
          });
          return val;
        };

        const count = countItems(value);
        const hasChildren = Object.keys(value).some(k => k !== "_items");
        const itemId = `item-${level}-${key.replace(/\s+/g, '-')}`;
        
        // Header dell'elemento
        const header = document.createElement("div");
        header.className = `flex items-center justify-between pl-4 py-3 ${this.getListItemClasses(level)} ${hasChildren ? 'cursor-pointer hover:bg-opacity-80' : ''}`;
        
        if (hasChildren) {
          header.onclick = () => this.toggleAccordion(itemId);
        }

        const left = document.createElement("div");
        left.className = "flex items-center space-x-3";
        
        const title = document.createElement("span");
        title.className = `font-medium ${this.getTitleSizeForLevel(level)}`;
        title.textContent = key;
        
        left.appendChild(title);
        
        const right = document.createElement("div");
        right.className = "flex items-center space-x-2";
        
        const badge = document.createElement("span");
        badge.className = "text-xs text-secondary-500 bg-secondary-100 px-2 py-0.5 rounded-full";
        badge.textContent = count.toString();

        right.appendChild(badge);

        // Chevron per espansione (sempre ruotato se ha figli, dato che tutto è espanso)
        if (hasChildren) {
          const chevron = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          chevron.setAttribute('class', 'w-4 h-4 text-slate-400 transform transition-transform rotate-180');
          chevron.setAttribute('fill', 'none');
          chevron.setAttribute('stroke', 'currentColor');
          chevron.setAttribute('viewBox', '0 0 24 24');
          chevron.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>';
          right.appendChild(chevron);
        }

        // Bottone per andare alla mappa
        if (count > 0) {
          const mapButton = document.createElement("a");
          mapButton.href = createMapUrlWithFilter(this.indexKey, currentPath);
          mapButton.className = "p-1 text-secondary-600 hover:text-secondary-700";
          mapButton.onclick = (e) => {
            e.stopPropagation();
          };
          mapButton.innerHTML = `
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
            </svg>
          `;
          right.appendChild(mapButton);
        }
        
        header.appendChild(left);
        header.appendChild(right);
        itemContainer.appendChild(header);

        // Contenuti figli - SEMPRE VISIBILI
        if (hasChildren) {
          const content = document.createElement("div");
          content.id = itemId;
          content.className = "ml-6"; // Rimossa la classe 'hidden'

          const childContainer = buildList(value, level + 1, currentPath);
          if (childContainer.children.length > 0) {
            content.appendChild(childContainer);
          }
          itemContainer.appendChild(content);
        }

        listContainer.appendChild(itemContainer);
      });

      return listContainer;
    };

    const wrapper = document.createElement("div");
    wrapper.className = "bg-white rounded-lg shadow-sm";

    const listContent = buildList(this.hierarchyData);
    if (listContent.children.length === 0) {
      wrapper.innerHTML = `
        <div class="text-center py-8 text-slate-500 p-6">
          <p>Nessun risultato trovato</p>
        </div>
      `;
    } else {
      wrapper.appendChild(listContent);
    }

    container.appendChild(wrapper);
  }

  toggleAccordion(itemId) {
    const content = document.getElementById(itemId);
    const chevron = content?.previousElementSibling?.querySelector('svg:last-child');
    
    if (!content || !chevron) return;
    
    const isHidden = content.classList.contains('hidden');
    
    content.classList.toggle('hidden');
    
    // Corregge la rotazione del chevron
    if (isHidden) {
      chevron.classList.add('rotate-180');
    } else {
      chevron.classList.remove('rotate-180');
    }
  }

  getListItemClasses(level) {
    const levelClasses = {
      0: 'bg-primary-50 border-l-4 border-primary-500',
      1: 'bg-secondary-50 border-l-4 border-secondary-500',
      2: 'bg-accent-50 border-l-4 border-accent-500',
    };
    return levelClasses[level] || 'bg-slate-50 border-l-4 border-slate-300';
  }

  getTitleSizeForLevel(level) {
    switch(level) {
      case 0: return 'text-lg text-primary-900';
      case 1: return 'text-base text-secondary-900';
      case 2: return 'text-sm text-accent-900';
      default: return 'text-sm text-slate-700';
    }
  }

  // ===============================
  // CONVERSIONE PER D3
  // ===============================

  convertHierarchyToD3Format(obj, name = "root") {
    let children = [];
    
    for (const [key, val] of Object.entries(obj)) {
      if (key === "_items") continue;
      const child = this.convertHierarchyToD3Format(val, key);
      children.push(child);
    }

    let value = 0;
    
    if (Array.isArray(obj._items) && obj._items.length > 0) {
      value = obj._items.length;
    }

    return { name, children, value };
  }

  // ===============================
  // VISUALIZZAZIONE: Treemap 
  // ===============================

  renderTreemap(container) {
    const wrapper = document.createElement("div");
    wrapper.className = "bg-white rounded-lg shadow-sm p-6 flex justify-center";
    
    const width = Math.min(800, container.clientWidth - 48);
    const height = 500;

    const root = d3.hierarchy(this.convertHierarchyToD3Format(this.hierarchyData))
      .sum(d => d.value)
      .sort((a, b) => b.value - a.value);

    d3.treemap()
      .size([width, height])
      .paddingInner(2)
      .paddingOuter(4)(root);

    const svg = d3.select(wrapper).append("svg")
      .attr("width", width)
      .attr("height", height)
      .style("border-radius", "8px");

    const colorScale = d3.scaleOrdinal()
      .domain([0, 1, 2, 3, 4])
      .range(['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444']);

    const nodes = svg.selectAll("g")
      .data(root.descendants().filter(d => d.value > 0))
      .enter()
      .append("g")
      .attr("transform", d => `translate(${d.x0},${d.y0})`);

    nodes.append("rect")
      .attr("width", d => d.x1 - d.x0)
      .attr("height", d => d.y1 - d.y0)
      .attr("fill", d => colorScale(d.depth))
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 1)
      .attr("rx", 4)
      .attr("ry", 4);

    nodes.append("text")
      .attr("x", 6)
      .attr("y", 18)
      .text(d => {
        const rectWidth = d.x1 - d.x0;
        const rectHeight = d.y1 - d.y0;
        if (rectWidth > 50 && rectHeight > 25) {
          return d.data.name.length > 15 ? d.data.name.substring(0, 12) + '...' : d.data.name;
        }
        return "";
      })
      .attr("fill", "white")
      .attr("font-size", "11px")
      .attr("font-weight", "500");

    const tooltip = d3.select(wrapper)
      .append("div")
      .style("position", "absolute")
      .style("padding", "8px 12px")
      .style("background", "rgba(0, 0, 0, 0.85)")
      .style("color", "#fff")
      .style("border-radius", "6px")
      .style("font-size", "12px")
      .style("font-weight", "500")
      .style("pointer-events", "none")
      .style("opacity", 0)
      .style("box-shadow", "0 4px 6px rgba(0, 0, 0, 0.1)");

    nodes.on("mouseover", (event, d) => {
      tooltip.style("opacity", 1);
      tooltip.html(`<div class="font-semibold">${d.data.name}</div><div class="text-xs mt-1">Elementi: ${d.value}</div>`)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY + 10) + "px");
      d3.select(event.currentTarget).select("rect").attr("opacity", 0.8);
    })
    .on("mousemove", (event) => {
      tooltip.style("left", (event.pageX + 10) + "px")
             .style("top", (event.pageY + 10) + "px");
    })
    .on("mouseout", (event) => {
      tooltip.style("opacity", 0);
      d3.select(event.currentTarget).select("rect").attr("opacity", 1);
    });

    container.appendChild(wrapper);
  }

  // ===============================
  // VISUALIZZAZIONE: Sunburst
  // ===============================

  renderSunburst(container) {
    const wrapper = document.createElement("div");
    wrapper.className = "bg-white rounded-lg shadow-sm p-6 flex justify-center";
    
    const width = 500, radius = width / 2;

    const root = d3.partition()
      .size([2 * Math.PI, radius - 20])
      (d3.hierarchy(this.convertHierarchyToD3Format(this.hierarchyData)).sum(d => d.value));

    const maxAngleUsed = d3.max(root.descendants(), d => d.x1);
    const angleScale = (2 * Math.PI) / maxAngleUsed;

    const arc = d3.arc()
      .startAngle(d => d.x0 * angleScale)
      .endAngle(d => d.x1 * angleScale)
      .innerRadius(d => Math.max(0, d.y0))
      .outerRadius(d => d.y1);

    const svg = d3.select(wrapper).append("svg")
      .attr("width", width)
      .attr("height", width)
      .append("g")
      .attr("transform", `translate(${radius},${radius})`);

    const colorScale = d3.scaleOrdinal()
      .range(['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#14B8A6', '#F97316']);

    const tooltip = d3.select(wrapper)
      .append("div")
      .style("position", "absolute")
      .style("padding", "8px 12px")
      .style("background", "rgba(0, 0, 0, 0.85)")
      .style("color", "#fff")
      .style("border-radius", "6px")
      .style("font-size", "12px")
      .style("font-weight", "500")
      .style("pointer-events", "none")
      .style("opacity", 0)
      .style("box-shadow", "0 4px 6px rgba(0, 0, 0, 0.1)");

    svg.selectAll("path")
      .data(root.descendants())
      .enter()
      .append("path")
      .attr("d", arc)
      .attr("fill", (d, i) => colorScale(d.depth + i))
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)
      .style("cursor", "pointer")
      .on("mouseover", function(event, d) {
        tooltip.style("opacity", 1);
        tooltip.html(`<div class="font-semibold">${d.data.name}</div><div class="text-xs mt-1">Elementi: ${d.value}</div>`)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY + 10) + "px");
        d3.select(this).attr("opacity", 0.8);
      })
      .on("mousemove", function(event) {
        tooltip.style("left", (event.pageX + 10) + "px")
               .style("top", (event.pageY + 10) + "px");
      })
      .on("mouseout", function() {
        tooltip.style("opacity", 0);
        d3.select(this).attr("opacity", 1);
      });

    svg.selectAll("text")
      .data(root.descendants().filter(d => d.depth && (d.x1 - d.x0) > 0.2))
      .enter()
      .append("text")
      .attr("transform", d => {
        const angle = (d.x0 + d.x1) / 2;
        const rotate = (angle * 180 / Math.PI - 90);
        const radius = (d.y0 + d.y1) / 2;
        return `rotate(${rotate}) translate(${radius},0) rotate(${rotate > 90 ? 180 : 0})`;
      })
      .attr("dy", "0.35em")
      .attr("text-anchor", d => {
        const angle = (d.x0 + d.x1) / 2;
        const rotate = (angle * 180 / Math.PI - 90);
        return rotate > 90 ? "end" : "start";
      })
      .text(d => d.data.name.length > 8 ? d.data.name.substring(0, 6) + '...' : d.data.name)
      .attr("font-size", "10px")
      .attr("fill", "#374151")
      .attr("font-weight", "500");

    container.appendChild(wrapper);
  }

  // ===============================
  // INTERFACCIA PRINCIPALE
  // ===============================

  generateViewComponents() {
    return {
      sidebar: [
        this.generateHeader(),
        this.generateTabsMenu()
      ],
      content: [
        this.generateTaxonomyContent()
      ]
    };
  }
}