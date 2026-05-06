/* ============================================================
   PPT-EXPORT.JS — Generador PPT con plantilla Afi
   Identidad visual Afi:
     Azul profundo: #062D3F
     Azul claro:    #0085CA
     Gris claro:    #C8DAE2
     Fuente:        Amasis MT Pro (con fallback a Georgia)
   ============================================================ */

// ---- COLORES AFI ----
const AFI = {
  darkBlue:  '062D3F',
  blue:      '0085CA',
  lightGray: 'C8DAE2',
  white:     'FFFFFF',
  black:     '1A1A1A',
  green:     '22863A',
  red:       'C0392B',
  gold:      'E67E22',
  font:      'Amasis MT Pro',
  fontFb:    'Georgia',
};

function afiFont() { return AFI.font; }

function posColor(val) {
  if (val == null || isNaN(val)) return AFI.black;
  return val >= 0 ? AFI.green : AFI.red;
}

function fmtV(val, dec) {
  if (val == null || isNaN(val)) return '—';
  dec = dec ?? (Math.abs(val) >= 1000 ? 0 : Math.abs(val) >= 10 ? 2 : 4);
  return val.toLocaleString('es-ES', { minimumFractionDigits:dec, maximumFractionDigits:dec });
}
function fmtP(val) {
  if (val == null || isNaN(val)) return '—';
  return (val >= 0 ? '+' : '') + val.toFixed(2) + '%';
}

// ---- SLIDE BUILDERS ----

function addPortada(pres, fecha) {
  const slide = pres.addSlide();

  // Fondo azul lado izquierdo
  slide.addShape(pres.ShapeType.rect, {
    x:0, y:0, w:6.5, h:5.625,
    fill:{ color: AFI.darkBlue },
    line:{ color: AFI.darkBlue }
  });

  // Franja azul claro decorativa
  slide.addShape(pres.ShapeType.rect, {
    x:0, y:4.8, w:6.5, h:0.1,
    fill:{ color: AFI.blue },
    line:{ color: AFI.blue }
  });

  // Título grande
  slide.addText('Monitor\nde Mercados', {
    x:0.5, y:0.8, w:5.5, h:2.4,
    fontSize:44, bold:true, color:AFI.white,
    fontFace:afiFont(), valign:'top', margin:0
  });

  // Subtítulo
  slide.addText('Resumen ejecutivo de mercados financieros globales', {
    x:0.5, y:3.2, w:5.5, h:0.5,
    fontSize:14, color:AFI.lightGray,
    fontFace:afiFont(), italic:true, margin:0
  });

  // Fecha
  slide.addText(fecha, {
    x:0.5, y:3.9, w:5.5, h:0.35,
    fontSize:12, bold:true, color:AFI.blue,
    fontFace:afiFont(), margin:0
  });

  // Confidencial
  slide.addText('Documento confidencial · Afi', {
    x:0.5, y:5.1, w:5.5, h:0.3,
    fontSize:10, color:'6B8FA0', fontFace:afiFont(), margin:0
  });

  // Panel derecho gris claro
  slide.addShape(pres.ShapeType.rect, {
    x:6.5, y:0, w:3.5, h:5.625,
    fill:{ color: 'E8EFF3' },
    line:{ color: 'E8EFF3' }
  });

  // Logo texto Afi lado derecho
  slide.addText('Afi', {
    x:7.2, y:4.9, w:2, h:0.5,
    fontSize:22, bold:true, color:AFI.darkBlue,
    fontFace:afiFont(), margin:0
  });
}

function addSectionDivider(pres, num, title) {
  const slide = pres.addSlide();

  // Fondo completo azul profundo
  slide.addShape(pres.ShapeType.rect, {
    x:0, y:0, w:10, h:5.625,
    fill:{ color: AFI.darkBlue },
    line:{ color: AFI.darkBlue }
  });

  // Número grande
  slide.addText(num + '.', {
    x:0.6, y:1.8, w:2, h:1.5,
    fontSize:72, bold:true, color:AFI.blue,
    fontFace:afiFont(), margin:0
  });

  // Título sección
  slide.addText(title, {
    x:0.6, y:3.2, w:8.5, h:1.2,
    fontSize:32, bold:false, color:AFI.white,
    fontFace:afiFont(), margin:0
  });

  // Línea azul decorativa
  slide.addShape(pres.ShapeType.rect, {
    x:0.6, y:3.0, w:1.2, h:0.04,
    fill:{ color: AFI.blue }, line:{ color: AFI.blue }
  });

  addFooter(slide, pres);
}

function addFooter(slide, pres) {
  // Línea separadora
  slide.addShape(pres.ShapeType.rect, {
    x:0.4, y:5.35, w:9.2, h:0.03,
    fill:{ color: AFI.lightGray }, line:{ color: AFI.lightGray }
  });
  slide.addText('Afi', {
    x:0.4, y:5.38, w:1, h:0.2,
    fontSize:9, bold:true, color:AFI.blue,
    fontFace:afiFont(), margin:0
  });
  slide.addText('Monitor de Mercados · ' + new Date().toLocaleDateString('es-ES'), {
    x:1.5, y:5.38, w:8, h:0.2,
    fontSize:9, color:'8AA5B5', fontFace:afiFont(), margin:0, align:'right'
  });
}

function addSlideTitle(slide, title) {
  slide.addText(title, {
    x:0.4, y:0.25, w:9.2, h:0.55,
    fontSize:22, bold:true, color:AFI.darkBlue,
    fontFace:afiFont(), margin:0
  });
  slide.addShape(pres_ref.ShapeType.rect, {
    x:0.4, y:0.82, w:9.2, h:0.03,
    fill:{ color: AFI.lightGray }, line:{ color: AFI.lightGray }
  });
}

// ---- SLIDE: BOLSA ----
function addSlideBolsa(pres, data) {
  const slide = pres.addSlide();

  slide.addText('Renta Variable', {
    x:0.4, y:0.2, w:9.2, h:0.55,
    fontSize:22, bold:true, color:AFI.darkBlue, fontFace:afiFont(), margin:0
  });
  slide.addShape(pres.ShapeType.rect, {
    x:0.4, y:0.78, w:9.2, h:0.03,
    fill:{ color: AFI.lightGray }, line:{ color: AFI.lightGray }
  });

  const indices = Object.values(data).filter(x=>!x.isFx&&!x.isVol&&x.price).slice(0,8);
  if (!indices.length) {
    slide.addText('Sin datos de renta variable disponibles', {
      x:0.4, y:2, w:9.2, h:0.5, fontSize:14, color:'8AA5B5', fontFace:afiFont()
    });
    addFooter(slide, pres); return;
  }

  // Header row
  const hY = 0.95, cols = [0.4, 2.8, 4.6, 6.0, 7.4, 8.6];
  const headers = ['Índice', 'Último', '1 Semana', '1 Mes', 'YTD', 'PER Fw'];
  headers.forEach((h, i) => {
    slide.addText(h, {
      x:cols[i], y:hY, w: i===0?2.2:1.2, h:0.28,
      fontSize:9, bold:true, color:'6B8FA0', fontFace:afiFont(),
      align: i===0?'left':'right', margin:0
    });
  });

  // Divider
  slide.addShape(pres.ShapeType.rect, {
    x:0.4, y:1.25, w:9.2, h:0.02,
    fill:{ color: AFI.lightGray }, line:{ color: AFI.lightGray }
  });

  // Rows
  indices.forEach((idx, i) => {
    const y = 1.32 + i * 0.46;
    const bg = i % 2 === 0;
    if (bg) {
      slide.addShape(pres.ShapeType.rect, {
        x:0.4, y, w:9.2, h:0.44,
        fill:{ color: 'F0F5F8' }, line:{ color: 'F0F5F8' }
      });
    }

    const perf1w = periodPerf(idx.dates, idx.closes, '1W');
    const perf1m = periodPerf(idx.dates, idx.closes, '1M');

    slide.addText(idx.name, { x:0.45, y:y+0.08, w:2.2, h:0.28, fontSize:11, bold:true, color:AFI.darkBlue, fontFace:afiFont(), margin:0 });
    slide.addText(fmtV(idx.price), { x:cols[1], y:y+0.08, w:1.2, h:0.28, fontSize:11, color:AFI.black, fontFace:afiFont(), align:'right', margin:0 });
    slide.addText(fmtP(perf1w), { x:cols[2], y:y+0.08, w:1.2, h:0.28, fontSize:11, color:posColor(perf1w), fontFace:afiFont(), align:'right', bold:true, margin:0 });
    slide.addText(fmtP(perf1m), { x:cols[3], y:y+0.08, w:1.2, h:0.28, fontSize:11, color:posColor(perf1m), fontFace:afiFont(), align:'right', bold:true, margin:0 });
    slide.addText(fmtP(idx.ytd), { x:cols[4], y:y+0.08, w:1.0, h:0.28, fontSize:11, color:posColor(idx.ytd), fontFace:afiFont(), align:'right', bold:true, margin:0 });
    slide.addText(idx.per ? idx.per.toFixed(1)+'x' : '—', { x:cols[5], y:y+0.08, w:1.0, h:0.28, fontSize:11, color:AFI.black, fontFace:afiFont(), align:'right', margin:0 });
  });

  addFooter(slide, pres);
}

// ---- SLIDE: RENTA FIJA ----
function addSlideRentaFija(pres, tipos) {
  const slide = pres.addSlide();

  slide.addText('Renta Fija — Tipos de Interés', {
    x:0.4, y:0.2, w:9.2, h:0.55, fontSize:22, bold:true, color:AFI.darkBlue, fontFace:afiFont(), margin:0
  });
  slide.addShape(pres.ShapeType.rect, {
    x:0.4, y:0.78, w:9.2, h:0.03, fill:{color:AFI.lightGray}, line:{color:AFI.lightGray}
  });

  const countries = [
    { code:'US', flag:'EEUU',     ids:['us2y','us5y','us10y','us30y'] },
    { code:'DE', flag:'Alemania', ids:['de2y','de5y','de10y','de30y'] },
    { code:'JP', flag:'Japón',    ids:['jp2y',null,'jp10y','jp30y']   },
    { code:'UK', flag:'R. Unido', ids:['uk2y',null,'uk10y','uk30y']   },
  ];

  const tenors = ['2Y','5Y','10Y','30Y','2-10'];
  const hY = 0.92;
  const cx = [0.4, 2.3, 3.5, 4.7, 5.9, 7.3];

  slide.addText('País', { x:cx[0], y:hY, w:1.7, h:0.25, fontSize:9, bold:true, color:'6B8FA0', fontFace:afiFont(), margin:0 });
  ['2Y','5Y','10Y','30Y','Pend. 2-10'].forEach((h,i) => {
    slide.addText(h, { x:cx[i+1], y:hY, w:1.2, h:0.25, fontSize:9, bold:true, color:'6B8FA0', fontFace:afiFont(), align:'right', margin:0 });
  });

  slide.addShape(pres.ShapeType.rect, {
    x:0.4, y:1.2, w:9.2, h:0.02, fill:{color:AFI.lightGray}, line:{color:AFI.lightGray}
  });

  countries.forEach((c, i) => {
    const y = 1.27 + i * 0.52;
    if (i%2===0) slide.addShape(pres.ShapeType.rect, { x:0.4, y, w:9.2, h:0.5, fill:{color:'F0F5F8'}, line:{color:'F0F5F8'} });

    const vals = c.ids.map(id => id ? tipos[id]?.last : null);
    const slope = vals[0]!=null&&vals[2]!=null ? +(vals[2]-vals[0]).toFixed(2) : null;

    slide.addText(c.flag, { x:cx[0]+0.05, y:y+0.1, w:1.7, h:0.3, fontSize:12, bold:true, color:AFI.darkBlue, fontFace:afiFont(), margin:0 });
    vals.forEach((v,j) => {
      slide.addText(v!=null?v.toFixed(2)+'%':'—', { x:cx[j+1], y:y+0.1, w:1.2, h:0.3, fontSize:12, color:AFI.black, fontFace:afiFont(), align:'right', margin:0 });
    });
    if (slope!=null) {
      slide.addText((slope>0?'+':'')+slope+'%', { x:cx[5], y:y+0.1, w:1.2, h:0.3, fontSize:12, bold:true, color:posColor(slope), fontFace:afiFont(), align:'right', margin:0 });
    }
  });

  // Nota
  slide.addText('Tipos nominales a cierre de sesión. Fuente: Bloomberg.', {
    x:0.4, y:3.9, w:9.2, h:0.25, fontSize:8, color:'8AA5B5', italic:true, fontFace:afiFont(), margin:0
  });

  addFooter(slide, pres);
}

// ---- SLIDE: CRÉDITO ----
function addSlideCredito(pres, spreads) {
  const slide = pres.addSlide();

  slide.addText('Crédito — Spreads de Crédito', {
    x:0.4, y:0.2, w:9.2, h:0.55, fontSize:22, bold:true, color:AFI.darkBlue, fontFace:afiFont(), margin:0
  });
  slide.addShape(pres.ShapeType.rect, {
    x:0.4, y:0.78, w:9.2, h:0.03, fill:{color:AFI.lightGray}, line:{color:AFI.lightGray}
  });

  const spreadList = Object.values(spreads);
  if (!spreadList.length) {
    slide.addText('Sin datos de spreads disponibles', { x:0.4, y:2, w:9.2, h:0.5, fontSize:14, color:'8AA5B5', fontFace:afiFont() });
    addFooter(slide, pres); return;
  }

  // Spread cards — 2 columns
  const cardW = 4.3, cardH = 1.1;
  spreadList.slice(0,6).forEach((s, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 0.4 + col * (cardW + 0.4);
    const y = 0.95 + row * (cardH + 0.15);
    const prev = s.values?.length >= 2 ? s.values[s.values.length-2] : s.last;
    const chg = prev ? +(s.last - prev).toFixed(1) : 0;

    // Card background
    slide.addShape(pres.ShapeType.rect, {
      x, y, w:cardW, h:cardH,
      fill:{color:'F0F5F8'}, line:{color:AFI.lightGray, pt:1}
    });

    // Left accent bar
    slide.addShape(pres.ShapeType.rect, {
      x, y, w:0.06, h:cardH,
      fill:{color:AFI.blue}, line:{color:AFI.blue}
    });

    slide.addText(s.region, { x:x+0.15, y:y+0.1, w:cardW-0.2, h:0.2, fontSize:8, bold:true, color:'6B8FA0', fontFace:afiFont(), charSpacing:1, margin:0 });
    slide.addText(s.name, { x:x+0.15, y:y+0.28, w:cardW-0.2, h:0.25, fontSize:11, color:AFI.darkBlue, fontFace:afiFont(), margin:0 });
    slide.addText(s.last.toFixed(0) + ' pb', { x:x+0.15, y:y+0.52, w:2, h:0.4, fontSize:22, bold:true, color:AFI.darkBlue, fontFace:afiFont(), margin:0 });
    slide.addText((chg>0?'+':'')+chg+' pb', { x:x+2.5, y:y+0.58, w:1.6, h:0.32, fontSize:14, bold:true, color:posColor(-chg), fontFace:afiFont(), align:'right', margin:0 });
  });

  addFooter(slide, pres);
}

// ---- SLIDE: MATERIAS PRIMAS ----
function addSlideMMPP(pres, mmpp) {
  const slide = pres.addSlide();

  slide.addText('Materias Primas', {
    x:0.4, y:0.2, w:9.2, h:0.55, fontSize:22, bold:true, color:AFI.darkBlue, fontFace:afiFont(), margin:0
  });
  slide.addShape(pres.ShapeType.rect, {
    x:0.4, y:0.78, w:9.2, h:0.03, fill:{color:AFI.lightGray}, line:{color:AFI.lightGray}
  });

  const mmList = Object.values(mmpp).filter(m=>m.price);
  if (!mmList.length) {
    slide.addText('Sin datos disponibles', { x:0.4, y:2, w:9.2, h:0.5, fontSize:14, color:'8AA5B5', fontFace:afiFont() });
    addFooter(slide, pres); return;
  }

  const groups = {};
  mmList.forEach(m => { if(!groups[m.group]) groups[m.group]=[]; groups[m.group].push(m); });

  let startY = 0.92;
  Object.entries(groups).forEach(([g, items]) => {
    const gName = { energia:'ENERGÍA', metales:'METALES PRECIOSOS' }[g] || g.toUpperCase();

    slide.addText(gName, {
      x:0.4, y:startY, w:9.2, h:0.22,
      fontSize:9, bold:true, color:AFI.blue, fontFace:afiFont(), charSpacing:2, margin:0
    });
    startY += 0.25;

    const cols = [0.4, 2.5, 4.2, 5.6, 7.0, 8.4];
    if (startY < 1.2) {
      ['Activo', 'Precio', 'Unidad', '1 Sem.', '1 Mes', 'YTD'].forEach((h,i) => {
        slide.addText(h, { x:cols[i], y:startY, w:1.8, h:0.22, fontSize:8, bold:true, color:'6B8FA0', fontFace:afiFont(), align:i>0?'right':'left', margin:0 });
      });
      startY += 0.22;
    }

    items.slice(0, 4).forEach((m, i) => {
      const y = startY;
      if (i%2===0) slide.addShape(pres.ShapeType.rect, { x:0.4, y, w:9.2, h:0.38, fill:{color:'F0F5F8'}, line:{color:'F0F5F8'} });

      const p1w = periodPerf(m.dates, m.closes, '1W');
      const p1m = periodPerf(m.dates, m.closes, '1M');

      slide.addText(m.name, { x:cols[0]+0.05, y:y+0.05, w:2, h:0.28, fontSize:11, bold:true, color:AFI.darkBlue, fontFace:afiFont(), margin:0 });
      slide.addText(fmtV(m.price), { x:cols[1], y:y+0.05, w:1.5, h:0.28, fontSize:11, color:AFI.black, fontFace:afiFont(), align:'right', margin:0 });
      slide.addText(m.unit||'', { x:cols[2], y:y+0.05, w:1.2, h:0.28, fontSize:10, color:'6B8FA0', fontFace:afiFont(), align:'right', margin:0 });
      slide.addText(fmtP(p1w), { x:cols[3], y:y+0.05, w:1.2, h:0.28, fontSize:11, bold:true, color:posColor(p1w), fontFace:afiFont(), align:'right', margin:0 });
      slide.addText(fmtP(p1m), { x:cols[4], y:y+0.05, w:1.2, h:0.28, fontSize:11, bold:true, color:posColor(p1m), fontFace:afiFont(), align:'right', margin:0 });
      slide.addText(fmtP(m.ytd), { x:cols[5], y:y+0.05, w:1.0, h:0.28, fontSize:11, bold:true, color:posColor(m.ytd), fontFace:afiFont(), align:'right', margin:0 });

      startY += 0.38;
    });

    startY += 0.15;
  });

  addFooter(slide, pres);
}

// ---- SLIDE: VOLATILIDAD ----
function addSlideVolatilidad(pres, bolsa, spreads) {
  const slide = pres.addSlide();

  slide.addText('Volatilidad — VIX y VSTOXX', {
    x:0.4, y:0.2, w:9.2, h:0.55, fontSize:22, bold:true, color:AFI.darkBlue, fontFace:afiFont(), margin:0
  });
  slide.addShape(pres.ShapeType.rect, {
    x:0.4, y:0.78, w:9.2, h:0.03, fill:{color:AFI.lightGray}, line:{color:AFI.lightGray}
  });

  const vols = [
    { id:'vix',  name:'VIX',    market:'S&P 500 (EEUU)',    refs:{low:12,normal:20,elevated:30,extreme:40} },
    { id:'v2x',  name:'VSTOXX', market:'Euro Stoxx 50 (EU)', refs:{low:14,normal:22,elevated:32,extreme:45} },
  ];

  vols.forEach((vd, i) => {
    const v = bolsa[vd.id];
    if (!v) return;

    const x = 0.4 + i * 4.7;
    const y = 0.98;

    // Card bg
    slide.addShape(pres.ShapeType.rect, {
      x, y, w:4.3, h:2.2, fill:{color:'F0F5F8'}, line:{color:AFI.lightGray, pt:1}
    });

    const refs = vd.refs;
    const price = v.price;
    const zone = price < refs.low ? {l:'Complacencia',c:AFI.green} :
                 price < refs.normal ? {l:'Normal',c:AFI.blue} :
                 price < refs.elevated ? {l:'Elevada',c:AFI.gold} :
                 {l:'Extrema',c:'C0392B'};

    // Zone badge
    slide.addShape(pres.ShapeType.rect, {
      x:x+2.6, y:y+0.15, w:1.5, h:0.28,
      fill:{color:zone.c+'22'}, line:{color:zone.c, pt:1}
    });
    slide.addText(zone.l, { x:x+2.6, y:y+0.15, w:1.5, h:0.28, fontSize:9, bold:true, color:zone.c, fontFace:afiFont(), align:'center', valign:'middle', margin:0 });

    slide.addText(vd.name, { x:x+0.2, y:y+0.12, w:2.2, h:0.3, fontSize:14, bold:true, color:AFI.darkBlue, fontFace:afiFont(), margin:0 });
    slide.addText(vd.market, { x:x+0.2, y:y+0.42, w:2.5, h:0.22, fontSize:9, color:'6B8FA0', fontFace:afiFont(), margin:0 });
    slide.addText(price.toFixed(2), { x:x+0.2, y:y+0.65, w:2.5, h:0.6, fontSize:36, bold:true, color:zone.c, fontFace:afiFont(), margin:0 });

    // YTD
    slide.addText('YTD: ' + fmtP(v.ytd), { x:x+0.2, y:y+1.3, w:2, h:0.28, fontSize:11, bold:true, color:posColor(v.ytd), fontFace:afiFont(), margin:0 });

    // Reference bar
    const max = refs.extreme * 1.3;
    const bY = y+1.7, bX = x+0.2, bW = 3.9;
    slide.addShape(pres.ShapeType.rect, { x:bX, y:bY, w:bW*(refs.low/max), h:0.1, fill:{color:'22863A44'}, line:{color:'22863A44'} });
    slide.addShape(pres.ShapeType.rect, { x:bX+bW*(refs.low/max), y:bY, w:bW*((refs.normal-refs.low)/max), h:0.1, fill:{color:AFI.blue+'44'}, line:{color:AFI.blue+'44'} });
    slide.addShape(pres.ShapeType.rect, { x:bX+bW*(refs.normal/max), y:bY, w:bW*((refs.elevated-refs.normal)/max), h:0.1, fill:{color:AFI.gold+'44'}, line:{color:AFI.gold+'44'} });
    slide.addShape(pres.ShapeType.rect, { x:bX+bW*(refs.elevated/max), y:bY, w:bW*0.3, h:0.1, fill:{color:'C0392B44'}, line:{color:'C0392B44'} });
    // Needle
    const needleX = bX + Math.min(0.98, price/max) * bW;
    slide.addShape(pres.ShapeType.rect, { x:needleX, y:bY-0.04, w:0.04, h:0.18, fill:{color:zone.c}, line:{color:zone.c} });
  });

  // Spreads resumen abajo
  const cdxIg = spreads['cdx_ig'], cdxHy = spreads['cdx_hy'];
  const itrxIg = spreads['itrx_ig'], itrxXover = spreads['itrx_xover'];

  if (cdxIg || cdxHy || itrxIg || itrxXover) {
    slide.addText('SPREADS DE CRÉDITO CLAVE', {
      x:0.4, y:3.3, w:9.2, h:0.22, fontSize:9, bold:true, color:AFI.blue, fontFace:afiFont(), charSpacing:2, margin:0
    });

    const spItems = [cdxIg, cdxHy, itrxIg, itrxXover].filter(Boolean);
    spItems.forEach((s,i) => {
      const x = 0.4 + i * 2.35;
      slide.addText(s.name.split(' ').slice(0,2).join(' '), { x, y:3.55, w:2.2, h:0.22, fontSize:9, color:'6B8FA0', fontFace:afiFont(), margin:0 });
      slide.addText(s.last.toFixed(0)+' pb', { x, y:3.75, w:2.2, h:0.35, fontSize:16, bold:true, color:AFI.darkBlue, fontFace:afiFont(), margin:0 });
    });
  }

  addFooter(slide, pres);
}

// ---- SLIDE: RESUMEN EJECUTIVO ----
function addSlideResumen(pres, data) {
  const slide = pres.addSlide();

  slide.addText('Resumen Ejecutivo de Mercados', {
    x:0.4, y:0.2, w:9.2, h:0.55, fontSize:22, bold:true, color:AFI.darkBlue, fontFace:afiFont(), margin:0
  });
  slide.addShape(pres.ShapeType.rect, {
    x:0.4, y:0.78, w:9.2, h:0.03, fill:{color:AFI.lightGray}, line:{color:AFI.lightGray}
  });

  // 6 big stat boxes
  const stats = [];

  // SPX
  const spx = data.bolsa?.spx;
  if (spx) stats.push({ label:'S&P 500', val:fmtV(spx.price), sub:'YTD: '+fmtP(spx.ytd), subColor:posColor(spx.ytd) });

  // SX5E
  const sx5e = data.bolsa?.sx5e;
  if (sx5e) stats.push({ label:'Euro Stoxx 50', val:fmtV(sx5e.price), sub:'YTD: '+fmtP(sx5e.ytd), subColor:posColor(sx5e.ytd) });

  // US 10Y
  const us10y = data.tipos?.us10y;
  if (us10y) stats.push({ label:'US 10Y', val:us10y.last.toFixed(2)+'%', sub:'Bono EEUU', subColor:AFI.black });

  // Brent
  const brent = data.mmpp?.brent;
  if (brent) stats.push({ label:'Brent', val:fmtV(brent.price)+' $', sub:'YTD: '+fmtP(brent.ytd), subColor:posColor(brent.ytd) });

  // Oro
  const gold = data.mmpp?.gold;
  if (gold) stats.push({ label:'Oro', val:fmtV(gold.price)+' $', sub:'YTD: '+fmtP(gold.ytd), subColor:posColor(gold.ytd) });

  // VIX
  const vix = data.bolsa?.vix;
  if (vix) stats.push({ label:'VIX', val:vix.price.toFixed(2), sub:vix.price<20?'Normal':vix.price<30?'Elevado':'Extremo', subColor:vix.price<20?AFI.green:vix.price<30?AFI.gold:'C0392B' });

  stats.slice(0,6).forEach((s, i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const x = 0.4 + col * 3.1;
    const y = 0.95 + row * 1.85;

    slide.addShape(pres.ShapeType.rect, {
      x, y, w:2.9, h:1.65, fill:{color:'F0F5F8'}, line:{color:AFI.lightGray, pt:1}
    });
    slide.addShape(pres.ShapeType.rect, {
      x, y, w:2.9, h:0.06, fill:{color:AFI.blue}, line:{color:AFI.blue}
    });

    slide.addText(s.label, { x:x+0.15, y:y+0.15, w:2.6, h:0.25, fontSize:10, bold:true, color:'6B8FA0', fontFace:afiFont(), margin:0 });
    slide.addText(s.val, { x:x+0.15, y:y+0.4, w:2.6, h:0.65, fontSize:26, bold:true, color:AFI.darkBlue, fontFace:afiFont(), margin:0 });
    slide.addText(s.sub, { x:x+0.15, y:y+1.1, w:2.6, h:0.35, fontSize:12, bold:true, color:s.subColor, fontFace:afiFont(), margin:0 });
  });

  addFooter(slide, pres);
}

// ---- MAIN GENERATOR ----
let pres_ref = null;

async function exportToPPT() {
  if (!window.D || !window.D.loaded) {
    alert('Carga primero el Excel con los datos de mercado.');
    return;
  }

  // Show progress
  const btn = document.getElementById('ppt-export-btn');
  if (btn) { btn.textContent = '⏳ Generando...'; btn.disabled = true; }

  try {
    // Load PptxGenJS dynamically
    if (typeof PptxGenJS === 'undefined') {
      await new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js';
        s.onload = res; s.onerror = rej;
        document.head.appendChild(s);
      });
    }

    const pres = new PptxGenJS();
    pres_ref = pres;
    pres.layout = 'LAYOUT_16x9';
    pres.author = 'Afi';
    pres.company = 'Afi';
    pres.title = 'Monitor de Mercados';

    const fecha = new Date().toLocaleDateString('es-ES', { day:'2-digit', month:'long', year:'numeric' });

    // Build slides
    addPortada(pres, fecha);
    addSlideResumen(pres, window.D);
    addSectionDivider(pres, '01', 'Renta Variable');
    addSlideBolsa(pres, window.D.bolsa);
    addSectionDivider(pres, '02', 'Renta Fija');
    addSlideRentaFija(pres, window.D.tipos);
    addSectionDivider(pres, '03', 'Crédito y Spreads');
    addSlideCredito(pres, window.D.spreads);
    addSectionDivider(pres, '04', 'Materias Primas');
    addSlideMMPP(pres, window.D.mmpp);
    addSectionDivider(pres, '05', 'Volatilidad');
    addSlideVolatilidad(pres, window.D.bolsa, window.D.spreads);

    // Download
    const dateStr = new Date().toISOString().slice(0,10);
    await pres.writeFile({ fileName: `Monitor_Mercados_${dateStr}.pptx` });

  } catch(err) {
    console.error('PPT export error:', err);
    alert('Error al generar la PPT: ' + err.message);
  } finally {
    if (btn) { btn.textContent = '📑 Exportar PPT'; btn.disabled = false; }
  }
}

// ---- INJECT BUTTON ----
document.addEventListener('DOMContentLoaded', () => {
  // Wait a moment for the header to render
  setTimeout(() => {
    const headerStatus = document.querySelector('.header-status');
    if (!headerStatus) return;

    const btn = document.createElement('button');
    btn.id = 'ppt-export-btn';
    btn.className = 'upload-btn';
    btn.innerHTML = '📑 Exportar PPT';
    btn.style.cssText = 'background:rgba(0,133,202,0.12);border-color:rgba(0,133,202,0.4);color:#60a5fa;';
    btn.onclick = exportToPPT;

    headerStatus.insertBefore(btn, headerStatus.querySelector('.upload-btn'));
  }, 200);
});
