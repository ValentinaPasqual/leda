/**
 * Mobile Menu Manager
 * Gestisce il menu mobile e il comportamento responsive della navbar
 */

const CONFIG = {
    MOBILE_BREAKPOINT: 768,
    DEBOUNCE_DELAY: 150,
    HAMBURGER_ID: 'hamburger-btn',
    MOBILE_MENU_ID: 'bottom-nav-mobile-menu'
};

const MOBILE_MENU_ITEMS = [
    'toggle-filters',
    'active-filters-badge',
    'clear-all-btn',
    'map-layer-selector',
    'map-markers-selector',
    'toggle-legend-btn',
    'results-counter',
    'unique-results-counter',
    'toggle-results'
];

export class MobileMenuManager {
    constructor(elements) {
        this.elements = elements;
        this.isOpen = false;
        this.hamburgerBtn = null;
        this.mobileMenu = null;
        this.resizeHandler = null;
        this.clickHandler = null;
        
        this.init();
    }

    init() {
        this.createUI();
        this.setupEventHandlers();
        this.handleResize();
    }

    setupEventHandlers() {
        this.resizeHandler = this.debounce(() => this.handleResize(), CONFIG.DEBOUNCE_DELAY);
        window.addEventListener('resize', this.resizeHandler);
    }

    createUI() {
        this.createHamburgerButton();
        this.createMobileMenu();
    }

    createHamburgerButton() {
        // Evita duplicati
        const existing = document.getElementById(CONFIG.HAMBURGER_ID);
        if (existing) {
            this.hamburgerBtn = existing;
            return;
        }

        this.hamburgerBtn = document.createElement('button');
        this.hamburgerBtn.id = CONFIG.HAMBURGER_ID;
        this.hamburgerBtn.className = 'md:hidden p-2 z-60 text-gray-700 hover:text-gray-900';
        this.hamburgerBtn.setAttribute('aria-label', 'Apri menu');
        this.hamburgerBtn.setAttribute('aria-expanded', 'false');
        this.hamburgerBtn.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <line x1="5" y1="7" x2="19" y2="7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <line x1="5" y1="17" x2="19" y2="17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
        `;
        
        this.clickHandler = () => this.toggleMenu();
        this.hamburgerBtn.addEventListener('click', this.clickHandler);
        
        const bottomNav = this.elements.bottomNav || document.querySelector('nav') || document.body;
        bottomNav.appendChild(this.hamburgerBtn);
    }

    createMobileMenu() {
        // Evita duplicati
        const existing = document.getElementById(CONFIG.MOBILE_MENU_ID);
        if (existing) {
            this.mobileMenu = existing;
            return;
        }

        this.mobileMenu = document.createElement('div');
        this.mobileMenu.id = CONFIG.MOBILE_MENU_ID;
        this.mobileMenu.className = 'md:hidden fixed bottom-14 left-4 right-4 bg-white shadow-lg p-3 rounded-lg flex-col gap-2 z-50';
        this.mobileMenu.setAttribute('data-open', 'false');
        
        document.body.appendChild(this.mobileMenu);
    }

    toggleMenu() {
        this.isOpen = !this.isOpen;
        
        if (this.mobileMenu) {
            this.mobileMenu.setAttribute('data-open', this.isOpen ? 'true' : 'false');
        }
        
        if (this.hamburgerBtn) {
            this.hamburgerBtn.setAttribute('aria-expanded', this.isOpen ? 'true' : 'false');
        }
    }

    handleResize() {
        const isMobile = window.innerWidth < CONFIG.MOBILE_BREAKPOINT;
        
        if (isMobile) {
            this.switchToMobile();
        } else {
            this.switchToDesktop();
        }
    }

    switchToMobile() {
        // Nascondi contenuto desktop
        const desktopContent = this.elements.bottomNavContent;
        if (desktopContent) {
            desktopContent.classList.remove('flex');
            desktopContent.classList.add('hidden');
        }

        // Sposta elementi nel menu mobile
        MOBILE_MENU_ITEMS.forEach(id => {
            const el = document.getElementById(id);
            if (el && this.mobileMenu && el.parentNode !== this.mobileMenu) {
                el.classList.add('w-full', 'block');
                this.mobileMenu.appendChild(el);
            }
        });

        // Chiudi menu e pannelli
        this.closeMenu();
        this.closePanels();
    }

    switchToDesktop() {
        // Mostra contenuto desktop
        const desktopContent = this.elements.bottomNavContent;
        if (desktopContent) {
            desktopContent.classList.remove('hidden');
            desktopContent.classList.add('flex');
        }

        // Sposta elementi dal menu mobile al desktop
        if (this.mobileMenu) {
            const menuChildren = Array.from(this.mobileMenu.childNodes);
            menuChildren.forEach(node => {
                if (node instanceof HTMLElement && desktopContent) {
                    node.classList.remove('w-full', 'block');
                    desktopContent.appendChild(node);
                }
            });
        }

        // Chiudi menu mobile
        this.closeMenu();
    }

    closeMenu() {
        this.isOpen = false;
        if (this.mobileMenu) {
            this.mobileMenu.setAttribute('data-open', 'false');
        }
        if (this.hamburgerBtn) {
            this.hamburgerBtn.setAttribute('aria-expanded', 'false');
        }
    }

    closePanels() {
        if (this.elements.filtersPanel) {
            this.elements.filtersPanel.setAttribute('data-open', 'false');
        }
        if (this.elements.resultsPanel) {
            this.elements.resultsPanel.setAttribute('data-open', 'false');
        }
        if (this.elements.toggleFilters) {
            this.elements.toggleFilters.setAttribute('data-active', 'false');
        }
        if (this.elements.toggleResults) {
            this.elements.toggleResults.setAttribute('data-active', 'false');
        }
    }

    debounce(func, wait) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    destroy() {
        // Rimuovi event listener
        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
        }
        
        if (this.clickHandler && this.hamburgerBtn) {
            this.hamburgerBtn.removeEventListener('click', this.clickHandler);
        }
        
        // Rimuovi elementi dal DOM
        if (this.hamburgerBtn && this.hamburgerBtn.parentNode) {
            this.hamburgerBtn.remove();
        }
        
        if (this.mobileMenu && this.mobileMenu.parentNode) {
            this.mobileMenu.remove();
        }
        
        // Pulisci riferimenti
        this.hamburgerBtn = null;
        this.mobileMenu = null;
        this.resizeHandler = null;
        this.clickHandler = null;
    }
}