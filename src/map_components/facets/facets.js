export class FacetsRenderer {
  constructor(config) {
    this.config = config;
  }

  renderFacets(aggregations) {
    if (!aggregations || !this.config.aggregations) {
      console.error('No aggregations data or configuration available.');
      return;
    }

    const facetsContainer = document.getElementById('facets-container');
    if (!facetsContainer) {
      console.error('Facets container not found');
      return;
    }

    const checkedState = this.getCheckedState();
    facetsContainer.innerHTML = '';

    Object.entries(this.config.aggregations).forEach(([facetKey, facetConfig]) => {
      const facetGroup = this.createFacetGroup(facetKey, facetConfig);
      facetsContainer.appendChild(facetGroup);
      
      if (facetConfig.type === 'range') {
        this.renderRangeFacet(facetKey, facetConfig, aggregations);
      } else {
        this.renderListFacet(facetKey, facetConfig, aggregations);
      }
    });

    this.restoreCheckedState(checkedState);
  }

  getCheckedState() {
    const checkedState = {};
    Object.keys(this.config.aggregations).forEach(facetKey => {
      const facetElement = document.getElementById(`${facetKey}-facet`);
      if (facetElement) {
        checkedState[facetKey] = Array.from(facetElement.querySelectorAll('input:checked')).map(input => input.value);
      }
    });
    return checkedState;
  }

  restoreCheckedState(checkedState) {
    Object.entries(checkedState).forEach(([facetKey, values]) => {
      const facetElement = document.getElementById(`${facetKey}-facet`);
      if (facetElement) {
        values.forEach(value => {
          const checkbox = facetElement.querySelector(`input[value="${value}"]`);
          if (checkbox) checkbox.checked = true;
        });
      }
    });
  }

  createFacetGroup(facetKey, facetConfig) {
    const facetGroup = document.createElement('div');
    facetGroup.className = 'facet-group mb-4 p-4 bg-white rounded-lg shadow';
    facetGroup.id = `${facetKey}-facet`;

    const title = document.createElement('h3');
    title.className = 'text-lg font-semibold mb-2';
    title.textContent = facetConfig.title || facetKey;
    facetGroup.appendChild(title);

    return facetGroup;
  }

  async renderFacetSlider(facetKey, facetConfig, aggregations, checkedState) {
    const sliderContainer = document.createElement('div');
    sliderContainer.className = 'slider-container';
    sliderContainer.innerHTML = `
      <div class="facet-slider">
        <div class="facet-slider-header">
          <h4>${facetConfig.label}</h4>
        </div>
        <div class="facet-slider-body">
          <div class="slider" id="${facetKey}-slider"></div>
          <div class="inputs">
            <input type="number" id="${facetKey}-min-input"
                   class="py-2 px-3 block w-full border rounded-md text-sm focus:ring focus:ring-primary-500 focus:outline-none dark:bg-gray-800 dark:text-gray-300"
                   value="0">
            <input type="number" id="${facetKey}-max-input"
                   class="py-2 px-3 block w-full border rounded-md text-sm focus:ring focus:ring-primary-500 focus:outline-none dark:bg-gray-800 dark:text-gray-300"
                   value="100">
          </div>
        </div>
      </div>
    `;

    const facetGroup = document.getElementById(`${facetKey}-facet`);
    if (!facetGroup) {
      console.error(`Facet group for ${facetKey} not found`);
      return;
    }

    facetGroup.appendChild(sliderContainer);

    // Access elements using querySelector within sliderContainer
    const chartElement = sliderContainer.querySelector(`#${facetKey}-chart`);
    const slider = sliderContainer.querySelector(`#${facetKey}-slider`);
    const minInput = sliderContainer.querySelector(`#${facetKey}-min-input`);
    const maxInput = sliderContainer.querySelector(`#${facetKey}-max-input`);
    
    // Get current filter values or use min/max values
    const currentFilter = this.state.filters[facetKey];
    let startValue, endValue;

    if (!currentFilter || currentFilter.length === 0) {
        startValue = minValue;
        endValue = maxValue;
    } else {
        startValue = currentFilter[0];
        endValue = currentFilter[1];
    }

    // Initialize noUiSlider
    noUiSlider.create(slider, {
        start: [startValue, endValue],
        connect: true,
        step: 1, // Integer steps
        range: {
            'min': minValue,
            'max': maxValue
        },
        format: {
            to: (value) => Math.round(value),
            from: (value) => parseInt(value, 10)
        }
    });

    // Update inputs when slider changes
    slider.noUiSlider.on('update', (values) => {
        minInput.value = Math.round(Number(values[0]));
        maxInput.value = Math.round(Number(values[1]));
    });

    // Handle slider changes
    slider.noUiSlider.on('change', (values) => {
        const [start, end] = values.map(val => Math.round(Number(val)));

        if (!isNaN(start) && !isNaN(end)) {
            this.state.filters[facetKey] = [start, end];
            this.performSearch();
            this.fetchAggregations();
            
            // Update the highlighted range in the chart
            this.updateChartHighlight(chartElement, buckets, start, end);
        }
    });

    // Handle input changes
    const handleInputChange = this.debounce((evt) => {
        const isMin = evt.target === minInput;
        const inputValue = parseInt(evt.target.value, 10);
        const [currentMin, currentMax] = slider.noUiSlider.get().map(Number);

        if (!isNaN(inputValue)) {
            slider.noUiSlider.set([
                isMin ? inputValue : currentMin,
                isMin ? currentMax : inputValue
            ]);
        }
    }, 200);

    minInput.addEventListener('input', handleInputChange);
    maxInput.addEventListener('input', handleInputChange);

    // Initial chart highlight based on current range
    this.updateChartHighlight(chartElement, buckets, startValue, endValue);
  }

  renderRangeFacet(facetKey, facetConfig, aggregations) {
    const valueBuckets = aggregations[facetKey] || [];
    const buckets = valueBuckets
      .map(bucket => {
        const value = parseInt(bucket.key, 10);
        return isNaN(value) ? null : {
          value: value,
          count: bucket.doc_count || 0
        };
      })
      .filter(bucket => bucket !== null);

    const values = buckets.map(bucket => bucket.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    // Create the chart and slider structure
    const sliderContainer = document.createElement('div');
    sliderContainer.className = 'facet-slider my-4';
    sliderContainer.innerHTML = `
      <label class="sr-only">Value range</label>
      <div id="${facetKey}-chart" class="w-full h-24 mb-2"></div>
      <div id="${facetKey}-slider" class="mt-2"></div>
      <div class="mt-5">
        <div class="text-sm font-medium mb-2">Custom range:</div>
        <div class="flex space-x-4">
          <div class="flex-1">
            <input id="${facetKey}-min-input" type="number"
                   class="py-2 px-3 block w-full border rounded-md text-sm focus:ring focus:ring-primary-500 focus:outline-none dark:bg-gray-800 dark:text-gray-300"
                   value="${minValue}">
          </div>
          <div class="flex-1">
            <input id="${facetKey}-max-input" type="number"
                   class="py-2 px-3 block w-full border rounded-md text-sm focus:ring focus:ring-primary-500 focus:outline-none dark:bg-gray-800 dark:text-gray-300"
                   value="${maxValue}">
          </div>
        </div>
      </div>
    `;

    document.getElementById(`${facetKey}-facet`).appendChild(sliderContainer);

    // Access elements using querySelector within sliderContainer
    const chartElement = sliderContainer.querySelector(`#${facetKey}-chart`);
    const slider = sliderContainer.querySelector(`#${facetKey}-slider`);
    const minInput = sliderContainer.querySelector(`#${facetKey}-min-input`);
    const maxInput = sliderContainer.querySelector(`#${facetKey}-max-input`);
    
    // Render the bar chart
    this.renderBarChart(chartElement, buckets, minValue, maxValue);

    // Get current filter values or use min/max values
    const currentFilter = this.state.filters[facetKey];
    let startValue, endValue;

    if (!currentFilter || currentFilter.length === 0) {
        startValue = minValue;
        endValue = maxValue;
    } else {
        startValue = currentFilter[0];
        endValue = currentFilter[1];
    }

    // Initialize noUiSlider
    noUiSlider.create(slider, {
        start: [startValue, endValue],
        connect: true,
        step: 1, // Integer steps
        range: {
            'min': minValue,
            'max': maxValue
        },
        format: {
            to: (value) => Math.round(value),
            from: (value) => parseInt(value, 10)
        }
    });

    // Update inputs when slider changes
    slider.noUiSlider.on('update', (values) => {
        minInput.value = Math.round(Number(values[0]));
        maxInput.value = Math.round(Number(values[1]));
    });

    // Handle slider changes
    slider.noUiSlider.on('change', (values) => {
        const [start, end] = values.map(val => Math.round(Number(val)));

        if (!isNaN(start) && !isNaN(end)) {
            this.state.filters[facetKey] = [start, end];
            this.performSearch();
            this.fetchAggregations();
            
            // Update the highlighted range in the chart
            this.updateChartHighlight(chartElement, buckets, start, end);
        }
    });

    // Handle input changes
    const handleInputChange = this.debounce((evt) => {
        const isMin = evt.target === minInput;
        const inputValue = parseInt(evt.target.value, 10);
        const [currentMin, currentMax] = slider.noUiSlider.get().map(Number);

        if (!isNaN(inputValue)) {
            slider.noUiSlider.set([
                isMin ? inputValue : currentMin,
                isMin ? currentMax : inputValue
            ]);
        }
    }, 200);

    minInput.addEventListener('input', handleInputChange);
    maxInput.addEventListener('input', handleInputChange);

    // Initial chart highlight based on current range
    this.updateChartHighlight(chartElement, buckets, startValue, endValue);
  }

  renderBarChart(chartElement, buckets, minValue, maxValue) {
    const chart = new Chart(chartElement, {
      type: 'bar',
      data: {
        labels: buckets.map(b => b.value),
        datasets: [{
          label: 'Count',
          data: buckets.map(b => b.count),
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true
          },
          x: {
            min: minValue,
            max: maxValue
          }
        }
      }
    });

    this.charts[facetKey] = chart;
  }

  updateChartHighlight(chartElement, buckets, startValue, endValue) {
    const chart = this.charts[facetKey];
    if (!chart) return;

    const startIndex = buckets.findIndex(b => b.value >= startValue);
    const endIndex = buckets.findIndex(b => b.value > endValue) - 1;

    chart.data.datasets[0].backgroundColor = buckets.map((b, i) => {
      if (i >= startIndex && i <= endIndex) {
        return 'rgba(75, 192, 192, 0.5)'; // Highlight color
      }
      return 'rgba(54, 162, 235, 0.5)'; // Default color
    });

    chart.update();
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  renderListFacet(facetKey, facetConfig, aggregations) {
    const buckets = aggregations[facetKey] || [];
    const listContainer = document.createElement('div');
    listContainer.className = 'facet-list';

    buckets.forEach(bucket => {
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = bucket.key;
      checkbox.id = `${facetKey}-${bucket.key}`;

      const label = document.createElement('label');
      label.htmlFor = checkbox.id;
      label.textContent = `${bucket.key} (${bucket.doc_count})`;

      const container = document.createElement('div');
      container.className = 'facet-item flex items-center space-x-2';
      container.appendChild(checkbox);
      container.appendChild(label);

      listContainer.appendChild(container);
    });

    document.getElementById(`${facetKey}-facet`).appendChild(listContainer);
  }
}
