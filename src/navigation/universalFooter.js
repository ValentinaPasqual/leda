// universalFooter.js - Versione Overlay Compatta con Carousel Auto-Discovery
export class UniversalFooter {
    constructor(config) {
        this.currentPath = window.location.pathname;
        this.basePath = this.calculateBasePath();
        this.config = config;
        this.isOpen = false;
        this.footerElement = null;
        this.carouselInterval = null;
        this.currentSlide = 0;
        this.logos = [];
        
        this.initLogos();
    }

    async initLogos() {
        try {
            const basePath = window.location.pathname.match(/^\/[^\/]+\//)?.[0] || '/';
            const manifestPath = `${basePath}imgs/institutional_logos/manifest.json`;
            
            const response = await fetch(manifestPath);
            if (!response.ok) throw new Error(`Manifest not found: ${response.status}`);
            
            const logoFilenames = await response.json();
            
            this.logos = logoFilenames.map(filename => ({
                filename: filename,
                path: `${basePath}imgs/institutional_logos/${filename}`
            })).sort((a, b) => a.filename.localeCompare(b.filename));
            
            if (this.footerElement && this.logos.length > 0) {
                this.updateCarousel();
            }
        } catch (error) {
            this.logos = [];
        }
    }

    updateCarousel() {
        const innerContent = this.footerElement.querySelector('.footer-inner');
        if (innerContent) {
            innerContent.innerHTML = this.generateCompactFooterHTML();
            this.initCarousel();
        }
    }

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

    normalizePath(path) {
        if (path.endsWith('/')) return path + 'index.html';
        if (!path.includes('.') && !path.endsWith('/')) return path + '/index.html';
        return path;
    }

    calculateBasePath() {
        const currentDir = this.dirname(this.currentPath);
        const projectShortTitle = this.config?.project?.projectShortTitle?.toLowerCase() || 'leda';
        const rootDir = '/' + projectShortTitle;
        
        const relativePath = this.relative(currentDir, rootDir);
        
        if (relativePath === '' || relativePath === '.') return './';
        return relativePath || './';
    }

    getRelativePath(targetPath) {
        return this.join(this.basePath, targetPath);
    }

    isExternalLink(path) {
        return path.startsWith('http://') || path.startsWith('https://');
    }

    render() {
        this.footerElement = this.createFooterElement();
        this.setupEventListeners();
        this.initCarousel();
        return this.footerElement;
    }

    createFooterElement() {
        const existingFooter = document.querySelector('.footer-overlay');
        if (existingFooter) existingFooter.remove();

        const footer = document.createElement('div');
        footer.className = 'footer-overlay';
        footer.innerHTML = `
            <div class="footer-trigger">
                <svg class="footer-chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/>
                </svg>
            </div>
            <div class="footer-content">
                <div class="footer-trigger">
                    <svg class="footer-chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/>
                    </svg>
                </div>
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
            const isExternal = this.isExternalLink(item.path);
            const href = isExternal ? item.path : this.getRelativePath(item.path);
            const sectionData = item.section ? `data-section="${item.section}"` : '';
            const target = isExternal ? 'target="_blank" rel="noopener noreferrer"' : '';
            const externalIcon = isExternal ? `
                <svg class="footer-external-icon" width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                </svg>
            ` : '';
            return `<li><a href="${href}" ${target} ${sectionData}>${item.text}${externalIcon}</a></li>`;
        }).join('');

        let carouselHTML = '';
        if (this.logos.length > 0) {
            const logoSlides = this.logos.map(logo => `
                <div class="footer-logo-slide">
                    <img src="${logo.path}" alt="Institutional Logo - ${logo.filename}" />
                </div>
            `).join('');

            const carouselDots = this.logos.map((_, index) => 
                `<span class="footer-carousel-dot ${index === 0 ? 'active' : ''}" data-index="${index}"></span>`
            ).join('');

            carouselHTML = `
                <div class="footer-logo-carousel-container">
                    <div class="footer-logo-carousel-title">Partner Istituzionali</div>
                    <div class="footer-logo-carousel">
                        <div class="footer-logo-carousel-track">
                            ${logoSlides}
                        </div>
                    </div>
                    <div class="footer-carousel-controls">
                        <button class="footer-carousel-btn footer-carousel-prev" aria-label="Previous logo">
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                            </svg>
                        </button>
                        <div class="footer-carousel-dots">
                            ${carouselDots}
                        </div>
                        <button class="footer-carousel-btn footer-carousel-next" aria-label="Next logo">
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                            </svg>
                        </button>
                    </div>
                </div>
            `;
        }

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
            
            ${carouselHTML}
            
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
            { text: 'Home', path: 'index.html' },
            { text: 'Documentazione', path: 'https://github.com/valentinapasqual/leda' },
            { text: 'Contatti', path: 'https://ledaprin2022pnrr.altervista.org/chi-siamo/' },
        ];
    }

    initCarousel() {
        if (!this.footerElement || this.logos.length === 0) return;

        const track = this.footerElement.querySelector('.footer-logo-carousel-track');
        const prevBtn = this.footerElement.querySelector('.footer-carousel-prev');
        const nextBtn = this.footerElement.querySelector('.footer-carousel-next');
        const dots = this.footerElement.querySelectorAll('.footer-carousel-dot');

        if (!track) return;

        this.startCarousel();

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.stopCarousel();
                this.goToPrevSlide();
                this.startCarousel();
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.stopCarousel();
                this.goToNextSlide();
                this.startCarousel();
            });
        }

        dots.forEach(dot => {
            dot.addEventListener('click', () => {
                this.stopCarousel();
                const index = parseInt(dot.dataset.index);
                this.goToSlide(index);
                this.startCarousel();
            });
        });

        const carousel = this.footerElement.querySelector('.footer-logo-carousel');
        if (carousel) {
            carousel.addEventListener('mouseenter', () => this.stopCarousel());
            carousel.addEventListener('mouseleave', () => this.startCarousel());
        }
    }

    startCarousel() {
        if (this.logos.length <= 1) return;
        
        this.stopCarousel();
        this.carouselInterval = setInterval(() => {
            this.goToNextSlide();
        }, 3000);
    }

    stopCarousel() {
        if (this.carouselInterval) {
            clearInterval(this.carouselInterval);
            this.carouselInterval = null;
        }
    }

    goToSlide(index) {
        const track = this.footerElement?.querySelector('.footer-logo-carousel-track');
        const dots = this.footerElement?.querySelectorAll('.footer-carousel-dot');
        
        if (!track || !dots) return;

        this.currentSlide = index;
        track.style.transform = `translateX(-${index * 100}%)`;

        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
    }

    goToNextSlide() {
        const nextSlide = (this.currentSlide + 1) % this.logos.length;
        this.goToSlide(nextSlide);
    }

    goToPrevSlide() {
        const prevSlide = (this.currentSlide - 1 + this.logos.length) % this.logos.length;
        this.goToSlide(prevSlide);
    }

    toggle() {
        this.isOpen = !this.isOpen;
        if (this.footerElement) {
            this.footerElement.classList.toggle('open', this.isOpen);
            
            if (this.isOpen && this.logos.length > 0) {
                this.startCarousel();
            } else {
                this.stopCarousel();
            }
        }
    }

    setupEventListeners() {
        if (!this.footerElement) return;

        // Cattura TUTTI i trigger (sia quello in basso che quello in alto)
        const triggers = this.footerElement.querySelectorAll('.footer-trigger');
        triggers.forEach(trigger => {
            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggle();
            });
        });

        this.footerElement.addEventListener('click', (e) => {
            const link = e.target.closest('a[data-section]');
            if (link && link.dataset.section) {
                const section = link.dataset.section;
                const href = link.getAttribute('href');
                
                if (href && href.includes('index.html')) {
                    e.preventDefault();
                    const baseUrl = href.split('#')[0];
                    window.location.href = `${baseUrl}#section-${section}`;
                    this.toggle();
                }
            }
        });

        document.addEventListener('click', (e) => {
            if (this.isOpen && !this.footerElement.contains(e.target)) {
                this.toggle();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.toggle();
            }
        });
    }

    destroy() {
        this.stopCarousel();
        if (this.footerElement) {
            this.footerElement.remove();
        }
    }
}