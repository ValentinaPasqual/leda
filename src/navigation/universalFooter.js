// universalFooter.js - Versione Overlay Compatta
export class UniversalFooter {
    constructor(config) {
        this.currentPath = window.location.pathname;
        this.basePath = this.calculateBasePath();
        this.config = config;
        this.isOpen = false;
        this.footerElement = null;
    }

    // Browser-compatible path utilities
    dirname(path) {
        return path.substring(0, path.lastIndexOf('/')) || '/';
    }

    join(...paths) {
        return paths
            .map(path => path.replace(/^\/+|\/+$/g, ''))
            .filter(path => path.length > 0)
            .join('/')
            .replace(/\/+/g, '/');
    }

    relative(from, to) {
        const fromParts = from.split('/').filter(part => part);
        const toParts = to.split('/').filter(part => part);
        
        let commonLength = 0;
        for (let i = 0; i < Math.min(fromParts.length, toParts.length); i++) {
            if (fromParts[i] === toParts[i]) {
                commonLength++;
            } else {
                break;
            }
        }
        
        const upLevels = fromParts.length - commonLength;
        const downPath = toParts.slice(commonLength);
        
        const result = '../'.repeat(upLevels) + downPath.join('/');
        return result || './';
    }

    calculateBasePath() {
        const currentDir = this.dirname(this.currentPath);
        const projectShortTitle = this.config?.project?.projectShortTitle?.toLowerCase() || 'sassi';
        const rootDir = this.dirname(`/${projectShortTitle}`);
        return this.relative(currentDir, '/sassi') || './';
    }

    getRelativePath(targetPath) {
        return this.join(this.basePath, targetPath);
    }

    // Metodo render pubblico
    render() {
        this.createFooterStyles();
        this.footerElement = this.createFooterElement();
        this.setupEventListeners();
        
        console.log('Compact footer rendered from:', this.currentPath, 'Base path:', this.basePath);
        return this.footerElement;
    }

    createFooterStyles() {
        // Rimuovi stili esistenti se presenti
        const existingStyles = document.getElementById('footer-overlay-styles');
        if (existingStyles) {
            existingStyles.remove();
        }

        const styles = document.createElement('style');
        styles.id = 'footer-overlay-styles';
        styles.textContent = `
            .footer-overlay {
                position: fixed;
                bottom: 0;
                right: 0;
                z-index: 9999;
                transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                font-family: system-ui, -apple-system, sans-serif;
            }

            .footer-trigger {
                position: absolute;
                bottom: 0;
                right: 0;
                width: 80px;
                height: 40px;
                background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
                border-radius: 40px 0 0 0;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: -2px -2px 10px rgba(0, 0, 0, 0.3);
                transition: all 0.3s ease;
            }

            .footer-trigger:hover {
                background: linear-gradient(135deg, #374151 0%, #4b5563 100%);
                transform: scale(1.05);
            }

            .footer-chevron {
                width: 16px;
                height: 16px;
                color: #d1d5db;
                transition: transform 0.3s ease;
                margin-left: -8px;
                margin-bottom: -4px;
            }

            .footer-overlay.open .footer-chevron {
                transform: rotate(180deg);
            }

            .footer-content {
                position: absolute;
                bottom: 0;
                right: 0;
                width: 400px;
                max-height: 0;
                overflow: hidden;
                background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
                border-radius: 16px 0 0 0;
                box-shadow: -4px -4px 20px rgba(0, 0, 0, 0.4);
                transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), 
                           opacity 0.4s ease;
                opacity: 0;
            }

            .footer-overlay.open .footer-content {
                max-height: 300px;
                opacity: 1;
            }

            .footer-inner {
                padding: 24px 20px 16px;
                color: #d1d5db;
            }

            .footer-title {
                font-size: 18px;
                font-weight: 600;
                color: #f9fafb;
                margin-bottom: 12px;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .footer-nav {
                list-style: none;
                padding: 0;
                margin: 0 0 16px 0;
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px;
            }

            .footer-nav li {
                margin: 0;
            }

            .footer-nav a {
                color: #9ca3af;
                text-decoration: none;
                font-size: 14px;
                display: block;
                padding: 4px 8px;
                border-radius: 6px;
                transition: all 0.2s ease;
            }

            .footer-nav a:hover {
                color: #f9fafb;
                background: rgba(55, 65, 81, 0.5);
            }

            .footer-credits {
                font-size: 11px;
                color: #6b7280;
                line-height: 1.4;
                border-top: 1px solid #374151;
                padding-top: 12px;
                margin-top: 12px;
            }

            .footer-heart {
                color: #ef4444;
                display: inline-block;
                animation: pulse 2s infinite;
            }

            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }

            @media (max-width: 480px) {
                .footer-content {
                    width: 100vw;
                    border-radius: 16px 16px 0 0;
                }
                
                .footer-trigger {
                    width: 60px;
                    height: 30px;
                }
            }
        `;
        document.head.appendChild(styles);
    }

    createFooterElement() {
        // Rimuovi footer esistente se presente
        const existingFooter = document.querySelector('.footer-overlay');
        if (existingFooter) {
            existingFooter.remove();
        }

        const footer = document.createElement('div');
        footer.className = 'footer-overlay';
        footer.innerHTML = `
            <div class="footer-trigger">
                <svg class="footer-chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/>
                </svg>
            </div>
            <div class="footer-content">
                <div class="footer-inner">
                    ${this.generateCompactFooterHTML()}
                </div>
            </div>
        `;

        document.body.appendChild(footer);
        return footer;
    }

    generateCompactFooterHTML() {
        const currentYear = new Date().getFullYear();
        const projectTitle = this.config?.project?.projectTitle || 'Storia dell\'Alpinismo';
        const projectShortTitle = this.config?.project?.projectShortTitle || 'SASSI';
        
        const navigationLinks = this.getNavigationLinks().map(item => {
            const href = this.getRelativePath(item.path);
            const sectionData = item.section ? `data-section="${item.section}"` : '';
            return `<li><a href="${href}" ${sectionData}>${item.text}</a></li>`;
        }).join('');

        return `
            <div class="footer-title">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M4.25 2A2.25 2.25 0 002 4.25v2.5A2.25 2.25 0 004.25 9h2.5A2.25 2.25 0 009 6.75v-2.5A2.25 2.25 0 006.75 2h-2.5zm0 9A2.25 2.25 0 002 13.25v2.5A2.25 2.25 0 004.25 18h2.5A2.25 2.25 0 009 15.75v-2.5A2.25 2.25 0 006.75 11h-2.5zm9-9A2.25 2.25 0 0011 4.25v2.5A2.25 2.25 0 0013.25 9h2.5A2.25 2.25 0 0018 6.75v-2.5A2.25 2.25 0 0015.75 2h-2.5zm0 9A2.25 2.25 0 0011 13.25v2.5A2.25 2.25 0 0013.25 18h2.5A2.25 2.25 0 0018 15.75v-2.5A2.25 2.25 0 0015.75 11h-2.5z" clip-rule="evenodd"/>
                </svg>
                ${projectShortTitle}
            </div>
            
            <ul class="footer-nav">
                ${navigationLinks}
            </ul>
            
            <div class="footer-credits">
                <div>© ${currentYear} ${projectShortTitle}. Tutti i diritti riservati.</div>
                <div style="margin-top: 4px;">
                    Sviluppato con <span class="footer-heart">♥</span> per la ricerca storica
                </div>
                <div style="margin-top: 4px;">
                    Powered by OpenStreetMap • GIS Technology
                </div>
            </div>
        `;
    }

    getNavigationLinks() {
        return [
            { text: 'Home', path: 'index.html', section: '0' },
            { text: 'Mappa', path: 'index.html', section: '1' },
            { text: 'Ricerca', path: 'index.html', section: '2' },
            { text: 'Docs', path: '#' },
        ];
    }

    toggle() {
        this.isOpen = !this.isOpen;
        if (this.footerElement) {
            this.footerElement.classList.toggle('open', this.isOpen);
        }
    }

    setupEventListeners() {
        if (!this.footerElement) return;

        // Click sul trigger per aprire/chiudere
        const trigger = this.footerElement.querySelector('.footer-trigger');
        if (trigger) {
            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggle();
            });
        }

        // Click sui link di navigazione
        this.footerElement.addEventListener('click', (e) => {
            const link = e.target.closest('a[data-section]');
            if (link && link.dataset.section) {
                const section = link.dataset.section;
                const href = link.getAttribute('href');
                
                if (href && href.includes('index.html')) {
                    e.preventDefault();
                    const baseUrl = href.split('#')[0];
                    window.location.href = `${baseUrl}#section-${section}`;
                    this.toggle(); // Chiudi il footer dopo la navigazione
                }
            }
        });

        // Chiudi quando si clicca fuori
        document.addEventListener('click', (e) => {
            if (this.isOpen && !this.footerElement.contains(e.target)) {
                this.toggle();
            }
        });

        // Gestisci ESC per chiudere
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.toggle();
            }
        });
    }
}