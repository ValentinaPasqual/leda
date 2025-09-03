// views/RangeView.js
import * as d3 from "d3";

export class RangeView {
  constructor(data, indexKey) {
    this.data = data;
    this.indexKey = indexKey;
    this.hierarchyData = buildHierarchy(data, indexKey);
    this.container = null;
  }

  createViewButton(label, onClick) {
    const btn = document.createElement('button');
    btn.className = 'px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700';
    btn.textContent = label;
    btn.onclick = onClick;
    return btn;
  }

  createControls() {
    const controls = document.createElement('div');
    controls.className = 'flex space-x-4 mb-6';

    const visualizations = [
      { label: "Lista annidata", method: () => this.renderNestedList() },
      { label: "Treemap", method: () => this.renderTreemap() },
      { label: "Sunburst", method: () => this.renderSunburst() }
    ];

    visualizations.forEach(({ label, method }) => {
      const btn = this.createViewButton(label, method);
      controls.appendChild(btn);
    });

    return controls;
  }

  // ===============================
  // VISUALIZZAZIONE: Lista Annidata
  // ===============================
  renderNestedList() {
    // Rimuovi visualizzazione precedente
    const oldViz = document.getElementById("viz");
    if (oldViz) oldViz.remove();

    const wrapper = document.createElement("div");
    wrapper.id = "viz";

    const buildList = (obj) => {
      const ul = document.createElement("ul");
      ul.className = "list-disc ml-6";

      Object.entries(obj).forEach(([key, value]) => {
        if (key === "_items") return;

        const li = document.createElement("li");

        // Conteggio ricorsivo
        const countItems = (node) => {
          let val = Array.isArray(node._items) ? node._items.length : 0;
          Object.entries(node).forEach(([k, v]) => {
            if (k !== "_items") val += countItems(v);
          });
          return val;
        };

        const count = countItems(value);
        li.textContent = `${key} (${count})`;

        const childUl = buildList(value);
        if (childUl.childElementCount > 0) li.appendChild(childUl);

        ul.appendChild(li);
      });

      return ul;
    };

    wrapper.appendChild(buildList(this.hierarchyData));
    this.container.appendChild(wrapper);
  }

  // ===============================
  // VISUALIZZAZIONE: Treemap
  // ===============================
  renderTreemap() {
    const oldViz = document.getElementById("viz");
    if (oldViz) oldViz.remove();

    const wrapper = document.createElement("div");
    wrapper.id = "viz";
    this.container.appendChild(wrapper);

    const width = 800;
    const height = 500;

    // Crea root gerarchico D3
    const root = d3.hierarchy(convertHierarchyToD3Format(this.hierarchyData))
      .sum(d => d.value)
      .sort((a, b) => b.value - a.value);

    // Applica layout Treemap
    d3.treemap()
      .size([width, height])
      .paddingInner(3)
      .paddingOuter(5)(root);

    const svg = d3.select(wrapper).append("svg")
      .attr("width", width)
      .attr("height", height);

    const nodes = svg.selectAll("g")
      .data(root.descendants().filter(d => d.value > 0))
      .enter()
      .append("g")
      .attr("transform", d => `translate(${d.x0},${d.y0})`);

    // Rettangoli
    nodes.append("rect")
      .attr("width", d => d.x1 - d.x0)
      .attr("height", d => d.y1 - d.y0)
      .attr("fill", d => d3.interpolateBlues(d.depth / (root.height + 1)))
      .attr("stroke", "#fff");

    // Etichette
    nodes.append("text")
      .attr("x", 4)
      .attr("y", 14)
      .text(d => {
        const rectWidth = d.x1 - d.x0;
        const rectHeight = d.y1 - d.y0;
        return rectWidth > 30 && rectHeight > 20 ? d.data.name : "";
      })
      .attr("fill", "white")
      .attr("font-size", "12px");

    // Tooltip
    const tooltip = d3.select(wrapper)
      .append("div")
      .style("position", "absolute")
      .style("padding", "4px 8px")
      .style("background", "rgba(0,0,0,0.7)")
      .style("color", "#fff")
      .style("border-radius", "4px")
      .style("pointer-events", "none")
      .style("opacity", 0);

    nodes.on("mouseover", (event, d) => {
      tooltip.transition().duration(200).style("opacity", 1);
      tooltip.html(`${d.data.name}: ${d.value}`)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY + 10) + "px");
      d3.select(event.currentTarget).select("rect").attr("opacity", 0.6);
    })
    .on("mousemove", (event) => {
      tooltip.style("left", (event.pageX + 10) + "px")
             .style("top", (event.pageY + 10) + "px");
    })
    .on("mouseout", (event) => {
      tooltip.transition().duration(200).style("opacity", 0);
      d3.select(event.currentTarget).select("rect").attr("opacity", 1);
    });
  }

  // ===============================
  // VISUALIZZAZIONE: Sunburst
  // ===============================
  renderSunburst() {
    const oldViz = document.getElementById("viz");
    if (oldViz) oldViz.remove();
    
    const wrapper = document.createElement("div");
    wrapper.id = "viz";
    this.container.appendChild(wrapper);

    const width = 500, radius = width / 2;

    const root = d3.partition()
      .size([2 * Math.PI, radius])
      (d3.hierarchy(this.convertHierarchyToD3Format(this.hierarchyData)).sum(d => d.value));

    const arc = d3.arc()
      .startAngle(d => d.x0)
      .endAngle(d => d.x1)
      .innerRadius(d => d.y0)
      .outerRadius(d => d.y1);

    const svg = d3.select(wrapper).append("svg")
      .attr("width", width)
      .attr("height", width)
      .append("g")
      .attr("transform", `translate(${radius},${radius})`);

    // Tooltip
    const tooltip = d3.select(wrapper)
      .append("div")
      .style("position", "absolute")
      .style("padding", "4px 8px")
      .style("background", "rgba(0,0,0,0.7)")
      .style("color", "#fff")
      .style("border-radius", "4px")
      .style("pointer-events", "none")
      .style("opacity", 0);

    svg.selectAll("path")
      .data(root.descendants().filter(d => d.depth))
      .enter()
      .append("path")
      .attr("d", arc)
      .attr("fill", (d, i) => d3.schemeCategory10[i % 10])
      .on("mouseover", function(event, d) {
        tooltip.transition().duration(200).style("opacity", 1);
        tooltip.html(`${d.data.name}: ${d.value}`)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY + 10) + "px");
        d3.select(this).attr("opacity", 0.6);
      })
      .on("mousemove", function(event) {
        tooltip.style("left", (event.pageX + 10) + "px")
               .style("top", (event.pageY + 10) + "px");
      })
      .on("mouseout", function() {
        tooltip.transition().duration(200).style("opacity", 0);
        d3.select(this).attr("opacity", 1);
      });
  }

  render(container) {
    this.container = container;
    
    // Crea i controlli per cambiare visualizzazione
    const controls = this.createControls();
    container.appendChild(controls);

    // Visualizzazione di default - Lista annidata
    this.renderNestedList();
  }
}