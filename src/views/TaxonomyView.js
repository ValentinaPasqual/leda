// views/TaxonomyView.js
import * as d3 from "d3";

export class TaxonomyView {
  constructor(data, indexKey) {
    this.data = data;
    this.indexKey = indexKey;
    this.hierarchyData = this.buildHierarchy(data, indexKey);
    this.container = null;
    this.activeTab = 'nested-list';
  }

  // ===============================
  // FUNZIONI PER ELABORAZIONE DATI
  // ===============================
  buildHierarchy(data, indexKey) {
    const root = {};

    data.forEach(item => {
      // Split su ',' e su '>' per tassonomie annidate
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

  convertHierarchyToD3Format(obj, name = "root") {
    let children = [];
    let value = 0;

    for (const [key, val] of Object.entries(obj)) {
      if (key === "_items") continue;

      const child = this.convertHierarchyToD3Format(val, key);
      children.push(child);
      value += child.value;
    }

    // Aggiungi il conteggio locale se ci sono _items
    if (Array.isArray(obj._items)) {
      value += obj._items.length;
    }

    // Se non ci sono figli e non ci sono _items, è una foglia di valore 0
    if (children.length === 0 && !Array.isArray(obj._items)) {
      return { name, children: [], value: 0 };
    }

    return { name, children, value };
  }

  // ===============================
  // CONTROLLI UI - TABS ELEGANTI
  // ===============================
  createTabs() {
    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'border-b border-gray-200 mb-8';

    const tabsList = document.createElement('nav');
    tabsList.className = 'flex space-x-8';

    const tabs = [
      { id: 'nested-list', label: 'Lista Annidata', icon: '📋' },
      { id: 'treemap', label: 'Treemap', icon: '🔲' },
      { id: 'sunburst', label: 'Sunburst', icon: '☀️' }
    ];

    tabs.forEach(tab => {
      const tabButton = document.createElement('button');
      tabButton.className = this.getTabClasses(tab.id);
      tabButton.innerHTML = `
        <span class="mr-2">${tab.icon}</span>
        ${tab.label}
      `;
      
      tabButton.onclick = () => this.switchTab(tab.id);
      tabsList.appendChild(tabButton);
    });

    tabsContainer.appendChild(tabsList);
    return tabsContainer;
  }

  getTabClasses(tabId) {
    const baseClasses = 'inline-flex items-center px-4 py-3 border-b-2 font-medium text-sm transition-colors';
    
    if (this.activeTab === tabId) {
      return `${baseClasses} border-blue-600 text-blue-600 bg-blue-50`;
    } else {
      return `${baseClasses} border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300`;
    }
  }

  switchTab(tabId) {
    this.activeTab = tabId;
    
    // Aggiorna le classi dei tab
    const tabs = this.container.querySelectorAll('nav button');
    tabs.forEach((tab, index) => {
      const tabIds = ['nested-list', 'treemap', 'sunburst'];
      tab.className = this.getTabClasses(tabIds[index]);
    });

    // Renderizza la visualizzazione appropriata
    switch(tabId) {
      case 'nested-list':
        this.renderNestedList();
        break;
      case 'treemap':
        this.renderTreemap();
        break;
      case 'sunburst':
        this.renderSunburst();
        break;
    }
  }

  // ===============================
  // NAVIGAZIONE ALLA MAPPA CON FILTRI
  // ===============================
  goToMapWithFilter(taxonomyValue) {
    // Simula il comportamento di handleStateChange per attivare il filtro
    const filterAction = {
      type: "FACET_CHANGE",
      facetType: this.indexKey, // Es: "Tipologia dello Spazio"
      value: taxonomyValue,     // Es: "Aperto > Naturale"
      checked: true
    };

    console.log('handleStateChange called with action:', filterAction);
    console.log(`Updating filter: ${this.indexKey}, value: ${taxonomyValue}, checked: true`);

    // Se esiste una funzione globale handleStateChange, chiamala
    if (typeof window.handleStateChange === 'function') {
      window.handleStateChange(filterAction);
    }

    // Naviga alla mappa con parametri URL
    const params = new URLSearchParams();
    params.set('filter', this.indexKey);
    params.set('value', taxonomyValue);
    
    // Cambia la pagina corrente alla mappa
    const mapUrl = `#map?${params.toString()}`;
    
    // Se esiste un router/sistema di navigazione, usalo
    if (typeof window.navigateToMap === 'function') {
      window.navigateToMap(filterAction);
    } else {
      // Fallback: cambia l'hash dell'URL
      window.location.hash = mapUrl;
    }
  }

  // ===============================
  // VISUALIZZAZIONE: Lista Annidata Elegante
  // ===============================
  renderNestedList() {
    const oldViz = document.getElementById("viz");
    if (oldViz) oldViz.remove();

    const wrapper = document.createElement("div");
    wrapper.id = "viz";
    wrapper.className = "bg-white rounded-lg border border-gray-200 p-6 shadow-sm";

    const buildList = (obj, level = 0, parentPath = '') => {
      const container = document.createElement("div");
      
      Object.entries(obj).forEach(([key, value]) => {
        if (key === "_items") return;

        const itemContainer = document.createElement("div");
        itemContainer.className = `mb-3 ${level > 0 ? 'ml-6' : ''}`;

        // Costruisci il path completo per questo elemento
        const currentPath = parentPath ? `${parentPath} > ${key}` : key;

        // Conteggio ricorsivo
        const countItems = (node) => {
          let val = Array.isArray(node._items) ? node._items.length : 0;
          Object.entries(node).forEach(([k, v]) => {
            if (k !== "_items") val += countItems(v);
          });
          return val;
        };

        const count = countItems(value);
        
        // Header dell'elemento
        const header = document.createElement("div");
        header.className = `flex items-center justify-between p-3 rounded-lg ${this.getListItemClasses(level)}`;
        
        const titleContainer = document.createElement("div");
        titleContainer.className = "flex items-center space-x-3";
        
        // Icona basata sul livello
        const icon = document.createElement("span");
        icon.className = "flex-shrink-0 text-lg";
        icon.textContent = this.getIconForLevel(level);
        
        const title = document.createElement("span");
        title.className = `font-medium ${this.getTitleSizeForLevel(level)}`;
        title.textContent = key;
        
        const rightContainer = document.createElement("div");
        rightContainer.className = "flex items-center space-x-2";
        
        const badge = document.createElement("span");
        badge.className = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800";
        badge.textContent = count.toString();

        // Bottone per andare alla mappa (solo se ci sono elementi)
        if (count > 0) {
          const mapButton = document.createElement("button");
          mapButton.className = "inline-flex items-center px-2 py-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded transition-colors";
          mapButton.innerHTML = "🗺️ Mappa";
          mapButton.onclick = (e) => {
            e.stopPropagation();
            this.goToMapWithFilter(currentPath);
          };
          rightContainer.appendChild(mapButton);
        }

        rightContainer.appendChild(badge);

        titleContainer.appendChild(icon);
        titleContainer.appendChild(title);
        header.appendChild(titleContainer);
        header.appendChild(rightContainer);

        itemContainer.appendChild(header);

        // Contenuti figli
        const childContainer = buildList(value, level + 1, currentPath);
        if (childContainer.children.length > 0) {
          const childWrapper = document.createElement("div");
          childWrapper.className = "mt-3 border-l-2 border-gray-100 pl-4";
          childWrapper.appendChild(childContainer);
          itemContainer.appendChild(childWrapper);
        }

        container.appendChild(itemContainer);
      });

      return container;
    };

    wrapper.appendChild(buildList(this.hierarchyData));
    this.container.appendChild(wrapper);
  }

  getListItemClasses(level) {
    const baseClasses = "border transition-colors";
    switch(level) {
      case 0: return `${baseClasses} bg-blue-50 border-blue-200 hover:bg-blue-100`;
      case 1: return `${baseClasses} bg-purple-50 border-purple-200 hover:bg-purple-100`;
      case 2: return `${baseClasses} bg-green-50 border-green-200 hover:bg-green-100`;
      default: return `${baseClasses} bg-gray-50 border-gray-200 hover:bg-gray-100`;
    }
  }

  getIconForLevel(level) {
    const icons = ['📁', '📂', '📄', '📋', '🔖'];
    return icons[level] || '•';
  }

  getTitleSizeForLevel(level) {
    switch(level) {
      case 0: return 'text-lg text-blue-900';
      case 1: return 'text-base text-purple-900';
      case 2: return 'text-sm text-green-900';
      default: return 'text-sm text-gray-900';
    }
  }

  // ===============================
  // VISUALIZZAZIONE: Treemap Elegante
  // ===============================
  renderTreemap() {
    const oldViz = document.getElementById("viz");
    if (oldViz) oldViz.remove();

    const wrapper = document.createElement("div");
    wrapper.id = "viz";
    wrapper.className = "bg-white rounded-lg border border-gray-200 p-6 shadow-sm";
    this.container.appendChild(wrapper);

    const width = 800;
    const height = 500;

    // Crea root gerarchico D3
    const root = d3.hierarchy(this.convertHierarchyToD3Format(this.hierarchyData))
      .sum(d => d.value)
      .sort((a, b) => b.value - a.value);

    // Applica layout Treemap
    d3.treemap()
      .size([width, height])
      .paddingInner(2)
      .paddingOuter(4)(root);

    const svg = d3.select(wrapper).append("svg")
      .attr("width", width)
      .attr("height", height)
      .style("border-radius", "8px");

    // Scala colori elegante
    const colorScale = d3.scaleOrdinal()
      .domain([0, 1, 2, 3, 4])
      .range(['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444']);

    const nodes = svg.selectAll("g")
      .data(root.descendants().filter(d => d.value > 0))
      .enter()
      .append("g")
      .attr("transform", d => `translate(${d.x0},${d.y0})`);

    // Rettangoli con gradient
    nodes.append("rect")
      .attr("width", d => d.x1 - d.x0)
      .attr("height", d => d.y1 - d.y0)
      .attr("fill", d => colorScale(d.depth))
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 1)
      .attr("rx", 4)
      .attr("ry", 4);

    // Etichette eleganti
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

    // Tooltip elegante
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
  }

  // ===============================
  // VISUALIZZAZIONE: Sunburst Elegante
  // ===============================
  renderSunburst() {
    const oldViz = document.getElementById("viz");
    if (oldViz) oldViz.remove();
    
    const wrapper = document.createElement("div");
    wrapper.id = "viz";
    wrapper.className = "bg-white rounded-lg border border-gray-200 p-6 shadow-sm flex justify-center";
    this.container.appendChild(wrapper);

    const width = 500, radius = width / 2;

    const root = d3.partition()
      .size([2 * Math.PI, radius - 20])
      (d3.hierarchy(this.convertHierarchyToD3Format(this.hierarchyData)).sum(d => d.value));

    const arc = d3.arc()
      .startAngle(d => d.x0)
      .endAngle(d => d.x1)
      .innerRadius(d => Math.max(0, d.y0))
      .outerRadius(d => d.y1);

    const svg = d3.select(wrapper).append("svg")
      .attr("width", width)
      .attr("height", width)
      .append("g")
      .attr("transform", `translate(${radius},${radius})`);

    // Scala colori più sofisticata
    const colorScale = d3.scaleOrdinal()
      .range(['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#14B8A6', '#F97316']);

    // Tooltip elegante
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
      .data(root.descendants().filter(d => d.depth))
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

    // Etichette radiali per elementi più grandi
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
  }

  render(container) {
    this.container = container;
    
    // Aggiungi contenitore principale con stile
    const mainContainer = document.createElement('div');
    mainContainer.className = 'space-y-6';
    
    // Crea i tab
    const tabs = this.createTabs();
    mainContainer.appendChild(tabs);

    // Aggiungi il contenitore principale al container
    container.appendChild(mainContainer);

    // Visualizzazione di default - Lista annidata
    this.renderNestedList();
  }
}