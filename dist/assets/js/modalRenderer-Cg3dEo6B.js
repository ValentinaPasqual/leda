const p={showElement(n){n&&(n.classList.remove("hidden"),n.style.opacity="1")},hideElement(n){n&&(n.classList.add("hidden"),n.style.opacity="0")},escapeHtml(n){const e=document.createElement("div");return e.textContent=n,e.innerHTML},waitForGlobal(n,e,t=1e4){if(window[n]){e(window[n]);return}const r=Date.now(),s=setInterval(()=>{window[n]?(clearInterval(s),e(window[n])):Date.now()-r>t&&(clearInterval(s),console.warn(`Timeout waiting for ${n}`))},100)}},x={positionPopup(n,e,t={}){const{offset:r=10,maxWidth:s=288,placement:o="above"}=t,a=e.getBoundingClientRect();n.style.left=`${a.left}px`,o==="above"?n.style.bottom=`${window.innerHeight-a.top+r}px`:n.style.top=`${a.bottom+r}px`,a.left+s>window.innerWidth&&(n.style.left=`${window.innerWidth-s-16}px`)}},y={calculateActiveFiltersCount(n){if(!n||typeof n!="object")return 0;let e=0;for(const t of Object.values(n))Array.isArray(t)?t.length===2&&typeof t[0]=="number"&&typeof t[1]=="number"?e+=1:e+=t.length:t&&typeof t=="object"&&(t.min!==void 0||t.max!==void 0)&&(e+=1);return e},formatRangeFilter(n){return n.min!==void 0&&n.max!==void 0?`${n.min} - ${n.max}`:n.min!==void 0?`≥ ${n.min}`:n.max!==void 0?`≤ ${n.max}`:"Range filter"},getFacetLabel(n,e){var t,r;return(r=(t=e==null?void 0:e.aggregations)==null?void 0:t[n])!=null&&r.title?e.aggregations[n].title:n.replace(/[_-]/g," ").replace(/\b\w/g,s=>s.toUpperCase())}},b={getNotificationClasses(n){const e={success:"bg-green-500 text-white",error:"bg-red-500 text-white",warning:"bg-yellow-500 text-white",info:"bg-primary-500 text-white"};return e[n]||e.info},show(n,e="info",t=3e3){const r=document.createElement("div");r.className=`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-lg ${this.getNotificationClasses(e)} transition-opacity duration-300`,r.textContent=n,document.body.appendChild(r),setTimeout(()=>{r.style.opacity="0",setTimeout(()=>r.remove(),300)},t)}},w={resetFacetsInterface(){const n=document.getElementById("facets-container");n&&(n.querySelectorAll('input[type="checkbox"]').forEach(e=>{e.checked=!1}),n.querySelectorAll('[id$="-slider"]').forEach(e=>{if(e.noUiSlider)try{const t=e.noUiSlider.options.range;e.noUiSlider.set([t.min,t.max]);const r=e.id.replace("-slider",""),s=document.getElementById(`${r}-min-input`),o=document.getElementById(`${r}-max-input`);s&&(s.value=t.min),o&&(o.value=t.max)}catch(t){console.warn(`Failed to reset slider ${e.id}:`,t)}}),n.querySelectorAll(".toggle-btn").forEach(e=>{const t=e.dataset.path,r=n.querySelector(`[data-parent="${t}"]`);r&&r.style.display!=="none"&&(r.style.display="none",e.textContent="▶")}))},clearSearchInput(){const n=["#search-input","#query-input",".search-input",'input[type="search"]','input[placeholder*="search" i]','input[placeholder*="cerca" i]'];for(const e of n){const t=document.querySelector(e);if(t){t.value="",t.dispatchEvent(new Event("input",{bubbles:!0}));return}}}};class v{constructor(e){this.config=e||{},console.log(e)}render(e){if(!e||!e.filters)return"";const t=[];return e.query&&e.query.trim()&&t.push(`
        <div class="inline-flex items-center gap-2 px-3 py-1 bg-secondary-100 text-secondary-800 rounded-full text-sm font-medium">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <span>Ricerca: "${p.escapeHtml(e.query)}"</span>
        </div>
      `),Object.entries(e.filters).forEach(([r,s])=>{var l,c;if(!s)return;const o=(c=(l=this.config)==null?void 0:l.aggregations)==null?void 0:c[r],a=(o==null?void 0:o.title)||r,i=(o==null?void 0:o.type)||"value";if(Array.isArray(s))s.forEach(h=>{t.push(this._buildBadge(a,h,i))});else if(typeof s=="object"){const h=this._formatRangeFilter(s);t.push(this._buildBadge(a,h,"range"))}}),t.length?`<div class="flex flex-wrap gap-2">${t.join("")}</div>`:""}_buildBadge(e,t,r){const s={simple:"bg-blue-100 text-blue-800",taxonomy:"bg-green-100 text-green-800",range:"bg-purple-100 text-purple-800",value:"bg-primary-100 text-primary-800"};return`
      <div class="inline-flex items-center gap-2 px-3 py-1 ${s[r]||s.value} rounded-full text-sm font-medium">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
          <path d="M2 3h12v1l-5 5v4l-2 2v-6L2 4z"/>
        </svg>
        <span>${e}: ${p.escapeHtml(t)}</span>
      </div>
    `}_formatRangeFilter(e){return e.min!==void 0&&e.max!==void 0?`${e.min} - ${e.max}`:e.min!==void 0?`≥ ${e.min}`:e.max!==void 0?`≤ ${e.max}`:"Range"}}class k{constructor(e,t=null){this.mapFocusCallback=e,this.config=t,this.allWorks=[],this.items=[],this.searchState=null,this.isModalOpen=!1,this.currentModalIndex=0,this.isAnimating=!1}setData(e,t){this.allWorks=e,this.items=t}setConfig(e){this.config=e}_getModalFields(){var e;return(e=this.config)!=null&&e.modal_information?this.config.modal_information:{}}_getFieldLabel(e){return this._getModalFields()[e]||e}setSearchState(e){this.searchState=e}_getCompleteWorkData(e){const t=this.items.filter(a=>a.pivot_ID===e);if(t.length===0)return null;const r=t[0],s={pivot_ID:e,Title:r[this.config.result_cards.card_title],Subtitle:r[this.config.result_cards.card_subtitle],Subtitle2:r[this.config.result_cards.card_subtitle_2],Location:[],coordinates:[],allEntries:t,geodataBySpace:new Map},o=new Map;return t.forEach(a=>{a.Location&&(Array.isArray(a.Location)?a.Location:[a.Location]).forEach((l,c)=>{if(!o.has(l)){const h=this._extractCoordinates(a,c);o.set(l,h);const g=this._getGeodataFields(),u={};g.forEach(d=>{a[d]!==void 0&&a[d]!==null&&a[d]!==""&&(Array.isArray(a[d])&&a[d].length>c?u[d]=a[d][c]:Array.isArray(a[d])||(u[d]=a[d]))}),s.geodataBySpace.set(l,u)}})}),s.Location=Array.from(o.keys()),s.coordinates=Array.from(o.values()),s}_getCatalogueFields(){var e,t,r;return((r=(t=(e=this.config)==null?void 0:e.datasetConfig)==null?void 0:t.fields)==null?void 0:r.catalogue)||[]}_getGeodataFields(){var e,t,r;return((r=(t=(e=this.config)==null?void 0:e.datasetConfig)==null?void 0:t.fields)==null?void 0:r.geodata)||[]}_renderSelectedFilters(){const t=new v(this.config).render(this.searchState);return!t||t.trim()===""?'<div class="text-sm text-gray-500 italic">Nessun filtro applicato</div>':`
      <div class="flex items-center gap-2">
        <div class="flex items-center gap-2 flex-wrap max-h-[2.5rem] overflow-hidden" id="filter-badges-container">
          ${t}
        </div>
        <span id="more-filters-indicator" class="hidden text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded-full whitespace-nowrap">
          <!-- Dynamic content -->
        </span>
      </div>
    `}async toggleModal(e){this.isAnimating||(this.isModalOpen?await this._closeModal():(this.currentModalIndex=e,await this._openModal()))}async _openModal(){this.isAnimating=!0;let e=document.getElementById("works-modal");e||(e=this._createModal(),document.body.appendChild(e)),e.classList.remove("hidden"),e.style.opacity="0";const t=e.querySelector(".modal-container");t&&(t.style.transform="scale(0.8) translateY(20px)",t.style.opacity="0"),this._populateModal(),this.isModalOpen=!0,document.body.style.overflow="hidden",e.offsetHeight,e.style.transition="opacity 300ms cubic-bezier(0.4, 0, 0.2, 1)",e.style.opacity="1",t&&(t.style.transition="all 400ms cubic-bezier(0.34, 1.56, 0.64, 1)",t.style.transform="scale(1) translateY(0)",t.style.opacity="1"),setTimeout(()=>{this._animateContentItems(),this.isAnimating=!1},200)}async _closeModal(){if(!this.isModalOpen)return;this.isAnimating=!0;const e=document.getElementById("works-modal");if(e){const t=e.querySelector(".modal-container");e.style.transition="opacity 250ms cubic-bezier(0.4, 0, 1, 1)",e.style.opacity="0",t&&(t.style.transition="all 250ms cubic-bezier(0.4, 0, 1, 1)",t.style.transform="scale(0.95) translateY(-10px)",t.style.opacity="0"),await new Promise(r=>setTimeout(r,250)),e.classList.add("hidden"),e.style.opacity="",t&&(t.style.transform="",t.style.opacity="")}this.isModalOpen=!1,document.body.style.overflow="auto",this.isAnimating=!1}_animateContentItems(){const e=document.querySelector(".modal-header");e&&(e.style.opacity="0",e.style.transform="translateY(-20px)",e.style.transition="all 500ms cubic-bezier(0.4, 0, 0.2, 1)",setTimeout(()=>{e.style.opacity="1",e.style.transform="translateY(0)"},100));const t=document.querySelector(".filters-section");t&&(t.style.opacity="0",t.style.transform="translateY(-10px)",t.style.transition="all 400ms cubic-bezier(0.4, 0, 0.2, 1)",setTimeout(()=>{t.style.opacity="1",t.style.transform="translateY(0)"},150)),document.querySelectorAll(".metadata-card").forEach((o,a)=>{o.style.opacity="0",o.style.transform="translateY(20px)",o.style.transition="all 400ms cubic-bezier(0.4, 0, 0.2, 1)",setTimeout(()=>{o.style.opacity="1",o.style.transform="translateY(0)"},200+a*50)}),document.querySelectorAll(".space-card").forEach((o,a)=>{o.style.opacity="0",o.style.transform="translateX(-20px)",o.style.transition="all 500ms cubic-bezier(0.4, 0, 0.2, 1)",setTimeout(()=>{o.style.opacity="1",o.style.transform="translateX(0)"},300+a*75)})}_createModal(){const e=document.createElement("div");return e.id="works-modal",e.className="fixed inset-0 bg-gradient-to-br from-slate-900/90 to-gray-900/90 backdrop-blur-md z-50 hidden flex items-center justify-center p-4",e.innerHTML=`
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
    `,e.addEventListener("click",t=>{t.target===e&&this._closeModal()}),e.querySelector("#close-modal-btn").addEventListener("click",()=>{this._closeModal()}),document.addEventListener("keydown",t=>{!this.isModalOpen||this.isAnimating||(t.key==="Escape"?this._closeModal():t.key==="ArrowLeft"?this._navigateModal(-1):t.key==="ArrowRight"&&this._navigateModal(1))}),e}async _navigateModal(e){if(this.isAnimating)return;const t=this.currentModalIndex+e;if(t>=0&&t<this.allWorks.length){this.isAnimating=!0;const r=document.getElementById("modal-content");if(!r)return;const s=r.querySelector(".main-content-panel");if(!s)return;const o=document.createElement("div");o.className="relative w-full h-full overflow-hidden";const a=document.createElement("div");a.className="absolute inset-0 w-full h-full transition-transform duration-500 ease-out overflow-y-auto bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200/50 ring-1 ring-white/20",a.innerHTML=s.innerHTML;const i=document.createElement("div");i.className="absolute inset-0 w-full h-full transition-transform duration-500 ease-out overflow-y-auto bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200/50 ring-1 ring-white/20";const l="100%";i.style.transform=`translateX(${e>0?l:`-${l}`})`,this.currentModalIndex=t;const c=this.allWorks[this.currentModalIndex],h=this._getCompleteWorkData(c.pivot_ID);h&&(i.innerHTML=this._renderMainCard(h)),s.parentNode.replaceChild(o,s),o.appendChild(a),o.appendChild(i),this._updateNavigationButtons(),o.offsetHeight,a.style.transform=`translateX(${e>0?`-${l}`:l})`,i.style.transform="translateX(0)",a.style.opacity="0.8",i.style.opacity="1",await new Promise(d=>setTimeout(d,500));const g=document.createElement("div");g.className="main-content-panel flex-1 min-w-0 overflow-y-auto bg-white/95 backdrop-blur-sm rounded-xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-200/50 ring-1 ring-white/20 lg:mx-0 mx-2",g.innerHTML=i.innerHTML,o.parentNode.replaceChild(g,o);const u=document.getElementById("modal-progress");u&&(u.textContent=`${this.currentModalIndex+1} di ${this.allWorks.length}`),this._addMapFocusListeners(),setTimeout(()=>{this._animateContentItems(),this.isAnimating=!1},100)}}_updateNavigationButtons(){const e=document.getElementById("prev-work-btn"),t=document.getElementById("next-work-btn"),r=document.getElementById("mobile-prev-work-btn"),s=document.getElementById("mobile-next-work-btn");e&&(this.currentModalIndex===0?(e.disabled=!0,e.className=e.className.replace("hover:scale-110 hover:-translate-y-1","opacity-40 cursor-not-allowed")):(e.disabled=!1,e.className=e.className.replace("opacity-40 cursor-not-allowed","hover:scale-110 hover:-translate-y-1"))),t&&(this.currentModalIndex===this.allWorks.length-1?(t.disabled=!0,t.className=t.className.replace("hover:scale-110 hover:-translate-y-1","opacity-40 cursor-not-allowed")):(t.disabled=!1,t.className=t.className.replace("opacity-40 cursor-not-allowed","hover:scale-110 hover:-translate-y-1"))),r&&(r.disabled=this.currentModalIndex===0),s&&(s.disabled=this.currentModalIndex===this.allWorks.length-1),this._updatePreviewCards()}_updatePreviewCards(){const e=this.currentModalIndex>0?this.allWorks[this.currentModalIndex-1]:null,t=this.currentModalIndex<this.allWorks.length-1?this.allWorks[this.currentModalIndex+1]:null,r=e?this._getCompleteWorkData(e.pivot_ID):null,s=t?this._getCompleteWorkData(t.pivot_ID):null,o=document.querySelector(".left-nav-panel .preview-card");o&&(r?(o.className="preview-card text-center bg-white/90 backdrop-blur-sm rounded-xl shadow-lg ring-1 ring-gray-200/50 border border-gray-200/30 px-4 py-6 w-48 transition-all duration-300 hover:shadow-xl hover:-translate-y-1",o.innerHTML=`
          <div class="w-12 h-1 bg-gradient-to-r from-secondary-400 to-secondary-600 rounded-full mx-auto mb-4"></div>
          <h4 class="text-sm font-semibold text-gray-800 leading-relaxed mb-2">${r.Title}</h4>
          <p class="text-xs text-gray-600 font-medium">${r.Subtitle}</p>
          <p class="text-xs text-gray-500">(${r.Subtitle2})</p>
        `):(o.className="preview-card text-center px-4 py-6 bg-gray-50/80 backdrop-blur-sm rounded-xl border-2 border-dashed border-gray-300/50 w-48",o.innerHTML='<div class="text-sm text-gray-400 font-medium">Nessuna opera precedente</div>'));const a=document.querySelector(".right-nav-panel .preview-card");a&&(s?(a.className="preview-card text-center px-4 py-6 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg ring-1 ring-gray-200/50 border border-gray-200/30 w-48 transition-all duration-300 hover:shadow-xl hover:-translate-y-1",a.innerHTML=`
          <div class="w-12 h-1 bg-gradient-to-r from-secondary-400 to-secondary-600 rounded-full mx-auto mb-4"></div>
          <h4 class="text-sm font-semibold text-gray-800 leading-relaxed mb-2">${s.Title}</h4>
          <p class="text-xs text-gray-600 font-medium">${s.Subtitle}</p>
          <p class="text-xs text-gray-500">(${s.Subtitle2})</p>
        `):(a.className="preview-card text-center px-4 py-6 bg-gray-50/80 backdrop-blur-sm rounded-xl border-2 border-dashed border-gray-300/50 w-48",a.innerHTML='<div class="text-sm text-gray-400 font-medium">Nessuna opera successiva</div>'))}_addNavigationListeners(){const e=document.getElementById("prev-work-btn"),t=document.getElementById("next-work-btn"),r=document.getElementById("mobile-prev-work-btn"),s=document.getElementById("mobile-next-work-btn");e&&this.currentModalIndex>0&&e.addEventListener("click",()=>this._navigateModal(-1)),t&&this.currentModalIndex<this.allWorks.length-1&&t.addEventListener("click",()=>this._navigateModal(1)),r&&this.currentModalIndex>0&&r.addEventListener("click",()=>this._navigateModal(-1)),s&&this.currentModalIndex<this.allWorks.length-1&&s.addEventListener("click",()=>this._navigateModal(1))}_populateModal(){const e=document.getElementById("modal-content"),t=document.getElementById("modal-progress"),r=document.querySelector(".filters-section");if(!e)return;r&&(r.innerHTML=this._renderSelectedFilters(),setTimeout(()=>this._handleFilterOverflow(),100));const s=this.allWorks[this.currentModalIndex],o=this._getCompleteWorkData(s.pivot_ID),a=this.currentModalIndex>0?this.allWorks[this.currentModalIndex-1]:null,i=this.currentModalIndex<this.allWorks.length-1?this.allWorks[this.currentModalIndex+1]:null,l=a?this._getCompleteWorkData(a.pivot_ID):null,c=i?this._getCompleteWorkData(i.pivot_ID):null;if(!o){e.innerHTML='<div class="flex items-center justify-center h-full text-gray-500 text-lg">Dati non disponibili</div>';return}e.innerHTML=`
      <div class="flex h-full w-full">
        <!-- Enhanced Left Navigation Panel with fixed width (hidden on mobile) -->
        <div class="left-nav-panel hidden lg:flex flex-col items-center justify-center p-6 space-y-6 w-64 flex-shrink-0">
          <button id="prev-work-btn" class="group p-4 bg-white/90 hover:bg-white active:bg-gray-50 rounded-2xl text-gray-600 hover:text-secondary-600 transition-all duration-300 shadow-lg hover:shadow-xl ring-1 ring-gray-200/50 hover:ring-secondary-200 backdrop-blur-sm border border-gray-200/30 ${this.currentModalIndex===0?"opacity-40 cursor-not-allowed":"hover:scale-110 hover:-translate-y-1"}" ${this.currentModalIndex===0?"disabled":""}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-7 h-7 group-hover:-translate-x-1 transition-transform duration-300">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          
          ${l?`
            <div class="preview-card text-center bg-white/90 backdrop-blur-sm rounded-xl shadow-lg ring-1 ring-gray-200/50 border border-gray-200/30 px-4 py-6 w-48 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div class="w-12 h-1 bg-gradient-to-r from-secondary-400 to-secondary-600 rounded-full mx-auto mb-4"></div>
              <h4 class="text-sm font-semibold text-gray-800 leading-relaxed mb-2">${l.Title}</h4>
              <p class="text-xs text-gray-600 font-medium">${l.Subtitle}</p>
              <p class="text-xs text-gray-500">(${l.Subtitle2})</p>
            </div>
          `:`
            <div class="preview-card text-center px-4 py-6 bg-gray-50/80 backdrop-blur-sm rounded-xl border-2 border-dashed border-gray-300/50 w-48">
              <div class="text-sm text-gray-400 font-medium">Nessuna opera precedente</div>
            </div>
          `}
        </div>

        <!-- Enhanced Main Content Area with fixed flex properties (full width on mobile) -->
        <div class="main-content-panel flex-1 min-w-0 overflow-y-auto bg-white/95 backdrop-blur-sm rounded-xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-200/50 ring-1 ring-white/20 lg:mx-0 mx-2">
          ${this._renderMainCard(o)}
        </div>

        <!-- Enhanced Right Navigation Panel with fixed width (hidden on mobile) -->
        <div class="right-nav-panel hidden lg:flex flex-col items-center justify-center p-6 space-y-6 w-64 flex-shrink-0">
          <button id="next-work-btn" class="group p-4 bg-white/90 hover:bg-white active:bg-gray-50 rounded-2xl text-gray-600 hover:text-secondary-600 transition-all duration-300 shadow-lg hover:shadow-xl ring-1 ring-gray-200/50 hover:ring-secondary-200 backdrop-blur-sm border border-gray-200/30 ${this.currentModalIndex===this.allWorks.length-1?"opacity-40 cursor-not-allowed":"hover:scale-110 hover:-translate-y-1"}" ${this.currentModalIndex===this.allWorks.length-1?"disabled":""}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-7 h-7 group-hover:translate-x-1 transition-transform duration-300">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
          
          ${c?`
            <div class="preview-card text-center px-4 py-6 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg ring-1 ring-gray-200/50 border border-gray-200/30 w-48 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div class="w-12 h-1 bg-gradient-to-r from-secondary-400 to-secondary-600 rounded-full mx-auto mb-4"></div>
              <h4 class="text-sm font-semibold text-gray-800 leading-relaxed mb-2">${c.Title}</h4>
              <p class="text-xs text-gray-600 font-medium">${c.Subtitle}</p>
              <p class="text-xs text-gray-500">(${c.Subtitle2})</p>
            </div>
          `:`
            <div class="preview-card text-center px-4 py-6 bg-gray-50/80 backdrop-blur-sm rounded-xl border-2 border-dashed border-gray-300/50 w-48">
              <div class="text-sm text-gray-400 font-medium">Nessuna opera successiva</div>
            </div>
          `}
        </div>
      </div>
    `,t&&(t.textContent=`${this.currentModalIndex+1} di ${this.allWorks.length}`),this._addNavigationListeners(),this._addMapFocusListeners()}_renderMainCard(e){const t=e.allEntries[0],r=this._renderCombinedMetadata(t),s=this._renderGeographicalSpaces(e);return`
      <div class="p-8 space-y-8 w-full">
        <!-- Enhanced Header Section -->
        <div class="modal-header bg-gradient-to-r from-slate-50/90 to-gray-50/90 backdrop-blur-sm rounded-2xl p-8 ring-1 ring-gray-200/50 border border-gray-200/30">
          <div class="flex items-start justify-between">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-3 mb-4">
                <div class="w-1 h-12 bg-gradient-to-b from-secondary-500 to-secondary-600 rounded-full shadow-sm flex-shrink-0"></div>
                <div class="min-w-0 flex-1">
                  <h1 class="text-3xl font-bold text-gray-900 leading-tight word-break">${e.Title}</h1>
                  <div class="flex items-center gap-4 mt-2">
                    <p class="text-lg text-gray-700 font-medium truncate">${e.Subtitle?e.Subtitle:"Non specificato"}</p>
                    <span class="w-1.5 h-1.5 bg-gray-400 rounded-full flex-shrink-0"></span>
                    <p class="text-lg text-gray-600 font-mono flex-shrink-0">${e.Subtitle2?e.Subtitle2:"Non specificato"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        ${r}
        ${s}
      </div>
    `}_renderCombinedMetadata(e){const t=this._getModalFields();if(!t||Object.keys(t).length===0)return"";const r=Object.keys(t).filter(s=>{const o=e[s];return o!=null&&o!==""}).map(s=>{const o=e[s],a=this._getFieldLabel(s);let i=o;return Array.isArray(o)?i=o.join(", "):typeof o=="string"&&o.length>150&&(i=o.substring(0,147)+"..."),`<div class="metadata-card group bg-white/90 hover:bg-white backdrop-blur-sm hover:shadow-lg rounded-xl p-5 ring-1 ring-gray-200/50 hover:ring-gray-300/70 transition-all duration-300 border border-gray-200/30 hover:border-gray-300/50 hover:-translate-y-0.5">
                  <div class="flex items-center gap-3 mb-3">
                      <div class="w-2 h-2 bg-gradient-to-r from-primary-400 to-primary-600 rounded-full group-hover:scale-125 transition-transform duration-300 shadow-sm"></div>
                      <h4 class="text-sm font-semibold text-gray-800 uppercase tracking-wide">${a}</h4>
                  </div>
                  <div class="text-base text-gray-700 leading-relaxed pl-5">${i}</div>
              </div>`}).join("");return r?`<div>
          <h2 class="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6 text-primary-600">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0-1.125.504-1.125 1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
              Informazioni su questo riferimento
          </h2>
          <div class="grid gap-4">
              ${r}
          </div>
      </div>`:""}_renderGeographicalSpaces(e){return!e.Location||e.Location.length===0?`
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
    `:`
    <div class="bg-gradient-to-r from-secondary-50/90 to-indigo-50/90 backdrop-blur-sm rounded-2xl p-4 sm:p-8 ring-1 ring-secondary-200/50 border border-secondary-200/30">
      <h2 class="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-3">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 sm:w-6 sm:h-6 text-secondary-600 flex-shrink-0">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
        </svg>
        <span class="break-words">I luoghi</span>
      </h2>
      <div class="grid gap-4 sm:gap-6">
        ${e.Location.map((r,s)=>{const o=e.coordinates[s],a=e.geodataBySpace.get(r)||{},i=this._getCatalogueFields(),l=this._getModalFields(),c=this._getGeodataFields(),h=Object.keys(l).filter(u=>!i.includes(u)&&c.includes(u)&&a[u]!=null&&a[u]!=="").map(u=>{const d=a[u],f=l[u];let m=d;return typeof d=="string"&&d.length>100&&(m=d.substring(0,97)+"..."),`<div class="flex items-start gap-3 py-2">
            <div class="w-1.5 h-1.5 bg-secondary-400 rounded-full mt-2 flex-shrink-0"></div>
            <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2 mb-1">
                    <span class="text-xs font-semibold text-gray-600 uppercase tracking-wide">${f}</span>
                </div>
                <span class="text-sm text-gray-800 break-words">${m}</span>
            </div>
        </div>`}).filter(Boolean).join(""),g=o&&o.lat&&o.lng;return`
      <div class="space-card bg-white/90 backdrop-blur-sm rounded-xl p-4 sm:p-6 ring-1 ring-gray-200/50 hover:ring-secondary-300/70 transition-all duration-300 hover:shadow-lg border border-gray-200/30 hover:border-secondary-300/50 hover:-translate-y-1">
        <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
          <div class="flex items-start gap-3 min-w-0 flex-1">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="w-5 h-5 text-secondary-600 flex-shrink-0 mt-0.5">
              <path fill-rule="evenodd" d="m7.539 14.841.003.003.002.002a.755.755 0 0 0 .912 0l.002-.002.003-.003.012-.009a5.57 5.57 0 0 0 .19-.153 15.588 15.588 0 0 0 2.046-2.082c1.101-1.362 2.291-3.342 2.291-5.597A5 5 0 0 0 3 7c0 2.255 1.19 4.235 2.292 5.597a15.591 15.591 0 0 0 2.046 2.082 8.916 8.916 0 0 0 .189.153l.012.01ZM8 8.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" clip-rule="evenodd" />
            </svg>
            <h3 class="text-base sm:text-lg font-semibold text-gray-900 break-words">${r}</h3>
          </div>
          
          ${g?`
            <button class="map-btn group w-full sm:w-auto px-4 py-2 text-sm font-medium bg-gradient-to-r from-secondary-500 to-secondary-600 hover:from-secondary-600 hover:to-secondary-700 active:from-secondary-700 active:to-secondary-800 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 hover:-translate-y-0.5 flex-shrink-0 whitespace-nowrap" 
                    data-lat="${o.lat}" 
                    data-lng="${o.lng}">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="w-4 h-4 inline mr-1">
                <path fill-rule="evenodd" d="M8 1a.75.75 0 0 1 .75.75V6h4.5a.75.75 0 0 1 0 1.5H8.75v4.25a.75.75 0 0 1-1.5 0V7.5H2.75a.75.75 0 0 1 0-1.5h4.5V1.75A.75.75 0 0 1 8 1Z" clip-rule="evenodd" />
              </svg>
              Visualizza sulla mappa
            </button>
          `:`
            <span class="w-full sm:w-auto px-4 py-2 text-sm font-medium bg-gray-100/80 text-gray-500 rounded-lg ring-1 ring-gray-200/50 backdrop-blur-sm text-center">
              Coordinate non disponibili
            </span>
          `}
        </div>
        
        ${h?`
          <div class="border-t border-gray-100/50 pt-4 mt-4">
            <h4 class="text-sm font-semibold text-gray-700 mb-3">Informazioni su questo luogo</h4>
            <div class="space-y-2 overflow-hidden">
              ${h}
            </div>
          </div>
        `:`
          <div class="border-t border-gray-100/50 pt-4 mt-4">
            <div class="text-sm text-gray-500 italic">Nessuna informazione disponibile per questo luogo</div>
          </div>
        `}
      </div>
    `}).join("")}
      </div>
      <div class="mt-4 sm:mt-6 text-xs sm:text-sm text-secondary-700 bg-secondary-100/80 backdrop-blur-sm rounded-lg p-3 flex items-start gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="w-4 h-4 flex-shrink-0 mt-0.5">
          <path fill-rule="evenodd" d="M15 8A7 7 0 1 1 1 8a7 7 0 0 1 14 0ZM9 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM6.75 8a.75.75 0 0 0 0 1.5h.75v1.75a.75.75 0 0 0 1.5 0v-2.5A.75.75 0 0 0 8.25 8h-1.5Z" clip-rule="evenodd" />
        </svg>
        <span class="break-words">Clicca sui pulsanti "Visualizza sulla mappa" per vedere i luoghi sulla mappa.</span>
      </div>
    </div>
  `}_handleFilterOverflow(){const e=document.getElementById("filter-badges-container"),t=document.getElementById("more-filters-indicator");if(!e||!t)return;const r=Array.from(e.children);if(r.length===0)return;e.clientHeight;let s=0;r.forEach((o,a)=>{const i=o.getBoundingClientRect(),l=e.getBoundingClientRect();i.top>=l.top&&i.bottom<=l.bottom?o.classList.remove("hidden"):(s++,o.classList.add("hidden"))}),s>0?(t.textContent=`+${s} ${s===1?"altro filtro":"altri filtri"}`,t.classList.remove("hidden"),t.style.cursor="pointer",t.onclick=()=>{e.classList.contains("max-h-none")?(e.classList.remove("max-h-none"),e.classList.add("max-h-[2.5rem]"),r.forEach(a=>{const i=a.getBoundingClientRect(),l=e.getBoundingClientRect();i.bottom>l.bottom&&a.classList.add("hidden")}),t.textContent=`+${s} ${s===1?"altro filtro":"altri filtri"}`):(e.classList.add("max-h-none"),e.classList.remove("max-h-[2.5rem]"),r.forEach(a=>a.classList.remove("hidden")),t.textContent="Mostra meno")}):t.classList.add("hidden")}_addMapFocusListeners(){document.querySelectorAll(".map-btn").forEach(e=>{e.addEventListener("click",()=>{const t=parseFloat(e.getAttribute("data-lat")),r=parseFloat(e.getAttribute("data-lng"));t&&r&&this.mapFocusCallback&&(this.mapFocusCallback(t,r,8),this._closeModal())})})}_extractCoordinates(e,t){let r={lat:null,lng:null};if(Array.isArray(e.lat_long)&&e.lat_long.length>t){const s=e.lat_long[t];if(s&&typeof s=="string"){const o=s.split(",");if(o.length===2){const a=parseFloat(o[0].trim()),i=parseFloat(o[1].trim());!isNaN(a)&&!isNaN(i)&&(r={lat:a,lng:i})}}}else if(e.lat_long&&typeof e.lat_long=="string"){const s=e.lat_long.split(",");if(s.length===2){const o=parseFloat(s[0].trim()),a=parseFloat(s[1].trim());!isNaN(o)&&!isNaN(a)&&(r={lat:o,lng:a})}}return r}}export{p as D,v as F,k as M,b as N,x as P,w as R,y as a};
