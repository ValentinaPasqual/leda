import{l as y,U as p,a as w}from"./universalFooter-DRDAn_Zc.js";/* empty css              */const C="/atlante/";function f(e){if(!e.aggregations||typeof e.aggregations!="object")return console.warn("Nessuna configurazione aggregations trovata"),null;const l=Object.entries(e.aggregations).map(([r,n])=>({name:r,...n}));if(l.length===0)return console.warn("Nessuna aggregation trovata"),null;const a=l.reduce((r,n)=>{const c=n.category||"Altre categorie";return r[c]||(r[c]=[]),r[c].push(n),r},{}),t=document.createElement("div");t.className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 py-12";const o=document.createElement("div");o.className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8";const i=document.createElement("div");return i.className="space-y-12",Object.entries(a).forEach(([r,n],c)=>{const s=v(r,n,c);i.appendChild(s)}),o.appendChild(i),t.appendChild(o),t}function v(e,l,a){const t=document.createElement("div");t.className="animate-fade-in",t.style.animationDelay=`${a*.1}s`;const o=document.createElement("div");o.className="mb-8";const i=document.createElement("h2");i.className="text-2xl font-bold text-gray-900 mb-2",i.textContent=e,o.appendChild(i);const r=document.createElement("p");r.className="text-gray-600",r.textContent=`${l.length} ${l.length===1?"indice":"indici"}`,o.appendChild(r),t.appendChild(o);const n=document.createElement("div");return n.className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6",l.forEach((c,s)=>{const h=b(c,s);n.appendChild(h)}),t.appendChild(n),t}function b(e,l){let a="bg-primary-800",t="text-primary-600",o="hover:bg-gradient-to-r hover:from-white hover:to-primary-200";switch(e.type){case"simple":a="bg-gradient-to-r from-primary-600 to-primary-800",t="text-primary-600",o="hover:bg-gradient-to-r hover:from-white hover:to-primary-200";break;case"range":a="bg-gradient-to-r from-primary-600 to-primary-800",t="text-primary-600",o="hover:bg-gradient-to-r hover:from-white hover:to-secondary-200";break;case"taxonomy":a="bg-gradient-to-r from-primary-600 to-primary-800",t="text-primary-600",o="hover:bg-gradient-to-r hover:from-white hover:to-accent-200";break}const i=document.createElement("div");i.className="bg-white rounded-xl overflow-hidden shadow-lg border border-gray-200 hover:shadow-2xl hover:scale-105 transition-all duration-300 transform group animate-slide-in-up",i.style.animationDelay=`${l*.1}s`;const r=document.createElement("div");r.className=`${a} p-6 relative overflow-hidden transition-all duration-300`;const n=document.createElement("div");n.className="absolute right-0 top-0 bottom-0 flex items-center justify-center opacity-15 pointer-events-none group-hover:opacity-25 transition-opacity duration-300",n.style.transform="translateX(25%)";let c="";switch(e.type){case"simple":c=`
                <svg viewBox="0 0 100 100" class="w-20 h-20 text-white">
                    <rect x="10" y="20" width="80" height="8" rx="4" fill="currentColor"/>
                    <rect x="10" y="35" width="60" height="8" rx="4" fill="currentColor"/>
                    <rect x="10" y="50" width="70" height="8" rx="4" fill="currentColor"/>
                    <rect x="10" y="65" width="50" height="8" rx="4" fill="currentColor"/>
                    <circle cx="90" cy="24" r="3" fill="currentColor"/>
                    <circle cx="90" cy="39" r="3" fill="currentColor"/>
                    <circle cx="90" cy="54" r="3" fill="currentColor"/>
                    <circle cx="90" cy="69" r="3" fill="currentColor"/>
                </svg>
            `;break;case"range":c=`
                <svg viewBox="0 0 100 100" class="w-20 h-20 text-white">
                    <line x1="10" y1="85" x2="90" y2="85" stroke="currentColor" stroke-width="2"/>
                    <line x1="10" y1="85" x2="10" y2="15" stroke="currentColor" stroke-width="2"/>
                    <rect x="15" y="65" width="12" height="20" fill="currentColor" rx="2"/>
                    <rect x="32" y="45" width="12" height="40" fill="currentColor" rx="2"/>
                    <rect x="49" y="35" width="12" height="50" fill="currentColor" rx="2"/>
                    <rect x="66" y="55" width="12" height="30" fill="currentColor" rx="2"/>
                    <rect x="83" y="25" width="12" height="60" fill="currentColor" rx="2"/>
                </svg>
            `;break;case"taxonomy":c=`
                <svg viewBox="0 0 100 100" class="w-20 h-20 text-white">
                    <circle cx="50" cy="20" r="8" fill="currentColor"/>
                    <line x1="50" y1="28" x2="50" y2="40" stroke="currentColor" stroke-width="3"/>
                    <line x1="30" y1="40" x2="70" y2="40" stroke="currentColor" stroke-width="3"/>
                    <line x1="30" y1="40" x2="30" y2="50" stroke="currentColor" stroke-width="3"/>
                    <line x1="70" y1="40" x2="70" y2="50" stroke="currentColor" stroke-width="3"/>
                    <circle cx="30" cy="55" r="6" fill="currentColor"/>
                    <circle cx="70" cy="55" r="6" fill="currentColor"/>
                    <line x1="30" y1="61" x2="30" y2="70" stroke="currentColor" stroke-width="2"/>
                    <line x1="70" y1="61" x2="70" y2="70" stroke="currentColor" stroke-width="2"/>
                    <line x1="20" y1="70" x2="80" y2="70" stroke="currentColor" stroke-width="2"/>
                    <circle cx="20" cy="75" r="4" fill="currentColor"/>
                    <circle cx="40" cy="75" r="4" fill="currentColor"/>
                    <circle cx="60" cy="75" r="4" fill="currentColor"/>
                    <circle cx="80" cy="75" r="4" fill="currentColor"/>
                </svg>
            `;break;default:c=`
                <svg viewBox="0 0 100 100" class="w-20 h-20 text-white">
                    <circle cx="35" cy="35" r="15" fill="none" stroke="currentColor" stroke-width="4"/>
                    <circle cx="35" cy="35" r="6" fill="currentColor"/>
                    <circle cx="65" cy="65" r="20" fill="none" stroke="currentColor" stroke-width="4"/>
                    <circle cx="65" cy="65" r="8" fill="currentColor"/>
                    <rect x="32" y="20" width="6" height="10" fill="currentColor"/>
                    <rect x="32" y="40" width="6" height="10" fill="currentColor"/>
                    <rect x="20" y="32" width="10" height="6" fill="currentColor"/>
                    <rect x="40" y="32" width="10" height="6" fill="currentColor"/>
                </svg>
            `}n.innerHTML=c,r.appendChild(n);const s=document.createElement("h3");s.className="text-xl font-bold text-white mb-2 relative z-10",s.textContent=e.title||e.name||"Categoria",r.appendChild(s),i.appendChild(r);const h=document.createElement("div");h.className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex justify-end";const m=document.createElement("a"),g=encodeURIComponent(e.name),x=encodeURIComponent(e.type);m.href=`${C}pages/indice.html?index=${g}&view=${x}`,m.className=`inline-flex items-center justify-center w-8 h-8 bg-white ${t} rounded-full ${o} transition-all duration-300 shadow-md hover:shadow-lg border border-gray-200 group hover:scale-110`;const d=document.createElementNS("http://www.w3.org/2000/svg","svg");d.setAttribute("class","w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-300"),d.setAttribute("fill","none"),d.setAttribute("stroke","currentColor"),d.setAttribute("viewBox","0 0 24 24");const u=document.createElementNS("http://www.w3.org/2000/svg","path");return u.setAttribute("stroke-linecap","round"),u.setAttribute("stroke-linejoin","round"),u.setAttribute("stroke-width","2"),u.setAttribute("d","M13 7l5 5-5 5M6 12h12"),d.appendChild(u),m.appendChild(d),h.appendChild(m),i.appendChild(h),i}async function k(){try{const e=await y();new p(e).render(),new w(e).render();const t=document.getElementById("index-cards-container");if(t){const o=f(e);o?(t.innerHTML="",t.appendChild(o),console.log("Layout a griglia generato con successo")):console.log("Nessuna aggregation trovata nella configurazione")}else console.warn("Container per le schede degli indici non trovato");console.log("Navigation e Footer inizializzati")}catch(e){console.error("Errore durante l'inizializzazione:",e)}}document.addEventListener("DOMContentLoaded",k);
