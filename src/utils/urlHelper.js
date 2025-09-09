// utils/urlHelper.js

const base = import.meta.env.BASE_URL 

export function getURLParameter(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

export function createMapUrlWithFilter(indexKey, categoryValue) {
  const baseUrl = window.location.origin + base + 'pages/mappa.html';
  const params = new URLSearchParams();
  params.set('filter', indexKey);
  params.set('value', categoryValue);
  return `${baseUrl}?${params.toString()}`;
}