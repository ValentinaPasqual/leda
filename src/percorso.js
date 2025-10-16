import * as mammoth from 'mammoth';

const loader = document.getElementById('loader');
const contentDiv = document.getElementById('content');
const pageTitle = document.getElementById('pageTitle');
const mainTitle = document.getElementById('mainTitle');
const currentPath = document.getElementById('currentPath');

const urlParams = new URLSearchParams(window.location.search);
const fileName = urlParams.get('name');

// Usa il base URL di Vite
const BASE_URL = import.meta.env.BASE_URL;

async function loadContent() {
    if (!fileName) {
        showError('Nessun file specificato', 'Aggiungi il parametro ?name=nome_file all\'URL');
        return;
    }

    try {
        // Costruisci il percorso usando BASE_URL
        const filePath = `${BASE_URL}data/critical_paths/${fileName}`;
        
        console.log(`Base URL: ${BASE_URL}`);
        console.log(`Caricamento di: ${filePath}`);

        const response = await fetch(filePath);
        
        if (!response.ok) {
            throw new Error(`File non trovato (HTTP ${response.status}): ${filePath}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        console.log('File caricato, size:', arrayBuffer.byteLength);

        // Verifica signature
        const uint8Array = new Uint8Array(arrayBuffer);
        const signature = String.fromCharCode(uint8Array[0], uint8Array[1]);
        console.log('Signature:', signature);

        if (signature !== 'PK') {
            throw new Error(`File non è un DOCX valido. Signature: "${signature}"`);
        }

        // Converti con Mammoth
        const result = await mammoth.convertToHtml({ arrayBuffer });

        contentDiv.innerHTML = result.value;

        const title = fileName.replace(/_/g, ' ').replace(/-/g, ' ');
        pageTitle.textContent = title;
        mainTitle.textContent = title;
        currentPath.textContent = title;

        if (result.messages.length > 0) {
            console.warn('Warning da Mammoth:', result.messages);
        }

        hideLoader();

    } catch (error) {
        console.error('Errore:', error);
        showError('Errore nel caricamento del file', error.message);
    }
}

function showError(title, message) {
    contentDiv.innerHTML = `
        <div class="error">
            <h2>${title}</h2>
            <p>${escapeHtml(message)}</p>
            <p><strong>File richiesto:</strong> ${fileName || 'Non specificato'}</p>
            <p><strong>Base URL:</strong> ${BASE_URL}</p>
            <p><strong>Percorso completo:</strong> ${BASE_URL}data/critical_paths/${fileName || '[nome]'}.docx</p>
        </div>
    `;
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