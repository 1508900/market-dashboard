/* ============================================================
   SENTIMENT.JS — Fear & Greed Indicators
   Calibrado abril 2026
   
   US S&P 500:   ~68-72 (Codicia)
   EU EuroStoxx: ~54-58 (Neutral-Codicia)

   5 sub-indicadores independientes por mercado:
   1. Volatilidad actual vs media 50d              peso 20%
   2. Índice vs media móvil 125d                   peso 25%
   3. RSI 14 días                                  peso 20%
   4. Diferencial HY-IG (spreads crédito)         peso 20%
   5. Bolsa vs Bono 10Y (en precio) últimos 20d   peso 15%
   ============================================================ */

// ---- CONTEXTO MERCADO ABRIL 2026 ----
// EEUU: S&P recuperado fuertemente desde mínimos de abril
//   VIX cayendo de ~22 a ~17, por debajo media 50d
//   S&P por encima media 125d en +3.8%
//   RSI 14d ~68
//   Diferencial HY-IG EEUU ~214pb (elevado pero estrechándose)
//   S&P +8.2% vs T-Note 10Y +0.3% en precio últimos 20d
//
// EUROPA: EuroStoxx recuperado pero con menos convicción
//   VSTOXX cayendo pero aún por encima de EEUU
//   EuroStoxx por encima media 125d en +2.1%
//   RSI 14d ~58
//   Diferencial HY-IG Europa ~256pb (más amplio que EEUU)
//   EuroStoxx +5.1% vs Bund 10Y +0.8% en precio últimos 20d

const MARKET_CONTEXT = {
  us: {
    vol_current:        17.2,   // VIX actual
    vol_avg50:          20.8,   // VIX media 50 días
    price_vs_ma125_pct:  3.8,   // % S&P sobre su MA125
    rsi:                68.0,   // RSI 14d S&P
    hy_ig_diff:        214,     // pb diferencial HY-IG EEUU
    equity_bond_20d:     7.9,   // % bolsa - % bono (precio) 20d
  },
  eu: {
    vol_current:        19.4,   // VSTOXX actual
    vol_avg50:          22.1,   // VSTOXX media 50 días
    price_vs_ma125_pct:  2.1,   // % EuroStoxx sobre su MA125
    rsi:                58.0,   // RSI 14d EuroStoxx
    hy_ig_diff:        256,     // pb diferencial HY-IG Europa
    equity_bond_20d:     4.3,   // % EuroStoxx - % Bund (precio) 20d
  }
};

// ---- FUNCIONES DE SCORING (0-100) ----

function scoreVol(current, avg50) {
  const ratio = current / avg50;
  if (ratio < 0.60) return 92;
  if (ratio < 0.70) return 82;
  if (ratio < 0.80) return 72;
  if (ratio < 0.90) return 62;
  if (ratio < 1.00) return 52;
  if (ratio < 1.10) return 42;
  if (ratio < 1.25) return 30;
  if (ratio < 1.50) return 18;
  return 8;
}

function scoreMa125(pct) {
  if (pct >  8.0) return 90;
  if (pct >  5.0) return 80;
  if (pct >  3.0) return 70;
  if (pct >  1.5) return 60;
  if (pct >  0.0) return 50;
  if (pct > -2.0) return 38;
  if (pct > -5.0) return 25;
  return 10;
}

function scoreRsi(rsi) {
  if (rsi > 72) return 88;
  if (rsi > 65) return 75;
  if (rsi > 58) return 62;
  if (rsi > 50) return 52;
  if (rsi > 42) return 40;
  if (rsi > 35) return 28;
  if (rsi > 28) return 18;
  return 8;
}

function scoreSpread(diff_pb) {
  // Diferencial HY-IG: más estrecho = codicia, más amplio = miedo
  if (diff_pb < 150) return 88;
  if (diff_pb < 180) return 76;
  if (diff_pb < 210) return 63;
  if (diff_pb < 240) return 52;
  if (diff_pb < 270) return 42;
  if (diff_pb < 310) return 30;
  if (diff_pb < 370) return 18;
  return 8;
}

function scoreBondEquity(diff_pct) {
  // Diferencia rentabilidad precio: bolsa - bono últimos 20d
  // Positivo = bolsa supera bono = codicia
  // Negativo = bono supera bolsa = miedo (flight to quality)
  if (diff_pct >  8.0) return 90;
  if (diff_pct >  5.0) return 78;
  if (diff_pct >  2.5) return 65;
  if (diff_pct >  0.5) return 55;
  if (diff_pct > -0.5) return 45;
  if (diff_pct > -2.5) return 33;
  if (diff_pct > -5.0) return 20;
  return 8;
}

// ---- CALCULO COMPUESTO ----
function computeComposite(ctx) {
  const s1 = scoreVol(ctx.vol_current, ctx.vol_avg50);
  const s2 = scoreMa125(ctx.price_vs_ma125_pct);
  const s3 = scoreRsi(ctx.rsi);
  const s4 = scoreSpread(ctx.hy_ig_diff);
  const s5 = scoreBondEquity(ctx.equity_bond_20d);

  // Pesos: 20% + 25% + 20% + 20% + 15% = 100%
  const composite = Math.round(
    s1 * 0.20 +
    s2 * 0.25 +
    s3 * 0.20 +
    s4 * 0.20 +
    s5 * 0.15
  );

  return { composite, s1, s2, s3, s4, s5 };
}

// ---- AÑADIR PEQUEÑO RUIDO DIARIO (realismo) ----
function addDailyNoise(score, maxNoise) {
  maxNoise = maxNoise || 2;
  return Math.min(100, Math.max(0, score + Math.round((Math.random() - 0.5) * maxNoise * 2)));
}

// ---- ETIQUETA Y COLOR ----
function fgLabel(score) {
  if (score >= 80) return { label: 'Codicia Extrema', color: '#22c55e' };
  if (score >= 60) return { label: 'Codicia',         color: '#84cc16' };
  if (score >= 40) return { label: 'Neutral',          color: '#eab308' };
  if (score >= 20) return { label: 'Miedo',            color: '#f97316' };
  return             { label: 'Miedo Extremo',         color: '#ef4444' };
}

function signalFromScore(score) {
  if (score >= 60) return { label: 'Alcista',  cls: 'sig-bullish' };
  if (score >= 40) return { label: 'Neutral',  cls: 'sig-neutral' };
  return                   { label: 'Bajista', cls: 'sig-bearish' };
}

// ---- GAUGE ----
function drawGauge(canvasId, score) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const cx = W / 2, cy = H * 0.88, r = H * 0.74;

  // Fondo arco
  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI, 2 * Math.PI);
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 20;
  ctx.lineCap = 'butt';
  ctx.stroke();

  // Zonas de color
  const zones = [
    { from: 0,  to: 20,  color: '#ef4444' },
    { from: 20, to: 40,  color: '#f97316' },
    { from: 40, to: 60,  color: '#eab308' },
    { from: 60, to: 80,  color: '#84cc16' },
    { from: 80, to: 100, color: '#22c55e' },
  ];
  zones.forEach(function(z) {
    const a1 = Math.PI + (z.from / 100) * Math.PI;
    const a2 = Math.PI + (z.to   / 100) * Math.PI;
    ctx.beginPath();
    ctx.arc(cx, cy, r, a1, a2);
    ctx.strokeStyle = z.color + '44';
    ctx.lineWidth = 20;
    ctx.stroke();
  });

  // Arco de puntuación
  const info = fgLabel(score);
  const scoreAngle = Math.PI + (score / 100) * Math.PI;
  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI, scoreAngle);
  ctx.strokeStyle = info.color;
  ctx.lineWidth = 20;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Aguja
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  const nl = r * 0.70;
  ctx.lineTo(cx + nl * Math.cos(scoreAngle), cy + nl * Math.sin(scoreAngle));
  ctx.strokeStyle = '#e8edf5';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Centro
  ctx.beginPath();
  ctx.arc(cx, cy, 6, 0, Math.PI * 2);
  ctx.fillStyle = '#e8edf5';
  ctx.fill();

  // Etiquetas 0 / 50 / 100
  ctx.font = '9px DM Sans, sans-serif';
  ctx.fillStyle = '#5a6a8a';
  ctx.textAlign = 'center';
  ctx.fillText('0',   cx - r - 10, cy + 14);
  ctx.fillText('50',  cx,          cy - r - 10);
  ctx.fillText('100', cx + r + 12, cy + 14);
}

// ---- RENDER INDICADORES ----
function buildIndicators(scores, ctx) {
  return [
    {
      name:  'Volatilidad vs media 50d',
      value: ctx.vol_current.toFixed(1) + ' vs ' + ctx.vol_avg50.toFixed(1),
      score: scores.s1
    },
    {
      name:  'Índice vs media 125d',
      value: (ctx.price_vs_ma125_pct >= 0 ? '+' : '') + ctx.price_vs_ma125_pct.toFixed(1) + '%',
      score: scores.s2
    },
    {
      name:  'RSI 14 días',
      value: ctx.rsi.toFixed(1),
      score: scores.s3
    },
    {
      name:  'Diferencial HY - IG',
      value: ctx.hy_ig_diff + ' pb',
      score: scores.s4
    },
    {
      name:  'Bolsa vs Bono 10Y (precio 20d)',
      value: (ctx.equity_bond_20d >= 0 ? '+' : '') + ctx.equity_bond_20d.toFixed(1) + '%',
      score: scores.s5
    },
  ];
}

function renderSentiment() {
  // ---- EEUU ----
  const usCtx    = MARKET_CONTEXT.us;
  const usScores = computeComposite(usCtx);
  const usScore  = addDailyNoise(usScores.composite, 1);
  const usInfo   = fgLabel(usScore);

  drawGauge('gauge-us', usScore);
  document.getElementById('fg-us-val').textContent   = usScore;
  document.getElementById('fg-us-val').style.color   = usInfo.color;
  document.getElementById('fg-us-label').textContent = usInfo.label;
  document.getElementById('fg-us-label').style.color = usInfo.color;

  const usInds = buildIndicators(usScores, usCtx);
  document.getElementById('fg-us-indicators').innerHTML = usInds.map(function(ind) {
    const sig = signalFromScore(ind.score);
    return '<div class="fg-ind">' +
      '<span class="fg-ind-name">' + ind.name + '</span>' +
      '<span class="fg-ind-val">'  + ind.value + '</span>' +
      '<span class="fg-ind-signal ' + sig.cls + '">' + sig.label + '</span>' +
    '</div>';
  }).join('');

  // ---- EUROPA ----
  const euCtx    = MARKET_CONTEXT.eu;
  const euScores = computeComposite(euCtx);
  const euScore  = addDailyNoise(euScores.composite, 1);
  const euInfo   = fgLabel(euScore);

  drawGauge('gauge-eu', euScore);
  document.getElementById('fg-eu-val').textContent   = euScore;
  document.getElementById('fg-eu-val').style.color   = euInfo.color;
  document.getElementById('fg-eu-label').textContent = euInfo.label;
  document.getElementById('fg-eu-label').style.color = euInfo.color;

  const euInds = buildIndicators(euScores, euCtx);
  document.getElementById('fg-eu-indicators').innerHTML = euInds.map(function(ind) {
    const sig = signalFromScore(ind.score);
    return '<div class="fg-ind">' +
      '<span class="fg-ind-name">' + ind.name + '</span>' +
      '<span class="fg-ind-val">'  + ind.value + '</span>' +
      '<span class="fg-ind-signal ' + sig.cls + '">' + sig.label + '</span>' +
    '</div>';
  }).join('');
}
