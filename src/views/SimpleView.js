// views/SimpleView.js
import { createMapUrlWithFilter } from '../utils/urlHelper.js';

export class SimpleView {
  constructor(data, indexKey) {
    this.data = data;
    this.indexKey = indexKey;
    this.aggregatedData = this.aggregateDataForIndex(data, indexKey);
  }

  // Funzione per aggregare dati semplici (spostata qui da dataProcessor)
  aggregateDataForIndex(data, indexKey) {
    const aggregatedData = {};
    data.forEach(item => {
      const keyValue = item[indexKey] || 'Non specificato';
      if (!aggregatedData[keyValue]) aggregatedData[keyValue] = [];
      aggregatedData[keyValue].push(item);
    });
    return aggregatedData;
  }

  toggleAccordion(id) {
    const content = document.getElementById(`accordion-body-${id}`);
    const chevron = document.getElementById(`chevron-${id}`);
    if (!content || !chevron) return;
    content.classList.toggle('hidden');
    chevron.classList.toggle('rotate-180');
  }

  generateAccordionList() {
    const container = document.createElement('div');
    container.className = 'max-w-4xl mx-auto py-8 space-y-3';
    let counter = 0;

    Object.entries(this.aggregatedData)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([key, items]) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'border border-gray-200 rounded-lg shadow-sm';

        // Header
        const header = document.createElement('button');
        header.type = 'button';
        header.className =
          'flex items-center justify-between w-full p-4 font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-t-lg';
        header.setAttribute('aria-expanded', 'false');
        header.setAttribute('aria-controls', `accordion-body-${counter}`);
        header.onclick = () => this.toggleAccordion(counter);

        // Titolo
        const title = document.createElement('span');
        title.textContent = `${key} (${items.length})`;

        // Pulsante mappa + freccia
        const right = document.createElement('div');
        right.className = 'flex items-center space-x-3';

        const mapButton = document.createElement('a');
        mapButton.href = createMapUrlWithFilter(this.indexKey, key);
        mapButton.className = 'px-3 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700';
        mapButton.textContent = 'Mappa';
        mapButton.onclick = e => e.stopPropagation();
        right.appendChild(mapButton);

        const chevron = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        chevron.setAttribute('id', `chevron-${counter}`);
        chevron.setAttribute('class', 'w-4 h-4 transform transition-transform');
        chevron.setAttribute('fill', 'none');
        chevron.setAttribute('stroke', 'currentColor');
        chevron.setAttribute('viewBox', '0 0 24 24');
        chevron.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />';
        right.appendChild(chevron);

        header.appendChild(title);
        header.appendChild(right);

        // Corpo accordion
        const content = document.createElement('div');
        content.id = `accordion-body-${counter}`;
        content.className = 'hidden p-4 border-t border-gray-200 bg-white space-y-1';

        const uniqueValues = [...new Set(items.map(i => i.Location || i.Name || 'Senza nome'))];
        uniqueValues.forEach(val => {
          const count = items.filter(i => (i.Location || i.Name) === val).length;
          const entry = document.createElement('div');
          entry.textContent = `${val} (${count})`;
          content.appendChild(entry);
        });

        itemDiv.appendChild(header);
        itemDiv.appendChild(content);
        container.appendChild(itemDiv);
        counter++;
      });

    return container;
  }

  render(container) {
    const accordionList = this.generateAccordionList();
    container.appendChild(accordionList);
  }
}