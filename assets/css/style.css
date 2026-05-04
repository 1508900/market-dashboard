/* ============================================================
   SCENARIOS.JS — Macro Scenarios & Asset Allocation
   ============================================================ */

// ---- SCENARIO DEFINITIONS ----
const SCENARIOS = {
  recession: {
    id: 'recession',
    name: 'Recesión',
    icon: '🔴',
    color: '#EB5656',
    colorBg: '#FDEAEA',
    description: 'Contracción económica, caída de beneficios, flight to quality',
    definition: 'Contracción del PIB real durante dos trimestres consecutivos (definición técnica). Se caracteriza por aumento del desempleo, caída del consumo e inversión, deterioro de beneficios empresariales y ampliación de spreads de crédito. Históricamente asociada a bajadas de tipos de los bancos centrales y curva de tipos con pendiente positiva tras período de inversión.',
    allocation: {
      rv:       { min: 10,  max: 20,  label: 'Renta Variable' },
      rf:       { min: 80,  max: 90,  label: 'Renta Fija' },
      oro:      { min: 5,   max: 10,  label: 'Oro' },
      usd:      { min: 30,  max: 40,  label: 'Exposición USD' },
    },
    fixed_income: {
      duration: { min: 6, max: 7, label: 'Duración RF (años)' },
      bias: 'Deuda pública y quality. Sin high yield.',
    },
    equity: {
      bias: 'Defensivo: utilities, salud, consumo básico. Sin cíclicos.',
    },
    strategies: [
      { name: 'Inversión de pendiente RF', desc: 'Long bonos largos (10Y-30Y) / Short bonos cortos (2Y). La curva tiende a empinarse en recesión ante expectativas de bajadas de tipos.', icon: '📐' },
      { name: 'Long Volatilidad', desc: 'Compra de opciones put sobre índices o VIX calls. La volatilidad sube en entornos de contracción económica y risk-off.', icon: '📈' },
      { name: 'Long Oro / USD', desc: 'Activos refugio clásicos en recesión. El oro sube ante tipos reales negativos y el USD por flight to quality.', icon: '🥇' },
    ],
  },
  stagflation: {
    id: 'stagflation',
    name: 'Estanflación',
    icon: '🟡',
    color: '#E67E22',
    colorBg: '#FFF3E0',
    description: 'Inflación persistente con bajo crecimiento, tipos altos',
    definition: 'Combinación de inflación elevada y persistente con crecimiento económico débil o negativo. Dilema para los bancos centrales: subir tipos para combatir inflación agrava la recesión; bajarlos alimenta más inflación. Episodio paradigmático: años 70 tras las crisis del petróleo. Perjudica tanto a bonos (por inflación) como a bolsa (por bajo crecimiento).',
    allocation: {
      rv:       { min: 30,  max: 40,  label: 'Renta Variable' },
      rf:       { min: 60,  max: 70,  label: 'Renta Fija' },
      oro:      { min: 3,   max: 5,   label: 'Oro' },
      usd:      { min: 10,  max: 20,  label: 'Exposición USD' },
    },
    fixed_income: {
      duration: { min: 3, max: 3, label: 'Duración RF (años)' },
      bias: 'Neutral en crédito. Corta duración para proteger de inflación.',
    },
    equity: {
      bias: 'Value, energía, materias primas, real assets.',
    },
    strategies: [
      { name: 'Corta Duración RF', desc: 'Infraponderación de bonos largos. La inflación persistente presiona al alza los tipos largos erosionando el precio de bonos de larga duración.', icon: '⏱️' },
      { name: 'Materias Primas', desc: 'Long commodities (energía, metales). Actúan como cobertura natural de inflación y se benefician de la escasez de oferta.', icon: '🛢️' },
      { name: 'TIPS / Bonos indexados', desc: 'Bonos ligados a inflación como cobertura directa. Protegen el poder adquisitivo del capital en entornos de inflación elevada.', icon: '🔒' },
    ],
  },
  growth: {
    id: 'growth',
    name: 'Crecimiento',
    icon: '🟢',
    color: '#367B35',
    colorBg: '#C6F3C6',
    description: 'Expansión económica, beneficios al alza, risk-on',
    definition: 'Fase expansiva del ciclo económico con crecimiento del PIB por encima del potencial, creación de empleo, mejora de márgenes empresariales y reducción de defaults. El crédito fluye con normalidad, los spreads se estrechan y los activos de riesgo se comportan favorablemente. Puede ir acompañado de presiones inflacionistas moderadas en fases maduras.',
    allocation: {
      rv:       { min: 60,  max: 70,  label: 'Renta Variable' },
      rf:       { min: 30,  max: 40,  label: 'Renta Fija' },
      oro:      { min: 0,   max: 0,   label: 'Oro' },
      usd:      { min: 20,  max: 30,  label: 'Exposición USD' },
    },
    fixed_income: {
      duration: { min: 4, max: 5, label: 'Duración RF (años)' },
      bias: 'Sesgo a crédito corporativo (IG y HY selectivo).',
    },
    equity: {
      bias: 'Growth, tecnología, financieros, cíclicos.',
    },
    strategies: [
      { name: 'Apuntamiento de Pendiente RF', desc: 'Short bonos largos / Long bonos cortos. En expansión, la curva tiende a aplanarse o invertirse ante subidas de tipos del banco central.', icon: '📉' },
      { name: 'Short Volatilidad', desc: 'Venta de volatilidad (opciones, variance swaps). En crecimiento el VIX comprime y la venta de opciones genera prima con baja probabilidad de pérdida.', icon: '📊' },
      { name: 'Long Crédito HY', desc: 'Los spreads de high yield se estrechan en expansión. Mayor carry con menor riesgo de default gracias al crecimiento de beneficios empresariales.', icon: '💼' },
    ],
  },
};

const NEUTRAL = {
  rv:       { min: 40,  max: 50,  label: 'Renta Variable' },
  rf:       { min: 50,  max: 60,  label: 'Renta Fija' },
  oro:      { min: 0,   max: 0,   label: 'Oro' },
  usd:      { min: 20,  max: 25,  label: 'Exposición USD' },
  duration: { min: 3.5, max: 4,   label: 'Duración RF (años)' },
};

// ---- AUTO-DETECT SCENARIO PROBABILITIES ----
function detectScenarioProbabilities() {
  var md = window.marketData;
  if (!md) return { recession: 33, stagflation: 34, growth: 33 };

  var scores = { recession: 0, stagflation: 0, growth: 0 };

  // 1. Yield curve slope (2-10Y)
  var yields = md.yields && md.yields['US'];
  if (yields && yields.y10 && yields.y2) {
    var slope = yields.y10 - yields.y2;
    if (slope < -0.2)      { scores.recession += 25; }
    else if (slope < 0.3)  { scores.stagflation += 15; scores.recession += 10; }
    else                   { scores.growth += 20; }
  }

  // 2. VIX level
  var vix = md.volatility && md.volatility['vix'];
  if (vix) {
    if (vix.price > 30)      { scores.recession += 25; }
    else if (vix.price > 20) { scores.stagflation += 15; scores.recession += 5; }
    else                     { scores.growth += 20; }
  }

  // 3. Credit spreads HY-IG
  var usHy = md.credit && md.credit.find(function(c) { return c.id === 'us_hy'; });
  var usIg = md.credit && md.credit.find(function(c) { return c.id === 'us_ig'; });
  if (usHy && usIg) {
    var diff = usHy.spread - usIg.spread;
    if (diff > 350)      { scores.recession += 20; }
    else if (diff > 250) { scores.stagflation += 10; scores.recession += 5; }
    else                 { scores.growth += 15; }
  }

  // 4. Fear & Greed US
  var sp500 = md.indices && md.indices['sp500'];
  if (sp500 && sp500.closes && sp500.closes.length > 30) {
    var price = sp500.price;
    var ma125 = sp500.closes.slice(-125).reduce(function(a,b){return a+b;},0) / Math.min(125, sp500.closes.length);
    var pctAbove = (price - ma125) / ma125 * 100;
    if (pctAbove < -5)     { scores.recession += 20; }
    else if (pctAbove < 0) { scores.stagflation += 10; }
    else if (pctAbove > 5) { scores.growth += 20; }
    else                   { scores.stagflation += 10; }
  }

  // 5. Inflation proxy: short vs long rates
  if (yields && yields.y1 && yields.y10) {
    var inflation_proxy = yields.y1 - 2.0; // above 2% target
    if (inflation_proxy > 1.5) { scores.stagflation += 15; }
    else if (inflation_proxy > 0.5) { scores.stagflation += 8; scores.growth += 5; }
    else { scores.growth += 10; }
  }

  // Normalize to 100
  var total = scores.recession + scores.stagflation + scores.growth;
  if (total === 0) return { recession: 33, stagflation: 34, growth: 33 };

  return {
    recession:   Math.round(scores.recession / total * 100),
    stagflation: Math.round(scores.stagflation / total * 100),
    growth:      Math.round(scores.growth / total * 100),
  };
}

// ---- CALCULATE WEIGHTED AA ----
function calcWeightedAA(probs) {
  var result = {};
  var assets = ['rv', 'rf', 'oro', 'usd'];

  assets.forEach(function(asset) {
    var midR = (SCENARIOS.recession.allocation[asset].min + SCENARIOS.recession.allocation[asset].max) / 2;
    var midS = (SCENARIOS.stagflation.allocation[asset].min + SCENARIOS.stagflation.allocation[asset].max) / 2;
    var midG = (SCENARIOS.growth.allocation[asset].min + SCENARIOS.growth.allocation[asset].max) / 2;

    var weighted = (midR * probs.recession + midS * probs.stagflation + midG * probs.growth) / 100;
    result[asset] = Math.round(weighted * 10) / 10;
  });

  // Duration
  var durR = (SCENARIOS.recession.fixed_income.duration.min + SCENARIOS.recession.fixed_income.duration.max) / 2;
  var durS = (SCENARIOS.stagflation.fixed_income.duration.min + SCENARIOS.stagflation.fixed_income.duration.max) / 2;
  var durG = (SCENARIOS.growth.fixed_income.duration.min + SCENARIOS.growth.fixed_income.duration.max) / 2;
  result.duration = Math.round(((durR * probs.recession + durS * probs.stagflation + durG * probs.growth) / 100) * 10) / 10;

  return result;
}

// ---- RENDER ----
var scenarioChart = null;
var currentProbs = { recession: 33, stagflation: 34, growth: 33 };

function renderScenarios() {
  var autoProbs = detectScenarioProbabilities();
  currentProbs = autoProbs;
  renderScenariosUI(currentProbs);
}

function renderScenariosUI(probs) {
  var aa = calcWeightedAA(probs);
  var dominant = probs.recession >= probs.stagflation && probs.recession >= probs.growth ? 'recession'
    : probs.growth >= probs.stagflation ? 'growth' : 'stagflation';
  var domScenario = SCENARIOS[dominant];

  // Render scenario cards with sliders
  var cardsHTML = Object.values(SCENARIOS).map(function(sc) {
    var prob = probs[sc.id];
    return '<div class="sc-card" style="border-top: 3px solid ' + sc.color + '">' +
      '<div class="sc-card-header">' +
        '<div class="sc-icon-name">' +
          '<span class="sc-icon">' + sc.icon + '</span>' +
          '<span class="sc-name">' + sc.name + '</span>' +
        '</div>' +
        '<div class="sc-prob-input-wrap">' +
          '<input type="number" class="sc-prob-input" id="input-' + sc.id + '" min="0" max="100" value="' + prob + '" ' +
            'style="border-color:' + sc.color + ';color:' + sc.color + '" ' +
            'onchange="onInputChange(\'' + sc.id + '\', this.value)">' +
          '<span style="color:' + sc.color + ';font-weight:700">%</span>' +
        '</div>' +
      '</div>' +
      '<div class="sc-desc">' + sc.description + '</div>' +
      '<input type="range" class="sc-slider" id="slider-' + sc.id + '" min="0" max="100" value="' + prob + '" ' +
        'oninput="onSliderChange(\'' + sc.id + '\', this.value)" ' +
        'style="accent-color:' + sc.color + '">' +
      '<div class="sc-alloc-mini">' +
        '<span>RV: ' + sc.allocation.rv.min + '-' + sc.allocation.rv.max + '%</span>' +
        '<span>RF: ' + sc.allocation.rf.min + '-' + sc.allocation.rf.max + '%</span>' +
        '<span>Dur: ' + sc.fixed_income.duration.min + (sc.fixed_income.duration.max !== sc.fixed_income.duration.min ? '-' + sc.fixed_income.duration.max : '') + 'a</span>' +
        '<span>Oro: ' + sc.allocation.oro.min + '-' + sc.allocation.oro.max + '%</span>' +
      '</div>' +
      '<details class="sc-definition">' +
        '<summary>📖 Definición</summary>' +
        '<p>' + sc.definition + '</p>' +
      '</details>' +
    '</div>';
  }).join('');

  document.getElementById('sc-cards').innerHTML = cardsHTML;

  // Render dominant scenario indicator
  document.getElementById('sc-dominant').innerHTML =
    '<div class="sc-dominant-box" style="background:' + domScenario.colorBg + ';border:2px solid ' + domScenario.color + '">' +
      '<div class="sc-dominant-title">Escenario Dominante</div>' +
      '<div class="sc-dominant-name" style="color:' + domScenario.color + '">' + domScenario.icon + ' ' + domScenario.name + '</div>' +
      '<div class="sc-dominant-prob" style="color:' + domScenario.color + '">' + probs[dominant] + '% de probabilidad</div>' +
      '<div class="sc-dominant-desc">' + domScenario.description + '</div>' +
    '</div>';

  // Render AA result
  renderAAResult(aa, probs, domScenario);
}

function renderAAResult(aa, probs, domScenario) {
  // Donut chart
  if (scenarioChart) { scenarioChart.destroy(); scenarioChart = null; }
  var ctx = document.getElementById('sc-donut-chart');
  if (ctx) {
    scenarioChart = new Chart(ctx.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: ['Renta Variable', 'Renta Fija', 'Oro', 'Cash/USD'],
        datasets: [{
          data: [aa.rv, aa.rf, aa.oro, Math.max(0, 100 - aa.rv - aa.rf - aa.oro)],
          backgroundColor: ['#0085CA', '#37BBF4', '#F59E0B', '#C8DAE2'],
          borderColor: '#FFFFFF',
          borderWidth: 3,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: { display: true, position: 'bottom', labels: { color: '#062D3F', font: { size: 11 }, padding: 12 } },
          tooltip: {
            backgroundColor: '#062D3F', borderColor: '#0085CA', borderWidth: 1,
            titleColor: '#C8DAE2', bodyColor: '#F3F3F3', padding: 10,
            callbacks: { label: function(ctx) { return ' ' + ctx.label + ': ' + ctx.parsed.toFixed(1) + '%'; } }
          }
        }
      }
    });
  }

  // AA metrics
  document.getElementById('sc-aa-metrics').innerHTML =
    '<div class="sc-metric"><span class="sc-metric-label">Renta Variable</span><span class="sc-metric-val" style="color:#0085CA">' + aa.rv.toFixed(1) + '%</span></div>' +
    '<div class="sc-metric"><span class="sc-metric-label">Renta Fija</span><span class="sc-metric-val" style="color:#37BBF4">' + aa.rf.toFixed(1) + '%</span></div>' +
    '<div class="sc-metric"><span class="sc-metric-label">Oro</span><span class="sc-metric-val" style="color:#F59E0B">' + aa.oro.toFixed(1) + '%</span></div>' +
    '<div class="sc-metric"><span class="sc-metric-label">USD</span><span class="sc-metric-val" style="color:#8E44AD">' + aa.usd.toFixed(1) + '%</span></div>' +
    '<div class="sc-metric" style="grid-column:span 1"><span class="sc-metric-label">Duración RF</span><span class="sc-metric-val" style="color:#062D3F;font-size:14px">' + aa.duration.toFixed(1) + ' años</span></div>';

  // Bias text + strategies
  var strategiesHTML = '';
  if (domScenario.strategies) {
    strategiesHTML = '<div class="sc-strategies-title">Estrategias de mercado</div>' +
      domScenario.strategies.map(function(s) {
        return '<div class="sc-strategy-item">' +
          '<div class="sc-strategy-header"><span class="sc-strategy-icon">' + s.icon + '</span><span class="sc-strategy-name">' + s.name + '</span></div>' +
          '<div class="sc-strategy-desc">' + s.desc + '</div>' +
        '</div>';
      }).join('');
  }

  document.getElementById('sc-bias').innerHTML =
    '<div class="sc-bias-box">' +
      '<div class="sc-bias-title">Posicionamiento recomendado</div>' +
      '<div class="sc-bias-item"><strong>Renta Fija:</strong> ' + domScenario.fixed_income.bias + '</div>' +
      '<div class="sc-bias-item"><strong>Renta Variable:</strong> ' + domScenario.equity.bias + '</div>' +
      strategiesHTML +
    '</div>';

  // Neutral comparison
  document.getElementById('sc-vs-neutral').innerHTML =
    '<div class="sc-neutral-title">vs. Posición Neutral</div>' +
    buildVsNeutral('Renta Variable', aa.rv, NEUTRAL.rv.min, NEUTRAL.rv.max, '#0085CA') +
    buildVsNeutral('Renta Fija', aa.rf, NEUTRAL.rf.min, NEUTRAL.rf.max, '#37BBF4') +
    buildVsNeutral('Duración RF', aa.duration, NEUTRAL.duration.min, NEUTRAL.duration.max, '#062D3F') +
    buildVsNeutral('Oro', aa.oro, NEUTRAL.oro.min, NEUTRAL.oro.max, '#F59E0B') +
    buildVsNeutral('USD', aa.usd, NEUTRAL.usd.min, NEUTRAL.usd.max, '#8E44AD');
}

function buildVsNeutral(label, value, neutralMin, neutralMax, color) {
  var neutralMid = (neutralMin + neutralMax) / 2;
  var diff = value - neutralMid;
  var sign = diff >= 0 ? '+' : '';
  var cls = diff > 0.5 ? 'pos' : diff < -0.5 ? 'neg' : 'neutral';
  var arrow = diff > 0.5 ? '▲' : diff < -0.5 ? '▼' : '—';
  return '<div class="sc-neutral-row">' +
    '<span class="sc-neutral-label">' + label + '</span>' +
    '<span class="sc-neutral-range">' + neutralMin + (neutralMax !== neutralMin ? '-' + neutralMax : '') + '%</span>' +
    '<span class="sc-neutral-val" style="color:' + color + '">' + value.toFixed(1) + '%</span>' +
    '<span class="sc-neutral-diff ' + cls + '">' + arrow + ' ' + sign + diff.toFixed(1) + '%</span>' +
  '</div>';
}

function onInputChange(scenarioId, value) {
  value = Math.max(0, Math.min(100, parseInt(value) || 0));
  document.getElementById('input-' + scenarioId).value = value;
  onSliderChange(scenarioId, value);
}

function onSliderChange(scenarioId, value) {
  value = parseInt(value);
  currentProbs[scenarioId] = value;

  // Adjust others proportionally to sum to 100
  var others = Object.keys(currentProbs).filter(function(k) { return k !== scenarioId; });
  var remaining = 100 - value;
  var otherSum = others.reduce(function(acc, k) { return acc + currentProbs[k]; }, 0);

  if (otherSum === 0) {
    others.forEach(function(k) { currentProbs[k] = Math.round(remaining / others.length); });
  } else {
    others.forEach(function(k) {
      currentProbs[k] = Math.round(currentProbs[k] / otherSum * remaining);
    });
  }

  // Fix rounding
  var total = Object.values(currentProbs).reduce(function(a,b){return a+b;},0);
  if (total !== 100) currentProbs[others[0]] += (100 - total);

  // Update sliders and badges
  Object.keys(currentProbs).forEach(function(k) {
    var slider = document.getElementById('slider-' + k);
    var input  = document.getElementById('input-' + k);
    if (slider) slider.value = currentProbs[k];
    if (input)  input.value  = currentProbs[k];
  });

  // Recalculate AA
  var aa = calcWeightedAA(currentProbs);
  var dominant = currentProbs.recession >= currentProbs.stagflation && currentProbs.recession >= currentProbs.growth ? 'recession'
    : currentProbs.growth >= currentProbs.stagflation ? 'growth' : 'stagflation';
  renderAAResult(aa, currentProbs, SCENARIOS[dominant]);
}

function resetScenarios() {
  currentProbs = detectScenarioProbabilities();
  renderScenariosUI(currentProbs);
}
