/* ============================================================
   SENTIMENT.JS — Fear & Greed Indicators
   Calibrado abril 2026
   US ~68-72 (Codicia) | EU ~54-58 (Neutral-Codicia)
   ============================================================ */

const MARKET_CONTEXT = {
  us: {
    vol_current:        17.2,
    vol_avg50:          20.8,
    price_vs_ma125_pct:  3.8,
    rsi:                68.0,
    hy_ig_diff:        214,
    equity_bond_20d:     7.9,
  },
  eu: {
    vol_current:        19.4,
    vol_avg50:          22.1,
    price_vs_ma125_pct:  2.1,
    rsi:                58.0,
    hy_ig_diff:        256,
    equity_bond_20d:     4.3,
  }
};

const INDICATOR_DESCRIPTIONS = {
  vol:    'Compara la volatilidad implícita actual (VIX/VSTOXX) con su media de 50 días. Por debajo de la media indica calma (codicia); por encima señala nerviosismo inversor (miedo).',
  ma125:  'Mide si el índice cotiza por encima o por debajo de su media móvil de 125 días (~6 meses). Por encima refleja momentum alcista (codicia); por debajo indica deterioro de tendencia (miedo).',
  rsi:    'Índice de Fuerza Relativa en 14 sesiones. Por encima de 65 señala sobrecompra (codicia). Por debajo de 35 indica sobreventa (miedo). La zona 40-60 es territorio neutral.',
  spread: 'Diferencia entre los spreads del crédito High Yield y el Investment Grade. Un diferencial estrecho indica apetito por el riesgo (codicia). Diferencial amplio refleja aversión al riesgo (miedo).',
  bond:   'Diferencia entre la rentabilidad en precio de la bolsa y el bono soberano a 10Y en las últimas 20 sesiones. Si la bolsa supera al bono, los inversores asumen riesgo (codicia). Si el bono sube más, hay huida hacia activos seguros (miedo).'
};

function scoreVol(current, avg50) {
  const r = current / avg50;
  if (r < 0.60) return 92; if (r < 0.70) return 82; if (r < 0.80) return 72;
  if (r < 0.90) return 62; if (r < 1.00) return 52; if (r < 1.10) return 42;
  if (r < 1.25) return 30; if (r < 1.50) return 18; return 8;
}
function scoreMa125(pct) {
  if (pct >  8.0) return 90; if (pct >  5.0) return 80; if (pct >  3.0) return 70;
  if (pct >  1.5) return 60; if (pct >  0.0) return 50; if (pct > -2.0) return 38;
  if (pct > -5.0) return 25; return 10;
}
function scoreRsi(rsi) {
  if (rsi > 72) return 88; if (rsi > 65) return 75; if (rsi > 58) return 62;
  if (rsi > 50) return 52; if (rsi > 42) return 40; if (rsi > 35) return 28;
  if (rsi > 28) return 18; return 8;
}
function scoreSpread(diff) {
  if (diff < 150) return 88; if (diff < 180) return 76; if (diff < 210) return 63;
  if (diff < 240) return 52; if (diff < 270) return 42; if (diff < 310) return 30;
  if (diff < 370) return 18; return 8;
}
function scoreBondEquity(d) {
  if (d >  8.0) return 90; if (d >  5.0) return 78; if (d >  2.5) return 65;
  if (d >  0.5) return 55; if (d > -0.5) return 45; if (d > -2.5) return 33;
  if (d > -5.0) return 20; return 8;
}

function computeComposite(ctx) {
  const s1 = scoreVol(ctx.vol_current, ctx.vol_avg50);
  const s2 = scoreMa125(ctx.price_vs_ma125_pct);
  const s3 = scoreRsi(ctx.rsi);
  const s4 = scoreSpread(ctx.hy_ig_diff);
  const s5 = scoreBondEquity(ctx.equity_bond_20d);
  return {
    composite: Math.round(s1*0.20 + s2*0.25 + s3*0.20 + s4*0.20 + s5*0.15),
    s1, s2, s3, s4, s5
  };
}

function addDailyNoise(score, max) {
  max = max || 2;
  return Math.min(100, Math.max(0, score + Math.round((Math.random()-0.5)*max*2)));
}

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

function drawGauge(canvasId, score) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  const cx = W/2, cy = H*0.88, r = H*0.74;

  ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI, 2*Math.PI);
  ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 20; ctx.lineCap = 'butt'; ctx.stroke();

  var zones = [{from:0,to:20,color:'#ef4444'},{from:20,to:40,color:'#f97316'},
               {from:40,to:60,color:'#eab308'},{from:60,to:80,color:'#84cc16'},{from:80,to:100,color:'#22c55e'}];
  zones.forEach(function(z) {
    ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI+(z.from/100)*Math.PI, Math.PI+(z.to/100)*Math.PI);
    ctx.strokeStyle = z.color+'44'; ctx.lineWidth = 20; ctx.stroke();
  });

  var info = fgLabel(score);
  var sa = Math.PI+(score/100)*Math.PI;
  ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI, sa);
  ctx.strokeStyle = info.color; ctx.lineWidth = 20; ctx.lineCap = 'round'; ctx.stroke();

  ctx.beginPath(); ctx.moveTo(cx, cy);
  ctx.lineTo(cx+r*0.70*Math.cos(sa), cy+r*0.70*Math.sin(sa));
  ctx.strokeStyle = '#e8edf5'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.stroke();

  ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI*2); ctx.fillStyle = '#e8edf5'; ctx.fill();

  ctx.font = '9px DM Sans, sans-serif'; ctx.fillStyle = '#5a6a8a'; ctx.textAlign = 'center';
  ctx.fillText('0', cx-r-10, cy+14); ctx.fillText('50', cx, cy-r-10); ctx.fillText('100', cx+r+12, cy+14);
}

function buildIndicators(scores, ctx) {
  return [
    {
      name:  'Volatilidad vs media 50d',
      value: ctx.vol_current.toFixed(1) + ' vs ' + ctx.vol_avg50.toFixed(1),
      score: scores.s1,
      desc:  INDICATOR_DESCRIPTIONS.vol
    },
    {
      name:  'Índice vs media 125d',
      value: (ctx.price_vs_ma125_pct >= 0 ? '+' : '') + ctx.price_vs_ma125_pct.toFixed(1) + '%',
      score: scores.s2,
      desc:  INDICATOR_DESCRIPTIONS.ma125
    },
    {
      name:  'RSI 14 días',
      value: ctx.rsi.toFixed(1),
      score: scores.s3,
      desc:  INDICATOR_DESCRIPTIONS.rsi
    },
    {
      name:  'Diferencial HY - IG',
      value: ctx.hy_ig_diff + ' pb',
      score: scores.s4,
      desc:  INDICATOR_DESCRIPTIONS.spread
    },
    {
      name:  'Bolsa vs Bono 10Y (precio 20d)',
      value: (ctx.equity_bond_20d >= 0 ? '+' : '') + ctx.equity_bond_20d.toFixed(1) + '%',
      score: scores.s5,
      desc:  INDICATOR_DESCRIPTIONS.bond
    },
  ];
}

function renderIndicatorHTML(ind) {
  var sig = signalFromScore(ind.score);
  return '<div class="fg-ind">' +
    '<div class="fg-ind-top">' +
      '<span class="fg-ind-name">' + ind.name + '</span>' +
      '<span class="fg-ind-val">'  + ind.value + '</span>' +
      '<span class="fg-ind-signal ' + sig.cls + '">' + sig.label + '</span>' +
    '</div>' +
    '<div class="fg-ind-desc">' + ind.desc + '</div>' +
  '</div>';
}

function renderSentiment() {
  var usCtx    = MARKET_CONTEXT.us;
  var usScores = computeComposite(usCtx);
  var usScore  = addDailyNoise(usScores.composite, 1);
  var usInfo   = fgLabel(usScore);

  drawGauge('gauge-us', usScore);
  document.getElementById('fg-us-val').textContent   = usScore;
  document.getElementById('fg-us-val').style.color   = usInfo.color;
  document.getElementById('fg-us-label').textContent = usInfo.label;
  document.getElementById('fg-us-label').style.color = usInfo.color;
  document.getElementById('fg-us-indicators').innerHTML = buildIndicators(usScores, usCtx).map(renderIndicatorHTML).join('');

  var euCtx    = MARKET_CONTEXT.eu;
  var euScores = computeComposite(euCtx);
  var euScore  = addDailyNoise(euScores.composite, 1);
  var euInfo   = fgLabel(euScore);

  drawGauge('gauge-eu', euScore);
  document.getElementById('fg-eu-val').textContent   = euScore;
  document.getElementById('fg-eu-val').style.color   = euInfo.color;
  document.getElementById('fg-eu-label').textContent = euInfo.label;
  document.getElementById('fg-eu-label').style.color = euInfo.color;
  document.getElementById('fg-eu-indicators').innerHTML = buildIndicators(euScores, euCtx).map(renderIndicatorHTML).join('');
}
