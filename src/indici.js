// indici.js

import { loadConfiguration } from './utils/configLoader.js';
import { UniversalNav } from './navigation/universalNav.js';
import { UniversalFooter } from './navigation/universalFooter.js';
import './styles/tailwind.css'
import './styles/fonts.css'

const base = import.meta.env.BASE_URL;

// Funzioni dal tuo codice rinnovate
function generateIndexCards(config) {
    if (!config.aggregations || typeof config.aggregations !== 'object') {
        console.warn('Nessuna configurazione aggregations trovata');
        return null;
    }
    
    const aggregationsArray = Object.entries(config.aggregations).map(([key, value]) => ({
        name: key,
        ...value
    }));
    
    if (aggregationsArray.length === 0) {
        console.warn('Nessuna aggregation trovata');
        return null;
    }
    
    const groupedByCategory = aggregationsArray.reduce((groups, aggregation) => {
        const category = aggregation.category || 'Altre categorie';
        if (!groups[category]) {
            groups[category] = [];
        }
        groups[category].push(aggregation);
        return groups;
    }, {});
    
    const container = document.createElement('div');
    container.className = 'min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 py-12';
    
    const mainContent = document.createElement('div');
    mainContent.className = 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8';
    
    // Container per le categorie
    const categoriesContainer = document.createElement('div');
    categoriesContainer.className = 'space-y-12';
    
    Object.entries(groupedByCategory).forEach(([categoryName, aggregations], categoryIndex) => {
        const categorySection = createCategorySection(categoryName, aggregations, categoryIndex);
        categoriesContainer.appendChild(categorySection);
    });
    
    mainContent.appendChild(categoriesContainer);
    container.appendChild(mainContent);
    
    return container;
}

function createCategorySection(categoryName, aggregations, categoryIndex) {
    const section = document.createElement('div');
    section.className = 'animate-fade-in';
    section.style.animationDelay = `${categoryIndex * 0.1}s`;
    
    // Header della categoria
    const categoryHeader = document.createElement('div');
    categoryHeader.className = 'mb-8';
    
    const categoryTitle = document.createElement('h2');
    categoryTitle.className = 'text-2xl font-bold text-gray-900 mb-2';
    categoryTitle.textContent = categoryName;
    categoryHeader.appendChild(categoryTitle);
    
    const categoryCount = document.createElement('p');
    categoryCount.className = 'text-gray-600';
    categoryCount.textContent = `${aggregations.length} ${aggregations.length === 1 ? 'indice' : 'indici'}`;
    categoryHeader.appendChild(categoryCount);
    
    section.appendChild(categoryHeader);
    
    // Griglia delle card
    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6';
    
    aggregations.forEach((aggregation, index) => {
        const card = createAggregationCard(aggregation, index);
        grid.appendChild(card);
    });
    
    section.appendChild(grid);
    
    return section;
}

function createAggregationCard(aggregation, index) {
    let headerBgClass = 'bg-primary-800';
    let buttonTextColor = 'text-primary-600';
    let buttonHoverBg = 'hover:bg-gradient-to-r hover:from-white hover:to-primary-200';
    
    switch (aggregation.type) {
        case 'simple':
            headerBgClass = 'bg-gradient-to-r from-primary-600 to-primary-800';
            buttonTextColor = 'text-primary-600';
            buttonHoverBg = 'hover:bg-gradient-to-r hover:from-white hover:to-primary-200';
            break;
        case 'range':
            headerBgClass = 'bg-gradient-to-r from-secondary-600 to-secondary-800';
            buttonTextColor = 'text-secondary-600';
            buttonHoverBg = 'hover:bg-gradient-to-r hover:from-white hover:to-secondary-200';
            break;
        case 'taxonomy':
            headerBgClass = 'bg-gradient-to-r from-accent-600 to-accent-800';
            buttonTextColor = 'text-accent-600';
            buttonHoverBg = 'hover:bg-gradient-to-r hover:from-white hover:to-accent-200';
            break;
    }
    
    const card = document.createElement('div');
    card.className = 'bg-white rounded-xl overflow-hidden shadow-lg border border-gray-200 hover:shadow-2xl hover:scale-105 transition-all duration-300 transform group animate-slide-in-up';
    card.style.animationDelay = `${index * 0.1}s`;
    
    // Header con gradiente
    const header = document.createElement('div');
    header.className = `${headerBgClass} p-6 relative overflow-hidden transition-all duration-300`;
    
    // Icona di sfondo dal codice originale
    const backgroundSvg = document.createElement('div');
    backgroundSvg.className = 'absolute right-0 top-0 bottom-0 flex items-center justify-center opacity-15 pointer-events-none group-hover:opacity-25 transition-opacity duration-300';
    backgroundSvg.style.transform = 'translateX(25%)';
    
    let svgContent = '';
    switch (aggregation.type) {
        case 'simple':
            svgContent = `
                <svg viewBox="0 0 100 100" class="w-20 h-20 text-white">
                    <rect x="10" y="20" width="80" height="8" rx="4" fill="currentColor"/>
                    <rect x="10" y="35" width="60" height="8" rx="4" fill="currentColor"/>
                    <rect x="10" y="50" width="70" height="8" rx="4" fill="currentColor"/>
                    <rect x="10" y="65" width="50" height="8" rx="4" fill="currentColor"/>
                    <circle cx="90" cy="24" r="3" fill="currentColor"/>
                    <circle cx="90" cy="39" r="3" fill="currentColor"/>
                    <circle cx="90" cy="54" r="3" fill="currentColor"/>
                    <circle cx="90" cy="69" r="3" fill="currentColor"/>
                </svg>
            `;
            break;
        case 'range':
            svgContent = `
                <svg viewBox="0 0 100 100" class="w-20 h-20 text-white">
                    <line x1="10" y1="85" x2="90" y2="85" stroke="currentColor" stroke-width="2"/>
                    <line x1="10" y1="85" x2="10" y2="15" stroke="currentColor" stroke-width="2"/>
                    <rect x="15" y="65" width="12" height="20" fill="currentColor" rx="2"/>
                    <rect x="32" y="45" width="12" height="40" fill="currentColor" rx="2"/>
                    <rect x="49" y="35" width="12" height="50" fill="currentColor" rx="2"/>
                    <rect x="66" y="55" width="12" height="30" fill="currentColor" rx="2"/>
                    <rect x="83" y="25" width="12" height="60" fill="currentColor" rx="2"/>
                </svg>
            `;
            break;
        case 'taxonomy':
            svgContent = `
                <svg viewBox="0 0 100 100" class="w-20 h-20 text-white">
                    <circle cx="50" cy="20" r="8" fill="currentColor"/>
                    <line x1="50" y1="28" x2="50" y2="40" stroke="currentColor" stroke-width="3"/>
                    <line x1="30" y1="40" x2="70" y2="40" stroke="currentColor" stroke-width="3"/>
                    <line x1="30" y1="40" x2="30" y2="50" stroke="currentColor" stroke-width="3"/>
                    <line x1="70" y1="40" x2="70" y2="50" stroke="currentColor" stroke-width="3"/>
                    <circle cx="30" cy="55" r="6" fill="currentColor"/>
                    <circle cx="70" cy="55" r="6" fill="currentColor"/>
                    <line x1="30" y1="61" x2="30" y2="70" stroke="currentColor" stroke-width="2"/>
                    <line x1="70" y1="61" x2="70" y2="70" stroke="currentColor" stroke-width="2"/>
                    <line x1="20" y1="70" x2="80" y2="70" stroke="currentColor" stroke-width="2"/>
                    <circle cx="20" cy="75" r="4" fill="currentColor"/>
                    <circle cx="40" cy="75" r="4" fill="currentColor"/>
                    <circle cx="60" cy="75" r="4" fill="currentColor"/>
                    <circle cx="80" cy="75" r="4" fill="currentColor"/>
                </svg>
            `;
            break;
        default:
            svgContent = `
                <svg viewBox="0 0 100 100" class="w-20 h-20 text-white">
                    <circle cx="35" cy="35" r="15" fill="none" stroke="currentColor" stroke-width="4"/>
                    <circle cx="35" cy="35" r="6" fill="currentColor"/>
                    <circle cx="65" cy="65" r="20" fill="none" stroke="currentColor" stroke-width="4"/>
                    <circle cx="65" cy="65" r="8" fill="currentColor"/>
                    <rect x="32" y="20" width="6" height="10" fill="currentColor"/>
                    <rect x="32" y="40" width="6" height="10" fill="currentColor"/>
                    <rect x="20" y="32" width="10" height="6" fill="currentColor"/>
                    <rect x="40" y="32" width="10" height="6" fill="currentColor"/>
                </svg>
            `;
    }
    
    backgroundSvg.innerHTML = svgContent;
    header.appendChild(backgroundSvg);
    
    // Titolo
    const title = document.createElement('h3');
    title.className = 'text-xl font-bold text-white mb-2 relative z-10';
    title.textContent = aggregation.title || aggregation.name || 'Categoria';
    header.appendChild(title);
    
    card.appendChild(header);
    
    // Footer con pulsante
    const footer = document.createElement('div');
    footer.className = 'bg-gray-50 px-4 py-3 border-t border-gray-200 flex justify-end';
    
    const link = document.createElement('a');
    const encodedIndex = encodeURIComponent(aggregation.name);
    const encodedView = encodeURIComponent(aggregation.type);
    link.href = `${base}pages/indice.html?index=${encodedIndex}&view=${encodedView}`;
    link.className = `inline-flex items-center justify-center w-8 h-8 bg-white ${buttonTextColor} rounded-full ${buttonHoverBg} transition-all duration-300 shadow-md hover:shadow-lg border border-gray-200 group hover:scale-110`;
    
    const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    arrow.setAttribute('class', 'w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-300');
    arrow.setAttribute('fill', 'none');
    arrow.setAttribute('stroke', 'currentColor');
    arrow.setAttribute('viewBox', '0 0 24 24');
    const arrowPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    arrowPath.setAttribute('stroke-linecap', 'round');
    arrowPath.setAttribute('stroke-linejoin', 'round');
    arrowPath.setAttribute('stroke-width', '2');
    arrowPath.setAttribute('d', 'M13 7l5 5-5 5M6 12h12');
    arrow.appendChild(arrowPath);
    link.appendChild(arrow);
    
    footer.appendChild(link);
    card.appendChild(footer);
    
    return card;
}

// Inizializzazione della pagina
async function initializePage() {
    try {
        const config = await loadConfiguration();

        const universalNav = new UniversalNav(config);
        universalNav.render();

        const universalFooter = new UniversalFooter(config);
        universalFooter.render();
        
        // Genera le schede degli indici
        const indexContainer = document.getElementById('index-cards-container');
        if (indexContainer) {
            const indexSection = generateIndexCards(config);
            if (indexSection) {
                indexContainer.innerHTML = '';
                indexContainer.appendChild(indexSection);
                console.log('Layout a griglia generato con successo');
            } else {
                console.log('Nessuna aggregation trovata nella configurazione');
            }
        } else {
            console.warn('Container per le schede degli indici non trovato');
        }
        
        console.log('Navigation e Footer inizializzati');
        
    } catch (error) {
        console.error('Errore durante l\'inizializzazione:', error);
    }
}

// Avvia l'inizializzazione quando il DOM è pronto
document.addEventListener('DOMContentLoaded', initializePage);