// RangeRenderer.js

import '../styles/tailwind.css'
export class RangeRenderer {
  
  constructor() {
    this.playIntervals = new Map(); // Track play intervals for each facet
    this.playStates = new Map(); // Track play states for each facet
  }

  /**
   * Renders a bar chart showing the distribution of values
   * @param {HTMLElement} element - The container element for the chart
   * @param {Array} buckets - Array of value buckets with counts
   * @param {number} minValue - Minimum value in the range
   * @param {number} maxValue - Maximum value in the range
   */

  _renderRangeFacet(facetGroup, facetKey, facetConfig, aggregations, checkedState, state, onStateChange) {
    const sliderContainer = document.createElement('div');
    sliderContainer.className = 'facet-slider my-3';

    const valueBuckets = aggregations[facetKey] || [];
    // Store the full bucket information for the bar chart
    const buckets = valueBuckets
      .map(bucket => {
        const value = parseInt(bucket.key, 10);
        return isNaN(value) ? null : {
          value: value,
          count: bucket.doc_count || 0
        };
      })
      .filter(bucket => bucket !== null);
    
    // Extract just the values for min/max calculations
    const values = buckets.map(bucket => bucket.value);

    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    // Create the chart and slider structure with improved styling
    sliderContainer.innerHTML = `
      <div class="space-y-3">
        <!-- Play Controls -->
        <div class="flex items-center justify-center gap-2 pb-3 border-b border-gray-200">
          <button id="${facetKey}-play-btn" class="group relative w-8 h-8 bg-gradient-to-r from-primary-400 to-primary-700 text-white text-xs rounded-full transition-colors duration-200 hover:from-primary-600 hover:to-primary-700 shadow-md hover:shadow-lg flex items-center justify-center" type="button">
            <div class="w-0 h-0 border-l-[5px] border-l-white border-y-[3px] border-y-transparent ml-0.5"></div>
            <span class="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">Play</span>
          </button>
          <button id="${facetKey}-pause-btn" class="group relative w-8 h-8 bg-gradient-to-r from-secondary-400 to-secondary-700 text-white text-xs rounded-full transition-colors duration-200 hover:from-secondary-600 hover:to-secondary-700 shadow-md hover:shadow-lg flex items-center justify-center" type="button">
            <div class="flex gap-0.5">
              <div class="w-0.5 h-3 bg-white rounded-sm"></div>
              <div class="w-0.5 h-3 bg-white rounded-sm"></div>
            </div>
            <span class="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">Pause</span>
          </button>
        </div>

        <!-- Chart Container -->
        <div class="relative">
          <div id="${facetKey}-chart" class="w-full h-16 mb-3 bg-gray-50 rounded-md p-2"></div>
        </div>
        
        <!-- Slider Container -->
        <div class="px-1">
          <div id="${facetKey}-slider" class="slider-container"></div>
        </div>
        
        <!-- Value Display -->
        <div class="flex items-center justify-between text-xs text-gray-600 px-1">
          <span id="${facetKey}-current-min" class="font-medium">${minValue}</span>
          <span id="${facetKey}-current-max" class="font-medium">${maxValue}</span>
        </div>
        
        <!-- Custom Range Inputs - Fixed Layout -->
        <div class="mt-4 pt-3 border-t border-gray-100">
          <div class="text-xs font-medium text-gray-700 mb-2">Custom range:</div>
          <div class="grid grid-cols-2 gap-2">
            <div class="min-w-0">
              <input id="${facetKey}-min-input" type="number"
                     class="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-primary-400 focus:border-primary-400 focus:outline-none"
                     value="${minValue}"
                     placeholder="Min">
            </div>
            <div class="min-w-0">
              <input id="${facetKey}-max-input" type="number"
                     class="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-primary-400 focus:border-primary-400 focus:outline-none"
                     value="${maxValue}"
                     placeholder="Max">
            </div>
          </div>
        </div>
      </div>
    `;

    facetGroup.appendChild(sliderContainer);

    // Get elements
    const chartElement = sliderContainer.querySelector(`#${facetKey}-chart`);
    const slider = sliderContainer.querySelector(`#${facetKey}-slider`);
    const minInput = sliderContainer.querySelector(`#${facetKey}-min-input`);
    const maxInput = sliderContainer.querySelector(`#${facetKey}-max-input`);
    const currentMinSpan = sliderContainer.querySelector(`#${facetKey}-current-min`);
    const currentMaxSpan = sliderContainer.querySelector(`#${facetKey}-current-max`);
    const playBtn = sliderContainer.querySelector(`#${facetKey}-play-btn`);
    const pauseBtn = sliderContainer.querySelector(`#${facetKey}-pause-btn`);
    
    // Track if user is actively typing in inputs
    let isUserTyping = false;
    
    // Render the bar chart
    this.renderBarChart(chartElement, buckets, minValue, maxValue);

    // Get current filter values or use min/max values
    const currentFilter = state.filters[facetKey];
    let startValue, endValue;

    if (!currentFilter || currentFilter.length === 0) {
        startValue = minValue;
        endValue = maxValue;
    } else {
        startValue = currentFilter[0];
        endValue = currentFilter[1];
    }

    // Initialize noUiSlider with custom styling
    noUiSlider.create(slider, {
        start: [startValue, endValue],
        connect: true,
        step: 1,
        range: {
            'min': minValue,
            'max': maxValue
        },
        format: {
            to: (value) => Math.round(value),
            from: (value) => parseInt(value, 10)
        }
    });

    // Store reference to the slider for updates
    sliderContainer.slider = slider;
    sliderContainer.minInput = minInput;
    sliderContainer.maxInput = maxInput;
    sliderContainer.currentMinSpan = currentMinSpan;
    sliderContainer.currentMaxSpan = currentMaxSpan;
    sliderContainer.chartElement = chartElement;

    // Add custom CSS classes to the slider
    slider.classList.add('custom-slider');
    
    // Add custom styles for the slider
    const style = document.createElement('style');
    
    if (!document.querySelector('#custom-slider-styles')) {
      style.id = 'custom-slider-styles';
      document.head.appendChild(style);
    }

    // Track which input is being actively edited
    let activeInput = null;

    // Track input focus states
    minInput.addEventListener('focus', () => { activeInput = minInput; });
    maxInput.addEventListener('focus', () => { activeInput = maxInput; });
    minInput.addEventListener('blur', () => { 
      setTimeout(() => { 
        if (activeInput === minInput) activeInput = null; 
      }, 100);
    });
    maxInput.addEventListener('blur', () => { 
      setTimeout(() => { 
        if (activeInput === maxInput) activeInput = null; 
      }, 100);
    });

    // Update displays when slider changes (but not the actively focused input)
    slider.noUiSlider.on('update', (values) => {
        const [min, max] = values.map(val => Math.round(Number(val)));
        
        // Only update input values if they're not currently being edited
        if (activeInput !== minInput) {
          minInput.value = min;
        }
        if (activeInput !== maxInput) {
          maxInput.value = max;
        }
        
        // Always update the display spans
        currentMinSpan.textContent = min.toString();
        currentMaxSpan.textContent = max.toString();
    });

    // Handle slider changes (from dragging handles)
    slider.noUiSlider.on('change', (values) => {
        const [start, end] = values.map(val => Math.round(Number(val)));

        if (!isNaN(start) && !isNaN(end)) {
            // Clear play state when user manually changes slider
            // This ensures animation starts from the new position
            this.playStates.delete(facetKey);
            
            onStateChange({ 
              type: 'RANGE_CHANGE', 
              facetKey, 
              value: [start, end] 
            });
            
            // Update the highlighted range in the chart
            this.updateChartHighlight(chartElement, buckets, start, end);
        }
    });

    // Handle input changes - use 'change' event instead of 'input' to avoid constant updates
    const handleInputChange = (evt) => {
        const isMin = evt.target === minInput;
        const inputValue = parseInt(evt.target.value, 10);
        const [currentMin, currentMax] = slider.noUiSlider.get().map(Number);

        if (!isNaN(inputValue)) {
            const newMin = isMin ? Math.max(minValue, Math.min(inputValue, currentMax)) : currentMin;
            const newMax = isMin ? currentMax : Math.min(maxValue, Math.max(inputValue, currentMin));
            
            // Clear play state when user manually changes values
            this.playStates.delete(facetKey);
            
            // Temporarily disable the update event to prevent overwriting
            const tempActiveInput = activeInput;
            
            // Update the slider silently (this will trigger update but we'll ignore it)
            slider.noUiSlider.set([newMin, newMax]);
            
            // Restore the input value if it was overwritten
            if (tempActiveInput === minInput) {
              minInput.value = newMin;
            }
            if (tempActiveInput === maxInput) {
              maxInput.value = newMax;
            }
            
            // Trigger the filter change
            onStateChange({ 
              type: 'RANGE_CHANGE', 
              facetKey, 
              value: [newMin, newMax] 
            });
            
            // Update the chart highlight
            this.updateChartHighlight(chartElement, buckets, newMin, newMax);
        }
    };

    // Use 'change' event (fires when user finishes editing) instead of 'input' (fires on every keystroke)
    minInput.addEventListener('change', handleInputChange);
    maxInput.addEventListener('change', handleInputChange);
    
    // Also handle Enter key press for immediate update
    const handleKeyPress = (evt) => {
        if (evt.key === 'Enter') {
            evt.target.blur(); // This will trigger the change event
        }
    };
    
    minInput.addEventListener('keypress', handleKeyPress);
    maxInput.addEventListener('keypress', handleKeyPress);

    // Setup play controls
    this.setupPlayControls(facetKey, playBtn, pauseBtn, slider, minValue, maxValue, onStateChange, chartElement, buckets);

    // Initial chart highlight
    this.updateChartHighlight(chartElement, buckets, startValue, endValue);
  }

  setupPlayControls(facetKey, playBtn, pauseBtn, slider, minValue, maxValue, onStateChange, chartElement, buckets) {
    // Play button handler
    playBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Play button clicked for:', facetKey);
      this.startPlay(facetKey, playBtn, pauseBtn, slider, minValue, maxValue, onStateChange, chartElement, buckets);
    });

    // Pause button handler
    pauseBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Pause button clicked for:', facetKey);
      this.pausePlay(facetKey, playBtn, pauseBtn);
    });
  }

  startPlay(facetKey, playBtn, pauseBtn, slider, minValue, maxValue, onStateChange, chartElement, buckets) {
    // If already playing, do nothing
    if (this.playIntervals.has(facetKey)) {
      return;
    }

    // Get current slider values as starting point
    const [currentSliderMin, currentSliderMax] = slider.noUiSlider.get().map(Number);

    // Check if we're resuming from a pause or starting fresh
    let playState = this.playStates.get(facetKey);
    
    if (!playState) {
      // Starting fresh
      playState = {
        startMin: currentSliderMin,
        currentMax: currentSliderMin + 1,
        originalMin: currentSliderMin,
        originalMax: currentSliderMax
      };
      this.playStates.set(facetKey, playState);
    }

    // Update button states
    playBtn.disabled = true;
    playBtn.innerHTML = `
      <div class="flex gap-0.5">
        <div class="w-0.5 h-3 bg-white rounded-sm"></div>
        <div class="w-0.5 h-3 bg-white rounded-sm"></div>
      </div>
      <span class="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">Playing...</span>
    `;
    playBtn.className = "group relative w-8 h-8 bg-gradient-to-r from-primary-500 to-indigo-600 text-white text-xs rounded-full transition-colors duration-200 shadow-md flex items-center justify-center opacity-75 cursor-not-allowed";
    
    pauseBtn.disabled = false;
    pauseBtn.className = "group relative w-8 h-8 bg-gradient-to-r from-red-500 to-pink-600 text-white text-xs rounded-full transition-colors duration-200 hover:from-red-600 hover:to-pink-700 shadow-md hover:shadow-lg flex items-center justify-center animate-pulse";
    
    console.log('Button states after start:', {
      playDisabled: playBtn.disabled,
      pauseDisabled: pauseBtn.disabled,
    });

    // Start the animation interval
    const playInterval = setInterval(() => {
      const currentPlayState = this.playStates.get(facetKey);
      if (!currentPlayState) {
        clearInterval(playInterval);
        this.playIntervals.delete(facetKey);
        return;
      }

      let { startMin, currentMax } = currentPlayState;
      currentMax = Math.min(currentMax + 1, maxValue);
      
      // If we've reached the end, stop
      if (currentMax >= maxValue) {
        this.pausePlay(facetKey, playBtn, pauseBtn);
        return;
      }

      // Update play state
      this.playStates.set(facetKey, { 
        ...currentPlayState, 
        currentMax 
      });

      // Update slider and trigger changes
      slider.noUiSlider.set([startMin, currentMax]);
      onStateChange({ 
        type: 'RANGE_CHANGE', 
        facetKey, 
        value: [startMin, currentMax] 
      });
      this.updateChartHighlight(chartElement, buckets, startMin, currentMax);

    }, 500);

    // Store the interval
    this.playIntervals.set(facetKey, playInterval);
  }

  pausePlay(facetKey, playBtn, pauseBtn) {
    // Simply clear the interval - that's it!
    const playInterval = this.playIntervals.get(facetKey);
    if (playInterval) {
      clearInterval(playInterval);
      this.playIntervals.delete(facetKey);
    }

    // Update button states with small rounded styling
    playBtn.disabled = false;
    playBtn.innerHTML = `
      <div class="w-0 h-0 border-l-[5px] border-l-white border-y-[3px] border-y-transparent ml-0.5"></div>
      <span class="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">Play</span>
    `;
    playBtn.className = "group relative w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-xs rounded-full transition-colors duration-200 hover:from-primary-600 hover:to-primary-700 shadow-md hover:shadow-lg flex items-center justify-center";
    
    pauseBtn.disabled = true;
    pauseBtn.className = "group relative w-8 h-8 bg-gradient-to-r from-secondary-500 to-secondary-600 text-white text-xs rounded-full transition-colors duration-200 shadow-md flex items-center justify-center opacity-50 cursor-not-allowed";
  }

  // NEW METHOD: Update range facet when data changes
  updateRangeFacet(facetGroup, facetKey, facetConfig, aggregations, checkedState, state, onStateChange) {
    const sliderContainer = facetGroup.querySelector('.facet-slider');
    if (!sliderContainer) return;

    // Stop any playing animation when updating
    const playBtn = sliderContainer.querySelector(`#${facetKey}-play-btn`);
    const pauseBtn = sliderContainer.querySelector(`#${facetKey}-pause-btn`);
    if (playBtn && pauseBtn) {
      this.pausePlay(facetKey, playBtn, pauseBtn);
    }

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
    const newMinValue = Math.min(...values);
    const newMaxValue = Math.max(...values);

    // Get stored references
    const slider = sliderContainer.slider;
    const minInput = sliderContainer.minInput;
    const maxInput = sliderContainer.maxInput;
    const currentMinSpan = sliderContainer.currentMinSpan;
    const currentMaxSpan = sliderContainer.currentMaxSpan;
    const chartElement = sliderContainer.chartElement;

    if (!slider || !slider.noUiSlider) return;

    // Update the chart first
    this.renderBarChart(chartElement, buckets, newMinValue, newMaxValue);

    // Get current slider values
    const [currentStart, currentEnd] = slider.noUiSlider.get().map(Number);

    // Update slider range
    slider.noUiSlider.updateOptions({
      range: {
        'min': newMinValue,
        'max': newMaxValue
      }
    });

    // Determine new slider values based on current filter or constrain to new range
    const currentFilter = state.filters[facetKey];
    let newStart, newEnd;

    if (!currentFilter || currentFilter.length === 0) {
      // No filter applied, use full range
      newStart = newMinValue;
      newEnd = newMaxValue;
    } else {
      // Constrain current filter to new available range
      newStart = Math.max(newMinValue, Math.min(currentFilter[0], newMaxValue));
      newEnd = Math.min(newMaxValue, Math.max(currentFilter[1], newMinValue));
    }

    // Update slider values
    slider.noUiSlider.set([newStart, newEnd]);

    // Update input placeholders and min/max attributes
    minInput.setAttribute('min', newMinValue);
    minInput.setAttribute('max', newMaxValue);
    minInput.placeholder = `Min (${newMinValue})`;
    
    maxInput.setAttribute('min', newMinValue);
    maxInput.setAttribute('max', newMaxValue);
    maxInput.placeholder = `Max (${newMaxValue})`;

    // Update the chart highlight
    this.updateChartHighlight(chartElement, buckets, newStart, newEnd);

    // If the constrained values are different from the current filter, update the state
    if (!currentFilter || currentFilter.length === 0 || 
        currentFilter[0] !== newStart || currentFilter[1] !== newEnd) {
      onStateChange({ 
        type: 'RANGE_CHANGE', 
        facetKey, 
        value: [newStart, newEnd] 
      });
    }
  }

  renderBarChart(element, buckets, minValue, maxValue, onRangeChange = null) {
    // Clear any existing content
    element.innerHTML = '';
    
    // Find the maximum count for scaling
    const maxCount = Math.max(...buckets.map(bucket => bucket.count));
    
    // Sort buckets by value to ensure bars are in order and store for later use
    this.sortedBuckets = [...buckets].sort((a, b) => a.value - b.value);
    
    // Create main container
    const mainContainer = document.createElement('div');
    mainContainer.className = 'w-full h-full flex flex-col';
    element.appendChild(mainContainer);
    
    // Create chart container
    const chartContainer = document.createElement('div');
    chartContainer.className = 'w-full flex-1 rounded px-1 overflow-hidden';
    chartContainer.style.height = '150px'; // Fixed height instead of flex-1
    mainContainer.appendChild(chartContainer);
    
    // Create a container for the bars
    const barsContainer = document.createElement('div');
    barsContainer.className = 'flex items-end w-full h-full';
    chartContainer.appendChild(barsContainer);
    
    // Create and append bar elements
    this.sortedBuckets.forEach(bucket => {
      const barHeight = maxCount > 0 ? (bucket.count / maxCount) * 90 : 0; // Use 90% instead of 100% for padding
      
      const bar = document.createElement('div');
      bar.className = 'flex-1 mx-px transition-colors duration-200';
      
      // Set proper height in percentage
      bar.style.height = `${Math.max(barHeight, 1)}%`; // Minimum 1% height
      
      bar.dataset.value = bucket.value;
      bar.dataset.count = bucket.count;
      bar.title = `Value: ${bucket.value}, Count: ${bucket.count}`;
      
      barsContainer.appendChild(bar);
    });
  }

  updateChartHighlight(chartElement, buckets, startValue, endValue) {
    // Find the bars container - look for the specific bars container
    const barsContainer = chartElement.querySelector('.flex.items-end');
    if (!barsContainer) {
      console.warn('Bars container not found');
      return;
    }

    // Get all existing bars (DO NOT modify the chart structure)
    const allBars = barsContainer.querySelectorAll('[data-value]');
    
    // ONLY change background colors based on slider range
    allBars.forEach(bar => {
      const barValue = parseInt(bar.dataset.value);
      
      if (barValue >= startValue && barValue <= endValue) {
        // Bars within slider range: keep original blue color
        bar.style.backgroundColor = '#b0c4de';
      } else {
        // Bars outside slider range: change to grey
        bar.style.backgroundColor = '#d1d5db';
      }
      
      // Never modify height, visibility, or any other properties
      // The bars stay exactly as they were initially rendered
    });
  }

  _debounce(func, delay) {
    let timer;
    return function () {
      clearTimeout(timer);  
      timer = setTimeout(() => func.apply(this, arguments), delay);
    };
  }
}