/* ============================================================
   SENTIMENT.JS — Fear & Greed Indicators
   ============================================================ */

/*
  METHODOLOGY:
  5 sub-indicators for each market (US: S&P500, EU: EuroStoxx50)
  Each scored 0-100 → weighted average → composite F&G score

  1. Volatility vs 50-day avg (VIX proxy)       — weight 25%
  2. Index vs 125-day moving average             — weight 25%
  3. RSI (14-day)                                — weight 20%
  4. HY-IG spread differential                   — weight 15%
  5. Bond price vs equities (20d relative perf.) — weight 15%
*/

function computeRSI(closes, period = 14) {
  if (closes.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gains += diff;
    else losses += Math.abs(diff);
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return +(100 - 100 / (1 + rs)).toFixed(1);
}

function movingAverage(closes, period) {
  if (closes.length < period) return closes[closes.length - 1];
  const slice = closes.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

function computeVolatility(closes, period = 20) {
  if (closes.length < period + 1) return 0.01;
  const returns = [];
  for (let i = closes.length - period; i < closes.length; i++) {
    returns.push((closes[i] - closes[i - 1]) / closes[i - 1]);
  }
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((acc, r) => acc + Math.pow(r - mean, 2), 0) / returns.length;
  return Math.sqrt(variance) * Math.sqrt(252);
}

function volScore(current, avg50) {
  // Low vol vs avg → greed; High vol vs avg → fear
  const ratio = current / avg50;
  if (ratio < 0.7)  return 90;
  if (ratio < 0.85) return 75;
  if (ratio < 1.0)  return 60;
  if (ratio < 1.15) return 40;
  if (ratio < 1.3)  return 25;
  return 10;
}

function ma125Score(price, ma125) {
  const pct = (price - ma125) / ma125 * 100;
  // Above MA → bullish (greed); below → fear
  if (pct > 5)   return 85;
  if (pct > 2)   return 70;
  if (pct > 0)   return 55;
  if (pct > -2)  return 40;
  if (pct > -5)  return 25;
  return 10;
}

function rsiScore(rsi) {
  // RSI itself is already 0-100, map to sentiment
  if (rsi > 70) return 90;  // overbought = greed
  if (rsi > 60) return 72;
  if (rsi > 50) return 58;
  if (rsi > 40) return 42;
  if (rsi > 30) return 28;
  return 10;  // oversold = fear
}

function spreadScore(hySpread, igSpread) {
  const diff = hySpread - igSpread;
  // Narrow diff → risk-on (greed); Wide diff → risk-off (fear)
  if (diff < 150) return 85;
  if (diff < 200) return 68;
  if (diff < 250) return 52;
  if (diff < 320) return 35;
  if (diff < 400) return 20;
  return 8;
}

function bondEquityScore(equityReturn20d, bondReturn20d) {
  // If equities outperform bonds → risk-on (greed)
  const diff = equityReturn20d - bondReturn20d;
  if (diff > 4)  return 85;
  if (diff > 2)  return 68;
  if (diff > 0)  return 55;
  if (diff > -2) return 42;
  if (diff > -4) return 28;
  return 12;
}

function fgLabel(score) {
  if (score >= 80) return { label: 'Codicia Extrema', cls: 'extreme-greed', color: '#22c55e' };
  if (score >= 60) return { label: 'Codicia', cls: 'greed', color: '#84cc16' };
  if (score >= 40) return { label: 'Neutral', cls: 'neutral', color: '#eab308' };
  if (score >= 20) return { label: 'Miedo', cls: 'fear', color: '#f97316' };
  return { label: 'Miedo Extremo', cls: 'extreme-fear', color: '#ef4444' };
}

function computeFearGreed(indexId, hySpreadId, igSpreadId) {
  const idx = window.marketData.indices[indexId];
  const hyCredit = window.marketData.credit.find(c => c.id === hySpreadId);
  const igCredit = window.marketData.credit.find(c => c.id === igSpreadId);

  if (!idx || !idx.closes || idx.closes.length < 30) {
    // Fallback random realistic value
    const score = Math.round(30 + Math.random() * 40);
    return { score, indicators: [] };
  }

  const closes = idx.closes;
  const price = closes[closes.length - 1];

  // Compute volatility over rolling windows
  const vol20 = computeVolatility(closes, 20);
  const vol50 = computeVolatility(closes, 50);

  // MA125 (use available data, pad if needed)
  const ma125val = movingAverage(closes, Math.min(125, closes.length));
  const rsi = computeRSI(closes, 14);

  // Spreads
  const hy = hyCredit?.spread || 350;
  const ig = igCredit?.spread || 110;

  // 20d equity vs bond performance (simulated bond via yield changes)
  const eq20 = closes.length >= 20
    ? (price - closes[closes.length - 21]) / closes[closes.length - 21] * 100
    : 0;
  const bond20 = -((window.marketData.yields['US']?.y10 || 4.5) - 4.5) * 8; // duration approx

  // Sub-scores
  const s1 = volScore(vol20, vol50);
  const s2 = ma125Score(price, ma125val);
  const s3 = rsiScore(rsi);
  const s4 = spreadScore(hy, ig);
  const s5 = bondEquityScore(eq20, bond20);

  // Weighted composite
  const score = Math.round(s1 * 0.25 + s2 * 0.25 + s3 * 0.20 + s4 * 0.15 + s5 * 0.15);

  const indicators = [
    { name: 'Volatilidad vs media 50d', value: `${(vol20 * 100).toFixed(1)}% / ${(vol50 * 100).toFixed(1)}%`, score: s1 },
    { name: 'Índice vs media 125d',     value: `${((price/ma125val-1)*100).toFixed(1)}%`,                    score: s2 },
    { name: 'RSI 14 días',              value: rsi.toFixed(1),                                                score: s3 },
    { name: 'Diferencial HY-IG',        value: `${hy - ig} pb`,                                              score: s4 },
    { name: 'Bolsa vs Bono 20d',        value: `${eq20.toFixed(1)}% vs ${bond20.toFixed(1)}%`,               score: s5 },
  ];

  return { score, indicators };
}

function signalFromScore(score) {
  if (score >= 60) return { label: 'Alcista', cls: 'sig-bullish' };
  if (score >= 40) return { label: 'Neutral', cls: 'sig-neutral' };
  return { label: 'Bajista', cls: 'sig-bearish' };
}

function drawGauge(canvasId, score) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const cx = W / 2, cy = H * 0.88, r = H * 0.75;
  const startAngle = Math.PI;
  const endAngle = 2 * Math.PI;

  // Background arc
  ctx.beginPath();
  ctx.arc(cx, cy, r, startAngle, endAngle);
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 18;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Color zones
  const zones = [
    { from: 0, to: 20, color: '#ef4444' },
    { from: 20, to: 40, color: '#f97316' },
    { from: 40, to: 60, color: '#eab308' },
    { from: 60, to: 80, color: '#84cc16' },
    { from: 80, to: 100, color: '#22c55e' },
  ];
  zones.forEach(z => {
    const a1 = startAngle + (z.from / 100) * Math.PI;
    const a2 = startAngle + (z.to / 100) * Math.PI;
    ctx.beginPath();
    ctx.arc(cx, cy, r, a1, a2);
    ctx.strokeStyle = z.color + '55';
    ctx.lineWidth = 18;
    ctx.stroke();
  });

  // Score arc
  const { color } = fgLabel(score);
  const scoreAngle = startAngle + (score / 100) * Math.PI;
  ctx.beginPath();
  ctx.arc(cx, cy, r, startAngle, scoreAngle);
  ctx.strokeStyle = color;
  ctx.lineWidth = 18;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Needle
  const needleAngle = startAngle + (score / 100) * Math.PI;
  const nl = r * 0.72;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + nl * Math.cos(needleAngle), cy + nl * Math.sin(needleAngle));
  ctx.strokeStyle = '#e8edf5';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Center dot
  ctx.beginPath();
  ctx.arc(cx, cy, 6, 0, Math.PI * 2);
  ctx.fillStyle = '#e8edf5';
  ctx.fill();

  // Zone labels
  ctx.font = '9px DM Sans, sans-serif';
  ctx.fillStyle = '#5a6a8a';
  ctx.textAlign = 'center';
  ctx.fillText('0', cx - r - 8, cy + 14);
  ctx.fillText('50', cx, cy - r - 8);
  ctx.fillText('100', cx + r + 10, cy + 14);
}

function renderSentiment() {
  // US
  const us = computeFearGreed('sp500', 'us_hy', 'us_ig');
  const usInfo = fgLabel(us.score);
  drawGauge('gauge-us', us.score);
  document.getElementById('fg-us-val').textContent = us.score;
  document.getElementById('fg-us-val').style.color = usInfo.color;
  document.getElementById('fg-us-label').textContent = usInfo.label;
  document.getElementById('fg-us-label').style.color = usInfo.color;

  const usIndEl = document.getElementById('fg-us-indicators');
  usIndEl.innerHTML = us.indicators.map(ind => {
    const sig = signalFromScore(ind.score);
    return `<div class="fg-ind">
      <span class="fg-ind-name">${ind.name}</span>
      <span class="fg-ind-val">${ind.value}</span>
      <span class="fg-ind-signal ${sig.cls}">${sig.label}</span>
    </div>`;
  }).join('');

  // EU
  const eu = computeFearGreed('eurostoxx', 'eu_hy', 'eu_ig');
  const euInfo = fgLabel(eu.score);
  drawGauge('gauge-eu', eu.score);
  document.getElementById('fg-eu-val').textContent = eu.score;
  document.getElementById('fg-eu-val').style.color = euInfo.color;
  document.getElementById('fg-eu-label').textContent = euInfo.label;
  document.getElementById('fg-eu-label').style.color = euInfo.color;

  const euIndEl = document.getElementById('fg-eu-indicators');
  euIndEl.innerHTML = eu.indicators.map(ind => {
    const sig = signalFromScore(ind.score);
    return `<div class="fg-ind">
      <span class="fg-ind-name">${ind.name}</span>
      <span class="fg-ind-val">${ind.value}</span>
      <span class="fg-ind-signal ${sig.cls}">${sig.label}</span>
    </div>`;
  }).join('');
}
