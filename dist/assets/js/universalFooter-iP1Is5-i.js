const b=/^[A-Za-z]:\//;function d(r=""){return r&&r.replace(/\\/g,"/").replace(b,e=>e.toUpperCase())}const y=/^[/\\]{2}/,w=/^[/\\](?![/\\])|^[/\\]{2}(?!\.)|^[A-Za-z]:[/\\]/,m=/^[A-Za-z]:$/,f=/^\/([A-Za-z]:)?$/,k=function(r){if(r.length===0)return".";r=d(r);const e=r.match(y),t=h(r),o=r[r.length-1]==="/";return r=v(r,!t),r.length===0?t?"/":o?"./":".":(o&&(r+="/"),m.test(r)&&(r+="/"),e?t?`//${r}`:`//./${r}`:t&&!h(r)?`/${r}`:r)},L=function(...r){let e="";for(const t of r)if(t)if(e.length>0){const o=e[e.length-1]==="/",i=t[0]==="/";o&&i?e+=t.slice(1):e+=o||i?t:`/${t}`}else e+=t;return k(e)};function E(){return typeof process<"u"&&typeof process.cwd=="function"?process.cwd().replace(/\\/g,"/"):"/"}const g=function(...r){r=r.map(o=>d(o));let e="",t=!1;for(let o=r.length-1;o>=-1&&!t;o--){const i=o>=0?r[o]:E();!i||i.length===0||(e=`${i}/${e}`,t=h(i))}return e=v(e,!t),t&&!h(e)?`/${e}`:e.length>0?e:"."};function v(r,e){let t="",o=0,i=-1,n=0,a=null;for(let s=0;s<=r.length;++s){if(s<r.length)a=r[s];else{if(a==="/")break;a="/"}if(a==="/"){if(!(i===s-1||n===1))if(n===2){if(t.length<2||o!==2||t[t.length-1]!=="."||t[t.length-2]!=="."){if(t.length>2){const l=t.lastIndexOf("/");l===-1?(t="",o=0):(t=t.slice(0,l),o=t.length-1-t.lastIndexOf("/")),i=s,n=0;continue}else if(t.length>0){t="",o=0,i=s,n=0;continue}}e&&(t+=t.length>0?"/..":"..",o=2)}else t.length>0?t+=`/${r.slice(i+1,s)}`:t=r.slice(i+1,s),o=s-i-1;i=s,n=0}else a==="."&&n!==-1?++n:n=-1}return t}const h=function(r){return w.test(r)},$=function(r,e){const t=g(r).replace(f,"$1").split("/"),o=g(e).replace(f,"$1").split("/");if(o[0][1]===":"&&t[0][1]===":"&&t[0]!==o[0])return o.join("/");const i=[...t];for(const n of i){if(o[0]!==n)break;t.shift(),o.shift()}return[...t.map(()=>".."),...o].join("/")},p=function(r){const e=d(r).replace(/\/$/,"").split("/").slice(0,-1);return e.length===1&&m.test(e[0])&&(e[0]+="/"),e.join("/")||(h(r)?"/":".")},u=function(r,e){const t=d(r).split("/");let o="";for(let i=t.length-1;i>=0;i--){const n=t[i];if(n){o=n;break}}return e&&o.endsWith(e)?o.slice(0,-e.length):o};class P{constructor(e){this.currentPath=this.normalizePath(window.location.pathname),this.config=e,this.basePath=this.calculateBasePath(this.config),this.header=null,this.isScrolling=!1,this.scrollThreshold=100}normalizePath(e){return e.endsWith("/")?e+"index.html":!e.includes(".")&&!e.endsWith("/")?e+"/index.html":e}calculateBasePath(e){var n,a;const t=p(this.currentPath),o="/"+((a=(n=e==null?void 0:e.project)==null?void 0:n.projectShortTitle)==null?void 0:a.toLowerCase())||"",i=$(t,o);return i===""||i==="."?"./":i||"./"}getRelativePath(e){return L(this.basePath,e)}render(){const e=this.createNavElement(),t=[{text:"Home",path:"index.html"},{text:"Mappa",path:"pages/mappa.html"},{text:"Indici",path:"pages/indici.html"}],o=this.generateNavHTML(t);return e.innerHTML=o,this.setupEventListeners(),this.setupScrollListener(),console.log("Navigation rendered from:",this.currentPath,"Base path:",this.basePath),e}generateLogoHTML(){var t,o;const e=(o=(t=this.config)==null?void 0:t.project)==null?void 0:o.projectThumbnailURL;if(e&&e.trim()!==""){const i=e.startsWith("imgs/")?this.getRelativePath(e):this.getRelativePath(`imgs/${e}`);return`
                <a href="${this.getRelativePath("index.html")}">
                    <img src="${i}" alt="Logo" class="h-10 object-contain">
                </a>
            `}else return`
                <a href="${this.getRelativePath("index.html")}" class="bg-primary-600 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg hover:bg-primary-700 transition duration-200">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                </a>
            `}generateNavHTML(e){const t=e.map(i=>{const n=this.getRelativePath(i.path),s=this.isActivePath(i.path)?"text-primary-900 border-b-2 border-primary-600 pb-1":"text-gray-600 hover:text-primary-600",l=i.section?`data-section="${i.section}"`:"";return`<a href="${n}" class="nav-link ${s} font-medium transition duration-200" ${l}>${i.text}</a>`}).join(""),o=e.map(i=>{const n=this.getRelativePath(i.path),s=this.isActivePath(i.path)?"text-primary-900 bg-primary-50 font-medium":"text-gray-600 hover:text-primary-600 hover:bg-gray-50",l=i.section?`data-section="${i.section}"`:"";return`<a href="${n}" class="block px-4 py-3 ${s} transition duration-200" ${l}>${i.text}</a>`}).join("");return`
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
            ${o}
        </div>
    </div>
</div>
        `}isActivePath(e){var i,n,a;const t=u(this.currentPath),o=u(e);if(t==="index.html"&&o==="index.html"&&e==="index.html"){const s=p(this.currentPath),l="/"+(((a=(n=(i=this.config)==null?void 0:i.project)==null?void 0:n.projectShortTitle)==null?void 0:a.toLowerCase())||"");return s===l}return t===o}createNavElement(){let e=document.querySelector("header");e||(e=document.createElement("header"),e.className="bg-white shadow-lg border-b border-primary-100 w-full sticky top-0 z-40 transition-all duration-300",document.body.insertBefore(e,document.body.firstChild)),this.header=e;let t=e.querySelector("nav");return t||(t=document.createElement("nav"),t.className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",e.appendChild(t)),t}setupScrollListener(){let e=!1;const t=()=>{if(!this.header)return;const n=window.scrollY>this.scrollThreshold;n&&!this.isScrolling?(this.isScrolling=!0,this.header.className="bg-white shadow-lg border-b border-primary-100 w-full fixed top-0 z-40 transition-all duration-300",document.body.style.paddingTop=this.header.offsetHeight+"px"):!n&&this.isScrolling&&(this.isScrolling=!1,this.header.className="bg-white shadow-lg border-b border-primary-100 w-full sticky top-0 z-40 transition-all duration-300",document.body.style.paddingTop=""),e=!1},o=()=>{e||(requestAnimationFrame(t),e=!0)};window.addEventListener("scroll",o,{passive:!0}),this.cleanupScrollListener=()=>{window.removeEventListener("scroll",o)}}setupEventListeners(){document.addEventListener("click",e=>{const t=e.target.closest("a[data-section]");if(t&&t.dataset.section){const o=t.dataset.section,i=t.getAttribute("href");if(i&&i.includes("index.html")){e.preventDefault();const n=i.split("#")[0];window.location.href=`${n}#section-${o}`}}}),document.addEventListener("click",e=>{const t=document.getElementById("menu-toggle"),o=e.target.closest(".md\\:hidden");t&&t.checked&&!o&&(t.checked=!1)})}destroy(){this.cleanupScrollListener&&this.cleanupScrollListener(),document.body.style.paddingTop=""}}class S{constructor(e){this.currentPath=window.location.pathname,this.basePath=this.calculateBasePath(),this.config=e,this.isOpen=!1,this.footerElement=null}dirname(e){return e.substring(0,e.lastIndexOf("/"))||"/"}join(...e){return e.map(t=>t.replace(/^\/+|\/+$/g,"")).filter(t=>t.length>0).join("/").replace(/\/+/g,"/")}relative(e,t){const o=e.split("/").filter(c=>c),i=t.split("/").filter(c=>c);let n=0;for(let c=0;c<Math.min(o.length,i.length)&&o[c]===i[c];c++)n++;const a=o.length-n,s=i.slice(n);return"../".repeat(a)+s.join("/")||"./"}calculateBasePath(){var o,i,n;const e=this.dirname(this.currentPath),t=((n=(i=(o=this.config)==null?void 0:o.project)==null?void 0:i.projectShortTitle)==null?void 0:n.toLowerCase())||"sassi";return this.dirname(`/${t}`),this.relative(e,"/sassi")||"./"}getRelativePath(e){return this.join(this.basePath,e)}render(){return this.createFooterStyles(),this.footerElement=this.createFooterElement(),this.setupEventListeners(),console.log("Compact footer rendered from:",this.currentPath,"Base path:",this.basePath),this.footerElement}createFooterStyles(){const e=document.getElementById("footer-overlay-styles");e&&e.remove();const t=document.createElement("style");t.id="footer-overlay-styles",t.textContent=`
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
        `,document.head.appendChild(t)}createFooterElement(){const e=document.querySelector(".footer-overlay");e&&e.remove();const t=document.createElement("div");return t.className="footer-overlay",t.innerHTML=`
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
        `,document.body.appendChild(t),t}generateCompactFooterHTML(){var i,n,a,s;const e=new Date().getFullYear();(n=(i=this.config)==null?void 0:i.project)!=null&&n.projectTitle;const t=((s=(a=this.config)==null?void 0:a.project)==null?void 0:s.projectShortTitle)||"SASSI",o=this.getNavigationLinks().map(l=>{const c=this.getRelativePath(l.path),x=l.section?`data-section="${l.section}"`:"";return`<li><a href="${c}" ${x}>${l.text}</a></li>`}).join("");return`
            <div class="footer-title">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M4.25 2A2.25 2.25 0 002 4.25v2.5A2.25 2.25 0 004.25 9h2.5A2.25 2.25 0 009 6.75v-2.5A2.25 2.25 0 006.75 2h-2.5zm0 9A2.25 2.25 0 002 13.25v2.5A2.25 2.25 0 004.25 18h2.5A2.25 2.25 0 009 15.75v-2.5A2.25 2.25 0 006.75 11h-2.5zm9-9A2.25 2.25 0 0011 4.25v2.5A2.25 2.25 0 0013.25 9h2.5A2.25 2.25 0 0018 6.75v-2.5A2.25 2.25 0 0015.75 2h-2.5zm0 9A2.25 2.25 0 0011 13.25v2.5A2.25 2.25 0 0013.25 18h2.5A2.25 2.25 0 0018 15.75v-2.5A2.25 2.25 0 0015.75 11h-2.5z" clip-rule="evenodd"/>
                </svg>
                ${t}
            </div>
            
            <ul class="footer-nav">
                ${o}
            </ul>
            
            <div class="footer-credits">
                <div>© ${e} ${t}. Tutti i diritti riservati.</div>
                <div style="margin-top: 4px;">
                    Sviluppato con <span class="footer-heart">♥</span> per la ricerca storica
                </div>
                <div style="margin-top: 4px;">
                    Powered by OpenStreetMap • GIS Technology
                </div>
            </div>
        `}getNavigationLinks(){return[{text:"Home",path:"index.html",section:"0"},{text:"Documentazione",path:"#",section:"0"},{text:"Contatti",path:"#"}]}toggle(){this.isOpen=!this.isOpen,this.footerElement&&this.footerElement.classList.toggle("open",this.isOpen)}setupEventListeners(){if(!this.footerElement)return;const e=this.footerElement.querySelector(".footer-trigger");e&&e.addEventListener("click",t=>{t.stopPropagation(),this.toggle()}),this.footerElement.addEventListener("click",t=>{const o=t.target.closest("a[data-section]");if(o&&o.dataset.section){const i=o.dataset.section,n=o.getAttribute("href");if(n&&n.includes("index.html")){t.preventDefault();const a=n.split("#")[0];window.location.href=`${a}#section-${i}`,this.toggle()}}}),document.addEventListener("click",t=>{this.isOpen&&!this.footerElement.contains(t.target)&&this.toggle()}),document.addEventListener("keydown",t=>{t.key==="Escape"&&this.isOpen&&this.toggle()})}}export{P as U,S as a};
