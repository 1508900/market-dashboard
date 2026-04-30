/* ============================================================
   MAIN.JS — Application Controller
   ============================================================ */

let selectedIndex = 'sp500';
let equityPeriod = '1W';
let selectedCurveCountry = 'US';
let refreshTimer = null;

// ---- NAVIGATION ----
function showSection(name) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`section-${name}`)?.classList.add('active');
  event?.target?.classList.add('active');

  // Lazy render section content
  switch (name) {
    case 'fixed':
      renderYieldTable();
      renderSlopeChart();
      renderCurveChart(selectedCurveCountry);
      break;
    case 'credit':
      renderCreditCards();
      renderCreditCharts();
      break;
    case 'forex':
      renderForexCards();
      renderForexCharts();
      break;
    case 'commodities':
      renderCommodityCards();
      renderCommodityCharts();
      break;
    case 'correlations':
      renderCorrelations();
      break;
    case 'sentiment':
      renderSentiment();
      break;
    case 'news':
      loadNews();
      break;
  }
}

// ---- PERIOD SELECTOR ----
function setEquityPeriod(period, btn) {
  equityPeriod = period;
  window.marketData.equityPeriod = period;
  document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderIndexChart(selectedIndex, period);
}

// ---- TICKER BAR ----
function updateTickerBar() {
  const indices = window.marketData.indices;
  const forex = window.marketData.forex;
  const comms = window.marketData.commodities;

  const items = [];

  Object.values(indices).forEach(idx => {
    if (!idx.price) return;
    const chg = idx.change || 0;
    const cls = chg >= 0 ? 't-pos' : 't-neg';
    const sign = chg >= 0 ? '▲' : '▼';
    items.push(`<span class="ticker-item"><span class="t-name">${idx.name}</span> ${fmt(idx.price)} <span class="${cls}">${sign} ${Math.abs(chg).toFixed(2)}%</span></span>`);
  });

  Object.values(forex).forEach(pair => {
    if (!pair.rate) return;
    const chg = pair.change || 0;
    const cls = chg >= 0 ? 't-pos' : 't-neg';
    items.push(`<span class="ticker-item"><span class="t-name">${pair.name}</span> ${pair.rate.toFixed(4)} <span class="${cls}">${chg >= 0 ? '+' : ''}${chg.toFixed(2)}%</span></span>`);
  });

  Object.values(comms).flat().forEach(c => {
    if (!c.price) return;
    const chg = c.change || 0;
    const cls = chg >= 0 ? 't-pos' : 't-neg';
    items.push(`<span class="ticker-item"><span class="t-name">${c.name}</span> ${fmt(c.price)} <span class="${cls}">${chg >= 0 ? '+' : ''}${chg.toFixed(2)}%</span></span>`);
  });

  if (items.length === 0) return;

  // Duplicate for seamless loop
  const content = [...items, ...items].join('');
  document.getElementById('ticker-content').innerHTML = content;
}

// ---- INDEX CARDS ----
function renderIndexCards() {
  const container = document.getElementById('index-cards');
  const indices = window.marketData.indices;

  container.innerHTML = Object.values(indices).map(idx => {
    if (!idx.price) return '';
    const chg = idx.change || 0;
    const cls = chg >= 0 ? 'pos' : 'neg';
    const sign = chg >= 0 ? '▲' : '▼';
    const ytd = idx.ytd != null ? idx.ytd : null;
    const ytdCls = ytd != null ? (ytd >= 0 ? 'pos' : 'neg') : 'neutral';

    let barWidth = 50;
    if (idx.high52 && idx.low52) {
      const range = idx.high52 - idx.low52;
      barWidth = range > 0 ? Math.min(100, Math.max(0, (idx.price - idx.low52) / range * 100)) : 50;
    }

    return `<div class="index-card ${cls} ${idx.id === selectedIndex ? 'selected' : ''}" onclick="selectIndex('${idx.id}')">
      <div class="ic-ticker">${idx.ticker} · ${idx.region}</div>
      <div class="ic-name">${idx.name}</div>
      <div class="ic-price">${fmt(idx.price)}</div>
      <div class="ic-change ${cls}">${sign} ${Math.abs(chg).toFixed(2)}% hoy</div>
      ${ytd != null ? `<div class="ic-ytd ${ytdCls}">YTD: ${ytd >= 0 ? '+' : ''}${ytd.toFixed(2)}%</div>` : ''}
      <div class="ic-per">PER Fw: ${idx.per}x · Yield: ${idx.yield}%</div>
      <div class="ic-bar"><div class="ic-bar-fill ${cls}" style="width:${barWidth.toFixed(0)}%; background: ${chg >= 0 ? 'var(--green)' : 'var(--red)'}"></div></div>
    </div>`;
  }).join('');
}

// ---- SELECT INDEX ----
async function selectIndex(id) {
  selectedIndex = id;

  // Update card selection
  document.querySelectorAll('.index-card').forEach(c => {
    c.classList.remove('selected');
    if (c.getAttribute('onclick') && c.getAttribute('onclick').includes("'" + id + "'")) {
      c.classList.add('selected');
    }
  });

  const idx = window.marketData.indices[id];
  if (!idx) return;

  // Update detail panel header
  document.getElementById('detail-name').textContent = idx.name;
  document.getElementById('detail-exchange').textContent = idx.exchange;
  document.getElementById('detail-price').textContent = fmt(idx.price);

  const chg = idx.change || 0;
  const changeEl = document.getElementById('detail-change');
  changeEl.textContent = `${fmtChange(chg)} (${fmtChange(idx.changePt, 'pt')})`;
  changeEl.className = `metric-val ${changeClass(chg)}`;

  document.getElementById('detail-per').textContent = `${idx.per}x`;
  document.getElementById('detail-high').textContent = fmt(idx.high52);
  document.getElementById('detail-low').textContent = fmt(idx.low52);
  document.getElementById('detail-yield').textContent = `${idx.yield}%`;

  // Chart
  renderIndexChart(id, equityPeriod);

  // Holdings
  document.getElementById('holdings-list').innerHTML = '<div class="loading"><div class="pulse"></div>Cargando holdings...</div>';

  let holdingsData = window.marketData.holdings[id];
  if (!holdingsData) {
    holdingsData = await fetchHoldings(id);
    window.marketData.holdings[id] = holdingsData;
  }

  const maxWeight = Math.max(...holdingsData.map(h => h.weight));
  document.getElementById('holdings-list').innerHTML = holdingsData.map((h, i) => {
    const chg = h.change || 0;
    const barW = (h.weight / maxWeight * 100).toFixed(0);
    return `
      <div class="holding-item">
        <span class="h-rank">#${i + 1}</span>
        <span class="h-name">${h.name}<br><small style="color:var(--text3);font-size:10px">${h.ticker}</small></span>
        <span class="h-weight">${h.weight.toFixed(1)}%</span>
        <span class="h-change ${changeClass(chg)}">${fmtChange(chg)}</span>
      </div>
      <div class="h-bar-wrap"><div></div><div class="h-bar-bg"><div class="h-bar-fill" style="width:${barW}%"></div></div><div></div><div></div></div>
    `;
  }).join('');
}

// ---- YIELD TABLE ----
function renderYieldTable() {
  const yields = window.marketData.yields;
  const tbody = document.getElementById('yield-tbody');
  tbody.innerHTML = Object.entries(yields).map(([code, y]) => {
    const slope = (y.y10 - y.y2).toFixed(2);
    const slopeCls = +slope > 0.1 ? 'slope-pos' : +slope < -0.1 ? 'slope-neg' : 'slope-flat';
    return `<tr>
      <td><span class="td-flag">${y.flag}</span>${y.name}</td>
      <td>${y.y1.toFixed(2)}%</td>
      <td>${y.y2.toFixed(2)}%</td>
      <td>${y.y5.toFixed(2)}%</td>
      <td>${y.y10.toFixed(2)}%</td>
      <td>${y.y30.toFixed(2)}%</td>
      <td><span class="${slopeCls}">${slope > 0 ? '+' : ''}${slope}%</span></td>
    </tr>`;
  }).join('');

  // Render curve country tabs
  const tabsEl = document.getElementById('curve-country-tabs');
  tabsEl.innerHTML = Object.entries(yields).map(([code, y]) =>
    `<button class="curve-tab ${code === selectedCurveCountry ? 'active' : ''}" onclick="selectCurveCountry('${code}', this)">${y.flag} ${y.name}</button>`
  ).join('');
}

function selectCurveCountry(code, btn) {
  selectedCurveCountry = code;
  document.querySelectorAll('.curve-tab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderCurveChart(code);
}

// ---- CREDIT CARDS ----
function renderCreditCards() {
  const container = document.getElementById('credit-cards');
  container.innerHTML = window.marketData.credit.map(c => {
    const chg = c.change || 0;
    const cls = chg > 0 ? 'neg' : 'pos'; // wider spread = negative for market
    return `<div class="credit-card">
      <div class="cc-region">${c.region}</div>
      <div class="cc-type">${c.type}</div>
      <div class="cc-spread">${c.spread} <small style="font-size:14px;color:var(--text3)">pb</small></div>
      <div class="cc-change ${cls}">${chg >= 0 ? '+' : ''}${chg} pb hoy</div>
    </div>`;
  }).join('');
}

// ---- FOREX CARDS ----
function renderForexCards() {
  const container = document.getElementById('forex-cards');
  container.innerHTML = Object.values(window.marketData.forex).map(pair => {
    const chg = pair.change || 0;
    const cls = changeClass(chg);
    const decimals = pair.id === 'dxy' ? 2 : 4;
    return `<div class="forex-card">
      <div class="fx-pair">${pair.name}</div>
      <div class="fx-rate">${pair.rate?.toFixed(decimals) || '—'}</div>
      <div class="fx-change ${cls}">${fmtChange(chg)}</div>
      <div class="fx-meta">${pair.base} / ${pair.quote}</div>
    </div>`;
  }).join('');
}

// ---- COMMODITY CARDS ----
function renderCommodityCards() {
  function makeCards(items, containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = items.map(c => {
      const chg = c.change || 0;
      const cls = changeClass(chg);
      return `<div class="comm-card">
        <div>
          <div class="comm-name">${c.name}</div>
          <div class="comm-unit">${c.unit}</div>
        </div>
        <div>
          <div class="comm-price">${fmt(c.price)}</div>
          <div class="comm-change ${cls}">${fmtChange(chg)}</div>
        </div>
      </div>`;
    }).join('');
  }
  makeCards(window.marketData.commodities.energy || [], 'energy-cards');
  makeCards(window.marketData.commodities.precious || [], 'precious-cards');
  makeCards(window.marketData.commodities.industrial || [], 'industrial-cards');
}

// ---- REFRESH ----
async function refreshAll() {
  const btn = document.querySelector('.refresh-btn');
  btn.textContent = '↻ Cargando...';
  btn.disabled = true;

  try {
    await loadAllData();

    // Re-render all active content
    renderIndexCards();
    updateTickerBar();
    await selectIndex(selectedIndex);

    // Refresh current section
    const activeSection = document.querySelector('.section.active')?.id?.replace('section-', '');
    if (activeSection) showSection(activeSection);

  } finally {
    btn.textContent = '↻ Actualizar';
    btn.disabled = false;
  }
}

// ---- INIT ----
async function init() {
  // Load data
  await loadAllData();

  // Render equity section (default)
  renderIndexCards();
  updateTickerBar();

  // Select first index
  const firstId = Object.keys(window.marketData.indices)[0] || 'sp500';
  await selectIndex(firstId);

  // Load news in background
  loadNews();

  // Auto-refresh every 5 minutes
  refreshTimer = setInterval(() => {
    loadAllData().then(() => {
      renderIndexCards();
      updateTickerBar();
      const activeSection = document.querySelector('.section.active')?.id?.replace('section-', '');
      if (activeSection && activeSection !== 'equities') showSection(activeSection);
    });
  }, 5 * 60 * 1000);
}

// Start app
document.addEventListener('DOMContentLoaded', init);
