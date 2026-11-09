/* ============ DADOS (pesquisa nov/2026) ============ */
const UTEIS=[1,2,3,4,5], SAB=[6], DOM=[0], SEGSAB=[1,2,3,4,5,6], TODOS=[0,1,2,3,4,5,6];
const H=(d,a,f)=>({d,a,f});
const ESP={
 clinica:['Clínica geral','Check-up, sintomas gerais e encaminhamentos'],
 cardio:['Cardiologia','Coração, pressão e circulação'],
 dermato:['Dermatologia','Pele, cabelo e unhas'],
 endo:['Endocrinologia','Hormônios, tireoide e diabetes'],
 gastro:['Gastroenterologia','Estômago e intestino'],
 gineco:['Ginecologia','Saúde da mulher e pré-natal'],
 neuro:['Neurologia','Cérebro, nervos, enxaqueca'],
 oftalmo:['Oftalmologia','Olhos e visão'],
 orto:['Ortopedia','Ossos, músculos e articulações'],
 otorrino:['Otorrinolaringologia','Ouvido, nariz e garganta'],
 pedi:['Pediatria','Crianças e adolescentes'],
 psiq:['Psiquiatria','Saúde mental'],
 uro:['Urologia','Rins, bexiga e próstata']
};
const TODAS=Object.keys(ESP);
const LABX=[
 ['Hemograma completo','Avalia células do sangue: anemia, infecções e plaquetas.','Sem jejum'],
 ['Glicemia em jejum','Mede o açúcar no sangue.','Jejum de 8h'],
 ['Colesterol total e frações','HDL, LDL e colesterol total.','Jejum de 12h (confirme)'],
 ['Triglicerídeos','Gordura no sangue, costuma vir com o colesterol.','Jejum de 12h'],
 ['TSH e T4 livre','Avaliam o funcionamento da tireoide.','Sem jejum'],
 ['Vitamina D','Nível de vitamina D no organismo.','Sem jejum'],
 ['Hemoglobina glicada','Média do açúcar dos últimos 3 meses.','Sem jejum'],
 ['Urina tipo 1','Avalia rins e infecção urinária.','Primeira urina do dia'],
 ['Creatinina e ureia','Avaliam o funcionamento dos rins.','Sem jejum'],
 ['Beta-hCG','Exame de sangue de gravidez.','Sem jejum']
];
const IMGX={
 rx:['Raio-X','Ossos, tórax e pulmões. Rápido.','Em geral sem preparo'],
 us:['Ultrassom','Órgãos e tecidos com ondas sonoras, sem radiação.','Depende da região (jejum ou bexiga cheia)'],
 tc:['Tomografia','Imagens em cortes do corpo; alguns tipos usam contraste.','Pode exigir jejum e contraste'],
 rm:['Ressonância magnética','Imagens detalhadas de tecidos, articulações e cérebro.','Sem metais no corpo; avise sobre implantes'],
 mamo:['Mamografia','Exame das mamas para prevenção.','Sem desodorante ou talco no dia'],
 dens:['Densitometria óssea','Mede a densidade dos ossos.','Evite cálcio 24h antes'],
 eco:['Ecocardiograma','Ultrassom do coração.','Em geral sem preparo']
};
const CATS={
 hospital:{nome:'Hospitais e PS',um:'Hospital',cor:'#8A1C22',fundo:'#F6E6E6'},
 clinica:{nome:'Clínicas',um:'Clínica',cor:'#143D33',fundo:'#E3F1EA'},
 medico:{nome:'Médicos',um:'Médico',cor:'#5B3C88',fundo:'#EEE8F6'},
 laboratorio:{nome:'Laboratórios',um:'Laboratório',cor:'#1F4E7A',fundo:'#E6EEF6'},
 imagem:{nome:'Imagem',um:'Diagnóstico por imagem',cor:'#7A4A0E',fundo:'#FBEEDC'},
 online:{nome:'Online',um:'Teleconsulta',cor:'#0E6B6B',fundo:'#DDF2F2'}
};
/* ============ LOCAIS (nov/2026): somente Dimagem Unineuro e MITI ============ */
const LOC=[
{id:9001,n:'Dimagem Unineuro',c:'imagem',b:'Lapa',e:'R. Brig. Gavião Peixoto, 177 – Lapa, São Paulo – SP, 05078-000',hr:'Seg a sex 7h–19h; sáb 8h–13h',h:[H(UTEIS,'07:00','19:00'),H(SAB,'08:00','13:00')],t:['(11) 3834-9460'],wa:'551138349460',wn:'Telefone/WhatsApp oficial do site',cv:'Mais de 40 convênios',d:'Clínica de diagnóstico por imagem fundada em 1977, vizinha do Hospital Albert Sabin. Ressonância magnética e tomografia.',la:-23.525588,lo:-46.711835,f:'https://www.dimagem-unineuro.com.br/',site:'https://www.dimagem-unineuro.com.br',img:['rm','tc'],foto:'fotos/9001-1.jpg',fotos2:['fotos/33.jpg'],fotoLocal:1,fotoRede:0,fotoCred:'Foto: Dimagem Unineuro'},
{id:9002,semFotoWeb:1,n:'MITI Consultórios',c:'clinica',b:'Jardins',e:'Av. Paulista, 2073 – Horsa II, Cj 101 (1º andar), Conjunto Nacional – Jardins, São Paulo – SP, 01311-940',hr:'Das 8h às 21h (confirme os dias)',h:[H(UTEIS,'08:00','21:00')],t:['(11) 94296-6767'],wa:'5511942966767',wn:'WhatsApp do MITI Consultórios (conferido no perfil do Google)',cv:'Consultório particular',d:'Consultório particular e coworking para profissionais da saúde, no conjunto 101 (1º andar) do Horsa II, dentro do Conjunto Nacional, na Avenida Paulista.',la:-23.5614,lo:-46.6558,f:'https://www.google.com/maps/search/?api=1&query=Miti+Consult%C3%B3rios+Conjunto+Nacional+Av.+Paulista+2073',soc:{ig:'https://www.instagram.com/miti.consultorios/'},g:{v:3.3,n:12,f:'https://www.google.com/maps/search/?api=1&query=Miti+Consult%C3%B3rios+Conjunto+Nacional+Av.+Paulista+2073'},foto:'fotos/9002-1.jpg',fotos2:['fotos/9002-2.jpg','fotos/9002-3.jpg','fotos/9002-4.jpg','fotos/9002-5.jpg','fotos/9002-6.jpg','fotos/9002-7.jpg','fotos/9002-8.jpg'],fotoLocal:1,fotoRede:0,fotoCred:'Fotos: MITI Consultórios (Google Maps)'}
];
LOC.forEach(p=>{p.esp=p.esp||[];p.img=p.img||[];p.on=p.on||[];p.lab=!!p.lab;p.t=p.t||[];p.s=[].concat(p.esp.map(k=>ESP[k][0]),p.img.map(k=>IMGX[k][0]),p.lab?['Exames laboratoriais']:[],p.on.length?['Teleconsulta']:[]);if(!p.s.length)p.s=[p.sp||'Atendimento'];});
const EST=[
 {id:'e1',n:'Estação Lapa',l:'Trem · Linhas 7-Rubi e 8-Diamante',la:-23.5203,lo:-46.7040},
 {id:'e2',n:'Estação Água Branca',l:'Trem · Linha 7-Rubi',la:-23.5184,lo:-46.6852},
 {id:'e3',n:'Estação Palmeiras-Barra Funda',l:'Metrô Linha 3-Vermelha · Trem Linhas 7 e 8',la:-23.5254,lo:-46.6670},
 {id:'e4',n:'Estação Domingos de Moraes',l:'Trem · Linha 8-Diamante',la:-23.5275,lo:-46.7130},
 {id:'e5',n:'Estação Imperatriz Leopoldina',l:'Trem · Linha 8-Diamante',la:-23.5302,lo:-46.7262},
 {id:'e6',n:'Estação Pirituba',l:'Trem · Linha 7-Rubi',la:-23.4886,lo:-46.7272},
 {id:'e7',n:'Estação Vila Madalena',l:'Metrô · Linha 2-Verde',la:-23.5466,lo:-46.6911},
 {id:'e8',n:'Estação Sumaré',l:'Metrô · Linha 2-Verde',la:-23.5505,lo:-46.6779},
 {id:'e9',n:'Estação Pinheiros',l:'Metrô Linha 4-Amarela · Trem Linha 9-Esmeralda',la:-23.5672,lo:-46.7016},
 {id:'e10',n:'Estação Butantã',l:'Metrô · Linha 4-Amarela',la:-23.5718,lo:-46.7083},
 {id:'e11',n:'Estação Paulista / Consolação',l:'Metrô · Linhas 4-Amarela e 2-Verde',la:-23.5555,lo:-46.6620},
 {id:'e12',n:'Estação Sé',l:'Metrô · Linhas 1-Azul e 3-Vermelha',la:-23.5503,lo:-46.6339},
 {id:'e13',n:'Estação Luz',l:'Metrô Linhas 1 e 4 · Trem',la:-23.5348,lo:-46.6350},
 {id:'e14',n:'Estação Santana',l:'Metrô · Linha 1-Azul',la:-23.5025,lo:-46.6250},
 {id:'e15',n:'Estação Tatuapé',l:'Metrô Linha 3-Vermelha · Trem',la:-23.5403,lo:-46.5765},
 {id:'e16',n:'Estação Santa Cruz',l:'Metrô · Linhas 1-Azul e 5-Lilás',la:-23.5990,lo:-46.6370},
 {id:'e17',n:'Estação Paraíso',l:'Metrô · Linhas 1-Azul e 2-Verde',la:-23.5760,lo:-46.6410},
 {id:'e18',n:'Estação Jabaquara',l:'Metrô · Linha 1-Azul',la:-23.6460,lo:-46.6410},
 {id:'e19',n:'Estação Morumbi (Linha 4)',l:'Metrô · Linha 4-Amarela',la:-23.5870,lo:-46.7230},
 {id:'e20',n:'Estação Osasco',l:'Trem · Linhas 8 e 9',la:-23.5280,lo:-46.7760}
];
const REFS=[
 {id:'r1',n:'Largo da Lapa',l:'Lapa',la:-23.5225,lo:-46.7035},
 {id:'r2',n:'Mercado da Lapa',l:'Lapa',la:-23.5212,lo:-46.7010},
 {id:'r3',n:'Alto da Lapa',l:'Bairro',la:-23.5350,lo:-46.7100},
 {id:'r4',n:'Vila Romana',l:'Bairro',la:-23.5280,lo:-46.6950},
 {id:'r5',n:'Vila Leopoldina',l:'Bairro',la:-23.5300,lo:-46.7300},
 {id:'r6',n:'Pompeia',l:'Bairro',la:-23.5330,lo:-46.6860},
 {id:'r7',n:'Perdizes',l:'Bairro',la:-23.5380,lo:-46.6750},
 {id:'r8',n:'Água Branca',l:'Bairro',la:-23.5230,lo:-46.6800},
 {id:'r9',n:'Barra Funda',l:'Bairro',la:-23.5230,lo:-46.6650},
 {id:'r10',n:'Pinheiros',l:'Bairro',la:-23.5640,lo:-46.6920},
 {id:'r11',n:'Butantã',l:'Bairro',la:-23.5720,lo:-46.7080},
 {id:'r12',n:'Pirituba',l:'Bairro',la:-23.4880,lo:-46.7250},
 {id:'r13',n:'Freguesia do Ó',l:'Bairro',la:-23.4990,lo:-46.6950},
 {id:'r14',n:'Avenida Paulista (MASP)',l:'Bela Vista',la:-23.5614,lo:-46.6559},
 {id:'r15',n:'Centro (Praça da Sé)',l:'Sé',la:-23.5503,lo:-46.6339},
 {id:'r16',n:'Santana',l:'Zona Norte',la:-23.5020,lo:-46.6250},
 {id:'r17',n:'Tatuapé',l:'Zona Leste',la:-23.5400,lo:-46.5770},
 {id:'r18',n:'Vila Mariana',l:'Zona Sul',la:-23.5890,lo:-46.6350},
 {id:'r19',n:'Morumbi',l:'Zona Sul',la:-23.5950,lo:-46.7200},
 {id:'r20',n:'Osasco (centro)',l:'Região metropolitana',la:-23.5320,lo:-46.7790},
 {id:'r21',n:'Guarulhos (centro)',l:'Região metropolitana',la:-23.4630,lo:-46.5330},
 {id:'r22',n:'Santo André (centro)',l:'ABC',la:-23.6560,lo:-46.5320},
 {id:'r23',n:'Allianz Parque',l:'Água Branca',la:-23.5275,lo:-46.6785},
 {id:'r24',n:'Cidade Universitária (USP)',l:'Butantã',la:-23.5600,lo:-46.7310}
];
