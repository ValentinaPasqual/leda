const b=/^[A-Za-z]:\//;function h(i=""){return i&&i.replace(/\\/g,"/").replace(b,t=>t.toUpperCase())}const y=/^[/\\]{2}/,w=/^[/\\](?![/\\])|^[/\\]{2}(?!\.)|^[A-Za-z]:[/\\]/,m=/^[A-Za-z]:$/,g=/^\/([A-Za-z]:)?$/,k=function(i){if(i.length===0)return".";i=h(i);const t=i.match(y),e=d(i),o=i[i.length-1]==="/";return i=v(i,!e),i.length===0?e?"/":o?"./":".":(o&&(i+="/"),m.test(i)&&(i+="/"),t?e?`//${i}`:`//./${i}`:e&&!d(i)?`/${i}`:i)},$=function(...i){let t="";for(const e of i)if(e)if(t.length>0){const o=t[t.length-1]==="/",r=e[0]==="/";o&&r?t+=e.slice(1):t+=o||r?e:`/${e}`}else t+=e;return k(t)};function E(){return typeof process<"u"&&typeof process.cwd=="function"?process.cwd().replace(/\\/g,"/"):"/"}const p=function(...i){i=i.map(o=>h(o));let t="",e=!1;for(let o=i.length-1;o>=-1&&!e;o--){const r=o>=0?i[o]:E();!r||r.length===0||(t=`${r}/${t}`,e=d(r))}return t=v(t,!e),e&&!d(t)?`/${t}`:t.length>0?t:"."};function v(i,t){let e="",o=0,r=-1,n=0,a=null;for(let s=0;s<=i.length;++s){if(s<i.length)a=i[s];else{if(a==="/")break;a="/"}if(a==="/"){if(!(r===s-1||n===1))if(n===2){if(e.length<2||o!==2||e[e.length-1]!=="."||e[e.length-2]!=="."){if(e.length>2){const l=e.lastIndexOf("/");l===-1?(e="",o=0):(e=e.slice(0,l),o=e.length-1-e.lastIndexOf("/")),r=s,n=0;continue}else if(e.length>0){e="",o=0,r=s,n=0;continue}}t&&(e+=e.length>0?"/..":"..",o=2)}else e.length>0?e+=`/${i.slice(r+1,s)}`:e=i.slice(r+1,s),o=s-r-1;r=s,n=0}else a==="."&&n!==-1?++n:n=-1}return e}const d=function(i){return w.test(i)},L=function(i,t){const e=p(i).replace(g,"$1").split("/"),o=p(t).replace(g,"$1").split("/");if(o[0][1]===":"&&e[0][1]===":"&&e[0]!==o[0])return o.join("/");const r=[...e];for(const n of r){if(o[0]!==n)break;e.shift(),o.shift()}return[...e.map(()=>".."),...o].join("/")},f=function(i){const t=h(i).replace(/\/$/,"").split("/").slice(0,-1);return t.length===1&&m.test(t[0])&&(t[0]+="/"),t.join("/")||(d(i)?"/":".")},u=function(i,t){const e=h(i).split("/");let o="";for(let r=e.length-1;r>=0;r--){const n=e[r];if(n){o=n;break}}return t&&o.endsWith(t)?o.slice(0,-t.length):o};class P{constructor(t){this.currentPath=this.normalizePath(window.location.pathname),this.config=t,this.basePath=this.calculateBasePath(this.config),this.header=null,this.isScrolling=!1,this.scrollThreshold=100}normalizePath(t){return t.endsWith("/")?t+"index.html":!t.includes(".")&&!t.endsWith("/")?t+"/index.html":t}calculateBasePath(t){var n,a;const e=f(this.currentPath),o="/"+((a=(n=t==null?void 0:t.project)==null?void 0:n.projectShortTitle)==null?void 0:a.toLowerCase())||"";console.log("HIHIHIHI",o);const r=L(e,o);return r===""||r==="."?"./":r||"./"}getRelativePath(t){return $(this.basePath,t)}render(){const t=this.createNavElement(),e=[{text:"Home",path:"index.html",section:"0"},{text:"Mappa",path:"index.html",section:"1"},{text:"Indici",path:"index.html",section:"2"}],o=this.generateNavHTML(e);return t.innerHTML=o,this.setupEventListeners(),this.setupScrollListener(),console.log("Navigation rendered from:",this.currentPath,"Base path:",this.basePath),t}generateLogoHTML(){var e,o;const t=(o=(e=this.config)==null?void 0:e.project)==null?void 0:o.projectThumbnailURL;if(t&&t.trim()!==""){const r=this.getRelativePath(`imgs/${t}`);return`
                <a href="${this.getRelativePath("index.html")}">
                    <img src="${r}" alt="Logo" class="h-20 object-contain">
                </a>
            `}else return`
                <a href="${this.getRelativePath("index.html")}" class="bg-primary-600 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg hover:bg-primary-700 transition duration-200">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                </a>
            `}generateNavHTML(t){const e=t.map(r=>{const n=this.getRelativePath(r.path),s=this.isActivePath(r.path)?"text-primary-900 border-b-2 border-primary-600 pb-1":"text-gray-600 hover:text-primary-600",l=r.section?`data-section="${r.section}"`:"";return`<a href="${n}" class="nav-link ${s} font-medium transition duration-200" ${l}>${r.text}</a>`}).join(""),o=t.map(r=>{const n=this.getRelativePath(r.path),s=this.isActivePath(r.path)?"text-primary-900 bg-primary-50 font-medium":"text-gray-600 hover:text-primary-600 hover:bg-gray-50",l=r.section?`data-section="${r.section}"`:"";return`<a href="${n}" class="block px-4 py-3 ${s} transition duration-200" ${l}>${r.text}</a>`}).join("");return`
            <div class="flex justify-between items-center h-20">
                <!-- Logo -->
                <div class="flex items-center space-x-4">
                    <div class="flex items-center justify-center">
                        ${this.generateLogoHTML()}
                    </div>
                </div>

                <!-- Desktop Navigation -->
                <div class="hidden md:flex items-center space-x-8">
                    ${e}
                </div>

                <!-- Mobile Menu + CTA -->
                <div class="flex items-center space-x-4">
                    <a href="#" class="hidden md:block text-primary-600 hover:text-primary-800 font-medium transition duration-200">Contatti</a>
                    <a href="#" class="hidden md:block bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-semibold transition duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                        Documentazione
                    </a>
                    
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
                            <div class="border-t border-gray-200 my-2"></div>
                            <a href="#" class="block px-4 py-3 text-primary-600 hover:text-primary-800 font-medium hover:bg-gray-50 transition duration-200">Contatti</a>
                            <div class="px-4 py-2">
                                <a href="#" class="block bg-primary-600 hover:bg-primary-700 text-white px-4 py-3 rounded-lg font-semibold text-center transition duration-200 shadow-lg">
                                    Documentazione
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `}isActivePath(t){const e=u(this.currentPath),o=u(t);if(e==="index.html"&&o==="index.html"){const r=f(this.currentPath),n=f(this.getRelativePath(t)),a=r.replace(/\/$/,"")||"/",s=n.replace(/\/$/,"")||"/";return a===s}return e===o}createNavElement(){let t=document.querySelector("header");t||(t=document.createElement("header"),t.className="bg-white shadow-lg border-b border-primary-100 w-full sticky top-0 z-40 transition-all duration-300",document.body.insertBefore(t,document.body.firstChild)),this.header=t;let e=t.querySelector("nav");return e||(e=document.createElement("nav"),e.className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",t.appendChild(e)),e}setupScrollListener(){let t=!1;const e=()=>{if(!this.header)return;const n=window.scrollY>this.scrollThreshold;n&&!this.isScrolling?(this.isScrolling=!0,this.header.className="bg-white shadow-lg border-b border-primary-100 w-full fixed top-0 z-40 transition-all duration-300",document.body.style.paddingTop=this.header.offsetHeight+"px"):!n&&this.isScrolling&&(this.isScrolling=!1,this.header.className="bg-white shadow-lg border-b border-primary-100 w-full sticky top-0 z-40 transition-all duration-300",document.body.style.paddingTop=""),t=!1},o=()=>{t||(requestAnimationFrame(e),t=!0)};window.addEventListener("scroll",o,{passive:!0}),this.cleanupScrollListener=()=>{window.removeEventListener("scroll",o)}}setupEventListeners(){document.addEventListener("click",t=>{const e=t.target.closest("a[data-section]");if(e&&e.dataset.section){const o=e.dataset.section,r=e.getAttribute("href");if(r&&r.includes("index.html")){t.preventDefault();const n=r.split("#")[0];window.location.href=`${n}#section-${o}`}}}),document.addEventListener("click",t=>{const e=document.getElementById("menu-toggle"),o=t.target.closest(".md\\:hidden");e&&e.checked&&!o&&(e.checked=!1)})}destroy(){this.cleanupScrollListener&&this.cleanupScrollListener(),document.body.style.paddingTop=""}}class S{constructor(t){this.currentPath=window.location.pathname,this.basePath=this.calculateBasePath(),this.config=t,this.isOpen=!1,this.footerElement=null}dirname(t){return t.substring(0,t.lastIndexOf("/"))||"/"}join(...t){return t.map(e=>e.replace(/^\/+|\/+$/g,"")).filter(e=>e.length>0).join("/").replace(/\/+/g,"/")}relative(t,e){const o=t.split("/").filter(c=>c),r=e.split("/").filter(c=>c);let n=0;for(let c=0;c<Math.min(o.length,r.length)&&o[c]===r[c];c++)n++;const a=o.length-n,s=r.slice(n);return"../".repeat(a)+s.join("/")||"./"}calculateBasePath(){var o,r,n;const t=this.dirname(this.currentPath),e=((n=(r=(o=this.config)==null?void 0:o.project)==null?void 0:r.projectShortTitle)==null?void 0:n.toLowerCase())||"sassi";return this.dirname(`/${e}`),this.relative(t,"/sassi")||"./"}getRelativePath(t){return this.join(this.basePath,t)}render(){return this.createFooterStyles(),this.footerElement=this.createFooterElement(),this.setupEventListeners(),console.log("Compact footer rendered from:",this.currentPath,"Base path:",this.basePath),this.footerElement}createFooterStyles(){const t=document.getElementById("footer-overlay-styles");t&&t.remove();const e=document.createElement("style");e.id="footer-overlay-styles",e.textContent=`
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
        `,document.head.appendChild(e)}createFooterElement(){const t=document.querySelector(".footer-overlay");t&&t.remove();const e=document.createElement("div");return e.className="footer-overlay",e.innerHTML=`
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
        `,document.body.appendChild(e),e}generateCompactFooterHTML(){var r,n,a,s;const t=new Date().getFullYear();(n=(r=this.config)==null?void 0:r.project)!=null&&n.projectTitle;const e=((s=(a=this.config)==null?void 0:a.project)==null?void 0:s.projectShortTitle)||"SASSI",o=this.getNavigationLinks().map(l=>{const c=this.getRelativePath(l.path),x=l.section?`data-section="${l.section}"`:"";return`<li><a href="${c}" ${x}>${l.text}</a></li>`}).join("");return`
            <div class="footer-title">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M4.25 2A2.25 2.25 0 002 4.25v2.5A2.25 2.25 0 004.25 9h2.5A2.25 2.25 0 009 6.75v-2.5A2.25 2.25 0 006.75 2h-2.5zm0 9A2.25 2.25 0 002 13.25v2.5A2.25 2.25 0 004.25 18h2.5A2.25 2.25 0 009 15.75v-2.5A2.25 2.25 0 006.75 11h-2.5zm9-9A2.25 2.25 0 0011 4.25v2.5A2.25 2.25 0 0013.25 9h2.5A2.25 2.25 0 0018 6.75v-2.5A2.25 2.25 0 0015.75 2h-2.5zm0 9A2.25 2.25 0 0011 13.25v2.5A2.25 2.25 0 0013.25 18h2.5A2.25 2.25 0 0018 15.75v-2.5A2.25 2.25 0 0015.75 11h-2.5z" clip-rule="evenodd"/>
                </svg>
                ${e}
            </div>
            
            <ul class="footer-nav">
                ${o}
            </ul>
            
            <div class="footer-credits">
                <div>© ${t} ${e}. Tutti i diritti riservati.</div>
                <div style="margin-top: 4px;">
                    Sviluppato con <span class="footer-heart">♥</span> per la ricerca storica
                </div>
                <div style="margin-top: 4px;">
                    Powered by OpenStreetMap • GIS Technology
                </div>
            </div>
        `}getNavigationLinks(){return[{text:"Home",path:"index.html",section:"0"},{text:"Mappa",path:"index.html",section:"1"},{text:"Ricerca",path:"index.html",section:"2"},{text:"Docs",path:"#"}]}toggle(){this.isOpen=!this.isOpen,this.footerElement&&this.footerElement.classList.toggle("open",this.isOpen)}setupEventListeners(){if(!this.footerElement)return;const t=this.footerElement.querySelector(".footer-trigger");t&&t.addEventListener("click",e=>{e.stopPropagation(),this.toggle()}),this.footerElement.addEventListener("click",e=>{const o=e.target.closest("a[data-section]");if(o&&o.dataset.section){const r=o.dataset.section,n=o.getAttribute("href");if(n&&n.includes("index.html")){e.preventDefault();const a=n.split("#")[0];window.location.href=`${a}#section-${r}`,this.toggle()}}}),document.addEventListener("click",e=>{this.isOpen&&!this.footerElement.contains(e.target)&&this.toggle()}),document.addEventListener("keydown",e=>{e.key==="Escape"&&this.isOpen&&this.toggle()})}}export{P as U,S as a};
