/* =====================================================================
   Pax - Saúde · v3.0 (nov/2026)
   App de página única: dados em dados.js, sem servidor.
   Serviços gratuitos: OpenStreetMap/CARTO (mapas), Nominatim (endereços),
   OSRM (rotas), Mapillary e Wikimedia Commons (fotos), Google Maps (links).
   ===================================================================== */
const CFG={
 mapillary:'MLY|28963648059968063|2604d9bc5dd187e793f457ba123af6c0', /* token público do Mapillary (MLY|...). Também pode ser colado em Menu › Fontes e créditos */
 empresa:'[Nome da empresa]',email:'[e-mail de contato]',versao:'4.4',dataRef:'nov/2026'
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
const LOGO=(s,c1,c2)=>{c1=c1||'#0B4F5C';c2=c2||'#14A39A';return `<svg width="${s}" height="${s}" viewBox="0 0 64 64" aria-hidden="true"><path fill="${c2}" d="M32 5c7.5 7.5 7.5 18 0 25.5-7.5-7.5-7.5-18 0-25.5z"/><path fill="${c1}" d="M32 59c-7.5-7.5-7.5-18 0-25.5 7.5 7.5 7.5 18 0 25.5z"/><path fill="${c1}" d="M5 32c7.5-7.5 18-7.5 25.5 0-7.5 7.5-18 7.5-25.5 0z"/><path fill="${c2}" d="M59 32c-7.5 7.5-18 7.5-25.5 0 7.5-7.5 18-7.5 25.5 0z"/><g stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity=".75"><path d="M32 10v15M32 39v15M10 32h15M39 32h15"/></g><circle cx="32" cy="32" r="3.4" fill="${c2}"/></svg>`};
const PINSVG=c=>`<svg width="30" height="38" viewBox="0 0 30 38" aria-hidden="true"><path d="M15 37s13-12.3 13-22A13 13 0 0 0 2 15c0 9.7 13 22 13 22z" fill="${c}" stroke="#fff" stroke-width="2.5"/><circle cx="15" cy="15" r="5" fill="#fff"/></svg>`;
const STAR=(f,s)=>`<svg width="${s||18}" height="${s||18}" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="sg${Math.round(f*100)}"><stop offset="${f*100}%" stop-color="#F4B400"/><stop offset="${f*100}%" stop-color="#E3E8E8"/></linearGradient></defs><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" fill="url(#sg${Math.round(f*100)})"/></svg>`;
const estrelas=(v,s)=>`<span class="stars" aria-hidden="true">${[1,2,3,4,5].map(i=>STAR(Math.max(0,Math.min(1,v-i+1)),s)).join('')}</span>`;

/* ============ FOTOS (site oficial → Mapillary → Wikimedia Commons → miniatura do mapa) ============ */
const FOTOS=LS.get('fotos3',{});
function fonteFoto(p,u){if(p.fotoCred&&u===p.foto)return p.fotoCred;if(/wikimedia/.test(u))return'Wikimedia Commons';if(p.fotoRede)return'Imagem da rede';return'Site oficial'}
function fotosDe(p){const a=[];if(p.foto)a.push({u:p.foto,src:fonteFoto(p,p.foto),link:p.site||p.f});(p.fotos2||[]).forEach(u=>a.push({u,src:fonteFoto(p,u),link:p.site||p.f}));(FOTOS[p.id]||[]).forEach(x=>a.push(x));return a}
const FQ=[];let FQrun=0;
function pedirFotos(p){if(!p||isOnline(p)||p.la==null||FOTOS[p.id]||p._fq)return;p._fq=1;FQ.push(p);bombaFQ()}
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
function mapThumb(p,hx,hy){if(p.la==null)return`<span style="position:absolute;inset:0;background:linear-gradient(135deg,${CATS[p.c].cor},#0B4F5C);display:flex;align-items:center;justify-content:center">${I[IC_CAT[p.c]]('#fff',54,1.6)}</span>`;
 const z=16,[x,y]=tileXY(p.la,p.lo,z),px=x*256,py=y*256;let h='';
 for(let tx=Math.floor((px-hx)/256);tx<=Math.floor((px+hx)/256);tx++)for(let ty=Math.floor((py-hy)/256);ty<=Math.floor((py+hy)/256);ty++)h+=`<img src="https://${'abcd'[(tx+ty)&3]}.basemaps.cartocdn.com/rastertiles/voyager/${z}/${tx}/${ty}.png" style="left:${Math.round(tx*256-px)}px;top:${Math.round(ty*256-py)}px" alt="" loading="lazy">`;
 return `<span class="tiles" aria-hidden="true">${h}</span><span class="pin">${PINSVG(CATS[p.c].cor)}</span>`}
function coverBase(p,h){h=h||'8.5rem';const f=fotosDe(p)[0];const c=CATS[p.c];
 return `<span class="cover" data-cov="${p.id}" data-h="${h}" style="height:${h}">${mapThumb(p,340,150)}${f?`<img class="ph" src="${esc(f.u)}" alt="Foto: ${esc(p.n)}" loading="lazy" referrerpolicy="no-referrer" decoding="async" onerror="var s=this.parentNode.querySelector('.src');if(s)s.textContent='Ilustração Pax';this.remove()">`:''}<span class="bdg">${esc(c.um.toUpperCase())}</span><span class="src">${f?esc(f.src):p.la!=null?'Mapa · OSM/CARTO':'Online'}</span></span>`}
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
 return `<article class="pcard"><button class="open" data-act="abrir" data-id="${p.id}" aria-label="Ver detalhes de ${esc(p.n)}">${cover(p,'8rem')}
 <span class="bd"><span class="meta">${stTag(p)}${p.g?starTag(p):''}${p.sus?'<span class="tag blue">SUS</span>':''}<span class="tag gray">${p.pr?'A partir de R$ '+p.pr:p.sus?'Gratuito (SUS)':'Preço sob consulta'}</span>${alTags(p)}</span>
 <span class="nm">${esc(p.n)}</span>
 <span class="meta">${isOnline(p)?I.video('#0E6B6B',16)+esc(p.sp||'Teleconsulta por vídeo'):I.pin('#0B4F5C',16)+`<span>${esc(p.b)} · <b style="color:var(--ink)">${fkm(d)}</b>${p.sp?' · '+esc(p.sp):''}</span>`}</span></span></button>
 <div class="acts">${contatoBtns(p)}</div></article>`}
function mini(p){const d=dist(p);return `<button class="mini" data-act="abrir" data-id="${p.id}">${cover(p,'7.2rem').replace('class="cover"','class="cover" style="border-radius:0"')}<span class="bd"><span class="meta">${stTag(p)}</span><b>${esc(p.n)}</b><span class="sm mut">${esc(p.b)} · ${fkm(d)}${p.g?' · ★ '+String(p.g.v).replace('.',','):''}</span></span></button>`}
function origemChip(light){const o=S.origin,gps=o.k==='gps';const linha2=gps?(o.sub&&o.sub!=='GPS do aparelho'?o.sub:'Localização atual pelo GPS'):(o.sub||'');
 return `<button class="ref${light?' light':''}" data-act="picker" data-alvo="origin" aria-label="Endereço de Referência: ${esc(o.n)}${linha2?', '+esc(linha2):''}. Toque para alterar">
 <span class="ref-ic">${gps?I.gps('#fff',22):I.pin('#fff',22)}</span>
 <span class="ref-tx"><span class="ref-lb">Endereço de Referência:</span><b class="ell">${esc(gps?'Você está aqui':o.n)}</b>${linha2?`<span class="ell ref-sub">${esc(linha2)}</span>`:''}</span>
 <span class="ref-bt">Alterar</span></button>${S.gpsMsg?`<span class="ref-msg">${esc(S.gpsMsg)}</span>`:''}`}
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
 return `<section class="hero"><h1 class="hello">${n?'Olá, '+esc(n)+'!':'Olá!'} <small>O que você precisa hoje?</small></h1>${origemChip()}${buscaForm('qh','Especialidade, exame, local ou bairro','')}</section>
 <section class="sec">${filtrosRapidos()}${cubosTipo(true)}</section>
 <section class="sec adv"><h2 class="h2">Atalhos</h2><div class="hscroll">${at.map(([k,t,ic,c])=>`<button class="short" data-act="atalho" data-k="${k}"><i>${I[ic](c,26)}</i>${t}</button>`).join('')}</div></section>
 <section class="sec"><a class="info red" href="tel:192" style="align-items:center">${I.ambul('#B3261E',28)}<span style="flex:1"><b>Emergência? Ligue 192 (SAMU)</b><br>Bombeiros: 193 · Não espere agendar.</span>${I.phone('#B3261E',22)}</a></section>
 <section class="sec adv"><div class="row between"><h2 class="h2">Destaques perto de você</h2><button class="lnk sm" data-act="nav" data-v="buscar">Ver todos</button></div><div class="hscroll">${dest.map(mini).join('')}</div></section>
 <section class="sec"><h2 class="h2">Pronto-socorro 24h mais perto</h2><div class="card" style="padding:.2rem 1rem">${ps.map(p=>`<div class="lrow"><span class="lic" style="background:#FBE9E8">${I.build('#B3261E',20)}</span><button data-act="abrir" data-id="${p.id}" class="col" style="flex:1;text-align:left;min-width:0"><b style="font-size:.95rem">${esc(p.n)}</b><span class="sm mut">${esc(p.cv)} · ${fkm(dist(p))}</span></button><button class="round" data-act="rota" data-id="${p.id}" aria-label="Como chegar a ${esc(p.n)}">${I.route('#0B4F5C',20)}</button></div>`).join('')}</div></section>
 <section class="sec adv"><h2 class="h2">Agende pelo WhatsApp</h2><p class="p mut" style="margin-top:-.4rem">WhatsApp oficial. A mensagem já vai pronta.</p><div class="grid">${was.map(card).join('')}</div></section>
 <section class="sec adv"><h2 class="h2">Abertos agora, mais perto</h2>${abertos.length?`<div class="grid">${abertos.map(card).join('')}</div>`:'<div class="empty">Nenhum local com horário confirmado está aberto agora.</div>'}</section>`}
function vNovo(){return phead('O que você quer agendar?','Toque em uma opção para seguir',false)+`<section class="sec">${cubosTipo(false)}
 <div class="info">${I.pin('#0A4B44',20)}<span>Endereço de Referência: <b>${esc(S.origin.k==='gps'?'Você está aqui':S.origin.n)}</b>. <button class="lnk" data-act="picker" data-alvo="origin">Trocar</button></span></div></section>`}
function vModo(){const f=S.flow;const c=f.tipo==='consulta';const cor=c?'#B02A62':'#1C5BA8',cls=c?'pink':'blue';
 const n=k=>k==='presencial'?LOC.filter(p=>!isOnline(p)&&p.esp.length).length:k==='online'?LOC.filter(p=>p.on.length).length:k==='lab'?LOC.filter(p=>p.lab).length:LOC.filter(p=>p.img.length).length;
 const op=c?[['presencial','Presencial','Clínica, hospital ou consultório perto de você. Veja distância, rota e horário.','build'],['online','Online','Teleconsulta e médicos por vídeo. Atendimento sem sair de casa.','video']]:[['lab','Laboratoriais','Sangue, urina, glicemia, colesterol, tireoide e outras análises.','tube'],['img','De imagem','Raio-X, ultrassom, tomografia, ressonância, mamografia e mais.','scan']];
 return phead(c?'Consultas':'Exames',c?'Como prefere ser atendido?':'Que tipo de exame?')+`<section class="sec"><div class="cubes">${op.map(([k,t,d,ic])=>cubo({cls,act:'modo',v:k,ic:I[ic](cor,34),t,d,n:n(k)+(n(k)===1?' local':' locais'),cor,bg:I[ic](cor,150,1.4)}).replace('class="cube','class="cube hero2')).join('')}</div>
 <div class="card adv" hidden><h2 class="h3">Como funciona</h2>${[['1','Escolha '+(c?'a especialidade':'o exame')],['2','Compare distância, horário e nota'],['3','Agende pelo WhatsApp ou ligue']].map(([a,b])=>`<div class="row"><span class="lic" style="width:2rem;height:2rem;border-radius:50%;font-weight:800;color:${cor};background:${c?'#FDE8F0':'#E5EEFC'}">${a}</span><span class="p">${b}</span></div>`).join('')}</div></section>`}
const ORD_ESP=['clinica','cardio','gineco','pedi','dermato','orto','oftalmo','gastro','endo','neuro','otorrino','psiq','uro'];
function itensLista(){const f=S.flow;
 if(f.modo==='lab')return LABX.map((x,i)=>({k:'lab'+i,t:x[0],s:x[1],p:x[2],ic:LABIC[i]||'tube',n:LOC.filter(p=>p.lab).length}));
 if(f.modo==='img')return Object.keys(IMGX).map(k=>({k,t:IMGX[k][0],s:IMGX[k][1],p:IMGX[k][2],ic:IC_IMG[k]||'scan',n:LOC.filter(p=>p.img.includes(k)).length}));
 return ORD_ESP.filter(k=>ESP[k]).concat(Object.keys(ESP).filter(k=>!ORD_ESP.includes(k))).map(k=>({k,t:ESP[k][0],s:ESP[k][1],ic:IC_ESP[k]||'steth',n:LOC.filter(p=>f.modo==='online'?p.on.includes(k):(!isOnline(p)&&p.esp.includes(k))).length}))}
function vItens(){const f=S.flow;const tit=f.modo==='presencial'?'Consulta presencial':f.modo==='online'?'Consulta online':f.modo==='lab'?'Exames laboratoriais':'Exames de imagem';
 return phead(tit,f.tipo==='consulta'?'Escolha a especialidade':'Escolha o exame')+`<section class="sec">${buscaForm('qi',f.tipo==='consulta'?'Especialidade ou sintoma':'Nome do exame',S.qi,'qi')}<div id="itens" class="cubes"></div></section>`}
function renderItens(){const box=$('itens');if(!box)return;const t=norm(S.qi);const f=S.flow;const c=f.tipo==='consulta',cor=c?'#B02A62':'#1C5BA8',bg=c?'#FDE8F0':'#E5EEFC';
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
 <div class="row"><button class="btn" data-act="showF" aria-expanded="${!!S.showF}">${SVG('<path d="M4 6h16M7 12h10M10 18h4"/>','#0B4F5C',20)} Filtros${nf?' ('+nf+')':''}</button>${online?'':`<button class="btn" data-act="showMap" aria-expanded="${!!S.showMap}">${I.map('#0B4F5C',20)} ${S.showMap?'Esconder mapa':'Ver no mapa'}</button>`}</div>
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
 else ks.forEach(k=>{const R=REDES[k];h+=`<a class="soc" href="${esc(p.soc[k])}" target="_blank" rel="noopener"><span class="si ${R[1]}">${SVG(R[2],'#fff',22)}</span><span class="col" style="flex:1;min-width:0"><b>${R[0]}</b><span class="sm mut ell">${esc(handle(p.soc[k]))}</span></span>${I.chev('#4A6066',18)}</a>`});
 if(p.site)h+=`<a class="soc" href="${esc(p.site)}" target="_blank" rel="noopener"><span class="si site">${SVG('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>','#fff',22)}</span><span class="col" style="flex:1;min-width:0"><b>Site oficial</b><span class="sm mut ell">${esc(p.site.replace(/^https?:\/\/(www\.)?/,'').replace(/\/$/,''))}</span></span>${I.chev('#4A6066',18)}</a>`;
 if(/doctoralia/.test(p.f||''))h+=`<a class="soc" href="${esc(p.f)}" target="_blank" rel="noopener"><span class="si dc">${I.steth('#fff',22)}</span><span class="col" style="flex:1"><b>Doctoralia</b><span class="sm mut">Perfil, preços e agenda</span></span>${I.chev('#4A6066',18)}</a>`;
 if(false)h+=`<a class="soc" href="${gplace(p)}" target="_blank" rel="noopener"><span class="si gm">${PINSVG('#EA4335').replace('width="30" height="38"','width="20" height="26"')}</span><span class="col" style="flex:1"><b>Google Maps</b><span class="sm mut">Fotos, avaliações e horários</span></span>${I.chev('#4A6066',18)}</a>`;
 return `<div class="card"><div class="row between"><h2 class="h3">Redes sociais e links</h2>${ks.length?'':'<span class="tag gray">Sem rede oficial</span>'}</div>${ks.length?'':'<p class="sm mut" style="margin:-.3rem 0 0">Não encontramos rede social oficial deste local. Veja os links abaixo.</p>'}<div class="col" style="gap:.5rem">${h}</div></div>`}
function blocoAvaliacao(p){const g=p.g;
 return `<div class="card"><h2 class="h3">Avaliação ⭐</h2>${g?`<div class="rate"><span class="big">${String(g.v).replace('.',',')}</span><span class="col" style="gap:.2rem">${estrelas(g.v,20)}<span class="sm mut">${g.n?g.n.toLocaleString('pt-BR')+' avaliações · ':''}Google Maps · consultado em ${g.d||CFG.dataRef}${g.f?` (<a class="lnk" href="${esc(g.f)}" target="_blank" rel="noopener">fonte</a>)`:''}</span></span></div>`:`<p class="p mut">Ainda não registramos a nota deste local. Veja a nota atualizada no Google Maps.</p>`}
 <a class="btn teal" href="${gplace(p)}" target="_blank" rel="noopener" style="flex:none">★ Ver e avaliar no Google Maps</a>
 </div>`}
function vLocal(){const p=byId(S.sel);if(!p)return vInicio();const d=dist(p),c=CATS[p.c],st=status(p),on=isOnline(p);
 BAR=`<div class="bar">${p.wa?`<button class="btn wa" data-act="wa" data-id="${p.id}" style="font-size:1rem">${ICW} Agendar pelo WhatsApp</button>`:on?`<a class="btn pri" href="${esc(p.url)}" target="_blank" rel="noopener">${I.video('#fff',20)} Agendar no serviço</a>`:p.t.length?`<button class="btn pri" data-act="ligar" data-id="${p.id}">${I.phone('#fff',20)} Ligar para agendar</button>`:`<button class="btn pri" data-act="rota" data-id="${p.id}">Ver como chegar</button>`}</div>`;
 return `<div style="position:relative" id="gal">${galeria(p)}</div>
 <div style="position:relative;margin-top:-1.6rem;border-radius:1.6rem 1.6rem 0 0;background:var(--bg);z-index:2">
 <div class="row" style="position:absolute;top:-4.6rem;left:1rem;right:1rem;justify-content:space-between;pointer-events:none"><button class="back" data-act="voltar" aria-label="Voltar" style="pointer-events:auto">${I.back('#0C2329',20)}</button><span class="row" style="pointer-events:auto"><button class="back" data-act="compart" data-id="${p.id}" aria-label="Compartilhar">${I.share('#0C2329',20)}</button>${heartBtn(p).replace('class="round"','class="back"')}</span></div>
 <section class="sec" style="padding-top:1.2rem"><div class="col" style="gap:.5rem"><div class="meta"><span class="tag" style="background:${c.fundo};color:${c.cor}">${I[IC_CAT[p.c]](c.cor,14)} ${esc(c.um)}</span>${stTag(p)}${starTag(p)}${p.sus?'<span class="tag blue">SUS – gratuito</span>':''}</div>
 <h1 style="margin:0;font-size:1.6rem;line-height:1.2;font-weight:800">${esc(p.n)}</h1>${p.sp?`<span style="font-size:.95rem;font-weight:700">${esc(p.sp)}${p.crm?` · <span class="mut" style="font-weight:600">${esc(p.crm)}</span>`:''}</span>`:''}
 ${on?'':`<span class="meta">${I.pin('#0B4F5C',16)}${esc(p.b)} · <b style="color:var(--ink)">${fkm(d)}</b> de ${esc(S.origin.n)}</span>`}</div>
 ${p.al?`<div class="info warn">${I.alert('#5E3B08',20)}<span>${esc(p.al)}</span></div>`:''}
 <div class="acts">${p.t.length&&p.wa?`<button class="btn" data-act="ligar" data-id="${p.id}">${I.phone('#0B4F5C',20)} Ligar</button>`:''}${on?`<a class="btn pri" href="${esc(p.url)}" target="_blank" rel="noopener">${I.video('#fff',20)} Acessar</a>`:`<button class="btn pri" data-act="rota" data-id="${p.id}">${I.route('#fff',20)} Como chegar</button>`}${S.a11y.ler?`<button class="round" data-act="ler" aria-label="Ouvir informações">${I.speaker('#0B4F5C',22)}</button>`:''}</div>
 ${seloCRM(p)}
 <div class="card"><h2 class="h3">${I.info('#0B4F5C',20)} Sobre</h2><p class="p">${esc(descricao(p))}</p></div>
 ${blocoAvaliacao(p)}
 ${blocoRedes(p)}
 <div class="card"><h2 class="h3">${I.clock('#0B4F5C',20)} Horário</h2><p class="p">${esc(p.hr)}</p>${st.k==='?'&&!on?'<span class="sm mut">Horário não confirmado. Ligue antes de ir.</span>':''}</div>
 <div class="card"><h2 class="h3">${on?I.video('#0B4F5C',20)+' Como funciona':I.pin('#0B4F5C',20)+' Endereço'}</h2><p class="p">${esc(p.e)}${p.comp?`<br><span class="sm mut">${esc(p.comp)}</span>`:''}</p>
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
  ${modos.map(([pf,t,ic,gm])=>`<div class="mode ${S.rmode===pf?'sel':''}"><button class="modebtn" data-act="rmode" data-k="${pf}" aria-pressed="${S.rmode===pf}"><span class="lic">${SVG(ic,'#0B4F5C',24)}</span><span class="col" style="flex:1;gap:.1rem;text-align:left"><b style="font-size:.95rem">${t}</b><span class="sm mut" id="rs_${pf}">calculando…</span></span><span class="t" id="rt_${pf}">…</span></button><a class="gbtn" href="${gmaps(o,d,gm)}" target="_blank" rel="noopener" aria-label="Abrir ${t} no Google Maps">Google</a></div>`).join('')}
  <div class="mode"><span class="modebtn"><span class="lic">${SVG('<rect x="5" y="3" width="14" height="15" rx="3"/><path d="M5 11h14M8 21l2-3M16 21l-2-3"/>','#0B4F5C',24)}</span><span class="col" style="flex:1;gap:.1rem"><b style="font-size:.95rem">Trem, metrô ou ônibus</b><span class="sm mut">${tp==null?'Perto demais: vale ir a pé':esc(so.e.n)+' → '+esc(sd.e.n)}</span></span><span class="t">${tp==null?'—':'~'+fmin(tp)}</span></span><a class="gbtn" href="${gmaps(o,d,'transit')}" target="_blank" rel="noopener">Google</a></div>
  <div class="card adv"><h2 class="h3">Estações mais próximas</h2>
  <div class="lrow"><span class="dot" style="background:#2563EB"></span><span class="col" style="flex:1"><b style="font-size:.9rem">${esc(so.e.n)}</b><span class="sm mut">${esc(so.e.l)}</span></span><span class="sm" style="font-weight:800">${fkm(so.d)} da partida</span></div>
  <div class="lrow"><span class="dot" style="background:var(--pet)"></span><span class="col" style="flex:1"><b style="font-size:.9rem">${esc(sd.e.n)}</b><span class="sm mut">${esc(sd.e.l)}</span></span><span class="sm" style="font-weight:800">${fkm(sd.d)} do destino</span></div>
  <span class="sm mut">Linhas e ônibus exatos, com horário em tempo real: botão "Google" do transporte público.</span></div>
  ${links(o,d)}
  <p class="sm mut" style="margin:0">A pé, bicicleta e carro: rota real pelas ruas (OpenStreetMap), sem considerar trânsito. Transporte público: estimativa pela estação mais próxima.</p>`}
 const du=d&&d.id&&byId(d.id);
 return phead('Como chegar','Entre e saia dos endereços quando quiser')+`<section class="sec"><div class="col" style="gap:.5rem;position:relative">${campo('origin',o,'#2563EB','Endereço de Referência')}${campo('dest',d,'var(--pet)','Indo para')}
 <button class="round" data-act="trocar" aria-label="Inverter partida e destino" style="position:absolute;right:-.4rem;top:50%;transform:translateY(-50%);width:2.6rem;height:2.6rem">${I.swap('#0B4F5C',20)}</button></div>
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
  window.L.circleMarker([d.la,d.lo],{radius:10,color:'#fff',weight:3,fillColor:'#0B4F5C',fillOpacity:1}).addTo(m).bindTooltip(d.n);
  const r=res[S.rmode];if(r){window.L.polyline(r.geo,{color:'#0B4F5C',weight:5,opacity:.85}).addTo(m);r.geo.forEach(x=>b.push(x))}else window.L.polyline(b,{color:'#0B4F5C',weight:3,dashArray:'6 8'}).addTo(m);
  [estMaisProx(o).e,estMaisProx(d).e].forEach(e=>window.L.circleMarker([e.la,e.lo],{radius:6,color:'#7A4A0E',weight:2,fillColor:'#F2B33D',fillOpacity:1}).addTo(m).bindTooltip(e.n));
  m.fitBounds(b,{padding:[30,30]})}}

/* ---- agenda ---- */
function vAgendaBase(){const h=S.hist;const pend=h.filter(x=>!x.ok).length;
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
const FAQ=[['O Pax marca a consulta por mim?','Não. O Pax encontra o local e abre o WhatsApp oficial com a mensagem pronta. Você envia, e a clínica responde com os horários. Onde não há WhatsApp oficial, mostramos o telefone.'],['O Pax é gratuito?','Sim. O app é gratuito para pacientes. Os preços que aparecem são das clínicas, quando publicados.'],['Como sei se o local está aberto?','Calculamos pelo horário de Brasília com o horário publicado pelo local. Quando não conseguimos confirmar, aparece "Horário a confirmar": ligue antes de ir.'],['De onde vêm as notas ⭐?','Do Google Maps, pesquisadas em '+CFG.dataRef+'. Para ver a nota atual ou avaliar, use o botão "Avaliar no Google Maps".'],['Como calculo a rota?','Na página do local, toque em "Como chegar". Você pode trocar o ponto de partida e o destino quando quiser e abrir no Google Maps ou chamar um Uber.'],['Posso agendar para meu filho ou meus pais?','Sim. Cadastre dependentes no Perfil. Na hora do WhatsApp, escolha quem é o paciente.'],['Meus dados vão para algum servidor?','Não. Nome, celular, dependentes, favoritos e agenda ficam só neste aparelho. Você pode apagar tudo no Perfil.'],['Encontrei um dado errado. Como aviso?','Use "Fale conosco" no menu. Clínicas podem pedir correção em "Para clínicas e médicos".']];
const PGS={
 acess:['Acessibilidade','Para idosos, pessoas com deficiência e para todos',()=>`<div class="card"><h2 class="h3">Tamanho da letra</h2><div class="seg" role="group" aria-label="Tamanho da letra">${[[0,'A','Normal'],[1,'A+','Grande'],[2,'A++','Muito grande']].map(([v,t,l])=>`<button data-act="fs" data-v="${v}" aria-pressed="${S.a11y.fs===v}" aria-label="${l}" style="font-size:${1+v*.2}rem">${t}</button>`).join('')}</div></div>
 <div class="card" style="padding:.2rem 1rem">${TOG('hc','Alto contraste','Cores mais fortes e bordas pretas')}${TOG('leg','Letra de leitura fácil','Fonte Atkinson Hyperlegible, feita para baixa visão')}${TOG('ler','Leitura em voz alta','Mostra o botão amarelo que lê a tela')}${TOG('simples','Modo simples','Só o essencial, botões maiores')}${TOG('nomo','Reduzir animações','Desliga efeitos de movimento')}</div>
 <div class="card"><h2 class="h3">Busca por voz</h2><p class="p">${SR?'Disponível: toque no microfone no topo de qualquer tela ou dentro das buscas e diga, por exemplo, "cardiologista" ou "hemograma".':'Este navegador não oferece busca por voz. No Android, use o Google Chrome.'}</p>${TTS?`<button class="btn" data-act="testevoz" style="flex:none">${I.speaker('#0B4F5C',20)} Ouvir um exemplo</button>`:''}</div>`],
 ajuda:['Ajuda','Perguntas frequentes',()=>FAQ.map(([q,a])=>`<details class="faq"><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')],
 contato:['Fale conosco','Dúvidas, sugestões e correções',()=>`<div class="card"><p class="p">Fale com a equipe do Pax - Saúde. Respondemos em dias úteis.</p><div class="kv"><span class="mut">Empresa</span><b>${esc(CFG.empresa)}</b></div><div class="kv"><span class="mut">E-mail</span><b>${esc(CFG.email)}</b></div><a class="btn pri" href="mailto:${/@/.test(CFG.email)?CFG.email:''}?subject=${enc('Pax - Saúde: contato')}">${I.mail('#fff',20)} Escrever e-mail</a></div><div class="info warn">${I.alert('#5E3B08',20)}<span>O Pax não faz atendimento médico. Em emergência, ligue 192.</span></div>`],
 clinicas:['Para clínicas e médicos','Apareça no Pax ou corrija seus dados',()=>`<div class="card"><h2 class="h3">Seu local já pode estar aqui</h2><p class="p">Listamos ${LOC.length} locais em São Paulo com dados públicos. Para corrigir endereço, horário, WhatsApp oficial, fotos ou redes sociais, fale com a gente.</p>${['Cadastro gratuito na versão atual','Botão de WhatsApp com mensagem pronta','Rota, mapa e nota do Google Maps','Médicos: envie sua foto profissional para aparecer no perfil'].map(t=>`<div class="row">${I.shield('#14A39A',20)}<span class="p">${t}</span></div>`).join('')}<a class="btn pri" href="mailto:${/@/.test(CFG.email)?CFG.email:''}?subject=${enc('Pax - Saúde: cadastro de clínica')}">${I.brief('#fff',20)} Pedir cadastro ou correção</a></div>`],
 termos:['Termos de Uso','Versão preliminar · '+CFG.dataRef,()=>`<div class="card"><p class="p sm mut">Rascunho para revisão jurídica. Empresa responsável: ${esc(CFG.empresa)}.</p>${[['1. O que é o Pax','O Pax - Saúde é um guia que ajuda a encontrar consultas e exames, ver como chegar e iniciar o agendamento pelo WhatsApp ou telefone do próprio local.'],['2. O que o Pax não faz','O Pax não presta serviço médico, não marca consultas em nome do usuário, não garante vagas, preços ou horários e não substitui orientação médica. Em emergência, ligue 192.'],['3. Informações dos locais','Os dados vêm de fontes públicas (sites oficiais, CNES, catálogos) e podem mudar. Confirme com o local antes de ir.'],['4. Links externos','WhatsApp, Google Maps, Uber, redes sociais e serviços de teleconsulta têm termos próprios.'],['5. Uso adequado','Não use o Pax para enviar mensagens falsas ou abusivas aos locais.'],['6. Alterações','Estes termos podem mudar; a data da versão fica no topo.']].map(([t,x])=>`<h2 class="h3">${t}</h2><p class="p">${x}</p>`).join('')}</div>`],
 privacidade:['Política de Privacidade','Lei Geral de Proteção de Dados (LGPD)',()=>`<div class="card"><p class="p sm mut">Rascunho para revisão jurídica. Controlador: ${esc(CFG.empresa)} · contato: ${esc(CFG.email)}.</p>${[['Dados que você informa','Nome, celular, dependentes (nome e parentesco), ponto de partida, favoritos e histórico de pedidos.'],['Onde ficam','Somente no armazenamento deste navegador (localStorage). O Pax não envia esses dados para servidor próprio.'],['Serviços externos','Para mapas, endereços, rotas e fotos, o navegador consulta OpenStreetMap/CARTO, Nominatim, OSRM, Mapillary, Wikimedia Commons e Google Maps. Esses serviços recebem o seu endereço IP e as coordenadas pesquisadas. A localização por GPS só é usada se você permitir.'],['WhatsApp','A mensagem só sai quando você toca em enviar no seu WhatsApp.'],['Seus direitos (art. 18 da LGPD)','Acessar, corrigir e apagar seus dados. Você pode editar o perfil ou apagar tudo em Perfil › Apagar meus dados.'],['Dados de saúde','O Pax não pede diagnóstico nem histórico médico. O nome do exame ou especialidade escolhido fica só no seu aparelho.']].map(([t,x])=>`<h2 class="h3">${t}</h2><p class="p">${x}</p>`).join('')}</div>`],
 emergencia:['Emergência','Ligue agora. Não espere agendar.',()=>`${[['192','SAMU','Ambulância e urgência médica','#B3261E'],['193','Bombeiros','Acidentes, resgate e incêndio','#B3261E'],['190','Polícia Militar','Violência e segurança','#0B4F5C'],['188','CVV','Apoio emocional, 24 horas, gratuito','#0B4F5C'],['136','Disque Saúde','Informações do SUS','#0B4F5C']].map(([n,t,s,c])=>`<a class="card" href="tel:${n}" style="flex-direction:row;align-items:center"><span class="lic" style="width:3.6rem;height:3.6rem;background:${c};color:#fff;font-weight:800;font-size:1.25rem">${n}</span><span class="col" style="flex:1"><b style="font-size:1.05rem">${t}</b><span class="sm mut">${s}</span></span>${I.phone(c,24)}</a>`).join('')}<button class="btn" data-act="atalho" data-k="ps" style="flex:none">${I.build('#0B4F5C',20)} Ver pronto-socorro 24h perto</button>`],
 sobre:['Sobre o Pax','Consultas e exames em São Paulo',()=>`<div class="card" style="align-items:center;text-align:center">${LOGO(72)}<h2 class="h2">Pax - Saúde</h2><p class="p mut">Versão ${CFG.versao} · ${CFG.dataRef}</p><p class="p">Pax quer dizer paz. Nosso objetivo é tirar a ansiedade de encontrar onde se cuidar: achar o local certo, saber como chegar e começar o agendamento em poucos toques.</p></div><div class="card"><b>${LOC.length} locais e serviços na cidade de São Paulo</b><div class="meta">${Object.keys(CATS).map(c=>`<span class="tag" style="background:${CATS[c].fundo};color:${CATS[c].cor}">${CATS[c].nome}: ${LOC.filter(p=>p.c===c).length}</span>`).join('')}</div><span class="p">Foco na Avenida Paulista e arredores, sem deixar de fora a Lapa. Cada especialidade e cada tipo de exame tem pelo menos 3 opções.</span></div>`],
 fontes:['Fontes e créditos','De onde vêm os dados, mapas e fotos',()=>{const comFoto=LOC.filter(p=>p.foto).length;return `<div class="card"><h2 class="h3">Dados dos locais</h2><p class="p">Pesquisa de ${CFG.dataRef} em sites oficiais, CNES, Doctoralia e catálogos médicos. Cada local mostra a fonte. WhatsApp só aparece onde é oficial (${LOC.filter(p=>p.wa).length} locais).</p></div>
 <div class="card"><h2 class="h3">Mapas e rotas</h2><p class="p">Mapas: © OpenStreetMap e © CARTO. Endereços: Nominatim (OpenStreetMap). Rotas: OSRM. Links: Google Maps e Uber.</p></div>
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
 <span class="grp">PAX</span>${it('instalar','plus','Instalar Aplicação','Android, iPhone e computador')}${it('clinicas','brief','Para clínicas e médicos','Apareça ou corrija seus dados')}${it('sobre','info','Sobre o Pax','Missão e números')}${it('fontes','book','Fontes e créditos','Dados, mapas e fotos')}
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
 abrirModal(`<div class="row between"><h2 class="h2">${alvo==='origin'?'Endereço de Referência':'Para onde você vai?'}</h2>${xBtn}</div>
 <form class="search" data-form="livre">${I.search('#0B4F5C',20)}<label class="sr" for="pq">Endereço ou local</label><input id="pq" name="q" type="search" autocomplete="off" placeholder="Endereço, estação, bairro ou unidade" data-live="pk"><button type="button" class="micbtn" data-act="voz" data-alvo="pq" aria-label="Falar o endereço">${I.mic('#fff',20)}</button></form>
 ${alvo==='origin'&&navigator.geolocation?`<button class="lrow" data-act="gps"><span class="lic" style="background:#E5EEFC">${I.gps('#2563EB',20)}</span><span class="col" style="flex:1"><b style="font-size:.95rem">Usar onde estou agora</b><span class="sm mut">Recomendado · GPS do aparelho</span></span></button>`:''}
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
 WA={custom:false,txt:'',id,tipo,item:nm&&ops.includes(nm)?nm:ops[0],per:'manha',pag:/conv|plano/i.test(p.cv)&&!/particular/i.test(p.cv)?'convenio':'particular',plano:'',nome:pc?pc.nome:'',rel:'',pac:0,quando:'nesta semana',online:f.modo==='online'};desenharWA()}
function desenharWA(){const p=byId(WA.id);const seg=(k,ops)=>`<div class="seg" role="group">${ops.map(([v,t])=>`<button type="button" data-act="waset" data-k="${k}" data-v="${v}" aria-pressed="${WA[k]===v}">${t}</button>`).join('')}</div>`;const txt=WA.custom?WA.txt:msgWA(p,WA);const pcs=pacientes();
 abrirModal(`<div class="row" style="gap:.75rem"><span class="round wa" style="width:3.2rem;height:3.2rem;border-radius:50%">${ICW}</span><span class="col" style="flex:1;min-width:0"><h2 class="h2">Agendar pelo WhatsApp</h2><span class="sm mut ell">${esc(p.n)}</span></span>${xBtn}</div>
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
 ${WA.files&&WA.files.length?`<button type="button" class="btn wa" data-act="waenviar" style="min-height:3.4rem;font-size:1.02rem;flex:none">${ICW} ${rotuloEnvio()}</button><span class="sm mut">Escolha o WhatsApp e depois a conversa de ${esc(p.n)}. O texto também fica copiado, caso precise colar.</span><a id="wago" hidden href="${waUrl(p,txt)}"></a>`:`<a class="btn wa" id="wago" href="${waUrl(p,txt)}" target="_blank" rel="noopener" data-act="wago" style="min-height:3.4rem;font-size:1.02rem;flex:none">${ICW} Abrir WhatsApp</a>`}
 <span class="sm mut" style="text-align:center">${esc(p.wn)} · +${p.wa.replace(/^55(\d\d)(\d+)(\d{4})$/,'55 ($1) $2-$3')}. A mensagem sai do seu WhatsApp; o Pax não envia nada sozinho.</span>`,'Agendar pelo WhatsApp');setTimeout(mapaWA,80)}
function atualizaWA(){const p=byId(WA.id);const t=WA.custom?WA.txt:msgWA(p,WA);const b=$('wabubble'),a=$('wago');if(b&&!WA.custom)b.value=t;if(a)a.href=waUrl(p,t)}
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
 case'tipo':S.flow={tipo:t.dataset.v,modo:null,item:null};ir('modo');break;
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
 case'testevoz':falar('Olá! Eu sou o Pax. Posso ler as informações dos locais para você.');break;
 case'compart':{const p=byId(id);const txt=`${p.n} — ${isOnline(p)?p.url:limpaEnd(p.e)} (via Pax - Saúde)`;const url=isOnline(p)?p.url:gplace(p);
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
 case'limpar':if(typeof confirm==='function'&&!confirm('Apagar perfil, dependentes, favoritos e agenda deste aparelho?'))break;['favs','hist','origin','nome','geo','user','a11y','fotos3'].forEach(k=>LS.del(k));S.favs=[];S.hist=[];S.user=null;S.origin=ORIGEM_PADRAO;S.a11y={fs:0,hc:false,leg:false,ler:false,simples:false,nomo:false};toast('Dados apagados');render();break;
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
 if(f==='busca'){const al=F.dataset.alvo;if(al==='qi')return;S.q=F.elements.q.value;S.cat='todos';if(S.view!=='buscar')ir('buscar');else renderRes()}
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

/* ============ FOTOS DO SUPABASE ============ */
(function(){if(typeof fetch!=='function')return;const U='https://cckywhtpnjhlwqslmlxz.supabase.co',K='sb_publishable_yv9jTgQHXV1Diy_xPkk_eg_qSt_8roq';
 fetch(U+'/rest/v1/pax_locais?select=id,foto_url,foto_credito&foto_status=eq.ok&pessoa=eq.false',{headers:{apikey:K,Authorization:'Bearer '+K}}).then(r=>r.ok?r.json():[]).then(rs=>{let n=0;(rs||[]).forEach(x=>{const p=byId(x.id);if(p&&x.foto_url&&!p.fotoLocal){p.foto=x.foto_url;p.fotoCred=x.foto_credito;p.fotoRede=0;n++}});if(n)render()}).catch(()=>{})})();

/* =====================================================================
   ETAPA 2 (v4.0): convênio, preparo, anexos, avatares, selo CRM, lembretes
   ===================================================================== */
const CONVS=['Amil','Bradesco Saúde','SulAmérica','Unimed','Porto Seguro Saúde','NotreDame Intermédica','Hapvida','Prevent Senior','Care Plus','Omint','Allianz Saúde','Golden Cross','Mediservice','Seguros Unimed','Cassi','Saúde Caixa'];
function preparoDe(nome){const n=norm(nome);for(const x of LABX)if(norm(x[0])===n)return x[2];for(const k in IMGX)if(norm(IMGX[k][0])===n)return IMGX[k][2];return''}
function preparoBox(){if(WA.tipo!=='exame')return'';const pr=preparoDe(WA.item);return pr?`<div class="info warn">${I.info('#5E3B08',20)}<span><b>Preparo para ${esc(WA.item)}:</b> ${esc(pr)}<br><span class="sm">Confirme com o local, pode variar.</span></span></div>`:''}
function anexosBox(){const f=WA.files||[];const it=(k,t,s)=>{const x=f.find(y=>y.k===k);return `<label class="soc" style="cursor:pointer">${x&&x.url?`<img src="${x.url}" alt="" style="width:2.9rem;height:2.9rem;border-radius:.8rem;object-fit:cover;flex:none">`:`<span class="si" style="background:var(--mint)">${I.doc('#0B4F5C',22)}</span>`}<span class="col" style="flex:1;min-width:0"><b>${t}</b><span class="sm mut ell">${x?esc(x.file.name):s}</span></span><span class="ref-bt" style="background:var(--mint)">${x?'Trocar':'Anexar'}</span><input type="file" accept="image/*,application/pdf" data-live="${k}" class="sr"></label>`};
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
 return `<svg width="${s}" height="${s}" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="50" fill="${fundo}"/><path d="M18 100c2-20 15-30 32-30s30 10 32 30z" fill="#fff"/><path d="M41 70l9 14 9-14z" fill="#CFE7E3"/><path d="M38 72c-2 8-1 14 3 19M62 72c2 8 1 14-3 19" stroke="#0B4F5C" stroke-width="2.4" fill="none" stroke-linecap="round"/><circle cx="41" cy="92" r="3" fill="#0B4F5C"/><rect x="44" y="58" width="12" height="14" rx="5" fill="${pele}"/><ellipse cx="50" cy="44" rx="17" ry="19" fill="${pele}"/>${hair}<circle cx="44" cy="45" r="1.8" fill="#2A2A2A"/><circle cx="56" cy="45" r="1.8" fill="#2A2A2A"/><path d="M45 53c3 2.5 7 2.5 10 0" stroke="#7A3E2B" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M60 80h12v8H60z" fill="#E6F4F1"/><path d="M66 80v8M62 84h8" stroke="#14A39A" stroke-width="1.6"/></svg>`}
const ehPessoa=p=>p.c==='medico'||(p.c==='online'&&/^(Dr|Dra|Prof)/.test(p.n))||p.id===136;
function cover(p,h){if(!ehPessoa(p))return coverBase(p,h);h=h||'8.5rem';return `<span class="cover" data-h="${h}" style="height:${h};background:linear-gradient(135deg,#E2F4F1,#F6FBFB);display:flex;align-items:center;justify-content:center">${avatar(p,'78%')}<span class="bdg">${esc(CATS[p.c].um.toUpperCase())}</span>${p.crmOk?`<span class="src" style="background:#0B4F5C;color:#fff">✓ CRM ativo</span>`:''}</span>`}
function galeria(p){if(!ehPessoa(p))return galeriaBase(p);return `<span class="cover" style="height:15rem;border-radius:0;background:linear-gradient(135deg,#E2F4F1,#F6FBFB);display:flex;align-items:center;justify-content:center">${avatar(p,'12rem')}<span class="src">Ilustração · foto mediante envio do médico</span></span>`}
function seloCRM(p){if(!ehPessoa(p))return'';const num=(p.crm||'').match(/CRM-?SP\s*\d+/i);
 if(p.crmOk)return `<div class="card" style="flex-direction:row;align-items:center;background:linear-gradient(135deg,#0B4F5C,#14A39A);color:#fff;border:0"><span style="width:3.4rem;height:3.4rem;border-radius:1rem;background:rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center;flex:none"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2.4 1.8 3-.2.9 2.9 2.5 1.7-1 2.8 1 2.8-2.5 1.7-.9 2.9-3-.2L12 22l-2.4-1.8-3 .2-.9-2.9-2.5-1.7 1-2.8-1-2.8 2.5-1.7.9-2.9 3 .2z" fill="rgba(255,255,255,.15)"/><path d="M8.5 12l2.3 2.3 4.7-4.6"/></svg></span><span class="col" style="flex:1;min-width:0"><b style="font-size:1.05rem">CRM autorizado no CFM</b><span class="sm" style="opacity:.92">${esc(num?num[0].replace('CRM-SP','CRM-SP '):'')} · ativo · conferido em ${esc(p.crmOk)}</span><a class="sm" style="color:#fff;text-decoration:underline" href="https://portal.cfm.org.br/busca-medicos/" target="_blank" rel="noopener">Conferir no site do CFM</a></span></div>`;
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
function lembreteGoogle(L){const{ini,fim}=icsData(L);return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${enc(L.titulo)}&dates=${ini}/${fim}&ctz=America/Sao_Paulo&details=${enc(L.desc+'\n\nCriado pelo Pax - Saúde')}&location=${enc(L.end)}`}
function baixarICS(L){const{ini,fim}=icsData(L);const e=s=>String(s||'').replace(/[\\,;]/g,m=>'\\'+m).replace(/\n/g,'\\n');
 const ics=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Pax Saude//PT-BR','BEGIN:VEVENT','UID:pax-'+Date.now()+'@pax','DTSTAMP:'+new Date().toISOString().replace(/[-:]/g,'').slice(0,15)+'Z','DTSTART;TZID=America/Sao_Paulo:'+ini,'DTEND;TZID=America/Sao_Paulo:'+fim,'SUMMARY:'+e(L.titulo),'DESCRIPTION:'+e(L.desc),'LOCATION:'+e(L.end),'BEGIN:VALARM','TRIGGER:-P1D','ACTION:DISPLAY','DESCRIPTION:'+e(L.titulo+' amanhã'),'END:VALARM','BEGIN:VALARM','TRIGGER:-PT2H','ACTION:DISPLAY','DESCRIPTION:'+e(L.titulo+' em 2 horas'),'END:VALARM','END:VEVENT','END:VCALENDAR'].join('\r\n');
 try{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([ics],{type:'text/calendar'}));a.download='lembrete-pax.ics';document.body.appendChild(a);a.click();a.remove()}catch(err){toast('Não foi possível gerar o arquivo')}}
S.lemb=LS.get('lemb',[]);
function avisosPendentes(){if(typeof Notification==='undefined'||Notification.permission!=='granted')return;const ag=Date.now();let mud=false;
 S.lemb.forEach(L=>{const t=new Date(L.data+'T'+(L.hora||'08:00')+':00-03:00').getTime();[[864e5,'amanhã'],[72e5,'em 2 horas']].forEach(([ms,q])=>{const k='av'+ms;if(!L[k]&&ag>=t-ms&&ag<t){L[k]=1;mud=true;try{navigator.serviceWorker&&navigator.serviceWorker.ready?navigator.serviceWorker.ready.then(r=>r.showNotification(L.titulo+' '+q,{body:(L.hora?L.hora+' · ':'')+L.end,icon:'icon-192.png'})):new Notification(L.titulo+' '+q)}catch(e){}}})});if(mud)LS.set('lemb',S.lemb)}
setInterval(avisosPendentes,6e4);setTimeout(avisosPendentes,3000);
function vLembrete(){const L=S.lembEd||{};const locs=S.hist.map(x=>byId(x.id)).filter(Boolean);
 return phead('Criar lembrete','Cole a confirmação da clínica e o Pax preenche')+`<section class="sec">
 <div class="info">${I.chat('#0A4B44',20)}<span>No WhatsApp, toque e segure a mensagem de confirmação › <b>Compartilhar › Pax</b>${'<br>'}ou copie e cole aqui embaixo.</span></div>
 <label class="f">Mensagem da clínica<textarea class="inp" id="lmsg" rows="5" data-live="lmsg" style="padding:.7rem;min-height:7rem" placeholder="Ex.: Sua ressonância está confirmada para 14/11 às 9h30. Jejum de 4 horas. Trazer pedido médico.">${esc(L.msg||'')}</textarea></label>
 <div class="card"><label class="f">Local<select class="inp" data-live="lloc"><option value="">Escolha o local</option>${[...new Set(locs.concat(L.id?[byId(L.id)]:[]))].filter(Boolean).map(p=>`<option value="${p.id}" ${L.id===p.id?'selected':''}>${esc(p.n)}</option>`).join('')}</select></label>
 <div class="row"><label class="f" style="flex:1">Data<input class="inp" type="date" data-live="ldata" value="${esc(L.data||'')}"></label><label class="f" style="flex:1">Hora<input class="inp" type="time" data-live="lhora" value="${esc(L.hora||'')}"></label></div>
 <label class="f">Descrição (preparo, dieta, o que levar)<textarea class="inp" rows="3" data-live="ldesc" style="padding:.7rem">${esc(L.desc||'')}</textarea></label>
 <label class="f">Endereço<input class="inp" data-live="lend" value="${esc(L.end||'')}"></label></div>
 ${L.data?'':'<p class="sm mut" style="margin:0">Não achei a data na mensagem? Preencha acima.</p>'}
 <button class="btn pri" data-act="lsalvar" style="flex:none" ${L.data?'':'disabled'}>${I.cal('#fff',20)} Salvar e ativar avisos no Pax</button>
 <div class="acts"><button class="btn" data-act="lgoogle" ${L.data?'':'disabled'}>Google Agenda</button><button class="btn" data-act="lics" ${L.data?'':'disabled'}>Calendário do celular</button></div>
 <span class="sm mut">O Pax avisa 1 dia antes e 2 horas antes. Para avisar mesmo com o app fechado, adicione também ao calendário do celular.</span>
 ${S.lemb.length?`<h2 class="h2">Lembretes salvos</h2>`+S.lemb.map((x,i)=>`<div class="card"><b>${esc(x.titulo)}</b><span class="sm">${esc(x.data.split('-').reverse().join('/'))}${x.hora?' às '+esc(x.hora):''} · ${esc(x.end)}</span>${x.desc?`<span class="sm mut" style="white-space:pre-wrap">${esc(x.desc)}</span>`:''}<button class="lnk sm" data-act="ldel" data-i="${i}" style="align-self:flex-start">Apagar</button></div>`).join(''):''}</section>`}
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
  const ok=()=>{toast('Lembrete salvo. O Pax avisa 1 dia e 2 horas antes.');render()};if(typeof Notification!=='undefined'&&Notification.permission==='default'){Notification.requestPermission().then(ok,ok)}else ok()}
 if(a==='lgoogle'&&L&&L.data){lembDe();window.open(lembreteGoogle(L),'_blank')}
 if(a==='lics'&&L&&L.data){lembDe();baixarICS(L)}
 if(a==='ldel'){S.lemb.splice(+t.dataset.i,1);LS.set('lemb',S.lemb);render()}
 if(a==='lnovo'){const x=S.hist[+t.dataset.i];abrirLembrete(x?{id:x.id}:{})}});
/* agenda: botão de lembrete em cada pedido */
function vAgenda(){let h=vAgendaBase();h=h.replace(/<button class="btn (pri)?" data-act="hok" data-i="(\d+)">/g,(m,_,i)=>`<button class="btn" data-act="lnovo" data-i="${i}">${I.cal('#0B4F5C',18)} Criar lembrete</button>`+m);
 return h.replace('<button class="btn pri" data-act="nav" data-v="novo"',`<button class="btn" data-act="lnovo" data-i="-1" style="flex:none">${I.cal('#0B4F5C',20)} Criar lembrete a partir de uma confirmação</button>\n <button class="btn pri" data-act="nav" data-v="novo"`)}
VIEWS.agenda=vAgenda;
/* compartilhar → Pax (Android): abre o lembrete já preenchido */
(function(){try{const q=new URLSearchParams(location.search);const txt=[q.get('title'),q.get('text'),q.get('url')].filter(Boolean).join('\n');if(txt){history.replaceState(null,'',location.pathname);setTimeout(()=>abrirLembrete({msg:txt}),50)}}catch(e){}})();

/* =====================================================================
   v4.1: locais do CNES (DataSUS) – região central, carregados do Supabase
   ===================================================================== */
const CNES_TIPO={5:'Hospital geral',7:'Hospital especializado',62:'Hospital-dia',20:'Pronto-socorro geral',21:'Pronto-socorro especializado',73:'Pronto atendimento',4:'Policlínica',2:'Unidade Básica de Saúde (UBS)',36:'Clínica especializada',39:'Unidade de diagnóstico',75:'Serviço de telessaúde'};
const BAIRRO_AC={'Consolacao':'Consolação','Republica':'República','Cerqueira Cesar':'Cerqueira César','Higienopolis':'Higienópolis','Se':'Sé','Paraiso':'Paraíso','Aclimacao':'Aclimação','Jardim America':'Jardim América','Pompeia':'Pompeia','Vila Pompeia':'Vila Pompeia','Bras':'Brás','Agua Branca':'Água Branca','Sumare':'Sumaré','Campos Eliseos':'Campos Elíseos','Santa Ifigenia':'Santa Ifigênia','Santa Cecilia':'Santa Cecília'};
const ACENTO={Hosp:'Hospital',Unid:'Unidade',Ambulatorio:'Ambulatório',Cancer:'Câncer',Funcionarios:'Funcionários',Publicos:'Públicos',Publico:'Público',Clinica:'Clínica',Clinicas:'Clínicas',Medica:'Médica',Medico:'Médico',Medicos:'Médicos',Diagnostico:'Diagnóstico',Diagnosticos:'Diagnósticos',Diagnostica:'Diagnóstica',Laboratorio:'Laboratório',Laboratorios:'Laboratórios',Analises:'Análises',Saude:'Saúde',Sao:'São',Visao:'Visão',Coracao:'Coração',Policlinica:'Policlínica',Basica:'Básica',Pediatrica:'Pediátrica',Misericordia:'Misericórdia',Hospitalar:'Hospitalar',Otorrino:'Otorrino',Odontologica:'Odontológica',Assistencia:'Assistência',Ressonancia:'Ressonância',Magnetica:'Magnética',Unica:'Única',Clinico:'Clínico',Clinicos:'Clínicos',Tecnica:'Técnica',Nucleo:'Núcleo',Servico:'Serviço',Servicos:'Serviços',Imunizacao:'Imunização',Pronto:'Pronto',Urgencia:'Urgência',Emergencia:'Emergência',Especializacao:'Especialização',Patologica:'Patológica',Genetica:'Genética',Cirurgica:'Cirúrgica',Cirurgico:'Cirúrgico',Oftalmologica:'Oftalmológica',Ginecologica:'Ginecológica',Clinicas:'Clínicas',Brasilia:'Brasília',Paulistano:'Paulistano',Gastroclinica:'Gastroclínica',Cardiologica:'Cardiológica'};
const acentua=w=>ACENTO[w]||w.replace(/acao$/,'ação').replace(/icao$/,'ição').replace(/ologica$/,'ológica').replace(/ologico$/,'ológico').replace(/ancia$/,'ância').replace(/encia$/,'ência').replace(/acoes$/,'ações');
function nomeCnes(s){return String(s||'').replace(/[A-Za-z]+/g,acentua).replace(/\b(Ltda|Me|Eireli|S\/?A|S S|Epp)\b\.?/gi,'').replace(/\b(Ubs|Ama|Ame|Caps|Sp|Usp|Fmusp|Hc|Ps|Pa|Uti|Cdb|Sus|Dr|Dra)\b/g,w=>({Dr:'Dr.',Dra:'Dra.'})[w]||w.toUpperCase()).replace(/ (De|Da|Do|Das|Dos|E|Em) /g,m=>m.toLowerCase()).replace(/\s{2,}/g,' ').trim()}
function telCnes(t){let d=String(t||'').replace(/\D/g,'').replace(/^0+/,'');if(d.length===8||d.length===9)d='11'+d;if(d.length<10||d.length>11)return null;return `(${d.slice(0,2)}) ${d.slice(2,d.length-4)}-${d.slice(-4)}`}
function turnoCnes(t){t=String(t||'').toUpperCase();if(/CONTINUO|24/.test(t))return['Funcionamento contínuo, 24 horas (cadastro CNES)','24h'];if(/NOITE/.test(t))return['Manhã, tarde e noite (cadastro CNES, confirme o horário)',null];if(/MANHA E A TARDE|MANHA E TARDE/.test(t))return['Manhã e tarde (cadastro CNES, confirme o horário)',null];if(/SOMENTE A TARDE/.test(t))return['Somente à tarde (cadastro CNES)',null];if(/SOMENTE PELA MANHA|SOMENTE A MANHA/.test(t))return['Somente pela manhã (cadastro CNES)',null];return['Horário a confirmar por telefone',null]}
function cnesParaLocal(r){const x=r.dados,cat=r.cat;if(cat==='online'||x.geoFix||x.la==null)return null;
 const c=cat==='lab'?'laboratorio':cat==='img'?'imagem':cat==='online'?'online':[5,7,62,20,21,73].includes(x.tipo)?'hospital':'clinica';
 const b=BAIRRO_AC[x.bairro]||x.bairro||'São Paulo';const cep=String(x.cep||'').replace(/\D/g,'');
 const [hr,h]=turnoCnes(x.turno);const tel=telCnes(x.tel);const esp=x.esp||[],img=x.img||[];
 const s=esp.map(k=>ESP[k]?ESP[k][0]:k).concat(img.map(k=>IMGX[k]?IMGX[k][0]:k));if(cat==='lab')s.push('Exames laboratoriais');if(cat==='online')s.push('Teleconsulta');
 const tipo=CNES_TIPO[x.tipo]||'Estabelecimento de saúde';
 return {id:10000000+(+x.cnes),cnes:x.cnes,fonteCnes:1,n:nomeCnes(x.nome),c,b,
  e:cat==='online'?'Atendimento a distância (sede: '+(x.rua||'')+', '+(x.num||'')+' – '+b+')':`${nomeCnes(x.rua).replace(/^R /,'R. ').replace(/^Av /,'Av. ')}, ${x.num||'s/n'} – ${b}, São Paulo – SP${cep.length===8?', '+cep.slice(0,5)+'-'+cep.slice(5):''}`,
  hr,h,t:tel?[tel]:[],cv:x.sus?'Atende SUS':'Particular ou convênio (confirme por telefone)',sus:x.sus?1:0,
  d:`${tipo} registrado no CNES (Cadastro Nacional de Estabelecimentos de Saúde), nº ${x.cnes}.`+(esp.length>1||img.length?' Especialidades e exames estimados pelo nome do cadastro; confirme por telefone.':''),
  la:c==='online'?null:x.la,lo:c==='online'?null:x.lo,f:'https://cnes.datasus.gov.br/pages/estabelecimentos/ficha/identificacao/355030'+String(x.cnes).padStart(7,'0'),
  esp:cat==='presencial'?esp:[],img,lab:cat==='lab',on:cat==='online'?['clinica']:[],s,soc:{},fotos2:[],ordemCnes:r.ordem}}
let _baseIdx=null;function baseIdx(){if(_baseIdx)return _baseIdx;_baseIdx=new Map();LOC.forEach(p=>{if(p.fonteCnes||p.la==null)return;p._nn=norm(p.n);p._ne=norm(limpaEnd(p.e)).split(',')[0];const k=Math.round(p.la*100)+':'+Math.round(p.lo*100);(_baseIdx.get(k)||_baseIdx.set(k,[]).get(k)).push(p)});return _baseIdx}
function cnesDuplicado0(q){const GEN=/^(hospital|clinica|clinicas|centro|medico|medica|medicina|saude|diagnostico|diagnosticos|laboratorio|unidade|instituto|especialidades|integrada|servicos|paulo|paulista|imagem|analises|assistencia)$/;const nq=norm(q.n).split(/[^a-z0-9]+/).filter(w=>w.length>=5&&!GEN.test(w));return LOC.some(p=>{if(p.fonteCnes||p.la==null||q.la==null)return false;const d=km(p,q);if(d==null||d>0.08)return false;const np=norm(p.n);return nq.some(w=>np.includes(w))||norm(limpaEnd(p.e)).split(',')[0]===norm(q.e).split(',')[0]})}
function cnesDuplicado(q){if(q.la==null)return false;const I=baseIdx(),a=Math.round(q.la*100),b=Math.round(q.lo*100);const GEN=/^(hospital|clinica|clinicas|centro|medico|medica|medicina|saude|diagnostico|diagnosticos|laboratorio|unidade|instituto|especialidades|integrada|servicos|paulo|paulista|imagem|analises|assistencia)$/;let nq=null,qe=null;
 for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++){const L=I.get((a+i)+':'+(b+j));if(!L)continue;for(const p of L){const d=km(p,q);if(d==null||d>0.08)continue;nq=nq||norm(q.n).split(/[^a-z0-9]+/).filter(w=>w.length>=5&&!GEN.test(w));qe=qe||norm(q.e).split(',')[0];if(nq.some(w=>p._nn.includes(w))||p._ne===qe)return true}}return false}
function aplicarCnes(rows){if(!Array.isArray(rows)||!rows.length)return 0;const ids=new Set(LOC.map(p=>p.id));let n=0;rows.forEach(r=>{const q=cnesParaLocal(r);if(!q||ids.has(q.id)||cnesDuplicado(q))return;LOC.push(q);ids.add(q.id);n++});return n}
(function(){LS.del('cnes');let cache=null;try{cache=LS.get('cnes2',null)}catch(e){}const ociosa=window.requestIdleCallback||(f=>setTimeout(f,60));if(cache&&cache.rows)ociosa(()=>{const n=aplicarCnes(cache.rows);if(n&&!['lembrete','perfil','pg','local'].includes(S.view)&&!document.querySelector('#modal .sheet'))render()},{timeout:1200});
 if(typeof fetch!=='function')return;if(cache&&cache.em&&Date.now()-cache.em<3*864e5)return;
 const U='https://cckywhtpnjhlwqslmlxz.supabase.co',K='sb_publishable_yv9jTgQHXV1Diy_xPkk_eg_qSt_8roq';
 (async()=>{try{let rows=[],de=0;for(;;){const r=await fetch(U+'/rest/v1/pax_extra?select=cat,ordem,dados&order=ordem.asc,cnes.asc&offset='+de+'&limit=1000',{headers:{apikey:K,Authorization:'Bearer '+K}});if(!r.ok)break;const pg=await r.json();rows=rows.concat(pg);if(pg.length<1000)break;de+=1000}
 if(!rows.length)return;LS.set('cnes2',{em:Date.now(),rows});const n=aplicarCnes(rows);if(n&&!['lembrete','perfil','pg'].includes(S.view)&&!document.querySelector('#modal .sheet'))render()}catch(e){}})()})();

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
function renderItens(){const box=$('itens');if(!box)return;const t=norm(S.qi);const f=S.flow;const c=f.tipo==='consulta',cor=c?'#B02A62':'#1C5BA8',bg=c?'#FDE8F0':'#E5EEFC';
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
function mapaWA(){const el=$('wamap');if(!el)return;try{if(MAPAWA)MAPAWA.remove()}catch(e){}MAPAWA=null;const p=byId(WA.id);if(!p||p.la==null){el.remove();return}
 if(typeof window.L==='undefined'||!window.L.map){el.dataset.mapwait='1';el.innerHTML='<div class="empty">Carregando mapa…</div>';return}
 const m=window.L.map(el,{zoomControl:false,attributionControl:true,scrollWheelZoom:false,dragging:true});MAPAWA=m;
 window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',{subdomains:'abcd',maxZoom:19,attribution:'© OpenStreetMap · © CARTO'}).addTo(m);
 window.L.circleMarker([p.la,p.lo],{radius:10,color:'#fff',weight:3,fillColor:'#128C4A',fillOpacity:1}).addTo(m).bindTooltip(p.n,{permanent:false});
 const b=[[p.la,p.lo]];if(S.origin.la!=null){window.L.circleMarker([S.origin.la,S.origin.lo],{radius:8,color:'#fff',weight:3,fillColor:'#2563EB',fillOpacity:1}).addTo(m).bindTooltip('Você');b.push([S.origin.la,S.origin.lo])}
 if(b.length>1)m.fitBounds(b,{padding:[24,24],maxZoom:16});else m.setView(b[0],15)}
function mapaWAHtml(){const p=byId(WA.id);if(!p||p.la==null||isOnline(p))return'';const d=dist(p);
 return `<div class="col" style="gap:.35rem"><div id="wamap" class="leaf" style="height:11rem;border-radius:1rem" aria-label="Mapa do local"></div><div class="row between sm"><span class="mut ell" style="min-width:0">${esc(limpaEnd(p.e))}</span><span style="flex:none;font-weight:800">${d!=null?fkm(d)+' de você':''}</span></div><button type="button" class="btn" data-act="rota" data-id="${p.id}" style="flex:none">${I.route('#0B4F5C',20)} Como chegar</button></div>`}

/* ---------- Envio único: mensagem + pedido + guia ---------- */
function rotuloEnvio(){const ks=(WA.files||[]).map(x=>x.k);const a=[];if(ks.includes('waped'))a.push('Pedido Médico');if(ks.includes('waguia'))a.push('Guia');return 'Enviar mensagem com anexo de '+a.join(' e ')}
async function enviarTudo(){const p=byId(WA.id);const txt=WA.custom?WA.txt:msgWA(p,WA);const fs=(WA.files||[]).map(x=>x.file);
 try{if(navigator.clipboard)await navigator.clipboard.writeText(txt)}catch(e){}
 try{if(navigator.canShare&&navigator.canShare({files:fs,text:txt})){await navigator.share({files:fs,text:txt});registrarEnvio();toast('Pronto! Confira a conversa no WhatsApp.');return}}catch(e){if(e&&e.name==='AbortError')return}
 toast('Este aparelho não anexa direto. Abrimos o WhatsApp com a mensagem; toque no clipe 📎 para anexar.');try{window.open(waUrl(p,txt),'_blank')}catch(e){}registrarEnvio()}
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
ubs:()=>ILU_BASE('#E2EEF8','#F7FBFE',`<path d="M90 128V62l80-30 80 30v66z" fill="#fff" stroke="#1C5BA8" stroke-width="3"/><rect x="146" y="58" width="48" height="34" rx="4" fill="#1C5BA8"/><path d="M170 64v22M159 75h22" stroke="#fff" stroke-width="5" stroke-linecap="round"/><rect x="106" y="74" width="26" height="18" rx="2" fill="#CFE3F2"/><rect x="208" y="74" width="26" height="18" rx="2" fill="#CFE3F2"/><rect x="158" y="102" width="24" height="26" rx="3" fill="#1C5BA8" opacity=".85"/><path d="M40 128c0-36 28-36 28 0M282 128c0-30 24-30 24 0" fill="#86C19B"/><path d="M54 128v-16M294 128v-14" stroke="#4E8A63" stroke-width="3"/><path d="M110 112h30M200 112h30" stroke="#1C5BA8" stroke-width="2" opacity=".4"/>`),
online:()=>ILU_BASE('#DFF3F1','#F5FBFB',`<rect x="128" y="20" width="84" height="112" rx="12" fill="#fff" stroke="#0E6B6B" stroke-width="3"/><rect x="136" y="32" width="68" height="76" rx="6" fill="#CFEDEA"/><circle cx="170" cy="60" r="12" fill="#F2C8A5"/><path d="M150 100c0-14 9-22 20-22s20 8 20 22z" fill="#fff" stroke="#0E6B6B" stroke-width="2.5"/><path d="M164 80c0 8 2 11 6 13 4-2 6-5 6-13" stroke="#0E6B6B" stroke-width="2" fill="none"/><circle cx="170" cy="120" r="5" fill="#0E6B6B"/><rect x="230" y="40" width="66" height="26" rx="10" fill="#fff" stroke="#0E6B6B" stroke-width="2.5"/><path d="M242 50h40M242 57h26" stroke="#0E6B6B" stroke-width="2.5" stroke-linecap="round"/><rect x="44" y="76" width="66" height="26" rx="10" fill="#0E6B6B"/><path d="M56 86h40M56 93h24" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>`)};
function iluDe(p){if(isOnline(p))return'online';if(/^UBS|\bUBS\b|UNIDADE BASICA/i.test(p.n)||(p.fonteCnes&&/Unidade Básica/.test(p.d||'')))return'ubs';if(p.c==='hospital')return'hospital';if(p.c==='laboratorio')return'laboratorio';if(p.c==='imagem')return'imagem';return'clinica'}
function coverBase(p,h){h=h||'8.5rem';const f=fotosDe(p)[0];const c=CATS[p.c];
 return `<span class="cover" data-cov="${p.id}" data-h="${h}" style="height:${h}">${f?'<span style="position:absolute;inset:0;background:#DCE8E6"></span>':ILU[iluDe(p)]()}${f?`<img class="ph" src="${esc(f.u)}" alt="Foto: ${esc(p.n)}" loading="lazy" referrerpolicy="no-referrer" decoding="async" onerror="var s=this.parentNode.querySelector('.src');if(s)s.textContent='Ilustração Pax';this.remove()">`:''}<span class="bdg">${esc(c.um.toUpperCase())}</span><span class="src">${f?esc(f.src):'Ilustração Pax'}</span></span>`}
/* =====================================================================
   Selos da comunidade, estações, orçamentos
   ===================================================================== */
const SELO_GRUPOS=[
 ['Atendimento inclusivo','#7A4FB0',[['lgbt','Acolhe pessoas LGBTQIA+'],['gineco_humanizada','Ginecologia humanizada'],['body_positive','Macas e equipamentos para pessoas gordas']]],
 ['Acessibilidade física','#1C5BA8',[['rampa','Rampa ou entrada sem degrau'],['elevador','Elevador largo'],['banheiro','Banheiro adaptado'],['libras','Intérprete de LIBRAS']]],
 ['Estrutura familiar','#C2410C',[['kids','Espaço kids com monitor'],['pet','Aceita pet de suporte ou tem espaço pet']]],
 ['Transparência e conforto','#0E6B6B',[['ar','Ar-condicionado funciona'],['wifi','Wi-Fi bom na recepção'],['sem_taxa','Sem taxa extra além do combinado']]]];
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
 <label class="soc" style="cursor:pointer"><span class="si" style="background:var(--mint)">${I.doc('#0B4F5C',22)}</span><span class="col" style="flex:1;min-width:0"><b>Foto do pedido médico</b><span class="sm mut ell">${ORC.file?esc(ORC.file.name):'Tire uma foto ou escolha da galeria'}</span></span><span class="ref-bt" style="background:var(--mint)">${ORC.file?'Trocar':'Fotografar'}</span><input type="file" accept="image/*" capture="environment" data-live="orcfoto" class="sr"></label>
 ${cs.length?cs.map((p,i)=>`<div class="card" style="gap:.4rem"><b>${i+1}. ${esc(p.n)}</b><span class="sm mut">${esc(limpaEnd(p.e))} · ${fkm(dist(p))}</span><button class="btn ${p.wa?'wa':''}" data-act="orcenviar" data-id="${p.id}" style="flex:none">${p.wa?ICW+' Pedir orçamento pelo WhatsApp':I.phone('#0B4F5C',18)+' Ligar e pedir orçamento'}</button></div>`).join(''):'<div class="empty">Não achamos clínicas de médio porte com contato para este exame perto de você.</div>'}
 <span class="sm mut">O preço final é sempre confirmado pela clínica.</span>`,'Pedir orçamentos')}
let ORC={};
function textoOrc(){return `Olá! Encontrei vocês pelo Pax - Saúde. Gostaria de um orçamento particular para ${itemNome()}${ORC.file?' (pedido médico em anexo)':''}. Qual o valor, o preparo e a próxima data disponível? Obrigado!`}
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
/* ============ INÍCIO ============ */
(function(){try{history.replaceState({pax:'base'},'')}catch(e){}const v=location.hash.slice(1);S.view=['buscar','agenda','perfil','novo'].includes(v)?v:'inicio';S.navAt=S.view;render(true);gpsAuto(true)})();
