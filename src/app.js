/* =====================================================================
   Pax - Saúde · v3.0 (nov/2026)
   App de página única: dados em dados.js, sem servidor.
   Serviços gratuitos: OpenStreetMap/CARTO (mapas), Nominatim (endereços),
   OSRM (rotas), Mapillary e Wikimedia Commons (fotos), Google Maps (links).
   ===================================================================== */
const CFG={
 mapillary:'MLY|28963648059968063|2604d9bc5dd187e793f457ba123af6c0', /* token público do Mapillary (MLY|...). Também pode ser colado em Menu › Fontes e créditos */
 empresa:'[Nome da empresa]',email:'[e-mail de contato]',versao:'3.0',dataRef:'nov/2026'
};

/* ============ ESTADO ============ */
const LS={get(k,d){try{const v=localStorage.getItem('pax2_'+k);return v?JSON.parse(v):d}catch(e){return d}},set(k,v){try{localStorage.setItem('pax2_'+k,JSON.stringify(v))}catch(e){}},del(k){try{localStorage.removeItem('pax2_'+k)}catch(e){}}};
const ORIGEM_PADRAO={k:'ponto',id:'r14',n:'Avenida Paulista (MASP)',sub:'Bela Vista',la:-23.5614,lo:-46.6559};
const S={
 view:'inicio',pg:null,origin:LS.get('origin',ORIGEM_PADRAO),dest:null,sel:null,flow:{tipo:null,modo:null,item:null},
 q:'',qi:'',cat:'todos',sort:'perto',fOpen:false,fWa:false,fConv:false,fSus:false,f24:false,map:true,
 favs:LS.get('favs',[]),hist:LS.get('hist',[]),rmode:null,rmap:'osm',
 user:LS.get('user',null),a11y:Object.assign({fs:0,hc:false,leg:false,ler:false,simples:false,nomo:false},LS.get('a11y',{}))
};
(function(){const n=LS.get('nome','');if(!S.user&&n){S.user={nome:n,cel:'',deps:[]};LS.set('user',S.user)}})();
if(!CFG.mapillary)CFG.mapillary=LS.get('mly','');
const GEO=LS.get('geo',{});LOC.forEach(p=>{if(GEO[p.id]){p.la=GEO[p.id][0];p.lo=GEO[p.id][1];p.geo=1}});
const byId=id=>LOC.find(x=>x.id===id);
const $=id=>document.getElementById(id);

/* ============ UTILIDADES ============ */
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const enc=encodeURIComponent;
function km(a,b){if(!a||!b||a.la==null||b.la==null)return null;const R=6371,r=x=>x*Math.PI/180;const dLa=r(b.la-a.la),dLo=r(b.lo-a.lo);const h=Math.sin(dLa/2)**2+Math.cos(r(a.la))*Math.cos(r(b.la))*Math.sin(dLo/2)**2;return 2*R*Math.asin(Math.sqrt(h))}
const fkm=d=>d==null?'—':(d<1?Math.round(d*100)*10+' m':d.toFixed(1).replace('.',',')+' km');
const fmin=m=>{m=Math.max(1,Math.round(m));return m<60?m+' min':Math.floor(m/60)+'h'+String(m%60).padStart(2,'0')};
const telHref=t=>'tel:+55'+t.replace(/\s*\([^)]*\)\s*$/,'').replace(/[^\d]/g,'');
function agoraSP(){const s=new Date().toLocaleString('en-US',{timeZone:'America/Sao_Paulo',hour12:false,weekday:'short',hour:'2-digit',minute:'2-digit'});const m=s.match(/(\w+),?\s+(\d+):(\d+)/);const dias={Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6};return m?{d:dias[m[1]],min:(+m[2]%24)*60+(+m[3])}:{d:new Date().getDay(),min:new Date().getHours()*60+new Date().getMinutes()}}
const toMin=s=>{const[a,b]=s.split(':');return +a*60+ +b};
function status(p){if(p.h==='24h')return{k:'aberto',t:'Aberto 24h'};if(!Array.isArray(p.h))return{k:'?',t:p.c==='online'?'Online':'Horário a confirmar'};const n=agoraSP();for(const r of p.h){if(r.d.includes(n.d)&&n.min>=toMin(r.a)&&n.min<toMin(r.f))return{k:'aberto',t:'Aberto · fecha '+r.f.replace(':00','h').replace(':','h')}}return{k:'fechado',t:'Fechado agora'}}
const isOnline=p=>p.c==='online';
const dist=p=>isOnline(p)?null:km(S.origin,p);
const nota=p=>p.g?p.g.v:0;
function toast(t){const el=$('toast');el.innerHTML=`<div class="toast" role="status">${esc(t)}</div>`;clearTimeout(toast._t);toast._t=setTimeout(()=>el.innerHTML='',2800)}
const primeiroNome=()=>S.user&&S.user.nome?S.user.nome.trim().split(/\s+/)[0]:'';
const fmtCel=v=>{const d=String(v||'').replace(/\D/g,'').slice(0,11);if(d.length<=2)return d?'('+d:'';if(d.length<=7)return `(${d.slice(0,2)}) ${d.slice(2)}`;return `(${d.slice(0,2)}) ${d.slice(2,d.length-4)}-${d.slice(-4)}`};

/* ============ ÍCONES ============ */
const SVG=(p,c,w,sw)=>`<svg width="${w||22}" height="${w||22}" viewBox="0 0 24 24" fill="none" stroke="${c||'currentColor'}" stroke-width="${sw||2}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const P={
 menu:'<path d="M4 7h16M4 12h16M4 17h10"/>',home:'<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>',search:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
 cal:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>',
 mic:'<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/>',pin:'<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
 back:'<path d="M15 18l-6-6 6-6"/>',chev:'<path d="M9 6l6 6-6 6"/>',down:'<path d="M6 9l6 6 6-6"/>',plus:'<path d="M12 5v14M5 12h14"/>',x:'<path d="M6 6l12 12M18 6L6 18"/>',
 route:'<circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M8.5 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5"/>',
 phone:'<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
 share:'<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4"/>',
 gps:'<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',swap:'<path d="M7 4v16M3 8l4-4 4 4M17 20V4M13 16l4 4 4-4"/>',
 speaker:'<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>',aa:'<path d="M3 18l4.5-12L12 18M4.7 14h5.6"/><path d="M14 18l3-8 3 8M15 15.5h4"/>',
 alert:'<path d="M12 3l10 18H2z"/><path d="M12 10v4M12 17.5v.01"/>',help:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.6M12 17v.01"/>',
 mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',shield:'<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
 doc:'<path d="M14 3H6v18h12V7z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/>',
 book:'<path d="M4 4h6a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4z"/><path d="M20 4h-6a3 3 0 0 0-3 3"/><path d="M20 4v14h-7"/>',brief:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5h6v2M3 12h18"/>',
 users:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.5 3.3-5.5 6.5-5.5s5.7 2 6.5 5.5"/><circle cx="17" cy="9" r="2.8"/><path d="M17 14.5c2.4.2 4 1.8 4.5 4.5"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',map:'<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/>',
 video:'<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3"/>',build:'<path d="M4 21V7l8-4 8 4v14"/><path d="M9 21v-5h6v5"/><path d="M12 7v5M9.5 9.5h5"/>',
 flask:'<path d="M9 3h6"/><path d="M10 3v6L5 19a1.5 1.5 0 0 0 1.3 2h11.4a1.5 1.5 0 0 0 1.3-2L14 9V3"/><path d="M7.5 15h9"/>',
 scan:'<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="12" cy="12" r="4"/><path d="M12 8v8"/>',
 steth:'<path d="M6 3v6a4 4 0 0 0 8 0V3"/><path d="M10 13v3a5 5 0 0 0 10 0v-2"/><circle cx="20" cy="12" r="2"/>',
 ambul:'<path d="M3 16V8h11v8M14 11h4l3 3v2h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/><path d="M8.5 9.5v4M6.5 11.5h4"/>',
 wa2:'<path d="M4 20l1.3-3.9A8 8 0 1 1 8 18.7z"/><path d="M9.2 8.8c.2 2.8 3 5.6 5.9 5.9l1.1-1.3-1.8-.9-.8.7c-1.1-.5-1.9-1.3-2.4-2.4l.7-.8-.9-1.8z"/>',
 heart:'<path d="M12 20s-7-4.5-9-9a4.5 4.5 0 0 1 9-3 4.5 4.5 0 0 1 9 3c-2 4.5-9 9-9 9z"/>',gift:'<path d="M12 3v18M3 12h18"/><circle cx="12" cy="12" r="9"/>',
 cardio:'<path d="M12 20s-7-4.5-9-9a4.5 4.5 0 0 1 9-3 4.5 4.5 0 0 1 9 3c-.4.9-1 1.8-1.7 2.6"/><path d="M3 12h4l2-3 3 6 2-3h7"/>',
 dermato:'<path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8z"/><path d="M18 15l.9 2.1 2.1.9-2.1.9L18 21l-.9-2.1L15 18l2.1-.9z"/>',
 drop:'<path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z"/>',gastro:'<path d="M9 3v4c0 2-3 3-3 7a6 6 0 0 0 12 0c0-3-3-3-3-5V3"/>',
 female:'<circle cx="12" cy="9" r="5"/><path d="M12 14v7M9 18h6"/>',brain:'<path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 3 3h1V4z"/><path d="M15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-3 3h-1V4z"/>',
 eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',bone:'<path d="M7 17L17 7"/><circle cx="5.5" cy="18.5" r="2"/><circle cx="18.5" cy="5.5" r="2"/><circle cx="4" cy="15.5" r="1.5"/><circle cx="8.5" cy="20" r="1.5"/><circle cx="15.5" cy="4" r="1.5"/><circle cx="20" cy="8.5" r="1.5"/>',
 ear:'<path d="M7 9a5 5 0 0 1 10 0c0 3-3 4-3 7a3 3 0 0 1-6 0"/><path d="M10 9a2 2 0 0 1 4 0"/>',baby:'<circle cx="12" cy="12" r="8"/><path d="M9 14a3 3 0 0 0 6 0"/><path d="M9.5 10v.01M14.5 10v.01"/>',
 chat:'<path d="M4 5h16v11H9l-5 4z"/><path d="M8 10h8"/>',wave:'<path d="M2 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0"/><rect x="3" y="4" width="18" height="16" rx="3"/>',
 tube:'<path d="M9 3h6M10 3v15a2 2 0 0 0 4 0V3"/><path d="M10 12h4"/>'
};
const I=new Proxy({},{get:(o,k)=>(c,w,sw)=>SVG(P[k]||P.info,c,w,sw)});
const ICW='<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#063B21" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+P.wa2+'</svg>';
const IC_ESP={clinica:'steth',cardio:'cardio',dermato:'dermato',endo:'drop',gastro:'gastro',gineco:'female',neuro:'brain',oftalmo:'eye',orto:'bone',otorrino:'ear',pedi:'baby',psiq:'chat',uro:'drop'};
const IC_IMG={rx:'bone',us:'wave',tc:'scan',rm:'scan',mamo:'female',dens:'bone',eco:'cardio'};
const IC_CAT={hospital:'build',clinica:'steth',medico:'user',laboratorio:'flask',imagem:'scan',online:'video'};
const LOGO=(s,c1,c2)=>{c1=c1||'#0B4F5C';c2=c2||'#14A39A';return `<svg width="${s}" height="${s}" viewBox="0 0 64 64" aria-hidden="true"><path fill="${c2}" d="M32 5c7.5 7.5 7.5 18 0 25.5-7.5-7.5-7.5-18 0-25.5z"/><path fill="${c1}" d="M32 59c-7.5-7.5-7.5-18 0-25.5 7.5 7.5 7.5 18 0 25.5z"/><path fill="${c1}" d="M5 32c7.5-7.5 18-7.5 25.5 0-7.5 7.5-18 7.5-25.5 0z"/><path fill="${c2}" d="M59 32c-7.5 7.5-18 7.5-25.5 0 7.5-7.5 18-7.5 25.5 0z"/><g stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity=".75"><path d="M32 10v15M32 39v15M10 32h15M39 32h15"/></g><circle cx="32" cy="32" r="3.4" fill="${c2}"/></svg>`};
const PINSVG=c=>`<svg width="30" height="38" viewBox="0 0 30 38" aria-hidden="true"><path d="M15 37s13-12.3 13-22A13 13 0 0 0 2 15c0 9.7 13 22 13 22z" fill="${c}" stroke="#fff" stroke-width="2.5"/><circle cx="15" cy="15" r="5" fill="#fff"/></svg>`;
const STAR=(f,s)=>`<svg width="${s||18}" height="${s||18}" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="sg${Math.round(f*100)}"><stop offset="${f*100}%" stop-color="#F4B400"/><stop offset="${f*100}%" stop-color="#E3E8E8"/></linearGradient></defs><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" fill="url(#sg${Math.round(f*100)})"/></svg>`;
const estrelas=(v,s)=>`<span class="stars" aria-hidden="true">${[1,2,3,4,5].map(i=>STAR(Math.max(0,Math.min(1,v-i+1)),s)).join('')}</span>`;

/* ============ FOTOS (site oficial → Mapillary → Wikimedia Commons → miniatura do mapa) ============ */
const FOTOS=LS.get('fotos3',{});
function fonteFoto(p,u){if(/wikimedia/.test(u))return'Wikimedia Commons';if(p.fotoRede)return'Imagem da rede';return'Site oficial'}
function fotosDe(p){const a=[];if(p.foto)a.push({u:p.foto,src:fonteFoto(p,p.foto),link:p.site||p.f});(p.fotos2||[]).forEach(u=>a.push({u,src:fonteFoto(p,u),link:p.site||p.f}));(FOTOS[p.id]||[]).forEach(x=>a.push(x));return a}
const FQ=[];let FQrun=0;
function pedirFotos(p){if(!p||isOnline(p)||p.la==null||FOTOS[p.id]||p._fq)return;p._fq=1;FQ.push(p);bombaFQ()}
function bombaFQ(){while(FQrun<2&&FQ.length){const p=FQ.shift();FQrun++;buscaFotos(p).catch(()=>{}).then(()=>{FQrun--;bombaFQ()})}}
async function buscaFotos(p){const out=[];let ok=false;if(typeof fetch!=='function')return;
 if(CFG.mapillary){try{const d=.00055;const r=await fetch(`https://graph.mapillary.com/images?access_token=${enc(CFG.mapillary)}&fields=id,thumb_1024_url,captured_at&bbox=${p.lo-d},${p.la-d},${p.lo+d},${p.la+d}&limit=6`);if(r.ok){ok=true;const j=await r.json();(j.data||[]).filter(x=>x.thumb_1024_url).sort((a,b)=>(b.captured_at||0)-(a.captured_at||0)).slice(0,3).forEach(x=>out.push({u:x.thumb_1024_url,src:'Mapillary',link:'https://www.mapillary.com/app/?pKey='+x.id,rua:1}))}}catch(e){}}
 try{const r=await fetch(`https://commons.wikimedia.org/w/api.php?action=query&generator=geosearch&ggscoord=${p.la}%7C${p.lo}&ggsradius=120&ggslimit=10&ggsnamespace=6&prop=imageinfo&iiprop=url&iiurlwidth=900&format=json&origin=*`);if(r.ok){ok=true;const j=await r.json();const pg=j.query&&j.query.pages?Object.values(j.query.pages):[];pg.filter(x=>/\.(jpe?g|png|webp)$/i.test(x.title)&&!/map|mapa|logo|bandeira|flag/i.test(x.title)&&x.imageinfo&&x.imageinfo[0]).sort((a,b)=>(a.index||0)-(b.index||0)).slice(0,3).forEach(x=>out.push({u:x.imageinfo[0].thumburl||x.imageinfo[0].url,src:'Wikimedia Commons',link:x.imageinfo[0].descriptionurl}))}}catch(e){}
 if(ok){FOTOS[p.id]=out;LS.set('fotos3',FOTOS)}else p._fq=0;
 if(out.length)atualizaCapas(p)}
function atualizaCapas(p){document.querySelectorAll(`[data-cov="${p.id}"]`).forEach(el=>{el.outerHTML=cover(p,el.dataset.h)});if(S.view==='local'&&S.sel===p.id){const g=$('gal');if(g){g.innerHTML=galeria(p);ligaGaleria()}}observar()}
let IO=null;
function observar(){if(typeof IntersectionObserver==='undefined')return;if(!IO)IO=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){IO.unobserve(e.target);const p=byId(+e.target.dataset.cov);if(p&&!p.foto)pedirFotos(p)}}),{rootMargin:'250px'});document.querySelectorAll('[data-cov]').forEach(el=>IO.observe(el))}
/* miniatura de mapa (OpenStreetMap/CARTO) centrada no endereço */
function tileXY(la,lo,z){const n=2**z;const r=la*Math.PI/180;return[(lo+180)/360*n,(1-Math.log(Math.tan(r)+1/Math.cos(r))/Math.PI)/2*n]}
function mapThumb(p,hx,hy){if(p.la==null)return`<span style="position:absolute;inset:0;background:linear-gradient(135deg,${CATS[p.c].cor},#0B4F5C);display:flex;align-items:center;justify-content:center">${I[IC_CAT[p.c]]('#fff',54,1.6)}</span>`;
 const z=16,[x,y]=tileXY(p.la,p.lo,z),px=x*256,py=y*256;let h='';
 for(let tx=Math.floor((px-hx)/256);tx<=Math.floor((px+hx)/256);tx++)for(let ty=Math.floor((py-hy)/256);ty<=Math.floor((py+hy)/256);ty++)h+=`<img src="https://${'abcd'[(tx+ty)&3]}.basemaps.cartocdn.com/rastertiles/voyager/${z}/${tx}/${ty}.png" style="left:${Math.round(tx*256-px)}px;top:${Math.round(ty*256-py)}px" alt="" loading="lazy">`;
 return `<span class="tiles" aria-hidden="true">${h}</span><span class="pin">${PINSVG(CATS[p.c].cor)}</span>`}
function cover(p,h){h=h||'8.5rem';const f=fotosDe(p)[0];const c=CATS[p.c];
 return `<span class="cover" data-cov="${p.id}" data-h="${h}" style="height:${h}">${mapThumb(p,340,150)}${f?`<img class="ph" src="${esc(f.u)}" alt="Foto: ${esc(p.n)}" loading="lazy" referrerpolicy="no-referrer" onerror="var s=this.parentNode.querySelector('.src');if(s)s.textContent='Mapa · OSM/CARTO';this.remove()">`:''}<span class="bdg">${esc(c.um.toUpperCase())}</span><span class="src">${f?esc(f.src):p.la!=null?'Mapa · OSM/CARTO':'Online'}</span></span>`}
function galeria(p){const fs=fotosDe(p);const sl=fs.map(f=>`<span class="cover" style="height:15rem"><span style="position:absolute;inset:0;background:#DCE8E6"></span><img class="ph" src="${esc(f.u)}" alt="Foto ${f.rua?'de rua perto':'de'} ${esc(p.n)}" referrerpolicy="no-referrer" onerror="this.parentNode.remove()"><a class="src" href="${esc(f.link||'#')}" target="_blank" rel="noopener">${f.rua?'Foto de rua · ':''}${esc(f.src)}</a></span>`);
 if(!isOnline(p))sl.push(`<span class="cover" style="height:15rem">${mapThumb(p,420,180)}<span class="src">Mapa · © OpenStreetMap © CARTO</span></span>`);else sl.push(`<span class="cover" style="height:15rem">${mapThumb(p)}</span>`);
 return `<div class="gallery" id="galsc">${sl.join('')}</div>${sl.length>1?`<div class="dots" id="galdots">${sl.map((x,i)=>`<i class="${i?'':'on'}"></i>`).join('')}</div>`:''}`}
function ligaGaleria(){const g=$('galsc'),d=$('galdots');if(!g||!d)return;g.addEventListener('scroll',()=>{const i=Math.round(g.scrollLeft/Math.max(1,g.clientWidth));[...d.children].forEach((x,k)=>x.classList.toggle('on',k===i))},{passive:true})}

/* ============ GEOLOCALIZAÇÃO E ROTAS (serviços gratuitos) ============ */
const limpaEnd=e=>e.replace(/\(.*?\)/g,'').replace(/,?\s*(cj\.|conj\.|sala|andar|\d+º andar|1º andar|sobreloja)[^–,]*/gi,'').replace(/\s*–\s*/g,', ').replace(/\s+/g,' ').trim();
let geoFila=Promise.resolve();
function geocode(q){return geoFila=geoFila.then(()=>new Promise(r=>setTimeout(r,1100))).then(()=>fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=br&accept-language=pt-BR&q='+enc(q)).then(r=>r.ok?r.json():[]).then(j=>j&&j[0]?{la:+j[0].lat,lo:+j[0].lon,nome:j[0].display_name}:null).catch(()=>null))}
async function refinar(p){if(!p||p.geo||isOnline(p))return p;p.geo=1;const g=await geocode(limpaEnd(p.e));if(g&&km(p,g)<3){p.la=g.la;p.lo=g.lo;GEO[p.id]=[g.la,g.lo];LS.set('geo',GEO)}return p}
const ROTAS={};
async function osrm(perfil,o,d){const k=[perfil,o.la,o.lo,d.la,d.lo].join();if(ROTAS[k])return ROTAS[k];
 try{const r=await fetch(`https://routing.openstreetmap.de/routed-${perfil}/route/v1/driving/${o.lo},${o.la};${d.lo},${d.la}?overview=full&geometries=geojson`);if(!r.ok)throw 0;const j=await r.json();const x=j.routes&&j.routes[0];if(!x)throw 0;return ROTAS[k]={km:x.distance/1000,min:x.duration/60,geo:x.geometry.coordinates.map(c=>[c[1],c[0]])}}catch(e){return null}}
function estMaisProx(pt){let best=null,bd=1e9;for(const e of EST){const d=km(pt,e);if(d<bd){bd=d;best=e}}return{e:best,d:bd}}
function qtxt(pt){if(!pt)return'';if(pt.k==='unidade')return pt.e;if(pt.k==='gps'||pt.k==='geo')return pt.la+','+pt.lo;return pt.n+', São Paulo - SP'}
const gmaps=(o,d,m)=>`https://www.google.com/maps/dir/?api=1&origin=${enc(qtxt(o))}&destination=${enc(qtxt(d))}&travelmode=${m}`;
const gplace=p=>`https://www.google.com/maps/search/?api=1&query=${enc(p.n+', '+limpaEnd(p.e))}`;
const waze=d=>d.la!=null?`https://waze.com/ul?ll=${d.la},${d.lo}&navigate=yes`:`https://waze.com/ul?q=${enc(qtxt(d))}&navigate=yes`;
const uber=d=>`https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[formatted_address]=${enc(qtxt(d))}`+(d.la!=null?`&dropoff[latitude]=${d.la}&dropoff[longitude]=${d.lo}`:'');
const ptFromUnit=p=>({k:'unidade',id:p.id,n:p.n,sub:p.e,e:p.e,la:p.la,lo:p.lo});

/* ============ MAPAS (Leaflet + OpenStreetMap/CARTO) ============ */
let MAPAS=[];
function matarMapas(){MAPAS.forEach(m=>{try{m.remove()}catch(e){}});MAPAS=[]}
function novoMapa(id){const el=$(id);if(!el)return null;if(typeof window.L==='undefined'||!window.L.map){el.innerHTML='<div class="empty">O mapa precisa de internet para carregar. Use os botões do Google Maps.</div>';return null}
 const m=window.L.map(el,{zoomControl:true,attributionControl:true,scrollWheelZoom:false});
 window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',{subdomains:'abcd',maxZoom:19,attribution:'© OpenStreetMap · © CARTO'}).addTo(m);MAPAS.push(m);return m}
function pinOrigem(m){if(!m||S.origin.la==null)return;window.L.circleMarker([S.origin.la,S.origin.lo],{radius:9,color:'#fff',weight:3,fillColor:'#2563EB',fillOpacity:1}).addTo(m).bindTooltip('Você: '+S.origin.n)}
function mapaResultados(id,lista){const m=novoMapa(id);if(!m)return;const b=[];pinOrigem(m);if(S.origin.la!=null)b.push([S.origin.la,S.origin.lo]);
 lista.filter(p=>p.la!=null).slice(0,60).forEach(p=>{const mk=window.L.circleMarker([p.la,p.lo],{radius:8,color:'#fff',weight:2,fillColor:CATS[p.c].cor,fillOpacity:1}).addTo(m);mk.bindTooltip(p.n);mk.on('click',()=>abrir(p.id));b.push([p.la,p.lo])});
 if(b.length>1)m.fitBounds(b.slice(0,12),{padding:[28,28],maxZoom:15});else if(b.length)m.setView(b[0],15);else m.setView([-23.56,-46.66],13)}

/* ============ WHATSAPP ============ */
function msgWA(p,o){
 const per={manha:'pela manhã',tarde:'à tarde',qualquer:'em qualquer horário'}[o.per];
 const pag=o.pag==='convenio'?('convênio'+(o.plano?' ('+o.plano+')':'')):'particular';
 const quem=(o.nome||'[nome do paciente]')+(o.rel?' ('+o.rel+')':'');
 if(o.tipo==='exame')return `Olá, ${p.n}! Encontrei vocês pelo app Pax - Saúde e gostaria de agendar o exame: ${o.item}.\n\nPaciente: ${quem}\nPreferência: ${per}, ${o.quando}\nPagamento: ${pag}\n\nPreciso de algum preparo? Quais horários vocês têm disponíveis?`;
 return `Olá, ${p.n}! Encontrei vocês pelo app Pax - Saúde e gostaria de agendar uma consulta${o.item?' de '+o.item:''}${o.online?' online (por vídeo)':''}.\n\nPaciente: ${quem}\nPreferência: ${per}, ${o.quando}\nPagamento: ${pag}\n\nQuais horários vocês têm disponíveis?`}
const waUrl=(p,t)=>'https://wa.me/'+p.wa+'?text='+enc(t);
function opcoesItem(p,tipo){if(tipo==='exame'){const a=p.img.map(k=>IMGX[k][0]);if(p.lab)LABX.forEach(x=>a.push(x[0]));return a.length?a:['Exames']}const a=p.esp.map(k=>ESP[k][0]);return a.length?a:(p.sp?[p.sp]:['Clínica geral'])}

/* ============ VOZ (busca e leitura) ============ */
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
const TTS=typeof window.speechSynthesis!=='undefined';
function falar(t){if(!TTS){toast('Leitura em voz alta indisponível neste navegador');return}try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.lang='pt-BR';u.rate=.95;speechSynthesis.speak(u)}catch(e){}}
function lerTela(){if(S.view==='local'){const p=byId(S.sel);if(p){const st=status(p);return falar(`${p.n}. ${CATS[p.c].um}. ${st.t}. ${isOnline(p)?'':'Endereço: '+limpaEnd(p.e)+'. Distância: '+fkm(dist(p)).replace(',',' vírgula ')+'.'} Horário: ${p.hr}. ${p.t.length?'Telefone: '+p.t[0].replace(/\s*\(.*\)$/,'')+'.':''} ${p.wa?'Tem WhatsApp para agendar.':''} ${p.g?'Nota no Google: '+String(p.g.v).replace('.',' vírgula ')+' de 5.':''}`)}}
 const el=$('app');falar((el.innerText||el.textContent||'').replace(/\s+/g,' ').slice(0,1400))}
function voz(alvo){if(!SR){toast('Busca por voz indisponível neste navegador');return}try{const r=new SR();r.lang='pt-BR';r.interimResults=false;const b=document.querySelector(`[data-act="voz"][data-alvo="${alvo}"],[data-act="vozglobal"]`);if(b)b.classList.add('on');toast('Pode falar…');
 r.onresult=e=>{const t=e.results[0][0].transcript;if(alvo==='global'){S.q=t;S.cat='todos';irTab('buscar');return}const el=$(alvo);if(el){el.value=t;el.dispatchEvent(new Event('input',{bubbles:true}));if(alvo==='qh'){S.q=t;S.cat='todos';irTab('buscar')}}};
 r.onend=()=>document.querySelectorAll('.on').forEach(x=>x.classList.remove('on'));r.onerror=()=>toast('Não consegui ouvir. Verifique a permissão do microfone.');r.start()}catch(e){toast('Busca por voz indisponível neste navegador')}}

/* ============ COMPONENTES ============ */
function stTag(p){const s=status(p);return `<span class="tag ${s.k==='aberto'?'':s.k==='fechado'?'off':'gray'}">${s.k==='aberto'?'● ':''}${esc(s.t)}</span>`}
const starTag=p=>p.g?`<span class="tag star">★ ${String(p.g.v).replace('.',',')} Google</span>`:'';
function alTags(p){let h='';if(p.al&&/Prevent/.test(p.al))h+='<span class="tag warn">Só Prevent Senior</span>';if(p.al&&/odontol/i.test(p.al))h+='<span class="tag warn">Odontológica</span>';return h}
function contatoBtns(p){let h='';
 if(p.wa)h+=`<button class="btn wa" data-act="wa" data-id="${p.id}">${ICW} WhatsApp</button>`;
 else if(p.t.length)h+=`<button class="btn" data-act="ligar" data-id="${p.id}">${I.phone('#0B4F5C',20)} Ligar</button>`;
 if(isOnline(p))h+=`<a class="btn pri" href="${esc(p.url)}" target="_blank" rel="noopener">${I.video('#fff',20)} Acessar</a>`;
 else h+=`<button class="btn pri" data-act="rota" data-id="${p.id}">${I.route('#fff',20)} Rota</button>`;
 return h}
const heartBtn=p=>{const on=S.favs.includes(p.id);return `<button class="round" data-act="fav" data-id="${p.id}" aria-label="${on?'Remover dos':'Adicionar aos'} favoritos" aria-pressed="${on}"><svg width="22" height="22" viewBox="0 0 24 24" fill="${on?'#C62E4A':'none'}" stroke="${on?'#C62E4A':'#0B4F5C'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P.heart}</svg></button>`};
function card(p){const d=dist(p);
 return `<article class="pcard"><button class="open" data-act="abrir" data-id="${p.id}" aria-label="Ver detalhes de ${esc(p.n)}">${cover(p,'8.5rem')}
 <span class="bd"><span class="meta">${stTag(p)}${starTag(p)}${p.sus?'<span class="tag blue">SUS</span>':''}${p.pr?`<span class="tag gray">R$ ${p.pr}</span>`:''}${alTags(p)}</span>
 <span class="nm">${esc(p.n)}</span>
 <span class="meta">${isOnline(p)?I.video('#0E6B6B',16)+esc(p.sp||'Teleconsulta por vídeo'):I.pin('#0B4F5C',16)+`<span>${esc(p.b)} · <b style="color:var(--ink)">${fkm(d)}</b>${p.sp?' · '+esc(p.sp):''}</span>`}</span></span></button>
 <div class="acts">${contatoBtns(p)}${heartBtn(p)}</div></article>`}
function mini(p){const d=dist(p);return `<button class="mini" data-act="abrir" data-id="${p.id}">${cover(p,'7.2rem').replace('class="cover"','class="cover" style="border-radius:0"')}<span class="bd"><span class="meta">${stTag(p)}</span><b>${esc(p.n)}</b><span class="sm mut">${esc(p.b)} · ${fkm(d)}${p.g?' · ★ '+String(p.g.v).replace('.',','):''}</span></span></button>`}
function origemChip(light){return `<button class="chip-o${light?' light':''}" data-act="picker" data-alvo="origin" aria-label="Alterar ponto de partida: ${esc(S.origin.n)}">${I.pin('#fff',16)}<span>Saindo de: <b>${esc(S.origin.n)}</b></span>${I.down('#fff',14)}</button>`}
function buscaForm(id,ph,val,live){return `<form class="search" data-form="busca" data-alvo="${id}" role="search">${I.search('#0B4F5C',20)}<label class="sr" for="${id}">Buscar</label><input id="${id}" name="q" type="search" enterkeyhint="search" placeholder="${esc(ph)}" value="${esc(val)}" ${live?`data-live="${live}"`:''} autocomplete="off"><button type="button" class="micbtn" data-act="voz" data-alvo="${id}" aria-label="Buscar por voz">${I.mic('#fff',20)}</button></form>`}
function phead(t,sub,voltar){return `<div class="phead">${voltar!==false?`<button class="back" data-act="voltar" aria-label="Voltar">${I.back('#0C2329',20)}</button>`:''}<div style="flex:1;min-width:0"><h1>${esc(t)}</h1>${sub?`<p>${esc(sub)}</p>`:''}</div></div>`}
function cubo(o){return `<button class="cube ${o.cls||'plain'}" data-act="${o.act}" data-v="${o.v}"${o.k?` data-k="${o.k}"`:''}><span class="ic">${o.ic}</span><span class="tx"><span class="t">${o.t}</span><span class="d">${o.d}</span>${o.n!=null?`<span class="tag ${o.cls==='blue'?'blue':o.cls==='pink'?'off':''} n" style="${o.cls==='pink'?'background:#fff;color:#B02A62':o.cls==='blue'?'background:#fff':''}">${o.n}</span>`:''}</span>${I.chev(o.cor||'#0B4F5C',22)}<span class="bgic">${o.bg||''}</span></button>`}
const nConsultas=()=>LOC.filter(p=>p.esp.length||p.on.length).length,nExames=()=>LOC.filter(p=>p.lab||p.img.length).length;
function cubosTipo(duo){const a=cubo({cls:'pink',act:'tipo',v:'consulta',ic:I.steth('#B02A62',34),t:'Consultas',d:'Presencial perto de você ou online por vídeo',n:nConsultas()+' locais e serviços',cor:'#B02A62',bg:I.steth('#B02A62',150,1.4)}),
 b=cubo({cls:'blue',act:'tipo',v:'exame',ic:I.flask('#1C5BA8',34),t:'Exames',d:'Laboratoriais (sangue, urina) ou de imagem',n:nExames()+' locais',cor:'#1C5BA8',bg:I.flask('#1C5BA8',150,1.4)});
 return duo?`<div class="duo">${a}${b}</div>`:`<div class="cubes">${a.replace('class="cube pink"','class="cube pink hero2"')}${b.replace('class="cube blue"','class="cube blue hero2"')}</div>`}

/* ============ TELAS ============ */
let BAR='';
function vInicio(){
 const near=a=>a.sort((x,y)=>(dist(x)??1e9)-(dist(y)??1e9));
 const ps=near(LOC.filter(p=>p.c==='hospital'&&p.h==='24h'&&!/Exclusivo/i.test(p.cv)&&!(p.al&&/Prevent/.test(p.al)))).slice(0,3);
 const dest=near(LOC.filter(p=>!isOnline(p)&&(p.foto||p.g))).slice(0,8);
 const was=near(LOC.filter(p=>p.wa&&!isOnline(p))).slice(0,4);
 const abertos=near(LOC.filter(p=>!isOnline(p)&&status(p).k==='aberto'&&p.h!=='24h')).slice(0,4);
 const n=primeiroNome();
 const at=[['ps','Pronto-socorro 24h','ambul','#B3261E'],['tele','Consulta por vídeo','video','#0E6B6B'],['wa','Com WhatsApp','wa2','#128C4A'],['gps','Perto de mim','gps','#2563EB'],['sus','SUS gratuito','shield','#1C5BA8'],['favs','Favoritos','heart','#C62E4A'],['emerg','Emergência','alert','#B3261E']];
 return `<section class="hero"><h1 class="hello">${n?'Olá, '+esc(n)+'!':'Olá!'} <small>Como podemos cuidar de você hoje?</small></h1>${origemChip()}${buscaForm('qh','Especialidade, exame, local ou bairro','')}</section>
 <section class="sec">${cubosTipo(true)}</section>
 <section class="sec adv"><h2 class="h2">Atalhos</h2><div class="hscroll">${at.map(([k,t,ic,c])=>`<button class="short" data-act="atalho" data-k="${k}"><i>${I[ic](c,26)}</i>${t}</button>`).join('')}</div></section>
 <section class="sec"><a class="info red" href="tel:192" style="align-items:center">${I.ambul('#B3261E',28)}<span style="flex:1"><b>Emergência? Ligue 192 (SAMU)</b><br>Bombeiros: 193 · Não espere agendar.</span>${I.phone('#B3261E',22)}</a></section>
 <section class="sec adv"><div class="row between"><h2 class="h2">Destaques perto de você</h2><button class="lnk sm" data-act="nav" data-v="buscar">Ver todos</button></div><div class="hscroll">${dest.map(mini).join('')}</div></section>
 <section class="sec"><h2 class="h2">Pronto-socorro 24h mais perto</h2><div class="card" style="padding:.2rem 1rem">${ps.map(p=>`<div class="lrow"><span class="lic" style="background:#FBE9E8">${I.build('#B3261E',20)}</span><button data-act="abrir" data-id="${p.id}" class="col" style="flex:1;text-align:left;min-width:0"><b style="font-size:.95rem">${esc(p.n)}</b><span class="sm mut">${esc(p.cv)} · ${fkm(dist(p))}</span></button><button class="round" data-act="rota" data-id="${p.id}" aria-label="Como chegar a ${esc(p.n)}">${I.route('#0B4F5C',20)}</button></div>`).join('')}</div></section>
 <section class="sec adv"><h2 class="h2">Agende pelo WhatsApp</h2><p class="p mut" style="margin-top:-.4rem">WhatsApp oficial. A mensagem já vai pronta.</p><div class="grid">${was.map(card).join('')}</div></section>
 <section class="sec adv"><h2 class="h2">Abertos agora, mais perto</h2>${abertos.length?`<div class="grid">${abertos.map(card).join('')}</div>`:'<div class="empty">Nenhum local com horário confirmado está aberto agora.</div>'}</section>`}
function vNovo(){return phead('O que você quer agendar?','Toque em uma opção para seguir',false)+`<section class="sec">${cubosTipo(false)}
 <div class="info">${I.pin('#0A4B44',20)}<span>Saindo de <b>${esc(S.origin.n)}</b>. <button class="lnk" data-act="picker" data-alvo="origin">Trocar</button></span></div></section>`}
function vModo(){const f=S.flow;const c=f.tipo==='consulta';const cor=c?'#B02A62':'#1C5BA8',cls=c?'pink':'blue';
 const n=k=>k==='presencial'?LOC.filter(p=>!isOnline(p)&&p.esp.length).length:k==='online'?LOC.filter(p=>p.on.length).length:k==='lab'?LOC.filter(p=>p.lab).length:LOC.filter(p=>p.img.length).length;
 const op=c?[['presencial','Presencial','Clínica, hospital ou consultório perto de você. Veja distância, rota e horário.','build'],['online','Online','Teleconsulta e médicos por vídeo. Atendimento sem sair de casa.','video']]:[['lab','Laboratoriais','Sangue, urina, glicemia, colesterol, tireoide e outras análises.','tube'],['img','De imagem','Raio-X, ultrassom, tomografia, ressonância, mamografia e mais.','scan']];
 return phead(c?'Consultas':'Exames',c?'Como prefere ser atendido?':'Que tipo de exame?')+`<section class="sec"><div class="cubes">${op.map(([k,t,d,ic])=>cubo({cls,act:'modo',v:k,ic:I[ic](cor,34),t,d,n:n(k)+(n(k)===1?' local':' locais'),cor,bg:I[ic](cor,150,1.4)}).replace('class="cube','class="cube hero2')).join('')}</div>
 <div class="card adv"><h2 class="h3">Como funciona</h2>${[['1','Escolha '+(c?'a especialidade':'o exame')],['2','Compare distância, horário e nota'],['3','Agende pelo WhatsApp ou ligue']].map(([a,b])=>`<div class="row"><span class="lic" style="width:2rem;height:2rem;border-radius:50%;font-weight:800;color:${cor};background:${c?'#FDE8F0':'#E5EEFC'}">${a}</span><span class="p">${b}</span></div>`).join('')}</div></section>`}
const ORD_ESP=['clinica','cardio','gineco','pedi','dermato','orto','oftalmo','gastro','endo','neuro','otorrino','psiq','uro'];
function itensLista(){const f=S.flow;
 if(f.modo==='lab')return LABX.map((x,i)=>({k:'lab'+i,t:x[0],s:x[1],p:x[2],ic:'tube',n:LOC.filter(p=>p.lab).length}));
 if(f.modo==='img')return Object.keys(IMGX).map(k=>({k,t:IMGX[k][0],s:IMGX[k][1],p:IMGX[k][2],ic:IC_IMG[k]||'scan',n:LOC.filter(p=>p.img.includes(k)).length}));
 return ORD_ESP.filter(k=>ESP[k]).concat(Object.keys(ESP).filter(k=>!ORD_ESP.includes(k))).map(k=>({k,t:ESP[k][0],s:ESP[k][1],ic:IC_ESP[k]||'steth',n:LOC.filter(p=>f.modo==='online'?p.on.includes(k):(!isOnline(p)&&p.esp.includes(k))).length}))}
function vItens(){const f=S.flow;const tit=f.modo==='presencial'?'Consulta presencial':f.modo==='online'?'Consulta online':f.modo==='lab'?'Exames laboratoriais':'Exames de imagem';
 return phead(tit,f.tipo==='consulta'?'Escolha a especialidade':'Escolha o exame')+`<section class="sec">${buscaForm('qi',f.tipo==='consulta'?'Especialidade ou sintoma':'Nome do exame',S.qi,'qi')}<div id="itens" class="tiles2"></div></section>`}
function renderItens(){const box=$('itens');if(!box)return;const t=norm(S.qi);const f=S.flow;const c=f.tipo==='consulta',cor=c?'#B02A62':'#1C5BA8',bg=c?'#FDE8F0':'#E5EEFC';
 const r=itensLista().filter(x=>!t||norm(x.t+' '+x.s).includes(t));
 box.innerHTML=r.length?r.map((x,i)=>`<button class="tile${i===0&&!t?' wide':''}" data-act="item" data-k="${x.k}"><span class="lic" style="background:${bg}">${I[x.ic](cor,22)}</span><span class="col" style="gap:.25rem;flex:1;min-width:0"><b>${esc(x.t)}</b><span class="sm mut">${esc(x.s)}${x.p&&i===0?' · Preparo: '+esc(x.p):''}</span><span class="sm" style="font-weight:800;color:${cor}">${x.n} ${x.n===1?'local':'locais'}</span></span></button>`).join(''):'<div class="empty" style="grid-column:1/-1">Nada encontrado. Tente outra palavra.</div>'}
function itemNome(){const f=S.flow;if(!f.item)return'';if(f.modo==='lab')return LABX[+f.item.slice(3)][0];if(f.modo==='img')return IMGX[f.item][0];return ESP[f.item][0]}
function resultadosFlow(){const f=S.flow;let r;
 if(f.modo==='online')r=LOC.filter(p=>p.on.includes(f.item));
 else if(f.modo==='presencial')r=LOC.filter(p=>!isOnline(p)&&p.esp.includes(f.item));
 else if(f.modo==='lab')r=LOC.filter(p=>p.lab);
 else r=LOC.filter(p=>p.img.includes(f.item));
 return ordenar(filtrosAplic(r))}
function filtrosAplic(r){return r.filter(p=>{if(S.fWa&&!p.wa)return false;if(S.fOpen&&status(p).k!=='aberto')return false;if(S.fConv&&!/conv|plano/i.test(p.cv))return false;if(S.fSus&&!p.sus)return false;if(S.f24&&p.h!=='24h')return false;return true})}
function ordenar(r){const D=p=>dist(p)??1e9;
 if(S.sort==='perto')r.sort((a,b)=>(isOnline(a)-isOnline(b))||D(a)-D(b));
 else if(S.sort==='preco')r.sort((a,b)=>(a.pr||1e9)-(b.pr||1e9)||D(a)-D(b));
 else if(S.sort==='nota')r.sort((a,b)=>nota(b)-nota(a)||D(a)-D(b));
 else r.sort((a,b)=>a.n.localeCompare(b.n,'pt'));return r}
function controles(online){return `<div class="seg" role="group" aria-label="Ordenar">${[['perto',online?'Recomendados':'Mais perto'],['preco','Melhor preço'],['nota','Melhor avaliação']].map(([k,t])=>`<button data-act="sort" data-k="${k}" aria-pressed="${S.sort===k}">${t}</button>`).join('')}</div>
 <div class="chips adv" role="group" aria-label="Filtros">${[['fOpen','Aberto agora'],['f24','24 horas'],['fWa','Com WhatsApp'],['fConv','Aceita convênio'],['fSus','SUS']].map(([k,t])=>`<button class="chip" data-act="tg" data-k="${k}" aria-pressed="${S[k]}">${t}</button>`).join('')}</div>`}
function notaOrdem(){if(S.sort==='preco')return'Só alguns locais publicam preço; os demais aparecem depois, por distância.';if(S.sort==='nota')return'Pela nota do Google Maps (pesquisada em '+CFG.dataRef+') onde encontramos; os demais aparecem depois, por distância.';return''}
function vResultados(){const f=S.flow;const online=f.modo==='online';const r=resultadosFlow();
 const sub=(f.modo==='presencial'?'Presencial':f.modo==='online'?'Online':f.modo==='lab'?'Laboratorial':'Imagem')+' · '+r.length+' '+(r.length===1?'opção':'opções');
 return phead(itemNome(),sub)+`<section class="sec">${online?'':origemChip(true)}${controles(online)}
 ${notaOrdem()?`<p class="sm mut" style="margin:0">${esc(notaOrdem())}</p>`:''}
 ${online?`<div class="info">${I.video('#0A4B44',20)}<span>Consultas por vídeo: toque em <b>Acessar</b> para abrir o serviço ou o perfil do médico.</span></div>`:`<div class="mapwrap adv"><div id="mapRes" class="leaf" style="height:16rem"></div></div>`}
 ${r.length?`<div class="grid">${r.map(card).join('')}</div>`:'<div class="empty">Nenhum local com esses filtros. Tire um filtro para ver mais.</div>'}</section>`}
function vBuscar(){return phead('Buscar','Hospitais, clínicas, médicos, laboratórios e imagem',false)+`<section class="sec">${origemChip(true)}${buscaForm('qb','Nome, especialidade, exame ou bairro',S.q,'q')}
 <div class="chips" role="group" aria-label="Categoria">${[['todos','Todos']].concat(Object.keys(CATS).map(c=>[c,CATS[c].nome])).map(([k,t])=>`<button class="chip" data-act="cat" data-cat="${k}" aria-pressed="${S.cat===k}">${t}</button>`).join('')}</div>
 ${controles(false)}
 <div class="seg adv" role="group" aria-label="Visualização"><button data-act="vis" data-k="mapa" aria-pressed="${S.map}">${I.map('currentColor',16)} Mapa + lista</button><button data-act="vis" data-k="lista" aria-pressed="${!S.map}">Só lista</button></div>
 <div id="resumo"></div>${S.map?'<div class="mapwrap adv"><div id="mapBusca" class="leaf" style="height:17rem"></div></div>':''}<div id="res" class="grid"></div></section>`}
function filtrarBusca(){const t=norm(S.q);let r=LOC.filter(p=>{if(S.cat!=='todos'&&p.c!==S.cat)return false;if(t){const hay=norm([p.n,p.b,p.e,p.sp,p.s.join(' '),CATS[p.c].nome].join(' '));if(!t.split(/\s+/).every(w=>hay.includes(w)))return false}return true});return ordenar(filtrosAplic(r))}
function renderRes(){const box=$('res');if(!box)return;const r=filtrarBusca();
 $('resumo').innerHTML=`<p class="sm mut" style="margin:0"><b style="color:var(--ink)">${r.length} ${r.length===1?'local':'locais'}</b>${notaOrdem()?' · '+esc(notaOrdem()):''}</p>`;
 box.innerHTML=r.length?r.slice(0,40).map(card).join('')+(r.length>40?`<p class="sm mut">Mostrando 40 de ${r.length}. Refine a busca.</p>`:''):'<div class="empty">Nada encontrado. Tente outra palavra ou tire um filtro.</div>';
 if(S.map&&$('mapBusca')){matarMapas();mapaResultados('mapBusca',r.filter(p=>!isOnline(p)))}observar()}

/* ---- página do local ---- */
const REDES={ig:['Instagram','ig','<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><path d="M17.3 6.7v.01"/>'],fb:['Facebook','fb','<path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8.5a.5.5 0 0 1 .5-.5z"/>'],li:['LinkedIn','li','<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 10.5v6M8 7.5v.01M12 16.5v-3.5a2 2 0 0 1 4 0v3.5M12 10.5v6"/>'],yt:['YouTube','yt','<rect x="2.5" y="6" width="19" height="12" rx="4"/><path d="M10 9.5v5l4.5-2.5z"/>']};
const handle=u=>{try{const x=new URL(u).pathname.replace(/^\/|\/$/g,'').replace(/^(company|user|channel)\//,'');return x?(/^@/.test(x)?x:'@'+x):''}catch(e){return''}};
function blocoRedes(p){const ks=Object.keys(p.soc||{}).filter(k=>REDES[k]&&p.soc[k]);let h='';
 if(ks.length===1){const k=ks[0],R=REDES[k];h+=`<a class="soc hero ${R[1]}" href="${esc(p.soc[k])}" target="_blank" rel="noopener"><span class="si" style="background:rgba(255,255,255,.2)">${SVG(R[2],'#fff',26)}</span><span class="col" style="flex:1;min-width:0"><b>${R[0]} oficial</b><span class="sm ell" style="opacity:.9">${esc(handle(p.soc[k]))}</span></span>${I.chev('#fff',20)}</a>`}
 else ks.forEach(k=>{const R=REDES[k];h+=`<a class="soc" href="${esc(p.soc[k])}" target="_blank" rel="noopener"><span class="si ${R[1]}">${SVG(R[2],'#fff',22)}</span><span class="col" style="flex:1;min-width:0"><b>${R[0]}</b><span class="sm mut ell">${esc(handle(p.soc[k]))}</span></span>${I.chev('#4A6066',18)}</a>`});
 if(p.site)h+=`<a class="soc" href="${esc(p.site)}" target="_blank" rel="noopener"><span class="si site">${SVG('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>','#fff',22)}</span><span class="col" style="flex:1;min-width:0"><b>Site oficial</b><span class="sm mut ell">${esc(p.site.replace(/^https?:\/\/(www\.)?/,'').replace(/\/$/,''))}</span></span>${I.chev('#4A6066',18)}</a>`;
 if(/doctoralia/.test(p.f||''))h+=`<a class="soc" href="${esc(p.f)}" target="_blank" rel="noopener"><span class="si dc">${I.steth('#fff',22)}</span><span class="col" style="flex:1"><b>Doctoralia</b><span class="sm mut">Perfil, preços e agenda</span></span>${I.chev('#4A6066',18)}</a>`;
 if(!isOnline(p))h+=`<a class="soc" href="${gplace(p)}" target="_blank" rel="noopener"><span class="si gm">${PINSVG('#EA4335').replace('width="30" height="38"','width="20" height="26"')}</span><span class="col" style="flex:1"><b>Google Maps</b><span class="sm mut">Fotos, avaliações e horários</span></span>${I.chev('#4A6066',18)}</a>`;
 return `<div class="card"><div class="row between"><h2 class="h3">Redes sociais e links</h2>${ks.length?'':'<span class="tag gray">Sem rede oficial</span>'}</div>${ks.length?'':'<p class="sm mut" style="margin:-.3rem 0 0">Não encontramos rede social oficial deste local. Veja os links abaixo.</p>'}<div class="col" style="gap:.5rem">${h}</div></div>`}
function blocoAvaliacao(p){const g=p.g;
 return `<div class="card"><h2 class="h3">Avaliação ⭐</h2>${g?`<div class="rate"><span class="big">${String(g.v).replace('.',',')}</span><span class="col" style="gap:.2rem">${estrelas(g.v,20)}<span class="sm mut">${g.n?g.n.toLocaleString('pt-BR')+' avaliações · ':''}Google Maps · consultado em ${CFG.dataRef}${g.f?` (<a class="lnk" href="${esc(g.f)}" target="_blank" rel="noopener">fonte</a>)`:''}</span></span></div>`:`<p class="p mut">Ainda não registramos a nota deste local. Veja a nota atualizada no Google Maps.</p>`}
 <div class="acts wrap"><a class="btn" href="${gplace(p)}" target="_blank" rel="noopener">${I.search('#0B4F5C',18)} Ver avaliações</a><a class="btn teal" href="${gplace(p)}" target="_blank" rel="noopener">★ Avaliar no Google Maps</a></div>
 <span class="sm mut">As avaliações são feitas e atualizadas no próprio Google Maps. Lá, toque em <b>Avaliações</b> › <b>Escrever avaliação</b>.</span></div>`}
function vLocal(){const p=byId(S.sel);if(!p)return vInicio();const d=dist(p),c=CATS[p.c],st=status(p),on=isOnline(p);
 BAR=`<div class="bar">${p.wa?`<button class="btn wa" data-act="wa" data-id="${p.id}" style="font-size:1rem">${ICW} Agendar pelo WhatsApp</button>`:on?`<a class="btn pri" href="${esc(p.url)}" target="_blank" rel="noopener">${I.video('#fff',20)} Agendar no serviço</a>`:p.t.length?`<button class="btn pri" data-act="ligar" data-id="${p.id}">${I.phone('#fff',20)} Ligar para agendar</button>`:`<button class="btn pri" data-act="rota" data-id="${p.id}">Ver como chegar</button>`}</div>`;
 return `<div style="position:relative" id="gal">${galeria(p)}</div>
 <div style="position:relative;margin-top:-1.6rem;border-radius:1.6rem 1.6rem 0 0;background:var(--bg);z-index:2">
 <div class="row" style="position:absolute;top:-4.6rem;left:1rem;right:1rem;justify-content:space-between;pointer-events:none"><button class="back" data-act="voltar" aria-label="Voltar" style="pointer-events:auto">${I.back('#0C2329',20)}</button><span class="row" style="pointer-events:auto"><button class="back" data-act="compart" data-id="${p.id}" aria-label="Compartilhar">${I.share('#0C2329',20)}</button>${heartBtn(p).replace('class="round"','class="back"')}</span></div>
 <section class="sec" style="padding-top:1.2rem"><div class="col" style="gap:.5rem"><div class="meta"><span class="tag" style="background:${c.fundo};color:${c.cor}">${I[IC_CAT[p.c]](c.cor,14)} ${esc(c.um)}</span>${stTag(p)}${starTag(p)}${p.sus?'<span class="tag blue">SUS – gratuito</span>':''}</div>
 <h1 style="margin:0;font-size:1.6rem;line-height:1.2;font-weight:800">${esc(p.n)}</h1>${p.sp?`<span style="font-size:.95rem;font-weight:700">${esc(p.sp)}${p.crm?` · <span class="mut" style="font-weight:600">${esc(p.crm)}</span>`:''}</span>`:''}
 ${on?'':`<span class="meta">${I.pin('#0B4F5C',16)}${esc(p.b)} · <b style="color:var(--ink)">${fkm(d)}</b> de ${esc(S.origin.n)}</span>`}</div>
 ${p.al?`<div class="info warn">${I.alert('#5E3B08',20)}<span>${esc(p.al)}</span></div>`:''}
 <div class="acts">${p.t.length?`<button class="btn" data-act="ligar" data-id="${p.id}">${I.phone('#0B4F5C',20)} Ligar</button>`:''}${on?`<a class="btn pri" href="${esc(p.url)}" target="_blank" rel="noopener">${I.video('#fff',20)} Acessar</a>`:`<button class="btn pri" data-act="rota" data-id="${p.id}">${I.route('#fff',20)} Como chegar</button>`}${S.a11y.ler?`<button class="round" data-act="ler" aria-label="Ouvir informações">${I.speaker('#0B4F5C',22)}</button>`:''}</div>
 ${blocoRedes(p)}
 ${blocoAvaliacao(p)}
 ${on?'':`<div class="card"><div class="row between"><h2 class="h3">Mapa</h2><a class="lnk sm" href="${gplace(p)}" target="_blank" rel="noopener">Abrir no Google Maps</a></div>
 <div class="mapwrap" style="height:14.5rem"><iframe title="Mapa do Google de ${esc(p.n)}" src="https://maps.google.com/maps?q=${enc(limpaEnd(p.e))}&z=16&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade" style="border:0;width:100%;height:100%"></iframe></div>
 <span class="sm mut">${p.geo&&GEO[p.id]?'Endereço confirmado no OpenStreetMap.':'Confirmando a posição exata pelo endereço…'}</span></div>`}
 <div class="card"><h2 class="h3">Sobre</h2><p class="p">${esc(p.d)}</p><div class="meta">${p.s.map(x=>`<span class="tag gray">${esc(x)}</span>`).join('')}</div></div>
 <div class="card"><h2 class="h3">${on?'Como funciona':'Endereço'}</h2><p class="p">${esc(p.e)}</p>
 ${on?'':`<button class="rt-field" data-act="rota" data-id="${p.id}">${I.route('#0B4F5C',22)}<span class="col" style="flex:1"><b style="font-size:.95rem">Distância e transporte</b><span class="sm mut">Saindo de ${esc(S.origin.n)}</span></span>${I.chev('#0B4F5C',20)}</button>`}</div>
 <div class="card"><h2 class="h3">Horário de funcionamento</h2><p class="p">${esc(p.hr)}</p><span class="sm mut">${st.k==='?'&&!on?'Não foi possível confirmar o horário em fonte oficial. Ligue antes de ir.':'Status calculado pelo horário de Brasília.'}</span></div>
 <div class="card"><h2 class="h3">Contato e pagamento</h2><div>
 ${p.t.length?p.t.map(t=>`<div class="kv"><span class="mut">Telefone</span><a href="${telHref(t)}" style="font-weight:800;text-align:right">${esc(t)}</a></div>`).join(''):'<div class="kv"><span class="mut">Telefone</span><span>Não encontrado</span></div>'}
 <div class="kv"><span class="mut">WhatsApp</span><b style="text-align:right">${p.wa?esc(p.wn):'Não divulgado'}</b></div>
 <div class="kv"><span class="mut">Atendimento</span><b style="text-align:right">${esc(p.cv)}</b></div>${p.prt?`<div class="kv"><span class="mut">Preço</span><b style="text-align:right">${esc(p.prt)}</b></div>`:''}</div></div>
 <p class="sm mut" style="margin:0">Fonte: <a href="${esc(p.f)}" target="_blank" rel="noopener" class="lnk">${esc(p.f.replace(/^https?:\/\/(www\.)?/,'').split('/')[0])}</a> · dados de ${CFG.dataRef}. Confirme por telefone antes de ir.</p></section></div>`}

/* ---- rota ---- */
function vRota(){const o=S.origin,d=S.dest;
 const campo=(alvo,pt,cor,rot)=>`<button class="rt-field" data-act="picker" data-alvo="${alvo}"><span class="dot" style="background:${cor}"></span><span class="col" style="flex:1;min-width:0;text-align:left"><span class="sm mut">${rot}</span><b class="ell" style="font-size:.95rem">${pt?esc(pt.n):'Escolha o destino'}</b>${pt&&pt.sub?`<span class="sm mut ell">${esc(pt.sub)}</span>`:''}</span><span class="sm" style="font-weight:800;color:var(--pet)">Alterar</span></button>`;
 let corpo='';
 if(!d)corpo='<div class="empty">Escolha o destino, ou toque em "Como chegar" na página de um local.</div>';
 else if(o.la==null)corpo=`<div class="info warn"><span>Ainda localizando "${esc(o.n)}". Se não encontrar, os botões abaixo abrem a rota no Google Maps a partir do texto digitado.</span></div>`+links(o,d);
 else{const k=km(o,d);const so=estMaisProx(o),sd=estMaisProx(d);
  const modos=[['foot','A pé','<circle cx="13" cy="4" r="2"/><path d="M10 21l2-6 3 3v3M9 12l3-4 3 3 3 1M12 8l-2 5"/>','walking'],['bike','Bicicleta','<circle cx="6" cy="17" r="3.5"/><circle cx="18" cy="17" r="3.5"/><path d="M6 17l4-8h5l3 8M10 9l-1-3H7M14 9l1-3h2"/>','bicycling'],['car','Carro, táxi ou app','<path d="M5 16l1.5-5a2 2 0 0 1 2-1.5h7a2 2 0 0 1 2 1.5L19 16"/><rect x="3" y="16" width="18" height="4" rx="1"/>','driving']];
  const tp=so.e.id===sd.e.id||k<1.2?null:so.d*1.3/4.8*60+km(so.e,sd.e)*1.4/28*60+10+sd.d*1.3/4.8*60;
  corpo=`<div class="card" style="flex-direction:row;align-items:center"><span class="col" style="flex:1"><span class="sm mut">Distância</span><b style="font-size:1.7rem;color:var(--pet)" id="rKm">${fkm(k)}</b><span class="sm mut" id="rKmSub">em linha reta · calculando rota real…</span></span></div>
  <div class="seg" role="group" aria-label="Mapa">${[['osm','Mapa da rota'],['google','Google Maps']].map(([x,t])=>`<button data-act="rmap" data-k="${x}" aria-pressed="${S.rmap===x}">${t}</button>`).join('')}</div>
  <div class="mapwrap" style="height:17rem">${S.rmap==='google'?`<iframe title="Rota no Google Maps" src="https://maps.google.com/maps?saddr=${enc(qtxt(o))}&daddr=${enc(qtxt(d))}&output=embed" style="border:0;width:100%;height:100%" loading="lazy"></iframe>`:'<div id="mapRota" class="leaf" style="height:17rem"></div>'}</div>
  <h2 class="h2">Meios de transporte</h2>
  ${modos.map(([pf,t,ic,gm])=>`<div class="mode ${S.rmode===pf?'sel':''}"><button class="modebtn" data-act="rmode" data-k="${pf}" aria-pressed="${S.rmode===pf}"><span class="lic">${SVG(ic,'#0B4F5C',24)}</span><span class="col" style="flex:1;gap:.1rem;text-align:left"><b style="font-size:.95rem">${t}</b><span class="sm mut" id="rs_${pf}">calculando…</span></span><span class="t" id="rt_${pf}">…</span></button><a class="gbtn" href="${gmaps(o,d,gm)}" target="_blank" rel="noopener" aria-label="Abrir ${t} no Google Maps">Google</a></div>`).join('')}
  <div class="mode"><span class="modebtn"><span class="lic">${SVG('<rect x="5" y="3" width="14" height="15" rx="3"/><path d="M5 11h14M8 21l2-3M16 21l-2-3"/>','#0B4F5C',24)}</span><span class="col" style="flex:1;gap:.1rem"><b style="font-size:.95rem">Trem, metrô ou ônibus</b><span class="sm mut">${tp==null?'Perto demais: vale ir a pé':esc(so.e.n)+' → '+esc(sd.e.n)}</span></span><span class="t">${tp==null?'—':'~'+fmin(tp)}</span></span><a class="gbtn" href="${gmaps(o,d,'transit')}" target="_blank" rel="noopener">Google</a></div>
  <div class="card adv"><h2 class="h3">Estações mais próximas</h2>
  <div class="lrow"><span class="dot" style="background:#2563EB"></span><span class="col" style="flex:1"><b style="font-size:.9rem">${esc(so.e.n)}</b><span class="sm mut">${esc(so.e.l)}</span></span><span class="sm" style="font-weight:800">${fkm(so.d)} da partida</span></div>
  <div class="lrow"><span class="dot" style="background:var(--pet)"></span><span class="col" style="flex:1"><b style="font-size:.9rem">${esc(sd.e.n)}</b><span class="sm mut">${esc(sd.e.l)}</span></span><span class="sm" style="font-weight:800">${fkm(sd.d)} do destino</span></div>
  <span class="sm mut">Linhas e ônibus exatos, com horário em tempo real: botão "Google" do transporte público.</span></div>
  ${links(o,d)}
  <p class="sm mut" style="margin:0">A pé, bicicleta e carro: rota real pelas ruas (OpenStreetMap), sem considerar trânsito. Transporte público: estimativa pela estação mais próxima.</p>`}
 const du=d&&d.id&&byId(d.id);
 return phead('Como chegar','Entre e saia dos endereços quando quiser')+`<section class="sec"><div class="col" style="gap:.5rem;position:relative">${campo('origin',o,'#2563EB','Saindo de')}${campo('dest',d,'var(--pet)','Indo para')}
 <button class="round" data-act="trocar" aria-label="Inverter partida e destino" style="position:absolute;right:-.4rem;top:50%;transform:translateY(-50%);width:2.6rem;height:2.6rem">${I.swap('#0B4F5C',20)}</button></div>
 ${du?`<div class="acts">${du.wa?`<button class="btn wa" data-act="wa" data-id="${du.id}">${ICW} WhatsApp</button>`:''}<button class="btn" data-act="abrir" data-id="${du.id}">Ver unidade</button></div>`:''}${corpo}</section>`}
function links(o,d){return `<div class="card"><h2 class="h3">Abrir em outro app</h2><div class="acts wrap"><a class="btn pri" href="${gmaps(o,d,'transit')}" target="_blank" rel="noopener">Google Maps</a><a class="btn" href="${waze(d)}" target="_blank" rel="noopener">Waze</a><a class="btn" href="${uber(d)}" target="_blank" rel="noopener">Uber</a></div></div>`}
async function posRota(){const o=S.origin,d=S.dest;if(!d||o.la==null)return;
 if(d.k==='unidade'){const p=byId(d.id);const la=p.la;await refinar(p);if(S.view!=='rota'||S.dest!==d)return;if(p.la!==la){d.la=p.la;d.lo=p.lo}}
 const res={};await Promise.all(['foot','bike','car'].map(async pf=>{res[pf]=await osrm(pf,o,d)}));
 if(S.view!=='rota'||S.dest!==d)return;
 if(!S.rmode)S.rmode=(res.foot&&res.foot.km<2.5)?'foot':'car';
 ['foot','bike','car'].forEach(pf=>{const r=res[pf],ts=$('rt_'+pf),ss=$('rs_'+pf);if(!ts)return;
  if(r){ts.textContent=fmin(pf==='bike'?r.km/13*60:r.min);ss.textContent=fkm(r.km)+' pelas ruas'+(pf==='car'?' · sem trânsito':'')}
  else{const k=km(o,d)*1.3;ts.textContent='~'+fmin(pf==='foot'?k/4.8*60:pf==='bike'?k/13*60:k*1.08/20*60+5);ss.textContent='estimativa (rota indisponível)'}});
 document.querySelectorAll('.mode').forEach(el=>el.classList.toggle('sel',!!el.querySelector(`[data-k="${S.rmode}"]`)));
 const best=res[S.rmode]||res.car||res.foot;const kmEl=$('rKm'),sub=$('rKmSub');
 if(best&&kmEl){kmEl.textContent=fkm(best.km);sub.textContent='pelas ruas · '+(S.rmode==='foot'?'a pé':S.rmode==='bike'?'de bicicleta':'de carro')}
 else if(sub)sub.textContent='em linha reta (rota real indisponível agora)';
 if(S.rmap==='osm'){matarMapas();const m=novoMapa('mapRota');if(!m)return;const b=[[o.la,o.lo],[d.la,d.lo]];
  window.L.circleMarker([o.la,o.lo],{radius:9,color:'#fff',weight:3,fillColor:'#2563EB',fillOpacity:1}).addTo(m).bindTooltip('Partida');
  window.L.circleMarker([d.la,d.lo],{radius:10,color:'#fff',weight:3,fillColor:'#0B4F5C',fillOpacity:1}).addTo(m).bindTooltip(d.n);
  const r=res[S.rmode];if(r){window.L.polyline(r.geo,{color:'#0B4F5C',weight:5,opacity:.85}).addTo(m);r.geo.forEach(x=>b.push(x))}else window.L.polyline(b,{color:'#0B4F5C',weight:3,dashArray:'6 8'}).addTo(m);
  [estMaisProx(o).e,estMaisProx(d).e].forEach(e=>window.L.circleMarker([e.la,e.lo],{radius:6,color:'#7A4A0E',weight:2,fillColor:'#F2B33D',fillOpacity:1}).addTo(m).bindTooltip(e.n));
  m.fitBounds(b,{padding:[30,30]})}}

/* ---- agenda ---- */
function vAgenda(){const h=S.hist;const pend=h.filter(x=>!x.ok).length;
 return phead('Minha agenda',h.length?`${pend} aguardando · ${h.length-pend} confirmados`:'Agendamentos iniciados pelo Pax',false)+`<section class="sec">${h.length?h.map((x,i)=>{const p=byId(x.id);if(!p)return'';return `<div class="card"><div class="row between"><span class="sm mut">${I.clock('#4A6066',14)} ${esc(x.data)}</span><span class="tag ${x.ok?'':'warn'}">${x.ok?'Confirmado':'Aguardando a clínica'}</span></div>
 <div class="row" style="align-items:flex-start"><span class="lic" style="background:${x.tipo==='exame'?'#E5EEFC':'#FDE8F0'}">${x.tipo==='exame'?I.flask('#1C5BA8',20):I.steth('#B02A62',20)}</span><span class="col" style="flex:1;min-width:0"><b style="font-size:1rem">${esc(p.n)}</b><span class="p">${x.tipo==='exame'?'Exame':'Consulta'}${x.item?': '+esc(x.item):''}</span>${x.pac?`<span class="sm mut">Paciente: ${esc(x.pac)}</span>`:''}</span></div>
 <div class="acts"><button class="btn ${x.ok?'':'pri'}" data-act="hok" data-i="${i}">${x.ok?'Voltar para pendente':'A clínica confirmou'}</button><button class="round wa" data-act="wa" data-id="${p.id}" aria-label="Reenviar WhatsApp">${ICW}</button><button class="round" data-act="rota" data-id="${p.id}" aria-label="Como chegar">${I.route('#0B4F5C',20)}</button><button class="round" data-act="hdel" data-i="${i}" aria-label="Apagar" style="border-color:#E8C4C6">${I.x('#B3261E',20)}</button></div></div>`}).join(''):`<div class="empty">${I.cal('#4A6066',36,1.6)}<br>Quando você abrir o WhatsApp de um local pelo Pax, o pedido aparece aqui para você acompanhar.</div>`}
 <button class="btn pri" data-act="nav" data-v="novo" style="flex:none">${I.plus('#fff',20)} Novo agendamento</button></section>`}

/* ---- perfil, login e dependentes ---- */
const PARENT=['Filho(a)','Pai','Mãe','Cônjuge','Avô / Avó','Irmão(ã)','Outro'];
function vPerfil(){const u=S.user;const favs=S.favs.map(byId).filter(Boolean);
 const login=`<form class="card" data-form="login"><div class="row"><span class="lic" style="width:3.2rem;height:3.2rem">${LOGO(30)}</span><span class="col"><h2 class="h2">${u?'Editar perfil':'Crie seu perfil'}</h2><span class="sm mut">Leva 20 segundos. Seus dados ficam só neste aparelho.</span></span></div>
 <label class="f">Nome completo<input class="inp" name="nome" required autocomplete="name" value="${esc(u?u.nome:'')}" placeholder="Ex.: Maria da Silva"></label>
 <label class="f">Celular (WhatsApp)<input class="inp" name="cel" type="tel" inputmode="numeric" autocomplete="tel-national" data-live="cel" value="${esc(u?u.cel:'')}" placeholder="(11) 90000-0000"></label>
 ${u?'':`<label class="row sm" style="align-items:flex-start;gap:.6rem;font-weight:600"><input type="checkbox" name="ok" required style="width:1.4rem;height:1.4rem;flex:none;margin-top:.1rem"><span>Li e aceito os <button type="button" class="lnk" data-act="pg" data-v="termos">Termos de Uso</button> e a <button type="button" class="lnk" data-act="pg" data-v="privacidade">Política de Privacidade</button>.</span></label>`}
 <div class="acts"><button class="btn pri" type="submit">${u?'Salvar':'Criar perfil'}</button>${u?'<button class="btn" type="button" data-act="cancelaEd">Cancelar</button>':''}</div></form>`;
 const perfil=u&&!S.editando?`<div class="card" style="flex-direction:row;align-items:center"><span class="lic" style="width:3.6rem;height:3.6rem;border-radius:50%;background:var(--pet);color:#fff;font-weight:800;font-size:1.2rem">${esc(u.nome.split(/\s+/).map(w=>w[0]).slice(0,2).join('').toUpperCase())}</span><span class="col" style="flex:1;min-width:0"><b style="font-size:1.1rem">${esc(u.nome)}</b><span class="sm mut">${esc(u.cel||'Celular não informado')}</span></span><button class="btn sm" data-act="editar">Editar</button></div>
 <div class="card"><div class="row between"><h2 class="h3">Dependentes (${(u.deps||[]).length})</h2></div>
 ${(u.deps||[]).map((x,i)=>`<div class="lrow"><span class="lic">${I.user('#0B4F5C',20)}</span><span class="col" style="flex:1"><b style="font-size:.95rem">${esc(x.nome)}</b><span class="sm mut">${esc(x.par)}</span></span><button class="round" data-act="depdel" data-i="${i}" aria-label="Remover ${esc(x.nome)}">${I.x('#B3261E',18)}</button></div>`).join('')||'<p class="sm mut" style="margin:0">Adicione filhos, pais ou outras pessoas que você agenda. Eles aparecem na mensagem do WhatsApp.</p>'}
 <form data-form="dep" class="col" style="gap:.6rem"><div class="row wrap"><input class="inp" name="nome" required placeholder="Nome do dependente" style="flex:2;min-width:10rem"><select class="inp" name="par" style="flex:1;min-width:8rem">${PARENT.map(x=>`<option>${x}</option>`).join('')}</select></div><button class="btn" type="submit">${I.plus('#0B4F5C',18)} Adicionar dependente</button></form></div>`:login;
 return phead('Perfil',u?'Seus dados ficam só neste aparelho':'Entre para agendar mais rápido',false)+`<section class="sec">${perfil}
 <div class="card" style="padding:.2rem 1rem">
 <button class="lrow" data-act="picker" data-alvo="origin"><span class="lic">${I.pin('#0B4F5C',20)}</span><span class="col" style="flex:1;min-width:0"><b style="font-size:.95rem">Ponto de partida</b><span class="sm mut ell">${esc(S.origin.n)}</span></span>${I.chev('#4A6066',18)}</button>
 <button class="lrow" data-act="pg" data-v="acess"><span class="lic">${I.aa('#0B4F5C',20)}</span><span class="col" style="flex:1"><b style="font-size:.95rem">Acessibilidade</b><span class="sm mut">Letra grande, contraste, voz e modo simples</span></span>${I.chev('#4A6066',18)}</button>
 <button class="lrow" data-act="pg" data-v="privacidade"><span class="lic">${I.shield('#0B4F5C',20)}</span><span class="col" style="flex:1"><b style="font-size:.95rem">Privacidade (LGPD)</b><span class="sm mut">Como tratamos seus dados</span></span>${I.chev('#4A6066',18)}</button></div>
 <h2 class="h2">Favoritos (${favs.length})</h2>${favs.length?`<div class="grid">${favs.map(card).join('')}</div>`:'<div class="empty">Toque no coração de um local para guardá-lo aqui.</div>'}
 <button class="btn" data-act="limpar" style="flex:none;border-color:#B3261E;color:#B3261E">Apagar todos os meus dados deste aparelho</button></section>`}

/* ---- páginas do menu ---- */
const TOG=(k,t,s)=>`<button class="sw" role="switch" aria-checked="${!!S.a11y[k]}" data-act="a11y" data-k="${k}"><span class="col" style="flex:1"><b style="font-size:.98rem">${t}</b><span class="sm mut">${s}</span></span><span class="tog" aria-hidden="true"></span></button>`;
const FAQ=[['O Pax marca a consulta por mim?','Não. O Pax encontra o local e abre o WhatsApp oficial com a mensagem pronta. Você envia, e a clínica responde com os horários. Onde não há WhatsApp oficial, mostramos o telefone.'],['O Pax é gratuito?','Sim. O app é gratuito para pacientes. Os preços que aparecem são das clínicas, quando publicados.'],['Como sei se o local está aberto?','Calculamos pelo horário de Brasília com o horário publicado pelo local. Quando não conseguimos confirmar, aparece "Horário a confirmar": ligue antes de ir.'],['De onde vêm as notas ⭐?','Do Google Maps, pesquisadas em '+CFG.dataRef+'. Para ver a nota atual ou avaliar, use o botão "Avaliar no Google Maps".'],['Como calculo a rota?','Na página do local, toque em "Como chegar". Você pode trocar o ponto de partida e o destino quando quiser e abrir no Google Maps, Waze ou Uber.'],['Posso agendar para meu filho ou meus pais?','Sim. Cadastre dependentes no Perfil. Na hora do WhatsApp, escolha quem é o paciente.'],['Meus dados vão para algum servidor?','Não. Nome, celular, dependentes, favoritos e agenda ficam só neste aparelho. Você pode apagar tudo no Perfil.'],['Encontrei um dado errado. Como aviso?','Use "Fale conosco" no menu. Clínicas podem pedir correção em "Para clínicas e médicos".']];
const PGS={
 acess:['Acessibilidade','Para idosos, pessoas com deficiência e para todos',()=>`<div class="card"><h2 class="h3">Tamanho da letra</h2><div class="seg" role="group" aria-label="Tamanho da letra">${[[0,'A','Normal'],[1,'A+','Grande'],[2,'A++','Muito grande']].map(([v,t,l])=>`<button data-act="fs" data-v="${v}" aria-pressed="${S.a11y.fs===v}" aria-label="${l}" style="font-size:${1+v*.2}rem">${t}</button>`).join('')}</div></div>
 <div class="card" style="padding:.2rem 1rem">${TOG('hc','Alto contraste','Cores mais fortes e bordas pretas')}${TOG('leg','Letra de leitura fácil','Fonte Atkinson Hyperlegible, feita para baixa visão')}${TOG('ler','Leitura em voz alta','Mostra o botão amarelo que lê a tela')}${TOG('simples','Modo simples','Só o essencial, botões maiores')}${TOG('nomo','Reduzir animações','Desliga efeitos de movimento')}</div>
 <div class="card"><h2 class="h3">Busca por voz</h2><p class="p">${SR?'Disponível: toque no microfone no topo de qualquer tela ou dentro das buscas e diga, por exemplo, "cardiologista" ou "hemograma".':'Este navegador não oferece busca por voz. No Android, use o Google Chrome.'}</p>${TTS?`<button class="btn" data-act="testevoz" style="flex:none">${I.speaker('#0B4F5C',20)} Ouvir um exemplo</button>`:''}</div>`],
 ajuda:['Ajuda','Perguntas frequentes',()=>FAQ.map(([q,a])=>`<details class="faq"><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')],
 contato:['Fale conosco','Dúvidas, sugestões e correções',()=>`<div class="card"><p class="p">Fale com a equipe do Pax - Saúde. Respondemos em dias úteis.</p><div class="kv"><span class="mut">Empresa</span><b>${esc(CFG.empresa)}</b></div><div class="kv"><span class="mut">E-mail</span><b>${esc(CFG.email)}</b></div><a class="btn pri" href="mailto:${/@/.test(CFG.email)?CFG.email:''}?subject=${enc('Pax - Saúde: contato')}">${I.mail('#fff',20)} Escrever e-mail</a></div><div class="info warn">${I.alert('#5E3B08',20)}<span>O Pax não faz atendimento médico. Em emergência, ligue 192.</span></div>`],
 clinicas:['Para clínicas e médicos','Apareça no Pax ou corrija seus dados',()=>`<div class="card"><h2 class="h3">Seu local já pode estar aqui</h2><p class="p">Listamos ${LOC.length} locais em São Paulo com dados públicos. Para corrigir endereço, horário, WhatsApp oficial, fotos ou redes sociais, fale com a gente.</p>${['Cadastro gratuito na versão atual','Botão de WhatsApp com mensagem pronta','Rota, mapa e nota do Google Maps'].map(t=>`<div class="row">${I.shield('#14A39A',20)}<span class="p">${t}</span></div>`).join('')}<a class="btn pri" href="mailto:${/@/.test(CFG.email)?CFG.email:''}?subject=${enc('Pax - Saúde: cadastro de clínica')}">${I.brief('#fff',20)} Pedir cadastro ou correção</a></div>`],
 termos:['Termos de Uso','Versão preliminar · '+CFG.dataRef,()=>`<div class="card"><p class="p sm mut">Rascunho para revisão jurídica. Empresa responsável: ${esc(CFG.empresa)}.</p>${[['1. O que é o Pax','O Pax - Saúde é um guia que ajuda a encontrar consultas e exames, ver como chegar e iniciar o agendamento pelo WhatsApp ou telefone do próprio local.'],['2. O que o Pax não faz','O Pax não presta serviço médico, não marca consultas em nome do usuário, não garante vagas, preços ou horários e não substitui orientação médica. Em emergência, ligue 192.'],['3. Informações dos locais','Os dados vêm de fontes públicas (sites oficiais, CNES, catálogos) e podem mudar. Confirme com o local antes de ir.'],['4. Links externos','WhatsApp, Google Maps, Waze, Uber, redes sociais e serviços de teleconsulta têm termos próprios.'],['5. Uso adequado','Não use o Pax para enviar mensagens falsas ou abusivas aos locais.'],['6. Alterações','Estes termos podem mudar; a data da versão fica no topo.']].map(([t,x])=>`<h2 class="h3">${t}</h2><p class="p">${x}</p>`).join('')}</div>`],
 privacidade:['Política de Privacidade','Lei Geral de Proteção de Dados (LGPD)',()=>`<div class="card"><p class="p sm mut">Rascunho para revisão jurídica. Controlador: ${esc(CFG.empresa)} · contato: ${esc(CFG.email)}.</p>${[['Dados que você informa','Nome, celular, dependentes (nome e parentesco), ponto de partida, favoritos e histórico de pedidos.'],['Onde ficam','Somente no armazenamento deste navegador (localStorage). O Pax não envia esses dados para servidor próprio.'],['Serviços externos','Para mapas, endereços, rotas e fotos, o navegador consulta OpenStreetMap/CARTO, Nominatim, OSRM, Mapillary, Wikimedia Commons e Google Maps. Esses serviços recebem o seu endereço IP e as coordenadas pesquisadas. A localização por GPS só é usada se você permitir.'],['WhatsApp','A mensagem só sai quando você toca em enviar no seu WhatsApp.'],['Seus direitos (art. 18 da LGPD)','Acessar, corrigir e apagar seus dados. Você pode editar o perfil ou apagar tudo em Perfil › Apagar meus dados.'],['Dados de saúde','O Pax não pede diagnóstico nem histórico médico. O nome do exame ou especialidade escolhido fica só no seu aparelho.']].map(([t,x])=>`<h2 class="h3">${t}</h2><p class="p">${x}</p>`).join('')}</div>`],
 emergencia:['Emergência','Ligue agora. Não espere agendar.',()=>`${[['192','SAMU','Ambulância e urgência médica','#B3261E'],['193','Bombeiros','Acidentes, resgate e incêndio','#B3261E'],['190','Polícia Militar','Violência e segurança','#0B4F5C'],['188','CVV','Apoio emocional, 24 horas, gratuito','#0B4F5C'],['136','Disque Saúde','Informações do SUS','#0B4F5C']].map(([n,t,s,c])=>`<a class="card" href="tel:${n}" style="flex-direction:row;align-items:center"><span class="lic" style="width:3.6rem;height:3.6rem;background:${c};color:#fff;font-weight:800;font-size:1.25rem">${n}</span><span class="col" style="flex:1"><b style="font-size:1.05rem">${t}</b><span class="sm mut">${s}</span></span>${I.phone(c,24)}</a>`).join('')}<button class="btn" data-act="atalho" data-k="ps" style="flex:none">${I.build('#0B4F5C',20)} Ver pronto-socorro 24h perto</button>`],
 sobre:['Sobre o Pax','Consultas e exames em São Paulo',()=>`<div class="card" style="align-items:center;text-align:center">${LOGO(72)}<h2 class="h2">Pax - Saúde</h2><p class="p mut">Versão ${CFG.versao} · ${CFG.dataRef}</p><p class="p">Pax quer dizer paz. Nosso objetivo é tirar a ansiedade de encontrar onde se cuidar: achar o local certo, saber como chegar e começar o agendamento em poucos toques.</p></div><div class="card"><b>${LOC.length} locais e serviços na cidade de São Paulo</b><div class="meta">${Object.keys(CATS).map(c=>`<span class="tag" style="background:${CATS[c].fundo};color:${CATS[c].cor}">${CATS[c].nome}: ${LOC.filter(p=>p.c===c).length}</span>`).join('')}</div><span class="p">Foco na Avenida Paulista e arredores, sem deixar de fora a Lapa. Cada especialidade e cada tipo de exame tem pelo menos 3 opções.</span></div>`],
 fontes:['Fontes e créditos','De onde vêm os dados, mapas e fotos',()=>{const comFoto=LOC.filter(p=>p.foto).length;return `<div class="card"><h2 class="h3">Dados dos locais</h2><p class="p">Pesquisa de ${CFG.dataRef} em sites oficiais, CNES, Doctoralia e catálogos médicos. Cada local mostra a fonte. WhatsApp só aparece onde é oficial (${LOC.filter(p=>p.wa).length} locais).</p></div>
 <div class="card"><h2 class="h3">Mapas e rotas</h2><p class="p">Mapas: © OpenStreetMap e © CARTO. Endereços: Nominatim (OpenStreetMap). Rotas: OSRM. Links: Google Maps, Waze e Uber.</p></div>
 <div class="card"><h2 class="h3">Fotos</h2><p class="p">${comFoto} locais têm foto do site oficial. Os demais recebem, ao abrir, fotos de rua do Mapillary (CC BY-SA) e imagens da Wikimedia Commons próximas ao endereço; sem foto, mostramos a miniatura do mapa do local. Toque no crédito da foto para ver o autor e a licença.</p></div>
 <div class="card"><h2 class="h3">Notas ⭐</h2><p class="p">Notas do Google Maps pesquisadas em ${CFG.dataRef} (${LOC.filter(p=>p.g).length} locais até agora). Avaliações são feitas no próprio Google Maps.</p></div>
 <form class="card" data-form="mly"><h2 class="h3">Fotos de rua (Mapillary)</h2><p class="sm mut" style="margin:0">${CFG.mapillary?'Ativo neste aparelho.':'Desativado. Cole o token de cliente do Mapillary (começa com MLY|) para ativar as fotos de rua.'}</p><div class="row"><input class="inp" name="tk" placeholder="MLY|..." autocomplete="off" style="flex:1"><button class="btn sm pri" type="submit">Salvar</button></div></form>
 <div class="info">${I.info('#0A4B44',20)}<span>Hospital Sorocabana (Lapa) não aparece: está fechado, com reabertura prevista para 2027.</span></div>`}]
};
function vPg(){const g=PGS[S.pg]||PGS.sobre;return phead(g[0],g[1])+`<section class="sec">${g[2]()}</section>`}

/* ============ MENU LATERAL ============ */
function abrirMenu(){const u=S.user;const it=(v,ic,t,s,cor)=>`<button class="it" data-act="pg" data-v="${v}"><span class="lic" style="${cor?`background:${cor==='#B3261E'?'#FBE9E8':'var(--mint)'}`:''}">${I[ic](cor||'#0B4F5C',20)}</span><span style="flex:1"><b${cor==='#B3261E'?' style="color:#B3261E"':''}>${t}</b><small>${s}</small></span></button>`;
 $('drawer').innerHTML=`<div class="drawer-bg" data-act="fecharMenu"></div><nav class="drawer" role="dialog" aria-modal="true" aria-label="Menu"><div class="dh"><div class="row between"><span class="row">${LOGO(34,'#fff','#34C3B5')}<span style="font-size:1.2rem"><b>Pax</b> - Saúde</span></span><button class="iconbtn" data-act="fecharMenu" aria-label="Fechar menu">${I.x('#fff',22)}</button></div>
 <button class="row" data-act="nav" data-v="perfil" style="color:#fff;text-align:left"><span class="lic" style="background:rgba(255,255,255,.15)">${I.user('#fff',20)}</span><span class="col"><b>${u?esc(u.nome):'Entrar / criar perfil'}</b><span class="sm" style="opacity:.85">${u?'Perfil e dependentes':'Nome, celular e dependentes'}</span></span></button></div>
 <span class="grp">AJUDA</span>${it('emergencia','ambul','Emergência','192 SAMU · 193 Bombeiros','#B3261E')}${it('acess','aa','Acessibilidade','Letra grande, contraste e voz')}${it('ajuda','help','Ajuda','Perguntas frequentes')}${it('contato','mail','Fale conosco','Dúvidas e correções')}
 <span class="grp">PAX</span>${it('clinicas','brief','Para clínicas e médicos','Apareça ou corrija seus dados')}${it('sobre','info','Sobre o Pax','Missão e números')}${it('fontes','book','Fontes e créditos','Dados, mapas e fotos')}
 <span class="grp">TERMOS E PRIVACIDADE</span>${it('termos','doc','Termos de Uso','Regras de uso do app')}${it('privacidade','shield','Política de Privacidade','LGPD e seus dados')}
 <p class="sm mut" style="padding:1rem 1.1rem">© 2026 ${esc(CFG.empresa)} · versão ${CFG.versao}</p></nav>`;
 empilha('menu');const b=document.querySelector('.drawer .iconbtn');if(b)b.focus()}
function fecharMenu(m){if(!$('drawer').innerHTML)return;$('drawer').innerHTML='';if(m==='nav')REUSE=true;else if(m!==true)desempilha()}

/* ============ MODAIS ============ */
function fechar(m){if(!$('modal').innerHTML)return;$('modal').innerHTML='';if(m==='nav')REUSE=true;else if(m!==true)desempilha()}
function abrirModal(html,label){const novo=!$('modal').innerHTML;$('modal').innerHTML=`<div class="modal-bg" data-act="fechar-bg"><div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(label)}"><span class="grab"></span>${html}</div></div>`;if(novo)empilha('modal');const f=document.querySelector('.sheet input:not([type=checkbox]),.sheet select');if(f&&!f.value)f.focus()}
const xBtn=`<button class="round" data-act="fechar" aria-label="Fechar">${I.x('#0C2329',20)}</button>`;
let PK=null;
function picker(alvo){PK={alvo,q:''};
 abrirModal(`<div class="row between"><h2 class="h2">${alvo==='origin'?'De onde você sai?':'Para onde você vai?'}</h2>${xBtn}</div>
 <form class="search" data-form="livre">${I.search('#0B4F5C',20)}<label class="sr" for="pq">Endereço ou local</label><input id="pq" name="q" type="search" autocomplete="off" placeholder="Endereço, estação, bairro ou unidade" data-live="pk"><button type="button" class="micbtn" data-act="voz" data-alvo="pq" aria-label="Falar o endereço">${I.mic('#fff',20)}</button></form>
 ${alvo==='origin'&&navigator.geolocation?`<button class="lrow" data-act="gps"><span class="lic" style="background:#E5EEFC">${I.gps('#2563EB',20)}</span><span class="col" style="flex:1"><b style="font-size:.95rem">Usar minha localização</b><span class="sm mut">Pelo GPS do aparelho</span></span></button>`:''}
 <div id="pkres" class="col"></div>`,'Escolher local');renderPK()}
function renderPK(){const box=$('pkres');if(!box)return;const t=norm(PK.q);const m=x=>!t||t.split(/\s+/).every(w=>norm(x).includes(w));
 const est=EST.filter(e=>m(e.n+' '+e.l)).map(e=>({k:'ponto',id:e.id,n:e.n,sub:e.l,la:e.la,lo:e.lo,g:'Estações'}));
 const ref=REFS.filter(e=>m(e.n+' '+e.l)).map(e=>({k:'ponto',id:e.id,n:e.n,sub:e.l,la:e.la,lo:e.lo,g:'Bairros e referências'}));
 const un=LOC.filter(p=>!isOnline(p)&&m(p.n+' '+p.e+' '+p.b)).map(p=>Object.assign(ptFromUnit(p),{g:'Unidades de saúde'}));
 const grupos=PK.alvo==='dest'?[un,est,ref]:[ref,est,un];let h='';
 if(PK.q.trim())h+=`<button class="lrow" data-act="pklivre">${I.pin('#0B4F5C',20)}<span class="col" style="flex:1"><b style="font-size:.95rem">Buscar o endereço "${esc(PK.q.trim())}"</b><span class="sm mut">O Pax localiza no mapa (OpenStreetMap)</span></span></button>`;
 PK.items=[];grupos.forEach(g=>{if(!g.length)return;h+=`<span class="grp2">${esc(g[0].g.toUpperCase())}</span>`;g.slice(0,t?20:6).forEach(it=>{const i=PK.items.push(it)-1;h+=`<button class="lrow" data-act="pkpick" data-i="${i}"><span class="dot" style="background:${it.k==='unidade'?CATS[byId(it.id).c].cor:'#F2B33D'}"></span><span class="col" style="flex:1;min-width:0"><b style="font-size:.92rem">${esc(it.n)}</b><span class="sm mut ell">${esc(it.sub)}</span></span></button>`})});
 box.innerHTML=h||'<div class="empty">Nada na lista. Toque em "Buscar o endereço".</div>'}
function setPonto(alvo,pt){if(alvo==='origin'){S.origin=pt;LS.set('origin',pt)}else S.dest=pt;S.rmode=null;fechar();render();toast((alvo==='origin'?'Partida: ':'Destino: ')+pt.n)}
async function pontoLivre(alvo,txt){const pt={k:'geo',n:txt,sub:'Localizando…',la:null,lo:null};setPonto(alvo,pt);const g=await geocode(/s(ã|a)o paulo|sp\b/i.test(txt)?txt:txt+', São Paulo');
 if(g){pt.la=g.la;pt.lo=g.lo;pt.sub=g.nome.split(',').slice(0,3).join(',');if(alvo==='origin')LS.set('origin',pt);toast('Endereço localizado');render()}else{pt.sub='Não encontrado no mapa: a rota usa o texto no Google Maps';pt.k='livre';render();toast('Não achei esse endereço no mapa')}}
let WA=null;
function pacientes(){const u=S.user;const a=[];if(u&&u.nome)a.push({nome:u.nome,rel:''});((u&&u.deps)||[]).forEach(d=>a.push({nome:d.nome,rel:d.par}));return a}
function compor(id){const p=byId(id);if(!p||!p.wa)return;const f=S.flow;
 const tipo=f.tipo&&((f.tipo==='exame'&&(p.lab||p.img.length))||(f.tipo==='consulta'&&p.esp.length))?f.tipo:(['laboratorio','imagem'].includes(p.c)?'exame':'consulta');
 const ops=opcoesItem(p,tipo);const nm=itemNome();const pc=pacientes()[0];
 WA={id,tipo,item:nm&&ops.includes(nm)?nm:ops[0],per:'manha',pag:/conv|plano/i.test(p.cv)&&!/particular/i.test(p.cv)?'convenio':'particular',plano:'',nome:pc?pc.nome:'',rel:'',pac:0,quando:'nesta semana',online:f.modo==='online'};desenharWA()}
function desenharWA(){const p=byId(WA.id);const seg=(k,ops)=>`<div class="seg" role="group">${ops.map(([v,t])=>`<button type="button" data-act="waset" data-k="${k}" data-v="${v}" aria-pressed="${WA[k]===v}">${t}</button>`).join('')}</div>`;const txt=msgWA(p,WA);const pcs=pacientes();
 abrirModal(`<div class="row" style="gap:.75rem"><span class="round wa" style="width:3.2rem;height:3.2rem;border-radius:50%">${ICW}</span><span class="col" style="flex:1;min-width:0"><h2 class="h2">Agendar pelo WhatsApp</h2><span class="sm mut ell">${esc(p.n)}</span></span>${xBtn}</div>
 <label class="f">Quero agendar${seg('tipo',[['consulta','Consulta'],['exame','Exame']])}</label>
 <label class="f">${WA.tipo==='exame'?'Exame':'Especialidade'}<select class="inp" data-live="waitem">${opcoesItem(p,WA.tipo).map(x=>`<option ${x===WA.item?'selected':''}>${esc(x)}</option>`).join('')}</select></label>
 ${pcs.length?`<label class="f">Paciente<select class="inp" data-live="wapac">${pcs.map((x,i)=>`<option value="${i}" ${WA.pac===i?'selected':''}>${esc(x.nome)}${x.rel?' · '+esc(x.rel):' (você)'}</option>`).join('')}<option value="-1" ${WA.pac===-1?'selected':''}>Outra pessoa</option></select></label>`:''}
 ${!pcs.length||WA.pac===-1?`<label class="f">Nome do paciente<input class="inp" data-live="wanome" value="${esc(WA.pac===-1?WA.nome:WA.nome)}" placeholder="Nome completo" autocomplete="name"></label>`:''}
 <label class="f">Quando<select class="inp" data-live="waquando">${['hoje','amanhã','nesta semana','na próxima semana'].map(x=>`<option ${x===WA.quando?'selected':''}>${x}</option>`).join('')}</select></label>
 <label class="f">Período${seg('per',[['manha','Manhã'],['tarde','Tarde'],['qualquer','Qualquer']])}</label>
 <label class="f">Pagamento${seg('pag',[['particular','Particular'],['convenio','Convênio']])}</label>
 ${WA.pag==='convenio'?`<label class="f">Nome do plano (opcional)<input class="inp" data-live="waplano" value="${esc(WA.plano)}" placeholder="Ex.: nome do seu convênio"></label>`:''}
 <div class="col" style="gap:.4rem"><span class="sm" style="font-weight:800;color:#33484D">Mensagem que vai pronta</span><div class="chat"><div class="bubble" id="wabubble">${esc(txt)}</div></div></div>
 <a class="btn wa" id="wago" href="${waUrl(p,txt)}" target="_blank" rel="noopener" data-act="wago" style="min-height:3.4rem;font-size:1.02rem;flex:none">${ICW} Abrir WhatsApp</a>
 <span class="sm mut" style="text-align:center">${esc(p.wn)} · +${p.wa.replace(/^55(\d\d)(\d+)(\d{4})$/,'55 ($1) $2-$3')}. A mensagem sai do seu WhatsApp; o Pax não envia nada sozinho.</span>`,'Agendar pelo WhatsApp')}
function atualizaWA(){const p=byId(WA.id);const t=msgWA(p,WA);const b=$('wabubble'),a=$('wago');if(b)b.textContent=t;if(a)a.href=waUrl(p,t)}
function ligar(id){const p=byId(id);abrirModal(`<div class="row between"><h2 class="h2">Ligar para ${esc(p.n)}</h2>${xBtn}</div>
 ${p.t.map(t=>`<div class="card" style="flex-direction:row;align-items:center"><span class="col" style="flex:1;min-width:0"><b style="font-size:1.15rem">${esc(t)}</b><span class="sm mut">${esc(p.hr)}</span></span><a class="btn pri" href="${telHref(t)}" style="flex:none">${I.phone('#fff',18)} Ligar</a><button class="btn" data-act="copiar" data-v="${esc(t.replace(/\s*\([^)]*\)\s*$/,''))}" style="flex:none">Copiar</button></div>`).join('')}`,'Ligar')}

/* ============ RENDER E NAVEGAÇÃO ============ */
const VIEWS={inicio:vInicio,novo:vNovo,modo:vModo,itens:vItens,resultados:vResultados,buscar:vBuscar,local:vLocal,rota:vRota,agenda:vAgenda,perfil:vPerfil,pg:vPg};
const TABS=['inicio','buscar','novo','agenda','perfil'];
let HIST=[];
function topBar(){$('top').innerHTML=`<button class="iconbtn" data-act="menu" aria-label="Abrir menu">${I.menu('#fff',26)}</button><button class="brand" data-act="nav" data-v="inicio" aria-label="Pax - Saúde, ir para o início"><span class="mk">${LOGO(26)}</span><span><b>Pax</b><span> - Saúde</span></span></button>${SR?`<button class="iconbtn" data-act="vozglobal" aria-label="Buscar por voz">${I.mic('#fff',24)}</button>`:`<button class="iconbtn" data-act="pg" data-v="acess" aria-label="Acessibilidade">${I.aa('#fff',24)}</button>`}`}
function navBar(){const it=[['inicio','Início','home'],['buscar','Buscar','search'],['novo','Agendar',null],['agenda','Agenda','cal'],['perfil','Perfil','user']];
 const v=S.view;const at=['novo','modo','itens','resultados'].includes(v)?'novo':['local','rota','pg'].includes(v)?S.navAt||'inicio':v;const pend=S.hist.filter(x=>!x.ok).length;
 $('nav').innerHTML=it.map(([k,t,ic])=>{const on=at===k;
  if(!ic)return `<button class="mid" data-act="nav" data-v="novo" ${on?'aria-current="page"':''}><span class="plus">${I.plus('#fff',28,2.4)}</span><span>${t}</span></button>`;
  return `<button data-act="nav" data-v="${k}" ${on?'aria-current="page"':''}><span class="bub" style="position:relative">${I[ic](on?'#FFFFFF':'#4A6066',22)}${k==='agenda'&&pend?`<span style="position:absolute;top:-2px;right:8px;min-width:1.1rem;height:1.1rem;border-radius:999px;background:#B3261E;color:#fff;font-size:.65rem;font-weight:800;display:flex;align-items:center;justify-content:center">${pend}</span>`:''}</span><span>${t}</span></button>`}).join('')}
function aplicaA11y(){const h=document.documentElement,a=S.a11y;h.classList.toggle('fs1',a.fs===1);h.classList.toggle('fs2',a.fs===2);h.classList.toggle('hc',!!a.hc);h.classList.toggle('legivel',!!a.leg);h.classList.toggle('simples',!!a.simples);h.classList.toggle('nomotion',!!a.nomo);
 $('fab').innerHTML=a.ler?`<button class="fab" data-act="ler" aria-label="Ouvir esta tela">${I.speaker('#3A2600',26)}</button>`:''}
function render(anim){matarMapas();BAR='';const v=S.view,app=$('app');
 app.innerHTML=(VIEWS[v]||vInicio)();$('barbox').innerHTML=BAR;document.body.classList.toggle('has-bar',!!BAR);
 topBar();navBar();aplicaA11y();
 if(anim){app.classList.remove('enter');void app.offsetWidth;app.classList.add('enter')}
 if(v==='buscar')renderRes();
 if(v==='itens')renderItens();
 if(v==='resultados'&&S.flow.modo!=='online')mapaResultados('mapRes',resultadosFlow().filter(p=>!isOnline(p)));
 if(v==='rota')posRota();
 if(v==='local'){const p=byId(S.sel);ligaGaleria();if(p){pedirFotos(p);if(!p.geo&&!isOnline(p)){const la=p.la;refinar(p).then(()=>{if(S.view==='local'&&S.sel===p.id&&p.la!==la)render()})}}}
 observar()}
/* histórico: botão "voltar" do Android e do navegador */
let IGN=0,HOK=true,REUSE=false;
function empilha(tipo){try{if(REUSE){REUSE=false;history.replaceState({pax:tipo},'')}else history.pushState({pax:tipo},'')}catch(e){HOK=false}}
function desempilha(){if(!HOK)return;try{IGN++;history.back()}catch(e){IGN=0}}
window.addEventListener('popstate',()=>{if(IGN>0){IGN--;return}if($('modal').innerHTML){fechar(true);return}if($('drawer').innerHTML){fecharMenu(true);return}voltarTela()});
function snap(){return{v:S.view,sel:S.sel,pg:S.pg,flow:Object.assign({},S.flow)}}
function ir(v){if(!VIEWS[v])v='inicio';if(S.view!==v||v==='local'||v==='pg'){HIST.push(snap());empilha('tela')}else if(REUSE){REUSE=false;try{history.replaceState({pax:'tela'},'')}catch(e){}}if(TABS.includes(v))S.navAt=v;S.view=v;render(true);try{window.scrollTo(0,0)}catch(e){}const a=$('app');if(a&&a.focus)try{a.focus({preventScroll:true})}catch(e){}}
function irTab(v){fechar('nav');fecharMenu('nav');if(v==='novo')S.flow={tipo:null,modo:null,item:null};ir(v)}
function voltarTela(){const s=HIST.pop();if(!s){if(S.view!=='inicio'){S.view='inicio';render(true)}return}S.view=s.v;S.sel=s.sel;S.pg=s.pg;S.flow=s.flow;if(TABS.includes(s.v))S.navAt=s.v;render(true);try{window.scrollTo(0,0)}catch(e){}}
function voltar(){if(HIST.length&&HOK){try{history.back();return}catch(e){}}voltarTela()}
function abrir(id){S.sel=id;fechar('nav');fecharMenu('nav');ir('local')}
function abrirPg(k){fecharMenu('nav');fechar('nav');S.pg=k;ir('pg')}

/* ============ EVENTOS ============ */
document.addEventListener('click',e=>{const t=e.target.closest('[data-act]');if(!t)return;const a=t.dataset.act,id=+t.dataset.id;
 if(a==='fechar-bg'){if(e.target===t)fechar();return}
 switch(a){
 case'nav':irTab(t.dataset.v);break;
 case'menu':abrirMenu();break;
 case'fecharMenu':fecharMenu();break;
 case'pg':abrirPg(t.dataset.v);break;
 case'abrir':abrir(id);break;
 case'voltar':voltar();break;
 case'tipo':S.flow={tipo:t.dataset.v,modo:null,item:null};ir('modo');break;
 case'modo':S.flow.modo=t.dataset.v;S.flow.item=null;S.qi='';ir('itens');break;
 case'item':S.flow.item=t.dataset.k;S.sort='perto';S.fWa=S.fOpen=S.fConv=S.fSus=S.f24=false;ir('resultados');break;
 case'atalho':{const k=t.dataset.k;if(k!=='gps'&&k!=='emerg'){fecharMenu('nav');fechar('nav')}S.fWa=S.fOpen=S.fConv=S.fSus=S.f24=false;S.q='';S.cat='todos';S.sort='perto';
  if(k==='ps'){S.cat='hospital';S.f24=true;ir('buscar')}else if(k==='wa'){S.fWa=true;ir('buscar')}else if(k==='sus'){S.fSus=true;ir('buscar')}
  else if(k==='tele'){S.flow={tipo:'consulta',modo:'online',item:null};S.qi='';ir('itens')}else if(k==='favs')ir('perfil');else if(k==='emerg')abrirPg('emergencia');
  else if(k==='gps')usarGPS();break}
 case'cat':S.cat=t.dataset.cat;render();break;
 case'tg':S[t.dataset.k]=!S[t.dataset.k];render();break;
 case'sort':S.sort=t.dataset.k;render();break;
 case'vis':S.map=t.dataset.k==='mapa';render();break;
 case'rmap':S.rmap=t.dataset.k;render();break;
 case'rmode':S.rmode=t.dataset.k;render();break;
 case'fav':{const i=S.favs.indexOf(id);if(i>=0)S.favs.splice(i,1);else S.favs.push(id);LS.set('favs',S.favs);render();toast(i>=0?'Removido dos favoritos':'Salvo nos favoritos');break}
 case'rota':S.dest=ptFromUnit(byId(id));S.rmode=null;fechar('nav');ir('rota');break;
 case'trocar':if(S.dest){const o=S.origin;S.origin=S.dest;S.dest=o;S.rmode=null;LS.set('origin',S.origin);render()}break;
 case'picker':picker(t.dataset.alvo);break;
 case'pkpick':setPonto(PK.alvo,PK.items[+t.dataset.i]);break;
 case'pklivre':pontoLivre(PK.alvo,PK.q.trim());break;
 case'gps':usarGPS();break;
 case'voz':voz(t.dataset.alvo);break;
 case'vozglobal':voz('global');break;
 case'ler':lerTela();break;
 case'testevoz':falar('Olá! Eu sou o Pax. Posso ler as informações dos locais para você.');break;
 case'compart':{const p=byId(id);const txt=`${p.n} — ${isOnline(p)?p.url:limpaEnd(p.e)} (via Pax - Saúde)`;const url=isOnline(p)?p.url:gplace(p);
  if(navigator.share)navigator.share({title:p.n,text:txt,url}).catch(()=>{});else copiar(txt+' '+url,'Link copiado');break}
 case'wa':compor(id);break;
 case'waset':WA[t.dataset.k]=t.dataset.v;if(t.dataset.k==='tipo')WA.item=opcoesItem(byId(WA.id),WA.tipo)[0];desenharWA();break;
 case'wago':{const p=byId(WA.id);S.hist.unshift({id:p.id,tipo:WA.tipo,item:WA.item,pac:WA.nome,data:new Date().toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}),ok:false});S.hist=S.hist.slice(0,40);LS.set('hist',S.hist);setTimeout(()=>{fechar();navBar();toast('Acompanhe em Agenda')},300);break}
 case'ligar':ligar(id);break;
 case'copiar':copiar(t.dataset.v,'Número copiado');break;
 case'fechar':fechar();break;
 case'hok':S.hist[+t.dataset.i].ok=!S.hist[+t.dataset.i].ok;LS.set('hist',S.hist);render();break;
 case'hdel':S.hist.splice(+t.dataset.i,1);LS.set('hist',S.hist);render();break;
 case'editar':S.editando=true;render();break;
 case'cancelaEd':S.editando=false;render();break;
 case'depdel':S.user.deps.splice(+t.dataset.i,1);LS.set('user',S.user);render();break;
 case'fs':S.a11y.fs=+t.dataset.v;LS.set('a11y',S.a11y);render();break;
 case'a11y':{const k=t.dataset.k;S.a11y[k]=!S.a11y[k];LS.set('a11y',S.a11y);render();if(k==='ler'&&S.a11y.ler)falar('Leitura em voz alta ativada. Toque no botão amarelo para ouvir a tela.');break}
 case'limpar':if(typeof confirm==='function'&&!confirm('Apagar perfil, dependentes, favoritos e agenda deste aparelho?'))break;['favs','hist','origin','nome','geo','user','a11y','fotos3'].forEach(k=>LS.del(k));S.favs=[];S.hist=[];S.user=null;S.origin=ORIGEM_PADRAO;S.a11y={fs:0,hc:false,leg:false,ler:false,simples:false,nomo:false};toast('Dados apagados');render();break;
 }});
function copiar(v,msg){try{navigator.clipboard.writeText(v).then(()=>toast(msg),()=>toast(v))}catch(err){toast(v)}}
function usarGPS(){if(!navigator.geolocation){toast('Localização indisponível neste navegador');return}toast('Buscando sua localização…');navigator.geolocation.getCurrentPosition(pos=>setPonto('origin',{k:'gps',n:'Minha localização',sub:'GPS do aparelho',la:pos.coords.latitude,lo:pos.coords.longitude}),()=>toast('Não foi possível usar a localização. Verifique a permissão.'),{enableHighAccuracy:true,timeout:10000})}
document.addEventListener('input',e=>{const k=e.target.dataset.live;if(!k)return;
 if(k==='q'){S.q=e.target.value;renderRes()}else if(k==='qi'){S.qi=e.target.value;renderItens()}else if(k==='pk'){PK.q=e.target.value;renderPK()}
 else if(k==='cel'){const v=fmtCel(e.target.value);if(v!==e.target.value)e.target.value=v}
 else if(k==='waitem'){WA.item=e.target.value;atualizaWA()}else if(k==='wanome'){WA.nome=e.target.value.trim();WA.rel='';atualizaWA()}else if(k==='waplano'){WA.plano=e.target.value.trim();atualizaWA()}else if(k==='waquando'){WA.quando=e.target.value;atualizaWA()}});
document.addEventListener('change',e=>{const k=e.target.dataset.live;if(k==='waitem'){WA.item=e.target.value;atualizaWA()}if(k==='waquando'){WA.quando=e.target.value;atualizaWA()}
 if(k==='wapac'){const i=+e.target.value;WA.pac=i;if(i>=0){const x=pacientes()[i];WA.nome=x.nome;WA.rel=x.rel}else{WA.nome='';WA.rel=''}desenharWA()}});
document.addEventListener('submit',e=>{e.preventDefault();const f=e.target.dataset.form,F=e.target;
 if(f==='busca'){const al=F.dataset.alvo;if(al==='qi')return;S.q=F.elements.q.value;S.cat='todos';if(S.view!=='buscar')ir('buscar');else renderRes()}
 if(f==='livre'){if(PK.q.trim())pontoLivre(PK.alvo,PK.q.trim());else if(PK.items&&PK.items[0])setPonto(PK.alvo,PK.items[0])}
 if(f==='login'){const nome=F.elements.nome.value.trim().replace(/\s+/g,' ');if(nome.length<2){toast('Digite seu nome');return}const cel=fmtCel(F.elements.cel.value);if(cel&&cel.replace(/\D/g,'').length<10){toast('Confira o celular com DDD');return}
  const novo=!S.user;S.user=Object.assign({deps:[]},S.user||{},{nome,cel});S.editando=false;LS.set('user',S.user);render();toast(novo?'Perfil criado. Bem-vindo(a), '+primeiroNome()+'!':'Perfil salvo')}
 if(f==='mly'){const tk=F.elements.tk.value.trim();if(!/^MLY\|/.test(tk)){toast('O token começa com MLY|');return}CFG.mapillary=tk;LS.set('mly',tk);FQ.length=0;LOC.forEach(p=>p._fq=0);Object.keys(FOTOS).forEach(k=>delete FOTOS[k]);LS.del('fotos3');render();toast('Fotos de rua ativadas')}
 if(f==='dep'){const nome=F.elements.nome.value.trim();if(!nome)return;S.user.deps=S.user.deps||[];S.user.deps.push({nome,par:F.elements.par.value});LS.set('user',S.user);render();toast('Dependente adicionado')}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if($('modal').innerHTML)fechar();else if($('drawer').innerHTML)fecharMenu()}});
(function(){try{history.replaceState({pax:'base'},'')}catch(e){}const v=location.hash.slice(1);S.view=['buscar','agenda','perfil','novo'].includes(v)?v:'inicio';S.navAt=S.view;render(true)})();
