// universalNav.js - Versione con Layout Normale e Overlay su Scroll
import { dirname, join, basename, relative } from 'pathe';

export class UniversalNav {
    constructor(config) {
        this.currentPath = this.normalizePath(window.location.pathname);
        this.config = config;
        this.basePath = this.calculateBasePath();
        this.header = null;
        this.isScrolling = false;
        this.scrollThreshold = 100; // Pixel di scroll prima che diventi overlay
    }

    // Normalizza il path considerando che "/base/" equivale a "/base/index.html"
    normalizePath(path) {
        if (path.endsWith('/')) {
            return path + 'index.html';
        }
        
        if (!path.includes('.') && !path.endsWith('/')) {
            return path + '/index.html';
        }
        
        return path;
    }

    calculateBasePath() {
        // Use the environmental base path from Vite
        const envBasePath = import.meta.env.BASE_URL || '/';
        
        const currentDir = dirname(this.currentPath);
        
        // Calculate relative path from current directory to the base
        const relativePath = relative(currentDir, envBasePath);
        
        if (relativePath === '' || relativePath === '.') {
            return './';
        }
        
        return relativePath || './';
    }

    getRelativePath(targetPath) {
        return join(this.basePath, targetPath);
    }

    // Metodo render pubblico
    render() {
        const nav = this.createNavElement();
        
        const navItems = [
            { text: 'Home', path: 'index.html'},
            { text: 'Mappa', path: 'pages/mappa.html'},
            { text: 'Indici', path: 'pages/indici.html'},
            { text: 'Percorsi critici', path: 'pages/percorsi.html'},
        ];

        const navHTML = this.generateNavHTML(navItems);
        nav.innerHTML = navHTML;
        
        // Setup event listeners
        this.setupEventListeners();
        this.setupScrollListener();
        
        console.log('Navigation rendered from:', this.currentPath, 'Base path:', this.basePath);
        return nav;
    }

    generateLogoHTML() {
        const logoImageUrl = this.config?.project?.projectThumbnailURL;
        
        if (logoImageUrl && logoImageUrl.trim() !== '') {
            // Controlla se il percorso inizia già con imgs/
            const imagePath = logoImageUrl.startsWith('imgs/') 
                ? this.getRelativePath(logoImageUrl)
                : this.getRelativePath(`imgs/${logoImageUrl}`);
                
            return `
                <a href="${this.getRelativePath('index.html')}">
                    <img src="${imagePath}" alt="Logo" class="h-10 object-contain">
                </a>
            `;
        } else {
            return `
                <a href="${this.getRelativePath('index.html')}" class="bg-primary-600 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg hover:bg-primary-700 transition duration-200">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                </a>
            `;
        }
    }

    generateNavHTML(items) {
        const desktopNav = items.map(item => {
            const href = this.getRelativePath(item.path);
            const isActive = this.isActivePath(item.path);
            const activeClass = isActive ? 'text-primary-900 border-b-2 border-primary-600 pb-1' : 'text-gray-600 hover:text-primary-600';
            const sectionData = item.section ? `data-section="${item.section}"` : '';
            
            return `<a href="${href}" class="nav-link ${activeClass} font-medium transition duration-200" ${sectionData}>${item.text}</a>`;
        }).join('');

        const mobileNav = items.map(item => {
            const href = this.getRelativePath(item.path);
            const isActive = this.isActivePath(item.path);
            const activeClass = isActive ? 'text-primary-900 bg-primary-50 font-medium' : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50';
            const sectionData = item.section ? `data-section="${item.section}"` : '';
            
            return `<a href="${href}" class="block px-4 py-3 ${activeClass} transition duration-200" ${sectionData}>${item.text}</a>`;
        }).join('');

        return `
            <div class="flex justify-between items-center h-20">
    <!-- Logo -->
    <div class="flex items-center space-x-4">
        <div class="flex items-center justify-center">
            ${this.generateLogoHTML()}
        </div>
    </div>

    <!-- Desktop Navigation -->
    <div class="hidden md:flex items-center space-x-8">
        ${desktopNav}
    </div>

    <!-- Mobile Menu Toggle -->
    <div class="md:hidden relative">
        <input type="checkbox" id="menu-toggle" class="hidden peer">
        <label for="menu-toggle" class="cursor-pointer text-gray-600 hover:text-primary-600 transition duration-200 peer-checked:text-primary-600">
            <svg class="h-6 w-6 peer-checked:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <svg class="h-6 w-6 hidden peer-checked:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
        </label>
        
        <div class="hidden peer-checked:block absolute right-0 top-12 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
            ${mobileNav}
        </div>
    </div>
</div>
        `;
    }

    isActivePath(targetPath) {
        const currentFile = basename(this.currentPath);
        const targetFile = basename(targetPath);
        
        // For index.html, check if we're at the root of the app
        if (currentFile === 'index.html' && targetFile === 'index.html') {
            if (targetPath === 'index.html') {
                const currentDir = dirname(this.currentPath);
                // Use the environmental base path
                const basePath = import.meta.env.BASE_URL || '/';
                const normalizedBasePath = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
                
                return currentDir === normalizedBasePath || currentDir === normalizedBasePath + '/';
            }
        }
        
        return currentFile === targetFile;
    }

    createNavElement() {
        let header = document.querySelector('header');
        if (!header) {
            header = document.createElement('header');
            // Inizialmente con layout normale - occupa spazio
            header.className = 'bg-white shadow-lg border-b border-primary-100 w-full sticky top-0 z-40 transition-all duration-300';
            document.body.insertBefore(header, document.body.firstChild);
        }
        
        // Memorizza il riferimento all'header
        this.header = header;
        
        let nav = header.querySelector('nav');
        if (!nav) {
            nav = document.createElement('nav');
            nav.className = 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8';
            header.appendChild(nav);
        }
        
        return nav;
    }

    setupScrollListener() {
        let ticking = false;
        
        const updateNavbar = () => {
            if (!this.header) return;
            
            const scrollY = window.scrollY;
            const shouldBeOverlay = scrollY > this.scrollThreshold;
            
            if (shouldBeOverlay && !this.isScrolling) {
                // Passa a modalità overlay
                this.isScrolling = true;
                this.header.className = 'bg-white shadow-lg border-b border-primary-100 w-full fixed top-0 z-40 transition-all duration-300';
                
                // Aggiungi padding al body per compensare l'header fixed
                document.body.style.paddingTop = this.header.offsetHeight + 'px';
                
            } else if (!shouldBeOverlay && this.isScrolling) {
                // Torna a modalità normale
                this.isScrolling = false;
                this.header.className = 'bg-white shadow-lg border-b border-primary-100 w-full sticky top-0 z-40 transition-all duration-300';
                
                // Rimuovi il padding dal body
                document.body.style.paddingTop = '';
            }
            
            ticking = false;
        };
        
        const requestUpdate = () => {
            if (!ticking) {
                requestAnimationFrame(updateNavbar);
                ticking = true;
            }
        };
        
        window.addEventListener('scroll', requestUpdate, { passive: true });
        
        // Cleanup function per rimuovere il listener se necessario
        this.cleanupScrollListener = () => {
            window.removeEventListener('scroll', requestUpdate);
        };
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[data-section]');
            if (link && link.dataset.section) {
                const section = link.dataset.section;
                const href = link.getAttribute('href');
                
                if (href && href.includes('index.html')) {
                    e.preventDefault();
                    const baseUrl = href.split('#')[0];
                    window.location.href = `${baseUrl}#section-${section}`;
                }
            }
        });

        document.addEventListener('click', (e) => {
            const menuToggle = document.getElementById('menu-toggle');
            const menuContainer = e.target.closest('.md\\:hidden');
            
            if (menuToggle && menuToggle.checked && !menuContainer) {
                menuToggle.checked = false;
            }
        });
    }

    // Metodo per cleanup quando necessario
    destroy() {
        if (this.cleanupScrollListener) {
            this.cleanupScrollListener();
        }
        
        // Rimuovi il padding dal body se presente
        document.body.style.paddingTop = '';
    }
}

export default UniversalNav;