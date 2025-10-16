// utils/ViewComponents.js
import { createMapUrlWithFilter } from './urlHelper.js';

/**
 * Componenti UI riutilizzabili per le viste
 */
export class ViewComponents {
  
  /**
   * Crea un badge con conteggio
   */
  static createCountBadge(count, className = '') {
    const badge = document.createElement('span');
    badge.className = `text-secondary-500 bg-secondary-100 px-3 py-1 rounded-full text-sm font-medium ${className}`;
    badge.textContent = count.toString();
    return badge;
  }

  /**
   * Crea un'icona chevron per accordion
   */
  static createChevron(isExpanded = false) {
    const chevron = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    chevron.setAttribute('class', `w-5 h-5 text-slate-400 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`);
    chevron.setAttribute('fill', 'none');
    chevron.setAttribute('stroke', 'currentColor');
    chevron.setAttribute('viewBox', '0 0 24 24');
    chevron.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>';
    return chevron;
  }

  /**
   * Crea il bottone mappa
   */
  static createMapButton(indexKey, filterValue, onClick = null) {
    const button = document.createElement('button');
    button.className = 'p-2 text-secondary-600 hover:text-secondary-700 hover:bg-secondary-50 rounded';
    button.innerHTML = `
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
      </svg>
    `;
    button.onclick = (e) => {
      e.stopPropagation();
      if (onClick) {
        onClick(filterValue);
      } else {
        window.location.href = createMapUrlWithFilter(indexKey, filterValue);
      }
    };
    button.title = `Visualizza sulla mappa`;
    return button;
  }

  /**
   * Crea l'header di un accordion item
   */
  static createAccordionHeader(config) {
    const {
      title,
      subtitle = null,
      count,
      indexKey,
      filterValue,
      onToggle,
      onMapClick,
      isExpanded = false,
      customClasses = '',
      titleClasses = 'font-semibold text-lg text-primary-900'
    } = config;

    const header = document.createElement('div');
    header.className = `flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 ${customClasses}`;

    // Lato sinistro: titolo e sottotitolo
    const left = document.createElement('div');
    left.className = 'flex items-center space-x-4 flex-1 min-w-0';

    const info = document.createElement('div');
    info.className = 'min-w-0 flex-1';
    info.innerHTML = `
      <div class="${titleClasses} truncate">${title}</div>
      ${subtitle ? `<div class="text-sm text-slate-600">${subtitle}</div>` : ''}
    `;

    left.appendChild(info);

    // Lato destro: badge, chevron, bottone mappa
    const right = document.createElement('div');
    right.className = 'flex items-center space-x-3 flex-shrink-0';

    const badge = this.createCountBadge(count);
    const chevron = this.createChevron(isExpanded);
    const mapButton = this.createMapButton(indexKey, filterValue, onMapClick);

    right.appendChild(badge);
    right.appendChild(chevron);
    right.appendChild(mapButton);

    header.appendChild(left);
    header.appendChild(right);

    // Click handler per toggle
    header.onclick = (e) => {
      if (e.target === mapButton || e.target.closest('button') === mapButton) return;
      if (onToggle) onToggle();
    };

    return { header, chevron };
  }

  /**
   * Crea un accordion item completo
   */
  static createAccordionItem(config) {
    const {
      id,
      title,
      subtitle,
      count,
      indexKey,
      filterValue,
      content,
      onToggle,
      onMapClick,
      isExpanded = false,
      customClasses = '',
      titleClasses = 'font-semibold text-lg text-primary-900'
    } = config;

    const container = document.createElement('div');
    container.className = 'border-b border-slate-200 last:border-b-0';

    const { header, chevron } = this.createAccordionHeader({
      title,
      subtitle,
      count,
      indexKey,
      filterValue,
      onMapClick,
      isExpanded,
      customClasses,
      titleClasses,
      onToggle: () => {
        const contentEl = document.getElementById(id);
        if (contentEl && chevron) {
          contentEl.classList.toggle('hidden');
          chevron.classList.toggle('rotate-180');
          if (onToggle) onToggle(id, !contentEl.classList.contains('hidden'));
        }
      }
    });

    const contentWrapper = document.createElement('div');
    contentWrapper.id = id;
    contentWrapper.className = `accordion-content bg-slate-50 ${isExpanded ? '' : 'hidden'}`;
    contentWrapper.appendChild(content);

    container.appendChild(header);
    container.appendChild(contentWrapper);

    return container;
  }

  /**
   * Crea una tabella di dettaglio location
   */
  static createLocationDetailsTable(items, indexKey, filterValue, options = {}) {
    const {
      showValue = false,
      valueExtractor = null,
      onMapClick = null
    } = options;

    const container = document.createElement('div');
    container.className = 'p-4';

    // Raggruppa per location
    const locationGroups = {};
    items.forEach(item => {
      const location = item.Location || 'Luogo non specificato';
      if (!locationGroups[location]) {
        locationGroups[location] = [];
      }
      locationGroups[location].push(item);
    });

    const sortedLocations = Object.keys(locationGroups).sort();

    if (sortedLocations.length === 0) {
      container.innerHTML = '<div class="text-sm text-slate-500 italic">Nessun elemento disponibile</div>';
      return container;
    }

    // Crea tabella
    const table = document.createElement('div');
    table.className = 'space-y-2';

    // Header
    const headerRow = document.createElement('div');
    headerRow.className = 'flex items-center font-medium text-sm text-slate-700 pb-2 border-b border-slate-200';
    headerRow.innerHTML = `
      ${showValue ? '<div class="w-24 flex-shrink-0">Valore</div>' : ''}
      <div class="flex-1 min-w-0">Luogo</div>
      <div class="w-12 flex-shrink-0 text-center">Qtà.</div>
      <div class="w-16 flex-shrink-0 text-center">Azioni</div>
    `;
    table.appendChild(headerRow);

    // Righe
    sortedLocations.forEach(location => {
      const locationItems = locationGroups[location];
      
      const row = document.createElement('div');
      row.className = 'flex items-center text-sm py-2 hover:bg-white rounded px-2';

      // Valore (opzionale)
      if (showValue && valueExtractor) {
        const valueCell = document.createElement('div');
        valueCell.className = 'w-24 flex-shrink-0 font-medium text-primary-700';
        valueCell.textContent = valueExtractor(locationItems[0]);
        row.appendChild(valueCell);
      }

      // Location
      const locationCell = document.createElement('div');
      locationCell.className = 'flex-1 min-w-0 text-slate-600 truncate';
      locationCell.textContent = location;
      locationCell.title = location;

      // Quantity
      const qtyCell = document.createElement('div');
      qtyCell.className = 'w-12 flex-shrink-0 text-center';
      const qtyBadge = document.createElement('span');
      qtyBadge.className = 'text-secondary-500 bg-secondary-100 px-2 py-0.5 rounded-full text-xs';
      qtyBadge.textContent = locationItems.length.toString();
      qtyCell.appendChild(qtyBadge);

      // Azioni
      const actionCell = document.createElement('div');
      actionCell.className = 'w-16 flex-shrink-0 text-center';
      
      const viewButton = document.createElement('button');
      viewButton.className = 'text-secondary-600 hover:text-secondary-700 p-1 rounded hover:bg-secondary-50';
      viewButton.innerHTML = `
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
        </svg>
      `;
      viewButton.onclick = () => {
        if (onMapClick) {
          onMapClick(filterValue);
        } else {
          window.location.href = createMapUrlWithFilter(indexKey, filterValue);
        }
      };
      viewButton.title = `Visualizza sulla mappa: ${location}`;
      
      actionCell.appendChild(viewButton);

      row.appendChild(locationCell);
      row.appendChild(qtyCell);
      row.appendChild(actionCell);

      table.appendChild(row);
    });

    container.appendChild(table);
    return container;
  }

  /**
   * Crea un bottone tab
   */
  static createTabButton(text, icon, isActive, onClick) {
    const button = document.createElement('button');
    button.className = isActive 
      ? 'flex items-center gap-2 w-full px-3 py-2 text-sm bg-primary-600 text-white rounded hover:bg-primary-700'
      : 'flex items-center gap-2 w-full px-3 py-2 text-sm bg-slate-200 text-slate-700 rounded hover:bg-slate-300';
    button.innerHTML = `<span>${icon}</span><span>${text}</span>`;
    button.onclick = onClick;
    return button;
  }

  /**
   * Crea un container vuoto per "nessun risultato"
   */
  static createEmptyState(message = 'Nessun risultato trovato') {
    const wrapper = document.createElement('div');
    wrapper.className = 'bg-white rounded-lg shadow-sm';
    wrapper.innerHTML = `
      <div class="text-center py-8 text-slate-500 p-6">
        <p>${message}</p>
      </div>
    `;
    return wrapper;
  }
}