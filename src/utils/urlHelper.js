// utils/urlHelper.js
export function getURLParameter(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

export function createMapUrlWithFilter(indexKey, categoryValue) {
  const baseUrl = window.location.origin + '/leda/pages/mappa.html';
  const params = new URLSearchParams();
  params.set('filter', indexKey);
  params.set('value', categoryValue);
  return `${baseUrl}?${params.toString()}`;
}

// =====================================

// utils/dataProcessor.js
export function buildHierarchy(data, indexKey) {
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

export function aggregateDataForIndex(data, indexKey) {
  const aggregatedData = {};
  data.forEach(item => {
    const keyValue = item[indexKey] || 'Non specificato';
    if (!aggregatedData[keyValue]) aggregatedData[keyValue] = [];
    aggregatedData[keyValue].push(item);
  });
  return aggregatedData;
}

export function convertHierarchyToD3Format(obj, name = "root") {
  let children = [];
  let value = 0;

  for (const [key, val] of Object.entries(obj)) {
    if (key === "_items") continue;

    const child = convertHierarchyToD3Format(val, key);
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