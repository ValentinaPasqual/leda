// documenti.js

import { loadConfiguration } from './utils/configLoader.js';
import { UniversalNav } from './navigation/universalNav.js';
import { UniversalFooter } from './navigation/universalFooter.js';
import './styles/tailwind.css';
import './styles/fonts.css';

const base = import.meta.env.BASE_URL;
const BASE_URL = base || '/';

// Function to fetch all documents from the critical_paths folder
async function fetchCriticalPathsDocuments() {
    try {
        const response = await fetch(`${BASE_URL}data/critical_paths/manifest.json`);
        if (!response.ok) {
            throw new Error('Failed to load documents manifest');
        }
        const documents = await response.json();
        return documents;
    } catch (error) {
        console.error('Error fetching documents:', error);
        return [];
    }
}

// Function to get file icon based on extension
function getFileIcon(fileName) {
    const ext = fileName.split('.').pop().toLowerCase();
    
    const iconConfig = {
        'docx': { color: 'text-primary-700', bg: 'bg-primary-50' },
        'doc': { color: 'text-primary-700', bg: 'bg-primary-50' },
        'pdf': { color: 'text-secondary-700', bg: 'bg-secondary-50' },
        'xlsx': { color: 'text-accent-400', bg: 'bg-accent-50' },
        'xls': { color: 'text-accent-400', bg: 'bg-accent-50' },
        'pptx': { color: 'text-secondary-600', bg: 'bg-secondary-100' },
        'ppt': { color: 'text-secondary-600', bg: 'bg-secondary-100' },
        'txt': { color: 'text-gray-700', bg: 'bg-gray-100' }
    };
    
    const config = iconConfig[ext] || { color: 'text-gray-700', bg: 'bg-gray-100' };
    
    return `
        <div class="w-16 h-16 ${config.bg} rounded-2xl flex items-center justify-center shadow-md transform group-hover:scale-110 transition-transform duration-300">
            <svg class="w-9 h-9 ${config.color}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
            </svg>
        </div>
    `;
}

// Function to create author badges
function createAuthorBadges(authors) {
    if (!authors || authors.length === 0) return '';
    
    const badges = authors.map(author => `
        <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800 border border-primary-200">
            <svg class="w-3 h-3 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/>
            </svg>
            ${author}
        </span>
    `).join('');
    
    return badges;
}

// Function to create keywords badges
function createKeywordsBadges(keywords) {
    if (!keywords || keywords.length === 0) return '';
    
    const badges = keywords.map(keyword => `
        <span class="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-secondary-100 text-secondary-800 border border-secondary-200">
            ${keyword}
        </span>
    `).join('');
    
    return badges;
}

// Function to create document card
function createDocumentCard(doc, index) {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-2xl overflow-hidden shadow-lg border-2 border-primary-100 hover:border-primary-300 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 group animate-slide-in-up break-inside-avoid mb-8';
    card.style.animationDelay = `${index * 0.05}s`;
    
    // Main content container
    const content = document.createElement('div');
    content.className = 'p-6';
    
    // Top section with icon and title side by side
    const topSection = document.createElement('div');
    topSection.className = 'flex items-center gap-4 mb-5';
    
    const iconWrapper = document.createElement('div');
    iconWrapper.innerHTML = getFileIcon(doc.fileName);
    topSection.appendChild(iconWrapper);
    
    const title = document.createElement('h3');
    title.className = 'flex-1 text-xl font-bold text-secondary-800 font-headings leading-tight group-hover:text-secondary-700 transition-colors';
    title.textContent = doc.title || doc.fileName;
    topSection.appendChild(title);
    
    content.appendChild(topSection);

    // Authors section
    if (doc.authors && doc.authors.length > 0) {
        const authorsSection = document.createElement('div');
        authorsSection.className = 'flex flex-wrap gap-2 mb-3';
        authorsSection.innerHTML = createAuthorBadges(doc.authors);
        content.appendChild(authorsSection);
    }

        // Separator (only if there are authors or keywords)
    if ((doc.authors && doc.authors.length > 0) || (doc.keywords && doc.keywords.length > 0)) {
        const separator = document.createElement('div');
        separator.className = 'w-full h-px bg-gray-200 mb-4';
        content.appendChild(separator);
    }
    
    // Keywords section
    if (doc.keywords && doc.keywords.length > 0) {
        const keywordsSection = document.createElement('div');
        keywordsSection.className = 'flex flex-wrap gap-2 mb-4';
        keywordsSection.innerHTML = createKeywordsBadges(doc.keywords);
        content.appendChild(keywordsSection);
    }
    
    // Abstract/Description section
    if (doc.description) {
        const abstractContainer = document.createElement('div');
        abstractContainer.className = 'mb-4 p-4 bg-gradient-to-br from-primary-50 to-accent-50 rounded-xl border border-primary-100';
        
        const abstractLabel = document.createElement('p');
        abstractLabel.className = 'text-xs font-semibold text-primary-700 mb-1.5 uppercase tracking-wide';
        abstractLabel.textContent = 'Abstract';
        abstractContainer.appendChild(abstractLabel);
        
        const description = document.createElement('p');
        description.className = 'text-sm text-gray-700 font-body leading-relaxed';
        description.textContent = doc.description;
        abstractContainer.appendChild(description);
        
        content.appendChild(abstractContainer);
    }
    
    card.appendChild(content);
    
    // Footer with action button
    const footer = document.createElement('div');
    footer.className = 'bg-gradient-to-r from-primary-50 to-accent-50 px-6 py-4 border-t border-primary-100';
    
    const actionLink = document.createElement('a');
    actionLink.href = `${BASE_URL}pages/percorso.html?name=${doc.fileName}`;
    actionLink.className = 'inline-flex items-center justify-center w-full px-4 py-3 bg-gradient-to-r from-primary-700 to-primary-600 text-white text-sm font-bold rounded-xl hover:from-primary-800 hover:to-primary-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 font-body';
    actionLink.innerHTML = `
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
        </svg>
        Leggi il percorso
    `;
    
    footer.appendChild(actionLink);
    card.appendChild(footer);
    
    return card;
}

// Function to generate documents grid
function generateDocumentsGrid(documents) {
    if (!documents || documents.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'text-center py-16';
        emptyState.innerHTML = `
            <div class="w-24 h-24 mx-auto mb-6 bg-primary-50 rounded-full flex items-center justify-center">
                <svg class="w-12 h-12 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
            </div>
            <p class="text-gray-600 text-lg font-body">Nessun documento trovato</p>
        `;
        return emptyState;
    }
    
    const container = document.createElement('div');
    container.className = 'min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 py-16';
    
    const mainContent = document.createElement('div');
    mainContent.className = 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8';
    
    // Header section with decorative elements
    const headerSection = document.createElement('div');
    headerSection.className = 'mb-16 text-center relative';
    
    // Decorative circle
    const decorCircle = document.createElement('div');
    decorCircle.className = 'absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-8 w-32 h-32 bg-gradient-to-br from-primary-200 to-accent-200 rounded-full opacity-20 blur-3xl';
    headerSection.appendChild(decorCircle);
    
    const title = document.createElement('h1');
    title.className = 'text-5xl font-bold text-primary-800 mb-4 font-headings relative';
    title.textContent = 'I percorsi critici';
    headerSection.appendChild(title);
    
    const divider = document.createElement('div');
    divider.className = 'w-24 h-1.5 bg-gradient-to-r from-secondary-500 to-accent-400 mx-auto rounded-full mb-6';
    headerSection.appendChild(divider);
    
    const subtitle = document.createElement('p');
    subtitle.className = 'text-gray-600 text-lg font-body relative';
    subtitle.innerHTML = `<span class="font-semibold text-primary-700">${documents.length}</span> ${documents.length === 1 ? 'percorso disponibile' : 'percorsi disponibili'}`;
    headerSection.appendChild(subtitle);
    
    mainContent.appendChild(headerSection);
    
    // Documents masonry grid
    const grid = document.createElement('div');
    grid.className = 'columns-1 md:columns-2 lg:columns-3 gap-8';
    
    documents.forEach((doc, index) => {
        const card = createDocumentCard(doc, index);
        grid.appendChild(card);
    });
    
    mainContent.appendChild(grid);
    container.appendChild(mainContent);
    
    return container;
}

// Initialize page
async function initializePage() {
    try {
        const config = await loadConfiguration();

        const universalNav = new UniversalNav(config);
        universalNav.render();

        const universalFooter = new UniversalFooter(config);
        universalFooter.render();
        
        // Fetch and display documents
        const documentsContainer = document.getElementById('documents-container');
        if (documentsContainer) {
            const documents = await fetchCriticalPathsDocuments();
            const documentsSection = generateDocumentsGrid(documents);
            documentsContainer.innerHTML = '';
            documentsContainer.appendChild(documentsSection);
            console.log(`${documents.length} documenti caricati con successo`);
        } else {
            console.warn('Container per i documenti non trovato');
        }
        
        console.log('Navigation e Footer inizializzati');
        
    } catch (error) {
        console.error('Errore durante l\'inizializzazione:', error);
    }
}

// Start initialization when DOM is ready
document.addEventListener('DOMContentLoaded', initializePage);