/* =====================================================================
   VittaOne · v3.0 (nov/2026)
   App de página única: dados em dados.js, sem servidor.
   Serviços gratuitos: OpenStreetMap/CARTO (mapas), Nominatim (endereços),
   OSRM (rotas), Mapillary e Wikimedia Commons (fotos), Google Maps (links).
   ===================================================================== */
const CFG={
 mapillary:'MLY|28963648059968063|2604d9bc5dd187e793f457ba123af6c0', /* token público do Mapillary (MLY|...). Também pode ser colado em Menu › Fontes e créditos */
 empresa:'[Nome da empresa]',email:'[e-mail de contato]',versao:'10.1',dataRef:'nov/2026'
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
const GEO=LS.get('geo',{});LOC.forEach(p=>{if(GEO[p.id]&&!p.geoOk){p.la=GEO[p.id][0];p.lo=GEO[p.id][1];p.geo=1}});
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
let _ag=null,_agT=0;function agoraSP(){const _n=Date.now();if(_ag&&_n-_agT<20000)return _ag;_agT=_n;return _ag=agoraSP0()}
function agoraSP0(){const s=new Date().toLocaleString('en-US',{timeZone:'America/Sao_Paulo',hour12:false,weekday:'short',hour:'2-digit',minute:'2-digit'});const m=s.match(/(\w+),?\s+(\d+):(\d+)/);const dias={Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6};return m?{d:dias[m[1]],min:(+m[2]%24)*60+(+m[3])}:{d:new Date().getDay(),min:new Date().getHours()*60+new Date().getMinutes()}}
const toMin=s=>{const[a,b]=s.split(':');return +a*60+ +b};
function status(p){const a=agoraSP(),k=a.d*1440+a.min;if(p._stK===k)return p._st;p._stK=k;return p._st=status0(p)}
function status0(p){if(p.h==='24h')return{k:'aberto',t:'Aberto 24h'};if(!Array.isArray(p.h))return{k:'?',t:p.c==='online'?'Online':'Horário a confirmar'};const n=agoraSP();for(const r of p.h){if(r.d.includes(n.d)&&n.min>=toMin(r.a)&&n.min<toMin(r.f))return{k:'aberto',t:'Aberto · fecha '+r.f.replace(':00','h').replace(':','h')}}return{k:'fechado',t:'Fechado agora'}}
const isOnline=p=>p.c==='online';
const dist=p=>{if(isOnline(p))return null;const o=S.origin;if(p._dO===o&&p._dLa===p.la)return p._d;p._dO=o;p._dLa=p.la;return p._d=km(o,p)};
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
const P2={steth:'<circle cx="20" cy="12" r="2.4"/><path d="M6 3h8v6a4 4 0 0 1-8 0z"/>',flask:'<path d="M7.5 15h9L19 19a1.5 1.5 0 0 1-1.3 2H6.3A1.5 1.5 0 0 1 5 19z"/>',build:'<path d="M4 21V7l8-4 8 4v14z"/>',scan:'<rect x="3" y="4" width="18" height="16" rx="3"/>',video:'<rect x="3" y="6" width="13" height="12" rx="2"/>',tube:'<path d="M10 12h4v6a2 2 0 0 1-4 0z"/>',user:'<circle cx="12" cy="8" r="4"/>',cardio:'<path d="M12 20s-7-4.5-9-9a4.5 4.5 0 0 1 9-3 4.5 4.5 0 0 1 9 3c-2 4.5-9 9-9 9z"/>',heart:'<path d="M12 20s-7-4.5-9-9a4.5 4.5 0 0 1 9-3 4.5 4.5 0 0 1 9 3c-2 4.5-9 9-9 9z"/>',eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/>',brain:'<path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 3 3h6a3 3 0 0 0 3-3 3 3 0 0 0 2-5 3 3 0 0 0-2-5 3 3 0 0 0-3-3z"/>',baby:'<circle cx="12" cy="12" r="8"/>',female:'<circle cx="12" cy="9" r="5"/>',drop:'<path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z"/>',dermato:'<path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8z"/>',chat:'<path d="M4 5h16v11H9l-5 4z"/>',wave:'<rect x="3" y="4" width="18" height="16" rx="3"/>',ambul:'<path d="M3 16V8h11v8z"/>',pin:'<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/>',cal:'<rect x="3" y="5" width="18" height="16" rx="2"/>',home:'<path d="M5 10l7-5.5 7 5.5v10H5z"/>',shield:'<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',clock:'<circle cx="12" cy="12" r="9"/>',mail:'<rect x="3" y="5" width="18" height="14" rx="2"/>',doc:'<path d="M14 3H6v18h12V7z"/>',gastro:'<path d="M6 14c0-4 3-5 3-7h6c0 2 3 2 3 5a6 6 0 0 1-12 2z"/>',ear:'<path d="M7 9a5 5 0 0 1 10 0c0 3-3 4-3 7a3 3 0 0 1-6 0z"/>',search:'<circle cx="11" cy="11" r="7"/>',gps:'<circle cx="12" cy="12" r="4"/>',info:'<circle cx="12" cy="12" r="9"/>',help:'<circle cx="12" cy="12" r="9"/>',book:'<path d="M4 4h6a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4z"/>',brief:'<rect x="3" y="7" width="18" height="13" rx="2"/>',phone:'<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',users:'<circle cx="9" cy="8" r="3.5"/>',map:'<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/>'};
const SVG2=(k,c,w,sw)=>{const col=c||'currentColor';return `<svg width="${w||22}" height="${w||22}" viewBox="0 0 24 24" fill="none" stroke="${col}" stroke-width="${sw||1.9}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P2[k]&&col!=='#fff'&&col!=='#FFFFFF'?`<g fill="${col}" fill-opacity=".16" stroke="none">${P2[k]}</g>`:''}${P[k]||P.info}</svg>`};
const I=new Proxy({},{get:(o,k)=>(c,w,sw)=>SVG2(k,c,w,sw)});
const ICW='<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#063B21" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+P.wa2+'</svg>';
const IC_ESP={clinica:'steth',cardio:'cardio',dermato:'dermato',endo:'drop',gastro:'gastro',gineco:'female',neuro:'brain',oftalmo:'eye',orto:'bone',otorrino:'ear',pedi:'baby',psiq:'chat',uro:'drop'};
const IC_IMG={rx:'bone',us:'wave',tc:'scan',rm:'scan',mamo:'female',dens:'bone',eco:'cardio'};
/* Ícones detalhados por especialidade e exame */
Object.assign(P,{
x_clin:'<path d="M6 3v5a4 4 0 0 0 8 0V3"/><path d="M5 3h2M13 3h2"/><path d="M10 12v3a5 5 0 0 0 10 0v-2"/><circle cx="20" cy="11" r="2"/>',
x_cardio:'<path d="M12 20s-7-4.5-9-9a4.5 4.5 0 0 1 9-3 4.5 4.5 0 0 1 9 3c-2 4.5-9 9-9 9z"/><path d="M5 12h3l1.5-2.5 2 5 2-3.5H19"/>',
x_derm:'<path d="M3 13c3-1.5 6 1.5 9 0s6-1.5 9 0v7H3z"/><path d="M7 13V6M12 12.4V4M17 13V7"/><circle cx="15.5" cy="17" r="1.1"/>',
x_thy:'<path d="M12 9c-1.5-3-7-3.5-7 1.5 0 4 3 6.5 5 5.5 1.2-.6 2-2 2-4 0 2 .8 3.4 2 4 2 1 5-1.5 5-5.5 0-5-5.5-4.5-7-1.5z"/><path d="M12 3v6M12 15.5V21"/>',
x_gastro:'<path d="M9 3v4c0 2-3 3.5-3 7.5a6 6 0 0 0 11 3.2c1.4-2.2.8-5.2-2.2-5.2-2 0-3 1-3.8 0V3"/><path d="M15.5 19.5c1.2 1 3 1 4.5-.2"/>',
x_gin:'<path d="M12 9c-3 0-4 2-4 4s2 3 2 5v2.5h4V18c0-2 2-3 2-5s-1-4-4-4z"/><path d="M8.3 12C6.5 10 5.5 8.5 4 8.5M15.7 12c1.8-2 2.8-3.5 4.3-3.5"/><circle cx="3" cy="8" r="1.6"/><circle cx="21" cy="8" r="1.6"/>',
x_brain:'<path d="M12 5a3 3 0 0 0-5 1 3 3 0 0 0-3 4 3 3 0 0 0 1 5 3 3 0 0 0 4 4 3 3 0 0 0 3-1z"/><path d="M12 5a3 3 0 0 1 5 1 3 3 0 0 1 3 4 3 3 0 0 1-1 5 3 3 0 0 1-4 4 3 3 0 0 1-3-1z"/><path d="M12 5v13M8 10h2M14 13h2M7.5 14.5h1.5"/>',
x_eye:'<path d="M2 12.5s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6z"/><circle cx="12" cy="12.5" r="3.2"/><circle cx="12" cy="12.5" r="1"/><path d="M6 6.5 5 4.5M12 5.5V3.5M18 6.5l1-2"/>',
x_bone:'<path d="M7.5 4.5a2 2 0 1 0-3 3h2l9 9v2a2 2 0 1 0 3 3 2 2 0 1 0 3-3h-2l-9-9v-2a2 2 0 1 0-3-3z"/>',
x_ear:'<path d="M8 9.5a5 5 0 0 1 10 0c0 3-3 4-3 7a3 3 0 0 1-6 0"/><path d="M11 9.5a2 2 0 0 1 4 0c0 1.2-1 1.6-1.6 2.3"/><path d="M4 8c-1.2 2.2-1.2 4.8 0 7"/>',
x_baby:'<circle cx="12" cy="13" r="7"/><path d="M12 6c0-2 2.2-3 3.4-1.8"/><path d="M9.5 12.3v.2M14.5 12.3v.2"/><path d="M10 15.6c1.1 1 2.9 1 4 0"/>',
x_mind:'<path d="M17 21v-3.5c2-1 3-3 3-6a8 8 0 0 0-16 0c0 2.2 1 3.4 2 4.4V21"/><path d="M12 14s-3-1.8-3-3.7a1.6 1.6 0 0 1 3-.8 1.6 1.6 0 0 1 3 .8c0 1.9-3 3.7-3 3.7z"/>',
x_kid:'<path d="M9 3.5c-3 0-5 3.2-5 7.5s2 7.5 5 7.5c2 0 2.2-2.2 1.2-3.3s-1-3 0-4.2 1-3.2 0-4.4S11 3.5 9 3.5z"/><path d="M15 3.5c3 0 5 3.2 5 7.5s-2 7.5-5 7.5c-2 0-2.2-2.2-1.2-3.3s1-3 0-4.2-1-3.2 0-4.4S13 3.5 15 3.5z"/><path d="M10.5 13.5 11 21M13.5 13.5 13 21"/>',
x_rx:'<rect x="3" y="3" width="18" height="18" rx="2.5"/><path d="M12 5.5v13"/><path d="M12 8c-2 0-4 .8-5 2M12 8c2 0 4 .8 5 2M12 11c-2 0-4 .8-5 2M12 11c2 0 4 .8 5 2M12 14c-1.8 0-3.3.8-4.3 2M12 14c1.8 0 3.3.8 4.3 2"/>',
x_us:'<path d="M4.5 14.5 10 9l3.5 3.5L8 18z"/><path d="M4.5 14.5 2.5 16.5l3.5 3.5 2-2"/><path d="M14.5 6.5a4 4 0 0 1 3.5 3.5M15 3a7.5 7.5 0 0 1 6.5 6.5"/>',
x_tc:'<circle cx="12" cy="10" r="7"/><circle cx="12" cy="10" r="3"/><path d="M2 20h20M6 20v-3h12v3"/>',
x_rm:'<path d="M4 18V9a8 8 0 0 1 16 0v9z"/><circle cx="12" cy="10" r="3.5"/><path d="M2 18h20M8 15.5h8"/>',
x_mamo:'<path d="M9 6a3 3 0 0 1 6 0c0 2-1.5 3.5-3 5.5"/><path d="M12 11.5 6.5 20M9 6c0 2 1.5 3.5 3 5.5l5.5 8.5"/>',
x_dens:'<path d="M10 3c-2 0-3 2-1 3l1 1v10l-1 1c-2 1-1 3 1 3h4c2 0 3-2 1-3l-1-1V7l1-1c2-1 1-3-1-3z"/><path d="M12 10v.1M12 13v.1M12 16v.1"/>',
x_eco:'<path d="M10 19s-6-3.8-7.6-7.6A3.8 3.8 0 0 1 10 8.8a3.8 3.8 0 0 1 7.6 2.6"/><path d="M14.5 14.5a3 3 0 0 1 3 3M15.5 11.5a6 6 0 0 1 6 6"/>',
x_blood:'<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/><circle cx="10" cy="14.5" r="1.3"/><circle cx="14" cy="16.5" r="1.3"/><circle cx="13.5" cy="12" r=".8"/>',
x_gluco:'<rect x="6" y="2.5" width="11" height="15" rx="2.5"/><rect x="8.5" y="5" width="6" height="4" rx="1"/><path d="M10.5 17.5v4h2v-4M10 12.5h.1M13 12.5h.1"/>',
x_artery:'<path d="M3 7.5h18M3 16.5h18"/><path d="M7 7.5c1 2.6 5 2.6 6 0M9.5 16.5c1-2 4-2 5 0"/><path d="M17 12h.1M5 12h.1"/>',
x_fat:'<circle cx="8" cy="9" r="3"/><circle cx="15.5" cy="7.5" r="2"/><circle cx="13.5" cy="15.5" r="4"/>',
x_sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
x_bloodclock:'<path d="M10 3s5 5.5 5 9.2"/><path d="M10 3S5 8.5 5 12.3a5 5 0 0 0 5 5"/><circle cx="16.5" cy="16.5" r="4.5"/><path d="M16.5 14v2.5l1.6 1"/>',
x_urine:'<path d="M6 4h12v3H6z"/><path d="M7 7h10l-1 13.5H8z"/><path d="M7.6 13h8.8"/>',
x_preg:'<circle cx="11" cy="4" r="2"/><path d="M10 7c-2 3-2 7 0 9v5"/><path d="M12 7c4.5 1.6 5.5 7 1.2 9V21"/>'});
Object.assign(P2,{x_clin:'<circle cx="20" cy="11" r="2"/>',x_cardio:P.x_cardio.split('/>')[0]+'/>',x_derm:'<path d="M3 13c3-1.5 6 1.5 9 0s6-1.5 9 0v7H3z"/>',x_thy:'<path d="M12 9c-1.5-3-7-3.5-7 1.5 0 4 3 6.5 5 5.5 1.2-.6 2-2 2-4 0 2 .8 3.4 2 4 2 1 5-1.5 5-5.5 0-5-5.5-4.5-7-1.5z"/>',
x_gastro:'<path d="M9 7c0 2-3 3.5-3 7.5a6 6 0 0 0 11 3.2c1.4-2.2.8-5.2-2.2-5.2-2 0-3 1-3.8 0V7z"/>',x_gin:'<path d="M12 9c-3 0-4 2-4 4s2 3 2 5v2.5h4V18c0-2 2-3 2-5s-1-4-4-4z"/>',x_brain:'<path d="M12 5a3 3 0 0 0-5 1 3 3 0 0 0-3 4 3 3 0 0 0 1 5 3 3 0 0 0 4 4 3 3 0 0 0 3-1zM12 5a3 3 0 0 1 5 1 3 3 0 0 1 3 4 3 3 0 0 1-1 5 3 3 0 0 1-4 4 3 3 0 0 1-3-1z"/>',
x_eye:'<circle cx="12" cy="12.5" r="3.2"/>',x_bone:P.x_bone,x_ear:'<path d="M8 9.5a5 5 0 0 1 10 0c0 3-3 4-3 7a3 3 0 0 1-6 0z"/>',x_baby:'<circle cx="12" cy="13" r="7"/>',x_mind:'<path d="M12 14s-3-1.8-3-3.7a1.6 1.6 0 0 1 3-.8 1.6 1.6 0 0 1 3 .8c0 1.9-3 3.7-3 3.7z"/>',
x_kid:P.x_kid.split('<path d="M10.5')[0],x_rx:'<rect x="3" y="3" width="18" height="18" rx="2.5"/>',x_us:'<path d="M4.5 14.5 10 9l3.5 3.5L8 18z"/>',x_tc:'<circle cx="12" cy="10" r="7"/>',x_rm:'<path d="M4 18V9a8 8 0 0 1 16 0v9z"/>',x_mamo:'<path d="M9 6a3 3 0 0 1 6 0c0 2-1.5 3.5-3 5.5C10.5 9.5 9 8 9 6z"/>',
x_dens:P.x_dens.split('<path d="M12 10')[0],x_eco:'<path d="M10 19s-6-3.8-7.6-7.6A3.8 3.8 0 0 1 10 8.8a3.8 3.8 0 0 1 7.6 2.6z"/>',x_blood:'<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',x_gluco:'<rect x="8.5" y="5" width="6" height="4" rx="1"/>',
x_artery:'<path d="M7 7.5c1 2.6 5 2.6 6 0zM9.5 16.5c1-2 4-2 5 0z"/>',x_fat:'<circle cx="8" cy="9" r="3"/><circle cx="15.5" cy="7.5" r="2"/><circle cx="13.5" cy="15.5" r="4"/>',x_sun:'<circle cx="12" cy="12" r="4"/>',x_bloodclock:'<circle cx="16.5" cy="16.5" r="4.5"/>',x_urine:'<path d="M7.6 13h8.8l-.5 7.5H8z"/>',x_preg:'<path d="M12 7c4.5 1.6 5.5 7 1.2 9H10c-2-2-2-6 0-9z"/>'});
Object.assign(IC_ESP,{clinica:'x_clin',cardio:'x_cardio',dermato:'x_derm',endo:'x_thy',gastro:'x_gastro',gineco:'x_gin',neuro:'x_brain',oftalmo:'x_eye',orto:'x_bone',otorrino:'x_ear',pedi:'x_baby',psiq:'x_mind',uro:'x_kid'});
Object.assign(IC_IMG,{rx:'x_rx',us:'x_us',tc:'x_tc',rm:'x_rm',mamo:'x_mamo',dens:'x_dens',eco:'x_eco'});
const LABIC=['x_blood','x_gluco','x_artery','x_fat','x_thy','x_sun','x_bloodclock','x_urine','x_kid','x_preg'];
/* Ícones revisados (2ª versão) */
Object.assign(P,{
x_gastro:'<path d="M8 3v3.5c0 1.2-.6 2-1.6 3C5 11 4.5 13 5 15.2 6 19.5 11 21.5 15 19.8c3.5-1.5 5-5 3.5-8.3-.9-2-3.4-2.5-5-1.2-1 .8-2.4.5-2.9-.6L10 7V3"/><path d="M18.7 13.6c1.3.3 2.3 1.4 2.3 3"/>',
x_mamo:'<path d="M12 12.5C9.5 10 8.5 8.4 8.5 6.6a3.5 3.5 0 0 1 7 0c0 1.8-1 3.4-3.5 5.9z"/><path d="M10.3 10.6 6 19.5l2.3.8 1.7-2.5M13.7 10.6 18 19.5l-2.3.8-1.7-2.5"/>',
x_dens:'<path d="M7.5 4.5a3 3 0 1 1 4.6 2.5L14 9.5V21h-4V10.5L7.9 7.6a3 3 0 0 1-.4-3.1z"/><path d="M3 14h3M18 14h3M3 17h3M18 17h3"/>',
x_bloodclock:'<path d="M9 3s5 5.6 5 9.6a5 5 0 0 1-10 0C4 8.6 9 3 9 3z"/><circle cx="17.5" cy="17" r="4"/><path d="M17.5 15v2l1.4.9"/>',
x_mind:'<path d="M15 21v-3h2a2 2 0 0 0 2-2v-2.5l1.6-.6a.6.6 0 0 0 .3-.9L19 9.5C18.5 5.5 15.4 3 11.5 3 7 3 4 6.3 4 10.4c0 2.4 1 4 2.5 5.4V21"/><path d="M11.5 12.8s-2.8-1.6-2.8-3.4a1.5 1.5 0 0 1 2.8-.7 1.5 1.5 0 0 1 2.8.7c0 1.8-2.8 3.4-2.8 3.4z"/>',
x_us:'<path d="M9.5 2.5h5v7h-5z"/><path d="M8 9.5h8l-1 4H9z"/><path d="M8 17c2.5 1.3 5.5 1.3 8 0M6 20.3c3.6 1.8 8.4 1.8 12 0"/>',
x_artery:'<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="5.5"/><path d="M17.5 12a5.5 5.5 0 0 0-5.5-5.5c1.6 1.4 2.3 3.3 2.3 5 0 .3 1.2.5 3.2.5z"/>',
x_derm:'<circle cx="10" cy="10" r="6.5"/><path d="M14.8 14.8 20.5 20.5"/><path d="M8.3 9c.6-1.3 2.6-1.4 3.3-.1.6 1.1-.2 2.7-1.6 2.7S7.7 10.1 8.3 9z"/>',
x_preg:'<circle cx="11.5" cy="4" r="2"/><path d="M11 7c-1.5 2-1.6 4.5-.6 6.2.5.9.5 1.9 0 2.7L9.5 21"/><path d="M12.5 7.5c1.3 1.6 1.4 3 1 4.3 2.8.6 4.5 2.4 4.3 4.6-.2 2-2 3.2-4.3 3.4L13 21"/>'});
Object.assign(P2,{x_gastro:'<path d="M8 6.5c0 1.2-.6 2-1.6 3C5 11 4.5 13 5 15.2 6 19.5 11 21.5 15 19.8c3.5-1.5 5-5 3.5-8.3-.9-2-3.4-2.5-5-1.2-1 .8-2.4.5-2.9-.6L10 7z"/>',x_mamo:'<path d="M12 12.5C9.5 10 8.5 8.4 8.5 6.6a3.5 3.5 0 0 1 7 0c0 1.8-1 3.4-3.5 5.9z"/>',
x_dens:'<path d="M7.5 4.5a3 3 0 1 1 4.6 2.5L14 9.5V21h-4V10.5L7.9 7.6a3 3 0 0 1-.4-3.1z"/>',x_bloodclock:'<path d="M9 3s5 5.6 5 9.6a5 5 0 0 1-10 0C4 8.6 9 3 9 3z"/>',x_mind:'<path d="M15 21v-3h2a2 2 0 0 0 2-2v-2.5l1.6-.6a.6.6 0 0 0 .3-.9L19 9.5C18.5 5.5 15.4 3 11.5 3 7 3 4 6.3 4 10.4c0 2.4 1 4 2.5 5.4V21z"/>',
x_us:'<path d="M8 9.5h8l-1 4H9z"/>',x_artery:'<path d="M17.5 12a5.5 5.5 0 0 0-5.5-5.5c1.6 1.4 2.3 3.3 2.3 5 0 .3 1.2.5 3.2.5z"/>',x_derm:'<circle cx="10" cy="10" r="6.5"/>',x_preg:'<path d="M12.5 7.5c1.3 1.6 1.4 3 1 4.3 2.8.6 4.5 2.4 4.3 4.6-.2 2-2 3.2-4.3 3.4l-2.6-3.6c.5-.8.5-1.8 0-2.7-1-1.7-.9-4.2.6-6.2z"/>'});
const IC_CAT={hospital:'build',clinica:'steth',medico:'user',laboratorio:'flask',imagem:'scan',online:'video'};
const LOGO=(s,c1,c2)=>{const id='lg'+Math.random().toString(36).slice(2,7);return `<svg width="${s}" height="${s}" viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="${id}a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F3D27A"/><stop offset="1" stop-color="#C9A227"/></linearGradient><linearGradient id="${id}b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c2||'#0ABAB5'}"/><stop offset="1" stop-color="${c1||'#0B6E6B'}"/></linearGradient></defs><path d="M32 56C22 48 10 32 12 12c12 2 22 12 22 26" fill="url(#${id}a)"/><path d="M32 56c10-8 22-24 20-44-12 2-22 12-22 26" fill="url(#${id}b)"/><circle cx="32" cy="24" r="6" fill="#fff" stroke="#0E4D45" stroke-width="1.5"/></svg>`};
const PINSVG=c=>`<svg width="30" height="38" viewBox="0 0 30 38" aria-hidden="true"><path d="M15 37s13-12.3 13-22A13 13 0 0 0 2 15c0 9.7 13 22 13 22z" fill="${c}" stroke="#fff" stroke-width="2.5"/><circle cx="15" cy="15" r="5" fill="#fff"/></svg>`;
const STAR=(f,s)=>`<svg width="${s||18}" height="${s||18}" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="sg${Math.round(f*100)}"><stop offset="${f*100}%" stop-color="#F4B400"/><stop offset="${f*100}%" stop-color="#E3E8E8"/></linearGradient></defs><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" fill="url(#sg${Math.round(f*100)})"/></svg>`;
const estrelas=(v,s)=>`<span class="stars" aria-hidden="true">${[1,2,3,4,5].map(i=>STAR(Math.max(0,Math.min(1,v-i+1)),s)).join('')}</span>`;

/* ============ FOTOS (site oficial → Mapillary → Wikimedia Commons → miniatura do mapa) ============ */
const FOTOS=LS.get('fotos3',{});
function fonteFoto(p,u){if(p.fotoCred&&u===p.foto)return p.fotoCred;if(/wikimedia/.test(u))return'Wikimedia Commons';if(p.fotoRede)return'Imagem da rede';return'Site oficial'}
function fotosDe(p){const a=[];if(p.foto)a.push({u:p.foto,src:fonteFoto(p,p.foto),link:p.site||p.f});(p.fotos2||[]).forEach(u=>a.push({u,src:fonteFoto(p,u),link:p.site||p.f}));(FOTOS[p.id]||[]).forEach(x=>a.push(x));return a}
const FQ=[];let FQrun=0;
function pedirFotos(p){if(!p||isOnline(p)||p.la==null||FOTOS[p.id]||p._fq||p.semFotoWeb)return;p._fq=1;FQ.push(p);bombaFQ()}
function bombaFQ(){while(FQrun<2&&FQ.length){const p=FQ.shift();FQrun++;buscaFotos(p).catch(()=>{}).then(()=>{FQrun--;bombaFQ()})}}
async function buscaFotos(p){const out=[];let ok=false;if(typeof fetch!=='function')return;
 if(CFG.mapillary){for(const d of [.0005,.0013]){if(out.length)break;try{const r=await fetch(`https://graph.mapillary.com/images?access_token=${enc(CFG.mapillary)}&fields=id,thumb_1024_url,captured_at,geometry&bbox=${p.lo-d},${p.la-d},${p.lo+d},${p.la+d}&limit=6`);if(r.ok){ok=true;const j=await r.json();(j.data||[]).filter(x=>x.thumb_1024_url).sort((a,b)=>{const g=x=>x.geometry&&x.geometry.coordinates?km(p,{la:x.geometry.coordinates[1],lo:x.geometry.coordinates[0]}):1;return g(a)-g(b)}).slice(0,3).forEach(x=>out.push({u:x.thumb_1024_url,src:'Mapillary',link:'https://www.mapillary.com/app/?pKey='+x.id,rua:1}))}}catch(e){}}}
 try{const r=await fetch(`https://commons.wikimedia.org/w/api.php?action=query&generator=geosearch&ggscoord=${p.la}%7C${p.lo}&ggsradius=120&ggslimit=10&ggsnamespace=6&prop=imageinfo&iiprop=url&iiurlwidth=900&format=json&origin=*`);if(r.ok){ok=true;const j=await r.json();const pg=j.query&&j.query.pages?Object.values(j.query.pages):[];pg.filter(x=>/\.(jpe?g|png|webp)$/i.test(x.title)&&!/map|mapa|logo|bandeira|flag/i.test(x.title)&&x.imageinfo&&x.imageinfo[0]).sort((a,b)=>(a.index||0)-(b.index||0)).slice(0,3).forEach(x=>out.push({u:x.imageinfo[0].thumburl||x.imageinfo[0].url,src:'Wikimedia Commons',link:x.imageinfo[0].descriptionurl}))}}catch(e){}
 if(ok){FOTOS[p.id]=out;LS.set('fotos3',FOTOS)}else p._fq=0;
 if(out.length)atualizaCapas(p)}
function atualizaCapas(p){document.querySelectorAll(`[data-cov="${p.id}"]`).forEach(el=>{el.outerHTML=cover(p,el.dataset.h)});if(S.view==='local'&&S.sel===p.id){const g=$('gal');if(g){g.innerHTML=galeria(p);ligaGaleria()}}observar()}
let IO=null;
function observar(){if(typeof IntersectionObserver==='undefined')return;if(!IO)IO=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){IO.unobserve(e.target);const p=byId(+e.target.dataset.cov);if(p&&!p.foto)pedirFotos(p)}}),{rootMargin:'250px'});document.querySelectorAll('[data-cov]').forEach(el=>IO.observe(el))}
/* miniatura de mapa (OpenStreetMap/CARTO) centrada no endereço */
function tileXY(la,lo,z){const n=2**z;const r=la*Math.PI/180;return[(lo+180)/360*n,(1-Math.log(Math.tan(r)+1/Math.cos(r))/Math.PI)/2*n]}
function mapThumb(p,hx,hy){if(p.la==null)return`<span style="position:absolute;inset:0;background:linear-gradient(135deg,${CATS[p.c].cor},#0B6E6B);display:flex;align-items:center;justify-content:center">${I[IC_CAT[p.c]]('#fff',54,1.6)}</span>`;
 const z=16,[x,y]=tileXY(p.la,p.lo,z),px=x*256,py=y*256;let h='';
 for(let tx=Math.floor((px-hx)/256);tx<=Math.floor((px+hx)/256);tx++)for(let ty=Math.floor((py-hy)/256);ty<=Math.floor((py+hy)/256);ty++)h+=`<img src="https://${'abcd'[(tx+ty)&3]}.basemaps.cartocdn.com/rastertiles/voyager/${z}/${tx}/${ty}.png" style="left:${Math.round(tx*256-px)}px;top:${Math.round(ty*256-py)}px" alt="" loading="lazy">`;
 return `<span class="tiles" aria-hidden="true">${h}</span><span class="pin">${PINSVG(CATS[p.c].cor)}</span>`}
function coverBase(p,h){h=h||'8.5rem';const f=fotosDe(p)[0];const c=CATS[p.c];
 return `<span class="cover" data-cov="${p.id}" data-h="${h}" style="height:${h}">${mapThumb(p,340,150)}${f?`<img class="ph" src="${esc(f.u)}" alt="Foto: ${esc(p.n)}" loading="lazy" referrerpolicy="no-referrer" decoding="async" onerror="var s=this.parentNode.querySelector('.src');if(s)s.textContent='Ilustração Vitta';this.remove()">`:''}<span class="bdg">${esc(c.um.toUpperCase())}</span><span class="src">${f?esc(f.src):p.la!=null?'Mapa · OSM/CARTO':'Online'}</span></span>`}
function galeriaBase(p){const fs=fotosDe(p);const sl=fs.map(f=>`<span class="cover" style="height:15rem"><span style="position:absolute;inset:0;background:#DCE8E6"></span><img class="ph" src="${esc(f.u)}" alt="Foto ${f.rua?'de rua perto':'de'} ${esc(p.n)}" referrerpolicy="no-referrer" onerror="this.parentNode.remove()"><a class="src" href="${esc(f.link||'#')}" target="_blank" rel="noopener">${f.rua?'Foto de rua · ':''}${esc(f.src)}</a></span>`);
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
const gidDe=pt=>pt&&pt.k==='unidade'&&byId(pt.id)&&byId(pt.id).gid;
const gmaps=(o,d,m)=>`https://www.google.com/maps/dir/?api=1&origin=${enc(qtxt(o))}&destination=${enc(qtxt(d))}${gidDe(d)?'&destination_place_id='+enc(gidDe(d)):''}${gidDe(o)?'&origin_place_id='+enc(gidDe(o)):''}&travelmode=${m}`;
const gplace=p=>p.gid?`https://www.google.com/maps/search/?api=1&query=${enc(p.n)}&query_place_id=${enc(p.gid)}`:`https://www.google.com/maps/search/?api=1&query=${enc(p.n+', '+limpaEnd(p.e))}`;
const waze=d=>d.la!=null?`https://waze.com/ul?ll=${d.la},${d.lo}&navigate=yes`:`https://waze.com/ul?q=${enc(qtxt(d))}&navigate=yes`;
const uber=d=>`https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[formatted_address]=${enc(qtxt(d))}`+(d.la!=null?`&dropoff[latitude]=${d.la}&dropoff[longitude]=${d.lo}`:'');
const ptFromUnit=p=>({k:'unidade',id:p.id,n:p.n,sub:p.e,e:p.n+', '+limpaEnd(p.e),la:p.la,lo:p.lo});

/* ============ MAPAS (Leaflet + OpenStreetMap/CARTO) ============ */
let MAPAS=[];
function matarMapas(){MAPAS.forEach(m=>{try{m.remove()}catch(e){}});MAPAS=[]}
function novoMapa(id){const el=$(id);if(!el)return null;if(typeof window.L==='undefined'||!window.L.map){el.dataset.mapwait='1';el.innerHTML='<div class="empty">Carregando mapa…</div>';return null}
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
 if(o.tipo==='exame')return `Olá, ${p.n}! Encontrei vocês pelo app VittaOne e gostaria de agendar o exame: ${o.item}.\n\nPaciente: ${quem}\nPreferência: ${per}, ${o.quando}\nPagamento: ${pag}\n\nPreciso de algum preparo? Quais horários vocês têm disponíveis?`;
 return `Olá, ${p.n}! Encontrei vocês pelo app VittaOne e gostaria de agendar uma consulta${o.item?' de '+o.item:''}${o.online?' online (por vídeo)':''}.\n\nPaciente: ${quem}\nPreferência: ${per}, ${o.quando}\nPagamento: ${pag}\n\nQuais horários vocês têm disponíveis?`}
const waUrl=(p,t)=>(MOBILE?'whatsapp://send?phone='+p.wa+'&text=':'https://wa.me/'+p.wa+'?text=')+enc(t);
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
 else if(p.t.length)h+=`<button class="btn" data-act="ligar" data-id="${p.id}">${I.phone('#0B6E6B',20)} Ligar</button>`;
 if(isOnline(p))h+=`<a class="btn pri" href="${esc(p.url)}" target="_blank" rel="noopener">${I.video('#fff',20)} Acessar</a>`;
 else h+=`<button class="btn pri" data-act="rota" data-id="${p.id}">${I.route('#fff',20)} Rota</button>`;
 return h}
const heartBtn=p=>{const on=S.favs.includes(p.id);return `<button class="round" data-act="fav" data-id="${p.id}" aria-label="${on?'Remover dos':'Adicionar aos'} favoritos" aria-pressed="${on}"><svg width="22" height="22" viewBox="0 0 24 24" fill="${on?'#C62E4A':'none'}" stroke="${on?'#C62E4A':'#0B6E6B'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P.heart}</svg></button>`};
function card(p){const d=dist(p);
 return `<article class="pcard"><button class="open" data-act="abrir" data-id="${p.id}" aria-label="Ver detalhes de ${esc(p.n)}">${cover(p,'8rem')}
 <span class="bd"><span class="meta">${stTag(p)}${p.g?starTag(p):''}${p.sus?'<span class="tag blue">SUS</span>':''}<span class="tag gray">${p.pr?'A partir de R$ '+p.pr:p.sus?'Gratuito (SUS)':'Preço sob consulta'}</span>${alTags(p)}</span>
 <span class="nm">${esc(p.n)}</span>
 <span class="meta">${isOnline(p)?I.video('#17624A',16)+esc(p.sp||'Teleconsulta por vídeo'):I.pin('#0B6E6B',16)+`<span>${esc(p.b)} · <b style="color:var(--ink)">${fkm(d)}</b>${p.sp?' · '+esc(p.sp):''}</span>`}</span></span></button>
 <div class="acts">${contatoBtns(p)}</div></article>`}
function mini(p){const d=dist(p);return `<button class="mini" data-act="abrir" data-id="${p.id}">${cover(p,'7.2rem').replace('class="cover"','class="cover" style="border-radius:0"')}<span class="bd"><span class="meta">${stTag(p)}</span><b>${esc(p.n)}</b><span class="sm mut">${esc(p.b)} · ${fkm(d)}${p.g?' · ★ '+String(p.g.v).replace('.',','):''}</span></span></button>`}
function origemChip(light){const o=S.origin,gps=o.k==='gps';const linha2=gps?(o.sub&&o.sub!=='GPS do aparelho'?o.sub:'Localização atual pelo GPS'):(o.sub||'');
 return `<button class="ref${light?' light':''}" data-act="picker" data-alvo="origin" aria-label="Endereço de Referência: ${esc(o.n)}${linha2?', '+esc(linha2):''}. Toque para alterar">
 <span class="ref-ic">${gps?I.gps('#fff',22):I.pin('#fff',22)}</span>
 <span class="ref-tx"><span class="ref-lb">Endereço de Referência:</span><b class="ell">${esc(gps?'Você está aqui':o.n)}</b>${linha2?`<span class="ell ref-sub">${esc(linha2)}</span>`:''}</span>
 <span class="ref-bt">Alterar</span></button>${S.gpsMsg?`<span class="ref-msg">${esc(S.gpsMsg)}</span>`:''}`}
function buscaForm(id,ph,val,live){return `<form class="search" data-form="busca" data-alvo="${id}" role="search">${I.search('#0B6E6B',20)}<label class="sr" for="${id}">Buscar</label><input id="${id}" name="q" type="search" enterkeyhint="search" placeholder="${esc(ph)}" value="${esc(val)}" ${live?`data-live="${live}"`:''} autocomplete="off"><button type="button" class="micbtn" data-act="voz" data-alvo="${id}" aria-label="Buscar por voz">${I.mic('#fff',20)}</button></form>`}
function phead(t,sub,voltar){return `<div class="phead">${voltar!==false?`<button class="back" data-act="voltar" aria-label="Voltar">${I.back('#0F2E2D',20)}</button>`:''}<div style="flex:1;min-width:0"><h1>${esc(t)}</h1>${sub?`<p>${esc(sub)}</p>`:''}</div></div>`}
function cubo(o){return `<button class="cube ${o.cls||'plain'}" data-act="${o.act}" data-v="${o.v}"${o.k?` data-k="${o.k}"`:''}><span class="ic">${o.ic}</span><span class="tx"><span class="t">${o.t}</span><span class="d">${o.d}</span>${o.n!=null?`<span class="tag ${o.cls==='blue'?'blue':o.cls==='pink'?'off':''} n" style="${o.cls==='pink'?'background:#fff;color:#0A8F8A':o.cls==='blue'?'background:#fff':''}">${o.n}</span>`:''}</span>${I.chev(o.cor||'#0B6E6B',22)}<span class="bgic">${o.bg||''}</span></button>`}
function cubosTipo(duo){const a=cubo({cls:'pink',act:'tipo',v:'consulta',ic:I.steth('#0A8F8A',34),t:'Consultas',d:'Consultório na Av. Paulista, com agendamento pelo WhatsApp',cor:'#0A8F8A',bg:I.steth('#0A8F8A',150,1.4)}),
 b=cubo({cls:'blue',act:'tipo',v:'exame',ic:I.flask('#17624A',34),t:'Exames',d:'Ressonância magnética e tomografia',cor:'#17624A',bg:I.flask('#17624A',150,1.4)});
 return duo?`<div class="duo">${a}${b}</div>`:`<div class="cubes">${a.replace('class="cube pink"','class="cube pink hero2"')}${b.replace('class="cube blue"','class="cube blue hero2"')}</div>`}

/* ============ TELAS ============ */
let BAR='';
function vInicio(){const n=primeiroNome();
 return `<section class="hero"><h1 class="hello">${n?'Olá, '+esc(n)+'!':'Olá!'} <small>O que você precisa hoje?</small></h1>${origemChip()}</section>
 <section class="sec">${cubosTipo(true)}</section>
 <section class="sec"><h2 class="h2">Nossos locais</h2><div class="grid">${LOC.map(card).join('')}</div></section>
 <section class="sec"><a class="info red" href="tel:192" style="align-items:center">${I.ambul('#B3261E',28)}<span style="flex:1"><b>Emergência? Ligue 192 (SAMU)</b><br>Bombeiros: 193 · Não espere agendar.</span>${I.phone('#B3261E',22)}</a></section>`}
function vNovo(){return phead('O que você quer agendar?','Toque em uma opção para seguir',false)+`<section class="sec">${cubosTipo(false)}
 <div class="info">${I.pin('#0A4B44',20)}<span>Endereço de Referência: <b>${esc(S.origin.k==='gps'?'Você está aqui':S.origin.n)}</b>. <button class="lnk" data-act="picker" data-alvo="origin">Trocar</button></span></div></section>`}
function vModo(){const f=S.flow;const c=f.tipo==='consulta';const cor=c?'#0A8F8A':'#17624A',cls=c?'pink':'blue';
 const n=k=>k==='presencial'?LOC.filter(p=>!isOnline(p)&&p.esp.length).length:k==='online'?LOC.filter(p=>p.on.length).length:k==='lab'?LOC.filter(p=>p.lab).length:LOC.filter(p=>p.img.length).length;
 const op=c?[['presencial','Presencial','Clínica, hospital ou consultório perto de você. Veja distância, rota e horário.','build'],['online','Online','Teleconsulta e médicos por vídeo. Atendimento sem sair de casa.','video']]:[['lab','Laboratoriais','Sangue, urina, glicemia, colesterol, tireoide e outras análises.','tube'],['img','De imagem','Raio-X, ultrassom, tomografia, ressonância, mamografia e mais.','scan']];
 return phead(c?'Consultas':'Exames',c?'Como prefere ser atendido?':'Que tipo de exame?')+`<section class="sec"><div class="cubes">${op.map(([k,t,d,ic])=>cubo({cls,act:'modo',v:k,ic:I[ic](cor,34),t,d,n:n(k)+(n(k)===1?' local':' locais'),cor,bg:I[ic](cor,150,1.4)}).replace('class="cube','class="cube hero2')).join('')}</div>
 <div class="card adv" hidden><h2 class="h3">Como funciona</h2>${[['1','Escolha '+(c?'a especialidade':'o exame')],['2','Compare distância, horário e nota'],['3','Agende pelo WhatsApp ou ligue']].map(([a,b])=>`<div class="row"><span class="lic" style="width:2rem;height:2rem;border-radius:50%;font-weight:800;color:${cor};background:${c?'#E0F5F4':'#DCF3E9'}">${a}</span><span class="p">${b}</span></div>`).join('')}</div></section>`}
const ORD_ESP=['clinica','cardio','gineco','pedi','dermato','orto','oftalmo','gastro','endo','neuro','otorrino','psiq','uro'];
function itensLista(){const f=S.flow;
 if(f.modo==='lab')return LABX.map((x,i)=>({k:'lab'+i,t:x[0],s:x[1],p:x[2],ic:LABIC[i]||'tube',n:LOC.filter(p=>p.lab).length}));
 if(f.modo==='img')return Object.keys(IMGX).map(k=>({k,t:IMGX[k][0],s:IMGX[k][1],p:IMGX[k][2],ic:IC_IMG[k]||'scan',n:LOC.filter(p=>p.img.includes(k)).length}));
 return ORD_ESP.filter(k=>ESP[k]).concat(Object.keys(ESP).filter(k=>!ORD_ESP.includes(k))).map(k=>({k,t:ESP[k][0],s:ESP[k][1],ic:IC_ESP[k]||'steth',n:LOC.filter(p=>f.modo==='online'?p.on.includes(k):(!isOnline(p)&&p.esp.includes(k))).length}))}
function vItens(){const f=S.flow;const tit=f.modo==='presencial'?'Consulta presencial':f.modo==='online'?'Consulta online':f.modo==='lab'?'Exames laboratoriais':'Exames de imagem';
 return phead(tit,f.tipo==='consulta'?'Escolha a especialidade':'Escolha o exame')+`<section class="sec">${buscaForm('qi',f.tipo==='consulta'?'Especialidade ou sintoma':'Nome do exame',S.qi,'qi')}<div id="itens" class="cubes"></div></section>`}
function renderItens(){const box=$('itens');if(!box)return;const t=norm(S.qi);const f=S.flow;const c=f.tipo==='consulta',cor=c?'#0A8F8A':'#17624A',bg=c?'#E0F5F4':'#DCF3E9';
 const r=itensLista().filter(x=>!t||norm(x.t+' '+x.s).includes(t));
 box.innerHTML=r.length?r.map((x,i)=>`<button class="tile wide" data-act="item" data-k="${x.k}"><span class="lic" style="background:${bg}">${I[x.ic](cor,22)}</span><span class="col" style="gap:.25rem;flex:1;min-width:0"><b>${esc(x.t)}</b><span class="sm mut">${esc(x.s)}</span><span class="sm" style="font-weight:800;color:${cor}">${x.n} ${x.n===1?'local':'locais'}</span></span></button>`).join(''):'<div class="empty" style="grid-column:1/-1">Nada encontrado. Tente outra palavra.</div>'}
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
function controles(online){const nf=['fOpen','f24','fWa','fConv','fSus','fMetro','fAcess','fIncl','fKids','fPet'].filter(k=>S[k]).length;return `<div class="seg" role="group" aria-label="Ordenar">${[['perto',online?'Recomendados':'Mais perto'],['preco','Menor preço'],['nota','Melhor nota']].map(([k,t])=>`<button data-act="sort" data-k="${k}" aria-pressed="${S.sort===k}">${t}</button>`).join('')}</div>
 <div class="row"><button class="btn" data-act="showF" aria-expanded="${!!S.showF}">${SVG('<path d="M4 6h16M7 12h10M10 18h4"/>','#0B6E6B',20)} Filtros${nf?' ('+nf+')':''}</button>${online?'':`<button class="btn" data-act="showMap" aria-expanded="${!!S.showMap}">${I.map('#0B6E6B',20)} ${S.showMap?'Esconder mapa':'Ver no mapa'}</button>`}</div>
 ${S.showF?`<div class="chips" role="group" aria-label="Filtros">`:'<div hidden>'}${[['fOpen','Aberto agora'],['f24','24 horas'],['fWa','Com WhatsApp'],['fConv','Aceita convênio'],['fSus','SUS'],['fMetro','Ao lado do metrô'],['fAcess','Acessível'],['fIncl','Inclusivo'],['fKids','Espaço kids'],['fPet','Aceita pet']].map(([k,t])=>`<button class="chip" data-act="tg" data-k="${k}" aria-pressed="${S[k]}">${t}</button>`).join('')}</div>`}
function notaOrdem(){if(S.sort==='preco')return'Só alguns locais publicam preço; os demais aparecem depois, por distância.';if(S.sort==='nota')return'Pela nota do Google Maps (pesquisada em '+CFG.dataRef+') onde encontramos; os demais aparecem depois, por distância.';return''}
function vResultados(){const f=S.flow;const online=f.modo==='online';const r=resultadosFlow();
 const sub=(f.modo==='presencial'?'Presencial':f.modo==='online'?'Online':f.modo==='lab'?'Laboratorial':'Imagem')+' · '+r.length+' '+(r.length===1?'opção':'opções');
 return phead(itemNome(),sub)+`<section class="sec">${online?'':origemBloco()}${controles(online)}
 ${notaOrdem()?`<p class="sm mut" style="margin:0">${esc(notaOrdem())}</p>`:''}
 ${f.modo==='img'?`<button class="btn pri" data-act="orc" style="flex:none">${I.doc('#fff',20)} Pedir 3 orçamentos com foto do pedido</button>`:''}
 ${online?`<div class="info">${I.video('#0A4B44',20)}<span>Consultas por vídeo: toque em <b>Acessar</b> para abrir o serviço ou o perfil do médico.</span></div>`:(S.showMap?`<div class="mapwrap"><div id="mapRes" class="leaf" style="height:18rem"></div></div>`:'')}
 ${r.length?`<div class="grid">${r.slice(0,S.lim||20).map(card).join('')}</div>${r.length>(S.lim||20)?`<button class="btn" style="width:100%;margin-top:.6rem" data-act="mais">Mostrar mais (${r.length-(S.lim||20)} restantes)</button>`:''}`:'<div class="empty">Nenhum local com esses filtros. Tire um filtro para ver mais.</div>'}</section>`}
function vBuscar(){return phead('Buscar','Digite ou fale o que precisa',false)+`<section class="sec">${buscaForm('qb','Médico, exame, local ou bairro',S.q,'q')}${origemChip(true)}
 <div class="chips" role="group" aria-label="Categoria">${[['todos','Todos']].concat(Object.keys(CATS).map(c=>[c,CATS[c].nome])).map(([k,t])=>`<button class="chip" data-act="cat" data-cat="${k}" aria-pressed="${S.cat===k}">${t}</button>`).join('')}</div>
 ${controles(false)}
 <div id="resumo"></div>${S.showMap?'<div class="mapwrap"><div id="mapBusca" class="leaf" style="height:18rem"></div></div>':''}<div id="res" class="grid"></div></section>`}
function filtrarBusca(){const t=norm(S.q);let r=LOC.filter(p=>{if(S.cat!=='todos'&&p.c!==S.cat)return false;if(t){const hay=p._hay||(p._hay=norm([p.n,p.b,p.e,p.sp,p.s.join(' '),CATS[p.c].nome].join(' ')));if(!t.split(/\s+/).every(w=>hay.includes(w)))return false}return true});return ordenar(filtrosAplic(r))}
function renderRes(){const box=$('res');if(!box)return;const r=filtrarBusca();
 $('resumo').innerHTML=`<p class="sm mut" style="margin:0"><b style="color:var(--ink)">${r.length} ${r.length===1?'local':'locais'}</b>${notaOrdem()?' · '+esc(notaOrdem()):''}</p>`;
 box.innerHTML=r.length?r.slice(0,20).map(card).join('')+(r.length>20?`<p class="sm mut">Mostrando 20 de ${r.length}. Refine a busca.</p>`:''):'<div class="empty">Nada encontrado. Tente outra palavra ou tire um filtro.</div>';
 if(S.showMap&&$('mapBusca')){matarMapas();mapaResultados('mapBusca',r.filter(p=>!isOnline(p)))}observar()}

/* ---- descrição completa ---- */
function descricao(p){const c=CATS[p.c].um.toLowerCase();const on=isOnline(p);const parts=[];
 parts.push(p.d.replace(/\.?$/,'.'));
 if(on)parts.push('O atendimento é por vídeo: você é atendido pelo celular ou computador, sem sair de casa.');
 else parts.push(`Fica no bairro ${p.b}, a ${fkm(dist(p))} de ${S.origin.n}.`);
 const esp=p.esp.map(k=>ESP[k][0]),img=p.img.map(k=>IMGX[k][0]);
 if(esp.length)parts.push((esp.length>6?'Oferece mais de '+(esp.length-1)+' especialidades, como ':'Especialidades: ')+esp.slice(0,6).join(', ')+'.');
 if(img.length)parts.push('Exames de imagem: '+img.join(', ')+'.');
 if(p.lab)parts.push('Faz exames laboratoriais (sangue, urina e outros).');
 if(p.h==='24h')parts.push('Funciona 24 horas, todos os dias.');
 parts.push(p.sus?'Atendimento gratuito pelo SUS.':'Forma de atendimento: '+p.cv.toLowerCase()+'.');
 if(p.wa)parts.push('Dá para agendar pelo WhatsApp oficial.');
 return parts.join(' ')}
/* ---- página do local ---- */
const REDES={ig:['Instagram','ig','<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><path d="M17.3 6.7v.01"/>'],fb:['Facebook','fb','<path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8.5a.5.5 0 0 1 .5-.5z"/>'],li:['LinkedIn','li','<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 10.5v6M8 7.5v.01M12 16.5v-3.5a2 2 0 0 1 4 0v3.5M12 10.5v6"/>'],yt:['YouTube','yt','<rect x="2.5" y="6" width="19" height="12" rx="4"/><path d="M10 9.5v5l4.5-2.5z"/>']};
const handle=u=>{try{const x=new URL(u).pathname.replace(/^\/|\/$/g,'').replace(/^(company|user|channel)\//,'');return x?(/^@/.test(x)?x:'@'+x):''}catch(e){return''}};
function blocoRedes(p){const ks=Object.keys(p.soc||{}).filter(k=>REDES[k]&&p.soc[k]);let h='';
 if(ks.length===1){const k=ks[0],R=REDES[k];h+=`<a class="soc hero ${R[1]}" href="${esc(p.soc[k])}" target="_blank" rel="noopener"><span class="si" style="background:rgba(255,255,255,.2)">${SVG(R[2],'#fff',26)}</span><span class="col" style="flex:1;min-width:0"><b>${R[0]} oficial</b><span class="sm ell" style="opacity:.9">${esc(handle(p.soc[k]))}</span></span>${I.chev('#fff',20)}</a>`}
 else ks.forEach(k=>{const R=REDES[k];h+=`<a class="soc" href="${esc(p.soc[k])}" target="_blank" rel="noopener"><span class="si ${R[1]}">${SVG(R[2],'#fff',22)}</span><span class="col" style="flex:1;min-width:0"><b>${R[0]}</b><span class="sm mut ell">${esc(handle(p.soc[k]))}</span></span>${I.chev('#4E6664',18)}</a>`});
 if(p.site)h+=`<a class="soc" href="${esc(p.site)}" target="_blank" rel="noopener"><span class="si site">${SVG('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>','#fff',22)}</span><span class="col" style="flex:1;min-width:0"><b>Site oficial</b><span class="sm mut ell">${esc(p.site.replace(/^https?:\/\/(www\.)?/,'').replace(/\/$/,''))}</span></span>${I.chev('#4E6664',18)}</a>`;
 if(/doctoralia/.test(p.f||''))h+=`<a class="soc" href="${esc(p.f)}" target="_blank" rel="noopener"><span class="si dc">${I.steth('#fff',22)}</span><span class="col" style="flex:1"><b>Doctoralia</b><span class="sm mut">Perfil, preços e agenda</span></span>${I.chev('#4E6664',18)}</a>`;
 if(false)h+=`<a class="soc" href="${gplace(p)}" target="_blank" rel="noopener"><span class="si gm">${PINSVG('#EA4335').replace('width="30" height="38"','width="20" height="26"')}</span><span class="col" style="flex:1"><b>Google Maps</b><span class="sm mut">Fotos, avaliações e horários</span></span>${I.chev('#4E6664',18)}</a>`;
 return `<div class="card"><div class="row between"><h2 class="h3">Redes sociais e links</h2>${ks.length?'':'<span class="tag gray">Sem rede oficial</span>'}</div>${ks.length?'':'<p class="sm mut" style="margin:-.3rem 0 0">Não encontramos rede social oficial deste local. Veja os links abaixo.</p>'}<div class="col" style="gap:.5rem">${h}</div></div>`}
function blocoAvaliacao(p){const g=p.g;
 return `<div class="card"><h2 class="h3">Avaliação ⭐</h2>${g?`<div class="rate"><span class="big">${String(g.v).replace('.',',')}</span><span class="col" style="gap:.2rem">${estrelas(g.v,20)}<span class="sm mut">${g.n?g.n.toLocaleString('pt-BR')+' avaliações · ':''}Google Maps · consultado em ${g.d||CFG.dataRef}${g.f?` (<a class="lnk" href="${esc(g.f)}" target="_blank" rel="noopener">fonte</a>)`:''}</span></span></div>`:`<p class="p mut">Ainda não registramos a nota deste local. Veja a nota atualizada no Google Maps.</p>`}
 <a class="btn teal" href="${gplace(p)}" target="_blank" rel="noopener" style="flex:none">★ Ver e avaliar no Google Maps</a>
 </div>`}
function vLocal(){const p=byId(S.sel);if(!p)return vInicio();const d=dist(p),c=CATS[p.c],st=status(p),on=isOnline(p);
 BAR=`<div class="bar">${p.wa?`<button class="btn wa" data-act="wa" data-id="${p.id}" style="font-size:1rem">${ICW} ${p.id===9002?'Marcar consulta':'Agendar exame'}</button>`:on?`<a class="btn pri" href="${esc(p.url)}" target="_blank" rel="noopener">${I.video('#fff',20)} Agendar no serviço</a>`:p.t.length?`<button class="btn pri" data-act="ligar" data-id="${p.id}">${I.phone('#fff',20)} Ligar para agendar</button>`:`<button class="btn pri" data-act="rota" data-id="${p.id}">Ver como chegar</button>`}</div>`;
 return `<div style="position:relative" id="gal">${galeria(p)}</div>
 <div style="position:relative;margin-top:-1.6rem;border-radius:1.6rem 1.6rem 0 0;background:var(--bg);z-index:2">
 <div class="row" style="position:absolute;top:-4.6rem;left:1rem;right:1rem;justify-content:space-between;pointer-events:none"><button class="back" data-act="voltar" aria-label="Voltar" style="pointer-events:auto">${I.back('#0F2E2D',20)}</button><span class="row" style="pointer-events:auto"><button class="back" data-act="compart" data-id="${p.id}" aria-label="Compartilhar">${I.share('#0F2E2D',20)}</button>${heartBtn(p).replace('class="round"','class="back"')}</span></div>
 <section class="sec" style="padding-top:1.2rem"><div class="col" style="gap:.5rem"><div class="meta"><span class="tag" style="background:${c.fundo};color:${c.cor}">${I[IC_CAT[p.c]](c.cor,14)} ${esc(c.um)}</span>${stTag(p)}${starTag(p)}${p.sus?'<span class="tag blue">SUS – gratuito</span>':''}</div>
 <h1 style="margin:0;font-size:1.6rem;line-height:1.2;font-weight:800">${esc(p.n)}</h1>${p.sp?`<span style="font-size:.95rem;font-weight:700">${esc(p.sp)}${p.crm?` · <span class="mut" style="font-weight:600">${esc(p.crm)}</span>`:''}</span>`:''}
 ${on?'':`<span class="meta">${I.pin('#0B6E6B',16)}${esc(p.b)} · <b style="color:var(--ink)">${fkm(d)}</b> de ${esc(S.origin.n)}</span>`}</div>
 ${p.al?`<div class="info warn">${I.alert('#5E3B08',20)}<span>${esc(p.al)}</span></div>`:''}
 <div class="acts">${p.t.length&&p.wa?`<button class="btn" data-act="ligar" data-id="${p.id}">${I.phone('#0B6E6B',20)} Ligar</button>`:''}${on?`<a class="btn pri" href="${esc(p.url)}" target="_blank" rel="noopener">${I.video('#fff',20)} Acessar</a>`:`<button class="btn pri" data-act="rota" data-id="${p.id}">${I.route('#fff',20)} Como chegar</button>`}${S.a11y.ler?`<button class="round" data-act="ler" aria-label="Ouvir informações">${I.speaker('#0B6E6B',22)}</button>`:''}</div>
 ${seloCRM(p)}
 <div class="card"><h2 class="h3">${I.info('#0B6E6B',20)} Sobre</h2><p class="p">${esc(descricao(p))}</p></div>
 ${blocoAvaliacao(p)}
 ${blocoRedes(p)}
 <div class="card"><h2 class="h3">${I.clock('#0B6E6B',20)} Horário</h2><p class="p">${esc(p.hr)}</p>${st.k==='?'&&!on?'<span class="sm mut">Horário não confirmado. Ligue antes de ir.</span>':''}</div>
 <div class="card"><h2 class="h3">${on?I.video('#0B6E6B',20)+' Como funciona':I.pin('#0B6E6B',20)+' Endereço'}</h2><p class="p">${esc(p.e)}${p.comp?`<br><span class="sm mut">${esc(p.comp)}</span>`:''}</p>
 ${on?'':`<div class="mapwrap" style="height:13rem"><iframe title="Mapa do Google de ${esc(p.n)}" src="https://maps.google.com/maps?q=${enc(p.n+', '+limpaEnd(p.e))}&z=17&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade" style="border:0;width:100%;height:100%"></iframe></div>
 <button class="btn pri" data-act="rota" data-id="${p.id}" style="flex:none">${I.route('#fff',20)} Ver distância e transporte</button>`}</div>
 <details class="faq"><summary>Mais informações</summary>
 <div class="meta" style="margin-bottom:1rem">${p.s.map(x=>`<span class="tag gray">${esc(x)}</span>`).join('')}</div>
 ${p.t.length?p.t.map(t=>`<div class="kv"><span class="mut">Telefone</span><a href="${telHref(t)}" style="font-weight:800;text-align:right">${esc(t)}</a></div>`).join(''):''}
 <div class="kv"><span class="mut">WhatsApp</span><b style="text-align:right">${p.wa?esc(p.wn):'Não divulgado'}</b></div>
 <div class="kv"><span class="mut">Atendimento</span><b style="text-align:right">${esc(p.cv)}</b></div><div class="kv"><span class="mut">Preço</span><b style="text-align:right">${p.prt?esc(p.prt):p.sus?'Gratuito (SUS)':'Sob consulta'}</b></div>
 <p class="sm">Fonte: <a href="${esc(p.f)}" target="_blank" rel="noopener" class="lnk">${esc(p.f.replace(/^https?:\/\/(www\.)?/,'').split('/')[0])}</a> · dados de ${CFG.dataRef}. Confirme por telefone antes de ir.</p></details>
</section></div>`}

/* ---- rota ---- */
function vRota(){const o=S.origin,d=S.dest;
 const campo=(alvo,pt,cor,rot)=>`<button class="rt-field" data-act="picker" data-alvo="${alvo}"><span class="dot" style="background:${cor}"></span><span class="col" style="flex:1;min-width:0;text-align:left"><span class="sm mut">${rot}</span><b class="ell" style="font-size:.95rem">${pt?esc(pt.k==='gps'?'Você está aqui'+(pt.sub&&pt.sub!=='GPS do aparelho'?' – '+pt.sub:''):pt.n):'Escolha o destino'}</b>${pt&&pt.sub?`<span class="sm mut ell">${esc(pt.sub)}</span>`:''}</span><span class="sm" style="font-weight:800;color:var(--pet)">Alterar</span></button>`;
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
  ${modos.map(([pf,t,ic,gm])=>`<div class="mode ${S.rmode===pf?'sel':''}"><button class="modebtn" data-act="rmode" data-k="${pf}" aria-pressed="${S.rmode===pf}"><span class="lic">${SVG(ic,'#0B6E6B',24)}</span><span class="col" style="flex:1;gap:.1rem;text-align:left"><b style="font-size:.95rem">${t}</b><span class="sm mut" id="rs_${pf}">calculando…</span></span><span class="t" id="rt_${pf}">…</span></button><a class="gbtn" href="${gmaps(o,d,gm)}" target="_blank" rel="noopener" aria-label="Abrir ${t} no Google Maps">Google</a></div>`).join('')}
  <div class="mode"><span class="modebtn"><span class="lic">${SVG('<rect x="5" y="3" width="14" height="15" rx="3"/><path d="M5 11h14M8 21l2-3M16 21l-2-3"/>','#0B6E6B',24)}</span><span class="col" style="flex:1;gap:.1rem"><b style="font-size:.95rem">Trem, metrô ou ônibus</b><span class="sm mut">${tp==null?'Perto demais: vale ir a pé':esc(so.e.n)+' → '+esc(sd.e.n)}</span></span><span class="t">${tp==null?'—':'~'+fmin(tp)}</span></span><a class="gbtn" href="${gmaps(o,d,'transit')}" target="_blank" rel="noopener">Google</a></div>
  <div class="card adv"><h2 class="h3">Estações mais próximas</h2>
  <div class="lrow"><span class="dot" style="background:#2563EB"></span><span class="col" style="flex:1"><b style="font-size:.9rem">${esc(so.e.n)}</b><span class="sm mut">${esc(so.e.l)}</span></span><span class="sm" style="font-weight:800">${fkm(so.d)} da partida</span></div>
  <div class="lrow"><span class="dot" style="background:var(--pet)"></span><span class="col" style="flex:1"><b style="font-size:.9rem">${esc(sd.e.n)}</b><span class="sm mut">${esc(sd.e.l)}</span></span><span class="sm" style="font-weight:800">${fkm(sd.d)} do destino</span></div>
  <span class="sm mut">Linhas e ônibus exatos, com horário em tempo real: botão "Google" do transporte público.</span></div>
  ${links(o,d)}
  <p class="sm mut" style="margin:0">A pé, bicicleta e carro: rota real pelas ruas (OpenStreetMap), sem considerar trânsito. Transporte público: estimativa pela estação mais próxima.</p>`}
 const du=d&&d.id&&byId(d.id);
 return phead('Como chegar','Entre e saia dos endereços quando quiser')+`<section class="sec"><div class="col" style="gap:.5rem;position:relative">${campo('origin',o,'#2563EB','Endereço de Referência')}${campo('dest',d,'var(--pet)','Indo para')}
 <button class="round" data-act="trocar" aria-label="Inverter partida e destino" style="position:absolute;right:-.4rem;top:50%;transform:translateY(-50%);width:2.6rem;height:2.6rem">${I.swap('#0B6E6B',20)}</button></div>
 ${du?`<div class="acts">${du.wa?`<button class="btn wa" data-act="wa" data-id="${du.id}">${ICW} WhatsApp</button>`:''}<button class="btn" data-act="abrir" data-id="${du.id}">Ver unidade</button></div>`:''}${corpo}</section>`}
function links(o,d){return `<div class="card"><h2 class="h3">Abrir no app</h2><div class="mapbtns">${btnGmaps(gmaps(o,d,'transit'))}${btnUber(uber(d))}</div></div>`}
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
  window.L.circleMarker([d.la,d.lo],{radius:10,color:'#fff',weight:3,fillColor:'#0B6E6B',fillOpacity:1}).addTo(m).bindTooltip(d.n);
  const r=res[S.rmode];if(r){window.L.polyline(r.geo,{color:'#0B6E6B',weight:5,opacity:.85}).addTo(m);r.geo.forEach(x=>b.push(x))}else window.L.polyline(b,{color:'#0B6E6B',weight:3,dashArray:'6 8'}).addTo(m);
  [estMaisProx(o).e,estMaisProx(d).e].forEach(e=>window.L.circleMarker([e.la,e.lo],{radius:6,color:'#7A4A0E',weight:2,fillColor:'#F2B33D',fillOpacity:1}).addTo(m).bindTooltip(e.n));
  m.fitBounds(b,{padding:[30,30]})}}

/* ---- agenda ---- */
function vAgendaBase(){const h=S.hist;const pend=h.filter(x=>!x.ok).length;
 return phead('Minha agenda',h.length?`${pend} aguardando · ${h.length-pend} confirmados`:'Agendamentos iniciados pelo Vitta',false)+`<section class="sec">${h.length?h.map((x,i)=>{const p=byId(x.id);if(!p)return'';return `<div class="card"><div class="row between"><span class="sm mut">${I.clock('#4E6664',14)} ${esc(x.data)}</span><span class="tag ${x.ok?'':'warn'}">${x.ok?'Confirmado':'Aguardando a clínica'}</span></div>
 <div class="row" style="align-items:flex-start"><span class="lic" style="background:${x.tipo==='exame'?'#DCF3E9':'#E0F5F4'}">${x.tipo==='exame'?I.flask('#17624A',20):I.steth('#0A8F8A',20)}</span><span class="col" style="flex:1;min-width:0"><b style="font-size:1rem">${esc(p.n)}</b><span class="p">${x.tipo==='exame'?'Exame':'Consulta'}${x.item?': '+esc(x.item):''}</span>${x.pac?`<span class="sm mut">Paciente: ${esc(x.pac)}</span>`:''}</span></div>
 <div class="acts"><button class="btn ${x.ok?'':'pri'}" data-act="hok" data-i="${i}">${x.ok?'Voltar para pendente':'A clínica confirmou'}</button><button class="round wa" data-act="wa" data-id="${p.id}" aria-label="Reenviar WhatsApp">${ICW}</button><button class="round" data-act="rota" data-id="${p.id}" aria-label="Como chegar">${I.route('#0B6E6B',20)}</button><button class="round" data-act="hdel" data-i="${i}" aria-label="Apagar" style="border-color:#E8C4C6">${I.x('#B3261E',20)}</button></div></div>`}).join(''):`<div class="empty">${I.cal('#4E6664',36,1.6)}<br>Quando você abrir o WhatsApp de um local pelo Vitta, o pedido aparece aqui para você acompanhar.</div>`}
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
 ${(u.deps||[]).map((x,i)=>`<div class="lrow"><span class="lic">${I.user('#0B6E6B',20)}</span><span class="col" style="flex:1"><b style="font-size:.95rem">${esc(x.nome)}</b><span class="sm mut">${esc(x.par)}</span></span><button class="round" data-act="depdel" data-i="${i}" aria-label="Remover ${esc(x.nome)}">${I.x('#B3261E',18)}</button></div>`).join('')||'<p class="sm mut" style="margin:0">Adicione filhos, pais ou outras pessoas que você agenda. Eles aparecem na mensagem do WhatsApp.</p>'}
 <form data-form="dep" class="col" style="gap:.6rem"><div class="row wrap"><input class="inp" name="nome" required placeholder="Nome do dependente" style="flex:2;min-width:10rem"><select class="inp" name="par" style="flex:1;min-width:8rem">${PARENT.map(x=>`<option>${x}</option>`).join('')}</select></div><button class="btn" type="submit">${I.plus('#0B6E6B',18)} Adicionar dependente</button></form></div>`:login;
 return phead('Perfil',u?'Seus dados ficam só neste aparelho':'Entre para agendar mais rápido',false)+`<section class="sec">${perfil}
 <div class="card" style="padding:.2rem 1rem">
 <button class="lrow" data-act="picker" data-alvo="origin"><span class="lic">${I.pin('#0B6E6B',20)}</span><span class="col" style="flex:1;min-width:0"><b style="font-size:.95rem">Ponto de partida</b><span class="sm mut ell">${esc(S.origin.n)}</span></span>${I.chev('#4E6664',18)}</button>
 <button class="lrow" data-act="pg" data-v="acess"><span class="lic">${I.aa('#0B6E6B',20)}</span><span class="col" style="flex:1"><b style="font-size:.95rem">Acessibilidade</b><span class="sm mut">Letra grande, contraste, voz e modo simples</span></span>${I.chev('#4E6664',18)}</button>
 <button class="lrow" data-act="pg" data-v="privacidade"><span class="lic">${I.shield('#0B6E6B',20)}</span><span class="col" style="flex:1"><b style="font-size:.95rem">Privacidade (LGPD)</b><span class="sm mut">Como tratamos seus dados</span></span>${I.chev('#4E6664',18)}</button></div>
 <h2 class="h2">Favoritos (${favs.length})</h2>${favs.length?`<div class="grid">${favs.map(card).join('')}</div>`:'<div class="empty">Toque no coração de um local para guardá-lo aqui.</div>'}
 <button class="btn" data-act="limpar" style="flex:none;border-color:#B3261E;color:#B3261E">Apagar favoritos e agenda deste aparelho</button></section>`}

/* ---- páginas do menu ---- */
const TOG=(k,t,s)=>`<button class="sw" role="switch" aria-checked="${!!S.a11y[k]}" data-act="a11y" data-k="${k}"><span class="col" style="flex:1"><b style="font-size:.98rem">${t}</b><span class="sm mut">${s}</span></span><span class="tog" aria-hidden="true"></span></button>`;
const FAQ=[['O VittaOne marca a consulta por mim?','Não. O VittaOne encontra o local e abre o WhatsApp oficial com a mensagem pronta. Você envia, e a clínica responde com os horários. Onde não há WhatsApp oficial, mostramos o telefone.'],['O VittaOne é gratuito?','Sim. O app é gratuito para pacientes. Os preços que aparecem são das clínicas, quando publicados.'],['Como sei se o local está aberto?','Calculamos pelo horário de Brasília com o horário publicado pelo local. Quando não conseguimos confirmar, aparece "Horário a confirmar": ligue antes de ir.'],['De onde vêm as notas ⭐?','Do Google Maps, pesquisadas em '+CFG.dataRef+'. Para ver a nota atual ou avaliar, use o botão "Avaliar no Google Maps".'],['Como calculo a rota?','Na página do local, toque em "Como chegar". Você pode trocar o ponto de partida e o destino quando quiser e abrir no Google Maps ou chamar um Uber.'],['Posso agendar para meu filho ou meus pais?','Sim. Cadastre dependentes no Perfil. Na hora do WhatsApp, escolha quem é o paciente.'],['Meus dados vão para algum servidor?','Não. Nome, celular, dependentes, favoritos e agenda ficam só neste aparelho. Você pode apagar tudo no Perfil.'],['Encontrei um dado errado. Como aviso?','Use "Fale conosco" no menu. Clínicas podem pedir correção em "Para clínicas e médicos".']];
const PGS={
 acess:['Acessibilidade','Para idosos, pessoas com deficiência e para todos',()=>`<div class="card"><h2 class="h3">Tamanho da letra</h2><div class="seg" role="group" aria-label="Tamanho da letra">${[[0,'A','Normal'],[1,'A+','Grande'],[2,'A++','Muito grande']].map(([v,t,l])=>`<button data-act="fs" data-v="${v}" aria-pressed="${S.a11y.fs===v}" aria-label="${l}" style="font-size:${1+v*.2}rem">${t}</button>`).join('')}</div></div>
 <div class="card" style="padding:.2rem 1rem">${TOG('hc','Alto contraste','Cores mais fortes e bordas pretas')}${TOG('leg','Letra de leitura fácil','Fonte Atkinson Hyperlegible, feita para baixa visão')}${TOG('ler','Leitura em voz alta','Mostra o botão amarelo que lê a tela')}${TOG('simples','Modo simples','Só o essencial, botões maiores')}${TOG('nomo','Reduzir animações','Desliga efeitos de movimento')}</div>
 <div class="card"><h2 class="h3">Busca por voz</h2><p class="p">${SR?'Disponível: toque no microfone no topo de qualquer tela ou dentro das buscas e diga, por exemplo, "cardiologista" ou "hemograma".':'Este navegador não oferece busca por voz. No Android, use o Google Chrome.'}</p>${TTS?`<button class="btn" data-act="testevoz" style="flex:none">${I.speaker('#0B6E6B',20)} Ouvir um exemplo</button>`:''}</div>`],
 ajuda:['Ajuda','Perguntas frequentes',()=>FAQ.map(([q,a])=>`<details class="faq"><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')],
 contato:['Fale conosco','Dúvidas, sugestões e correções',()=>`<div class="card"><p class="p">Fale com a equipe do VittaOne. Respondemos em dias úteis.</p><div class="kv"><span class="mut">Empresa</span><b>${esc(CFG.empresa)}</b></div><div class="kv"><span class="mut">E-mail</span><b>${esc(CFG.email)}</b></div><a class="btn pri" href="mailto:${/@/.test(CFG.email)?CFG.email:''}?subject=${enc('VittaOne: contato')}">${I.mail('#fff',20)} Escrever e-mail</a></div><div class="info warn">${I.alert('#5E3B08',20)}<span>O VittaOne não faz atendimento médico. Em emergência, ligue 192.</span></div>`],
 clinicas:['Para clínicas e médicos','Apareça no VittaOne ou corrija seus dados',()=>`<div class="card"><h2 class="h3">Seu local já pode estar aqui</h2><p class="p">Listamos ${LOC.length} locais em São Paulo com dados públicos. Para corrigir endereço, horário, WhatsApp oficial, fotos ou redes sociais, fale com a gente.</p>${['Cadastro gratuito na versão atual','Botão de WhatsApp com mensagem pronta','Rota, mapa e nota do Google Maps','Médicos: envie sua foto profissional para aparecer no perfil'].map(t=>`<div class="row">${I.shield('#2E8F6E',20)}<span class="p">${t}</span></div>`).join('')}<a class="btn pri" href="mailto:${/@/.test(CFG.email)?CFG.email:''}?subject=${enc('VittaOne: cadastro de clínica')}">${I.brief('#fff',20)} Pedir cadastro ou correção</a></div>`],
 termos:['Termos de Uso','Versão preliminar · '+CFG.dataRef,()=>`<div class="card"><p class="p sm mut">Rascunho para revisão jurídica. Empresa responsável: ${esc(CFG.empresa)}.</p>${[['1. O que é o VittaOne','O VittaOne é um guia que ajuda a encontrar consultas e exames, ver como chegar e iniciar o agendamento pelo WhatsApp ou telefone do próprio local.'],['2. O que o VittaOne não faz','O VittaOne não presta serviço médico, não marca consultas em nome do usuário, não garante vagas, preços ou horários e não substitui orientação médica. Em emergência, ligue 192.'],['3. Informações dos locais','Os dados vêm de fontes públicas (sites oficiais, CNES, catálogos) e podem mudar. Confirme com o local antes de ir.'],['4. Links externos','WhatsApp, Google Maps, Uber, redes sociais e serviços de teleconsulta têm termos próprios.'],['5. Uso adequado','Não use o VittaOne para enviar mensagens falsas ou abusivas aos locais.'],['6. Alterações','Estes termos podem mudar; a data da versão fica no topo.']].map(([t,x])=>`<h2 class="h3">${t}</h2><p class="p">${x}</p>`).join('')}</div>`],
 privacidade:['Política de Privacidade','Lei Geral de Proteção de Dados (LGPD)',()=>`<div class="card"><p class="p sm mut">Rascunho para revisão jurídica. Controlador: ${esc(CFG.empresa)} · contato: ${esc(CFG.email)}.</p>${[['Dados que você informa','Nome, celular, convênio (ou particular), ponto de partida, favoritos e histórico de pedidos.'],['Onde ficam','Nome, celular e convênio ficam no cadastro do Vitta (servidor Supabase), para que cada celular tenha um único cadastro, e também neste aparelho. Favoritos, ponto de partida e agenda ficam só neste aparelho.'],['Serviços externos','Para mapas, endereços, rotas e fotos, o navegador consulta OpenStreetMap/CARTO, Nominatim, OSRM, Mapillary, Wikimedia Commons e Google Maps. Esses serviços recebem o seu endereço IP e as coordenadas pesquisadas. A localização por GPS só é usada se você permitir.'],['WhatsApp','A mensagem só sai quando você toca em enviar no seu WhatsApp.'],['Seus direitos (art. 18 da LGPD)','Acessar, corrigir e apagar seus dados. Para corrigir ou apagar seu cadastro, fale com a gente em Fale conosco.'],['Dados de saúde','O VittaOne não pede diagnóstico nem histórico médico. O nome do exame ou especialidade escolhido fica só no seu aparelho.']].map(([t,x])=>`<h2 class="h3">${t}</h2><p class="p">${x}</p>`).join('')}</div>`],
 emergencia:['Emergência','Ligue agora. Não espere agendar.',()=>`${[['192','SAMU','Ambulância e urgência médica','#B3261E'],['193','Bombeiros','Acidentes, resgate e incêndio','#B3261E'],['190','Polícia Militar','Violência e segurança','#0B6E6B'],['188','CVV','Apoio emocional, 24 horas, gratuito','#0B6E6B'],['136','Disque Saúde','Informações do SUS','#0B6E6B']].map(([n,t,s,c])=>`<a class="card" href="tel:${n}" style="flex-direction:row;align-items:center"><span class="lic" style="width:3.6rem;height:3.6rem;background:${c};color:#fff;font-weight:800;font-size:1.25rem">${n}</span><span class="col" style="flex:1"><b style="font-size:1.05rem">${t}</b><span class="sm mut">${s}</span></span>${I.phone(c,24)}</a>`).join('')}<button class="btn" data-act="atalho" data-k="ps" style="flex:none">${I.build('#0B6E6B',20)} Ver pronto-socorro 24h perto</button>`],
 sobre:['Sobre o VittaOne','Consultas e exames em São Paulo',()=>`<div class="card" style="align-items:center;text-align:center">${LOGO(72)}<h2 class="h2">VittaOne</h2><p class="p mut">Versão ${CFG.versao} · ${CFG.dataRef}</p><p class="p">Vitta vem de vida. Nosso objetivo é tirar a ansiedade de encontrar onde se cuidar: achar o local certo, saber como chegar e começar o agendamento em poucos toques.</p></div><div class="card"><b>${LOC.length} locais e serviços na cidade de São Paulo</b><div class="meta">${Object.keys(CATS).map(c=>`<span class="tag" style="background:${CATS[c].fundo};color:${CATS[c].cor}">${CATS[c].nome}: ${LOC.filter(p=>p.c===c).length}</span>`).join('')}</div><span class="p">Dimagem Unineuro (Lapa) e MITI Consultórios (Avenida Paulista, Conjunto Nacional).</span></div>`],
 fontes:['Fontes e créditos','De onde vêm os dados, mapas e fotos',()=>{const comFoto=LOC.filter(p=>p.foto).length;return `<div class="card"><h2 class="h3">Dados dos locais</h2><p class="p">Pesquisa de ${CFG.dataRef} em sites oficiais, CNES, Doctoralia e catálogos médicos. Cada local mostra a fonte. WhatsApp só aparece onde é oficial (${LOC.filter(p=>p.wa).length} locais).</p></div>
 <div class="card"><h2 class="h3">Mapas e rotas</h2><p class="p">Mapas: © OpenStreetMap e © CARTO. Endereços: Nominatim (OpenStreetMap). Rotas: OSRM. Links: Google Maps e Uber.</p></div>
 <div class="card"><h2 class="h3">Fotos</h2><p class="p">${comFoto} locais têm foto do site oficial. Os demais recebem, ao abrir, fotos de rua do Mapillary (CC BY-SA) e imagens da Wikimedia Commons próximas ao endereço; sem foto, mostramos a miniatura do mapa do local. Toque no crédito da foto para ver o autor e a licença.</p></div>
 <div class="card"><h2 class="h3">Notas ⭐</h2><p class="p">Notas do Google Maps pesquisadas em ${CFG.dataRef} (${LOC.filter(p=>p.g).length} locais até agora). Avaliações são feitas no próprio Google Maps.</p></div>
 <form class="card" data-form="mly"><h2 class="h3">Fotos de rua (Mapillary)</h2><p class="sm mut" style="margin:0">${CFG.mapillary?'Ativo neste aparelho.':'Desativado. Cole o token de cliente do Mapillary (começa com MLY|) para ativar as fotos de rua.'}</p><div class="row"><input class="inp" name="tk" placeholder="MLY|..." autocomplete="off" style="flex:1"><button class="btn sm pri" type="submit">Salvar</button></div></form>
 <div class="info">${I.info('#0A4B44',20)}<span>Hospital Sorocabana (Lapa) não aparece: está fechado, com reabertura prevista para 2027.</span></div>`}]
};
function vPg(){const g=PGS[S.pg]||PGS.sobre;return phead(g[0],g[1])+`<section class="sec">${g[2]()}</section>`}

/* ============ MENU LATERAL ============ */
function abrirMenu(){const u=S.user;const it=(v,ic,t,s,cor)=>`<button class="it" data-act="pg" data-v="${v}"><span class="lic" style="${cor?`background:${cor==='#B3261E'?'#FBE9E8':'var(--mint)'}`:''}">${I[ic](cor||'#0B6E6B',20)}</span><span style="flex:1"><b${cor==='#B3261E'?' style="color:#B3261E"':''}>${t}</b><small>${s}</small></span></button>`;
 $('drawer').innerHTML=`<div class="drawer-bg" data-act="fecharMenu"></div><nav class="drawer" role="dialog" aria-modal="true" aria-label="Menu"><div class="dh"><div class="row between"><span class="row">${LOGO(34,'#fff','#7CCFB0')}<span style="font-size:1.2rem"><b>Vitta</b>One</span></span><button class="iconbtn" data-act="fecharMenu" aria-label="Fechar menu">${I.x('#fff',22)}</button></div>
 <button class="row" data-act="nav" data-v="perfil" style="color:#fff;text-align:left"><span class="lic" style="background:rgba(255,255,255,.15)">${I.user('#fff',20)}</span><span class="col"><b>${u?esc(u.nome):'Criar cadastro'}</b><span class="sm" style="opacity:.85">${u?'Seu cadastro':'Crie seu cadastro'}</span></span></button></div>
 <span class="grp">AJUDA</span>${it('emergencia','ambul','Emergência','192 SAMU · 193 Bombeiros','#B3261E')}${it('acess','aa','Acessibilidade','Letra grande, contraste e voz')}${it('ajuda','help','Ajuda','Perguntas frequentes')}${it('contato','mail','Fale conosco','Dúvidas e correções')}
 <span class="grp">PAX</span>${it('instalar','plus','Instalar Aplicação','Android, iPhone e computador')}${it('sobre','info','Sobre o VittaOne','Missão e números')}${it('fontes','book','Fontes e créditos','Dados, mapas e fotos')}
 <span class="grp">TERMOS E PRIVACIDADE</span>${it('termos','doc','Termos de Uso','Regras de uso do app')}${it('privacidade','shield','Política de Privacidade','LGPD e seus dados')}
 <p class="sm mut" style="padding:1rem 1.1rem">© 2026 ${esc(CFG.empresa)} · versão ${CFG.versao}</p></nav>`;
 empilha('menu');const b=document.querySelector('.drawer .iconbtn');if(b)b.focus()}
function fecharMenu(m){if(!$('drawer').innerHTML)return;$('drawer').innerHTML='';if(m==='nav')REUSE=true;else if(m!==true)desempilha()}

/* ============ MODAIS ============ */
function fechar(m){if(!$('modal').innerHTML)return;$('modal').innerHTML='';if(m==='nav')REUSE=true;else if(m!==true)desempilha()}
const GEMB='AIzaSyCQ6iNylAU8eKhy9oCKDUw5pHmv2fBi47A';
const MOBILE=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)||(navigator.maxTouchPoints>1&&/Mac/.test(navigator.platform));
function waFmt(u){let d=String(u||'').replace(/\D/g,'');if(d.startsWith('55')&&d.length>=12)d=d.slice(2);if(d.length===11)return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;if(d.length===10)return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;return d}
function abrirModal(html,label){const M=$('modal');const novo=!M.innerHTML;const velho=M.querySelector('.sheet');const mesmo=!novo&&velho&&velho.getAttribute('aria-label')===label;
 const top=mesmo?velho.scrollTop:0;const ae=document.activeElement;const foco=mesmo&&ae&&velho.contains(ae)?(ae.id?'#'+ae.id:ae.dataset&&ae.dataset.live?'[data-live="'+ae.dataset.live+'"]':null):null;const sel=foco&&ae.selectionStart!=null?[ae.selectionStart,ae.selectionEnd]:null;
 const fr=mesmo?velho.querySelector('iframe.gm-frame'):null;
 M.innerHTML=`<div class="modal-bg" data-act="fechar-bg"><div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(label)}"><span class="grab"></span>${html}</div></div>`;if(novo)empilha('modal');
 const sh=M.querySelector('.sheet');
 if(mesmo){if(fr){const nf=sh.querySelector('iframe.gm-frame');if(nf&&nf.src===fr.src)nf.replaceWith(fr)}sh.scrollTop=top;if(foco){const el=sh.querySelector(foco);if(el){el.focus({preventScroll:true});if(sel&&el.setSelectionRange)try{el.setSelectionRange(sel[0],sel[1])}catch(e){}}}sh.scrollTop=top;return}
 const f=sh.querySelector('input:not([type=checkbox]),select');if(f&&!f.value)f.focus({preventScroll:true})}
const xBtn=`<button class="round" data-act="fechar" aria-label="Fechar">${I.x('#0F2E2D',20)}</button>`;
let PK=null;
function picker(alvo){PK={alvo,q:''};
 abrirModal(`<div class="row between"><h2 class="h2">${alvo==='origin'?'Endereço de Referência':'Para onde você vai?'}</h2>${xBtn}</div>
 <form class="search" data-form="livre">${I.search('#0B6E6B',20)}<label class="sr" for="pq">Endereço ou local</label><input id="pq" name="q" type="search" autocomplete="off" placeholder="Endereço, estação, bairro ou unidade" data-live="pk"><button type="button" class="micbtn" data-act="voz" data-alvo="pq" aria-label="Falar o endereço">${I.mic('#fff',20)}</button></form>
 ${alvo==='origin'&&navigator.geolocation?`<button class="lrow" data-act="gps"><span class="lic" style="background:#DCF3E9">${I.gps('#2563EB',20)}</span><span class="col" style="flex:1"><b style="font-size:.95rem">Usar onde estou agora</b><span class="sm mut">Recomendado · GPS do aparelho</span></span></button>`:''}
 <div id="pkres" class="col"></div>`,'Escolher local');renderPK()}
function renderPK(){const box=$('pkres');if(!box)return;const t=norm(PK.q);const m=x=>!t||t.split(/\s+/).every(w=>norm(x).includes(w));
 const est=EST.filter(e=>m(e.n+' '+e.l)).map(e=>({k:'ponto',id:e.id,n:e.n,sub:e.l,la:e.la,lo:e.lo,g:'Estações'}));
 const ref=REFS.filter(e=>m(e.n+' '+e.l)).map(e=>({k:'ponto',id:e.id,n:e.n,sub:e.l,la:e.la,lo:e.lo,g:'Bairros e referências'}));
 const un=LOC.filter(p=>!isOnline(p)&&m(p.n+' '+p.e+' '+p.b)).map(p=>Object.assign(ptFromUnit(p),{g:'Unidades de saúde'}));
 const grupos=PK.alvo==='dest'?[un,est,ref]:[ref,est,un];let h='';
 if(PK.q.trim())h+=`<button class="lrow" data-act="pklivre">${I.pin('#0B6E6B',20)}<span class="col" style="flex:1"><b style="font-size:.95rem">Buscar o endereço "${esc(PK.q.trim())}"</b><span class="sm mut">O VittaOne localiza no mapa (OpenStreetMap)</span></span></button>`;
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
 WA={custom:false,txt:'',id,tipo,item:nm&&ops.includes(nm)?nm:ops[0],per:'manha',pag:/conv|plano/i.test(p.cv)&&!/particular/i.test(p.cv)?'convenio':'particular',plano:'',nome:pc?pc.nome:'',rel:'',pac:0,quando:'nesta semana',online:f.modo==='online'};desenharWA()}
function desenharWA(){const p=byId(WA.id);const seg=(k,ops)=>`<div class="seg" role="group">${ops.map(([v,t])=>`<button type="button" data-act="waset" data-k="${k}" data-v="${v}" aria-pressed="${WA[k]===v}">${t}</button>`).join('')}</div>`;const txt=WA.custom?WA.txt:msgWA(p,WA);const pcs=pacientes();
 abrirModal(`<div class="row" style="gap:.75rem"><span class="round wa" style="width:3.2rem;height:3.2rem;border-radius:50%">${ICW}</span><span class="col" style="flex:1;min-width:0"><h2 class="h2">Agendar pelo WhatsApp</h2><span class="wa-num">Mensagem para ${esc(waFmt(p.wa))}</span><span class="sm mut ell">${esc(p.n)}</span></span>${xBtn}</div>
 ${mapaWAHtml()}
 <label class="f">Quero agendar${seg('tipo',[['consulta','Consulta'],['exame','Exame']])}</label>
 <label class="f">${WA.tipo==='exame'?'Exame':'Especialidade'}<select class="inp" data-live="waitem">${opcoesItem(p,WA.tipo).map(x=>`<option ${x===WA.item?'selected':''}>${esc(x)}</option>`).join('')}</select></label>
 ${pcs.length?`<label class="f">Paciente<select class="inp" data-live="wapac">${pcs.map((x,i)=>`<option value="${i}" ${WA.pac===i?'selected':''}>${esc(x.nome)}${x.rel?' · '+esc(x.rel):' (você)'}</option>`).join('')}<option value="-1" ${WA.pac===-1?'selected':''}>Outra pessoa</option></select></label>`:''}
 ${!pcs.length||WA.pac===-1?`<label class="f">Nome do paciente<input class="inp" data-live="wanome" value="${esc(WA.pac===-1?WA.nome:WA.nome)}" placeholder="Nome completo" autocomplete="name"></label>`:''}
 <label class="f">Quando<select class="inp" data-live="waquando">${['hoje','amanhã','nesta semana','na próxima semana'].map(x=>`<option ${x===WA.quando?'selected':''}>${x}</option>`).join('')}</select></label>
 <label class="f">Período${seg('per',[['manha','Manhã'],['tarde','Tarde'],['qualquer','Qualquer']])}</label>
 <label class="f">Pagamento${seg('pag',[['particular','Particular'],['convenio','Convênio']])}</label>
 ${WA.pag==='convenio'?`<label class="f">Qual convênio? (opcional)<select class="inp" data-live="waconv"><option value="">Prefiro não dizer</option>${CONVS.map(x=>`<option ${WA.conv===x?'selected':''}>${x}</option>`).join('')}<option value="outro" ${WA.conv==='outro'?'selected':''}>Outro…</option></select></label>${WA.conv==='outro'?`<label class="f">Nome do convênio<input class="inp" data-live="waplano" value="${esc(WA.plano)}" placeholder="Digite o nome"></label>`:''}`:''}
 ${preparoBox()}
 ${anexosBox()}
 <div class="col" style="gap:.4rem"><div class="row between"><label for="wabubble" class="sm" style="font-weight:800;color:#33484D">Sua mensagem (pode editar)</label>${WA.custom?'<button type="button" class="lnk sm" data-act="wareset">Restaurar texto</button>':''}</div><div class="chat"><textarea id="wabubble" class="bubble" data-live="watxt" rows="9" style="width:calc(100% - 1.5rem);border:0;font:inherit;resize:vertical;outline:none;color:#111">${esc(txt)}</textarea></div><span class="sm mut">Toque no texto para mudar o que quiser antes de enviar.</span></div>
 ${WA.files&&WA.files.length?`<button type="button" class="btn wa" data-act="waenviar" style="min-height:3.4rem;font-size:1.02rem;flex:none">${ICW} ${rotuloEnvio()}</button><span class="sm mut">Abre a conversa com ${esc(p.n)} já com a mensagem. No WhatsApp, toque no clipe 📎 para anexar o pedido ou a guia.</span><a id="wago" hidden href="${waUrl(p,txt)}"></a>`:`<a class="btn wa" id="wago" href="${waUrl(p,txt)}"${MOBILE?'':' target="_blank" rel="noopener"'} data-act="wago" style="min-height:3.4rem;font-size:1.02rem;flex:none">${ICW} Agendar pelo WhatsApp</a>`}
 <span class="sm mut" style="text-align:center">${esc(p.wn)} · +${p.wa.replace(/^55(\d\d)(\d+)(\d{4})$/,'55 ($1) $2-$3')}. A mensagem sai do seu WhatsApp; o VittaOne não envia nada sozinho.</span>`,'Agendar pelo WhatsApp');setTimeout(mapaWA,80)}
function atualizaWA(){const p=byId(WA.id);const t=WA.custom?WA.txt:msgWA(p,WA);const b=$('wabubble'),a=$('wago');if(b&&!WA.custom)b.value=t;if(a)a.href=waUrl(p,t)}
function ligar(id){const p=byId(id);abrirModal(`<div class="row between"><h2 class="h2">Ligar para ${esc(p.n)}</h2>${xBtn}</div>
 ${p.t.map(t=>`<div class="card" style="flex-direction:row;align-items:center"><span class="col" style="flex:1;min-width:0"><b style="font-size:1.15rem">${esc(t)}</b><span class="sm mut">${esc(p.hr)}</span></span><a class="btn pri" href="${telHref(t)}" style="flex:none">${I.phone('#fff',18)} Ligar</a><button class="btn" data-act="copiar" data-v="${esc(t.replace(/\s*\([^)]*\)\s*$/,''))}" style="flex:none">Copiar</button></div>`).join('')}`,'Ligar')}

/* ============ RENDER E NAVEGAÇÃO ============ */
const VIEWS={inicio:vInicio,novo:vNovo,modo:vModo,itens:vItens,resultados:vResultados,buscar:vBuscar,local:vLocal,rota:vRota,agenda:vAgenda,perfil:vPerfil,pg:vPg};
const TABS=['inicio','buscar','novo','agenda','perfil'];
let HIST=[];
function topBar(){$('top').innerHTML=`<button class="iconbtn" data-act="menu" aria-label="Abrir menu">${I.menu('#fff',26)}</button><button class="brand" data-act="nav" data-v="inicio" aria-label="VittaOne, ir para o início"><span class="mk">${LOGO(26)}</span><span><b>Vitta</b><span>One</span></span></button>${SR?`<button class="iconbtn" data-act="vozglobal" aria-label="Buscar por voz">${I.mic('#fff',24)}</button>`:`<button class="iconbtn" data-act="pg" data-v="acess" aria-label="Acessibilidade">${I.aa('#fff',24)}</button>`}`}
function navBar(){const it=[['inicio','Início','home'],['buscar','Buscar','search'],['novo','Agendar',null],['agenda','Agenda','cal'],['perfil','Perfil','user']];
 const v=S.view;const at=['novo','modo','itens','resultados'].includes(v)?'novo':['local','rota','pg'].includes(v)?S.navAt||'inicio':v;const pend=S.hist.filter(x=>!x.ok).length;
 $('nav').innerHTML=it.map(([k,t,ic])=>{const on=at===k;
  if(!ic)return `<button class="mid" data-act="nav" data-v="novo" ${on?'aria-current="page"':''}><span class="plus">${I.plus('#fff',28,2.4)}</span><span>${t}</span></button>`;
  return `<button data-act="nav" data-v="${k}" ${on?'aria-current="page"':''}><span class="bub" style="position:relative">${I[ic](on?'#0B6E6B':'#9FD3CF',22)}${k==='agenda'&&pend?`<span style="position:absolute;top:-2px;right:8px;min-width:1.1rem;height:1.1rem;border-radius:999px;background:#B3261E;color:#fff;font-size:.65rem;font-weight:800;display:flex;align-items:center;justify-content:center">${pend}</span>`:''}</span><span>${t}</span></button>`}).join('')}
function aplicaA11y(){const h=document.documentElement,a=S.a11y;h.classList.toggle('fs1',a.fs===1);h.classList.toggle('fs2',a.fs===2);h.classList.toggle('hc',!!a.hc);h.classList.toggle('legivel',!!a.leg);h.classList.toggle('simples',!!a.simples);h.classList.toggle('nomotion',!!a.nomo);
 $('fab').innerHTML=a.ler?`<button class="fab" data-act="ler" aria-label="Ouvir esta tela">${I.speaker('#3A2600',26)}</button>`:''}
function render(anim){matarMapas();BAR='';const v=S.view,app=$('app');
 app.innerHTML=(VIEWS[v]||vInicio)();$('barbox').innerHTML=BAR;document.body.classList.toggle('has-bar',!!BAR);
 topBar();navBar();aplicaA11y();
 if(anim){app.classList.remove('enter');void app.offsetWidth;app.classList.add('enter')}
 if(v==='buscar')renderRes();
 if(v==='itens')renderItens();
 if(v==='resultados'&&S.flow.modo!=='online'&&S.showMap)mapaResultados('mapRes',resultadosFlow().filter(p=>!isOnline(p)));
 if(v==='rota')posRota();
 if(v==='local'){const p=byId(S.sel);ligaGaleria();if(p){pedirFotos(p);if(!p.geo&&!isOnline(p)){const la=p.la;refinar(p).then(()=>{if(S.view==='local'&&S.sel===p.id&&p.la!==la)render()})}}}
 observar()}
/* histórico: botão "voltar" do Android e do navegador */
let IGN=0,HOK=true,REUSE=false;
function empilha(tipo){try{if(REUSE){REUSE=false;history.replaceState({pax:tipo},'')}else history.pushState({pax:tipo},'')}catch(e){HOK=false}}
function desempilha(){if(!HOK)return;try{IGN++;history.back()}catch(e){IGN=0}}
window.addEventListener('popstate',()=>{if(IGN>0){IGN--;return}if($('modal').innerHTML){fechar(true);return}if($('drawer').innerHTML){fecharMenu(true);return}voltarTela()});
function snap(){return{v:S.view,sel:S.sel,pg:S.pg,flow:Object.assign({},S.flow)}}
function ir(v){if(!VIEWS[v])v='inicio';if(S.view!==v)S.lim=20;if(S.view!==v||v==='local'||v==='pg'){HIST.push(snap());empilha('tela')}else if(REUSE){REUSE=false;try{history.replaceState({pax:'tela'},'')}catch(e){}}if(TABS.includes(v))S.navAt=v;S.view=v;render(true);try{window.scrollTo(0,0)}catch(e){}const a=$('app');if(a&&a.focus)try{a.focus({preventScroll:true})}catch(e){}}
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
 case'mais':{const y=window.scrollY;S.lim=(S.lim||20)+20;render();window.scrollTo(0,y);break}
 case'voltar':voltar();break;
 case'tipo':S.flow={tipo:t.dataset.v,modo:'presencial',item:null};ir('resultados');break;
 case'modo':S.flow.modo=t.dataset.v;S.flow.item=null;S.qi='';ir('itens');break;
 case'item':S.flow.item=t.dataset.k;S.sort='perto';S.fWa=S.fOpen=S.fConv=S.fSus=S.f24=S.fMetro=S.fAcess=S.fIncl=S.fKids=S.fPet=false;ir('resultados');break;
 case'atalho':{const k=t.dataset.k;if(k!=='gps'&&k!=='emerg'){fecharMenu('nav');fechar('nav')}S.fWa=S.fOpen=S.fConv=S.fSus=S.f24=S.fMetro=S.fAcess=S.fIncl=S.fKids=S.fPet=false;S.q='';S.cat='todos';S.sort='perto';
  if(k==='ps'){S.cat='hospital';S.f24=true;ir('buscar')}else if(k==='wa'){S.fWa=true;ir('buscar')}else if(k==='sus'){S.fSus=true;ir('buscar')}
  else if(k==='tele'){S.flow={tipo:'consulta',modo:'online',item:null};S.qi='';ir('itens')}else if(k==='favs')ir('perfil');else if(k==='emerg')abrirPg('emergencia');
  else if(k==='gps')usarGPS();break}
 case'cat':S.cat=t.dataset.cat;render();break;
 case'tg':S[t.dataset.k]=!S[t.dataset.k];render();break;
 case'sort':S.sort=t.dataset.k;render();break;
 case'vis':S.map=t.dataset.k==='mapa';render();break;
 case'showF':S.showF=!S.showF;render();break;
 case'showMap':S.showMap=!S.showMap;render();break;
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
 case'testevoz':falar('Olá! Eu sou o VittaOne. Posso ler as informações dos locais para você.');break;
 case'compart':{const p=byId(id);const txt=`${p.n} — ${isOnline(p)?p.url:limpaEnd(p.e)} (via VittaOne)`;const url=isOnline(p)?p.url:gplace(p);
  if(navigator.share)navigator.share({title:p.n,text:txt,url}).catch(()=>{});else copiar(txt+' '+url,'Link copiado');break}
 case'wa':compor(id);break;
 case'wareset':WA.custom=false;WA.txt='';desenharWA();break;
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
 case'limpar':if(typeof confirm==='function'&&!confirm('Apagar favoritos, agenda e ajustes deste aparelho? Seu cadastro continua.'))break;['favs','hist','origin','geo','a11y','fotos3'].forEach(k=>LS.del(k));S.favs=[];S.hist=[];S.origin=ORIGEM_PADRAO;S.a11y={fs:0,hc:false,leg:false,ler:false,simples:false,nomo:false};toast('Dados apagados');render();break;
 }});
function copiar(v,msg){try{navigator.clipboard.writeText(v).then(()=>toast(msg),()=>toast(v))}catch(err){toast(v)}}
function reverso(pt){fetch('https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&accept-language=pt-BR&lat='+pt.la+'&lon='+pt.lo).then(r=>r.ok?r.json():null).then(j=>{if(!j||!j.address||S.origin!==pt)return;const ad=j.address;const rua=[ad.road,ad.house_number].filter(Boolean).join(', ');const bairro=ad.suburb||ad.neighbourhood||ad.city_district||'';pt.sub=[rua,bairro].filter(Boolean).join(' – ')||'Localização atual pelo GPS';LS.set('origin',pt);render()}).catch(()=>{})}
function gpsAuto(silencioso){if(!navigator.geolocation)return;navigator.geolocation.getCurrentPosition(pos=>{const pt={k:'gps',n:'Minha localização',sub:'Localização atual pelo GPS',la:pos.coords.latitude,lo:pos.coords.longitude};S.origin=pt;S.gpsMsg='';LS.set('origin',pt);S.rmode=null;render();reverso(pt)},()=>{S.gpsMsg=silencioso?'Ative a localização do aparelho para usar onde você está. Por enquanto: '+S.origin.n+'.':'';if(silencioso)render()},{enableHighAccuracy:true,timeout:12000,maximumAge:120000})}
function usarGPS(){if(!navigator.geolocation){toast('Localização indisponível neste navegador');return}toast('Buscando sua localização…');navigator.geolocation.getCurrentPosition(pos=>{const pt={k:'gps',n:'Minha localização',sub:'Localização atual pelo GPS',la:pos.coords.latitude,lo:pos.coords.longitude};S.gpsMsg='';setPonto('origin',pt);reverso(pt)},()=>toast('Não foi possível usar a localização. Verifique a permissão.'),{enableHighAccuracy:true,timeout:10000})}
document.addEventListener('input',e=>{const k=e.target.dataset.live;if(!k)return;
 if(k==='q'){S.q=e.target.value;clearTimeout(window._tq);window._tq=setTimeout(renderRes,140)}else if(k==='qi'){S.qi=e.target.value;clearTimeout(window._tqi);window._tqi=setTimeout(renderItens,120)}else if(k==='pk'){PK.q=e.target.value;renderPK()}
 else if(k==='cel'){const v=fmtCel(e.target.value);if(v!==e.target.value)e.target.value=v}
 else if(k==='watxt'){const was=WA.custom;WA.custom=true;WA.txt=e.target.value;atualizaWA();if(!was){const h=document.querySelector('label[for=wabubble]');if(h&&!h.parentNode.querySelector('[data-act=wareset]'))h.insertAdjacentHTML('afterend','<button type="button" class="lnk sm" data-act="wareset">Restaurar texto</button>')}}
 else if(k==='waitem'){WA.item=e.target.value;atualizaWA();desenharWA()}else if(k==='wanome'){WA.nome=e.target.value.trim();WA.rel='';atualizaWA()}else if(k==='waplano'){WA.plano=e.target.value.trim();atualizaWA()}else if(k==='waquando'){WA.quando=e.target.value;atualizaWA()}});
document.addEventListener('change',e=>{const k=e.target.dataset.live;if(k==='waconv'){WA.conv=e.target.value;WA.plano=WA.conv&&WA.conv!=='outro'?WA.conv:'';desenharWA();return}if(k==='waped'||k==='waguia'){anexar(k,e.target.files&&e.target.files[0]);return}if(k==='waitem'){WA.item=e.target.value;atualizaWA()}if(k==='waquando'){WA.quando=e.target.value;atualizaWA()}
 if(k==='wapac'){const i=+e.target.value;WA.pac=i;if(i>=0){const x=pacientes()[i];WA.nome=x.nome;WA.rel=x.rel}else{WA.nome='';WA.rel=''}desenharWA()}});
document.addEventListener('submit',e=>{e.preventDefault();const f=e.target.dataset.form,F=e.target;
 if(f==='busca'){const al=F.dataset.alvo;if(['qi','qc','qx'].includes(al))return;S.q=F.elements.q.value;S.cat='todos';if(S.view!=='buscar')ir('buscar');else renderRes()}
 if(f==='livre'){if(PK.q.trim())pontoLivre(PK.alvo,PK.q.trim());else if(PK.items&&PK.items[0])setPonto(PK.alvo,PK.items[0])}
 if(f==='login'){const nome=F.elements.nome.value.trim().replace(/\s+/g,' ');if(nome.length<2){toast('Digite seu nome');return}const cel=fmtCel(F.elements.cel.value);if(cel&&cel.replace(/\D/g,'').length<10){toast('Confira o celular com DDD');return}
  const novo=!S.user;S.user=Object.assign({deps:[]},S.user||{},{nome,cel});S.editando=false;LS.set('user',S.user);render();toast(novo?'Perfil criado. Bem-vindo(a), '+primeiroNome()+'!':'Perfil salvo')}
 if(f==='mly'){const tk=F.elements.tk.value.trim();if(!/^MLY\|/.test(tk)){toast('O token começa com MLY|');return}CFG.mapillary=tk;LS.set('mly',tk);FQ.length=0;LOC.forEach(p=>p._fq=0);Object.keys(FOTOS).forEach(k=>delete FOTOS[k]);LS.del('fotos3');render();toast('Fotos de rua ativadas')}
 if(f==='dep'){const nome=F.elements.nome.value.trim();if(!nome)return;S.user.deps=S.user.deps||[];S.user.deps.push({nome,par:F.elements.par.value});LS.set('user',S.user);render();toast('Dependente adicionado')}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if($('modal').innerHTML)fechar();else if($('drawer').innerHTML)fecharMenu()}});


/* ============ INSTALAR (PWA) ============ */
let PEDIDO=null;
try{if('serviceWorker' in navigator&&location.protocol==='https:')navigator.serviceWorker.register('sw.js')}catch(e){}
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();PEDIDO=e});
const ehIOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent||'');
const instalado=()=>{try{return matchMedia('(display-mode: standalone)').matches||navigator.standalone}catch(e){return false}};
PGS.instalar=['Instalar Aplicação','No celular ou no computador',()=>instalado()?'<div class="info">Você já está usando o app instalado.</div>':`
 ${PEDIDO?`<button class="btn pri" data-act="instalar" style="flex:none">${I.plus('#fff',20)} Instalar agora</button>`:''}
 <div class="card"><h2 class="h3">Android (Chrome)</h2><p class="p">Toque nos 3 pontinhos ⋮ no canto de cima e escolha <b>Instalar app</b> ou <b>Adicionar à tela inicial</b>.</p></div>
 <div class="card"><h2 class="h3">iPhone e iPad (Safari)</h2><p class="p">Toque em <b>Compartilhar</b> (quadrado com seta) e depois em <b>Adicionar à Tela de Início</b>.</p></div>
 <div class="card"><h2 class="h3">Computador (Chrome ou Edge)</h2><p class="p">Clique no ícone de instalar na barra de endereço, à direita, ou no menu ⋮ › <b>Transmitir, salvar e compartilhar</b> › <b>Instalar página como app</b>.</p></div>
 <p class="sm mut">O app instalado abre em tela cheia, ganha ícone próprio e guarda a última versão para abrir mais rápido.</p>`];
document.addEventListener('click',e=>{const t=e.target.closest('[data-act="instalar"]');if(t&&PEDIDO){PEDIDO.prompt();PEDIDO.userChoice.finally(()=>{PEDIDO=null;render()})}});

/* =====================================================================
   ETAPA 2 (v4.0): convênio, preparo, anexos, avatares, selo CRM, lembretes
   ===================================================================== */
const CONVS=['Amil','Bradesco Saúde','SulAmérica','Unimed','Porto Seguro Saúde','NotreDame Intermédica','Hapvida','Prevent Senior','Care Plus','Omint','Allianz Saúde','Golden Cross','Mediservice','Seguros Unimed','Cassi','Saúde Caixa'];
function preparoDe(nome){const n=norm(nome);for(const x of LABX)if(norm(x[0])===n)return x[2];for(const k in IMGX)if(norm(IMGX[k][0])===n)return IMGX[k][2];return''}
function preparoBox(){if(WA.tipo!=='exame')return'';const pr=preparoDe(WA.item);return pr?`<div class="info warn">${I.info('#5E3B08',20)}<span><b>Preparo para ${esc(WA.item)}:</b> ${esc(pr)}<br><span class="sm">Confirme com o local, pode variar.</span></span></div>`:''}
let anexosBox=function(){const f=WA.files||[];const it=(k,t,s)=>{const x=f.find(y=>y.k===k);return `<label class="soc" style="cursor:pointer">${x&&x.url?`<img src="${x.url}" alt="" style="width:2.9rem;height:2.9rem;border-radius:.8rem;object-fit:cover;flex:none">`:`<span class="si" style="background:var(--mint)">${I.doc('#0B6E6B',22)}</span>`}<span class="col" style="flex:1;min-width:0"><b>${t}</b><span class="sm mut ell">${x?esc(x.file.name):s}</span></span><span class="ref-bt" style="background:var(--mint)">${x?'Trocar':'Anexar'}</span><input type="file" accept="image/*,application/pdf" data-live="${k}" class="sr"></label>`};
 return `<div class="col" style="gap:.5rem"><span class="sm" style="font-weight:800;color:#33484D">Documentos (opcional)</span>${it('waped','Pedido médico','Foto ou PDF do pedido')}${it('waguia','Guia / autorização do convênio','Foto ou PDF da guia')}${f.length?'<span class="sm mut">Você envia 1 mensagem de texto e '+f.length+(f.length>1?' imagens':' imagem')+'.</span>':''}</div>`}
function anexar(k,file){if(!file)return;WA.files=(WA.files||[]).filter(x=>x.k!==k);let url='';try{if(/^image\//.test(file.type))url=URL.createObjectURL(file)}catch(e){}WA.files.push({k,file,url});WA.files.sort((a,b)=>a.k<b.k?1:-1);desenharWA()}
async function enviarFotos(){const fs=(WA.files||[]).map(x=>x.file);const p=byId(WA.id);
 try{if(navigator.canShare&&navigator.canShare({files:fs})){await navigator.share({files:fs,title:'Documentos para agendamento',text:'Documentos para o agendamento ('+(WA.nome||'paciente')+')'});toast('Pronto! Confira no WhatsApp.');return}}catch(e){if(e&&e.name==='AbortError')return}
 toast('Este aparelho não envia imagens direto. No WhatsApp, toque no clipe 📎 e escolha as fotos.');try{window.open(waUrl(p,''),'_blank')}catch(e){}}
document.addEventListener('click',e=>{const t=e.target.closest('[data-act="wafotos"]');if(t)enviarFotos()});

/* ---- avatares ilustrados para médicos (sem foto real) ---- */
const AVA=[['#F2C9A5','#3B2A20','#E6F4F1','short'],['#C68B59','#1F1A17','#EAF0FB','bun'],['#8D5A3B','#141110','#FCEBF1','curly'],['#F6D7BC','#B7863F','#EEF6EA','long'],['#E0AC82','#5A3A28','#FFF4DE','bald'],['#A9714B','#2B211C','#EFE9FB','side']];
function avatar(p,s){const i=(p.id*7)%AVA.length,[pele,cab,fundo,est]=AVA[i];const fem=/^(Dra|Prof\. Dra)/.test(p.n)||/^Leticia/.test(p.n);
 const hair={short:`<path d="M30 40c0-14 9-22 20-22s20 8 20 22c-3-6-9-9-20-9s-17 3-20 9z" fill="${cab}"/>`,bun:`<circle cx="50" cy="16" r="8" fill="${cab}"/><path d="M29 42c0-15 9-23 21-23s21 8 21 23c-4-7-11-10-21-10s-17 3-21 10z" fill="${cab}"/>`,curly:`<g fill="${cab}"><circle cx="34" cy="32" r="8"/><circle cx="44" cy="24" r="9"/><circle cx="56" cy="24" r="9"/><circle cx="66" cy="32" r="8"/><circle cx="30" cy="44" r="6"/><circle cx="70" cy="44" r="6"/></g>`,long:`<path d="M28 44c0-16 9-25 22-25s22 9 22 25v20c-4 0-6-4-6-8V44c-4-7-10-10-16-10s-12 3-16 10v12c0 4-2 8-6 8z" fill="${cab}"/>`,bald:`<path d="M31 36c2-10 9-15 19-15s17 5 19 15c-5-3-11-4-19-4s-14 1-19 4z" fill="${cab}" opacity=".55"/>`,side:`<path d="M29 41c0-15 10-23 22-23 10 0 20 7 20 20-8-2-15-6-19-11-4 7-13 11-23 14z" fill="${cab}"/>`}[fem&&(est==='short'||est==='bald'||est==='side')?'long':est];
 return `<svg width="${s}" height="${s}" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="50" fill="${fundo}"/><path d="M18 100c2-20 15-30 32-30s30 10 32 30z" fill="#fff"/><path d="M41 70l9 14 9-14z" fill="#CFE7E3"/><path d="M38 72c-2 8-1 14 3 19M62 72c2 8 1 14-3 19" stroke="#0B6E6B" stroke-width="2.4" fill="none" stroke-linecap="round"/><circle cx="41" cy="92" r="3" fill="#0B6E6B"/><rect x="44" y="58" width="12" height="14" rx="5" fill="${pele}"/><ellipse cx="50" cy="44" rx="17" ry="19" fill="${pele}"/>${hair}<circle cx="44" cy="45" r="1.8" fill="#2A2A2A"/><circle cx="56" cy="45" r="1.8" fill="#2A2A2A"/><path d="M45 53c3 2.5 7 2.5 10 0" stroke="#7A3E2B" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M60 80h12v8H60z" fill="#E6F4F1"/><path d="M66 80v8M62 84h8" stroke="#2E8F6E" stroke-width="1.6"/></svg>`}
const ehPessoa=p=>p.c==='medico'||(p.c==='online'&&/^(Dr|Dra|Prof)/.test(p.n))||p.id===136;
function cover(p,h){if(!ehPessoa(p))return coverBase(p,h);h=h||'8.5rem';return `<span class="cover" data-h="${h}" style="height:${h};background:linear-gradient(135deg,#DCF3E9,#F6FBFB);display:flex;align-items:center;justify-content:center">${avatar(p,'78%')}<span class="bdg">${esc(CATS[p.c].um.toUpperCase())}</span>${p.crmOk?`<span class="src" style="background:#0B6E6B;color:#fff">✓ CRM ativo</span>`:''}</span>`}
function galeria(p){if(!ehPessoa(p))return galeriaBase(p);return `<span class="cover" style="height:15rem;border-radius:0;background:linear-gradient(135deg,#DCF3E9,#F6FBFB);display:flex;align-items:center;justify-content:center">${avatar(p,'12rem')}<span class="src">Ilustração · foto mediante envio do médico</span></span>`}
function seloCRM(p){if(!ehPessoa(p))return'';const num=(p.crm||'').match(/CRM-?SP\s*\d+/i);
 if(p.crmOk)return `<div class="card" style="flex-direction:row;align-items:center;background:linear-gradient(135deg,#0B6E6B,#2E8F6E);color:#fff;border:0"><span style="width:3.4rem;height:3.4rem;border-radius:1rem;background:rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center;flex:none"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2.4 1.8 3-.2.9 2.9 2.5 1.7-1 2.8 1 2.8-2.5 1.7-.9 2.9-3-.2L12 22l-2.4-1.8-3 .2-.9-2.9-2.5-1.7 1-2.8-1-2.8 2.5-1.7.9-2.9 3 .2z" fill="rgba(255,255,255,.15)"/><path d="M8.5 12l2.3 2.3 4.7-4.6"/></svg></span><span class="col" style="flex:1;min-width:0"><b style="font-size:1.05rem">CRM autorizado no CFM</b><span class="sm" style="opacity:.92">${esc(num?num[0].replace('CRM-SP','CRM-SP '):'')} · ativo · conferido em ${esc(p.crmOk)}</span><a class="sm" style="color:#fff;text-decoration:underline" href="https://portal.cfm.org.br/busca-medicos/" target="_blank" rel="noopener">Conferir no site do CFM</a></span></div>`;
 return `<div class="info">${I.shield('#0A4B44',20)}<span>${num?esc(num[0]):'CRM não informado'} · ainda não conferido por nós. <a class="lnk" href="https://portal.cfm.org.br/busca-medicos/" target="_blank" rel="noopener">Consultar no CFM</a></span></div>`}

/* ---- lembretes a partir da mensagem de confirmação ---- */
const MESES=['janeiro','fevereiro','marco','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'],DIAS=['domingo','segunda','terca','quarta','quinta','sexta','sabado'];
function lerConfirmacao(txt){const t=norm(txt);const hoje=new Date();let d=null,m;
 if((m=t.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/))){let y=m[3]?+m[3]:hoje.getFullYear();if(y<100)y+=2000;d=new Date(y,+m[2]-1,+m[1]);if(!m[3]&&d<new Date(hoje.toDateString()))d.setFullYear(y+1)}
 else if((m=t.match(/\b(\d{1,2}) de ([a-z]+)/))&&MESES.indexOf(m[2])>=0){d=new Date(hoje.getFullYear(),MESES.indexOf(m[2]),+m[1]);if(d<new Date(hoje.toDateString()))d.setFullYear(d.getFullYear()+1)}
 else if(/depois de amanha/.test(t)){d=new Date(hoje);d.setDate(d.getDate()+2)}else if(/amanha/.test(t)){d=new Date(hoje);d.setDate(d.getDate()+1)}else if(/\bhoje\b/.test(t))d=new Date(hoje);
 else{const i=DIAS.findIndex(x=>new RegExp('\\b'+x).test(t));if(i>=0){d=new Date(hoje);d.setDate(d.getDate()+((i-hoje.getDay()+7)%7||7))}}
 let hora='';if((m=t.match(/\b(?:as|a partir das|horario:?)\s*(\d{1,2})(?:[:h](\d{2}))?\s*h?/))||(m=t.match(/\b(\d{1,2})[:h](\d{2})\b/))||(m=t.match(/\b(\d{1,2})\s*h\b/)))hora=String(m[1]).padStart(2,'0')+':'+(m[2]||'00');
 const frases=txt.split(/(?<=[.!?\n])\s*/).map(s=>s.trim()).filter(s=>/jejum|preparo|beber|bexiga|suspend|levar|traga|trazer|chegar|anteced|document|pedido|guia|carteirinh|dieta|evitar|nao (comer|tomar)|não (comer|tomar)|acompanhante|roupa/i.test(s));
 return{data:d?d.toISOString().slice(0,10):'',hora,desc:frases.join('\n')}}
function icsData(L){const z=n=>String(n).padStart(2,'0');const[y,mo,da]=L.data.split('-');const[h,mi]=(L.hora||'08:00').split(':');const ini=`${y}${mo}${da}T${z(h)}${z(mi)}00`;const fimD=new Date(+y,+mo-1,+da,+h+1,+mi);const fim=`${fimD.getFullYear()}${z(fimD.getMonth()+1)}${z(fimD.getDate())}T${z(fimD.getHours())}${z(fimD.getMinutes())}00`;return{ini,fim}}
function lembreteGoogle(L){const{ini,fim}=icsData(L);return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${enc(L.titulo)}&dates=${ini}/${fim}&ctz=America/Sao_Paulo&details=${enc(L.desc+'\n\nCriado pelo VittaOne')}&location=${enc(L.end)}`}
function baixarICS(L){const{ini,fim}=icsData(L);const e=s=>String(s||'').replace(/[\\,;]/g,m=>'\\'+m).replace(/\n/g,'\\n');
 const ics=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Pax Saude//PT-BR','BEGIN:VEVENT','UID:pax-'+Date.now()+'@pax','DTSTAMP:'+new Date().toISOString().replace(/[-:]/g,'').slice(0,15)+'Z','DTSTART;TZID=America/Sao_Paulo:'+ini,'DTEND;TZID=America/Sao_Paulo:'+fim,'SUMMARY:'+e(L.titulo),'DESCRIPTION:'+e(L.desc),'LOCATION:'+e(L.end),'BEGIN:VALARM','TRIGGER:-P1D','ACTION:DISPLAY','DESCRIPTION:'+e(L.titulo+' amanhã'),'END:VALARM','BEGIN:VALARM','TRIGGER:-PT2H','ACTION:DISPLAY','DESCRIPTION:'+e(L.titulo+' em 2 horas'),'END:VALARM','END:VEVENT','END:VCALENDAR'].join('\r\n');
 try{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([ics],{type:'text/calendar'}));a.download='lembrete-pax.ics';document.body.appendChild(a);a.click();a.remove()}catch(err){toast('Não foi possível gerar o arquivo')}}
S.lemb=LS.get('lemb',[]);
function avisosPendentes(){if(typeof Notification==='undefined'||Notification.permission!=='granted')return;const ag=Date.now();let mud=false;
 S.lemb.forEach(L=>{const t=new Date(L.data+'T'+(L.hora||'08:00')+':00-03:00').getTime();[[864e5,'amanhã'],[72e5,'em 2 horas']].forEach(([ms,q])=>{const k='av'+ms;if(!L[k]&&ag>=t-ms&&ag<t){L[k]=1;mud=true;try{navigator.serviceWorker&&navigator.serviceWorker.ready?navigator.serviceWorker.ready.then(r=>r.showNotification(L.titulo+' '+q,{body:(L.hora?L.hora+' · ':'')+L.end,icon:'icon-192.png'})):new Notification(L.titulo+' '+q)}catch(e){}}})});if(mud)LS.set('lemb',S.lemb)}
setInterval(avisosPendentes,6e4);setTimeout(avisosPendentes,3000);
function vLembrete(){const L=S.lembEd||{};const locs=S.hist.map(x=>byId(x.id)).filter(Boolean);
 return phead('Criar lembrete','Cole a confirmação da clínica e o VittaOne preenche')+`<section class="sec">
 <div class="info">${I.chat('#0A4B44',20)}<span>No WhatsApp, toque e segure a mensagem de confirmação › <b>Compartilhar › Vitta</b>${'<br>'}ou copie e cole aqui embaixo.</span></div>
 <label class="f">Mensagem da clínica<textarea class="inp" id="lmsg" rows="5" data-live="lmsg" style="padding:.7rem;min-height:7rem" placeholder="Ex.: Sua ressonância está confirmada para 14/11 às 9h30. Jejum de 4 horas. Trazer pedido médico.">${esc(L.msg||'')}</textarea></label>
 <div class="card"><label class="f">Local<select class="inp" data-live="lloc"><option value="">Escolha o local</option>${[...new Set(locs.concat(L.id?[byId(L.id)]:[]))].filter(Boolean).map(p=>`<option value="${p.id}" ${L.id===p.id?'selected':''}>${esc(p.n)}</option>`).join('')}</select></label>
 <div class="row"><label class="f" style="flex:1">Data<input class="inp" type="date" data-live="ldata" value="${esc(L.data||'')}"></label><label class="f" style="flex:1">Hora<input class="inp" type="time" data-live="lhora" value="${esc(L.hora||'')}"></label></div>
 <label class="f">Descrição (preparo, dieta, o que levar)<textarea class="inp" rows="3" data-live="ldesc" style="padding:.7rem">${esc(L.desc||'')}</textarea></label>
 <label class="f">Endereço<input class="inp" data-live="lend" value="${esc(L.end||'')}"></label></div>
 ${L.data?'':'<p class="sm mut" style="margin:0">Não achei a data na mensagem? Preencha acima.</p>'}
 <button class="btn pri" data-act="lsalvar" style="flex:none" ${L.data?'':'disabled'}>${I.cal('#fff',20)} Salvar e ativar avisos no Vitta</button>
 <div class="acts"><button class="btn" data-act="lgoogle" ${L.data?'':'disabled'}>Google Agenda</button><button class="btn" data-act="lics" ${L.data?'':'disabled'}>Calendário do celular</button></div>
 <span class="sm mut">O VittaOne avisa 1 dia antes e 2 horas antes. Para avisar mesmo com o app fechado, adicione também ao calendário do celular.</span>
 ${S.lemb.length?`<h2 class="h2">Lembretes salvos</h2>`+S.lemb.map((x,i)=>`<div class="card"><b>${esc(x.titulo)}</b><span class="sm">${esc(x.data.split('-').reverse().join('/'))}${x.hora?' às '+esc(x.hora):''} · ${esc(x.end)}</span>${x.desc?`<span class="sm mut" style="white-space:pre-wrap">${esc(x.desc)}</span>`:''}<button class="btn btn-del" data-act="ldelq" data-i="${i}">${I.x('#B3261E',18)} Apagar lembrete</button></div>`).join(''):''}</section>`}
VIEWS.lembrete=vLembrete;
function lembDe(){const L=S.lembEd;const p=L.id?byId(L.id):null;L.titulo=(p?(p.c==='laboratorio'||p.c==='imagem'?'Exame':'Consulta')+' – '+p.n:'Consulta/Exame');if(p&&!L.endManual)L.end=p.n+', '+limpaEnd(p.e);return L}
function abrirLembrete(o){S.lembEd=Object.assign({msg:'',data:'',hora:'',desc:'',end:'',id:null},o||{});if(S.lembEd.msg){const r=lerConfirmacao(S.lembEd.msg);Object.assign(S.lembEd,{data:r.data||S.lembEd.data,hora:r.hora||S.lembEd.hora,desc:r.desc||S.lembEd.desc})}lembDe();ir('lembrete')}
document.addEventListener('input',e=>{const k=e.target.dataset.live;if(!k||!/^l(msg|data|hora|desc|end)$/.test(k)||!S.lembEd)return;const L=S.lembEd;
 if(k==='lmsg'){L.msg=e.target.value;const r=lerConfirmacao(L.msg);if(r.data)L.data=r.data;if(r.hora)L.hora=r.hora;if(r.desc)L.desc=r.desc;clearTimeout(vLembrete._t);vLembrete._t=setTimeout(()=>{const pos=e.target.selectionStart;render();const t=$('lmsg');if(t){t.focus();try{t.setSelectionRange(pos,pos)}catch(x){}}},700)}
 else if(k==='ldata')L.data=e.target.value;else if(k==='lhora')L.hora=e.target.value;else if(k==='ldesc')L.desc=e.target.value;else if(k==='lend'){L.end=e.target.value;L.endManual=1}
 document.querySelectorAll('[data-act=lsalvar],[data-act=lgoogle],[data-act=lics]').forEach(b=>b.disabled=!L.data)});
document.addEventListener('change',e=>{if(e.target.dataset.live==='lloc'&&S.lembEd){S.lembEd.id=+e.target.value||null;S.lembEd.endManual=0;lembDe();render()}});
document.addEventListener('click',e=>{const t=e.target.closest('[data-act]');if(!t)return;const a=t.dataset.act;const L=S.lembEd;
 if(a==='lsalvar'&&L&&L.data){lembDe();S.lemb.push({titulo:L.titulo,data:L.data,hora:L.hora,desc:L.desc,end:L.end,id:L.id});S.lemb.sort((x,y)=>(x.data+x.hora).localeCompare(y.data+y.hora));LS.set('lemb',S.lemb);
  const ok=()=>{toast('Lembrete salvo. O VittaOne avisa 1 dia e 2 horas antes.');render()};if(typeof Notification!=='undefined'&&Notification.permission==='default'){Notification.requestPermission().then(ok,ok)}else ok()}
 if(a==='lgoogle'&&L&&L.data){lembDe();window.open(lembreteGoogle(L),'_blank')}
 if(a==='lics'&&L&&L.data){lembDe();baixarICS(L)}
 if(a==='ldelq'){const i=+t.dataset.i,x=S.lemb[i];if(!x)return;abrirModal(`<div class="row between"><h2 class="h2">Apagar lembrete?</h2>${xBtn}</div><p class="p"><b>${esc(x.titulo)}</b><br>${esc(x.data.split('-').reverse().join('/'))}${x.hora?' às '+esc(x.hora):''}</p><p class="sm mut">Os avisos do Vitta para este compromisso param. Se você também salvou na agenda do celular ou no Google Agenda, apague lá também.</p><button class="btn pri" data-act="ldel" data-i="${i}" style="background:#B3261E;border-color:#B3261E">Sim, apagar</button><button class="btn" data-act="fechar">Cancelar</button>`,'Apagar lembrete')}
 if(a==='ldel'){S.lemb.splice(+t.dataset.i,1);LS.set('lemb',S.lemb);fechar();toast('Lembrete apagado');render()}
 if(a==='lnovo'){const x=S.hist[+t.dataset.i];abrirLembrete(x?{id:x.id}:{})}});
/* agenda: botão de lembrete em cada pedido */
function vAgenda(){let h=vAgendaBase();h=h.replace(/<button class="btn (pri)?" data-act="hok" data-i="(\d+)">/g,(m,_,i)=>`<button class="btn" data-act="lnovo" data-i="${i}">${I.cal('#0B6E6B',18)} Criar lembrete</button>`+m);
 const lista=S.lemb.length?`<h2 class="h2">Meus lembretes</h2>`+S.lemb.map((x,i)=>`<div class="card"><b>${esc(x.titulo)}</b><span class="sm">${esc(x.data.split('-').reverse().join('/'))}${x.hora?' às '+esc(x.hora):''}${x.end?' · '+esc(x.end):''}</span><button class="btn btn-del" data-act="ldelq" data-i="${i}">${I.x('#B3261E',18)} Apagar lembrete</button></div>`).join(''):'';
 h=h.replace(/(<section class="sec"[^>]*>)/,'$1'+lista);
 return h.replace('<button class="btn pri" data-act="nav" data-v="novo"',`<button class="btn" data-act="lnovo" data-i="-1" style="flex:none">${I.cal('#0B6E6B',20)} Criar lembrete a partir de uma confirmação</button>\n <button class="btn pri" data-act="nav" data-v="novo"`)}
VIEWS.agenda=vAgenda;
/* compartilhar → Pax (Android): abre o lembrete já preenchido */
(function(){try{const q=new URLSearchParams(location.search);const txt=[q.get('title'),q.get('text'),q.get('url')].filter(Boolean).join('\n');if(txt){history.replaceState(null,'',location.pathname);setTimeout(()=>abrirLembrete({msg:txt}),50)}}catch(e){}})();

/* =====================================================================
   v4.3: sintomas, voz em todos os campos, filtros rápidos, mapa no WhatsApp,
   endereço nos resultados, envio único com anexos, modo leitura por toque
   ===================================================================== */
/* ---------- Busca por sintoma ---------- */
const SINTOMAS=[
 ['pele|mancha|acne|espinha|coceira|cabelo|unha|verruga|pinta|micose|caspa|vermelhidao na pele|ferida','dermato'],
 ['peito|coracao|palpitac|pressao alta|hipertens|falta de ar|desmaio|batimento','cardio'],
 ['joelho|costas|coluna|ombro|tornozelo|quadril|fratura|torci|torcao|osso|lombar|tendin|punho|cotovelo|dor no pe|dor nas pernas','orto'],
 ['olho|vista|visao|enxerg|oculos|lente|catarata|embacad','oftalmo'],
 ['ouvido|zumbido|garganta|nariz|sinusite|rinite|rouquidao|amigdal|surdez|escutar','otorrino'],
 ['estomago|azia|gastrite|refluxo|intestin|diarreia|prisao de ventre|figado|barriga|enjoo|vomit','gastro'],
 ['menstrua|gravidez|gravida|gestante|pre natal|prenatal|mama|seio|anticoncep|corrimento|utero|ovario|menopausa|preventivo|papanicolau','gineco'],
 ['dor de cabeca|enxaqueca|tontura|formigamento|convuls|memoria|esquec|tremor|avc|derrame','neuro'],
 ['ansiedade|depressao|insonia|panico|estresse|tristeza|humor|dormir|tdah','psiq'],
 ['tireoide|diabetes|glicose|obesidade|emagrec|hormonio|colesterol|engordar|peso','endo'],
 ['urina|xixi|prostata|rins|rim |calculo|pedra no rim|bexiga|erecao','uro'],
 ['crianca|bebe|meu filho|minha filha|infantil','pedi'],
 ['febre|gripe|resfriado|tosse|dor no corpo|mal estar|check up|checkup|rotina|cansaco|fraqueza','clinica']];
function sintomaPara(t){t=' '+norm(t).replace(/[^a-z0-9 ]/g,' ')+' ';if(t.trim().length<3)return[];const r=[];for(const[re,k]of SINTOMAS)if(new RegExp(re).test(t)&&!r.includes(k))r.push(k);return r}
function renderItens(){const box=$('itens');if(!box)return;const t=norm(S.qi);const f=S.flow;const c=f.tipo==='consulta',cor=c?'#0A8F8A':'#17624A',bg=c?'#E0F5F4':'#DCF3E9';
 const sug=c?sintomaPara(S.qi):[];const todos=itensLista();
 let r=todos.filter(x=>!t||norm(x.t+' '+x.s).includes(t)||sug.includes(x.k));
 r.sort((a,b)=>(sug.includes(b.k)?1:0)-(sug.includes(a.k)?1:0));
 const aviso=sug.length?`<div class="info" style="grid-column:1/-1">${I.info('#0A4B44',20)}<span>Pelo que você descreveu (“${esc(S.qi.trim())}”), procure: <b>${sug.map(k=>esc(ESP[k][0])).join(', ')}</b>. Em caso de dor forte, falta de ar ou sangramento, procure um pronto-socorro.</span></div>`:'';
 box.innerHTML=aviso+(r.length?r.map(x=>`<button class="tile wide" data-act="item" data-k="${x.k}"${sug.includes(x.k)?' style="border-color:'+cor+';box-shadow:0 0 0 2px '+cor+'33"':''}><span class="lic" style="background:${bg}">${I[x.ic](cor,22)}</span><span class="col" style="gap:.25rem;flex:1;min-width:0"><b>${esc(x.t)}${sug.includes(x.k)?' <span class="tag" style="background:'+bg+';color:'+cor+'">Indicado</span>':''}</b><span class="sm mut">${esc(x.s)}</span><span class="sm" style="font-weight:800;color:${cor}">${x.n} ${x.n===1?'local':'locais'}</span></span></button>`).join(''):'<div class="empty" style="grid-column:1/-1">Nada encontrado. Tente falar ou escrever o que está sentindo, por exemplo “dor no joelho”.</div>')}

/* ---------- Microfone em todos os campos de texto ---------- */
let MICN=0;
function micsEverywhere(){if(!SR)return;document.querySelectorAll('input:not([data-mic]):not([type=date]):not([type=time]):not([type=file]):not([type=checkbox]):not([type=radio]):not([type=hidden]),textarea:not([data-mic])').forEach(el=>{
 if(el.dataset.mic||el.closest('.search')||el.type==='hidden'||el.id==='wabubble')return;el.dataset.mic='1';if(!SR)return;if(!el.id)el.id='campo'+(++MICN);
 const b=document.createElement('button');b.type='button';b.className='micmini';b.dataset.act='vozc';b.dataset.alvo=el.id;b.setAttribute('aria-label','Falar em vez de digitar');b.innerHTML=I.mic('#fff',18);
 const w=document.createElement('span');w.className='micwrap';el.parentNode.insertBefore(w,el);w.appendChild(el);w.appendChild(b)})}
function vozCampo(id){if(!SR){toast('Voz indisponível neste navegador');return}const el=$(id);if(!el)return;try{const r=new SR();r.lang='pt-BR';r.interimResults=false;const b=document.querySelector(`[data-act="vozc"][data-alvo="${id}"]`);if(b)b.classList.add('on');toast('Pode falar…');
 r.onresult=e=>{const t=e.results[0][0].transcript;el.value=el.tagName==='TEXTAREA'&&el.value.trim()?el.value.replace(/\s*$/,' ')+t:t;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}))};
 r.onend=()=>{if(b)b.classList.remove('on')};r.onerror=()=>{if(b)b.classList.remove('on');toast('Não consegui ouvir. Tente de novo.')};r.start()}catch(e){toast('Não foi possível usar o microfone')}}
let _micR=0;try{new MutationObserver(()=>{if(_micR)return;_micR=requestAnimationFrame(()=>{_micR=0;micsEverywhere()})}).observe(document.body,{childList:true,subtree:true})}catch(e){}

/* ---------- Filtros rápidos acima de Consultas e Exames ---------- */
function filtrosRapidos(){const it=[['gpsnow','Perto de mim',S.origin.k==='gps'],['fOpen','Aberto agora',S.fOpen],['f24','24 horas',S.f24],['fConv','Convênio',S.fConv],['fSus','SUS',S.fSus],['fWa','WhatsApp',S.fWa]];
 return `<div class="fchips" role="group" aria-label="Filtros rápidos">${it.map(([k,t,on])=>`<button class="fchip" ${k==='gpsnow'?'data-act="gpsnow"':`data-act="tg" data-k="${k}"`} aria-pressed="${!!on}">${on?'✓ ':''}${t}</button>`).join('')}</div>`}

/* ---------- Endereço nos resultados (editável) ---------- */
function origemBloco(){const o=S.origin;if(o.k==='gps'||o.k==='geo'||o.id!=='r14')return origemChip(true);
 return `<form class="card refform" data-form="refend"><label for="refq" class="sm" style="font-weight:800;color:#0A4B44">Endereço de Referência: de onde você vai sair?</label>
 <div class="row" style="gap:.5rem"><input id="refq" class="inp" name="q" placeholder="Rua, número ou CEP" autocomplete="street-address" style="flex:1;min-width:0"><button class="btn pri" style="flex:none">Usar</button></div>
 <button type="button" class="lnk sm" data-act="gpsnow">Usar minha localização atual</button><span class="sm mut">Agora calculando a partir de: ${esc(o.n)}.</span></form>`}
async function usarEndereco(q){q=(q||'').trim();if(!q)return;toast('Procurando endereço…');const g=await geocode(/s(ã|a)o paulo/i.test(q)?q:q+', São Paulo - SP');
 if(!g){toast('Não encontrei esse endereço. Tente com número ou CEP.');return}
 S.origin={k:'geo',n:q,sub:(g.nome||'').split(',').slice(1,3).join(',').trim(),la:g.la,lo:g.lo};LS.set('origin',S.origin);render();toast('Endereço de Referência atualizado')}
document.addEventListener('submit',e=>{const F=e.target;if(F.dataset&&F.dataset.form==='refend'){e.preventDefault();usarEndereco(F.elements.q.value)}},true);

/* ---------- Mapa só antes de agendar pelo WhatsApp ---------- */
let MAPAWA=null;
function mapaWA(){return;const el=$('wamap');if(!el)return;try{if(MAPAWA)MAPAWA.remove()}catch(e){}MAPAWA=null;const p=byId(WA.id);if(!p||p.la==null){el.remove();return}
 if(typeof window.L==='undefined'||!window.L.map){el.dataset.mapwait='1';el.innerHTML='<div class="empty">Carregando mapa…</div>';return}
 const m=window.L.map(el,{zoomControl:false,attributionControl:true,scrollWheelZoom:false,dragging:true});MAPAWA=m;
 window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',{subdomains:'abcd',maxZoom:19,attribution:'© OpenStreetMap · © CARTO'}).addTo(m);
 window.L.circleMarker([p.la,p.lo],{radius:10,color:'#fff',weight:3,fillColor:'#128C4A',fillOpacity:1}).addTo(m).bindTooltip(p.n,{permanent:false});
 const b=[[p.la,p.lo]];if(S.origin.la!=null){window.L.circleMarker([S.origin.la,S.origin.lo],{radius:8,color:'#fff',weight:3,fillColor:'#2563EB',fillOpacity:1}).addTo(m).bindTooltip('Você');b.push([S.origin.la,S.origin.lo])}
 if(b.length>1)m.fitBounds(b,{padding:[24,24],maxZoom:16});else m.setView(b[0],15)}
function mapaWAHtml(){const p=byId(WA.id);if(!p||p.la==null||isOnline(p))return'';const d=dist(p);
 const q=p.n+', '+limpaEnd(p.e);
 const src=`https://www.google.com/maps/embed/v1/place?key=${GEMB}&q=${enc(q)}&zoom=16&language=pt-BR&region=BR`;
 return `<div class="col" style="gap:.35rem"><iframe class="gm-frame" title="Mapa de ${esc(p.n)} no Google Maps" src="${src}" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe><div class="row between sm"><span class="mut ell" style="min-width:0">${esc(limpaEnd(p.e))}</span><span style="flex:none;font-weight:800">${d!=null?fkm(d)+' de você':''}</span></div><a class="btn-gm btn-gm-wide" href="${gmaps(S.origin,ptDe(p),'driving')}" target="_blank" rel="noopener" aria-label="Abrir rota no Google Maps"><img src="img/gmaps.png" alt="Google Maps" style="height:1.35rem;width:auto"></a></div>`}

/* ---------- Envio único: mensagem + pedido + guia ---------- */
function rotuloEnvio(){const ks=(WA.files||[]).map(x=>x.k);const a=[];if(ks.includes('waped'))a.push('Pedido Médico');if(ks.includes('waguia'))a.push('Guia');return 'Enviar mensagem com anexo de '+a.join(' e ')}
function enviarTudo(){const p=byId(WA.id);const txt=WA.custom?WA.txt:msgWA(p,WA);const url=waUrl(p,txt);
 try{navigator.clipboard&&navigator.clipboard.writeText(txt)}catch(e){}
 toast('Abrindo a conversa. Para anexar o pedido ou a guia, toque no clipe 📎 no WhatsApp.');abrirWaDireto(url)}
function abrirWaDireto(url){registrarEnvio();if(MOBILE){location.href=url;return}const w=window.open(url,'_blank','noopener');if(!w)location.href=url}
function registrarEnvio(){const p=byId(WA.id);S.hist.unshift({id:p.id,tipo:WA.tipo,item:WA.item,pac:WA.nome,data:new Date().toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}),ok:false});S.hist=S.hist.slice(0,40);LS.set('hist',S.hist);setTimeout(()=>{fechar();navBar()},300)}

/* ---------- Voz mais natural ---------- */
let VOZ=null;
function escolherVoz(){if(!TTS)return;const vs=speechSynthesis.getVoices().filter(v=>/^pt[-_]BR/i.test(v.lang)||/portugu[eê]s.*brasil/i.test(v.name));if(!vs.length)return;
 const pr=[/natural|neural|online/i,/google/i,/francisca|thalita|antonio|luciana|felipe/i];for(const re of pr){const v=vs.find(x=>re.test(x.name));if(v){VOZ=v;return}}VOZ=vs.find(v=>!v.localService)||vs[0]}
if(TTS){escolherVoz();try{speechSynthesis.addEventListener('voiceschanged',escolherVoz)}catch(e){}}
function falar(t){if(!TTS){toast('Leitura em voz alta indisponível neste navegador');return}try{speechSynthesis.cancel();if(!VOZ)escolherVoz();
 String(t).split(/(?<=[.!?])\s+/).filter(Boolean).forEach(fr=>{const u=new SpeechSynthesisUtterance(fr);u.lang='pt-BR';if(VOZ)u.voice=VOZ;u.rate=1;u.pitch=1.05;speechSynthesis.speak(u)})}catch(e){}}
function simples(t){return String(t||'').replace(/\s+/g,' ').replace(/[•·|]/g,', ').replace(/\bR\.\s/g,'Rua ').replace(/\bAv\.\s/g,'Avenida ').replace(/\bDr\.\s/g,'Doutor ').replace(/\bDra\.\s/g,'Doutora ').replace(/\bcj\.\s?/gi,'conjunto ')
 .replace(/R\$\s?([\d.,]+)/g,'$1 reais').replace(/(\d+),(\d)\s?km/g,'$1 vírgula $2 quilômetros').replace(/(\d+)\s?km\b/g,'$1 quilômetros').replace(/(\d+)\s?m\b/g,'$1 metros').replace(/\bSUS\b/g,'S U S').replace(/\bCRM\b/g,'C R M').replace(/[✓★☆⭐📎]/g,'').replace(/\s*,\s*,/g,',').trim()}

/* ---------- Modo leitura: toque no que quer ouvir ---------- */
S.lendo=false;
function lerTela(){S.lendo=!S.lendo;document.body.classList.toggle('lendo',S.lendo);document.querySelectorAll('.lido').forEach(x=>x.classList.remove('lido'));
 let bar=$('lerbar');if(S.lendo){if(!bar){bar=document.createElement('div');bar.id='lerbar';bar.className='lerbar';bar.setAttribute('role','status');document.body.appendChild(bar)}
  bar.innerHTML=`${I.speaker('#3A2600',22)}<span style="flex:1"><b>Modo leitura</b><br>Toque no que quer ouvir.</span><button data-act="ler" class="btn" style="flex:none">Sair</button>`;falar('Modo leitura ligado. Toque no que você quer ouvir. Para sair, toque em Sair.')}
 else{if(bar)bar.remove();try{speechSynthesis.cancel()}catch(e){}toast('Modo leitura desligado')}}
const ALVO_LEITURA='.card,.tile,.cube,.lrow,.info,.short,.fchip,.mini,.ref,.refform,.phead,h1,h2,h3,p,label,.btn,.chip,li,.kv,.empty,button,a';
function textoLeitura(el){const c=el.closest('[data-id]');const id=c&&+c.dataset.id;const p=id&&byId(id);
 if(p&&!(el.matches('button,a')&&el.dataset.act&&el.dataset.act!=='abrir')){const st=status(p);return `${p.n}. ${CATS[p.c].um}. ${st.t}. ${isOnline(p)?'Atendimento online.':'Fica em '+limpaEnd(p.e)+'. '+(dist(p)!=null?'A '+fkm(dist(p))+' de você.':'')} ${p.wa?'Dá para agendar pelo WhatsApp.':p.t.length?'Agende por telefone.':''} ${p.g?'Nota no Google: '+String(p.g.v).replace('.',' vírgula ')+' de 5.':''}`}
 const lb=el.getAttribute('aria-label');const t=(el.innerText||el.textContent||'').trim();return lb&&(!t||t.length<3)?lb:(t||lb||'')}
document.addEventListener('click',e=>{if(!S.lendo)return;if(e.target.closest('#lerbar'))return;if(e.target.closest('#fab'))return;
 const el=e.target.closest(ALVO_LEITURA);if(!el||!el.closest('#app,#modal,#nav,#top'))return;e.preventDefault();e.stopPropagation();
 document.querySelectorAll('.lido').forEach(x=>x.classList.remove('lido'));el.classList.add('lido');falar(simples(textoLeitura(el)).slice(0,700))},true);

/* ---------- Ações novas ---------- */
document.addEventListener('click',e=>{const t=e.target.closest('[data-act]');if(!t||S.lendo)return;const a=t.dataset.act;
 if(a==='vozc'){e.preventDefault();vozCampo(t.dataset.alvo)}
 else if(a==='gpsnow'){e.preventDefault();toast('Buscando sua localização…');gpsAuto(false)}
 else if(a==='waenviar'){e.preventDefault();enviarTudo()}});
/* Ilustrações por categoria (quando o local não tem foto) */
const ILU_BASE=(bg1,bg2,inner)=>`<svg viewBox="0 0 340 150" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" style="position:absolute;inset:0" aria-hidden="true"><defs><linearGradient id="ig" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${bg1}"/><stop offset="1" stop-color="${bg2}"/></linearGradient></defs><rect width="340" height="150" fill="url(#ig)"/><circle cx="290" cy="30" r="16" fill="#fff" opacity=".55"/><path d="M0 128h340v22H0z" fill="#fff" opacity=".55"/>${inner}</svg>`;
const ILU={
hospital:()=>ILU_BASE('#FBE3E3','#FFF6F5',`<rect x="105" y="38" width="130" height="92" rx="6" fill="#fff" stroke="#8A1C22" stroke-width="3"/><rect x="145" y="22" width="50" height="24" rx="5" fill="#fff" stroke="#8A1C22" stroke-width="3"/><path d="M170 26v16M162 34h16" stroke="#C62E4A" stroke-width="5" stroke-linecap="round"/>${[0,1,2].map(r=>[0,1,2,3].map(c=>`<rect x="${117+c*28}" y="${54+r*20}" width="18" height="11" rx="2" fill="#CFE3F2"/>`).join('')).join('')}<rect x="157" y="104" width="26" height="26" rx="3" fill="#8A1C22"/><path d="M60 128c0-30 22-30 22 0M270 128c0-26 20-26 20 0" fill="#7FB89E"/><path d="M71 128v-14M280 128v-12" stroke="#4E7F67" stroke-width="3"/><rect x="40" y="110" width="44" height="18" rx="5" fill="#fff" stroke="#8A1C22" stroke-width="2.5"/><path d="M50 104h18l8 6" stroke="#8A1C22" stroke-width="2.5" fill="none"/><circle cx="50" cy="129" r="4" fill="#33484D"/><circle cx="76" cy="129" r="4" fill="#33484D"/><path d="M58 117h8M62 113v8" stroke="#C62E4A" stroke-width="2.5"/>`),
clinica:()=>ILU_BASE('#E1F2EA','#F6FBF8',`<rect x="40" y="30" width="260" height="98" rx="8" fill="#fff" stroke="#143D33" stroke-width="3"/><rect x="58" y="44" width="54" height="40" rx="4" fill="#CFE8DD"/><path d="M85 52v24M73 64h24" stroke="#143D33" stroke-width="4" stroke-linecap="round"/><rect x="130" y="90" width="80" height="8" rx="3" fill="#143D33"/><path d="M140 98v30M200 98v30" stroke="#143D33" stroke-width="3"/><rect x="150" y="76" width="26" height="16" rx="2" fill="#9CC9B6"/><circle cx="240" cy="66" r="11" fill="#F2C8A5"/><path d="M222 108c0-18 8-28 18-28s18 10 18 28z" fill="#fff" stroke="#143D33" stroke-width="3"/><path d="M234 86c0 10 2 14 6 16 4-2 6-6 6-16" stroke="#3A9B7A" stroke-width="2.5" fill="none"/><circle cx="240" cy="104" r="3" fill="#3A9B7A"/><rect x="226" y="108" width="28" height="20" rx="3" fill="#143D33"/><rect x="60" y="100" width="56" height="12" rx="4" fill="#CFE8DD" stroke="#143D33" stroke-width="2.5"/><path d="M64 112v16M112 112v16" stroke="#143D33" stroke-width="3"/>`),
laboratorio:()=>ILU_BASE('#E3ECF7','#F7FAFE',`<rect x="40" y="94" width="260" height="34" rx="6" fill="#fff" stroke="#1F4E7A" stroke-width="3"/><rect x="62" y="70" width="80" height="10" rx="3" fill="#1F4E7A"/>${[0,1,2,3,4].map(i=>`<rect x="${68+i*15}" y="${40+(i%2)*6}" width="9" height="${40-(i%2)*6}" rx="4.5" fill="#fff" stroke="#1F4E7A" stroke-width="2.5"/><rect x="${69.5+i*15}" y="${60}" width="6" height="${18}" rx="3" fill="${['#C62E4A','#E8A33D','#C62E4A','#7A4FB0','#C62E4A'][i]}"/>`).join('')}<path d="M190 128h56M218 128v-14" stroke="#1F4E7A" stroke-width="4" stroke-linecap="round"/><path d="M205 114h26l-6-30-10-8" stroke="#1F4E7A" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/><rect x="204" y="44" width="14" height="30" rx="3" transform="rotate(-25 211 59)" fill="#fff" stroke="#1F4E7A" stroke-width="3"/><circle cx="240" cy="96" r="7" fill="#CFE3F2" stroke="#1F4E7A" stroke-width="2.5"/><path d="M270 60s10 11 10 18a10 10 0 0 1-20 0c0-7 10-18 10-18z" fill="#E8A1AE" stroke="#C62E4A" stroke-width="2.5"/>`),
imagem:()=>ILU_BASE('#E6E9F7','#F8F9FE',`<path d="M110 128V74a60 60 0 0 1 120 0v54z" fill="#fff" stroke="#3B4C9B" stroke-width="3"/><circle cx="170" cy="78" r="26" fill="#DCE2F7" stroke="#3B4C9B" stroke-width="3"/><circle cx="170" cy="78" r="12" fill="#3B4C9B" opacity=".25"/><rect x="60" y="104" width="160" height="12" rx="5" fill="#fff" stroke="#3B4C9B" stroke-width="3"/><path d="M80 116v12M200 116v12" stroke="#3B4C9B" stroke-width="3"/><rect x="250" y="48" width="56" height="44" rx="5" fill="#2B3566"/><path d="M278 56v28M266 62c6 0 12 2 12 6M290 62c-6 0-12 2-12 6M266 72c6 0 12 2 12 6M290 72c-6 0-12 2-12 6" stroke="#BFD0FF" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M270 92v12h16V92" stroke="#2B3566" stroke-width="3" fill="none"/><circle cx="54" cy="56" r="10" fill="#3B4C9B" opacity=".2"/>`),
ubs:()=>ILU_BASE('#E2EEF8','#F7FBFE',`<path d="M90 128V62l80-30 80 30v66z" fill="#fff" stroke="#17624A" stroke-width="3"/><rect x="146" y="58" width="48" height="34" rx="4" fill="#17624A"/><path d="M170 64v22M159 75h22" stroke="#fff" stroke-width="5" stroke-linecap="round"/><rect x="106" y="74" width="26" height="18" rx="2" fill="#CFE3F2"/><rect x="208" y="74" width="26" height="18" rx="2" fill="#CFE3F2"/><rect x="158" y="102" width="24" height="26" rx="3" fill="#17624A" opacity=".85"/><path d="M40 128c0-36 28-36 28 0M282 128c0-30 24-30 24 0" fill="#86C19B"/><path d="M54 128v-16M294 128v-14" stroke="#4E8A63" stroke-width="3"/><path d="M110 112h30M200 112h30" stroke="#17624A" stroke-width="2" opacity=".4"/>`),
online:()=>ILU_BASE('#DFF3F1','#F5FBFB',`<rect x="128" y="20" width="84" height="112" rx="12" fill="#fff" stroke="#17624A" stroke-width="3"/><rect x="136" y="32" width="68" height="76" rx="6" fill="#CFEDEA"/><circle cx="170" cy="60" r="12" fill="#F2C8A5"/><path d="M150 100c0-14 9-22 20-22s20 8 20 22z" fill="#fff" stroke="#17624A" stroke-width="2.5"/><path d="M164 80c0 8 2 11 6 13 4-2 6-5 6-13" stroke="#17624A" stroke-width="2" fill="none"/><circle cx="170" cy="120" r="5" fill="#17624A"/><rect x="230" y="40" width="66" height="26" rx="10" fill="#fff" stroke="#17624A" stroke-width="2.5"/><path d="M242 50h40M242 57h26" stroke="#17624A" stroke-width="2.5" stroke-linecap="round"/><rect x="44" y="76" width="66" height="26" rx="10" fill="#17624A"/><path d="M56 86h40M56 93h24" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>`)};
function iluDe(p){if(isOnline(p))return'online';if(/^UBS|\bUBS\b|UNIDADE BASICA/i.test(p.n)||(p.fonteCnes&&/Unidade Básica/.test(p.d||'')))return'ubs';if(p.c==='hospital')return'hospital';if(p.c==='laboratorio')return'laboratorio';if(p.c==='imagem')return'imagem';return'clinica'}
function coverBase(p,h){h=h||'8.5rem';const f=fotosDe(p)[0];const c=CATS[p.c];
 return `<span class="cover" data-cov="${p.id}" data-h="${h}" style="height:${h}">${f?'<span style="position:absolute;inset:0;background:#DCE8E6"></span>':ILU[iluDe(p)]()}${f?`<img class="ph" src="${esc(f.u)}" alt="Foto: ${esc(p.n)}" loading="lazy" referrerpolicy="no-referrer" decoding="async" onerror="var s=this.parentNode.querySelector('.src');if(s)s.textContent='Ilustração Vitta';this.remove()">`:''}<span class="bdg">${esc(c.um.toUpperCase())}</span><span class="src">${f?esc(f.src):'Ilustração Vitta'}</span></span>`}
/* =====================================================================
   Selos da comunidade, estações, orçamentos
   ===================================================================== */
const SELO_GRUPOS=[
 ['Atendimento inclusivo','#7A4FB0',[['lgbt','Acolhe pessoas LGBTQIA+'],['gineco_humanizada','Ginecologia humanizada'],['body_positive','Macas e equipamentos para pessoas gordas']]],
 ['Acessibilidade física','#17624A',[['rampa','Rampa ou entrada sem degrau'],['elevador','Elevador largo'],['banheiro','Banheiro adaptado'],['libras','Intérprete de LIBRAS']]],
 ['Estrutura familiar','#C2410C',[['kids','Espaço kids com monitor'],['pet','Aceita pet de suporte ou tem espaço pet']]],
 ['Transparência e conforto','#17624A',[['ar','Ar-condicionado funciona'],['wifi','Wi-Fi bom na recepção'],['sem_taxa','Sem taxa extra além do combinado']]]];
const SELO_NOME={};SELO_GRUPOS.forEach(g=>g[2].forEach(([k,t])=>SELO_NOME[k]=t));
let SELOS={},ESTACOES=[];
const SBU='https://cckywhtpnjhlwqslmlxz.supabase.co',SBK='sb_publishable_yv9jTgQHXV1Diy_xPkk_eg_qSt_8roq',SBH={apikey:SBK,Authorization:'Bearer '+SBK};
function aparelhoId(){let a=LS.get('aparelho','');if(!a){a=(crypto.randomUUID?crypto.randomUUID():String(Math.random()).slice(2)+Date.now());LS.set('aparelho',a)}return a}
function selosDe(p){const s=SELOS[String(p.id)]||{};return Object.keys(s).filter(k=>s[k].selo)}
function temGrupo(p,i){const ks=SELO_GRUPOS[i][2].map(x=>x[0]);return selosDe(p).some(k=>ks.includes(k))}
(function(){if(typeof fetch!=='function')return;
 fetch(SBU+'/rest/v1/pax_selos?select=local_id,item,total,sim,selo',{headers:SBH}).then(r=>r.ok?r.json():[]).then(rs=>{SELOS={};(rs||[]).forEach(x=>{(SELOS[x.local_id]=SELOS[x.local_id]||{})[x.item]=x})}).catch(()=>{});
 const c=LS.get('estacoes',null);if(c&&c.rows){ESTACOES=c.rows}if(c&&c.em&&Date.now()-c.em<30*864e5)return;
 fetch(SBU+'/rest/v1/pax_estacoes?select=nome,tipo,lat,lon&limit=5000',{headers:SBH}).then(r=>r.ok?r.json():null).then(rs=>{if(rs&&rs.length){ESTACOES=rs;LS.set('estacoes',{em:Date.now(),rows:rs})}}).catch(()=>{})})();
const TIPO_EST={metro:'Metrô',trem:'Trem (CPTM)',onibus:'Terminal de ônibus'};
let _estG=null,_estGN=-1;function gradeEst(){if(_estGN===ESTACOES.length)return _estG;_estGN=ESTACOES.length;_estG=new Map();for(const e of ESTACOES){const k=Math.round(e.lat*100)+':'+Math.round(e.lon*100);(_estG.get(k)||_estG.set(k,[]).get(k)).push(e)}return _estG}
function estacaoPerto(p){if(p._est!==undefined&&p._estN===ESTACOES.length)return p._est;p._estN=ESTACOES.length;p._est=null;if(p.la==null||!ESTACOES.length)return null;let m=null;const G=gradeEst(),a=Math.round(p.la*100),b=Math.round(p.lo*100),C=[];for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++){const L=G.get((a+i)+':'+(b+j));if(L)C.push(...L)}
 for(const e of C){if(Math.abs(e.lat-p.la)>.006||Math.abs(e.lon-p.lo)>.007)continue;const d=km(p,{la:e.lat,lo:e.lon});if(d!=null&&d<=.5&&(!m||d<m.d))m={n:e.nome,t:e.tipo,d}}return p._est=m}
function filtrosAplic(r){return r.filter(p=>{if(S.fWa&&!p.wa)return false;if(S.fOpen&&status(p).k!=='aberto')return false;if(S.fConv&&!/conv|plano/i.test(p.cv))return false;if(S.fSus&&!p.sus)return false;if(S.f24&&p.h!=='24h')return false;
 if(S.fMetro&&!estacaoPerto(p))return false;if(S.fAcess&&!temGrupo(p,1))return false;if(S.fIncl&&!temGrupo(p,0))return false;if(S.fKids&&!selosDe(p).includes('kids'))return false;if(S.fPet&&!selosDe(p).includes('pet'))return false;return true})}
function blocoSelos(p){if(isOnline(p))return'';const ss=selosDe(p);const e=estacaoPerto(p);const s=SELOS[String(p.id)]||{};const pend=Object.keys(s).filter(k=>!s[k].selo&&s[k].total>0).length;
 return `<section class="sec"><h2 class="h2">Selos da comunidade</h2>
 ${e?`<div class="info">${I.pin('#0A4B44',20)}<span><b>Ao lado do ${esc(TIPO_EST[e.t])}:</b> ${esc(e.n)}, a ${fkm(e.d)} a pé.</span></div>`:''}
 ${ss.length?`<div class="selos">${SELO_GRUPOS.map(([g,cor,its])=>its.filter(([k])=>ss.includes(k)).map(([k,t])=>`<span class="selo" style="--c:${cor}">✓ ${esc(t)}</span>`).join('')).join('')}</div>`:`<p class="p mut">Ainda não há selos. Eles aparecem quando pelo menos 3 pessoas confirmam o mesmo item (70% ou mais de “sim”).${pend?` Já há avaliações em andamento.`:''}</p>`}
 <button class="btn" data-act="avaliar" data-id="${p.id}" style="flex:none">★ Avaliar estrutura e atendimento</button>${SESSAO?`<span class="sm mut">Conectado como ${esc(SESSAO.email||'sua conta')} · <button class="lnk sm" data-act="sairconta">Sair</button></span>`:'<span class="sm mut">Para avaliar é preciso entrar com e-mail (sem senha).</span>'}</section>`}
const _vLocal=VIEWS.local;VIEWS.local=()=>{const h=_vLocal();const p=byId(S.sel);return p?h+blocoSelos(p):h};
let AV={};
function abrirAvaliar(id){const p=byId(id);AV={id,r:LS.get('av_'+id,{})};desenharAv(p)}
function desenharAv(p){abrirModal(`<div class="row between"><h2 class="h2">Avaliar ${esc(p.n)}</h2>${xBtn}</div><p class="p mut">Responda só o que você viu. É anônimo: não enviamos nome, telefone nem localização.</p>
 ${SELO_GRUPOS.map(([g,cor,its])=>`<div class="col" style="gap:.4rem"><b style="color:${cor}">${g}</b>${its.map(([k,t])=>`<div class="row between" style="gap:.5rem"><span class="sm" style="flex:1">${esc(t)}</span><div class="seg" role="group" aria-label="${esc(t)}">${[['s','Sim'],['n','Não'],['x','Não sei']].map(([v,l])=>`<button type="button" data-act="avset" data-k="${k}" data-v="${v}" aria-pressed="${(AV.r[k]||'x')===v}">${l}</button>`).join('')}</div></div>`).join('')}</div>`).join('')}
 <button class="btn pri" data-act="avenviar" style="flex:none">Enviar avaliação</button>`,'Avaliar local')}
async function enviarAv(){const p=byId(AV.id);const its=Object.entries(AV.r).filter(([k,v])=>v!=='x');if(!its.length){toast('Marque pelo menos um item');return}
 const ap=aparelhoId();const rows=its.map(([k,v])=>({local_id:String(p.id),item:k,valor:v==='s',aparelho:ap}));
 try{const r=await fetch(SBU+'/rest/v1/pax_avaliacoes',{method:'POST',headers:Object.assign({'Content-Type':'application/json',Prefer:'resolution=ignore-duplicates,return=minimal'},SBH),body:JSON.stringify(rows)});
  if(!r.ok&&r.status!==409)throw 0;LS.set('av_'+p.id,AV.r);fechar();toast('Obrigado! Sua avaliação ajuda outras pessoas.')}catch(e){toast('Não foi possível enviar agora. Tente com internet.')}}

/* ---------- 3 orçamentos de exame de imagem ---------- */
const GRANDES=/fleury|einstein|s[ií]rio|delboni|lavoisier|a\+|alta excel|dasa|salom[aã]o|hcor|oswaldo cruz|9 de julho|nove de julho|rede d.or|s[aã]o luiz|samaritano|sabar[aá]|benefic[eê]ncia/i;
function candidatosOrc(){const k=S.flow.item;return LOC.filter(p=>!isOnline(p)&&p.c!=='hospital'&&p.img.includes(k)&&!GRANDES.test(p.n)&&(p.wa||p.t.length)&&p.la!=null).sort((a,b)=>((b.wa?1:0)-(a.wa?1:0))||(dist(a)??1e9)-(dist(b)??1e9)).slice(0,3)}
function abrirOrc(){const cs=candidatosOrc();const ex=itemNome();ORC={cs,file:ORC.file||null};
 abrirModal(`<div class="row between"><h2 class="h2">3 orçamentos de ${esc(ex)}</h2>${xBtn}</div>
 <p class="p mut">Escolhemos as 3 clínicas de médio porte mais perto, fora das grandes redes, todas com cadastro no CNES (Ministério da Saúde). Você envia o pedido médico para as 3 e compara as respostas.</p>
 <label class="soc" style="cursor:pointer"><span class="si" style="background:var(--mint)">${I.doc('#0B6E6B',22)}</span><span class="col" style="flex:1;min-width:0"><b>Foto do pedido médico</b><span class="sm mut ell">${ORC.file?esc(ORC.file.name):'Tire uma foto ou escolha da galeria'}</span></span><span class="ref-bt" style="background:var(--mint)">${ORC.file?'Trocar':'Fotografar'}</span><input type="file" accept="image/*" capture="environment" data-live="orcfoto" class="sr"></label>
 ${cs.length?cs.map((p,i)=>`<div class="card" style="gap:.4rem"><b>${i+1}. ${esc(p.n)}</b><span class="sm mut">${esc(limpaEnd(p.e))} · ${fkm(dist(p))}</span><button class="btn ${p.wa?'wa':''}" data-act="orcenviar" data-id="${p.id}" style="flex:none">${p.wa?ICW+' Pedir orçamento pelo WhatsApp':I.phone('#0B6E6B',18)+' Ligar e pedir orçamento'}</button></div>`).join(''):'<div class="empty">Não achamos clínicas de médio porte com contato para este exame perto de você.</div>'}
 <span class="sm mut">O preço final é sempre confirmado pela clínica.</span>`,'Pedir orçamentos')}
let ORC={};
function textoOrc(){return `Olá! Encontrei vocês pelo VittaOne. Gostaria de um orçamento particular para ${itemNome()}${ORC.file?' (pedido médico em anexo)':''}. Qual o valor, o preparo e a próxima data disponível? Obrigado!`}
async function orcEnviar(id){const p=byId(id);const t=textoOrc();if(!p.wa){ligar(id);return}
 try{if(ORC.file&&navigator.canShare&&navigator.canShare({files:[ORC.file],text:t})){await navigator.share({files:[ORC.file],text:t});toast('Escolha o WhatsApp e a conversa de '+p.n);return}}catch(e){if(e&&e.name==='AbortError')return}
 window.open(waUrl(p,t),'_blank')}
document.addEventListener('change',e=>{const t=e.target;if(t.dataset&&t.dataset.live==='orcfoto'&&t.files&&t.files[0]){ORC.file=t.files[0];abrirOrc()}});
document.addEventListener('click',e=>{const t=e.target.closest('[data-act]');if(!t||S.lendo)return;const a=t.dataset.act;
 if(a==='avaliar')abrirAvaliar(+t.dataset.id);
 else if(a==='avset'){AV.r[t.dataset.k]=t.dataset.v;desenharAv(byId(AV.id))}
 else if(a==='avenviar')enviarAv();
 else if(a==='orc'){ORC={};abrirOrc()}
 else if(a==='orcenviar')orcEnviar(+t.dataset.id)
 else if(a==='sairconta')sairConta()});
/* =====================================================================
   Conta (login por e-mail) para avaliar, faixa e ponto do atendimento inclusivo,
   notas do Google vindas do Supabase
   ===================================================================== */
const APP_URL=location.origin+location.pathname;
let SESSAO=LS.get('sessao',null);
(function(){const h=location.hash||'';if(/access_token=/.test(h)){const q=new URLSearchParams(h.slice(1));SESSAO={at:q.get('access_token'),rt:q.get('refresh_token'),exp:Date.now()+((+q.get('expires_in')||3600)*1000),email:''};
 try{const pl=JSON.parse(atob(SESSAO.at.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));SESSAO.email=pl.email||''}catch(e){}LS.set('sessao',SESSAO);try{history.replaceState(history.state,'',APP_URL)}catch(e){}setTimeout(()=>toast('Conta conectada'+(SESSAO.email?': '+SESSAO.email:'')+'. Você já pode avaliar locais.'),900)}})();
async function tokenValido(){if(!SESSAO)return null;if(Date.now()<SESSAO.exp-60000)return SESSAO.at;
 try{const r=await fetch(SBU+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:Object.assign({'Content-Type':'application/json'},{apikey:SBK}),body:JSON.stringify({refresh_token:SESSAO.rt})});if(!r.ok)throw 0;const j=await r.json();
  SESSAO=Object.assign(SESSAO,{at:j.access_token,rt:j.refresh_token,exp:Date.now()+(j.expires_in||3600)*1000});LS.set('sessao',SESSAO);return SESSAO.at}catch(e){SESSAO=null;LS.del('sessao');return null}}
function abrirLogin(motivo){abrirModal(`<div class="row between"><h2 class="h2">Entrar para avaliar</h2>${xBtn}</div>
 <p class="p mut">${esc(motivo||'Para evitar avaliações falsas, só quem tem conta pode avaliar.')} Enviamos um link de acesso para o seu e-mail, sem senha.</p>
 <form data-form="entrar" class="col" style="gap:.6rem"><label class="f">Seu e-mail<input class="inp" name="email" type="email" autocomplete="email" required placeholder="nome@exemplo.com"></label><button class="btn pri" style="flex:none">Enviar link de acesso</button></form>
 <span class="sm mut">Usamos o e-mail só para identificar sua conta. Ele não aparece para ninguém.</span>`,'Entrar')}
async function pedirLink(email){email=(email||'').trim();if(!/^\S+@\S+\.\S+$/.test(email)){toast('Confira o e-mail');return}
 try{const r=await fetch(SBU+'/auth/v1/otp?redirect_to='+encodeURIComponent(APP_URL),{method:'POST',headers:{'Content-Type':'application/json',apikey:SBK},body:JSON.stringify({email,create_user:true})});
  if(!r.ok){const j=await r.json().catch(()=>({}));throw new Error(j.msg||j.error_description||'erro')}
  fechar();toast('Pronto! Abra o link que enviamos para '+email+' neste aparelho.')}catch(e){toast('Não foi possível enviar agora: '+e.message)}}
function sairConta(){SESSAO=null;LS.del('sessao');toast('Você saiu da conta');render()}
document.addEventListener('submit',e=>{const F=e.target;if(F.dataset&&F.dataset.form==="entrar"){e.preventDefault();pedirLink(F.elements.email.value)}},true);
async function enviarAv(){const p=byId(AV.id);const its=Object.entries(AV.r).filter(([k,v])=>v!=='x');if(!its.length){toast('Marque pelo menos um item');return}
 const tk=await tokenValido();if(!tk){LS.set('av_pend',{id:AV.id,r:AV.r});abrirLogin();return}
 const rows=its.map(([k,v])=>({local_id:String(p.id),item:k,valor:v==='s'}));
 try{const r=await fetch(SBU+'/rest/v1/pax_avaliacoes?on_conflict=local_id,item,usuario',{method:'POST',headers:{'Content-Type':'application/json',apikey:SBK,Authorization:'Bearer '+tk,Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(rows)});
  if(!r.ok)throw 0;LS.set('av_'+p.id,AV.r);LS.del('av_pend');fechar();toast('Obrigado! Sua avaliação ajuda outras pessoas.')}catch(e){toast('Não foi possível enviar agora. Tente com internet.')}}
setTimeout(()=>{const pd=LS.get('av_pend',null);if(pd&&SESSAO){S.sel=pd.id;AV={id:pd.id,r:pd.r};try{ir('local');desenharAv(byId(pd.id))}catch(e){}}},1200);

/* ---------- Atendimento inclusivo: faixa no cadastro e ponto na prévia ---------- */
const INCL=SELO_GRUPOS[0][2];
function inclusivoDe(p){const ss=selosDe(p);return INCL.filter(([k])=>ss.includes(k)).map(([k,t])=>t)}
function faixaInclusiva(p){const it=inclusivoDe(p);if(!it.length)return'';return `<div class="faixa-incl" role="note"><span class="incl-dot" aria-hidden="true"></span><span><b>Atendimento Inclusivo:</b> ${esc(it.join(' · '))}. Confirmado por pessoas da comunidade.</span></div>`}
const _vLocal2=VIEWS.local;VIEWS.local=()=>{let h=_vLocal2();const p=byId(S.sel);if(!p)return h;const f=faixaInclusiva(p);if(!f)return h;
 const m=h.indexOf('id="galsc"');if(m>-1){let k=h.indexOf('</div>',m);const dots=h.indexOf('id="galdots"');if(dots>-1&&dots<k+40)k=h.indexOf('</div>',dots);return h.slice(0,k+6)+f+h.slice(k+6)}return f+h};
const _card=card,_mini=mini;
card=function(p){const h=_card(p);return inclusivoDe(p).length?h.replace('<span class="bdg">','<span class="incl-dot pin" title="Atendimento inclusivo" aria-label="Atendimento inclusivo"></span><span class="bdg">'):h};
mini=function(p){const h=_mini(p);return inclusivoDe(p).length?h.replace('<span class="bdg">','<span class="incl-dot pin" title="Atendimento inclusivo" aria-label="Atendimento inclusivo"></span><span class="bdg">'):h};

/* ---------- Notas do Google (gravadas pela função pax-google no Supabase) ---------- */
function aplicarGoogle(p,x){if(!p)return;if(x.google_place_id)p.gid=x.google_place_id;if(x.google_nota==null)return;const d=x.google_atualizado?new Date(x.google_atualizado).toLocaleDateString('pt-BR',{month:'short',year:'numeric'}).replace('.',''):'';
 p.g={v:+x.google_nota,n:x.google_qtd||0,d,f:x.google_place_id?'https://www.google.com/maps/place/?q=place_id:'+x.google_place_id:undefined};if(x.google_place_id)p.gid=x.google_place_id}
(function(){if(typeof fetch!=='function')return;
 fetch(SBU+'/rest/v1/pax_locais?select=id,google_place_id,google_nota,google_qtd,google_atualizado&google_place_id=not.is.null',{headers:SBH}).then(r=>r.ok?r.json():[]).then(rs=>{(rs||[]).forEach(x=>aplicarGoogle(byId(+x.id),x))}).catch(()=>{});
 fetch(SBU+'/rest/v1/pax_extra?select=cnes,google_place_id,google_nota,google_qtd,google_atualizado&google_place_id=not.is.null&limit=5000',{headers:SBH}).then(r=>r.ok?r.json():[]).then(rs=>{const t=()=>{(rs||[]).forEach(x=>aplicarGoogle(byId(10000000+(+x.cnes)),x))};t();setTimeout(t,8000)}).catch(()=>{})})();
/* Botões Google Maps e Uber logo após a imagem (só links, sem cota) */
function ptDe(p){return {k:'unidade',id:p.id,n:p.n,e:p.e,la:p.la,lo:p.lo}}
function btnGmaps(href){return `<a class="btn-gm" href="${href}" target="_blank" rel="noopener" aria-label="Abrir no Google Maps"><img src="img/gmaps.png" alt="Google Maps" style="height:1.35rem;width:auto"></a>`}
function btnUber(href){return `<a class="btn-uber" href="${href}" target="_blank" rel="noopener" aria-label="Chamar um Uber"><img src="img/uber.png" alt="Uber" style="height:1.15rem;width:auto"></a>`}
function botoesMapa(p){if(isOnline(p)||p.la==null)return'';return `<div class="mapbtns">${btnGmaps(gplace(p))}${btnUber(uber(ptDe(p)))}</div>`}
const _vLocal3=VIEWS.local;VIEWS.local=()=>{const h=_vLocal3();const p=byId(S.sel);if(!p)return h;const k='<section class="sec" style="padding-top:1.2rem">';return h.replace(k,k+botoesMapa(p))};
window.paxLeaflet=()=>{if(document.querySelector('#modal [data-mapwait]'))mapaWA();if(document.querySelector('#app [data-mapwait]'))render()};
setTimeout(()=>{if(typeof window.L==='undefined'){const w=document.querySelector('[data-mapwait] .empty');if(w)w.textContent='O mapa precisa de internet. Use os botões do Google Maps.'}},9000);


/* ===== Fotos dos sites oficiais (pax_extra.foto_url) + página de remoção ===== */
(()=>{const SBU2='https://cckywhtpnjhlwqslmlxz.supabase.co',K2='sb_publishable_yv9jTgQHXV1Diy_xPkk_eg_qSt_8roq';
 const ap=rs=>(rs||[]).forEach(x=>{const p=byId(10000000+(+x.cnes));if(p&&!p.foto){p.foto=x.foto_url;p.fotoCred=x.foto_credito}});
 const c=LS.get('fotosx',null);if(c)ap(c);
 fetch(SBU2+'/rest/v1/pax_extra?select=cnes,foto_url,foto_credito&foto_url=not.is.null&limit=5000',{headers:{apikey:K2,Authorization:'Bearer '+K2}}).then(r=>r.ok?r.json():null).then(rs=>{if(!rs)return;LS.set('fotosx',rs);const t=()=>ap(rs);t();setTimeout(()=>{t();if(S.view==='local'||S.view==='home')render()},8000)}).catch(()=>{})})();
PGS.remocao=['Remover estabelecimento','Para responsáveis pelo local',()=>`<div class="card"><p class="p">O VittaOne reúne dados públicos (CNES, sites oficiais e fotos divulgadas pelos próprios estabelecimentos) para ajudar pacientes a encontrar e reconhecer o local.</p><p class="p">Se você é responsável por um estabelecimento e quer remover a foto ou o cadastro, envie o nome e o endereço do local. Retiramos em até 5 dias úteis.</p><a class="btn pri" href="mailto:${/@/.test(CFG.email)?CFG.email:''}?subject=${enc('VittaOne: pedido de remoção')}&body=${enc('Estabelecimento:\nEndereço:\nRemover: ( ) só a foto  ( ) o cadastro inteiro\nSeu nome e cargo:')}">${I.mail('#fff',20)} Pedir remoção por e-mail</a></div>`];

/* Anexos viram lembrete: o WhatsApp não aceita arquivo por link */
anexosBox=function(){const conv=WA.pag==='convenio';return `<div class="info" role="note" style="align-items:flex-start">${I.doc('#0A4B44',22)}<span><b>Depois de enviar a mensagem</b>, mande na mesma conversa a foto do <b>pedido médico</b>${conv?' e da <b>guia/carteirinha do convênio</b>':''}. Isso agiliza o atendimento. No WhatsApp, toque no clipe 📎 ou na câmera.</span></div>`};

/* =====================================================================
   v5 (nov/2026): cadastro único por celular, locais Dimagem e MITI, marcação simples
   ===================================================================== */
const SB5='https://cckywhtpnjhlwqslmlxz.supabase.co',K5='sb_publishable_yv9jTgQHXV1Diy_xPkk_eg_qSt_8roq';
const dig5=t=>String(t||'').replace(/\D/g,'');
const cadOk=()=>!!(S.user&&S.user.cad&&S.user.nome&&dig5(S.user.cel).length>=10);
const convDe=u=>u&&u.conv&&u.conv!=='Particular'?u.conv:'Particular';

/* ---- cadastro ---- */
function vCadastro(){
 return `<section class="hero"><div class="row" style="gap:.8rem">${LOGO(46)}<h1 class="hello" style="flex:1">Bem-vindo(a) ao VittaOne <small>Faça seu cadastro para agendar. Leva menos de 1 minuto.</small></h1></div></section>
 <section class="sec"><form class="card" data-form="cad" novalidate>
 <label class="f">Nome completo<input class="inp" name="nome" required autocomplete="name" placeholder="Ex.: Maria da Silva"></label>
 <label class="f">Celular (WhatsApp)<input class="inp" name="cel" type="tel" inputmode="numeric" autocomplete="tel-national" data-live="cel" placeholder="(11) 90000-0000" required></label>
 <label class="f">Convênio<select class="inp" name="conv" data-live="cadconv"><option value="Particular">Vitta Particular</option>${CONVS.map(x=>`<option>${x}</option>`).join('')}<option value="outro">Outro convênio…</option></select></label>
 <label class="f" id="cadoutro" hidden>Nome do convênio<input class="inp" name="outro" placeholder="Digite o nome do convênio"></label>
 <label class="row sm" style="align-items:flex-start;gap:.6rem;font-weight:600"><input type="checkbox" name="ok" style="width:1.4rem;height:1.4rem;flex:none;margin-top:.1rem"><span>Li e aceito os <button type="button" class="lnk" data-act="pg" data-v="termos">Termos de Uso</button> e a <button type="button" class="lnk" data-act="pg" data-v="privacidade">Política de Privacidade</button>.</span></label>
 <div class="info red" id="caderr" role="alert" hidden></div>
 <button class="btn pri" type="submit" id="cadbtn" style="flex:none;min-height:3.4rem;font-size:1.02rem">Criar cadastro</button>
 <p class="sm mut" style="margin:0">Cada celular tem um único cadastro.</p></form>
 <div class="card ja-cad"><b>Já tem cadastro?</b><span class="sm mut">Entre com o celular e o nome completo usados no cadastro.</span><button class="btn" type="button" data-act="nav" data-v="entrar">Entrar com meu cadastro</button></div></section>`}
VIEWS.cadastro=vCadastro;
function cadErro(t){const e=$('caderr');if(e){e.textContent=t;e.hidden=!t}}
document.addEventListener('change',e=>{if(e.target.dataset&&e.target.dataset.live==='cadconv'){const o=$('cadoutro');if(o)o.hidden=e.target.value!=='outro'}});
document.addEventListener('submit',async e=>{const F=e.target;if(!F.dataset||F.dataset.form!=='cad')return;e.preventDefault();
 const nome=F.elements.nome.value.trim().replace(/\s+/g,' ');let cel=dig5(F.elements.cel.value);if(cel.length>11&&cel.startsWith('55'))cel=cel.slice(2);
 const sel=F.elements.conv.value,conv=sel==='outro'?F.elements.outro.value.trim():sel;
 if(nome.length<2)return cadErro('Digite seu nome completo.');
 if(cel.length<10||cel.length>11)return cadErro('Confira o celular: digite o DDD e o número.');
 if(!conv||conv.length<2)return cadErro('Digite o nome do convênio.');
 if(!F.elements.ok.checked)return cadErro('Para continuar, aceite os Termos de Uso e a Política de Privacidade.');
 cadErro('');const b=$('cadbtn');b.disabled=true;b.textContent='Criando cadastro…';
 try{const r=await fetch(SB5+'/rest/v1/rpc/pax_cadastrar',{method:'POST',headers:{apikey:K5,Authorization:'Bearer '+K5,'Content-Type':'application/json'},body:JSON.stringify({p_nome:nome,p_telefone:cel,p_convenio:conv})});
  if(!r.ok)throw new Error('http '+r.status);const j=await r.json();
  if(j&&j.ok){S.user={nome,cel:fmtCel(cel),conv,cad:1};LS.set('user',S.user);S.view='inicio';render(true);toast('Cadastro criado. Bem-vindo(a), '+primeiroNome()+'!');return}
  cadErro(j&&j.erro==='telefone_existente'?'Este celular já tem cadastro. Toque em "Entrar com meu cadastro", logo abaixo.':j&&j.erro==='telefone_invalido'?'Confira o celular: digite o DDD e o número.':'Não foi possível criar o cadastro. Confira os dados.')
 }catch(err){cadErro('Não foi possível concluir agora. Verifique a internet e tente de novo.')}
 b.disabled=false;b.textContent='Criar cadastro'});
/* sem cadastro, só a tela de cadastro (e os Termos/Privacidade) abre */
{const _render=render;render=function(a){if(!cadOk()&&S.view!=='pg'&&S.view!=='entrar')S.view='cadastro';document.body.classList.toggle('cad',S.view==='cadastro'||S.view==='entrar');return _render(a)}}

/* ---- perfil ---- */
VIEWS.perfil=function(){const u=S.user||{};const favs=S.favs.map(byId).filter(Boolean);
 return phead('Perfil','Seu cadastro no Vitta',false)+`<section class="sec">
 <div class="card" style="flex-direction:row;align-items:center"><span class="lic" style="width:3.6rem;height:3.6rem;border-radius:50%;background:var(--pet);color:#fff;font-weight:800;font-size:1.2rem">${esc((u.nome||'?').split(/\s+/).map(w=>w[0]).slice(0,2).join('').toUpperCase())}</span><span class="col" style="flex:1;min-width:0"><b style="font-size:1.1rem">${esc(u.nome||'')}</b><span class="sm mut">${esc(u.cel||'')}</span><span class="sm mut">Convênio: ${esc(convDe(u))}</span></span></div>
 <div class="info">${I.shield('#0A4B44',20)}<span>Seu celular tem um cadastro único. Para corrigir nome ou convênio, fale com a gente.</span></div>
 <div class="card" style="padding:.2rem 1rem">
 <button class="lrow" data-act="picker" data-alvo="origin"><span class="lic">${I.pin('#0B6E6B',20)}</span><span class="col" style="flex:1;min-width:0"><b style="font-size:.95rem">Ponto de partida</b><span class="sm mut ell">${esc(S.origin.n)}</span></span>${I.chev('#4E6664',18)}</button>
 <button class="lrow" data-act="pg" data-v="acess"><span class="lic">${I.aa('#0B6E6B',20)}</span><span class="col" style="flex:1"><b style="font-size:.95rem">Acessibilidade</b><span class="sm mut">Letra grande, contraste, voz e modo simples</span></span>${I.chev('#4E6664',18)}</button>
 <button class="lrow" data-act="pg" data-v="privacidade"><span class="lic">${I.shield('#0B6E6B',20)}</span><span class="col" style="flex:1"><b style="font-size:.95rem">Privacidade (LGPD)</b><span class="sm mut">Como tratamos seus dados</span></span>${I.chev('#4E6664',18)}</button></div>
 <h2 class="h2">Favoritos (${favs.length})</h2>${favs.length?`<div class="grid">${favs.map(card).join('')}</div>`:'<div class="empty">Toque no coração de um local para guardá-lo aqui.</div>'}
 <button class="btn" data-act="limpar" style="flex:none;border-color:#B3261E;color:#B3261E">Apagar favoritos e agenda deste aparelho</button></section>`};

/* ---- locais: Consultas / Exames levam direto aos dois locais ---- */
VIEWS.resultados=function(){const ex=(S.flow||{}).tipo==='exame';
 return phead(ex?'Exames':'Consultas','Escolha onde quer ser atendido(a)')+`<section class="sec"><div class="grid">${LOC.filter(p=>ex?(p.img.length||p.lab):!p.img.length).map(card).join('')}</div></section>`};

/* ---- marcação simples: só o exame (quando há mais de um) e o período ---- */
function msgWA5(p,o){const u=S.user||{};const per={manha:'pela manhã',tarde:'à tarde',qualquer:'em qualquer horário'}[o.per];
 const oque=o.tipo==='exame'?(o.item?'agendar o exame de '+o.item:'agendar um exame'):'agendar uma consulta';
 const pag=convDe(u)==='Particular'?'Vitta Particular':'convênio '+convDe(u);
 return `Olá, ${p.n}! Encontrei vocês pelo app VittaOne e gostaria de ${oque}.\n\nPaciente: ${u.nome}\nCelular: ${u.cel}\nAtendimento: ${pag}\nPreferência: ${per}\n\nQuais horários vocês têm disponíveis?`}
compor=function(id){const p=byId(id);if(!p||!p.wa)return;const f=S.flow||{};const ops=p.img.map(k=>IMGX[k][0]);
 const tipo=ops.length?'exame':(f.tipo||'consulta');
 WA={custom:false,txt:'',id,tipo,item:ops[0]||'',ops,per:'qualquer',nome:(S.user||{}).nome||'',files:null};desenharWA()};
desenharWA=function(){const p=byId(WA.id);const txt=msgWA5(p,WA);
 const seg=(k,ops)=>`<div class="seg" role="group">${ops.map(([v,t])=>`<button type="button" data-act="waset" data-k="${k}" data-v="${v}" aria-pressed="${WA[k]===v}">${t}</button>`).join('')}</div>`;
 abrirModal(`<div class="row" style="gap:.75rem"><span class="round wa" style="width:3.2rem;height:3.2rem;border-radius:50%">${ICW}</span><span class="col" style="flex:1;min-width:0"><h2 class="h2">Agendar</h2><span class="sm mut ell">${esc(p.n)}</span></span>${xBtn}</div>
 ${WA.ops.length>1?`<label class="f">Qual exame?<select class="inp" data-live="waitem">${WA.ops.map(x=>`<option ${x===WA.item?'selected':''}>${esc(x)}</option>`).join('')}</select></label>`:''}
 <div class="f">Melhor período${seg('per',[['manha','Manhã'],['tarde','Tarde'],['qualquer','Qualquer']])}</div>
 <p class="sm mut" style="margin:0">Seu nome, celular e convênio (${esc(convDe(S.user))}) já vão na mensagem.</p>
 <a class="btn wa" id="wago" href="${waUrl(p,txt)}"${MOBILE?'':' target="_blank" rel="noopener"'} data-act="wago" style="min-height:3.4rem;font-size:1.02rem;flex:none">${ICW} Agendar pelo WhatsApp</a>
 <span class="sm mut" style="text-align:center">Depois, mande na conversa a foto do pedido médico${convDe(S.user)==='Particular'?'':' e da carteirinha do convênio'}. A mensagem sai do seu WhatsApp.</span>`,'Agendar')};
atualizaWA=function(){const p=byId(WA.id);const a=$('wago');if(a)a.href=waUrl(p,msgWA5(p,WA))};


/* ============ v6: atrativos, carrosséis de convênios e especialidades, coworking ============ */
const CORT={pausa:false,t:null};
function marcaConv(c,cls){return c.logo?`<span class="${cls}" style="background:${c.lbg||'#fff'}"><img src="${c.logo}" alt="${esc(c.n)}" loading="lazy"></span>`:`<b class="cc-nome${c.n.length>18?' lg':''}">${esc(c.n)}</b>`}
function arteConv(c){const k=CARTAO[c.id];return k?`<div class="ct" style="${k.bg}">${k.svg}<span class="ct-f">Atendido na Dimagem Unineuro</span></div>`:''}
function cartaoConv(c){const k=CARTAO[c.id];
 if(k)return `<article class="cvc">${arteConv(c)}<div class="cvc-pe"><span class="sm"><b>${esc(c.n)}</b><br>${c.pac?'Pacote de Ressonância e Tomografia':c.ex.length+' exames credenciados'}</span><button class="cc-ver2" data-act="conv" data-k="${c.id}">Ver lista de exames credenciados</button></div></article>`;
 return `<article class="cvc"><div class="ct" style="background:${c.bg}"><svg viewBox="0 0 400 252"><text x="32" y="80" font-family="Arial" font-weight="900" font-style="italic" font-size="${c.n.length>18?30:40}" fill="${c.ink}">${esc(c.n)}</text><path d="M0 205 C140 175 260 230 400 195 V252 H0Z" fill="${c.ac}" opacity=".9"/></svg><span class="ct-f">Atendido na Dimagem Unineuro</span></div><div class="cvc-pe"><span class="sm"><b>${esc(c.n)}</b><br>${c.pac?'Pacote de Ressonância e Tomografia':c.ex.length+' exames credenciados'}</span><button class="cc-ver2" data-act="conv" data-k="${c.id}">Ver lista de exames credenciados</button></div></article>`}
function cartaoEsp(e){return `<article class="cc esp" style="--bg:${e.bg};--ink:#fff;--ac:${e.ac}"><span class="cc-ic" aria-hidden="true">${ICM[e.ic]}</span><span class="cc-mod">${MODM[e.ic]}</span><span class="cc-tipo">Especialidade no MITI</span><b class="cc-nome">${esc(e.n)}</b><span class="cc-sub">${esc(e.d)}</span><button class="cc-ver" data-act="abrir" data-id="9002">Agendar no MITI</button></article>`}
const ICM={"psico": "<svg viewBox=\"0 0 120 120\"><path d=\"M40 104V88c-10-6-18-17-18-31 0-21 16-37 37-37 18 0 33 12 36 29l7 13c1 2 0 4-2 4h-6v10c0 5-4 9-9 9h-9v9\" fill=\"#DDF2F1\" stroke=\"#0B6E6B\" stroke-width=\"4\" stroke-linejoin=\"round\"/><path d=\"M72 84v20\" stroke=\"#0B6E6B\" stroke-width=\"4\" stroke-linecap=\"round\"/><path d=\"M58 62c-7-5-14-9-14-16 0-4 3-7 7-7 3 0 5 2 7 4 2-2 4-4 7-4 4 0 7 3 7 7 0 7-7 11-14 16z\" fill=\"#7CCFB0\" stroke=\"#2E8F6E\" stroke-width=\"3\" stroke-linejoin=\"round\"/><path d=\"M84 18h22a6 6 0 0 1 6 6v12a6 6 0 0 1-6 6h-12l-8 7v-7h-2a6 6 0 0 1-6-6V24a6 6 0 0 1 6-6z\" fill=\"#fff\" stroke=\"#0B6E6B\" stroke-width=\"3.5\" stroke-linejoin=\"round\"/><circle cx=\"88\" cy=\"30\" r=\"2.4\" fill=\"#0B6E6B\"/><circle cx=\"96\" cy=\"30\" r=\"2.4\" fill=\"#0B6E6B\"/><circle cx=\"104\" cy=\"30\" r=\"2.4\" fill=\"#0B6E6B\"/></svg>", "neuro": "<svg viewBox=\"0 0 120 120\"><path d=\"M58 22c-6-6-17-5-21 2-8 0-14 7-12 15-7 4-8 14-2 19-3 7 1 15 9 16 2 8 11 12 18 8 3 3 6 4 8 4z\" fill=\"#DCF3E9\" stroke=\"#17624A\" stroke-width=\"4\" stroke-linejoin=\"round\"/><path d=\"M58 22c6-6 17-5 21 2 8 0 14 7 12 15 7 4 8 14 2 19\" fill=\"none\" stroke=\"#17624A\" stroke-width=\"4\" stroke-linejoin=\"round\"/><path d=\"M58 22v64\" stroke=\"#17624A\" stroke-width=\"3.5\"/><path d=\"M36 40c6 0 9 4 9 9M30 60c5-2 10 0 12 5M48 30c-2 4 0 8 4 9M70 34c-3 4-2 9 3 11M82 52c-5 0-8 3-8 8\" fill=\"none\" stroke=\"#17624A\" stroke-width=\"3\" stroke-linecap=\"round\"/><circle cx=\"84\" cy=\"80\" r=\"16\" fill=\"#fff\" stroke=\"#0B6E6B\" stroke-width=\"4.5\"/><path d=\"M76 80h4l3-6 4 12 3-6h4\" fill=\"none\" stroke=\"#2E8F6E\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M96 92l14 14\" stroke=\"#0B6E6B\" stroke-width=\"7\" stroke-linecap=\"round\"/></svg>", "fisio": "<svg viewBox=\"0 0 120 120\"><rect x=\"10\" y=\"84\" width=\"100\" height=\"8\" rx=\"4\" fill=\"#E0F5F4\" stroke=\"#0A8F8A\" stroke-width=\"3.5\"/><path d=\"M22 92v14M98 92v14\" stroke=\"#0A8F8A\" stroke-width=\"4\" stroke-linecap=\"round\"/><circle cx=\"22\" cy=\"72\" r=\"8\" fill=\"#E0F5F4\" stroke=\"#0A8F8A\" stroke-width=\"3.5\"/><path d=\"M30 78h26\" stroke=\"#0A8F8A\" stroke-width=\"10\" stroke-linecap=\"round\"/><path d=\"M56 78l22-30\" stroke=\"#0A8F8A\" stroke-width=\"9\" stroke-linecap=\"round\"/><path d=\"M56 78h20\" stroke=\"#0A8F8A\" stroke-width=\"9\" stroke-linecap=\"round\" opacity=\".35\"/><circle cx=\"84\" cy=\"22\" r=\"8\" fill=\"#DCF3E9\" stroke=\"#2E8F6E\" stroke-width=\"3.5\"/><path d=\"M88 32l6 26 0 26M94 58l-6 26\" fill=\"none\" stroke=\"#2E8F6E\" stroke-width=\"7\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M90 38l-12 10M92 44l-10 8\" stroke=\"#2E8F6E\" stroke-width=\"5\" stroke-linecap=\"round\"/><circle cx=\"78\" cy=\"48\" r=\"6\" fill=\"#7CCFB0\" stroke=\"#2E8F6E\" stroke-width=\"3\"/><path d=\"M62 40a22 22 0 0 0-6 26\" fill=\"none\" stroke=\"#0A8F8A\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-dasharray=\"1 6\"/><path d=\"M58 40l4 0 0 4\" fill=\"none\" stroke=\"#0A8F8A\" stroke-width=\"3\" stroke-linecap=\"round\"/></svg>", "integ": "<svg viewBox=\"0 0 120 120\"><path d=\"M60 62v46\" stroke=\"#17624A\" stroke-width=\"5\" stroke-linecap=\"round\"/><path d=\"M60 92c-4-12-16-18-28-14 4 12 16 18 28 14z\" fill=\"#7CCFB0\" stroke=\"#17624A\" stroke-width=\"3.5\" stroke-linejoin=\"round\"/><path d=\"M60 82c4-12 16-18 28-14-4 12-16 18-28 14z\" fill=\"#7CCFB0\" stroke=\"#17624A\" stroke-width=\"3.5\" stroke-linejoin=\"round\"/><path d=\"M36 81c8 2 16 6 22 10M84 71c-8 2-16 6-22 10\" stroke=\"#17624A\" stroke-width=\"2\" stroke-linecap=\"round\"/><ellipse cx=\"60\" cy=\"27\" rx=\"8.5\" ry=\"15\" transform=\"rotate(0 60 44)\" fill=\"#BFE8E5\" stroke=\"#0A8F8A\" stroke-width=\"3\"/><ellipse cx=\"60\" cy=\"27\" rx=\"8.5\" ry=\"15\" transform=\"rotate(45 60 44)\" fill=\"#E0F5F4\" stroke=\"#0A8F8A\" stroke-width=\"3\"/><ellipse cx=\"60\" cy=\"27\" rx=\"8.5\" ry=\"15\" transform=\"rotate(90 60 44)\" fill=\"#BFE8E5\" stroke=\"#0A8F8A\" stroke-width=\"3\"/><ellipse cx=\"60\" cy=\"27\" rx=\"8.5\" ry=\"15\" transform=\"rotate(135 60 44)\" fill=\"#E0F5F4\" stroke=\"#0A8F8A\" stroke-width=\"3\"/><ellipse cx=\"60\" cy=\"27\" rx=\"8.5\" ry=\"15\" transform=\"rotate(180 60 44)\" fill=\"#BFE8E5\" stroke=\"#0A8F8A\" stroke-width=\"3\"/><ellipse cx=\"60\" cy=\"27\" rx=\"8.5\" ry=\"15\" transform=\"rotate(225 60 44)\" fill=\"#E0F5F4\" stroke=\"#0A8F8A\" stroke-width=\"3\"/><ellipse cx=\"60\" cy=\"27\" rx=\"8.5\" ry=\"15\" transform=\"rotate(270 60 44)\" fill=\"#BFE8E5\" stroke=\"#0A8F8A\" stroke-width=\"3\"/><ellipse cx=\"60\" cy=\"27\" rx=\"8.5\" ry=\"15\" transform=\"rotate(315 60 44)\" fill=\"#E0F5F4\" stroke=\"#0A8F8A\" stroke-width=\"3\"/><circle cx=\"60\" cy=\"44\" r=\"9\" fill=\"#F2B33D\" stroke=\"#8A5A00\" stroke-width=\"3\"/><circle cx=\"57\" cy=\"42\" r=\"1.6\" fill=\"#8A5A00\"/><circle cx=\"63\" cy=\"43\" r=\"1.6\" fill=\"#8A5A00\"/><circle cx=\"60\" cy=\"47\" r=\"1.6\" fill=\"#8A5A00\"/></svg>"};const MODM={"psico": "Psicoterapia · escuta e acolhimento", "neuro": "Avaliação neuropsicológica", "fisio": "Fisioterapia · alongamento e reabilitação", "integ": "Práticas integrativas e complementares"};
function carrossel(id,itens,rot){return `<div class="car" id="${id}" role="region" aria-roledescription="carrossel" aria-label="${rot}" tabindex="0"><div class="car-tr">${itens.map((h,i)=>`<div class="car-it" data-i="${i}">${h}</div>`).join('')}</div></div>
 <div class="car-ctl"><button class="iconbtn sm2" data-act="carmv" data-c="${id}" data-d="-1" aria-label="Anterior">${I.back('#0B6E6B',18)}</button><span class="sm mut" id="${id}-pos"></span><button class="iconbtn sm2" data-act="carmv" data-c="${id}" data-d="1" aria-label="Próximo">${I.chev('#0B6E6B',18)}</button></div>`}
const CARS={};
function carPos(id){const el=$(id);if(!el)return;const tr=el.firstElementChild,its=[...tr.children];
 its.forEach((it,i)=>{it.setAttribute('aria-hidden',i?'true':'false');it.querySelectorAll('button').forEach(b=>b.tabIndex=i?-1:0)});
 const p=$(id+'-pos');if(p)p.textContent=(+its[0].dataset.i+1)+' de '+its.length}
function carMv(id,d){const el=$(id);if(!el)return;const tr=el.firstElementChild;if(tr.dataset.mv)return;const it=tr.children[0];
 const passo=it.getBoundingClientRect().width+parseFloat(getComputedStyle(tr).columnGap||0);const anim=!(S.a11y&&S.a11y.nomo)&&!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
 if(d>0){if(!anim){tr.appendChild(tr.firstElementChild);carPos(id);return}tr.dataset.mv=1;tr.style.transition='transform .6s cubic-bezier(.2,.8,.2,1)';tr.style.transform=`translateX(${-passo}px)`;
  setTimeout(()=>{tr.style.transition='none';tr.appendChild(tr.firstElementChild);tr.style.transform='translateX(0)';tr.offsetWidth;tr.dataset.mv='';carPos(id)},620)}
 else{tr.style.transition='none';tr.insertBefore(tr.lastElementChild,tr.firstElementChild);if(!anim){carPos(id);return}tr.dataset.mv=1;tr.style.transform=`translateX(${-passo}px)`;tr.offsetWidth;
  tr.style.transition='transform .6s cubic-bezier(.2,.8,.2,1)';tr.style.transform='translateX(0)';setTimeout(()=>{tr.dataset.mv='';carPos(id)},620)}}
function carPausa(el){if(!el)return;el.dataset.p=1;clearTimeout(el._pt);el._pt=setTimeout(()=>{el.dataset.p=''},8000)}
function carIniciar(){clearInterval(CORT.t);['carConv','carEsp'].forEach(id=>{const el=$(id);if(!el)return;carPos(id);
 ['pointerdown','touchstart','focusin','pointerenter'].forEach(ev=>el.addEventListener(ev,()=>carPausa(el),{passive:true}));
 let x0=null;el.addEventListener('touchstart',e=>{x0=e.touches[0].clientX},{passive:true});el.addEventListener('touchend',e=>{if(x0==null)return;const dx=e.changedTouches[0].clientX-x0;x0=null;if(Math.abs(dx)>40)carMv(id,dx<0?1:-1);carPausa(el)})});
 if(S.a11y&&S.a11y.nomo)return;if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 CORT.t=setInterval(()=>{if(document.hidden)return;['carConv','carEsp'].forEach(id=>{const el=$(id);if(el&&!el.dataset.p)carMv(id,1)})},5000)}

vInicio=function(){const n=primeiroNome();
 return `<section class="hero"><h1 class="hello">${n?'Olá, '+esc(n)+'!':'Olá!'} <small>O que você precisa hoje?</small></h1>${origemChip()}</section>
 <section class="sec">${cubosTipo(true)}</section>
 <section class="sec atr">
  <button class="atr-dm" data-act="abrir" data-id="9001"><img src="fotos/9001-1.jpg" alt="" loading="lazy"><span class="atr-v"><span class="atr-n">30<small>anos</small></span><span class="atr-t"><b>Dimagem Unineuro</b><span>Ressonância e tomografia na Lapa</span></span><q>Saúde igual para todos</q></span></button>
  <div class="atr-mt"><span class="atr-cab"><b>MITI</b> · Conjunto Nacional, Av. Paulista</span>
   <button class="atr-c pac" data-act="abrir" data-id="9002"><img src="fotos/9002-2.jpg" alt="" loading="lazy"><span><small>Para o paciente</small><b>Consultas na Paulista, das 8h às 21h</b></span></button>
   <button class="atr-c med" data-act="nav" data-v="coworking"><img src="fotos/9002-4.jpg" alt="" loading="lazy"><span><small>Para o profissional de saúde</small><b>Alugue um consultório por hora ou mês</b></span></button></div>
 </section>
 <section class="sec"><div class="row between"><h2 class="h2">Convênios na Dimagem</h2><button class="lnk" data-act="nav" data-v="convenios">Ver todos</button></div>${carrossel('carConv',CONV.map(cartaoConv),'Convênios aceitos na Dimagem Unineuro')}</section>
 <section class="sec"><h2 class="h2">Especialidades no MITI</h2>${carrossel('carEsp',MITI_ESP.map(cartaoEsp),'Especialidades atendidas no MITI')}</section>
 <section class="sec"><h2 class="h2">Nossos locais</h2><div class="grid">${LOC.map(card).join('')}</div></section>
 <section class="sec"><a class="info red" href="tel:192" style="align-items:center">${I.ambul('#B3261E',28)}<span style="flex:1"><b>Emergência? Ligue 192 (SAMU)</b><br>Bombeiros: 193 · Não espere agendar.</span>${I.phone('#B3261E',22)}</a></section>`};
VIEWS.inicio=vInicio;

VIEWS.convenios=function(){return phead('Convênios na Dimagem','Toque em um convênio para ver os exames credenciados')+`<section class="sec">${buscaForm('qc','Nome do convênio',S.qc||'','qc')}<div class="cvl" id="cvl">${listaConv()}</div></section>`};
function miniConv(c){const k=CARTAO[c.id];return k?`<span class="cv-t" style="${k.bg}">${k.svg}</span>`:`<span class="cv-t" style="background:${c.bg}"><svg viewBox="0 0 400 252"><text x="200" y="140" text-anchor="middle" font-family="Arial" font-weight="900" font-style="italic" font-size="${c.n.length>12?38:52}" fill="${c.ink}">${esc(c.n)}</text><path d="M0 205 C140 175 260 230 400 195 V252 H0Z" fill="${c.ac}"/></svg></span>`}
function listaConv(){const t=norm(S.qc||'');return CONV.filter(c=>!t||norm(c.n).includes(t)).map(c=>`<button class="cv" data-act="conv" data-k="${c.id}">${miniConv(c)}<span class="col" style="flex:1;min-width:0"><b>${esc(c.n)}</b><span class="sm mut">${c.pac?'Pacote: Ressonância e Tomografia':c.ex.length+' exames'}</span></span>${I.chev('#4E6664',16)}</button>`).join('')||'<div class="empty">Nenhum convênio com esse nome.</div>'}
VIEWS.convenio=function(){const c=CONV.find(x=>x.id===S.conv);if(!c)return VIEWS.convenios();
 const g={rm:[],tc:[],out:[]};c.ex.forEach(e=>{const d=norm(e[1]);(/resson|angiorm|\brm\b/.test(d)||e[0].startsWith('4110')?g.rm:/tomog|angiotomo|\btc\b/.test(d)||e[0].startsWith('4100')?g.tc:g.out).push(e)});
 const bloco=(t,l)=>l.length?`<h2 class="h3" style="margin-top:1rem">${t} <span class="sm mut">(${l.length})</span></h2><ul class="exl">${l.map(e=>`<li><span>${esc(e[1])}</span><code>${esc(e[0])}</code></li>`).join('')}</ul>`:'';
 return phead(c.n,'Aceito na Dimagem Unineuro')+`<section class="sec">${CARTAO[c.id]?arteConv(c):`<div class="ct" style="background:${c.bg}"><svg viewBox="0 0 400 252"><text x="32" y="80" font-family="Arial" font-weight="900" font-style="italic" font-size="34" fill="${c.ink}">${esc(c.n)}</text></svg><span class="ct-f">Atendido na Dimagem Unineuro</span></div>`}<p class="sm mut" style="margin:.6rem 0 0">${c.pac?'Atendido em pacote':c.ex.length+' exames credenciados'}</p>
 ${c.pac?`<div class="info" style="margin-top:1rem">${I.info('#0A4B44',20)}<span>Este convênio é atendido em <b>pacote de Ressonância Magnética e Tomografia</b>. Confirme pelo WhatsApp se o seu exame e o seu plano estão incluídos.</span></div>`:
 `${buscaForm('qx','Procurar exame',S.qx||'','qx')}<div id="exbox">${bloco('Ressonância magnética',g.rm)}${bloco('Tomografia',g.tc)}${bloco('Outros procedimentos',g.out)}</div><p class="sm mut">Código TUSS ao lado de cada exame. A cobertura depende do seu plano e da autorização da operadora.</p>`}
 <button class="btn wa" data-act="abrir" data-id="9001" style="margin-top:1rem;width:100%">Agendar na Dimagem</button></section>`};

VIEWS.coworking=function(){const u=S.user||{};return phead('Coworking no MITI','Consultórios para profissionais de saúde na Av. Paulista')+`<section class="sec">
 <div class="cwk"><img src="fotos/9002-4.jpg" alt="Consultório do MITI" loading="lazy"><ul><li>Salas mobiliadas no Conjunto Nacional</li><li>Por hora (avulso) ou plano mensal</li><li>Recepção e agenda das 8h às 21h</li></ul></div>
 <form id="fcw" class="card col" style="gap:.9rem;margin-top:1rem" novalidate><h2 class="h3">Tenho interesse</h2>
 <label class="f">Nome completo<input class="inp" name="nome" autocomplete="name" required value="${esc(u.nome||'')}"></label>
 <label class="f">Registro profissional (CRM, CRP, CREFITO…)<input class="inp" name="registro" required placeholder="Ex.: CRM-SP 123456"></label>
 <label class="f">Especialidade<input class="inp" name="esp" required placeholder="Ex.: Psicologia"></label>
 <label class="f">Celular com DDD<input class="inp" name="tel" inputmode="tel" autocomplete="tel" required value="${esc(u.cel||'')}"></label>
 <label class="f">Como prefere usar<select class="inp" name="per"><option>Por hora (avulso)</option><option>Plano mensal</option><option>Ainda não sei</option></select></label>
 <p class="sm" id="cwmsg" role="status" aria-live="polite"></p><button class="btn pri" type="submit">Enviar interesse</button>
 <p class="sm mut" style="margin:0">A equipe do MITI recebe seus dados e entra em contato. Usamos só para isso.</p></form></section>`};
document.addEventListener('submit',async e=>{if(e.target.id!=='fcw')return;e.preventDefault();const f=e.target,m=$('cwmsg'),b=f.querySelector('button[type=submit]');
 const v={nome:f.nome.value.trim(),reg:f.registro.value.trim(),esp:f.esp.value.trim(),tel:f.tel.value.replace(/\D/g,''),per:f.per.value};
 const err=v.nome.length<3?'Informe seu nome completo.':v.reg.length<3?'Informe seu registro profissional.':v.esp.length<2?'Informe sua especialidade.':!/^\d{10,11}$/.test(v.tel)?'Informe o celular com DDD (10 ou 11 números).':'';
 if(err){m.style.color='#B3261E';m.textContent=err;return}b.disabled=true;m.style.color='';m.textContent='Enviando…';
 try{const r=await fetch(SB5+'/rest/v1/rpc/pax_coworking_enviar',{method:'POST',headers:{apikey:K5,Authorization:'Bearer '+K5,'Content-Type':'application/json'},body:JSON.stringify({p_nome:v.nome,p_registro:v.reg,p_especialidade:v.esp,p_telefone:v.tel,p_periodo:v.per})});const j=await r.json();
  if(r.ok&&j&&j.ok){f.outerHTML=`<div class="info" style="margin-top:1rem">${I.check?I.check('#0A4B44',22):''}<span><b>Interesse enviado.</b> A equipe do MITI vai falar com você pelo celular ${esc(v.tel)}.</span></div>`;return}
  throw 0}catch(x){b.disabled=false;m.style.color='#B3261E';m.textContent='Não foi possível enviar agora. Verifique a internet e tente de novo.'}});

document.addEventListener('click',e=>{const t=e.target.closest('[data-act]');if(!t)return;const a=t.dataset.act;
 if(a==='conv'){S.conv=t.dataset.k;S.qx='';fecharMenu('nav');ir('convenio')}
 else if(a==='carmv'){carMv(t.dataset.c,+t.dataset.d);carPausa($(t.dataset.c))}});
document.addEventListener('input',e=>{const t=e.target;if(t.dataset&&t.dataset.live==='qc'){S.qc=t.value;const b=$('cvl');if(b)b.innerHTML=listaConv()}
 if(t.dataset&&t.dataset.live==='qx'){S.qx=t.value;const q=norm(t.value);document.querySelectorAll('#exbox li').forEach(li=>{li.hidden=!!q&&!norm(li.textContent).includes(q)})}});
const _render6=render;render=function(a){_render6(a);if(S.view==='inicio')carIniciar();else clearInterval(CORT.t)};
const _abrirMenu6=abrirMenu;abrirMenu=function(){_abrirMenu6();const g=document.querySelector('.drawer .grp');if(g)g.insertAdjacentHTML('beforebegin',`<span class="grp">DIMAGEM E MITI</span><button class="it" data-act="nav" data-v="convenios"><span class="lic">${I.shield('#0B6E6B',20)}</span><span style="flex:1"><b>Convênios e exames</b><small>O que a Dimagem aceita</small></span></button><button class="it" data-act="nav" data-v="coworking"><span class="lic">${I.build?I.build('#0B6E6B',20):''}</span><span style="flex:1"><b>Coworking no MITI</b><small>Para profissionais de saúde</small></span></button>`)};


/* ============ v6.1: menu inferior com recorte (esboço B2) ============ */
const _navBar61=navBar;navBar=function(){_navBar61();const nav=$('nav');if(!nav||innerWidth>=900)return;
 const bs=[...nav.querySelectorAll(':scope>button')],i=Math.max(0,bs.findIndex(b=>b.getAttribute('aria-current')==='page'));
 const W=nav.clientWidth||innerWidth,H=nav.clientHeight||80,cw=W/bs.length,cx=cw*i+cw/2,top=16,r=19,R=25,rc=10,yc=top+rc;
 const L=Math.max(cx-R-rc,20),Rr=Math.min(cx+R+rc,W-20);const d=`M0 ${top+20} Q0 ${top} 20 ${top} L${L} ${top} A${rc} ${rc} 0 0 1 ${cx-R} ${yc} A${R} ${R} 0 0 0 ${cx+R} ${yc} A${rc} ${rc} 0 0 1 ${cx+R+rc} ${top} L${Math.max(Rr,W-20)} ${top} Q${W} ${top} ${W} ${top+20} L${W} ${H} L0 ${H}Z`;
 const b=bs[i],svg=b?b.querySelector('svg'):null;
 nav.insertAdjacentHTML('afterbegin',`<svg class="navbg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><path d="${d}" fill="#0E4D45"/></svg><span class="navball" aria-hidden="true" style="left:${cx-r}px;top:${yc+2-r}px">${svg?svg.outerHTML:''}</span>`);
 const bl=nav.querySelector('.navball svg');if(bl){bl.setAttribute('stroke','#0B6E6B');bl.setAttribute('width','20');bl.setAttribute('height','20');bl.querySelectorAll('[stroke]').forEach(e=>e.setAttribute('stroke','#0B6E6B'))}};
addEventListener('resize',()=>{clearTimeout(window._nr);window._nr=setTimeout(navBar,150)});

/* ============ v7: fluxo do paciente (pedido de exame, consulta, confirmação e lembrete) ============ */
const VAPID='BMJfFkD1_9mFOq5MywP8rKyyeLJwCZfmCGoIH65AYrfzI6nbBXXH_p4oH0NLzpm7MORQjdKnsYmAt9LGAAEskpM';
S.peds=LS.get('peds',[]);const salvaPeds=()=>LS.set('peds',S.peds);
const DIM=()=>byId(9001),MITI=()=>byId(9002);
const EXAMES=(()=>{const m=new Map();CONV.forEach(c=>c.ex.forEach(([k,n])=>{if(!m.has(n))m.set(n,k)}));return [...m.keys()].sort((a,b)=>a.localeCompare(b,'pt'))})();
function convDoUser(){const u=S.user||{};const t=norm(u.conv||'');if(!t||/particular/.test(t))return null;return CONV.find(c=>norm(c.n).includes(t)||t.includes(norm(c.n).split(' ')[0]))||null}
function rpc(nome,body){return fetch(SB5+'/rest/v1/rpc/'+nome,{method:'POST',headers:{apikey:K5,Authorization:'Bearer '+K5,'Content-Type':'application/json'},body:JSON.stringify(body)}).then(r=>r.json())}
function novoFluxo(tipo){const c=convDoUser();S.fx={tipo,step:1,foto:null,exame:'',esp:'',pag:c?'conv':'part',conv:c?c.id:'',troca:false,turno:'',semana:''}}
const SEL='<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>';

/* ---- tela inicial ---- */
vInicio=function(){const n=primeiroNome();const pend=S.peds.filter(p=>p.st==='pend');
 return `<section class="hero"><h1 class="hello">${n?'Olá, '+esc(n)+'!':'Olá!'} <small>Como podemos ajudar?</small></h1>${origemChip()}</section>
 ${LS.get('seloX',0)?'':`<div class="faixa-t"><span>⚡ <b>Resposta no WhatsApp em até 15 min</b> · após o expediente, a partir das 7h</span><button data-act="seloX" aria-label="Fechar aviso">✕</button></div>`}
 ${pend.length?`<section class="sec"><button class="aviso-conf" data-act="nav" data-v="agenda"><span class="ac-ic">${I.clock('#0B6E6B',22)}</span><span><b>A clínica já marcou seu horário?</b><small>${pend.length===1?esc(pend[0].item):pend.length+' pedidos aguardando'} · toque para informar</small></span>${I.chev('#0B6E6B',18)}</button></section>`:''}
 <section class="sec acoes2">
  <button class="acao2 ex" data-act="fluxo" data-t="exame"><span class="acao-ic">${I.doc('#fff',28)}</span><b>Exames</b><small>Ressonância e tomografia · Dimagem</small></button>
  <button class="acao2 co" data-act="fluxo" data-t="consulta"><span class="acao-ic">${I.steth('#fff',28)}</span><b>Consultas</b><small>Especialidades · MITI, Av. Paulista</small></button>
  <button class="acao ag" data-act="nav" data-v="agenda"><span class="acao-ic">${I.clock('#0B6E6B',26)}</span><span><b>Minha agenda</b><small>${S.peds.length?S.peds.length+' agendamento'+(S.peds.length>1?'s':''):'Seus agendamentos aparecem aqui'}</small></span>${I.chev('#0B6E6B',22)}</button>
 </section>
 <section class="sec apres"><h2 class="h2">Apresentação</h2>
  <div class="apr-card"><div class="apr-fotos"><img src="fotos/dim-rm.jpg" alt="Sala de ressonância magnética da Dimagem" loading="lazy"><img src="fotos/dim-tc.jpg" alt="Exame de ressonância em andamento" loading="lazy"><img src="fotos/dim-recepcao.jpg" alt="Recepção da Dimagem" loading="lazy"></div>
  <div class="apr-txt"><span class="apr-k">Dimagem Unineuro</span><h3>Diagnóstico por imagem com 30 anos de confiança</h3>
  <p>Ressonância e tomografia com equipamentos modernos, laudos de especialistas e um atendimento que acolhe você do agendamento ao resultado.</p>
  <ul><li><b>30 anos</b><span>de história na Lapa</span></li><li><b>31</b><span>convênios aceitos</span></li><li><b>RM e TC</b><span>no mesmo lugar</span></li></ul>
  <q>Saúde igual para todos</q>
  <button class="btn pri" data-act="fluxo" data-t="exame">Agendar meu exame</button></div></div>
 </section>
 <section class="sec atr">
  <div class="atr-mt"><span class="atr-cab"><b>MITI</b> · Conjunto Nacional, Av. Paulista</span>
   <button class="atr-c pac" data-act="fluxo" data-t="consulta"><img src="fotos/9002-2.jpg" alt="" loading="lazy"><span><small>Para o paciente</small><b>Consultas na Paulista, das 8h às 21h</b></span></button>
   <button class="atr-c med" data-act="nav" data-v="coworking"><img src="fotos/9002-4.jpg" alt="" loading="lazy"><span><small>Para o profissional de saúde</small><b>Alugue um consultório por hora ou mês</b></span></button></div>
 </section>
 <section class="sec"><div class="row between"><h2 class="h2">Convênios na Dimagem</h2><button class="lnk" data-act="nav" data-v="convenios">Ver todos</button></div>${carrossel('carConv',CONV.map(cartaoConv),'Convênios aceitos na Dimagem Unineuro')}</section>
 <section class="sec"><h2 class="h2">Especialidades no MITI</h2>${carrossel('carEsp',MITI_ESP.map(cartaoEsp),'Especialidades atendidas no MITI')}</section>
 <section class="sec"><h2 class="h2">Nossos locais</h2><div class="grid">${LOC.map(card).join('')}</div></section>
 <section class="sec"><a class="info red" href="tel:192" style="align-items:center">${I.ambul('#B3261E',28)}<span style="flex:1"><b>Emergência? Ligue 192 (SAMU)</b><br>Bombeiros: 193 · Não espere agendar.</span>${I.phone('#B3261E',22)}</a></section>`};
VIEWS.inicio=vInicio;
VIEWS.novo=function(){return phead('O que você precisa?','Escolha uma opção',false)+`<section class="sec acoes">
 <button class="acao ex" data-act="fluxo" data-t="exame"><span class="acao-ic">${I.steth('#fff',30)}</span><span><b>Tenho um pedido de exame</b><small>Ressonância ou tomografia na Dimagem</small></span>${I.chev('#fff',22)}</button>
 <button class="acao co" data-act="fluxo" data-t="consulta"><span class="acao-ic">${I.steth('#fff',30)}</span><span><b>Quero marcar uma consulta</b><small>Especialidades no MITI</small></span>${I.chev('#fff',22)}</button></section>`};

/* ---- fluxo ---- */
function passos(n,tot){return `<div class="passos" aria-label="Passo ${n} de ${tot}">${[...Array(tot)].map((_,i)=>`<i class="${i<n?'on':''}"></i>`).join('')}<span class="sm mut">Passo ${n} de ${tot}</span></div>`}
function blocoPag(){const f=S.fx,c=CONV.find(x=>x.id===f.conv);const cob=f.tipo==='exame'&&f.pag==='conv'&&c?(c.pac?'Atendido em pacote de Ressonância e Tomografia':f.exame?(c.ex.some(e=>e[1]===f.exame)?'✓ Seu convênio cobre este exame na Dimagem':'Este exame não está na tabela do seu convênio. A equipe confirma ou você pode fazer Vitta Particular.'):'✓ Convênio aceito na Dimagem'):'';
 return `<div class="pag-cartao">${f.pag==='conv'&&c?arteConv(c):`<div class="ct" style="background:linear-gradient(135deg,#0B6E6B,#0A8F8A)"><svg viewBox="0 0 400 252"><text x="32" y="90" font-family="Arial" font-weight="900" font-size="46" fill="#fff">Particular</text><text x="34" y="150" font-family="Arial" font-weight="700" font-size="22" fill="#7CCFB0">VittaOne</text><text x="34" y="124" font-family="Arial" font-size="18" fill="#E0F5F4">Valor informado no atendimento</text></svg></div>`}</div>
 ${cob?`<p class="cob ${/^✓|pacote/.test(cob)?'ok':'warn'}">${esc(cob)}</p>`:''}
 <div class="opts" role="radiogroup" aria-label="Forma de pagamento">
  ${convDoUser()?`<button class="opt ${f.pag==='conv'&&!f.troca&&f.conv===convDoUser().id?'on':''}" data-act="fpag" data-v="meu" role="radio">${SEL}<span><b>Usar meu convênio</b><small>${esc(convDoUser().n)}</small></span></button>`:''}
  <button class="opt ${f.troca?'on':''}" data-act="fpag" data-v="troca" role="radio">${SEL}<span><b>${convDoUser()?'Trocar convênio':'Usar convênio'}</b><small>Escolher outro da lista</small></span></button>
  <button class="opt ${f.pag==='part'?'on':''}" data-act="fpag" data-v="part" role="radio">${SEL}<span><b>Vitta Particular</b><small>Valor sob consulta</small></span></button>
 </div>
 ${f.troca?`<label class="f">Convênio<select class="inp" id="fconv"><option value="">Escolha o convênio</option>${CONV.map(x=>`<option value="${x.id}" ${x.id===f.conv?'selected':''}>${esc(x.n)}</option>`).join('')}</select></label>`:''}`}
function chips(nome,vals,atual){return `<div class="chips">${vals.map(([v,t])=>`<button class="chip2 ${atual===v?'on':''}" data-act="fchip" data-k="${nome}" data-v="${v}">${t}</button>`).join('')}</div>`}
VIEWS.fluxo=function(){const f=S.fx;if(!f)return VIEWS.novo();const ex=f.tipo==='exame',tot=4;let h='';
 if(f.step===1&&ex)h=`<h2 class="h2">Foto do pedido médico</h2><p class="mut">A equipe vê o pedido e já agenda o exame certo.</p>
  ${f.foto?`<div class="foto-prev"><img src="${f.foto}" alt="Pedido médico"><button class="btn" data-act="ffoto-x">Trocar foto</button></div>`:`<label class="foto-btn"><input type="file" accept="image/*" capture="environment" id="ffile" hidden><svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg><b>Fotografar pedido médico</b><small>ou escolher da galeria</small></label>`}
  <div class="info" style="margin-top:.8rem">${I.info('#0A4B44',20)}<span><b>Leve o pedido original no dia do exame.</b> A foto fica guardada com segurança por 14 dias e depois é apagada automaticamente.</span></div>
  ${f.foto?'':`<details class="semfoto" ${f.exame?'open':''}><summary>Não tenho o pedido agora</summary>${buscaForm('qe','Qual exame?',S.qe||'','qe')}<div class="exsel" id="exsel">${listaEx()}</div></details>`}
  <button class="btn pri big" data-act="fprox" ${f.foto||f.exame?'':'disabled'}>Continuar</button>`;
 if(f.step===1&&!ex)h=`<h2 class="h2">Qual especialidade?</h2><div class="esps">${MITI_ESP.map(e=>`<button class="espb ${f.esp===e.n?'on':''}" data-act="fesp" data-v="${esc(e.n)}" style="--bg:${e.bg};--ac:${e.ac}"><span class="espb-ic">${ICM[e.ic]}</span><b>${esc(e.n)}</b></button>`).join('')}</div>
  <button class="btn pri big" data-act="fprox" ${f.esp?'':'disabled'}>Continuar</button>`;
 if(f.step===2)h=`<h2 class="h2">Confirme o pagamento</h2>${blocoPag()}<button class="btn pri big" data-act="fprox" ${f.pag==='part'||f.conv?'':'disabled'}>Confirmar</button>`;
 if(f.step===3)h=`<h2 class="h2">Sua preferência</h2><h3 class="h3">Turno</h3>${chips('turno',[['manha','Manhã'],['tarde','Tarde'],['noite','Noite']],f.turno)}
  <h3 class="h3" style="margin-top:1rem">Semana</h3>${chips('semana',[['esta','Esta semana'],['proxima','Próxima semana']],f.semana)}
  <button class="btn pri big" data-act="fprox" ${f.turno&&f.semana?'':'disabled'}>Continuar</button>`;
 if(f.step===4){const c=CONV.find(x=>x.id===f.conv);const loc=ex?DIM():MITI();
  h=`<h2 class="h2">Tudo certo! Confira</h2><div class="card resumo">
  <div class="rl"><span>Local</span><b>${esc(loc.n)}</b></div>
  <div class="rl"><span>${ex?'Exame':'Especialidade'}</span><b>${ex?esc((f.exames||[]).join(', ')||'Conforme pedido médico'):esc(f.esp)}</b></div>
  <div class="rl"><span>Pagamento</span><b>${f.pag==='part'?'Vitta Particular':esc(c?c.n:'')}</b></div>
  <div class="rl"><span>Preferência</span><b>${{manha:'Manhã',tarde:'Tarde',noite:'Noite'}[f.turno]}, ${f.semana==='esta'?'esta semana':'próxima semana'}</b></div></div>
  <p class="sm mut">${ex?'A Dimagem responde em até 15 minutos. Mensagens após o expediente são respondidas a partir das 7h.':'O MITI responde em até 30 a 60 minutos.'}</p>
  <p class="sm" id="fmsg" role="status" aria-live="polite"></p>
  <button class="btn wa big" data-act="fenviar">${ICW} Enviar pelo WhatsApp</button>`}
 return phead(ex?'Pedido de exame':'Marcar consulta',ex?'Dimagem Unineuro':'MITI · Av. Paulista')+`<section class="sec fluxo">${passos(f.step,tot)}${h}${f.step>1?`<button class="lnk" data-act="fvolta" style="margin-top:.6rem">Voltar ao passo anterior</button>`:''}</section>`};
function listaEx(){const t=norm(S.qe||'');const l=t?EXAMES.filter(n=>norm(n).includes(t)).slice(0,30):EXAMES.slice(0,0);
 return l.map(n=>`<button class="exo ${S.fx&&S.fx.exame===n?'on':''}" data-act="fexame" data-v="${esc(n)}">${S.fx&&S.fx.exame===n?SEL:''}<span>${esc(n)}</span></button>`).join('')||`<p class="sm mut">${t?'Nenhum exame com esse nome.':'Digite parte do nome, por exemplo "crânio" ou "joelho".'}</p>`}
function comprimir(file){return new Promise((ok,er)=>{const img=new Image();img.onload=()=>{let q=.72,w=img.width,h=img.height,m=1600;if(w>m||h>m){const r=Math.min(m/w,m/h);w=Math.round(w*r);h=Math.round(h*r)}
 const cv=document.createElement('canvas');cv.width=w;cv.height=h;cv.getContext('2d').drawImage(img,0,0,w,h);let d=cv.toDataURL('image/jpeg',q);while(d.length>600000&&q>.35){q-=.1;d=cv.toDataURL('image/jpeg',q)}URL.revokeObjectURL(img.src);ok(d)};img.onerror=er;img.src=URL.createObjectURL(file)})}
function msgFluxo(f,link){const u=S.user||{},c=CONV.find(x=>x.id===f.conv),ex=f.tipo==='exame';
 const pag=f.pag==='part'?'Vitta Particular':(c?c.n:'');const pref=`${{manha:'manhã',tarde:'tarde',noite:'noite'}[f.turno]}, ${f.semana==='esta'?'esta semana':'próxima semana'}`;
 return `Olá! Vim pelo app VittaOne e gostaria de agendar ${ex?'um exame':'uma consulta de '+f.esp}.\n\nPaciente: ${u.nome||''}\nCelular: ${u.cel||''}\nPagamento: ${pag}\n${ex?(link?'Pedido médico (foto): '+link:'Exame: '+f.exame)+'\n':''}Preferência: ${pref}\n\nQuais horários vocês têm?`}
async function enviarFluxo(){const f=S.fx,m=$('fmsg'),b=document.querySelector('[data-act=fenviar]');const ex=f.tipo==='exame',loc=ex?DIM():MITI();let link='';
 if(b)b.disabled=true;
 {const u=S.user||{},c=CONV.find(x=>x.id===f.conv);const reg={tipo:f.tipo,nome:u.nome||'',telefone:u.cel||'',local:loc.n||loc.id,itens:ex?((f.exames||[]).join('; ')||'Conforme pedido médico'):f.esp,pagamento:f.pag==='part'?'Vitta Particular':'Pro Bono'+(c?' · '+c.n:''),forma:f.pag==='part'?(f.forma==='adiant'?'adiantamento':'no local'):'',convenio_lido:f.convLido||'',preferencia:f.turno?`${{manha:'Manhã',tarde:'Tarde',noite:'Noite'}[f.turno]}, ${f.semana==='esta'?'esta semana':'próxima semana'}`:'',img:f.foto||''};
 if(f.foto)m.textContent='Enviando a foto do pedido…';
 try{const j=await rpc('pax_pedido_registrar',{p:reg});if(!j||!j.ok)throw 0;if(f.foto)link=(/^https:/.test(location.protocol)?location.origin+'/':'https://vittaone-app.vercel.app/')+'#p='+j.id}
 catch(e){if(f.foto){m.style.color='#B3261E';m.textContent='Não consegui enviar a foto agora. Verifique a internet e tente de novo.';if(b)b.disabled=false;return}}}
 const ped={id:Date.now().toString(36),tipo:f.tipo,loc:loc.id,item:ex?((f.exames||[]).join(', ')||'Exame conforme pedido médico'):f.esp,pag:f.pag==='part'?'Vitta Particular':(CONV.find(x=>x.id===f.conv)||{}).n||'',pref:`${{manha:'Manhã',tarde:'Tarde',noite:'Noite'}[f.turno]}, ${f.semana==='esta'?'esta semana':'próxima semana'}`,st:'pend',criado:Date.now()};
 S.peds.unshift(ped);salvaPeds();location.href=waUrl(loc,msgFluxo(f,link));S.fx=null;S.enviado=ped.id;setTimeout(()=>ir('enviado'),400)}
VIEWS.enviado=function(){const p=S.peds.find(x=>x.id===S.enviado)||S.peds[0];if(!p)return vInicio();const ex=p.tipo==='exame';
 return `<section class="sec ok-tela"><div class="ok-ic">${SEL.replace('width="20" height="20"','width="54" height="54"')}</div><h1 class="h1">Pedido enviado!</h1>
 <p class="mut">${ex?'A Dimagem responde no WhatsApp em até <b>15 minutos</b>.':'O MITI responde no WhatsApp em até <b>30 a 60 minutos</b>.'}</p>
 <div class="card col" style="gap:.5rem;text-align:left"><b>O que acontece agora</b><span class="sm">1. A equipe responde com os horários disponíveis.</span><span class="sm">2. Você escolhe o horário com ela pelo WhatsApp.</span><span class="sm">3. Volte aqui e toque em <b>“Já marquei”</b> para guardar na agenda e receber o lembrete.</span>${ex?'<span class="sm">As orientações de preparo são passadas pela equipe no agendamento. Leve o pedido original.</span>':''}</div>
 <button class="btn pri big" data-act="conf-ab" data-id="${p.id}">Já marquei, informar data</button><button class="btn" data-act="nav" data-v="agenda">Ver minha agenda</button></section>`};

/* ---- agenda ---- */
function fmtData(d){try{return new Date(d+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long'})}catch(e){return d}}
VIEWS.agenda=function(){const ps=S.peds;
 return phead('Minha agenda',ps.length?`${ps.filter(p=>p.st==='pend').length} aguardando · ${ps.filter(p=>p.st==='ok').length} marcados`:'Seus agendamentos aparecem aqui',false)+`<section class="sec">${ps.length?ps.map(p=>{const l=byId(p.loc)||{};
  if(p.st==='pend')return `<div class="card ag pend"><div class="row between"><span class="tag warn">Aguardando a clínica</span><span class="sm mut">${new Date(p.criado).toLocaleDateString('pt-BR')}</span></div><b>${esc(p.item)}</b><span class="sm mut">${esc(l.n||'')} · ${esc(p.pag)} · ${esc(p.pref)}</span>
   ${S.confAb===p.id?`<div class="conf"><b>Quando ficou marcado?</b><div class="row" style="gap:.6rem"><label class="f" style="flex:1">Data<input class="inp" type="date" id="cd" min="${new Date().toISOString().slice(0,10)}"></label><label class="f" style="flex:1">Hora<input class="inp" type="time" id="ch"></label></div><p class="sm" id="cmsg" role="status"></p><button class="btn pri" data-act="conf-ok" data-id="${p.id}">Salvar na agenda</button></div>`
   :`<p class="sm" style="margin:.4rem 0 0"><b>A clínica já marcou seu horário?</b></p><div class="row" style="gap:.5rem"><button class="btn pri" data-act="conf-ab" data-id="${p.id}" style="flex:1">Sim, informar</button><button class="btn" data-act="ag-wa" data-id="${p.id}" style="flex:1">Falar de novo</button></div>`}
   <button class="lnk" data-act="ag-del" data-id="${p.id}" style="color:#B3261E">Remover</button></div>`;
  return `<div class="card ag ok"><div class="row between"><span class="tag">Marcado</span>${p.lemb?`<span class="sm mut">🔔 Lembrete 1 dia antes</span>`:''}</div><b class="ag-dt">${esc(fmtData(p.data))} · ${esc(p.hora)}</b><b>${esc(p.item)}</b><span class="sm mut">${esc(l.n||'')} · ${esc(p.pag)}</span><span class="sm mut">${esc(limpaEnd?limpaEnd(l.e||''):l.e||'')}</span>
   <span class="sm">${p.tipo==='exame'?'Leve o pedido original e um documento com foto. Siga as orientações de preparo passadas pela equipe.':'Chegue 10 minutos antes.'}</span>
   <div class="ag-bts"><button class="btn" data-act="rota" data-id="${p.loc}">Como chegar</button><button class="btn" data-act="ag-ics" data-id="${p.id}">Adicionar ao calendário</button><button class="btn" data-act="ag-rem" data-id="${p.id}">Preciso remarcar</button></div>
   <button class="lnk" data-act="ag-del" data-id="${p.id}" style="color:#B3261E">Remover</button></div>`}).join(''):`<div class="empty">Você ainda não tem agendamentos.<br><button class="btn pri" data-act="nav" data-v="novo" style="margin-top:1rem">Agendar agora</button></div>`}</section>`};
async function ativarLembrete(p){try{if(!('serviceWorker' in navigator)||!('PushManager' in window)||!('Notification' in window))return null;
 const perm=await Notification.requestPermission();if(perm!=='granted')return null;const reg=await navigator.serviceWorker.ready;
 const k=Uint8Array.from(atob(VAPID.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-VAPID.length%4)%4)),c=>c.charCodeAt(0));
 const sub=(await reg.pushManager.getSubscription())||(await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:k}));const j=sub.toJSON();
 const d=new Date(p.data+'T10:00:00-03:00');d.setDate(d.getDate()-1);if(d<new Date())return null;const l=byId(p.loc)||{};
 const r=await rpc('pax_lembrete_agendar',{p_endpoint:j.endpoint,p_p256dh:j.keys.p256dh,p_auth:j.keys.auth,p_quando:d.toISOString(),p_titulo:'Amanhã: '+(p.tipo==='exame'?'seu exame':'sua consulta'),p_corpo:`${p.item} às ${p.hora} · ${l.n||''}. ${p.tipo==='exame'?'Leve o pedido original.':''}`});return r&&r.ok?r.id:null}catch(e){return null}}
function icsDe(p){const l=byId(p.loc)||{};const [y,mo,d]=p.data.split('-'),[hh,mm]=p.hora.split(':');const dt=`${y}${mo}${d}T${hh}${mm}00`;const end=new Date(`${p.data}T${p.hora}:00`);end.setHours(end.getHours()+1);const pad=n=>String(n).padStart(2,'0');const de=`${end.getFullYear()}${pad(end.getMonth()+1)}${pad(end.getDate())}T${pad(end.getHours())}${pad(end.getMinutes())}00`;
 const t=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Pax Saude//PT','BEGIN:VEVENT','UID:'+p.id+'@paxsaude','DTSTAMP:'+new Date().toISOString().replace(/[-:]/g,'').slice(0,15)+'Z','DTSTART;TZID=America/Sao_Paulo:'+dt,'DTEND;TZID=America/Sao_Paulo:'+de,'SUMMARY:'+p.item+' - '+(l.n||''),'LOCATION:'+(l.e||'').replace(/,/g,'\\,'),'DESCRIPTION:'+(p.tipo==='exame'?'Leve o pedido original.':'Chegue 10 minutos antes.'),'BEGIN:VALARM','TRIGGER:-P1D','ACTION:DISPLAY','DESCRIPTION:Lembrete','END:VALARM','END:VEVENT','END:VCALENDAR'].join('\r\n');
 const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([t],{type:'text/calendar'}));a.download='agendamento.ics';document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)}

/* ---- eventos ---- */
document.addEventListener('click',async e=>{const t=e.target.closest('[data-act]');if(!t)return;const a=t.dataset.act,f=S.fx;
 if(a==='fluxo'){novoFluxo(t.dataset.t);S.qe='';ir('fluxo')}
 else if(a==='fprox'&&f){f.step++;render();scrollTo(0,0)}
 else if(a==='fvolta'&&f){f.step=Math.max(1,f.step-1);render()}
 else if(a==='fesp'&&f){f.esp=t.dataset.v;render()}
 else if(a==='fexame'&&f){f.exame=t.dataset.v;f.foto=null;render()}
 else if(a==='ffoto-x'&&f){f.foto=null;render()}
 else if(a==='fpag'&&f){const v=t.dataset.v;if(v==='meu'){f.pag='conv';f.troca=false;f.conv=convDoUser().id}else if(v==='troca'){f.pag='conv';f.troca=true;f.conv=''}else{f.pag='part';f.troca=false;f.conv=''}render()}
 else if(a==='fchip'&&f){f[t.dataset.k]=t.dataset.v;render()}
 else if(a==='fenviar'&&f){enviarFluxo()}
 else if(a==='conf-ab'){S.confAb=t.dataset.id;ir('agenda');setTimeout(()=>{const d=$('cd');if(d)d.focus()},200)}
 else if(a==='conf-ok'){const p=S.peds.find(x=>x.id===t.dataset.id),d=$('cd').value,h=$('ch').value,m=$('cmsg');if(!d||!h){m.style.color='#B3261E';m.textContent='Informe a data e a hora.';return}
  p.data=d;p.hora=h;p.st='ok';S.confAb=null;salvaPeds();m.textContent='Salvando…';p.lemb=await ativarLembrete(p);salvaPeds();render();toast(p.lemb?'Salvo! Você recebe um lembrete 1 dia antes.':'Salvo na agenda.')}
 else if(a==='ag-wa'){const p=S.peds.find(x=>x.id===t.dataset.id);const l=byId(p.loc);location.href=waUrl(l,`Olá! Enviei um pedido pelo app VittaOne (${p.item}, ${p.pag}, ${p.pref}) e ainda aguardo os horários. Podem me ajudar?`)}
 else if(a==='ag-rem'){const p=S.peds.find(x=>x.id===t.dataset.id);const l=byId(p.loc);location.href=waUrl(l,`Olá! Preciso remarcar meu agendamento: ${p.item}, ${fmtData(p.data)} às ${p.hora}. Paciente: ${(S.user||{}).nome||''}. Quais outros horários vocês têm?`)}
 else if(a==='ag-ics'){icsDe(S.peds.find(x=>x.id===t.dataset.id))}
 else if(a==='ag-del'){const i=S.peds.findIndex(x=>x.id===t.dataset.id);if(i>=0&&confirm('Remover este agendamento da sua agenda?')){const p=S.peds[i];if(p.lemb)rpc('pax_lembrete_cancelar',{p_id:p.lemb}).catch(()=>{});S.peds.splice(i,1);salvaPeds();render()}}});
document.addEventListener('change',async e=>{const t=e.target;if(t.id==='ffile'&&t.files&&t.files[0]&&S.fx){try{S.fx.foto=await comprimir(t.files[0]);S.fx.exame='';S.fx.lido=null;S.fx.exames=[];render()}catch(x){toast('Não consegui ler a foto. Tente outra.')}}
 if(t.id==='fconv'&&S.fx){S.fx.conv=t.value;render()}});
document.addEventListener('input',e=>{const t=e.target;if(t.dataset&&t.dataset.live==='qe'){S.qe=t.value;const b=$('exsel');if(b)b.innerHTML=listaEx()}});

/* ---- visualizador do pedido (link enviado à clínica) ---- */
if(/^#p=[0-9a-f-]{36}$/.test(location.hash)){const id=location.hash.slice(3);document.body.className='pedv';document.body.innerHTML='<main class="pedv-w"><p>Carregando o pedido…</p></main>';
 rpc('pax_pedido_ver',{p_id:id}).then(j=>{const w=document.querySelector('.pedv-w');if(!j||!j.ok){w.innerHTML='<h1>Pedido indisponível</h1><p>Este link expirou ou não existe. As fotos ficam disponíveis por 14 dias.</p>';return}
  const ate=new Date(j.expira).toLocaleDateString('pt-BR');w.innerHTML=`<h1>Pedido médico enviado pelo app VittaOne</h1><p>Disponível até ${ate}. Depois disso a foto é apagada automaticamente.</p><img src="${j.img}" alt="Pedido médico"><a download="pedido-medico.jpg" href="${j.img}">Baixar imagem</a>`}).catch(()=>{document.querySelector('.pedv-w').innerHTML='<p>Não foi possível carregar. Tente de novo.</p>'})}


/* ============ v7.1: início lado a lado, faixa de tempo, apresentação, leitura do pedido ============ */
vInicio=function(){const n=primeiroNome();const pend=S.peds.filter(p=>p.st==='pend');const faixa=!LS.get('faixaX',0);
 return `<section class="hero">${'<h1 class="hello">'+(n?'Olá, '+esc(n)+'!':'Olá!')+' <small>Como podemos ajudar?</small></h1>'}${origemChip()}</section>
 ${faixa?`<div class="faixa" role="note"><span>⚡ <b>Resposta no WhatsApp em até 15 min</b> · após o expediente, a partir das 7h</span><button data-act="faixa-x" aria-label="Fechar aviso">${I.x('#0E3D2E',16)}</button></div>`:''}
 ${pend.length?`<section class="sec"><button class="aviso-conf" data-act="nav" data-v="agenda"><span class="ac-ic">${I.clock('#0B6E6B',22)}</span><span><b>A clínica já marcou seu horário?</b><small>${pend.length===1?esc(pend[0].item):pend.length+' pedidos aguardando'} · toque para informar</small></span>${I.chev('#0B6E6B',18)}</button></section>`:''}
 <section class="sec duo">
  <button class="duo-b ex" data-act="fluxo" data-t="exame"><span class="duo-ic">${I.doc('#fff',28)}</span><b>Exames</b><small>Tenho um pedido médico</small><span class="duo-l">Dimagem Unineuro</span></button>
  <button class="duo-b co" data-act="fluxo" data-t="consulta"><span class="duo-ic">${I.steth('#fff',28)}</span><b>Consultas</b><small>Marcar com especialista</small><span class="duo-l">MITI · Paulista</span></button>
 </section>
 <section class="sec" style="padding-top:0"><button class="acao ag" data-act="nav" data-v="agenda"><span class="acao-ic">${I.clock('#0B6E6B',26)}</span><span><b>Minha agenda</b><small>${S.peds.length?S.peds.length+' agendamento'+(S.peds.length>1?'s':''):'Seus agendamentos aparecem aqui'}</small></span>${I.chev('#0B6E6B',22)}</button></section>
 <section class="sec apres"><h2 class="h2">Apresentação</h2>
  <article class="ap dm">
   <div class="ap-fotos"><img class="g" src="fotos/dm-rm.jpg" alt="Sala de ressonância magnética da Dimagem" loading="lazy"><img src="fotos/dm-rm2.jpg" alt="Paciente em exame de ressonância" loading="lazy"><img src="fotos/dm-recepcao.jpg" alt="Recepção" loading="lazy"></div>
   <div class="ap-tx"><span class="ap-k">Dimagem Unineuro</span><h3>30 anos cuidando do seu diagnóstico</h3><q>Saúde igual para todos</q>
    <ul class="ap-pt"><li><b>Ressonância e tomografia</b> com equipamentos modernos</li><li><b>Convênios e particular</b>: 30 planos aceitos</li><li><b>Na Lapa</b>, junto ao Hospital Albert Sabin</li></ul>
    <button class="btn pri" data-act="fluxo" data-t="exame">Agendar meu exame</button></div>
  </article>
  <article class="ap mt">
   <div class="ap-fotos"><img class="g" src="fotos/9002-1.jpg" alt="Consultório do MITI" loading="lazy"><img src="fotos/9002-2.jpg" alt="" loading="lazy"><img src="fotos/9002-4.jpg" alt="" loading="lazy"></div>
   <div class="ap-tx"><span class="ap-k">MITI · Conjunto Nacional</span><h3>Cuidado de perto, no coração da Paulista</h3>
    <div class="ap-duo"><div><b>Para você, paciente</b><span>Psicologia, neuropsicologia, fisioterapia e terapias integrativas. Das 8h às 21h.</span><button class="btn pri" data-act="fluxo" data-t="consulta">Marcar consulta</button></div>
    <div><b>Para você, profissional</b><span>Consultórios prontos por hora ou por mês, num endereço de referência.</span><button class="btn" data-act="nav" data-v="coworking">Quero um consultório</button></div></div></div>
  </article>
 </section>
 <section class="sec"><div class="row between"><h2 class="h2">Convênios na Dimagem</h2><button class="lnk" data-act="nav" data-v="convenios">Ver todos</button></div>${carrossel('carConv',CONV.map(cartaoConv),'Convênios aceitos na Dimagem Unineuro')}</section>
 <section class="sec"><h2 class="h2">Especialidades no MITI</h2>${carrossel('carEsp',MITI_ESP.map(cartaoEsp),'Especialidades atendidas no MITI')}</section>
 <section class="sec"><h2 class="h2">Nossos locais</h2><div class="grid">${LOC.map(card).join('')}</div></section>
 <section class="sec"><a class="info red" href="tel:192" style="align-items:center">${I.ambul('#B3261E',28)}<span style="flex:1"><b>Emergência? Ligue 192 (SAMU)</b><br>Bombeiros: 193 · Não espere agendar.</span>${I.phone('#B3261E',22)}</a></section>`};
VIEWS.inicio=vInicio;


const EXRAW={};
const EXAMES2=(()=>{const m=new Map();CONV.forEach(c=>c.ex.forEach(([k,n])=>{if(/^pct/i.test(n))return;const rm=k.startsWith('4110'),tc=k.startsWith('4100');if(!rm&&!tc)return;
 const d=/^angio/i.test(n)?n:(rm?'Ressonância · ':'Tomografia · ')+n;if(!m.has(d)){m.set(d,1);EXRAW[d]=n}}));return [...m.keys()].sort((a,b)=>a.localeCompare(b,'pt'))})();
/* ---- leitura do pedido (OCR no próprio celular) ---- */
const STOP=new Set(['de','da','do','das','dos','e','com','sem','ou','a','o','em','para','por','na','no','exame','exames']);
const tok=s=>norm(s).replace(/[^a-z0-9 ]/g,' ').split(/\s+/).filter(w=>w.length>2&&!STOP.has(w));
function acharExames(txt){const t=' '+norm(txt).replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ')+' ';
 const rm=/ (ressonancia|rnm|rm|mri|angio rm|angiorm) /.test(t),tc=/ (tomografia|tc|angiotomografia|angiotc) /.test(t);if(!rm&&!tc)return [];
 const sc=EXAMES2.map(n=>{const nn=norm(n);const isRM=/resson|angio-rm/.test(nn),isTC=/tomog|angiotomo/.test(nn);
  if((isRM&&!rm)||(isTC&&!tc)||(/^angio/.test(nn)&&!/ angio/.test(t))||/nao inclui/.test(nn))return [n,0];const ws=tok(/ ou /.test(' '+nn+' ')?n:n.replace(/\([^)]*\)/g,'')).filter(w=>!/resson|tomog|magnet|computad/.test(w));if(!ws.length)return [n,0];
  const hit=ws.filter(w=>t.includes(' '+w.slice(0,Math.max(4,w.length-2)))).length;return [n,/ ou /.test(' '+nn+' ')?(hit?.62+hit*.01:0):(hit<ws.length?0:1)+(hit&&t.includes(' '+ws[0].slice(0,Math.max(4,ws[0].length-2)))?.1:0)]}).filter(x=>x[1]>=.5).sort((a,b)=>b[1]-a[1]);const top=sc.length?sc[0][1]:0;
 const out=[];const art='Ressonância · Articular (por articulação)';if(rm&&/ (joelho|ombro|cotovelo|punho|tornozelo|quadril|coxofemoral) /.test(t)&&EXAMES2.includes(art))out.push(art);for(const [n,v] of sc){if(out.length>=3||v<top-.2)break;if(!out.some(o=>tok(o).join()===tok(n).join()))out.push(n)}return out}
let _tess=null;function carregarTess(){return _tess||(_tess=new Promise((ok,er)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';s.onload=()=>ok(window.Tesseract);s.onerror=er;document.head.appendChild(s)}))}
async function lerPedido(dataUrl){const T=await carregarTess();const r=await T.recognize(dataUrl,'por');return (r&&r.data&&r.data.text)||''}
async function processarFoto(){const f=S.fx;if(!f||!f.foto)return;f.lendo=true;f.lido=null;render();
 try{const txt=await Promise.race([lerPedido(f.foto),new Promise((_,er)=>setTimeout(()=>er('tempo'),45000))]);const l=acharExames(txt);f.lido=l.length?'ok':'falha';f.exames=l}catch(e){f.lido='falha';f.exames=[]}
 f.lendo=false;if(S.view==='fluxo')render()}

/* passo 2 com os exames abaixo do cartão */
const _blocoPag71=blocoPag;
blocoPag=function(){const f=S.fx;if(f.tipo!=='exame')return _blocoPag71();const c=CONV.find(x=>x.id===f.conv);f.exames=f.exames||[];
 const cobre=n=>!c||f.pag!=='conv'?null:c.pac?'pac':c.ex.some(e=>e[1]===(EXRAW[n]||n));
 const base=_blocoPag71().replace(/<p class="cob[^>]*>[\s\S]*?<\/p>/,'');const i=base.indexOf('<div class="opts"');
 const exs=`<div class="exbox">${f.lendo?`<div class="lendo"><span class="spin" aria-hidden="true"></span><span><b>Lendo seu pedido médico…</b><small>Identificando o exame solicitado</small></span></div>`:`
  <b class="exbox-t">${f.lido==='ok'?'Exame identificado no seu pedido':f.lido==='falha'?'Não conseguimos ler o pedido':'Exame solicitado'}</b>
  ${f.lido==='falha'?'<p class="sm mut" style="margin:.1rem 0 .4rem">A leitura falhou. Escolha o exame que está no seu pedido para confirmar.</p>':f.lido==='ok'?'<p class="sm mut" style="margin:.1rem 0 .4rem">Confira. Você pode remover ou adicionar exames.</p>':''}
  ${f.exames.map((n,k)=>{const cb=cobre(n);return `<div class="exi"><span class="exi-n">${typeof nomeHtml==="function"?(/^Resson/.test(n)?"Ressonância · ":/^Tomog/.test(n)?"Tomografia · ":"")+nomeHtml(n):esc(n)}${cb===null?'':cb==='pac'?'<small class="ok">Atendido em pacote</small>':cb?'<small class="ok">✓ Coberto pelo convênio</small>':'<small class="warn">Fora da tabela do convênio: a equipe confirma ou escolha Vitta Particular</small>'}</span><button class="round" data-act="exrm" data-k="${k}" aria-label="Remover ${esc(n)}">${I.x('#B3261E',16)}</button></div>`}).join('')}
  <details class="addex" ${f.exames.length?'':'open'}><summary>${f.exames.length?'+ Adicionar outro exame':'Escolher o exame'}</summary>${buscaForm('qe','Digite o exame, ex.: crânio',S.qe||'','qe')}<div class="exsel" id="exsel">${listaEx()}</div></details>`}</div>`;
 return base.slice(0,i)+exs+base.slice(i)};
listaEx=function(){const t=norm(S.qe||'');const l=t?EXAMES2.filter(n=>norm(n).includes(t)).slice(0,30):[];const sel=(S.fx&&S.fx.exames)||[];
 return l.map(n=>`<button class="exo ${sel.includes(n)?'on':''}" data-act="exadd" data-v="${esc(n)}">${sel.includes(n)?SEL:'+'}<span>${esc(n)}</span></button>`).join('')||`<p class="sm mut">${t?'Nenhum exame com esse nome.':'Digite parte do nome, por exemplo "crânio" ou "joelho".'}</p>`};

/* passo 1 do exame: só a foto (ou pular) */
const _fluxo71=VIEWS.fluxo;
VIEWS.fluxo=function(){const f=S.fx;if(!f||f.tipo!=='exame'||f.step!==1)return _fluxo71().replace(/<button class="btn pri big" data-act="fprox" (disabled)?>Confirmar<\/button>/,()=>`<button class="btn pri big" data-act="fprox" ${(f&&f.tipo==='exame'&&(!(f.exames||[]).length||f.lendo))||(f&&!(f.pag==='part'||f.conv))?'disabled':''}>Confirmar</button>`);
 return phead('Pedido de exame','Dimagem Unineuro')+`<section class="sec fluxo">${passos(1,4)}<h2 class="h2">Foto do pedido médico</h2><p class="mut">Nós lemos o pedido e identificamos o exame para você.</p>
  ${f.foto?`<div class="foto-prev"><img src="${f.foto}" alt="Pedido médico"><button class="btn" data-act="ffoto-x">Trocar foto</button></div>`:`<label class="foto-btn"><input type="file" accept="image/*" capture="environment" id="ffile" hidden><svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg><b>Fotografar pedido médico</b><small>ou escolher da galeria</small></label>`}
  <div class="info" style="margin-top:.8rem">${I.info('#0A4B44',20)}<span><b>Leve o pedido original no dia do exame.</b> A foto fica guardada com segurança por 14 dias e depois é apagada automaticamente.</span></div>
  <button class="btn pri big" data-act="fprox" ${f.foto?'':'disabled'}>Continuar</button>${f.foto?'':'<button class="lnk" data-act="fsemfoto" style="margin-top:.8rem">Não tenho o pedido agora</button>'}</section>`};

/* resumo com a lista de exames */
const _msg71=msgFluxo;msgFluxo=function(f,link){f.exame=(f.exames||[]).join('; ');let m=_msg71(f,link).replace(/Pedido médico \(foto\): (\S+)\n/,()=>`Exame(s): ${f.exame||'conforme pedido'}\n`);if(link)m=m.replace(/\nQuais horários vocês têm\?$/,`\nPedido Médico:\nLink: ${link}\n\nQuais horários vocês têm?`);return m};

document.addEventListener('click',e=>{const t=e.target.closest('[data-act]');if(!t)return;const a=t.dataset.act,f=S.fx;
 if(a==='faixa-x'){LS.set('faixaX',1);const el=document.querySelector('.faixa');if(el)el.remove()}
 else if(a==='exadd'&&f){f.exames=f.exames||[];const n=t.dataset.v;f.exames=f.exames.includes(n)?f.exames.filter(x=>x!==n):[...f.exames,n];S.qe='';render()}
 else if(a==='exrm'&&f){f.exames.splice(+t.dataset.k,1);render()}
 else if(a==='fsemfoto'&&f){f.foto=null;f.lido=null;f.exames=[];f.step=2;render()}},true);
/* ao avançar do passo 1 com foto, dispara a leitura */
document.addEventListener('click',e=>{const t=e.target.closest('[data-act=fprox]');const f=S.fx;if(t&&f&&f.tipo==='exame'&&f.step===2&&f.foto&&f.lido==null&&!f.lendo)processarFoto()});


/* ============ v7.2: galeria, apresentação em parallax, listas em ordem alfabética, escolha de convênio e exame ============ */
CONV.sort((a,b)=>a.n.localeCompare(b.n,'pt'));MITI_ESP.sort((a,b)=>a.n.localeCompare(b.n,'pt'));

/* início: volta os cards com degradê, que levam à apresentação */
const _ini72=vInicio;
vInicio=function(){let h=_ini72();const a=h.indexOf('<section class="sec apres">'),b=h.indexOf('</section>',h.indexOf('</article>',h.indexOf('class="ap mt"')))+10;
 const atr=`<section class="sec atr">
  <button class="atr-dm" data-act="nav" data-v="apresentacao" data-k="dm"><img src="fotos/dm-rm.jpg" alt="" loading="lazy"><span class="atr-v"><span class="atr-n">30<small>anos</small></span><span class="atr-t"><b>Dimagem Unineuro</b><span>Ressonância e tomografia na Lapa</span></span><q>Saúde igual para todos</q><span class="atr-ver">Toque para ver a apresentação ›</span></span></button>
  <div class="atr-mt"><span class="atr-cab"><b>MITI</b> · Conjunto Nacional, Av. Paulista</span>
   <button class="atr-c pac" data-act="nav" data-v="apresentacao" data-k="pac"><img src="fotos/9002-2.jpg" alt="" loading="lazy"><span><small>Para o paciente</small><b>Consultas na Paulista</b><em>Ver apresentação ›</em></span></button>
   <button class="atr-c med" data-act="nav" data-v="apresentacao" data-k="med"><img src="fotos/9002-4.jpg" alt="" loading="lazy"><span><small>Para o profissional</small><b>Consultórios por hora ou mês</b><em>Ver apresentação ›</em></span></button></div></section>`;
 return a>0?h.slice(0,a)+atr+h.slice(b):h};
VIEWS.inicio=vInicio;

/* apresentação com parallax */
const APR=[
 {k:'dm',img:'fotos/dm-rm.jpg',cor:'#0B6E6B',tag:'Dimagem Unineuro',t:'30 anos cuidando do seu diagnóstico',f:'Saúde igual para todos.',pts:['Ressonância magnética e tomografia','Mais de 30 convênios e particular','Na Lapa, junto ao Hospital Albert Sabin']},
 {k:'dm2',img:'fotos/dm-rm2.jpg',cor:'#0A8F8A',tag:'Conforto no exame',t:'Você tranquilo do começo ao fim',f:'Equipe que explica cada etapa e acompanha você durante o exame.',pts:['Orientação de preparo no agendamento','Resposta no WhatsApp em até 15 minutos']},
 {k:'dm3',img:'fotos/dm-recepcao.jpg',cor:'#17624A',tag:'Agendar é simples',t:'Mande a foto do pedido. A gente cuida do resto.',f:'Sem ligação, sem fila de espera ao telefone.',cta:['fluxo','exame','Agendar meu exame']},
 {k:'pac',img:'fotos/9002-1.jpg',cor:'#2E8F6E',tag:'MITI · Para o paciente',t:'Cuidado de perto, no coração da Paulista',f:'Psicologia, neuropsicologia, fisioterapia e terapias integrativas.',pts:['Conjunto Nacional, Av. Paulista','Das 8h às 21h','Resposta em 30 a 60 minutos'],cta:['fluxo','consulta','Marcar consulta']},
 {k:'med',img:'fotos/9002-4.jpg',cor:'#0B6E6B',tag:'MITI · Para o profissional',t:'Seu consultório no endereço mais conhecido de São Paulo',f:'Salas prontas para atender, por hora ou por mês.',pts:['Sem custo de montar consultório','Pacientes chegam fácil pelo metrô'],cta:['nav','coworking','Quero um consultório']}];
VIEWS.apresentacao=function(){return `<div class="apr">${APR.map((p,i)=>`<section class="apr-p" id="apr-${p.k}" style="--c:${p.cor}"><div class="apr-bg" data-px><img src="${p.img}" alt=""></div><div class="apr-sh"></div>
 <div class="apr-card" data-rev><span class="apr-tag">${esc(p.tag)}</span><h2>${esc(p.t)}</h2><p>${esc(p.f)}</p>${p.pts?`<ul>${p.pts.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}${p.cta?`<button class="btn ${p.cta[0]==='fluxo'?'pri':'wh'}" data-act="${p.cta[0]}" ${p.cta[0]==='fluxo'?`data-t="${p.cta[1]}"`:`data-v="${p.cta[1]}"`}>${esc(p.cta[2])}</button>`:''}</div>
 ${i<APR.length-1?'<span class="apr-seta" aria-hidden="true">⌄</span>':''}</section>`).join('')}<button class="apr-x" data-act="voltar" aria-label="Fechar apresentação">${I.x('#fff',22)}</button></div>`};
function aprIniciar(){const ps=[...document.querySelectorAll('.apr-p')];if(!ps.length)return;
 const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)e.target.classList.add('vis')}),{threshold:.25});document.querySelectorAll('[data-rev]').forEach(x=>io.observe(x));
 const red=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;if(red)return;
 const tick=()=>{if(S.view!=='apresentacao')return;const vh=innerHeight;ps.forEach(p=>{const r=p.getBoundingClientRect();if(r.bottom<0||r.top>vh)return;const k=(r.top+r.height/2-vh/2)/vh;
  p.querySelector('[data-px]').style.transform=`translateY(${(k*-90).toFixed(1)}px) scale(1.15)`;p.querySelector('.apr-card').style.setProperty('--py',(k*40).toFixed(1)+'px')})};
 removeEventListener('scroll',aprIniciar._t);aprIniciar._t=()=>requestAnimationFrame(tick);addEventListener('scroll',aprIniciar._t,{passive:true});tick()}
const _render72=render;render=function(a){_render72(a);document.body.classList.toggle('modo-apr',S.view==='apresentacao');if(S.view==='apresentacao'){aprIniciar();if(S.aprK){const el=$('apr-'+S.aprK);S.aprK=null;if(el)setTimeout(()=>el.scrollIntoView({behavior:'smooth'}),60)}}};

/* foto: câmera ou galeria */
const _fx72=VIEWS.fluxo;
VIEWS.fluxo=function(){let h=_fx72();return h.replace(/<label class="foto-btn">[\s\S]*?<\/label>/,`<div class="foto-dup"><label class="foto-btn"><input type="file" accept="image/*" capture="environment" id="ffile" hidden><svg viewBox="0 0 24 24" width="38" height="38" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg><b>Tirar foto</b><small>Usar a câmera</small></label>
 <label class="foto-btn gal"><input type="file" accept="image/*" id="ffile2" hidden><svg viewBox="0 0 24 24" width="38" height="38" fill="none" stroke="#0B6E6B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/></svg><b>Escolher da galeria</b><small>Foto já salva</small></label></div>`)};

/* escolher convênio: campo de busca + lista em ordem alfabética */
const _bp72=blocoPag;
blocoPag=function(){const f=S.fx;let h=_bp72();if(!f.troca)return h;
 const t=norm(S.qcv||'');const l=CONV.filter(c=>!t||norm(c.n).includes(t));
 const pick=`<div class="cvpick"><label class="cvp-in">${I.search?I.search('#4E6664',20):'🔍'}<input class="inp" id="qcv" data-live="qcv" placeholder="Buscar convênio" value="${esc(S.qcv||'')}" autocomplete="off"></label>
  <div class="cvp-l" id="cvpl">${cvpLista(l,f.conv)}</div></div>`;
 return h.replace(/<label class="f">Convênio<select[\s\S]*?<\/select><\/label>/,pick)};
function cvpLista(l,sel){return l.map(c=>`<button class="cvp ${c.id===sel?'on':''}" data-act="cvsel" data-k="${c.id}">${miniConv(c)}<span>${esc(c.n)}</span>${c.id===sel?SEL:''}</button>`).join('')||'<p class="sm mut">Nenhum convênio com esse nome.</p>'}

/* escolher exame: abas por tipo, busca e lista organizada */
const TIPOS=[['rm','Ressonância Magnética'],['tc','Tomografia Computadorizada']];
const ANGTP={};CONV.forEach(c=>c.ex.forEach(([k,n])=>{if(/^angio/i.test(n))ANGTP[n]=k.startsWith('4110')?'rm':'tc'}));
const tipoEx=n=>/^angio/i.test(n)?(ANGTP[n]||(/resson|\brm\b/i.test(n)?'rm':'tc')):/^resson/i.test(n)?'rm':'tc';
const nomeCurto=n=>n.replace(/^(Ressonância|Tomografia) · /,'');const nomeHtml=n=>{const c=nomeCurto(n),i=c.indexOf(' (');return i>0?`${esc(c.slice(0,i))}<i>${esc(c.slice(i+1))}</i>`:esc(c)};
listaEx=function(){const f=S.fx||{},sel=f.exames||[],tp=(S.extp==='tc'?'tc':'rm'),t=norm(S.qe||'');
 let l=EXAMES2.filter(n=>t?norm(n).includes(t):tipoEx(n)===tp);
 const grupos={};l.forEach(n=>{const g=(nomeCurto(n)[0]||'#').toUpperCase();(grupos[g]=grupos[g]||[]).push(n)});
 return `${t?'':`<div class="extabs" role="tablist">${TIPOS.map(([k,v])=>`<button role="tab" class="${tp===k?'on':''}" data-act="extp" data-k="${k}">${v}</button>`).join('')}</div>`}
 <div class="exlist">${Object.keys(grupos).sort((a,b)=>a.localeCompare(b,'pt')).map(g=>`<span class="exg">${g}</span>${grupos[g].map(n=>`<button class="exr ${sel.includes(n)?'on':''}" data-act="exadd" data-v="${esc(n)}"><span class="exr-c">${sel.includes(n)?SEL:''}</span><span class="exr-n"><b>${nomeHtml(n)}</b>${t?`<small>${TIPOS.find(x=>x[0]===tipoEx(n))[1]}</small>`:''}</span></button>`).join('')}`).join('')||'<p class="sm mut" style="padding:.6rem">Nenhum exame com esse nome.</p>'}</div>`};

document.addEventListener('click',e=>{const t=e.target.closest('[data-act]');if(!t)return;const a=t.dataset.act;
 if(a==='nav'&&t.dataset.v==='apresentacao')S.aprK=t.dataset.k||null;
 else if(a==='cvsel'&&S.fx){S.fx.conv=t.dataset.k;S.fx.troca=false;S.fx.pag='conv';S.qcv='';render()}
 else if(a==='extp'){S.extp=t.dataset.k;const b=$('exsel');if(b)b.innerHTML=listaEx()}},true);
document.addEventListener('input',e=>{const t=e.target;if(t.dataset&&t.dataset.live==='qcv'){S.qcv=t.value;const b=$('cvpl');if(b){const q=norm(t.value);b.innerHTML=cvpLista(CONV.filter(c=>!q||norm(c.n).includes(q)),S.fx&&S.fx.conv)}}});
document.addEventListener('change',async e=>{const t=e.target;if(t.id==='ffile2'&&t.files&&t.files[0]&&S.fx){try{S.fx.foto=await comprimir(t.files[0]);S.fx.exame='';S.fx.lido=null;render()}catch(x){toast('Não consegui ler a foto. Tente outra.')}}});


/* ============ v7.3: cubos estilo A (Consultas à esquerda) com etiqueta de ação ============ */
const _ini73=vInicio;
vInicio=function(){const h=_ini73();const a=h.indexOf('<section class="sec duo">');if(a<0)return h;const b=h.indexOf('</section>',a)+10;
 const st='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3v6a4 4 0 0 0 8 0V3M10 13v2a5 5 0 0 0 10 0v-3"/><circle cx="20" cy="10" r="2"/></svg>';
 const dc='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/></svg>';
 const alvo='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/></svg>';
 const cubos=`<section class="sec cubos">
  <button class="cubo2 co" data-act="fluxo" data-t="consulta"><span class="c2-ic">${st}</span><span class="c2-big" aria-hidden="true">${st}</span><b>Consultas</b><small>Especialistas no MITI</small><span class="c2-pill">Marcar ›</span></button>
  <button class="cubo2 ex" data-act="fluxo" data-t="exame"><span class="c2-ic">${dc}</span><span class="c2-big" aria-hidden="true">${alvo}</span><b>Exames</b><small>Ressonância e tomografia</small><span class="c2-pill">Agendar ›</span></button></section>`;
 return h.slice(0,a)+cubos+h.slice(b)};
VIEWS.inicio=vInicio;

/* ============ v7.4: especialidades do MITI (pesquisa por profissional) e apresentações separadas ============ */
const RJ='stroke-linecap="round" stroke-linejoin="round"';
Object.assign(ICM,{
 psiq:`<svg viewBox="0 0 120 120"><path d="M40 104V88c-10-6-18-17-18-31 0-21 16-37 37-37 18 0 33 12 36 29l7 13c1 2 0 4-2 4h-6v10c0 5-4 9-9 9h-9v9" fill="#DDF2F1" stroke="#0B6E6B" stroke-width="4" ${RJ}/><path d="M44 50c0-9 7-15 15-15s14 6 14 13c0 6-4 9-8 11-3 2-4 4-4 8" fill="none" stroke="#2E8F6E" stroke-width="5" ${RJ}/><circle cx="61" cy="78" r="3.5" fill="#2E8F6E"/><path d="M92 24l6-6M100 34h8M96 14v-6" stroke="#E1A422" stroke-width="4" ${RJ}/></svg>`,
 cardio:`<svg viewBox="0 0 120 120"><path d="M60 100C30 80 14 62 14 42c0-14 11-24 24-24 9 0 17 5 22 13 5-8 13-13 22-13 13 0 24 10 24 24 0 20-16 38-46 58z" fill="#E0F5F4" stroke="#B3261E" stroke-width="4.5" ${RJ}/><path d="M22 58h22l7-14 10 28 8-20 5 6h24" fill="none" stroke="#2E8F6E" stroke-width="5" ${RJ}/></svg>`,
 endo:`<svg viewBox="0 0 120 120"><path d="M60 30v62" stroke="#0B6E6B" stroke-width="5" ${RJ}/><path d="M56 46c-12-12-34-10-38 8-4 18 8 32 22 30 10-2 16-12 16-22z" fill="#E0F5F4" stroke="#0A8F8A" stroke-width="4.5" ${RJ}/><path d="M64 46c12-12 34-10 38 8 4 18-8 32-22 30-10-2-16-12-16-22z" fill="#E0F5F4" stroke="#0A8F8A" stroke-width="4.5" ${RJ}/><rect x="50" y="58" width="20" height="12" rx="6" fill="#7CCFB0" stroke="#17624A" stroke-width="3.5"/><circle cx="34" cy="62" r="4" fill="#7CCFB0"/><circle cx="86" cy="62" r="4" fill="#7CCFB0"/></svg>`,
 neurol:`<svg viewBox="0 0 120 120"><path d="M58 20c-6-6-17-5-21 2-8 0-14 7-12 15-7 4-8 14-2 19-3 7 1 15 9 16 2 8 11 12 18 8 3 3 6 4 8 4z" fill="#DCF3E9" stroke="#17624A" stroke-width="4" ${RJ}/><path d="M58 20c6-6 17-5 21 2 8 0 14 7 12 15 7 4 8 14 2 19 3 7-1 15-9 16-2 8-11 12-18 8-3 3-6 4-8 4z" fill="#DCF3E9" stroke="#17624A" stroke-width="4" ${RJ}/><g fill="#0A8F8A"><circle cx="40" cy="42" r="5"/><circle cx="76" cy="38" r="5"/><circle cx="58" cy="58" r="5"/><circle cx="44" cy="70" r="5"/><circle cx="78" cy="68" r="5"/></g><path d="M40 42l18 16 18-20M58 58l-14 12M58 58l20 10" fill="none" stroke="#0A8F8A" stroke-width="3"/><path d="M58 88v16" stroke="#17624A" stroke-width="6" ${RJ}/></svg>`,
 neuroc:`<svg viewBox="0 0 120 120"><path d="M50 22c-6-6-16-5-20 2-8 0-13 7-11 14-7 4-8 13-2 18-3 7 1 14 8 15 2 8 10 11 17 7 3 3 5 4 8 4V22z" fill="#DCF3E9" stroke="#17624A" stroke-width="4" ${RJ}/><path d="M50 22c6-6 16-5 20 2 8 0 13 7 11 14" fill="none" stroke="#17624A" stroke-width="4" ${RJ}/><path d="M64 104l34-50" stroke="#0B6E6B" stroke-width="7" ${RJ}/><path d="M98 54l10-16c2-3-2-6-5-4L88 46z" fill="#DDF2F1" stroke="#0B6E6B" stroke-width="4" ${RJ}/><path d="M30 40c6 0 9 4 9 9M26 60c5-2 10 0 12 5" fill="none" stroke="#17624A" stroke-width="3" ${RJ}/></svg>`,
 pneumo:`<svg viewBox="0 0 120 120"><path d="M60 14v40M60 40c-6 6-12 8-18 8M60 40c6 6 12 8 18 8" stroke="#0B6E6B" stroke-width="5" fill="none" ${RJ}/><path d="M44 36c-14 4-26 22-28 46-1 12 6 20 16 18l12-3c4-1 6-4 6-8V44c0-6-2-10-6-8z" fill="#E0F5F4" stroke="#0A8F8A" stroke-width="4.5" ${RJ}/><path d="M76 36c14 4 26 22 28 46 1 12-6 20-16 18l-12-3c-4-1-6-4-6-8V44c0-6 2-10 6-8z" fill="#E0F5F4" stroke="#0A8F8A" stroke-width="4.5" ${RJ}/><path d="M30 70c4-4 10-4 14 0M76 70c4-4 10-4 14 0" stroke="#2E8F6E" stroke-width="3.5" fill="none" ${RJ}/></svg>`,
 clinica:`<svg viewBox="0 0 120 120"><path d="M34 18v26a20 20 0 0 0 40 0V18" fill="none" stroke="#0B6E6B" stroke-width="6" ${RJ}/><circle cx="34" cy="18" r="5" fill="#0B6E6B"/><circle cx="74" cy="18" r="5" fill="#0B6E6B"/><path d="M54 64v12a22 22 0 0 0 44 0V66" fill="none" stroke="#0B6E6B" stroke-width="6" ${RJ}/><circle cx="98" cy="56" r="12" fill="#7CCFB0" stroke="#17624A" stroke-width="4"/><circle cx="98" cy="56" r="4" fill="#17624A"/></svg>`,
 onco:`<svg viewBox="0 0 120 120"><path d="M50 22c-10 0-16 8-14 18l14 30 14-30c2-10-4-18-14-18z" fill="#E0F5F4" stroke="#0A8F8A" stroke-width="4.5" ${RJ}/><path d="M50 70L30 104M50 70l20 34" stroke="#0A8F8A" stroke-width="9" ${RJ}/><path d="M50 70L30 104M50 70l20 34" stroke="#BFE8E5" stroke-width="3" ${RJ}/><path d="M80 96l28-40" stroke="#17624A" stroke-width="6" ${RJ}/><path d="M108 56l6-12c1-3-2-5-4-3l-10 10z" fill="#DCF3E9" stroke="#17624A" stroke-width="3.5" ${RJ}/></svg>`,
 nutri:`<svg viewBox="0 0 120 120"><path d="M60 36c-8-6-24-8-34 2-12 12-8 36 4 50 8 10 18 14 30 10 12 4 22 0 30-10 12-14 16-38 4-50-10-10-26-8-34-2z" fill="#DCF3E9" stroke="#17624A" stroke-width="4.5" ${RJ}/><path d="M60 36c0-10 4-18 12-22" stroke="#0A8F8A" stroke-width="5" fill="none" ${RJ}/><path d="M64 26c8-10 22-10 28-4-6 10-18 12-28 4z" fill="#7CCFB0" stroke="#17624A" stroke-width="3.5" ${RJ}/><path d="M36 58c2-8 8-12 14-12" stroke="#fff" stroke-width="5" fill="none" ${RJ}/></svg>`,
 esporte:`<svg viewBox="0 0 120 120"><circle cx="70" cy="18" r="9" fill="#E0F5F4" stroke="#0A8F8A" stroke-width="4"/><path d="M40 46l16-12 16 6 10 16M56 34l-8 26 18 10v28M48 60l-12 18-18-2" fill="none" stroke="#0B6E6B" stroke-width="7" ${RJ}/><circle cx="92" cy="86" r="16" fill="#F2C94C" stroke="#8A5A00" stroke-width="4"/><path d="M86 86l4 4 8-8" stroke="#8A5A00" stroke-width="4" fill="none" ${RJ}/></svg>`});
MITI_ESP.length=0;
[['Cardiologia','Coração e pressão arterial','cardio','#B3261E','#E0F5F4',2],['Cirurgia oncológica','Avaliação e acompanhamento cirúrgico','onco','#0A8F8A','#DCF3E9',1],['Clínica médica','Check-up e cuidado do adulto','clinica','#0B6E6B','#7CCFB0',2],
 ['Endocrinologia','Hormônios, tireoide e diabetes','endo','#0A8F8A','#7CCFB0',1],['Fisioterapia em performance','Reabilitação e desempenho esportivo','fisio','#0A8F8A','#7CCFB0',1],['Medicina esportiva e nutrologia','Saúde e performance no esporte','esporte','#17624A','#E0F5F4',1],
 ['Neurocirurgia','Coluna, nervos e cérebro','neuroc','#17624A','#E0F5F4',1],['Neurologia','Dor de cabeça, dor crônica e nervos','neurol','#2E8F6E','#E0F5F4',2],['Neuropsicologia','Memória, atenção e desenvolvimento','neuro','#2E8F6E','#E0F5F4',1],
 ['Nutrição','Alimentação e emagrecimento saudável','nutri','#17624A','#E0F5F4',2],['Pneumologia','Pulmões e respiração','pneumo','#0B6E6B','#7CCFB0',1],['Psicologia','Psicoterapia para adultos, casais e adolescentes','psico','#0B6E6B','#7CCFB0',8],
 ['Psiquiatria','Ansiedade, depressão e saúde mental','psiq','#0A8F8A','#7CCFB0',6],['Terapias integrativas','Práticas complementares de cuidado','integ','#17624A','#E0F5F4',1]
].forEach(([n,d,ic,bg,ac,q])=>MITI_ESP.push({n,d,ic,bg,ac,q}));
Object.assign(MODM,{psiq:'Saúde mental · consulta médica',cardio:'Cuidado do coração',endo:'Hormônios e metabolismo',neurol:'Sistema nervoso',neuroc:'Cirurgia do sistema nervoso',pneumo:'Saúde respiratória',clinica:'Clínico geral',onco:'Oncologia cirúrgica',nutri:'Alimentação e saúde',esporte:'Esporte e nutrologia'});
const _ce74=cartaoEsp;cartaoEsp=e=>_ce74(e).replace('<span class="cc-tipo">Especialidade no MITI</span>',`<span class="cc-tipo">${e.q} profissiona${e.q>1?'is':'l'} no MITI</span>`);

/* ---- apresentações separadas: Dimagem, MITI paciente, MITI profissional ---- */
const DECKS={
 dm:{nome:'Dimagem Unineuro',cor:'#0B6E6B',cta:['fluxo','exame','Agendar meu exame'],bl:[
  {f:'fotos/dm-fachada-hd.jpg',k:'Dimagem Unineuro',t:'30 anos cuidando do seu diagnóstico'},
  {tx:'Saúde igual para todos.',p:'Há mais de três décadas, a Dimagem faz ressonância magnética e tomografia com o mesmo cuidado para cada paciente, seja pelo convênio ou particular.'},
  {f:'fotos/dm-rm2-hd.jpg',k:'Tecnologia',t:'Imagem nítida, exame mais tranquilo'},
  {nums:[['30+','anos de experiência'],['30','convênios aceitos'],['15 min','para responder no WhatsApp']]},
  {f:'fotos/dm-rm-hd.jpg',k:'Acolhimento',t:'Uma equipe que explica cada etapa'},
  {tx:'Agendar é simples.',p:'Mande a foto do pedido médico pelo app. A gente identifica o exame, confere o convênio e responde com os horários.'}]},
 pac:{nome:'MITI · Para você, paciente',cor:'#17624A',cta:['fluxo','consulta','Marcar consulta'],bl:[
  {f:'fotos/9002-1-hd.jpg',k:'MITI · Conjunto Nacional',t:'Cuidado de perto, no coração da Paulista'},
  {tx:'Especialistas num só endereço.',p:'Psiquiatria, psicologia, neurologia, cardiologia, nutrição, fisioterapia e muito mais, no Conjunto Nacional.'},
  {f:'fotos/9002-2-hd.jpg',k:'Conforto',t:'Consultórios acolhedores e reservados'},
  {nums:[['14','especialidades'],['8h–21h','horário de atendimento'],['1 min','do metrô Consolação']]},
  {f:'fotos/9002-3-hd.jpg',k:'Fácil de chegar',t:'Av. Paulista, 2073 · 1º andar do Horsa II'},
  {tx:'Marque em poucos toques.',p:'Escolha a especialidade e o melhor horário. O MITI responde pelo WhatsApp em 30 a 60 minutos.'}]},
 med:{nome:'MITI · Para você, profissional',cor:'#0A8F8A',cta:['nav','coworking','Quero um consultório'],bl:[
  {f:'fotos/9002-4-hd.jpg',k:'MITI · Para profissionais',t:'Seu consultório no endereço mais conhecido de São Paulo'},
  {tx:'Atenda sem o custo de montar um consultório.',p:'Salas prontas e mobiliadas, por hora ou por mês, no Conjunto Nacional.'},
  {f:'fotos/9002-5-hd.jpg',k:'Estrutura pronta',t:'Chegue, atenda e vá embora'},
  {nums:[['Hora','ou plano mensal'],['8h–21h','todos os dias úteis'],['Paulista','pacientes chegam fácil']]},
  {f:'fotos/9002-6-hd.jpg',k:'Comunidade',t:'Divida o espaço com outros especialistas'},
  {tx:'Fale com a gente.',p:'Envie seu interesse e a equipe do MITI apresenta os horários e valores.'}]}};
VIEWS.apresentacao=function(){const d=DECKS[S.aprK||'dm']||DECKS.dm;
 return `<div class="dk" style="--c:${d.cor}"><button class="dk-x" data-act="voltar" aria-label="Fechar">${I.x('#fff',22)}</button>
 ${d.bl.map((b,i)=>b.f?`<section class="dk-img ${i===0?'hero1':''}"><div class="dk-bg" data-px><img src="${b.f}" alt=""></div><div class="dk-sh"></div><div class="dk-cap" data-rev><span>${esc(b.k)}</span><h2>${esc(b.t)}</h2></div>${i===0?'<span class="apr-seta" aria-hidden="true">⌄</span>':''}</section>`
  :b.nums?`<section class="dk-w"><div class="dk-nums" data-rev>${b.nums.map(([n,l])=>`<div><b>${esc(n)}</b><span>${esc(l)}</span></div>`).join('')}</div></section>`
  :`<section class="dk-w"><div data-rev><h3>${esc(b.tx)}</h3><p>${esc(b.p)}</p></div></section>`).join('')}
 <section class="dk-w dk-fim"><div data-rev><h3>${esc(d.nome)}</h3><button class="btn pri big" data-act="${d.cta[0]}" ${d.cta[0]==='fluxo'?`data-t="${d.cta[1]}"`:`data-v="${d.cta[1]}"`}>${esc(d.cta[2])}</button>
 <div class="dk-outros">${Object.entries(DECKS).filter(([k])=>k!==(S.aprK||'dm')).map(([k,o])=>`<button class="lnk" data-act="deck" data-k="${k}">Ver ${esc(o.nome)} ›</button>`).join('')}</div></div></section></div>`};
aprIniciar=function(){const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)e.target.classList.add('vis')}),{threshold:.2});document.querySelectorAll('[data-rev]').forEach(x=>io.observe(x));
 if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)return;const ps=[...document.querySelectorAll('.dk-img')];
 const tick=()=>{if(S.view!=='apresentacao')return;const vh=innerHeight;ps.forEach(p=>{const r=p.getBoundingClientRect();if(r.bottom<0||r.top>vh)return;const k=(r.top+r.height/2-vh/2)/vh;p.querySelector('[data-px]').style.transform=`translateY(${(k*-60).toFixed(1)}px) scale(1.04)`})};
 removeEventListener('scroll',aprIniciar._t);aprIniciar._t=()=>requestAnimationFrame(tick);addEventListener('scroll',aprIniciar._t,{passive:true});tick()};
const _r74=render;render=function(a){const k=S.aprK;_r74(a);if(S.view==='apresentacao'&&k)S.aprK=k};
document.addEventListener('click',e=>{const t=e.target.closest('[data-act]');if(!t)return;
 if(t.dataset.act==='nav'&&t.dataset.v==='apresentacao'){S.aprK=t.dataset.k||'dm'}
 else if(t.dataset.act==='deck'){S.aprK=t.dataset.k;render();scrollTo(0,0)}},true);


/* ============ v7.5: botões de WhatsApp dos locais usam o fluxo novo ============ */
document.addEventListener('click',e=>{const t=e.target.closest('[data-act="wa"]');if(!t)return;e.preventDefault();e.stopImmediatePropagation();
 const id=+t.dataset.id;novoFluxo(id===9002?'consulta':'exame');S.qe='';ir('fluxo')},true);

/* ============ v8: Pro Bono, leitura do convênio, consulta sem preferência, pagamento, transição ============ */
const FLOR_OLD='<svg width="20" height="20" viewBox="0 0 24 24"><g fill="#0ABAB5"><ellipse cx="12" cy="6" rx="3.2" ry="5"/><ellipse cx="12" cy="18" rx="3.2" ry="5"/><ellipse cx="6" cy="12" rx="5" ry="3.2"/></g><ellipse cx="18" cy="12" rx="5" ry="3.2" fill="#C9A227"/><circle cx="12" cy="12" r="2.2" fill="#0E4D45"/></svg>';
function telMask(t){t=(t||'').replace(/\D/g,'');return t.length>=10?`(${t.slice(0,2)}) •••• ${t.slice(-4)}`:''}
function cartaoProBono(c){const u=S.user||{};const nm=(u.nome||'Paciente').trim();
 return `<div class="pb"><svg class="pb-w" viewBox="0 0 400 252" preserveAspectRatio="none" aria-hidden="true"><circle cx="350" cy="40" r="95" fill="#fff" opacity=".06"/><path d="M0 128 C90 106 170 150 260 122 S370 98 400 110" stroke="#C9A227" stroke-width="3" fill="none" opacity=".75"/><path d="M0 138 C90 116 170 160 260 132 S370 108 400 120" stroke="#E9C46A" stroke-width="1.5" fill="none" opacity=".6"/></svg>
 <div class="pb-in"><div class="pb-top"><span class="pb-lg"><i>${LOGO(20)}</i>VittaOne</span><span class="pb-tag">PRO BONO</span></div>
 <svg class="pb-chip" width="40" height="30" viewBox="0 0 44 34" aria-hidden="true"><rect width="44" height="34" rx="7" fill="#E9C46A"/><path d="M0 12h14M0 22h14M30 12h14M30 22h14M14 0v34M30 0v34" stroke="#B8860B" stroke-width="1.5"/></svg>
 <div class="pb-bot"><span class="pb-s">BENEFICIÁRIO</span><b class="pb-n">${esc(nm.toUpperCase())}</b>
 <div class="pb-row"><span><span class="pb-s">CELULAR</span><b>${telMask(u.cel)}</b></span><span><span class="pb-s">CONVÊNIO</span><b>${esc(c?c.n:'Escolha abaixo')}</b></span></div></div></div></div>`}
blocoPag=function(){const f=S.fx;const c=CONV.find(x=>x.id===f.conv);if(f.pag!=='part'&&!f.conv&&convDoUser()){f.conv=convDoUser().id}
 const cAt=CONV.find(x=>x.id===f.conv);
 const card=f.pag==='part'?`<div class="ct" style="background:linear-gradient(135deg,#0B6E6B,#0ABAB5)"><svg viewBox="0 0 400 252"><text x="32" y="96" font-family="Arial" font-weight="900" font-size="40" fill="#fff">VittaOne</text><text x="34" y="140" font-family="Arial" font-weight="700" font-size="30" fill="#E9C46A">Particular</text><text x="34" y="180" font-family="Arial" font-size="17" fill="#E0F5F4">Valor informado no atendimento</text></svg></div>`:cartaoProBono(cAt);
 let h=`<div class="pag-cartao">${card}</div>`;
 if(f.tipo==='exame')h+=_exbox8();
 h+=`<div class="opts two" role="radiogroup" aria-label="Forma de atendimento">
  <button class="opt ${f.pag!=='part'?'on':''}" data-act="fpag8" data-v="pb" role="radio">${SEL}<span><b>Pro Bono</b><small>${cAt?esc(cAt.n):'Pelo seu convênio'}</small></span></button>
  <button class="opt ${f.pag==='part'?'on':''}" data-act="fpag8" data-v="part" role="radio">${SEL}<span><b>Vitta Particular</b><small>Valor sob consulta</small></span></button></div>`;
 if(f.pag!=='part')h+=`<div class="cvtroca"><button class="lnk" data-act="cvabre">${f.troca?'Fechar lista':cAt?'Trocar convênio':'Escolher convênio'}</button>
  ${f.troca?`<div class="cvpick"><label class="cvp-in">${I.search('#4E6664',20)}<input class="inp" id="qcv" data-live="qcv" placeholder="Buscar convênio" value="${esc(S.qcv||'')}" autocomplete="off"></label><div class="cvp-l" id="cvpl">${cvpLista(CONV.filter(x=>!norm(S.qcv||'')||norm(x.n).includes(norm(S.qcv||''))),f.conv)}</div></div>`:''}</div>`;
 return h};
cvpLista=function(l,sel){return l.map(c=>`<button class="cvp txt ${c.id===sel?'on':''}" data-act="cvsel" data-k="${c.id}"><span>${esc(c.n)}</span>${c.id===sel?SEL:''}</button>`).join('')||'<p class="sm mut" style="padding:.8rem">Nenhum convênio com esse nome.</p>'};
/* bloco de exames reaproveitado da v7.1 */
function _exbox8(){const f=S.fx;const tr=f.troca;f.troca=false;const html=_bp72();f.troca=tr;const i=html.indexOf('<div class="exbox">');if(i<0)return '';let j=i,d=0;const re=/<\/?div\b/g;re.lastIndex=i;let m;while((m=re.exec(html))){d+=m[0]==='<div'?1:-1;if(d===0){j=m.index+6;break}}
 let box=html.slice(i,j);if(f.convLido)box=box.replace('<b class="exbox-t">',`<div class="convlido">${I.info('#0B6E6B',18)}<span>Convênio indicado no pedido: <b>${esc(f.convLido)}</b></span></div><b class="exbox-t">`);return box}

/* leitura do convênio no pedido (inclui SUS) */
function acharConv(txt){const t=' '+norm(txt).replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ')+' ';
 if(/ (sus|sistema unico de saude|ubs|ama|cns) /.test(t))return 'SUS';
 const al={sulamerica:['sul america','sulamerica'],hapvida:['notredame','intermedica','gndi','hapvida'],porto:['porto seguro'],portoitau:['porto itau'],unimed:['unimed'],careplus:['care plus','careplus'],cassi:['cassi'],cabesp:['cabesp'],geap:['geap'],postal:['postal saude','correios saude'],preventsenior:['prevent senior'],medsenior:['medsenior','med senior'],mediservice:['mediservice'],vivest:['vivest','funcesp'],globalmed:['global med','globalmed'],biovida:['biovida'],metrus:['metrus'],sbc:['sbc saude','saude sbc'],medtour:['med tour','medtour'],medprev:['medprev'],next:['next saude'],select:['select'],leader:['leader','lider'],sts:['sistema total'],solumedi:['solumedi'],drexame:['dr exame'],amorsaude:['amor e saude','cartao de todos'],cidade:['clinica da cidade'],fares:['clinica fares'],sonilab:['sonilab','cruz azul'],bradesco:['bradesco saude'],amil:['amil']};
 for(const [id,ws] of Object.entries(al))if(ws.some(w=>t.includes(' '+w+' '))){const c=CONV.find(x=>x.id===id);return c?c.n:ws[0].replace(/\b\w/g,l=>l.toUpperCase())}return ''}
processarFoto=async function(){const f=S.fx;if(!f||!f.foto)return;f.lendo=true;f.lido=null;render();
 try{const txt=await Promise.race([lerPedido(f.foto),new Promise((_,er)=>setTimeout(()=>er('tempo'),45000))]);const l=acharExames(txt);f.lido=l.length?'ok':'falha';f.exames=l;f.convLido=acharConv(txt)}catch(e){f.lido='falha';f.exames=[];f.convLido=''}
 f.lendo=false;if(S.view==='fluxo')render()};

/* passos: exame 1 foto, 2 pagamento, 3 preferência, 4 resumo · consulta 1 especialidade, 2 pagamento, 3 resumo */
const _fx8=VIEWS.fluxo;
VIEWS.fluxo=function(){const f=S.fx;if(f&&f.tipo==='consulta'&&f.step===3&&!((typeof PROF_ON!=='undefined')&&(PROF_ON||PROF_PREVIA)&&profsDe(f.esp).length))f.step=4;let h=_fx8();
 if(f&&f.tipo==='consulta'){h=h.replace(/<div class="passos"[\s\S]*?<\/div>/,()=>passos(f.step===4?3:f.step,3)).replace(/<div class="rl"><span>Preferência<\/span><b>[\s\S]*?<\/b><\/div>/,'')}
 if(f&&f.step===4)h=h.replace(/<p class="sm" id="fmsg"/,blocoPagto()+'<p class="sm" id="fmsg"');
 if(f&&f.step===4&&f.pag==='part'&&f.forma==='adiant'&&!(f.cob&&f.cob.pago))h=h.replace('data-act="fenviar"','data-act="fenviar" disabled');
 if(f&&f.step===4&&f.pag==='part'&&!f.forma)h=h.replace('data-act="fenviar"','data-act="fenviar" disabled');
 return h};
document.addEventListener('click',e=>{const t=e.target.closest('[data-act=fvolta]');const f=S.fx;if(t&&f&&f.tipo==='consulta'&&f.step===4){f.step=3}},true);

/* forma de pagamento (só Vitta Particular) */
S.pagCfg=null;function pagCfg(){if(S.pagCfg)return Promise.resolve(S.pagCfg);return rpc('pax_pagamento_ativo',{}).then(j=>S.pagCfg=j||{ativo:false}).catch(()=>S.pagCfg={ativo:false})}
function blocoPagto(){const f=S.fx;if(f.pag!=='part')return '';const cfg=S.pagCfg||{};const cob=f.cob;
 const brl=v=>'R$ '+Number(v||0).toFixed(2).replace('.',',');
 return `<div class="pagto"><h3 class="h3">Como prefere pagar?</h3><div class="opts two">
  <button class="opt ${f.forma==='adiant'?'on':''}" data-act="forma" data-v="adiant" ${cfg.ativo?'':'disabled'}>${SEL}<span><b>Adiantamento</b><small>${cfg.ativo?'Pague agora pelo app'+(cfg.valor?' · '+brl(cfg.valor):''):'Em breve'}</small></span></button>
  <button class="opt ${f.forma==='local'?'on':''}" data-act="forma" data-v="local">${SEL}<span><b>Pagamento no local</b><small>Paga no dia do atendimento</small></span></button></div>
  ${f.forma==='adiant'&&cfg.ativo?(cob&&cob.pago?`<p class="cob ok">✓ Pagamento confirmado. Agora envie a mensagem.</p>`:cob&&cob.url?`<div class="pg-link"><a class="btn pri" href="${esc(cob.url)}" target="_blank" rel="noopener">Pagar agora</a><a class="btn" href="https://wa.me/55${(S.user||{}).cel}?text=${encodeURIComponent('Link de pagamento VittaOne: '+cob.url)}" target="_blank" rel="noopener">Receber o link no meu WhatsApp</a><p class="sm mut"><span class="spin sm2" aria-hidden="true"></span> Aguardando a confirmação do pagamento…</p></div>`:`<button class="btn pri" data-act="gerapag" style="width:100%">Gerar link de pagamento</button>`):''}</div>`}
async function gerarCobranca(){const f=S.fx,u=S.user||{};const b=document.querySelector('[data-act=gerapag]');if(b){b.disabled=true;b.textContent='Gerando…'}
 try{const r=await fetch(SB5+'/functions/v1/pax-cobranca',{method:'POST',headers:{'Content-Type':'application/json',apikey:K5,Authorization:'Bearer '+K5},body:JSON.stringify({acao:'criar',nome:u.nome,cel:u.cel,descricao:(f.tipo==='exame'?'Exame: ':'Consulta: ')+(f.tipo==='exame'?(f.exames||[]).join(', '):f.esp)})});const j=await r.json();
  if(!j.ok)throw 0;f.cob={id:j.id,url:j.url,pago:false};render();esperarPago()}catch(e){toast('Não foi possível gerar o link agora. Tente de novo ou escolha pagar no local.');render()}}
function esperarPago(){clearInterval(S._pp);S._pp=setInterval(async()=>{const f=S.fx;if(!f||!f.cob||f.cob.pago){clearInterval(S._pp);return}
 try{const j=await rpc('pax_cobranca_status',{p_id:f.cob.id});if(j&&j.pago){f.cob.pago=true;clearInterval(S._pp);if(S.view==='fluxo')render();toast('Pagamento confirmado!')}}catch(e){}},5000)}
const _msg8=msgFluxo;msgFluxo=function(f,link){let m=_msg8(f,link);
 if(f.pag!=='part'){const c=CONV.find(x=>x.id===f.conv);m=m.replace(/Pagamento: .*\n/,`Atendimento: Pro Bono · Convênio ${c?c.n:''}\n`)}
 else m=m.replace(/Pagamento: .*\n/,`Pagamento: Vitta Particular · ${f.forma==='adiant'&&f.cob&&f.cob.pago?'PAGO pelo app (adiantamento)':'pagamento no local'}\n`);
 if(f.convLido)m=m.replace(/(Exame\(s\): .*\n)/,`$1Convênio no pedido médico: ${f.convLido}\n`);
 if(f.tipo==='consulta')m=m.replace(/Preferência: .*\n/,'');return m};

/* transição ao trocar de tela pelo menu inferior */
document.addEventListener('click',e=>{const b=e.target.closest('.nav>button');if(!b)return;const app=$('app');if(!app)return;app.classList.remove('tr-in');void app.offsetWidth;app.classList.add('tr-in')},true);

document.addEventListener('click',e=>{const t=e.target.closest('[data-act]');if(!t)return;const a=t.dataset.act,f=S.fx;
 if(a==='fpag8'&&f){if(t.dataset.v==='part'){f.pag='part';f.troca=false;pagCfg().then(()=>{})}else{f.pag='conv';if(!f.conv&&convDoUser())f.conv=convDoUser().id;f.troca=!f.conv}f.forma=null;f.cob=null;render()}
 else if(a==='cvabre'&&f){f.troca=!f.troca;render()}
 else if(a==='cvsel'&&f){f.troca=false}
 else if(a==='forma'&&f){f.forma=t.dataset.v;render()}
 else if(a==='gerapag'&&f){gerarCobranca()}
 else if(a==='fprox'&&f&&f.tipo==='consulta'&&f.step===2&&!(f.pag==='part'||f.conv)){e.stopImmediatePropagation()}},true);
document.addEventListener('click',e=>{const t=e.target.closest('[data-act=fprox]');if(t&&S.fx&&S.fx.pag==='part')pagCfg().then(()=>{if(S.view==='fluxo'&&S.fx&&S.fx.step===4)render()})});


/* ============ v8.1: especialidade avança sozinha · Pro Bono com "Não declarar" ============ */
const _cpl81=cvpLista;cvpLista=function(l,sel){const q=norm(S.qcv||'');const nd=!q||'nao declarar'.includes(q)?`<button class="cvp txt nd ${sel==='nd'?'on':''}" data-act="cvsel" data-k="nd"><span>Não declarar</span>${sel==='nd'?SEL:''}</button>`:'';return nd+_cpl81(l,sel)};
const _cpb81=cartaoProBono;cartaoProBono=c=>{const f=S.fx;const h=_cpb81(c);return f&&f.conv==='nd'?h.replace('<b>Escolha abaixo</b>','<b>Não declarar</b>'):h};
const _bpnd=blocoPag;blocoPag=function(){const f=S.fx;let h=_bpnd();if(f&&f.conv==='nd')h=h.replace('<small>Pelo seu convênio</small>','<small>Não declarar</small>').replace('>Escolher convênio<','>Trocar convênio<');return h};
const _m81=msgFluxo;msgFluxo=function(f,l){let m=_m81(f,l);if(f.pag!=='part'&&f.conv==='nd')m=m.replace(/Atendimento: Pro Bono · Convênio .*\n/,'Atendimento: Pro Bono · Convênio não declarado\n');return m};
document.addEventListener('click',e=>{const t=e.target.closest('[data-act=cvsel]');if(t&&S.fx&&t.dataset.k==='nd'){e.stopImmediatePropagation();S.fx.conv='nd';S.fx.pag='conv';S.fx.troca=false;S.qcv='';render()}},true);

/* ============ v9.1: especialidade com expansão suave, título do pagamento, leitura do convênio reforçada ============ */
document.addEventListener('click',e=>{const t=e.target.closest('[data-act=fesp]');const f=S.fx;if(!t||!f)return;e.stopImmediatePropagation();if(f._pick)return;f._pick=1;
 const red=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;f.esp=t.dataset.v;t.classList.add('pick');
 document.querySelectorAll('.espb').forEach(x=>{if(x!==t)x.classList.add('fade')});
 setTimeout(()=>{f.step=2;f._pick=0;render();scrollTo(0,0);const app=$('app');if(app){app.classList.remove('tr-up');void app.offsetWidth;app.classList.add('tr-up')}},red?0:340)},true);
const _fx91=VIEWS.fluxo;VIEWS.fluxo=function(){const f=S.fx;let h=_fx91();if(f&&f.step===2){const tps=[...new Set((f.exames||[]).map(n=>tipoEx(n)))];const alvo=f.tipo==='consulta'?f.esp:(tps.length===1?(tps[0]==='rm'?'Ressonância Magnética':'Tomografia Computadorizada'):tps.length?'Ressonância e Tomografia':'Exame');h=h.replace('<h2 class="h2">Confirme o pagamento</h2>',`<h2 class="h2">Confirme o pagamento <span class="tit-esp">· ${esc(alvo)}</span></h2>`)}return h};
/* leitura do convênio: imagem tratada (cinza, contraste, maior) e busca tolerante a erros de leitura */
function prepOCR(dataUrl){return new Promise(ok=>{const im=new Image();im.onload=()=>{const k=Math.min(2.2,2000/Math.max(im.width,im.height));const w=Math.round(im.width*k),h=Math.round(im.height*k);const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.filter='grayscale(1) contrast(1.6) brightness(1.08)';x.drawImage(im,0,0,w,h);ok(c.toDataURL('image/png'))};im.onerror=()=>ok(dataUrl);im.src=dataUrl})}
lerPedido=async function(dataUrl){const T=await carregarTess();const r=await T.recognize(await prepOCR(dataUrl),'por');return (r&&r.data&&r.data.text)||''};
function lev(a,b){if(Math.abs(a.length-b.length)>2)return 9;const d=[...Array(b.length+1).keys()];for(let i=1;i<=a.length;i++){let p=d[0];d[0]=i;for(let j=1;j<=b.length;j++){const t=d[j];d[j]=Math.min(d[j]+1,d[j-1]+1,p+(a[i-1]===b[j-1]?0:1));p=t}}return d[b.length]}
const _ac91=acharConv;acharConv=function(txt){const r=_ac91(txt);if(r)return r;const t=norm(txt).replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ');const ws=t.split(' ');
 if(/sistema\s*unic|s\s*u\s*s\b|\bsus\b|cartao\s*nacional\s*de\s*saude|prefeitura|secretaria\s*(municipal|estadual)\s*de\s*saude|\bubs\b|\bama\b/.test(t))return 'SUS';
 const nomes=[['sulamerica','SulAmérica'],['bradesco','Bradesco Saúde'],['amil','Amil'],['unimed','Central Nacional Unimed'],['notredame','Hapvida NotreDame Intermédica'],['intermedica','Hapvida NotreDame Intermédica'],['hapvida','Hapvida NotreDame Intermédica'],['porto','Porto Seguro Saúde'],['cassi','Cassi'],['cabesp','Cabesp'],['geap','GEAP Saúde'],['careplus','Care Plus'],['prevent','Prevent Senior'],['medsenior','MedSênior'],['mediservice','Mediservice'],['vivest','Vivest'],['funcesp','Vivest'],['biovida','Biovida Saúde'],['metrus','Metrus'],['medprev','MedPrev'],['solumedi','Solumedi'],['sonilab','Sonilab · Cruz Azul'],['postal','Postal Saúde'],['leader','Leader'],['select','Select']];
 if(/\b(amil|arnil|amll|arnll|aml|amii|arnii|ami1)\b/.test(t))return 'Amil';for(const w of ws){if(w.length<4)continue;for(const [k,n] of nomes)if(lev(w,k)<=(k.length>6?2:1))return n}
 const m=t.match(/(convenio|plano|operadora)\s*:?\s*([a-z ]{3,30})/);if(m){const v=m[2].trim().split(' ').slice(0,3).join(' ');if(v&&!/^(de|do|da|saude)$/.test(v))return v.replace(/\b\w/g,l=>l.toUpperCase())}return ''};

/* ============ v9.4: profissionais por especialidade (estilo Doctoralia) ============ */
/* Base: agenda das salas do MITI (dimagem-unineuro-relatorios/collector/bases_salas_miti, out/2026).
   esp/reg/sub/pub/mod em branco até o MITI confirmar. A lista só aparece com PROF_ON (autorização dos profissionais) ou ?profs=previa. */
const PROFS=[{"n":"Dr. Marcos Duchêne","esp":"Psiquiatria","reg":"","sub":"","pub":"","mod":"Presencial no MITI","dias":"","tur":""}];
const PROF_ON=true,PROF_PREVIA=/[?&]profs=previa/.test(location.search);
const iniciais=n=>n.replace(/^Dra?\.\s*/,'').split(' ').filter(w=>w.length>2).slice(0,2).map(w=>w[0]).join('').toUpperCase();
function profsDe(esp){return PROFS.filter(p=>p.esp===esp)}
function cardProf(p,f){const on=f.prof===p.n,pend='<i class="pf-pend">a confirmar</i>';
 const pag=f.pag==='part'?'Vitta Particular':f.conv&&f.conv!=='nd'?((CONV.find(x=>x.id===f.conv)||{}).n||'Pro Bono'):'Pro Bono';
 return `<article class="pf ${on?'on':''}"><div class="pf-top"><span class="pf-av" aria-hidden="true">${iniciais(p.n)}</span><div class="pf-id"><b>${esc(p.n)}</b><span>${p.esp?esc(p.esp):esc(f.esp)+' '+pend}</span>${p.reg?'<small>'+esc(p.reg)+'</small>':''}</div></div>
 <ul class="pf-ls">${p.sub?'<li><span>Formação</span><b>'+esc(p.sub)+'</b></li>':''}${p.pub?'<li><span>Atende</span><b>'+esc(p.pub)+'</b></li>':''}<li><span>Modalidade</span><b>${p.mod?esc(p.mod):'Presencial no MITI'}</b></li>${p.dias?'<li><span>No MITI</span><b>'+esc(p.dias)+' · '+esc(p.tur)+'</b></li>':''}<li><span>Pagamento</span><b>${esc(pag)}</b></li></ul>
 </article>`}
const _fx94=VIEWS.fluxo;VIEWS.fluxo=function(){const f=S.fx;
 if(f&&f.tipo==='consulta'&&f.step===3&&(PROF_ON||PROF_PREVIA)){const l=profsDe(f.esp);if(l.length){
  const h=_fx94.call(this);const i=h.indexOf('<h2 class="h2">');const top=i>0?h.slice(0,i):'';
  return top+`<h2 class="h2">Profissionais <span class="tit-esp">· ${esc(f.esp)}</span></h2>${PROF_PREVIA&&!PROF_ON?'<div class="info"><span><b>Prévia.</b> Lista desligada no app até os profissionais autorizarem. Especialidade e registro a confirmar com o MITI.</span></div>':''}
  <p class="sm mut">${l.length>1?l.length+' profissionais atendem':'Atende'} no MITI · Av. Paulista. A clínica indica o horário disponível ao confirmar.</p><div class="pfs">${l.map(p=>cardProf(p,f)).join('')}</div>
  <button class="btn pri big" data-act="fprox">Continuar</button></section>`}}
 return _fx94.call(this)};
/* v8 pulava o passo 3 da consulta; com a lista ativa ele vira "Escolha o profissional" */
const _r94=VIEWS.fluxo;
document.addEventListener('click',e=>{const t=e.target.closest('[data-act]');const f=S.fx;if(!t||!f)return;const a=t.dataset.act;
 if(a==='fprof'){f.prof=t.dataset.v;render()}
 else if(a==='fprofx'){f.prof='Sem preferência';f.step=4;render();scrollTo(0,0)}},true);
const _m94=msgFluxo;msgFluxo=function(f,l){let m=_m94(f,l);if(0)m=m.replace(/(Celular: [^\n]*\n)/,`$1Profissional: ${f.prof}\n`);return m};

/* ============ v9.7: VittaOne · abertura com slogan (3 s) ============ */
(function(){const red=matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;const d=document.createElement('div');d.id='splash';d.setAttribute('role','status');
 d.innerHTML=`<div class="sp-in"><div class="sp-lg">${LOGO(84)}</div><h1 class="sp-nm"><b>Vitta</b>One</h1><p class="sp-sl">Sua saúde em um só lugar</p><span class="sp-bar"><i></i></span></div>`;
 document.body.appendChild(d);setTimeout(()=>{d.classList.add('out');setTimeout(()=>d.remove(),red?0:450)},2000);d.addEventListener('click',()=>{d.classList.add('out');setTimeout(()=>d.remove(),450)})})();

/* ============ v10.0: entrar com cadastro existente ============ */
VIEWS.entrar=function(){return `<section class="hero"><div class="row" style="gap:.8rem">${LOGO(46)}<h1 class="hello" style="flex:1">Entrar no VittaOne <small>Use o mesmo celular e o nome completo do seu cadastro.</small></h1></div></section>
 <section class="sec"><form class="card" data-form="login5" novalidate>
 <label class="f">Celular (WhatsApp)<input class="inp" name="cel" type="tel" inputmode="numeric" autocomplete="tel-national" data-live="cel" placeholder="(11) 90000-0000" required></label>
 <label class="f">Nome completo<input class="inp" name="nome" required autocomplete="name" placeholder="Como está no cadastro"></label>
 <div class="info red" id="enterr" role="alert" hidden></div>
 <button class="btn pri" type="submit" id="entbtn" style="flex:none;min-height:3.4rem;font-size:1.02rem">Entrar</button>
 <button class="lnk" type="button" data-act="nav" data-v="cadastro" style="margin-top:.4rem">Não tenho cadastro, quero criar</button></form></section>`};
function entErro(t){const e=$('enterr');if(e){e.textContent=t;e.hidden=!t}}
document.addEventListener('submit',async e=>{const F=e.target;if(!F.dataset||F.dataset.form!=='login5')return;e.preventDefault();
 const cel=dig5(F.elements.cel.value),nome=F.elements.nome.value.trim().replace(/\s+/g,' ');
 if(cel.length<10||cel.length>11)return entErro('Confira o celular: digite o DDD e o número.');
 if(nome.length<2)return entErro('Digite o nome completo usado no cadastro.');
 entErro('');const b=$('entbtn');b.disabled=true;b.textContent='Entrando…';
 try{const j=await rpc('pax_entrar',{p_telefone:cel,p_nome:nome});
  if(j&&j.ok){S.user={nome:j.nome,cel:fmtCel(j.telefone),conv:j.convenio||'Particular',cad:1,id:j.id};LS.set('user',S.user);S.view='inicio';render(true);toast('Bem-vindo(a) de volta, '+primeiroNome()+'!');return}
  entErro(j&&j.erro==='bloqueado'?'Muitas tentativas. Aguarde 15 minutos e tente de novo.':j&&j.erro==='nao_confere'?'Celular e nome não conferem com nenhum cadastro. Confira se o nome está igual ao do cadastro.':'Confira os dados e tente de novo.')
 }catch(err){entErro('Não foi possível entrar agora. Verifique a internet e tente de novo.')}
 b.disabled=false;b.textContent='Entrar'});
/* ============ INÍCIO ============ */
(function(){try{history.replaceState({pax:'base'},'')}catch(e){}const v=location.hash.slice(1);S.view=['buscar','agenda','perfil','novo'].includes(v)?v:'inicio';S.navAt=S.view;render(true);gpsAuto(true)})();
