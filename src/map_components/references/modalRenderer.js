// modalRenderer.js

import { FilterBadgesRenderer } from '../utils/filterBadgesRenderer.js';

export class ModalRenderer {
  constructor(mapFocusCallback, config = null) {
    this.mapFocusCallback = mapFocusCallback;
    this.config = config;
    this.allWorks = [];
    this.items = [];
    this.searchState = null; // Store search state including filters
    this.isModalOpen = false;
    this.currentModalIndex = 0;
    this.isAnimating = false; // Prevent multiple animations
  }

  setData(allWorks, items) {
    this.allWorks = allWorks;
    this.items = items;
  }

  setConfig(config) {
    this.config = config;
  }

  _getModalFields() {
    if (!this.config?.modal_information) {
        return {};
    }
    return this.config.modal_information;
  }

  _getFieldLabel(fieldName) {
      const modalFields = this._getModalFields();
      return modalFields[fieldName] || fieldName;
  }

  setSearchState(searchState) {
    this.searchState = searchState;
  }

  _getCompleteWorkData(idOpera) {
    const allEntriesForWork = this.items.filter(item => item.pivot_ID === idOpera);
    if (allEntriesForWork.length === 0) return null;

    const firstEntry = allEntriesForWork[0];
    const completeWork = {
      pivot_ID: idOpera,
      Title: firstEntry[window.ledaSearch.config.result_cards.card_title],
      Subtitle: firstEntry[window.ledaSearch.config.result_cards.card_subtitle],
      Subtitle2: firstEntry[window.ledaSearch.config.result_cards.card_subtitle_2],
      "Location": [],
      coordinates: [],
      allEntries: allEntriesForWork,
      geodataBySpace: new Map()
    };

    const spaceCoordMap = new Map();
    allEntriesForWork.forEach(item => {
      if (item["Location"]) {
        const spaces = Array.isArray(item["Location"]) 
          ? item["Location"] 
          : [item["Location"]];
        
        spaces.forEach((space, spaceIndex) => {
          if (!spaceCoordMap.has(space)) {
            const coords = this._extractCoordinates(item, spaceIndex);
            spaceCoordMap.set(space, coords);
            
            const geodataFields = this._getGeodataFields();
            const spaceGeodata = {};
            geodataFields.forEach(field => {
              if (item[field] !== undefined && item[field] !== null && item[field] !== '') {
                if (Array.isArray(item[field]) && item[field].length > spaceIndex) {
                  spaceGeodata[field] = item[field][spaceIndex];
                } else if (!Array.isArray(item[field])) {
                  spaceGeodata[field] = item[field];
                }
              }
            });
            completeWork.geodataBySpace.set(space, spaceGeodata);
          }
        });
      }
    });

    completeWork["Location"] = Array.from(spaceCoordMap.keys());
    completeWork.coordinates = Array.from(spaceCoordMap.values());
    return completeWork;
  }

  _getCatalogueFields() {
    return this.config?.datasetConfig?.fields?.catalogue || [];
  }

  _getGeodataFields() {
    return this.config?.datasetConfig?.fields?.geodata || [];
  }

  /**
   * Render the selected filters as badges
   */
  _renderSelectedFilters() {
    const renderer = new FilterBadgesRenderer(this.config);
    const filterBadgesHtml = renderer.render(this.searchState);
    
    // If no filters, return empty state
    if (!filterBadgesHtml || filterBadgesHtml.trim() === '') {
      return '<div class="text-sm text-gray-500 italic">Nessun filtro applicato</div>';
    }
    
    // Wrap badges in a container with overflow handling
    return `
      <div class="flex items-center gap-2">
        <div class="flex items-center gap-2 flex-wrap max-h-[2.5rem] overflow-hidden" id="filter-badges-container">
          ${filterBadgesHtml}
        </div>
        <span id="more-filters-indicator" class="hidden text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded-full whitespace-nowrap">
          <!-- Dynamic content -->
        </span>
      </div>
    `;
  }

  async toggleModal(centralWorkIndex) {
    if (this.isAnimating) return; // Prevent multiple rapid clicks
    
    if (this.isModalOpen) {
      await this._closeModal();
    } else {
      this.currentModalIndex = centralWorkIndex;
      await this._openModal();
    }
  }

  async _openModal() {
    this.isAnimating = true;
    
    let modal = document.getElementById('works-modal');
    if (!modal) {
      modal = this._createModal();
      document.body.appendChild(modal);
    }

    // Set initial state
    modal.classList.remove('hidden');
    modal.style.opacity = '0';
    
    // Get the modal content container
    const modalContainer = modal.querySelector('.modal-container');
    if (modalContainer) {
      modalContainer.style.transform = 'scale(0.8) translateY(20px)';
      modalContainer.style.opacity = '0';
    }

    this._populateModal();
    this.isModalOpen = true;
    document.body.style.overflow = 'hidden';

    // Force a reflow
    modal.offsetHeight;

    // Start animations
    modal.style.transition = 'opacity 300ms cubic-bezier(0.4, 0, 0.2, 1)';
    modal.style.opacity = '1';

    if (modalContainer) {
      modalContainer.style.transition = 'all 400ms cubic-bezier(0.34, 1.56, 0.64, 1)';
      modalContainer.style.transform = 'scale(1) translateY(0)';
      modalContainer.style.opacity = '1';
    }

    // Animate content items with stagger
    setTimeout(() => {
      this._animateContentItems();
      this.isAnimating = false;
    }, 200);
  }

  async _closeModal() {
    if (!this.isModalOpen) return;
    
    this.isAnimating = true;
    const modal = document.getElementById('works-modal');
    
    if (modal) {
      const modalContainer = modal.querySelector('.modal-container');
      
      // Animate out
      modal.style.transition = 'opacity 250ms cubic-bezier(0.4, 0, 1, 1)';
      modal.style.opacity = '0';
      
      if (modalContainer) {
        modalContainer.style.transition = 'all 250ms cubic-bezier(0.4, 0, 1, 1)';
        modalContainer.style.transform = 'scale(0.95) translateY(-10px)';
        modalContainer.style.opacity = '0';
      }

      // Wait for animation to complete
      await new Promise(resolve => setTimeout(resolve, 250));
      
      modal.classList.add('hidden');
      modal.style.opacity = '';
      if (modalContainer) {
        modalContainer.style.transform = '';
        modalContainer.style.opacity = '';
      }
    }
    
    this.isModalOpen = false;
    document.body.style.overflow = 'auto';
    this.isAnimating = false;
  }

  _animateContentItems() {
    // Animate header
    const header = document.querySelector('.modal-header');
    if (header) {
      header.style.opacity = '0';
      header.style.transform = 'translateY(-20px)';
      header.style.transition = 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)';
      
      setTimeout(() => {
        header.style.opacity = '1';
        header.style.transform = 'translateY(0)';
      }, 100);
    }

    // Animate filters section
    const filtersSection = document.querySelector('.filters-section');
    if (filtersSection) {
      filtersSection.style.opacity = '0';
      filtersSection.style.transform = 'translateY(-10px)';
      filtersSection.style.transition = 'all 400ms cubic-bezier(0.4, 0, 0.2, 1)';
      
      setTimeout(() => {
        filtersSection.style.opacity = '1';
        filtersSection.style.transform = 'translateY(0)';
      }, 150);
    }

    // Animate metadata cards with stagger
    const metadataCards = document.querySelectorAll('.metadata-card');
    metadataCards.forEach((card, index) => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(20px)';
      card.style.transition = 'all 400ms cubic-bezier(0.4, 0, 0.2, 1)';
      
      setTimeout(() => {
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, 200 + (index * 50));
    });

    // Animate geographical spaces
    const spaceCards = document.querySelectorAll('.space-card');
    spaceCards.forEach((card, index) => {
      card.style.opacity = '0';
      card.style.transform = 'translateX(-20px)';
      card.style.transition = 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)';
      
      setTimeout(() => {
        card.style.opacity = '1';
        card.style.transform = 'translateX(0)';
      }, 300 + (index * 75));
    });
  }

  _createModal() {
    const modal = document.createElement('div');
    modal.id = 'works-modal';
    modal.className = 'fixed inset-0 bg-gradient-to-br from-slate-900/90 to-gray-900/90 backdrop-blur-md z-50 hidden flex items-center justify-center p-4';
    
    modal.innerHTML = `
      <div class="modal-container relative w-full max-w-7xl h-[90vh] overflow-hidden">
        <!-- Enhanced Header with Close Button and Filters -->
        <div class="absolute top-0 left-0 right-0 px-6 py-4 z-20">
          <div class="flex items-center justify-between gap-4">
            <!-- Filters section on the left with opaque container -->
            <div class="filters-section flex-1 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 px-4 py-3 min-w-0">
              <!-- Filters are populated here -->
            </div>
            
            <!-- Close button on the right -->
            <button id="close-modal-btn" class="p-3 bg-white/90 hover:bg-white active:bg-gray-100 rounded-full text-gray-600 hover:text-red-500 shadow-lg hover:shadow-xl transition-all duration-300 group backdrop-blur-sm border border-gray-200/50 hover:border-red-200 flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5 group-hover:rotate-90 transition-transform duration-300">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <!-- Content Container with fixed width to prevent resizing -->
        <div id="modal-content" class="h-full pt-20 pb-16 rounded-2xl w-full max-w-none overflow-hidden"></div>
        
        <!-- Enhanced Footer with Progress Indicator and Mobile Navigation -->
        <div class="absolute bottom-0 left-0 right-0 px-6 py-4 z-20">
          <div class="flex items-center justify-center gap-3">
            <!-- Mobile Previous Button (hidden on desktop) -->
            <button id="mobile-prev-work-btn" class="lg:hidden group p-3 bg-white/90 hover:bg-white active:bg-gray-50 rounded-full text-gray-600 hover:text-secondary-600 transition-all duration-300 shadow-lg hover:shadow-xl ring-1 ring-gray-200/50 hover:ring-secondary-200 backdrop-blur-sm border border-gray-200/30 disabled:opacity-40 disabled:cursor-not-allowed">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            
            <span id="modal-progress" class="text-sm font-semibold text-gray-700 bg-white/90 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg ring-1 ring-white/20 border border-gray-200/50 transition-all duration-300 hover:shadow-xl">
            </span>
            
            <!-- Mobile Next Button (hidden on desktop) -->
            <button id="mobile-next-work-btn" class="lg:hidden group p-3 bg-white/90 hover:bg-white active:bg-gray-50 rounded-full text-gray-600 hover:text-secondary-600 transition-all duration-300 shadow-lg hover:shadow-xl ring-1 ring-gray-200/50 hover:ring-secondary-200 backdrop-blur-sm border border-gray-200/30 disabled:opacity-40 disabled:cursor-not-allowed">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;

    // Enhanced event listeners
    modal.addEventListener('click', (e) => {
      if (e.target === modal) this._closeModal();
    });

    modal.querySelector('#close-modal-btn').addEventListener('click', () => {
      this._closeModal();
    });

    document.addEventListener('keydown', (e) => {
      if (!this.isModalOpen || this.isAnimating) return;
      
      if (e.key === 'Escape') {
        this._closeModal();
      } else if (e.key === 'ArrowLeft') {
        this._navigateModal(-1);
      } else if (e.key === 'ArrowRight') {
        this._navigateModal(1);
      }
    });

    return modal;
  }

  async _navigateModal(direction) {
    if (this.isAnimating) return;
    
    const newIndex = this.currentModalIndex + direction;
    if (newIndex >= 0 && newIndex < this.allWorks.length) {
      this.isAnimating = true;
      
      const modalContent = document.getElementById('modal-content');
      if (!modalContent) return;
      
      // Get the main content area (the center panel with the actual content)
      const mainContentArea = modalContent.querySelector('.main-content-panel');
      if (!mainContentArea) return;
      
      // Create a container for the sliding effect only for the main content
      const slideContainer = document.createElement('div');
      slideContainer.className = 'relative w-full h-full overflow-hidden';
      
      // Create current content wrapper
      const currentContent = document.createElement('div');
      currentContent.className = 'absolute inset-0 w-full h-full transition-transform duration-500 ease-out overflow-y-auto bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200/50 ring-1 ring-white/20';
      currentContent.innerHTML = mainContentArea.innerHTML;
      
      // Create next content wrapper
      const nextContent = document.createElement('div');
      nextContent.className = 'absolute inset-0 w-full h-full transition-transform duration-500 ease-out overflow-y-auto bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200/50 ring-1 ring-white/20';
      
      // Position next content off-screen in the appropriate direction
      const slideDistance = '100%';
      nextContent.style.transform = `translateX(${direction > 0 ? slideDistance : `-${slideDistance}`})`;
      
      // Update data and render new content for next slide
      this.currentModalIndex = newIndex;
      const currentWork = this.allWorks[this.currentModalIndex];
      const workData = this._getCompleteWorkData(currentWork.pivot_ID);
      
      if (workData) {
        nextContent.innerHTML = this._renderMainCard(workData);
      }
      
      // Replace only the main content area with slide container
      mainContentArea.parentNode.replaceChild(slideContainer, mainContentArea);
      slideContainer.appendChild(currentContent);
      slideContainer.appendChild(nextContent);
      
      // Update navigation buttons state immediately
      this._updateNavigationButtons();
      
      // Force reflow
      slideContainer.offsetHeight;
      
      // Start the slide animation
      currentContent.style.transform = `translateX(${direction > 0 ? `-${slideDistance}` : slideDistance})`;
      nextContent.style.transform = 'translateX(0)';
      
      // Add a subtle fade effect during transition
      currentContent.style.opacity = '0.8';
      nextContent.style.opacity = '1';
      
      // Wait for slide animation to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Clean up and restore the main content area
      const newMainContentArea = document.createElement('div');
      newMainContentArea.className = 'main-content-panel flex-1 min-w-0 overflow-y-auto bg-white/95 backdrop-blur-sm rounded-xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-200/50 ring-1 ring-white/20 lg:mx-0 mx-2';
      newMainContentArea.innerHTML = nextContent.innerHTML;
      
      slideContainer.parentNode.replaceChild(newMainContentArea, slideContainer);
      
      // Update progress indicator
      const progressIndicator = document.getElementById('modal-progress');
      if (progressIndicator) {
        progressIndicator.textContent = `${this.currentModalIndex + 1} di ${this.allWorks.length}`;
      }
      
      // Re-add map focus listeners for the new content
      this._addMapFocusListeners();
      
      // Animate in the new content elements with stagger
      setTimeout(() => {
        this._animateContentItems();
        this.isAnimating = false;
      }, 100);
    }
  }

  _updateNavigationButtons() {
    const prevBtn = document.getElementById('prev-work-btn');
    const nextBtn = document.getElementById('next-work-btn');
    const mobilePrevBtn = document.getElementById('mobile-prev-work-btn');
    const mobileNextBtn = document.getElementById('mobile-next-work-btn');
    
    // Update desktop buttons
    if (prevBtn) {
      if (this.currentModalIndex === 0) {
        prevBtn.disabled = true;
        prevBtn.className = prevBtn.className.replace('hover:scale-110 hover:-translate-y-1', 'opacity-40 cursor-not-allowed');
      } else {
        prevBtn.disabled = false;
        prevBtn.className = prevBtn.className.replace('opacity-40 cursor-not-allowed', 'hover:scale-110 hover:-translate-y-1');
      }
    }
    
    if (nextBtn) {
      if (this.currentModalIndex === this.allWorks.length - 1) {
        nextBtn.disabled = true;
        nextBtn.className = nextBtn.className.replace('hover:scale-110 hover:-translate-y-1', 'opacity-40 cursor-not-allowed');
      } else {
        nextBtn.disabled = false;
        nextBtn.className = nextBtn.className.replace('opacity-40 cursor-not-allowed', 'hover:scale-110 hover:-translate-y-1');
      }
    }
    
    // Update mobile buttons
    if (mobilePrevBtn) {
      mobilePrevBtn.disabled = this.currentModalIndex === 0;
    }
    
    if (mobileNextBtn) {
      mobileNextBtn.disabled = this.currentModalIndex === this.allWorks.length - 1;
    }
    
    // Update preview cards
    this._updatePreviewCards();
  }

  _updatePreviewCards() {
    const prevWork = this.currentModalIndex > 0 ? this.allWorks[this.currentModalIndex - 1] : null;
    const nextWork = this.currentModalIndex < this.allWorks.length - 1 ? this.allWorks[this.currentModalIndex + 1] : null;
    const prevWorkData = prevWork ? this._getCompleteWorkData(prevWork.pivot_ID) : null;
    const nextWorkData = nextWork ? this._getCompleteWorkData(nextWork.pivot_ID) : null;
    
    // Update left preview
    const leftPanel = document.querySelector('.left-nav-panel .preview-card');
    if (leftPanel) {
      if (prevWorkData) {
        leftPanel.className = 'preview-card text-center bg-white/90 backdrop-blur-sm rounded-xl shadow-lg ring-1 ring-gray-200/50 border border-gray-200/30 px-4 py-6 w-48 transition-all duration-300 hover:shadow-xl hover:-translate-y-1';
        leftPanel.innerHTML = `
          <div class="w-12 h-1 bg-gradient-to-r from-secondary-400 to-secondary-600 rounded-full mx-auto mb-4"></div>
          <h4 class="text-sm font-semibold text-gray-800 leading-relaxed mb-2">${prevWorkData.Title}</h4>
          <p class="text-xs text-gray-600 font-medium">${prevWorkData.Subtitle}</p>
          <p class="text-xs text-gray-500">(${prevWorkData.Subtitle2})</p>
        `;
      } else {
        leftPanel.className = 'preview-card text-center px-4 py-6 bg-gray-50/80 backdrop-blur-sm rounded-xl border-2 border-dashed border-gray-300/50 w-48';
        leftPanel.innerHTML = '<div class="text-sm text-gray-400 font-medium">Nessuna opera precedente</div>';
      }
    }
    
    // Update right preview
    const rightPanel = document.querySelector('.right-nav-panel .preview-card');
    if (rightPanel) {
      if (nextWorkData) {
        rightPanel.className = 'preview-card text-center px-4 py-6 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg ring-1 ring-gray-200/50 border border-gray-200/30 w-48 transition-all duration-300 hover:shadow-xl hover:-translate-y-1';
        rightPanel.innerHTML = `
          <div class="w-12 h-1 bg-gradient-to-r from-secondary-400 to-secondary-600 rounded-full mx-auto mb-4"></div>
          <h4 class="text-sm font-semibold text-gray-800 leading-relaxed mb-2">${nextWorkData.Title}</h4>
          <p class="text-xs text-gray-600 font-medium">${nextWorkData.Subtitle}</p>
          <p class="text-xs text-gray-500">(${nextWorkData.Subtitle2})</p>
        `;
      } else {
        rightPanel.className = 'preview-card text-center px-4 py-6 bg-gray-50/80 backdrop-blur-sm rounded-xl border-2 border-dashed border-gray-300/50 w-48';
        rightPanel.innerHTML = '<div class="text-sm text-gray-400 font-medium">Nessuna opera successiva</div>';
      }
    }
  }

  _addNavigationListeners() {
    const prevBtn = document.getElementById('prev-work-btn');
    const nextBtn = document.getElementById('next-work-btn');
    const mobilePrevBtn = document.getElementById('mobile-prev-work-btn');
    const mobileNextBtn = document.getElementById('mobile-next-work-btn');
    
    if (prevBtn && this.currentModalIndex > 0) {
      prevBtn.addEventListener('click', () => this._navigateModal(-1));
    }
    
    if (nextBtn && this.currentModalIndex < this.allWorks.length - 1) {
      nextBtn.addEventListener('click', () => this._navigateModal(1));
    }
    
    if (mobilePrevBtn && this.currentModalIndex > 0) {
      mobilePrevBtn.addEventListener('click', () => this._navigateModal(-1));
    }
    
    if (mobileNextBtn && this.currentModalIndex < this.allWorks.length - 1) {
      mobileNextBtn.addEventListener('click', () => this._navigateModal(1));
    }
  }

  _populateModal() {
    const modalContent = document.getElementById('modal-content');
    const progressIndicator = document.getElementById('modal-progress');
    const filtersSection = document.querySelector('.filters-section');
    
    if (!modalContent) return;

    // Update filters section
    if (filtersSection) {
      filtersSection.innerHTML = this._renderSelectedFilters();
      // Check for overflow after rendering
      setTimeout(() => this._handleFilterOverflow(), 100);
    }

    const currentWork = this.allWorks[this.currentModalIndex];
    const workData = this._getCompleteWorkData(currentWork.pivot_ID);
    
    const prevWork = this.currentModalIndex > 0 ? this.allWorks[this.currentModalIndex - 1] : null;
    const nextWork = this.currentModalIndex < this.allWorks.length - 1 ? this.allWorks[this.currentModalIndex + 1] : null;
    const prevWorkData = prevWork ? this._getCompleteWorkData(prevWork.pivot_ID) : null;
    const nextWorkData = nextWork ? this._getCompleteWorkData(nextWork.pivot_ID) : null;
    
    if (!workData) {
      modalContent.innerHTML = '<div class="flex items-center justify-center h-full text-gray-500 text-lg">Dati non disponibili</div>';
      return;
    }

    modalContent.innerHTML = `
      <div class="flex h-full w-full">
        <!-- Enhanced Left Navigation Panel with fixed width (hidden on mobile) -->
        <div class="left-nav-panel hidden lg:flex flex-col items-center justify-center p-6 space-y-6 w-64 flex-shrink-0">
          <button id="prev-work-btn" class="group p-4 bg-white/90 hover:bg-white active:bg-gray-50 rounded-2xl text-gray-600 hover:text-secondary-600 transition-all duration-300 shadow-lg hover:shadow-xl ring-1 ring-gray-200/50 hover:ring-secondary-200 backdrop-blur-sm border border-gray-200/30 ${this.currentModalIndex === 0 ? 'opacity-40 cursor-not-allowed' : 'hover:scale-110 hover:-translate-y-1'}" ${this.currentModalIndex === 0 ? 'disabled' : ''}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-7 h-7 group-hover:-translate-x-1 transition-transform duration-300">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          
          ${prevWorkData ? `
            <div class="preview-card text-center bg-white/90 backdrop-blur-sm rounded-xl shadow-lg ring-1 ring-gray-200/50 border border-gray-200/30 px-4 py-6 w-48 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div class="w-12 h-1 bg-gradient-to-r from-secondary-400 to-secondary-600 rounded-full mx-auto mb-4"></div>
              <h4 class="text-sm font-semibold text-gray-800 leading-relaxed mb-2">${prevWorkData.Title}</h4>
              <p class="text-xs text-gray-600 font-medium">${prevWorkData.Subtitle}</p>
              <p class="text-xs text-gray-500">(${prevWorkData.Subtitle2})</p>
            </div>
          ` : `
            <div class="preview-card text-center px-4 py-6 bg-gray-50/80 backdrop-blur-sm rounded-xl border-2 border-dashed border-gray-300/50 w-48">
              <div class="text-sm text-gray-400 font-medium">Nessuna opera precedente</div>
            </div>
          `}
        </div>

        <!-- Enhanced Main Content Area with fixed flex properties (full width on mobile) -->
        <div class="main-content-panel flex-1 min-w-0 overflow-y-auto bg-white/95 backdrop-blur-sm rounded-xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-200/50 ring-1 ring-white/20 lg:mx-0 mx-2">
          ${this._renderMainCard(workData)}
        </div>

        <!-- Enhanced Right Navigation Panel with fixed width (hidden on mobile) -->
        <div class="right-nav-panel hidden lg:flex flex-col items-center justify-center p-6 space-y-6 w-64 flex-shrink-0">
          <button id="next-work-btn" class="group p-4 bg-white/90 hover:bg-white active:bg-gray-50 rounded-2xl text-gray-600 hover:text-secondary-600 transition-all duration-300 shadow-lg hover:shadow-xl ring-1 ring-gray-200/50 hover:ring-secondary-200 backdrop-blur-sm border border-gray-200/30 ${this.currentModalIndex === this.allWorks.length - 1 ? 'opacity-40 cursor-not-allowed' : 'hover:scale-110 hover:-translate-y-1'}" ${this.currentModalIndex === this.allWorks.length - 1 ? 'disabled' : ''}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-7 h-7 group-hover:translate-x-1 transition-transform duration-300">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
          
          ${nextWorkData ? `
            <div class="preview-card text-center px-4 py-6 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg ring-1 ring-gray-200/50 border border-gray-200/30 w-48 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div class="w-12 h-1 bg-gradient-to-r from-secondary-400 to-secondary-600 rounded-full mx-auto mb-4"></div>
              <h4 class="text-sm font-semibold text-gray-800 leading-relaxed mb-2">${nextWorkData.Title}</h4>
              <p class="text-xs text-gray-600 font-medium">${nextWorkData.Subtitle}</p>
              <p class="text-xs text-gray-500">(${nextWorkData.Subtitle2})</p>
            </div>
          ` : `
            <div class="preview-card text-center px-4 py-6 bg-gray-50/80 backdrop-blur-sm rounded-xl border-2 border-dashed border-gray-300/50 w-48">
              <div class="text-sm text-gray-400 font-medium">Nessuna opera successiva</div>
            </div>
          `}
        </div>
      </div>
    `;

    // Update progress
    if (progressIndicator) {
      progressIndicator.textContent = `${this.currentModalIndex + 1} di ${this.allWorks.length}`;
    }

    // Add navigation listeners
    this._addNavigationListeners();
    this._addMapFocusListeners();
  }

  _renderMainCard(work) {
    const firstEntry = work.allEntries[0];
    const metadataInfo = this._renderCombinedMetadata(firstEntry);
    const spacesSection = this._renderGeographicalSpaces(work);

    return `
      <div class="p-8 space-y-8 w-full">
        <!-- Enhanced Header Section -->
        <div class="modal-header bg-gradient-to-r from-slate-50/90 to-gray-50/90 backdrop-blur-sm rounded-2xl p-8 ring-1 ring-gray-200/50 border border-gray-200/30">
          <div class="flex items-start justify-between">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-3 mb-4">
                <div class="w-1 h-12 bg-gradient-to-b from-secondary-500 to-secondary-600 rounded-full shadow-sm flex-shrink-0"></div>
                <div class="min-w-0 flex-1">
                  <h1 class="text-3xl font-bold text-gray-900 leading-tight word-break">${work.Title}</h1>
                  <div class="flex items-center gap-4 mt-2">
                    <p class="text-lg text-gray-700 font-medium truncate">${work.Subtitle ? work.Subtitle : 'Non specificato'}</p>
                    <span class="w-1.5 h-1.5 bg-gray-400 rounded-full flex-shrink-0"></span>
                    <p class="text-lg text-gray-600 font-mono flex-shrink-0">${work.Subtitle2 ? work.Subtitle2 : 'Non specificato'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        ${metadataInfo}
        ${spacesSection}
      </div>
    `;
  }

  _renderCombinedMetadata(firstEntry) {
      const modalFields = this._getModalFields();
      
      if (!modalFields || Object.keys(modalFields).length === 0) {
          return '';
      }

      const metadataData = Object.keys(modalFields)
          .filter(field => {
              const value = firstEntry[field];
              return value != null && value !== '';
          })
          .map(field => {
              const value = firstEntry[field];
              const label = this._getFieldLabel(field);
              let displayValue = value;

              if (Array.isArray(value)) {
                  displayValue = value.join(', ');
              } else if (typeof value === 'string' && value.length > 150) {
                  displayValue = value.substring(0, 147) + '...';
              }

              return `<div class="metadata-card group bg-white/90 hover:bg-white backdrop-blur-sm hover:shadow-lg rounded-xl p-5 ring-1 ring-gray-200/50 hover:ring-gray-300/70 transition-all duration-300 border border-gray-200/30 hover:border-gray-300/50 hover:-translate-y-0.5">
                  <div class="flex items-center gap-3 mb-3">
                      <div class="w-2 h-2 bg-gradient-to-r from-primary-400 to-primary-600 rounded-full group-hover:scale-125 transition-transform duration-300 shadow-sm"></div>
                      <h4 class="text-sm font-semibold text-gray-800 uppercase tracking-wide">${label}</h4>
                  </div>
                  <div class="text-base text-gray-700 leading-relaxed pl-5">${displayValue}</div>
              </div>`;
          }).join('');

      if (!metadataData) return '';

      return `<div>
          <h2 class="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6 text-primary-600">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0-1.125.504-1.125 1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
              Informazioni su questo riferimento
          </h2>
          <div class="grid gap-4">
              ${metadataData}
          </div>
      </div>`;
  }

_renderGeographicalSpaces(work) {
  if (!work["Location"] || work["Location"].length === 0) {
    return `
      <div class="bg-gradient-to-r from-secondary-50/90 to-indigo-50/90 backdrop-blur-sm rounded-2xl p-8 ring-1 ring-secondary-200/50 border border-secondary-200/30">
        <h2 class="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6 text-secondary-600">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
          </svg>
          Location
        </h2>
        <div class="text-gray-500 italic">Nessun spazio geografico disponibile</div>
      </div>
    `;
  }

  const spacesHtml = work["Location"].map((space, index) => {
    const coordinates = work.coordinates[index];
    const geodata = work.geodataBySpace.get(space) || {};
    
    const catalogueFields = this._getCatalogueFields();
    const modalFields = this._getModalFields();
    const geodataFields = this._getGeodataFields();

    const metadataHtml = Object.keys(modalFields)
    .filter(field => {
        return !catalogueFields.includes(field) &&
              geodataFields.includes(field) && 
              geodata[field] != null && 
              geodata[field] !== '';
    })
    .map(field => {
        const value = geodata[field];
        const label = modalFields[field]; 
        let displayValue = value;

        if (typeof value === 'string' && value.length > 100) {
            displayValue = value.substring(0, 97) + '...';
        }

        return `<div class="flex items-start gap-3 py-2">
            <div class="w-1.5 h-1.5 bg-secondary-400 rounded-full mt-2 flex-shrink-0"></div>
            <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2 mb-1">
                    <span class="text-xs font-semibold text-gray-600 uppercase tracking-wide">${label}</span>
                </div>
                <span class="text-sm text-gray-800 break-words">${displayValue}</span>
            </div>
        </div>`;
    }).filter(Boolean).join('');

    const hasCoordinates = coordinates && coordinates.lat && coordinates.lng;
    
    return `
      <div class="space-card bg-white/90 backdrop-blur-sm rounded-xl p-4 sm:p-6 ring-1 ring-gray-200/50 hover:ring-secondary-300/70 transition-all duration-300 hover:shadow-lg border border-gray-200/30 hover:border-secondary-300/50 hover:-translate-y-1">
        <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
          <div class="flex items-start gap-3 min-w-0 flex-1">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="w-5 h-5 text-secondary-600 flex-shrink-0 mt-0.5">
              <path fill-rule="evenodd" d="m7.539 14.841.003.003.002.002a.755.755 0 0 0 .912 0l.002-.002.003-.003.012-.009a5.57 5.57 0 0 0 .19-.153 15.588 15.588 0 0 0 2.046-2.082c1.101-1.362 2.291-3.342 2.291-5.597A5 5 0 0 0 3 7c0 2.255 1.19 4.235 2.292 5.597a15.591 15.591 0 0 0 2.046 2.082 8.916 8.916 0 0 0 .189.153l.012.01ZM8 8.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" clip-rule="evenodd" />
            </svg>
            <h3 class="text-base sm:text-lg font-semibold text-gray-900 break-words">${space}</h3>
          </div>
          
          ${hasCoordinates ? `
            <button class="map-btn group w-full sm:w-auto px-4 py-2 text-sm font-medium bg-gradient-to-r from-secondary-500 to-secondary-600 hover:from-secondary-600 hover:to-secondary-700 active:from-secondary-700 active:to-secondary-800 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 hover:-translate-y-0.5 flex-shrink-0 whitespace-nowrap" 
                    data-lat="${coordinates.lat}" 
                    data-lng="${coordinates.lng}">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="w-4 h-4 inline mr-1">
                <path fill-rule="evenodd" d="M8 1a.75.75 0 0 1 .75.75V6h4.5a.75.75 0 0 1 0 1.5H8.75v4.25a.75.75 0 0 1-1.5 0V7.5H2.75a.75.75 0 0 1 0-1.5h4.5V1.75A.75.75 0 0 1 8 1Z" clip-rule="evenodd" />
              </svg>
              Visualizza sulla mappa
            </button>
          ` : `
            <span class="w-full sm:w-auto px-4 py-2 text-sm font-medium bg-gray-100/80 text-gray-500 rounded-lg ring-1 ring-gray-200/50 backdrop-blur-sm text-center">
              Coordinate non disponibili
            </span>
          `}
        </div>
        
        ${metadataHtml ? `
          <div class="border-t border-gray-100/50 pt-4 mt-4">
            <h4 class="text-sm font-semibold text-gray-700 mb-3">Informazioni su questo luogo</h4>
            <div class="space-y-2 overflow-hidden">
              ${metadataHtml}
            </div>
          </div>
        ` : `
          <div class="border-t border-gray-100/50 pt-4 mt-4">
            <div class="text-sm text-gray-500 italic">Nessuna informazione disponibile per questo luogo</div>
          </div>
        `}
      </div>
    `;
  }).join('');

  return `
    <div class="bg-gradient-to-r from-secondary-50/90 to-indigo-50/90 backdrop-blur-sm rounded-2xl p-4 sm:p-8 ring-1 ring-secondary-200/50 border border-secondary-200/30">
      <h2 class="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-3">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 sm:w-6 sm:h-6 text-secondary-600 flex-shrink-0">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
        </svg>
        <span class="break-words">I luoghi</span>
      </h2>
      <div class="grid gap-4 sm:gap-6">
        ${spacesHtml}
      </div>
      <div class="mt-4 sm:mt-6 text-xs sm:text-sm text-secondary-700 bg-secondary-100/80 backdrop-blur-sm rounded-lg p-3 flex items-start gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="w-4 h-4 flex-shrink-0 mt-0.5">
          <path fill-rule="evenodd" d="M15 8A7 7 0 1 1 1 8a7 7 0 0 1 14 0ZM9 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM6.75 8a.75.75 0 0 0 0 1.5h.75v1.75a.75.75 0 0 0 1.5 0v-2.5A.75.75 0 0 0 8.25 8h-1.5Z" clip-rule="evenodd" />
        </svg>
        <span class="break-words">Clicca sui pulsanti "Visualizza sulla mappa" per vedere i luoghi sulla mappa.</span>
      </div>
    </div>
  `;
}

  _handleFilterOverflow() {
    const container = document.getElementById('filter-badges-container');
    const indicator = document.getElementById('more-filters-indicator');
    
    if (!container || !indicator) return;
    
    const badges = Array.from(container.children);
    if (badges.length === 0) return;
    
    // Check if content is overflowing
    const containerHeight = container.clientHeight;
    let visibleBadges = 0;
    let hiddenCount = 0;
    
    badges.forEach((badge, index) => {
      const badgeRect = badge.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      
      // Check if badge is within the container's visible area
      if (badgeRect.top >= containerRect.top && badgeRect.bottom <= containerRect.bottom) {
        visibleBadges++;
        badge.classList.remove('hidden');
      } else {
        hiddenCount++;
        badge.classList.add('hidden');
      }
    });
    
    // Show indicator if there are hidden badges
    if (hiddenCount > 0) {
      indicator.textContent = `+${hiddenCount} ${hiddenCount === 1 ? 'altro filtro' : 'altri filtri'}`;
      indicator.classList.remove('hidden');
      
      // Add click handler to expand/collapse
      indicator.style.cursor = 'pointer';
      indicator.onclick = () => {
        const isExpanded = container.classList.contains('max-h-none');
        
        if (isExpanded) {
          // Collapse
          container.classList.remove('max-h-none');
          container.classList.add('max-h-[2.5rem]');
          badges.forEach(badge => {
            const badgeRect = badge.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            if (badgeRect.bottom > containerRect.bottom) {
              badge.classList.add('hidden');
            }
          });
          indicator.textContent = `+${hiddenCount} ${hiddenCount === 1 ? 'altro filtro' : 'altri filtri'}`;
        } else {
          // Expand
          container.classList.add('max-h-none');
          container.classList.remove('max-h-[2.5rem]');
          badges.forEach(badge => badge.classList.remove('hidden'));
          indicator.textContent = 'Mostra meno';
        }
      };
    } else {
      indicator.classList.add('hidden');
    }
  }

  _addMapFocusListeners() {
    document.querySelectorAll('.map-btn').forEach(button => {
      button.addEventListener('click', () => {
        const lat = parseFloat(button.getAttribute('data-lat'));
        const lng = parseFloat(button.getAttribute('data-lng'));
        
        if (lat && lng && this.mapFocusCallback) {
          this.mapFocusCallback(lat, lng, 8);
          this._closeModal();
        }
      });
    });
  }

  _extractCoordinates(item, index) {
    let coordinates = { lat: null, lng: null };
    
    if (Array.isArray(item.lat_long) && item.lat_long.length > index) {
      const coordString = item.lat_long[index];
      if (coordString && typeof coordString === 'string') {
        const parts = coordString.split(',');
        if (parts.length === 2) {
          const lat = parseFloat(parts[0].trim());
          const lng = parseFloat(parts[1].trim());
          if (!isNaN(lat) && !isNaN(lng)) {
            coordinates = { lat, lng };
          }
        }
      }
    } else if (item.lat_long && typeof item.lat_long === 'string') {
      const parts = item.lat_long.split(',');
      if (parts.length === 2) {
        const lat = parseFloat(parts[0].trim());
        const lng = parseFloat(parts[1].trim());
        if (!isNaN(lat) && !isNaN(lng)) {
          coordinates = { lat, lng };
        }
      }
    }
    
    return coordinates;
  }
}