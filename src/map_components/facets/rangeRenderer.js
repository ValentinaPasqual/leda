// RangeRenderer.js - Fixed version with free slider movement
import noUiSlider from 'nouislider';
import 'nouislider/dist/nouislider.css';
import '../../styles/tailwind.css'

export class RangeRenderer {
  
  constructor() {
    this.playIntervals = new Map(); // Track play intervals for each facet
    this.playStates = new Map(); // Track play states for each facet
  }
  
  /* ----------------------------------------------------------------------------------------- */
  /* ----------------------------    INITILIASE THE RANGE FACET    --------------------------- */
  /* ----------------------------------------------------------------------------------------- */  

  /* Process and validate raw bucket data - NOW HANDLES BOTH RAW AND FILTERED BUCKETS */
  _processRangeData(rawBuckets, filteredBuckets, currentFilter) {
    // Process ALL buckets (for chart display and range extremes)
    const allBuckets = rawBuckets
      .map(bucket => ({
        value: parseInt(bucket.key, 10),
        count: bucket.doc_count || 0
      }))
      .filter(bucket => !isNaN(bucket.value))
      .sort((a, b) => a.value - b.value);

    // Process FILTERED buckets (for slider operation)
    const availableBuckets = filteredBuckets
      .map(bucket => ({
        value: parseInt(bucket.key, 10),
        count: bucket.doc_count || 0
      }))
      .filter(bucket => !isNaN(bucket.value))
      .sort((a, b) => a.value - b.value);

    if (allBuckets.length === 0) {
      throw new Error('No valid numeric values found in range data');
    }

    // Get all possible values and available values
    const allValues = allBuckets.map(b => b.value);
    const availableValues = availableBuckets.map(b => b.value);
    
    // Range extremes come from ALL data
    const minValue = allValues[0];
    const maxValue = allValues[allValues.length - 1];
    
    // Available values for slider operation
    const sortedAvailableValues = [...new Set(availableValues)];
    
    // Current filter - allow full range selection, not constrained to available values
    let startValue, endValue;
    if (currentFilter && currentFilter.length === 2) {
      startValue = Math.max(currentFilter[0], minValue);
      endValue = Math.min(currentFilter[1], maxValue);
    } else {
      // Default to closest available values if no filter is set
      startValue = sortedAvailableValues[0] || minValue;
      endValue = sortedAvailableValues[sortedAvailableValues.length - 1] || maxValue;
    }

    return {
      allBuckets,           // For chart display (includes zero-count buckets)
      availableBuckets,     // For slider operation (only non-zero count buckets)
      sortedAvailableValues, // Available values for slider
      minValue,             // Absolute minimum (from all data)
      maxValue,             // Absolute maximum (from all data)
      startValue,           // Current start 
      endValue              // Current end 
    };
  }

  /* Create DOM structure for range facet */
  _createRangeFacetDOM(facetKey, config) {
    const sliderContainer = document.createElement('div');
    sliderContainer.className = 'facet-slider my-3';
    sliderContainer.innerHTML = this._getRangeFacetHTML(facetKey, config);
    return sliderContainer;
  }

  /* Generate HTML template for range facet */
  _getRangeFacetHTML(facetKey, { minValue, maxValue }) {
    return `
      <div class="space-y-3">
        <!-- Play Controls -->
        <div class="play-controls flex items-center justify-center gap-2 pb-3 border-b border-gray-200">
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
          <span id="${facetKey}-min-display" class="font-medium">${minValue}</span>
          <span id="${facetKey}-max-display" class="font-medium">${maxValue}</span>
        </div>
        
        <!-- Custom Range Inputs -->
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
  }

  /* Get all DOM elements for the slider */
  _getSliderElements(container, facetKey) {
    return {
      chartElement: container.querySelector(`#${facetKey}-chart`),
      slider: container.querySelector(`#${facetKey}-slider`),
      minInput: container.querySelector(`#${facetKey}-min-input`),
      maxInput: container.querySelector(`#${facetKey}-max-input`),
      minDisplay: container.querySelector(`#${facetKey}-min-display`),
      maxDisplay: container.querySelector(`#${facetKey}-max-display`),
      playBtn: container.querySelector(`#${facetKey}-play-btn`),
      pauseBtn: container.querySelector(`#${facetKey}-pause-btn`)
    };
  }

/* Initialize the noUiSlider - SLIDER RANGE ALWAYS USES ABSOLUTE EXTREMES */
  _initializeSlider(slider, config) {
    // Slider range is always the absolute min/max, and user can select freely
    noUiSlider.create(slider, {
      start: [config.startValue, config.endValue],
      connect: true,
      step: 1,
      range: {
        'min': config.minValue,  // Always absolute minimum
        'max': config.maxValue   // Always absolute maximum
      },
      format: {
        to: (value) => Math.round(value),
        from: (value) => parseInt(value, 10)
      }
    });

    slider.classList.add('custom-slider');
  }

  /* Setup all event handlers */
  _setupEventHandlers(facetKey, elements, config, onStateChange) {
    // Slider update handler
    elements.slider.noUiSlider.on('update', (values) => {
      const [min, max] = values.map(val => Math.round(Number(val)));
      elements.minDisplay.textContent = min.toString();
      elements.maxDisplay.textContent = max.toString();
      
      // Update inputs if they don't have focus
      if (document.activeElement !== elements.minInput) {
        elements.minInput.value = min;
      }
      if (document.activeElement !== elements.maxInput) {
        elements.maxInput.value = max;
      }
    });

    // Slider change handler (user interaction) - NOW ALLOWS FREE MOVEMENT
    elements.slider.noUiSlider.on('change', (values) => {
      const [startVal, endVal] = values.map(val => Math.round(Number(val)));
      
      // Allow any values within the absolute range
      if (!isNaN(startVal) && !isNaN(endVal) && startVal >= config.minValue && endVal <= config.maxValue) {
        this._updateRange(facetKey, [startVal, endVal], onStateChange, elements.chartElement, config.allBuckets, config);
      }
    });

    // Input change handlers - ALLOW FULL RANGE
    elements.minInput.addEventListener('change', (e) => {
      this._handleInputChange(e.target, true, facetKey, elements, config, onStateChange);
    });
    
    elements.maxInput.addEventListener('change', (e) => {
      this._handleInputChange(e.target, false, facetKey, elements, config, onStateChange);
    });

    // Enter key handlers for immediate update
    [elements.minInput, elements.maxInput].forEach(input => {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.target.blur();
        }
      });
    });

    // Play controls - USES AVAILABLE VALUES FOR ANIMATION
    this.setupPlayControls(facetKey, elements.playBtn, elements.pauseBtn, elements.slider, 
                          config.sortedAvailableValues, onStateChange, elements.chartElement, config.allBuckets);
  }

  /* Validate and clamp input values - ALWAYS USE ABSOLUTE EXTREMES */
  _validateAndClampInput(value, minValue, maxValue) {
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) return null;
    
    return Math.max(minValue, Math.min(maxValue, parsed));
  }

  /* Store references for cleanup and external access */
  _storeSliderReferences(container, elements, config) {
    // Store references
    container.slider = elements.slider;
    container.sortedValues = config.sortedAvailableValues; // Use available values
    Object.assign(container, elements);
    
    // Store cleanup function
    container.cleanup = () => {
      if (elements.slider.noUiSlider) {
        elements.slider.noUiSlider.destroy();
      }
      this.playStates.delete(container.facetKey);
    };
  }

  /* ----------------------------------------------------------------------------------------- */
  /* ------------------------------     PLAY/PAUSE CONTROLS ---------------------------------- */
  /* ----------------------------------------------------------------------------------------- */

  setupPlayControls(facetKey, playBtn, pauseBtn, slider, sortedAvailableValues, onStateChange, chartElement, allBuckets) {
    // Play button handler
    playBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.startPlay(facetKey, playBtn, pauseBtn, slider, sortedAvailableValues, onStateChange, chartElement, allBuckets);
    });

    // Pause button handler
    pauseBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.pausePlay(facetKey, playBtn, pauseBtn);
    });
  }

  startPlay(facetKey, playBtn, pauseBtn, slider, sortedAvailableValues, onStateChange, chartElement, allBuckets) {
    // If already playing, do nothing
    if (this.playIntervals.has(facetKey)) {
      return;
    }

    // Get current slider values as starting point
    const [currentSliderMin, currentSliderMax] = slider.noUiSlider.get().map(Number);
    
    // For play animation, snap to closest available values
    const currentSliderMinSnapped = this._findClosestDatasetValue(sortedAvailableValues, currentSliderMin);
    const currentSliderMaxSnapped = this._findClosestDatasetValue(sortedAvailableValues, currentSliderMax);

    // Check if we're resuming from a pause or starting fresh
    let playState = this.playStates.get(facetKey);
    
    if (!playState) {
      // Starting fresh - find the current min and max indices in available values
      const startMinIndex = sortedAvailableValues.indexOf(currentSliderMinSnapped);
      const maxLimitIndex = sortedAvailableValues.indexOf(currentSliderMaxSnapped);
      playState = {
        startMinIndex: startMinIndex,
        currentMaxIndex: startMinIndex, // Start with min = max
        maxLimitIndex: maxLimitIndex, // Stop at this index
        originalMin: currentSliderMinSnapped,
        originalMax: currentSliderMaxSnapped
      };
      this.playStates.set(facetKey, playState);
    } else {
      // Check if we need to restart from the beginning
      // This happens when the animation has finished (currentMaxIndex >= maxLimitIndex)
      if (playState.currentMaxIndex >= playState.maxLimitIndex) {
        // Reset to start position
        playState.currentMaxIndex = playState.startMinIndex;
        this.playStates.set(facetKey, playState);
      }
    }
    
    // Start the animation interval
    const playInterval = setInterval(() => {
      const currentPlayState = this.playStates.get(facetKey);
      if (!currentPlayState) {
        clearInterval(playInterval);
        this.playIntervals.delete(facetKey);
        return;
      }

      let { startMinIndex, currentMaxIndex, maxLimitIndex } = currentPlayState;
      
      // Move to next available dataset value
      currentMaxIndex = Math.min(currentMaxIndex + 1, maxLimitIndex);
      
      // If we've reached the user-set maximum, stop
      if (currentMaxIndex >= maxLimitIndex) {
        // Set final position to exact limit and then stop
        const startValue = sortedAvailableValues[startMinIndex];
        const endValue = sortedAvailableValues[maxLimitIndex];
        slider.noUiSlider.set([startValue, endValue]);
        
        // For play controls, we need to pass the config - get it from stored references
        const container = slider.closest('.facet-slider');
        const storedConfig = {
          minValue: container.minValue || startValue,
          maxValue: container.maxValue || endValue
        };
        
        onStateChange({ 
          type: 'RANGE_CHANGE', 
          facetKey, 
          value: [startValue, endValue] 
        });
        this.updateChartHighlight(chartElement, allBuckets, startValue, endValue);
        
        // Clear the play state so next play starts fresh
        this.playStates.delete(facetKey);
        this.pausePlay(facetKey, playBtn, pauseBtn);
        return;
      }

      // Update play state
      this.playStates.set(facetKey, { 
        ...currentPlayState, 
        currentMaxIndex 
      });

      // Get actual available dataset values
      const startValue = sortedAvailableValues[startMinIndex];
      const endValue = sortedAvailableValues[currentMaxIndex];

      // Update slider and trigger changes
      slider.noUiSlider.set([startValue, endValue]);
      onStateChange({ 
        type: 'RANGE_CHANGE', 
        facetKey, 
        value: [startValue, endValue] 
      });
      this.updateChartHighlight(chartElement, allBuckets, startValue, endValue);

    }, 500);

    // Store the interval
    this.playIntervals.set(facetKey, playInterval);
  }

  pausePlay(facetKey, playBtn, pauseBtn) {
    // Clear the interval 
    const playInterval = this.playIntervals.get(facetKey);
    if (playInterval) {
      clearInterval(playInterval);
      this.playIntervals.delete(facetKey);
    }
  }

  /* ----------------------------------------------------------------------------------------- */
  /* --------------------     COMPUTATIONS AND UPDATES ON DATA CHANGE ------------------------ */
  /* ----------------------------------------------------------------------------------------- */

    /* Centralized range update logic to make the facet compliant with items.js logic */
  _updateRange(facetKey, [newMin, newMax], onStateChange, chartElement, allBuckets, config) {
    // Clear play state when user manually changes range
    this.playStates.delete(facetKey);
    
    // Check if the selected range covers the entire absolute range
    // If so, remove the filter (equivalent to no selection)
    let filterValue;
    if (newMin === config.minValue && newMax === config.maxValue) {
      // User selected the entire range - remove filter
      filterValue = null;
    } else {
      // User selected a specific range - apply filter
      filterValue = [newMin, newMax];
    }
    
    // Trigger state change
    onStateChange({ 
      type: 'RANGE_CHANGE', 
      facetKey, 
      value: filterValue
    });
    
    // Update chart highlight (uses ALL buckets for display)
    this.updateChartHighlight(chartElement, allBuckets, newMin, newMax);
  }

    /* Handle input field changes - ALLOW FREE MOVEMENT IN ABSOLUTE RANGE */
  _handleInputChange(inputElement, isMin, facetKey, elements, config, onStateChange) {
    const value = this._validateAndClampInput(inputElement.value, config.minValue, config.maxValue);
    if (value === null) return;

    // Don't snap to available values - allow free movement
    const [currentMin, currentMax] = elements.slider.noUiSlider.get().map(Number);
    
    const newRange = isMin 
      ? [Math.max(config.minValue, Math.min(value, currentMax)), currentMax]
      : [currentMin, Math.min(config.maxValue, Math.max(value, currentMin))];
      
    this._updateRange(facetKey, newRange, onStateChange, elements.chartElement, config.allBuckets, config);
    elements.slider.noUiSlider.set(newRange);
  }
  
  // Find the closest value in the available dataset - ONLY USED FOR PLAY CONTROLS
  _findClosestDatasetValue(sortedAvailableValues, targetValue) {
    if (sortedAvailableValues.length === 0) return targetValue;
    
    // If target is smaller than the smallest available value, return the smallest available
    if (targetValue <= sortedAvailableValues[0]) return sortedAvailableValues[0];
    
    // If target is larger than the largest available value, return the largest available
    if (targetValue >= sortedAvailableValues[sortedAvailableValues.length - 1]) return sortedAvailableValues[sortedAvailableValues.length - 1];
    
    // Binary search for the closest available value
    let left = 0;
    let right = sortedAvailableValues.length - 1;
    
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const midValue = sortedAvailableValues[mid];
      
      if (midValue === targetValue) {
        return midValue;
      } else if (midValue < targetValue) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }
    
    // At this point, right is the largest available value smaller than target
    // and left is the smallest available value larger than target
    if (right < 0) return sortedAvailableValues[0];
    if (left >= sortedAvailableValues.length) return sortedAvailableValues[sortedAvailableValues.length - 1];
    
    // Return the closer of the two available values
    const leftDiff = Math.abs(sortedAvailableValues[left] - targetValue);
    const rightDiff = Math.abs(sortedAvailableValues[right] - targetValue);
    
    return leftDiff <= rightDiff ? sortedAvailableValues[left] : sortedAvailableValues[right];
  }

  /* FIXED CHART HIGHLIGHT - BLUE FOR DATA, GREY FOR NO DATA */
  updateChartHighlight(chartElement, allBuckets, startValue, endValue) {
    // Find the bars container - look for the specific bars container
    const barsContainer = chartElement.querySelector('.flex.items-end');
    if (!barsContainer) {
      console.warn('Bars container not found');
      return;
    }

    // Get all existing bars (these represent ALL buckets, including zero-count ones)
    const allBars = barsContainer.querySelectorAll('[data-value]');
    
    // Update colors based on selection and data availability
    allBars.forEach(bar => {
      const barValue = parseInt(bar.dataset.value);
      const barCount = parseInt(bar.dataset.count);
      
      if (barValue >= startValue && barValue <= endValue) {
        // Bars within slider selection
        if (barCount > 0) {
          // Has data and selected: bright blue
          bar.style.backgroundColor = '#d1d5db';
        } else {
          // No data but selected: light blue
          bar.style.backgroundColor = '#bfdbfe';
        }
      } else {
        // Bars outside slider selection - ALWAYS GREY regardless of data
        bar.style.backgroundColor = '#d1d5db';
      }
    });
  }

  /* ----------------------------------------------------------------------------------------- */
  /* -----------------------------------    DOM RENDERING  ----------------------------------- */
  /* ----------------------------------------------------------------------------------------- */

  /* FIXED CHART RENDERING - BLUE FOR DATA, GREY FOR NO DATA */
  renderBarChart(element, allBuckets, availableBuckets, minValue, maxValue, onRangeChange = null) {
    // Clear any existing content
    element.innerHTML = '';
    
    // Find the maximum count for scaling (from available buckets only)
    const maxCount = Math.max(...availableBuckets.map(bucket => bucket.count), 1);
    
    // Sort ALL buckets by value to ensure bars are in order
    this.sortedAllBuckets = [...allBuckets].sort((a, b) => a.value - b.value);
    
    // Create main container
    const mainContainer = document.createElement('div');
    mainContainer.className = 'w-full h-full flex flex-col';
    element.appendChild(mainContainer);
    
    // Create chart container
    const chartContainer = document.createElement('div');
    chartContainer.className = 'w-full flex-1 rounded px-1 overflow-hidden';
    chartContainer.style.height = '150px';
    mainContainer.appendChild(chartContainer);
    
    // Create a container for the bars
    const barsContainer = document.createElement('div');
    barsContainer.className = 'flex items-end w-full h-full';
    chartContainer.appendChild(barsContainer);
    
    // Create and append bar elements for ALL buckets
    this.sortedAllBuckets.forEach(bucket => {
      const barHeight = bucket.count > 0 ? (bucket.count / maxCount) * 90 : 2; // Minimum 2% for zero-count bars
      
      const bar = document.createElement('div');
      bar.className = 'flex-1 mx-px transition-colors duration-200';
      
      // Set proper height in percentage
      bar.style.height = `${Math.max(barHeight, 1)}%`;
      
      bar.dataset.value = bucket.value;
      bar.dataset.count = bucket.count;
      
      // Color based on data availability: BLUE for data, GREY for no data
      if (bucket.count > 0) {
        bar.title = `Value: ${bucket.value}, Count: ${bucket.count}`;
        bar.style.backgroundColor = '#3b82f6'; // Blue for available data
      } else {
        bar.title = `Value: ${bucket.value}, No data available`;
        bar.style.backgroundColor = '#d1d5db'; // Grey for no data
      }
      
      barsContainer.appendChild(bar);
    });
  }

  /* Handle empty data case */
  _renderEmptyRangeFacet(facetGroup, facetKey) {
    const emptyContainer = document.createElement('div');
    emptyContainer.className = 'facet-slider my-3 text-center text-gray-500 py-4';
    emptyContainer.innerHTML = '<p class="text-sm">No data available for this range</p>';
    facetGroup.appendChild(emptyContainer);
    return emptyContainer;
  }

  /* Renders the RANGE type facet in the DOM - MODIFIED TO HANDLE BOTH RAW AND FILTERED */
  _renderRangeFacet(facetGroup, facetKey, facetConfig, aggregations, checkedState, state, onStateChange) {

    
    const rawBuckets = aggregations[facetKey] || [];

      console.log(`=== RangeRenderer for ${facetKey} ===`);
  console.log('Received state:', state);
  console.log('state.filters:', state?.filters);
  console.log('state.filters[facetKey]:', state?.filters?.[facetKey]);
  console.log('=====================================');

    // Filter only buckets that have count > 0 (documents after filters)
    const filteredBuckets = rawBuckets.filter(bucket => bucket.doc_count > 0);

    // Early validation - check if we have any data at all
    if (!rawBuckets || rawBuckets.length === 0) {
      return this._renderEmptyRangeFacet(facetGroup, facetKey);
    }

    // Process both raw and filtered buckets
    const config = this._processRangeData(rawBuckets, filteredBuckets, state.filters[facetKey]);

    // Handle case where no available values (but raw data exists)
    if (config.sortedAvailableValues.length === 0) {
      // Show the full range but disabled
      const disabledContainer = document.createElement('div');
      disabledContainer.className = 'facet-slider my-3 text-center text-gray-500 py-4';
      disabledContainer.innerHTML = `
        <p class="text-sm">No values available with current filters</p>
        <p class="text-xs text-gray-400">Range: ${config.minValue} - ${config.maxValue}</p>
      `;
      facetGroup.appendChild(disabledContainer);
      return disabledContainer;
    }

    // Handle case where available min === max (only one available value)
    const availableMin = config.sortedAvailableValues[0];
    const availableMax = config.sortedAvailableValues[config.sortedAvailableValues.length - 1];
    
    if (availableMin === availableMax) {
      // Create a small artificial range for the slider but keep real values
      const artificialMax = availableMin + 1;
      config.sliderMax = artificialMax;
      config.endValue = availableMin; // Keep the real value
    }

    const sliderContainer = this._createRangeFacetDOM(facetKey, {
      minValue: config.minValue,
      maxValue: config.maxValue
    });
    facetGroup.appendChild(sliderContainer);

    const elements = this._getSliderElements(sliderContainer, facetKey);
    
    // Initialize components - pass both raw and filtered buckets
    this.renderBarChart(elements.chartElement, config.allBuckets, config.availableBuckets, 
                       config.minValue, config.maxValue);
    this._initializeSlider(elements.slider, config);
    this._setupEventHandlers(facetKey, elements, config, onStateChange);
    
    // Initial state - highlight based on current selection
    this.updateChartHighlight(elements.chartElement, config.allBuckets, config.startValue, config.endValue);
    
    // Store references and cleanup
    this._storeSliderReferences(sliderContainer, elements, config);
    
    return sliderContainer;
  }
}