import * as mammoth from 'mammoth';
import { loadConfiguration } from './utils/configLoader.js';
import { parseData } from './utils/dataParser.js';
import { UniversalNav } from './navigation/universalNav.js';
import { UniversalFooter } from './navigation/universalFooter.js';
import { ModalRenderer } from './map_components/references/modalRenderer.js';
import './styles/fonts.css';
import './styles/tailwind.css';

const loader = document.getElementById('loader');
const contentDiv = document.getElementById('content');
const sidePanel = document.getElementById('side-panel');
const sidePanelContent = document.getElementById('side-panel-content');
const closePanelBtn = document.getElementById('close-panel-btn');
const pageTitle = document.getElementById('pageTitle');

const urlParams = new URLSearchParams(window.location.search);
const fileName = urlParams.get('name');
const BASE_URL = import.meta.env.BASE_URL;

// Funzione per recuperare i documenti dal manifest
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

// Funzione per aprire il side panel
function openSidePanel() {
    sidePanel.style.flex = '0 0 33.333%';
    sidePanel.style.width = 'auto';
    sidePanel.style.overflow = 'auto';
    contentDiv.style.flex = '0 0 66.667%';
}

// Funzione per chiudere il side panel
function closeSidePanel() {
    sidePanel.style.flex = '0';
    sidePanel.style.width = '0';
    sidePanel.style.overflow = 'hidden';
    contentDiv.style.flex = '1';
    sidePanelContent.innerHTML = '';
    
    // Reset del colore di tutti i link Titolo
    const titoloLinks = contentDiv.querySelectorAll('a[href*="?filter=Titolo&"]');
    titoloLinks.forEach(link => {
        link.style.color = '';
        link.classList.remove('text-secondary');
    });
}

// Funzione per renderizzare i metadati del documento
function renderDocumentMetadata(documentInfo) {
    const metadataHTML = `
        <div class="p-6">
            <div class="flex items-center gap-4 mb-5">
                <div>
                    <div class="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center shadow-md transform group-hover:scale-110 transition-transform duration-300">
                        <svg class="w-9 h-9 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                        </svg>
                    </div>
                </div>
                <h3 class="flex-1 text-xl font-bold text-secondary-800 font-headings leading-tight group-hover:text-secondary-700 transition-colors">${documentInfo.title}</h3>
            </div>
            <div class="flex flex-wrap gap-2 mb-3">
                ${documentInfo.authors.map(author => `
                    <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800 border border-primary-200">
                        <svg class="w-3 h-3 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path>
                        </svg>
                        ${author}
                    </span>
                `).join('')}
            </div>
            <div class="w-full h-px bg-gray-200 mb-4"></div>
            <div class="flex flex-wrap gap-2 mb-4">
                ${documentInfo.keywords.map(keyword => `
                    <span class="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-secondary-100 text-secondary-800 border border-secondary-200">
                        ${keyword}
                    </span>
                `).join('')}
            </div>
            <div class="mb-4 p-4 bg-gradient-to-br from-primary-50 to-accent-50 rounded-xl border border-primary-100">
                <p class="text-xs font-semibold text-primary-700 mb-1.5 uppercase tracking-wide">Abstract</p>
                <p class="text-sm text-gray-700 font-body leading-relaxed">${documentInfo.description}</p>
            </div>
        </div>
    `;
    return metadataHTML;
}

// Event listener per il pulsante di chiusura
closePanelBtn.addEventListener('click', closeSidePanel);

async function loadContent() {
    const config = await loadConfiguration();
    const jsonData = await parseData();
    const documents = await fetchCriticalPathsDocuments();

    // Nav e Footer universali
    const universalNav = new UniversalNav(config);
    universalNav.render();
    const universalFooter = new UniversalFooter(config);
    universalFooter.render();

    if (!fileName) {
        showError('Nessun file specificato', 'Aggiungi il parametro ?name=nome_file all\'URL');
        return;
    }

    // Trova i metadati del documento corrente
    const currentDocument = documents.find(doc => doc.fileName === fileName);

    try {
        const filePath = `${BASE_URL}data/critical_paths/${fileName}`;
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`File non trovato (HTTP ${response.status}): ${filePath}`);
        }

        const arrayBuffer = await response.arrayBuffer();

        // Mammoth converte il DOCX in HTML
        const result = await mammoth.convertToHtml({ arrayBuffer });
        
        // Aggiungi titolo della pagina
        if (currentDocument) {
            pageTitle.textContent = currentDocument.title;
        }

        // Componi il contenuto con metadati + documento
        let fullContent = '';
        
        if (currentDocument) {
            fullContent += renderDocumentMetadata(currentDocument);
        }
        
        fullContent += result.value;
        contentDiv.innerHTML = fullContent;

        setupFootnotePopups();

        // Trova tutti i link con ?filter=
        const allFilteredLinks = contentDiv.querySelectorAll('a[href*="?filter="]');
        const titoloLinks = contentDiv.querySelectorAll('a[href*="?filter=Titolo&"]');

        const allWorks = jsonData || [];
        const items = jsonData || [];

        console.log(allWorks, items);

        // Stile per tutti i link con ?filter= (NON Titolo)
        allFilteredLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href && !href.includes('?filter=Titolo&')) {
                // Link nero, non cliccabile, non sottolineato
                link.style.color = 'black';
                link.style.textDecoration = 'none';
                link.style.cursor = 'default';
                link.style.pointerEvents = 'none';
                
                // Aggiungi SVG cliccabile (icona mappa)
                const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                svg.setAttribute('width', '16');
                svg.setAttribute('height', '16');
                svg.setAttribute('viewBox', '0 0 24 24');
                svg.setAttribute('fill', 'none');
                svg.setAttribute('stroke', 'currentColor');
                svg.setAttribute('stroke-width', '2');
                svg.style.display = 'inline-block';
                svg.style.marginLeft = '4px';
                svg.style.cursor = 'pointer';
                svg.style.verticalAlign = 'super';
                svg.style.fontSize = '0.5em';
                svg.classList.add('text-secondary-500');
                
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('stroke-linecap', 'round');
                path.setAttribute('stroke-linejoin', 'round');
                path.setAttribute('d', 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7');
                svg.appendChild(path);
                
                // L'SVG apre il link
                svg.addEventListener('click', (e) => {
                    e.stopPropagation();
                    window.open(href, '_blank', 'noopener,noreferrer');
                });
                
                link.parentNode.insertBefore(svg, link.nextSibling);
            }
        });

        if (titoloLinks.length > 0) {
            const modal = new ModalRenderer(() => {});
            modal.setData(allWorks, items);
            modal.setConfig(config || null);

            console.log(window);

            // Gestione speciale per link con ?filter=Titolo
            titoloLinks.forEach(link => {
                const originalHref = link.getAttribute('href');
                
                // Mantieni sottolineatura
                link.style.textDecoration = 'underline';
                link.style.cursor = 'pointer';
                
                // Aggiungi SVG per navigazione esterna (icona mappa)
                const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                svg.setAttribute('width', '16');
                svg.setAttribute('height', '16');
                svg.setAttribute('viewBox', '0 0 24 24');
                svg.setAttribute('fill', 'none');
                svg.setAttribute('stroke', 'currentColor');
                svg.setAttribute('stroke-width', '2');
                svg.style.display = 'inline-block';
                svg.style.marginLeft = '4px';
                svg.style.cursor = 'pointer';
                svg.style.verticalAlign = 'super';
                svg.style.fontSize = '0.5em';
                svg.classList.add('text-secondary-500');
                
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('stroke-linecap', 'round');
                path.setAttribute('stroke-linejoin', 'round');
                path.setAttribute('d', 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7');
                svg.appendChild(path);
                
                // L'SVG apre il link originale
                svg.addEventListener('click', (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    window.open(originalHref, '_blank', 'noopener,noreferrer');
                });
                
                link.parentNode.insertBefore(svg, link.nextSibling);
                
                // Il link apre la modale
                link.addEventListener('click', event => {
                    event.preventDefault();

                    const url = new URL(link.href, window.location.href);
                    const titoloValue = url.searchParams.get('value');
                    console.log('titoloValue', titoloValue);
                    const matchingItem = items.find(i => i.Titolo?.trim() === titoloValue?.trim());

                    console.log('matchingItem', matchingItem);
                    if (!matchingItem) return;

                    const completeWork = modal._getCompleteWorkData(matchingItem.pivot_ID);
                    if (!completeWork) return;

                    const cardHTML = modal._renderMainCard(completeWork);
                    sidePanelContent.innerHTML = '';
                    const wrapper = document.createElement('div');
                    wrapper.innerHTML = cardHTML;
                    sidePanelContent.appendChild(wrapper);
                    
                    // Gestisci i bottoni mappa nel side panel
                    handleMapButtonsInSidePanel();
                    
                    // Apri il side panel
                    openSidePanel();
                    
                    // Cambia colore a secondary quando modale è aperta
                    titoloLinks.forEach(l => {
                        l.style.color = '';
                        l.classList.remove('text-secondary');
                    });
                    link.classList.add('text-secondary');
                });
            });
        }

        makeLinksOpenInNewTab();
        handleMapButtons();

        hideLoader();
    } catch (error) {
        console.error('Errore:', error);
        showError('Errore nel caricamento del file', error.message);
    }
}

function setupFootnotePopups() {
    // Trova tutti i link alle footnote (mammoth usa anchor links)
    const footnoteLinks = contentDiv.querySelectorAll('a[href^="#footnote-"]');
    const footnoteRefs = contentDiv.querySelectorAll('[id^="footnote-"]');
    
    // Crea un map delle footnote
    const footnoteMap = new Map();
    footnoteRefs.forEach(ref => {
        const id = ref.id;
        const text = ref.textContent.trim();
        footnoteMap.set(id, text);
    });
    
    // Nascondi la sezione delle footnote originali se esiste
    footnoteRefs.forEach(ref => {
        const parent = ref.closest('p');
        if (parent && parent.textContent.match(/^\[\d+\]/)) {
            parent.style.display = 'none';
        }
    });
    
    // Gestisci ogni link alla footnote
    footnoteLinks.forEach(link => {
        const href = link.getAttribute('href');
        const footnoteId = href.substring(1); // Rimuovi il #
        const footnoteText = footnoteMap.get(footnoteId);
        
        if (!footnoteText) return;
        
        // Styling del link - stesso style del badge nel popup
        link.style.position = 'relative';
        link.style.cursor = 'pointer';
        link.style.textDecoration = 'none';
        link.classList.add('footnote-ref');
        
        // Aggiungi classi Tailwind per lo stesso style del badge
        link.className = 'footnote-ref inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-white bg-secondary-500 rounded-full ml-1 hover:bg-secondary-600 transition-colors duration-200';
        link.style.position = 'relative';
        link.style.cursor = 'pointer';
        
        // Rimuovi le parentesi quadre dal numero
        link.textContent = link.textContent.replace(/[\[\]]/g, '');
        
        // Crea il popup
        const popup = document.createElement('div');
        popup.className = 'footnote-popup hidden absolute z-50 bg-white border-2 border-secondary-300 rounded-lg shadow-2xl p-4 w-80';
        popup.style.cssText = `
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%) translateY(-8px);
            animation: fadeIn 0.2s ease-out;
        `;
        
        // Freccia del popup
        const arrow = document.createElement('div');
        arrow.className = 'absolute bg-white border-r-2 border-b-2 border-secondary-300';
        arrow.style.cssText = `
            width: 12px;
            height: 12px;
            bottom: -7px;
            left: 50%;
            transform: translateX(-50%) rotate(45deg);
            transition: left 0.2s, right 0.2s;
        `;
        popup.appendChild(arrow);
        
        // Contenuto del popup
        const content = document.createElement('div');
        content.className = 'text-sm text-gray-700 leading-relaxed';
        content.style.position = 'relative';
        content.style.zIndex = '1';
        content.textContent = footnoteText.replace(/^\[\d+\]\s*/, '');
        popup.appendChild(content);
        
        // Badge con numero della footnote
        const badge = document.createElement('span');
        badge.className = 'inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-white bg-secondary-500 rounded-full mb-2';
        badge.textContent = link.textContent.replace(/[\[\]]/g, '');
        popup.insertBefore(badge, content);
        
        link.appendChild(popup);
        
        // Eventi
        let hideTimeout;
        
        link.addEventListener('mouseenter', () => {
            clearTimeout(hideTimeout);
            popup.classList.remove('hidden');
            
            // Verifica se il popup esce dallo schermo e riposiziona
            requestAnimationFrame(() => {
                const rect = popup.getBoundingClientRect();
                const viewportWidth = window.innerWidth;
                const margin = 16; // Margine dai bordi
                
                // Reset transform
                popup.style.left = '50%';
                popup.style.right = 'auto';
                popup.style.transform = 'translateX(-50%) translateY(-8px)';
                
                // Se esce a sinistra
                if (rect.left < margin) {
                    const linkRect = link.getBoundingClientRect();
                    popup.style.left = `${margin - linkRect.left}px`;
                    popup.style.transform = 'translateY(-8px)';
                    // Sposta la freccia
                    arrow.style.left = `${linkRect.left + linkRect.width / 2 - margin}px`;
                }
                // Se esce a destra
                else if (rect.right > viewportWidth - margin) {
                    const linkRect = link.getBoundingClientRect();
                    popup.style.left = 'auto';
                    popup.style.right = `${margin - (viewportWidth - linkRect.right)}px`;
                    popup.style.transform = 'translateY(-8px)';
                    // Sposta la freccia
                    arrow.style.left = 'auto';
                    arrow.style.right = `${viewportWidth - linkRect.right - linkRect.width / 2 - margin}px`;
                } else {
                    // Centrato, freccia al centro
                    arrow.style.left = '50%';
                    arrow.style.right = 'auto';
                }
            });
        });
        
        link.addEventListener('mouseleave', () => {
            hideTimeout = setTimeout(() => {
                popup.classList.add('hidden');
            }, 200);
        });
        
        popup.addEventListener('mouseenter', () => {
            clearTimeout(hideTimeout);
        });
        
        popup.addEventListener('mouseleave', () => {
            popup.classList.add('hidden');
        });
        
        // Previeni il click default
        link.addEventListener('click', (e) => {
            e.preventDefault();
        });
    });
}


function makeLinksOpenInNewTab() {
    const links = contentDiv.querySelectorAll('a');
    links.forEach(link => {
        const href = link.getAttribute('href');
        if (href && !href.startsWith('#') && !href.startsWith('index.html') && !href.includes('?filter=')) {
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
        }
    });
}

function handleMapButtons() {
    const mapButtons = contentDiv.querySelectorAll('.map-btn');
    mapButtons.forEach(button => {
        // Nascondi il bottone originale
        button.style.display = 'none';
        
        // Trova il valore Location
        const card = button.closest('[data-location]');
        const locationValue = card ? card.getAttribute('data-location') : null;
        
        if (locationValue) {
            // Crea l'icona SVG della mappa
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('width', '16');
            svg.setAttribute('height', '16');
            svg.setAttribute('viewBox', '0 0 24 24');
            svg.setAttribute('fill', 'none');
            svg.setAttribute('stroke', 'currentColor');
            svg.setAttribute('stroke-width', '2');
            svg.style.display = 'inline-block';
            svg.style.marginLeft = '4px';
            svg.style.cursor = 'pointer';
            svg.style.verticalAlign = 'middle';
            svg.classList.add('text-secondary-500');
            
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('stroke-linecap', 'round');
            path.setAttribute('stroke-linejoin', 'round');
            path.setAttribute('d', 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7');
            svg.appendChild(path);
            
            // Aggiungi click handler per aprire la mappa
            svg.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const mapUrl = `mappa.html?filter=Location&value=${encodeURIComponent(locationValue)}`;
                window.open(mapUrl, '_blank', 'noopener,noreferrer');
            });
            
            // Inserisci l'SVG dopo il bottone nascosto
            button.parentNode.insertBefore(svg, button.nextSibling);
        }
    });
}

function handleMapButtonsInSidePanel() {
    const mapButtons = sidePanelContent.querySelectorAll('.map-btn');
    mapButtons.forEach(button => {
        // Nascondi il bottone originale
        button.style.display = 'none';
    });
}

function showError(title, message) {
    const errorContainer = document.getElementById('errorContainer');
    const errorTitle = document.getElementById('errorTitle');
    const errorMessage = document.getElementById('errorMessage');
    
    if (errorContainer && errorTitle && errorMessage) {
        errorTitle.textContent = title;
        errorMessage.innerHTML = `<p class="text-lg mb-2">${escapeHtml(message)}</p>`;
        errorContainer.classList.remove('hidden');
    } else {
        contentDiv.innerHTML = `<div style="color:red;"><strong>${title}:</strong> ${escapeHtml(message)}</div>`;
    }
    hideLoader();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function hideLoader() {
    loader.style.display = 'none';
}

loadContent();