(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))r(o);new MutationObserver(o=>{for(const s of o)if(s.type==="childList")for(const n of s.addedNodes)n.tagName==="LINK"&&n.rel==="modulepreload"&&r(n)}).observe(document,{childList:!0,subtree:!0});function t(o){const s={};return o.integrity&&(s.integrity=o.integrity),o.referrerPolicy&&(s.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?s.credentials="include":o.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function r(o){if(o.ep)return;o.ep=!0;const s=t(o);fetch(o.href,s)}})();const E="/leda/";async function A(){try{const i="mapConfig_leda",e=localStorage.getItem(i);if(e)return console.log(`Loading configuration from localStorage (${i})`),JSON.parse(e);const r=await(await fetch(`${E}config/map-config.json`)).json();return console.log("Loaded configuration from server:",r),r}catch(i){throw console.error("Error loading configuration:",i),i}}async function M(i){try{const e="mapConfig_leda";return localStorage.setItem(e,JSON.stringify(i,null,2)),console.log(`✅ Configuration saved to ${e}`),!0}catch(e){return console.error("Error saving configuration:",e),!1}}const L=/^[A-Za-z]:\//;function g(i=""){return i&&i.replace(/\\/g,"/").replace(L,e=>e.toUpperCase())}const S=/^[/\\]{2}/,$=/^[/\\](?![/\\])|^[/\\]{2}(?!\.)|^[A-Za-z]:[/\\]/,y=/^[A-Za-z]:$/,p=/^\/([A-Za-z]:)?$/,C=function(i){if(i.length===0)return".";i=g(i);const e=i.match(S),t=u(i),r=i[i.length-1]==="/";return i=w(i,!t),i.length===0?t?"/":r?"./":".":(r&&(i+="/"),y.test(i)&&(i+="/"),e?t?`//${i}`:`//./${i}`:t&&!u(i)?`/${i}`:i)},P=function(...i){let e="";for(const t of i)if(t)if(e.length>0){const r=e[e.length-1]==="/",o=t[0]==="/";r&&o?e+=t.slice(1):e+=r||o?t:`/${t}`}else e+=t;return C(e)};function T(){return typeof process<"u"&&typeof process.cwd=="function"?process.cwd().replace(/\\/g,"/"):"/"}const v=function(...i){i=i.map(r=>g(r));let e="",t=!1;for(let r=i.length-1;r>=-1&&!t;r--){const o=r>=0?i[r]:T();!o||o.length===0||(e=`${o}/${e}`,t=u(o))}return e=w(e,!t),t&&!u(e)?`/${e}`:e.length>0?e:"."};function w(i,e){let t="",r=0,o=-1,s=0,n=null;for(let l=0;l<=i.length;++l){if(l<i.length)n=i[l];else{if(n==="/")break;n="/"}if(n==="/"){if(!(o===l-1||s===1))if(s===2){if(t.length<2||r!==2||t[t.length-1]!=="."||t[t.length-2]!=="."){if(t.length>2){const c=t.lastIndexOf("/");c===-1?(t="",r=0):(t=t.slice(0,c),r=t.length-1-t.lastIndexOf("/")),o=l,s=0;continue}else if(t.length>0){t="",r=0,o=l,s=0;continue}}e&&(t+=t.length>0?"/..":"..",r=2)}else t.length>0?t+=`/${i.slice(o+1,l)}`:t=i.slice(o+1,l),r=l-o-1;o=l,s=0}else n==="."&&s!==-1?++s:s=-1}return t}const u=function(i){return $.test(i)},j=function(i,e){const t=v(i).replace(p,"$1").split("/"),r=v(e).replace(p,"$1").split("/");if(r[0][1]===":"&&t[0][1]===":"&&t[0]!==r[0])return r.join("/");const o=[...t];for(const s of o){if(r[0]!==s)break;t.shift(),r.shift()}return[...t.map(()=>".."),...r].join("/")},m=function(i){const e=g(i).replace(/\/$/,"").split("/").slice(0,-1);return e.length===1&&y.test(e[0])&&(e[0]+="/"),e.join("/")||(u(i)?"/":".")},x=function(i,e){const t=g(i).split("/");let r="";for(let o=t.length-1;o>=0;o--){const s=t[o];if(s){r=s;break}}return e&&r.endsWith(e)?r.slice(0,-e.length):r};class N{constructor(e){this.currentPath=this.normalizePath(window.location.pathname),this.config=e,this.basePath=this.calculateBasePath(this.config),this.header=null,this.isScrolling=!1,this.scrollThreshold=100}normalizePath(e){return e.endsWith("/")?e+"index.html":!e.includes(".")&&!e.endsWith("/")?e+"/index.html":e}calculateBasePath(e){var s,n;const t=m(this.currentPath),r="/"+((n=(s=e==null?void 0:e.project)==null?void 0:s.projectShortTitle)==null?void 0:n.toLowerCase())||"",o=j(t,r);return o===""||o==="."?"./":o||"./"}getRelativePath(e){return P(this.basePath,e)}render(){const e=this.createNavElement(),t=[{text:"Home",path:"index.html"},{text:"Mappa",path:"pages/mappa.html"},{text:"Indici",path:"pages/indici.html"},{text:"Percorsi critici",path:"pages/percorsi.html"}],r=this.generateNavHTML(t);return e.innerHTML=r,this.setupEventListeners(),this.setupScrollListener(),console.log("Navigation rendered from:",this.currentPath,"Base path:",this.basePath),e}generateLogoHTML(){var t,r;const e=(r=(t=this.config)==null?void 0:t.project)==null?void 0:r.projectThumbnailURL;if(e&&e.trim()!==""){const o=e.startsWith("imgs/")?this.getRelativePath(e):this.getRelativePath(`imgs/${e}`);return`
                <a href="${this.getRelativePath("index.html")}">
                    <img src="${o}" alt="Logo" class="h-10 object-contain">
                </a>
            `}else return`
                <a href="${this.getRelativePath("index.html")}" class="bg-primary-600 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg hover:bg-primary-700 transition duration-200">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                </a>
            `}generateNavHTML(e){const t=e.map(o=>{const s=this.getRelativePath(o.path),l=this.isActivePath(o.path)?"text-primary-900 border-b-2 border-primary-600 pb-1":"text-gray-600 hover:text-primary-600",c=o.section?`data-section="${o.section}"`:"";return`<a href="${s}" class="nav-link ${l} font-medium transition duration-200" ${c}>${o.text}</a>`}).join(""),r=e.map(o=>{const s=this.getRelativePath(o.path),l=this.isActivePath(o.path)?"text-primary-900 bg-primary-50 font-medium":"text-gray-600 hover:text-primary-600 hover:bg-gray-50",c=o.section?`data-section="${o.section}"`:"";return`<a href="${s}" class="block px-4 py-3 ${l} transition duration-200" ${c}>${o.text}</a>`}).join("");return`
            <div class="flex justify-between items-center h-20">
    <!-- Logo -->
    <div class="flex items-center space-x-4">
        <div class="flex items-center justify-center">
            ${this.generateLogoHTML()}
        </div>
    </div>

    <!-- Desktop Navigation -->
    <div class="hidden md:flex items-center space-x-8">
        ${t}
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
            ${r}
        </div>
    </div>
</div>
        `}isActivePath(e){var o,s,n;const t=x(this.currentPath),r=x(e);if(t==="index.html"&&r==="index.html"&&e==="index.html"){const l=m(this.currentPath),c="/"+(((n=(s=(o=this.config)==null?void 0:o.project)==null?void 0:s.projectShortTitle)==null?void 0:n.toLowerCase())||"");return l===c}return t===r}createNavElement(){let e=document.querySelector("header");e||(e=document.createElement("header"),e.className="bg-white shadow-lg border-b border-primary-100 w-full sticky top-0 z-40 transition-all duration-300",document.body.insertBefore(e,document.body.firstChild)),this.header=e;let t=e.querySelector("nav");return t||(t=document.createElement("nav"),t.className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",e.appendChild(t)),t}setupScrollListener(){let e=!1;const t=()=>{if(!this.header)return;const s=window.scrollY>this.scrollThreshold;s&&!this.isScrolling?(this.isScrolling=!0,this.header.className="bg-white shadow-lg border-b border-primary-100 w-full fixed top-0 z-40 transition-all duration-300",document.body.style.paddingTop=this.header.offsetHeight+"px"):!s&&this.isScrolling&&(this.isScrolling=!1,this.header.className="bg-white shadow-lg border-b border-primary-100 w-full sticky top-0 z-40 transition-all duration-300",document.body.style.paddingTop=""),e=!1},r=()=>{e||(requestAnimationFrame(t),e=!0)};window.addEventListener("scroll",r,{passive:!0}),this.cleanupScrollListener=()=>{window.removeEventListener("scroll",r)}}setupEventListeners(){document.addEventListener("click",e=>{const t=e.target.closest("a[data-section]");if(t&&t.dataset.section){const r=t.dataset.section,o=t.getAttribute("href");if(o&&o.includes("index.html")){e.preventDefault();const s=o.split("#")[0];window.location.href=`${s}#section-${r}`}}}),document.addEventListener("click",e=>{const t=document.getElementById("menu-toggle"),r=e.target.closest(".md\\:hidden");t&&t.checked&&!r&&(t.checked=!1)})}destroy(){this.cleanupScrollListener&&this.cleanupScrollListener(),document.body.style.paddingTop=""}}class I{constructor(e){this.currentPath=window.location.pathname,this.basePath=this.calculateBasePath(),this.config=e,this.isOpen=!1,this.footerElement=null,this.carouselInterval=null,this.currentSlide=0,this.logos=[],this.initLogos()}async initLogos(){var e;try{const t=((e=window.location.pathname.match(/^\/[^\/]+\//))==null?void 0:e[0])||"/",r=`${t}imgs/institutional_logos/manifest.json`,o=await fetch(r);if(!o.ok)throw new Error(`Manifest not found: ${o.status}`);const s=await o.json();this.logos=s.map(n=>({filename:n,path:`${t}imgs/institutional_logos/${n}`})).sort((n,l)=>n.filename.localeCompare(l.filename)),this.footerElement&&this.logos.length>0&&this.updateCarousel()}catch{this.logos=[]}}updateCarousel(){const e=this.footerElement.querySelector(".footer-inner");e&&(e.innerHTML=this.generateCompactFooterHTML(),this.initCarousel())}dirname(e){return e.substring(0,e.lastIndexOf("/"))||"/"}join(...e){return e.map(t=>t.replace(/^\/+|\/+$/g,"")).filter(t=>t.length>0).join("/").replace(/\/+/g,"/")}relative(e,t){const r=e.split("/").filter(a=>a),o=t.split("/").filter(a=>a);let s=0;for(let a=0;a<Math.min(r.length,o.length)&&r[a]===o[a];a++)s++;const n=r.length-s,l=o.slice(s);return"../".repeat(n)+l.join("/")||"./"}normalizePath(e){return e.endsWith("/")?e+"index.html":!e.includes(".")&&!e.endsWith("/")?e+"/index.html":e}calculateBasePath(){var s,n,l;const e=this.dirname(this.currentPath),r="/"+(((l=(n=(s=this.config)==null?void 0:s.project)==null?void 0:n.projectShortTitle)==null?void 0:l.toLowerCase())||"leda"),o=this.relative(e,r);return o===""||o==="."?"./":o||"./"}getRelativePath(e){return this.join(this.basePath,e)}isExternalLink(e){return e.startsWith("http://")||e.startsWith("https://")}render(){return this.footerElement=this.createFooterElement(),this.setupEventListeners(),this.initCarousel(),this.footerElement}createFooterElement(){const e=document.querySelector(".footer-overlay");e&&e.remove();const t=document.createElement("div");return t.className="footer-overlay",t.innerHTML=`
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
        `,document.body.appendChild(t),t}generateCompactFooterHTML(){var s,n,l,c;const e=new Date().getFullYear();(n=(s=this.config)==null?void 0:s.project)!=null&&n.projectTitle;const t=((c=(l=this.config)==null?void 0:l.project)==null?void 0:c.projectShortTitle)||"SASSI",r=this.getNavigationLinks().map(a=>{const h=this.isExternalLink(a.path),d=h?a.path:this.getRelativePath(a.path),f=a.section?`data-section="${a.section}"`:"",b=h?'target="_blank" rel="noopener noreferrer"':"",k=h?`
                <svg class="footer-external-icon" width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                </svg>
            `:"";return`<li><a href="${d}" ${b} ${f}>${a.text}${k}</a></li>`}).join("");let o="";if(this.logos.length>0){const a=this.logos.map(d=>`
                <div class="footer-logo-slide">
                    <img src="${d.path}" alt="Institutional Logo - ${d.filename}" />
                </div>
            `).join(""),h=this.logos.map((d,f)=>`<span class="footer-carousel-dot ${f===0?"active":""}" data-index="${f}"></span>`).join("");o=`
                <div class="footer-logo-carousel-container">
                    <div class="footer-logo-carousel-title">Partner Istituzionali</div>
                    <div class="footer-logo-carousel">
                        <div class="footer-logo-carousel-track">
                            ${a}
                        </div>
                    </div>
                    <div class="footer-carousel-controls">
                        <button class="footer-carousel-btn footer-carousel-prev" aria-label="Previous logo">
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                            </svg>
                        </button>
                        <div class="footer-carousel-dots">
                            ${h}
                        </div>
                        <button class="footer-carousel-btn footer-carousel-next" aria-label="Next logo">
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                            </svg>
                        </button>
                    </div>
                </div>
            `}return`
            <div class="footer-title">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M4.25 2A2.25 2.25 0 002 4.25v2.5A2.25 2.25 0 004.25 9h2.5A2.25 2.25 0 009 6.75v-2.5A2.25 2.25 0 006.75 2h-2.5zm0 9A2.25 2.25 0 002 13.25v2.5A2.25 2.25 0 004.25 18h2.5A2.25 2.25 0 009 15.75v-2.5A2.25 2.25 0 006.75 11h-2.5zm9-9A2.25 2.25 0 0011 4.25v2.5A2.25 2.25 0 0013.25 9h2.5A2.25 2.25 0 0018 6.75v-2.5A2.25 2.25 0 0015.75 2h-2.5zm0 9A2.25 2.25 0 0011 13.25v2.5A2.25 2.25 0 0013.25 18h2.5A2.25 2.25 0 0018 15.75v-2.5A2.25 2.25 0 0015.75 11h-2.5z" clip-rule="evenodd"/>
                </svg>
                ${t}
            </div>
            
            <ul class="footer-nav">
                ${r}
            </ul>
            
            ${o}
            
            <div class="footer-credits">
                <div>© ${e} ${t}. Tutti i diritti riservati.</div>
                <div style="margin-top: 4px;">
                    Sviluppato con <span class="footer-heart">♥</span> per la ricerca storica
                </div>
                <div style="margin-top: 4px;">
                    Powered by OpenStreetMap • GIS Technology
                </div>
            </div>
        `}getNavigationLinks(){return[{text:"Home",path:"index.html"},{text:"Documentazione",path:"https://github.com/valentinapasqual/leda"},{text:"Contatti",path:"https://ledaprin2022pnrr.altervista.org/chi-siamo/"}]}initCarousel(){if(!this.footerElement||this.logos.length===0)return;const e=this.footerElement.querySelector(".footer-logo-carousel-track"),t=this.footerElement.querySelector(".footer-carousel-prev"),r=this.footerElement.querySelector(".footer-carousel-next"),o=this.footerElement.querySelectorAll(".footer-carousel-dot");if(!e)return;this.startCarousel(),t&&t.addEventListener("click",()=>{this.stopCarousel(),this.goToPrevSlide(),this.startCarousel()}),r&&r.addEventListener("click",()=>{this.stopCarousel(),this.goToNextSlide(),this.startCarousel()}),o.forEach(n=>{n.addEventListener("click",()=>{this.stopCarousel();const l=parseInt(n.dataset.index);this.goToSlide(l),this.startCarousel()})});const s=this.footerElement.querySelector(".footer-logo-carousel");s&&(s.addEventListener("mouseenter",()=>this.stopCarousel()),s.addEventListener("mouseleave",()=>this.startCarousel()))}startCarousel(){this.logos.length<=1||(this.stopCarousel(),this.carouselInterval=setInterval(()=>{this.goToNextSlide()},3e3))}stopCarousel(){this.carouselInterval&&(clearInterval(this.carouselInterval),this.carouselInterval=null)}goToSlide(e){var o,s;const t=(o=this.footerElement)==null?void 0:o.querySelector(".footer-logo-carousel-track"),r=(s=this.footerElement)==null?void 0:s.querySelectorAll(".footer-carousel-dot");!t||!r||(this.currentSlide=e,t.style.transform=`translateX(-${e*100}%)`,r.forEach((n,l)=>{n.classList.toggle("active",l===e)}))}goToNextSlide(){const e=(this.currentSlide+1)%this.logos.length;this.goToSlide(e)}goToPrevSlide(){const e=(this.currentSlide-1+this.logos.length)%this.logos.length;this.goToSlide(e)}toggle(){this.isOpen=!this.isOpen,this.footerElement&&(this.footerElement.classList.toggle("open",this.isOpen),this.isOpen&&this.logos.length>0?this.startCarousel():this.stopCarousel())}setupEventListeners(){if(!this.footerElement)return;this.footerElement.querySelectorAll(".footer-trigger").forEach(t=>{t.addEventListener("click",r=>{r.stopPropagation(),this.toggle()})}),this.footerElement.addEventListener("click",t=>{const r=t.target.closest("a[data-section]");if(r&&r.dataset.section){const o=r.dataset.section,s=r.getAttribute("href");if(s&&s.includes("index.html")){t.preventDefault();const n=s.split("#")[0];window.location.href=`${n}#section-${o}`,this.toggle()}}}),document.addEventListener("click",t=>{this.isOpen&&!this.footerElement.contains(t.target)&&this.toggle()}),document.addEventListener("keydown",t=>{t.key==="Escape"&&this.isOpen&&this.toggle()})}destroy(){this.stopCarousel(),this.footerElement&&this.footerElement.remove()}}export{N as U,I as a,A as l,M as s};
