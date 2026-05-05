/* ============================================================
   CHARTS.JS — Chart Rendering
   ============================================================ */

const CHART_DEFAULTS = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 400 },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#062D3F',
      borderColor: '#0085CA',
      borderWidth: 1,
      titleColor: '#C8DAE2',
      bodyColor: '#F3F3F3',
      padding: 10,
    },
  },
  scales: {
    x: {
      grid: { color: 'rgba(6,45,63,0.06)', drawBorder: false },
      ticks: { color: '#7A9BAD', font: { size: 10 }, maxTicksLimit: 8 },
    },
    y: {
      grid: { color: 'rgba(6,45,63,0.06)', drawBorder: false },
      ticks: { color: '#7A9BAD', font: { size: 10 } },
      position: 'right',
    },
  },
};

let charts = {};

function destroyChart(id) {
  if (charts[id]) { charts[id].destroy(); delete charts[id]; }
}

// ---- INDEX DETAIL CHART ----
function renderIndexChart(indexId, period) {
  const idx = window.marketData.indices[indexId];
  if (!idx) return;

  const { dates, closes } = filterByPeriod(idx.dates || [], idx.closes || [], period);
  if (!dates.length) return;

  const isPos = closes[closes.length - 1] >= closes[0];
  const color = isPos ? '#367B35' : '#EB5656';
  const colorBg = isPos ? 'rgba(54,123,53,0.08)' : 'rgba(235,86,86,0.08)';

  destroyChart('index-chart');
  const ctx = document.getElementById('index-chart').getContext('2d');
  charts['index-chart'] = new Chart(ctx, {
    type: 'line',
    data: {
      labels: dates.map(d => d.slice(5)),
      datasets: [{
        data: closes,
        borderColor: color,
        backgroundColor: colorBg,
        borderWidth: 2,
        fill: true,
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 4,
      }],
    },
    options: {
      ...CHART_DEFAULTS,
      plugins: {
        ...CHART_DEFAULTS.plugins,
        tooltip: {
          ...CHART_DEFAULTS.plugins.tooltip,
          callbacks: {
            label: ctx => ` ${fmt(ctx.parsed.y)}`,
          },
        },
      },
    },
  });
}

// ---- SLOPE BAR CHART ----
function renderSlopeChart() {
  const yields = window.marketData.yields;
  const countries = Object.values(yields);
  const labels = countries.map(c => c.name);
  const slopes = countries.map(c => +(c.y10 - c.y2).toFixed(2));
  const colors = slopes.map(s => s > 0 ? '#367B35' : s < -0.1 ? '#EB5656' : '#eab308');

  destroyChart('slope-chart');
  const ctx = document.getElementById('slope-chart').getContext('2d');
  charts['slope-chart'] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data: slopes,
        backgroundColor: colors,
        borderRadius: 4,
        borderSkipped: false,
      }],
    },
    options: {
      ...CHART_DEFAULTS,
      plugins: {
        ...CHART_DEFAULTS.plugins,
        tooltip: {
          ...CHART_DEFAULTS.plugins.tooltip,
          callbacks: {
            label: ctx => ` ${ctx.parsed.y > 0 ? '+' : ''}${ctx.parsed.y} pb`,
          },
        },
      },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#7A9BAD', font: { size: 11 } } },
        y: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: { color: '#7A9BAD', font: { size: 10 }, callback: v => `${v > 0 ? '+' : ''}${v}` },
          position: 'right',
        },
      },
    },
  });
}

// ---- YIELD CURVE SHAPE CHART ----
function renderCurveChart(countryCode) {
  const y = window.marketData.yields[countryCode];
  if (!y) return;

  destroyChart('curve-chart');
  const ctx = document.getElementById('curve-chart').getContext('2d');
  charts['curve-chart'] = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['1A', '2A', '5A', '10A', '30A'],
      datasets: [{
        data: [y.y1, y.y2, y.y5, y.y10, y.y30],
        borderColor: '#0085CA',
        backgroundColor: 'rgba(0,133,202,0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#0085CA',
        pointRadius: 5,
        pointHoverRadius: 7,
      }],
    },
    options: {
      ...CHART_DEFAULTS,
      plugins: {
        ...CHART_DEFAULTS.plugins,
        tooltip: {
          ...CHART_DEFAULTS.plugins.tooltip,
          callbacks: { label: ctx => ` ${ctx.parsed.y.toFixed(2)}%` },
        },
      },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#7A9BAD' } },
        y: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: { color: '#7A9BAD', callback: v => `${v.toFixed(1)}%` },
          position: 'right',
        },
      },
    },
  });
}

// ---- CREDIT CHARTS ----
function renderCreditCharts() {
  const credit = window.marketData.credit;
  const usIg = credit.find(c => c.id === 'us_ig');
  const usHy = credit.find(c => c.id === 'us_hy');
  const cp = (typeof creditPeriod !== 'undefined') ? creditPeriod : '3M';

  // Ensure values are in basis points, then filter by period
  function toSeries(item, fallbackSpread) {
    if (item && item.dates && item.dates.length > 5 && item.values && item.values.length > 5) {
      const sample = item.values[item.values.length - 1];
      const vals = sample < 5 ? item.values.map(v => +(v * 100).toFixed(1)) : item.values;
      const filtered = filterByPeriod(item.dates, vals, cp);
      return { dates: filtered.dates, series: filtered.closes };
    }
    const gen = generateHistoricalSeries(fallbackSpread, 252, 0.015);
    const filtered = filterByPeriod(gen.dates, gen.series, cp);
    return { dates: filtered.dates, series: filtered.closes };
  }

  const igUS = toSeries(usIg, 98);
  const hyUS = toSeries(usHy, 312);

  const tooltipPb = { callbacks: { label: ctx => ` ${ctx.parsed.y.toFixed(0)} pb` } };
  const legendOpts = { display: true, labels: { color: '#2A5A72', font: { size: 11 } } };

  // IG chart
  destroyChart('ig-chart');
  charts['ig-chart'] = new Chart(document.getElementById('ig-chart').getContext('2d'), {
    type: 'line',
    data: {
      labels: igUS.dates.map(d => d.slice(5)),
      datasets: [
        { label: 'EEUU IG', data: igUS.series, borderColor: '#0085CA', backgroundColor: 'rgba(0,133,202,0.06)', borderWidth: 2, fill: true, pointRadius: 0, tension: 0.3 },
      ],
    },
    options: { ...CHART_DEFAULTS, plugins: { ...CHART_DEFAULTS.plugins, legend: legendOpts, tooltip: { ...CHART_DEFAULTS.plugins.tooltip, ...tooltipPb } } },
  });

  // HY chart
  destroyChart('hy-chart');
  charts['hy-chart'] = new Chart(document.getElementById('hy-chart').getContext('2d'), {
    type: 'line',
    data: {
      labels: hyUS.dates.map(d => d.slice(5)),
      datasets: [
        { label: 'EEUU HY', data: hyUS.series, borderColor: '#f97316', backgroundColor: 'rgba(249,115,22,0.06)', borderWidth: 2, fill: true, pointRadius: 0, tension: 0.3 },
      ],
    },
    options: { ...CHART_DEFAULTS, plugins: { ...CHART_DEFAULTS.plugins, legend: legendOpts, tooltip: { ...CHART_DEFAULTS.plugins.tooltip, ...tooltipPb } } },
  });

  // Diferencial HY - IG
  const minLen = Math.min(hyUS.series.length, igUS.series.length);
  const diffUS = hyUS.series.slice(0, minLen).map((v, i) => +(v - igUS.series[i]).toFixed(0));

  destroyChart('diff-chart');
  charts['diff-chart'] = new Chart(document.getElementById('diff-chart').getContext('2d'), {
    type: 'line',
    data: {
      labels: igUS.dates.slice(0, minLen).map(d => d.slice(5)),
      datasets: [
        { label: 'HY - IG EEUU', data: diffUS, borderColor: '#367B35', backgroundColor: 'rgba(54,123,53,0.06)', borderWidth: 2, fill: true, pointRadius: 0, tension: 0.3 },
      ],
    },
    options: { ...CHART_DEFAULTS, plugins: { ...CHART_DEFAULTS.plugins, legend: legendOpts, tooltip: { ...CHART_DEFAULTS.plugins.tooltip, ...tooltipPb } } },
  });
}

// ---- FOREX CHARTS ----
function renderForexCharts() {
  const eurusd = window.marketData.forex['eurusd'];
  const dxy = window.marketData.forex['dxy'];

  if (eurusd && eurusd.dates.length) {
    const { dates, closes } = filterByPeriod(eurusd.dates, eurusd.closes, '3M');
    destroyChart('eurusd-chart');
    charts['eurusd-chart'] = new Chart(document.getElementById('eurusd-chart').getContext('2d'), {
      type: 'line',
      data: {
        labels: dates.map(d => d.slice(5)),
        datasets: [{ data: closes, borderColor: '#0085CA', backgroundColor: 'rgba(59,130,246,0.06)', borderWidth: 2, fill: true, tension: 0.3, pointRadius: 0 }],
      },
      options: { ...CHART_DEFAULTS, plugins: { ...CHART_DEFAULTS.plugins, tooltip: { ...CHART_DEFAULTS.plugins.tooltip, callbacks: { label: ctx => ` ${ctx.parsed.y.toFixed(4)}` } } } },
    });
  }

  if (dxy && dxy.dates.length) {
    const { dates, closes } = filterByPeriod(dxy.dates, dxy.closes, '3M');
    destroyChart('dxy-chart');
    charts['dxy-chart'] = new Chart(document.getElementById('dxy-chart').getContext('2d'), {
      type: 'line',
      data: {
        labels: dates.map(d => d.slice(5)),
        datasets: [{ data: closes, borderColor: '#f97316', backgroundColor: 'rgba(249,115,22,0.06)', borderWidth: 2, fill: true, tension: 0.3, pointRadius: 0 }],
      },
      options: { ...CHART_DEFAULTS },
    });
  }
}

// ---- COMMODITY CHARTS ----
function renderCommodityCharts() {
  const energy = window.marketData.commodities.energy || [];
  const precious = window.marketData.commodities.precious || [];
  const industrial = window.marketData.commodities.industrial || [];

  // Filter by period FIRST, then rebase to 100 from the first point of that period
  function periodIndexed(item, period) {
    const { dates, closes } = filterByPeriod(item.dates || [], item.closes || [], period);
    if (!closes || closes.length === 0) return { dates: [], series: [] };
    const base = closes[0];
    return {
      dates,
      series: closes.map(c => +(c / base * 100).toFixed(2)),
    };
  }

  const energyColors = ['#0085CA', '#f97316', '#eab308'];
  const metalColors = ['#f59e0b', '#9ca3af', '#EB5656', '#06b6d4', '#a855f7'];

  var cp = (typeof commPeriod !== 'undefined') ? commPeriod : '3M';

  // Energy
  if (energy.length) {
    const refData = periodIndexed(energy[0], cp);
    destroyChart('energy-chart');
    charts['energy-chart'] = new Chart(document.getElementById('energy-chart').getContext('2d'), {
      type: 'line',
      data: {
        labels: refData.dates.map(d => d.slice(5)),
        datasets: energy.map((item, i) => {
          const pd = periodIndexed(item, cp);
          return {
            label: item.name,
            data: pd.series,
            borderColor: energyColors[i] || '#fff',
            borderWidth: 1.5,
            pointRadius: 0,
            tension: 0.3,
          };
        }),
      },
      options: { ...CHART_DEFAULTS, plugins: { ...CHART_DEFAULTS.plugins, legend: { display: true, labels: { color: '#2A5A72', font: { size: 11 } } } } },
    });
  }

  // Metals
  const allMetals = [...precious, ...industrial];
  if (allMetals.length) {
    const refData = periodIndexed(allMetals[0], cp);
    destroyChart('metals-chart');
    charts['metals-chart'] = new Chart(document.getElementById('metals-chart').getContext('2d'), {
      type: 'line',
      data: {
        labels: refData.dates.map(d => d.slice(5)),
        datasets: allMetals.map((item, i) => {
          const pd = periodIndexed(item, cp);
          return {
            label: item.name,
            data: pd.series,
            borderColor: metalColors[i] || '#fff',
            borderWidth: 1.5,
            pointRadius: 0,
            tension: 0.3,
          };
        }),
      },
      options: { ...CHART_DEFAULTS, plugins: { ...CHART_DEFAULTS.plugins, legend: { display: true, labels: { color: '#2A5A72', font: { size: 11 } } } } },
    });
  }
}

// ---- YIELD 10Y HISTORY CHART ----
let yield10yPeriod = '3M';
let selectedYield10yCountry = 'all';
let yield10yData = {}; // cache of real FRED data

async function loadYield10yData() {
  if (Object.keys(yield10yData).length > 0) return; // already loaded
  try {
    const res = await fetch('https://market-api-ah0l.onrender.com/api/yields10y', { signal: AbortSignal.timeout(20000) });
    if (res.ok) {
      yield10yData = await res.json();
      console.log('yields10y loaded:', Object.keys(yield10yData));
    }
  } catch (e) {
    console.warn('yields10y failed:', e.message);
  }
}

function getYield10ySeries(countryCode, period) {
  const yields = window.marketData.yields;
  const real = yield10yData[countryCode];

  let dates, values;

  if (real && real.dates && real.dates.length > 10) {
    dates  = real.dates;
    values = real.values;
  } else {
    // Fallback: generate from current value
    const y = yields[countryCode];
    const current = y ? y.y10 : 3.0;
    const volMap = { US:0.008, DE:0.007, FR:0.007, IT:0.010, ES:0.009, UK:0.008, JP:0.004 };
    const vol = volMap[countryCode] || 0.008;
    const gen = generateHistoricalSeries(current * 0.95, 756, vol * 3);
    const scale = current / gen.series[gen.series.length - 1];
    dates  = gen.dates;
    values = gen.series.map(v => +(v * scale).toFixed(3));
  }

  // Filter by period
  const filtered = filterByPeriod(dates, values, period === '3Y' ? null : period);
  if (period === '3Y') {
    const cutoff = new Date(); cutoff.setFullYear(cutoff.getFullYear() - 3);
    const pairs = dates.map((d,i) => ({d, v: values[i]})).filter(p => new Date(p.d) >= cutoff);
    return { dates: pairs.map(p=>p.d), closes: pairs.map(p=>p.v) };
  }
  return filtered;
}

async function renderYield10yChart(period) {
  yield10yPeriod = period || yield10yPeriod;
  const yields = window.marketData.yields;
  if (!yields || !Object.keys(yields).length) return;

  // Load real data if not yet cached
  await loadYield10yData();

  // Build tabs if not done yet
  const tabsEl = document.getElementById('yield10y-country-tabs');
  if (tabsEl && tabsEl.children.length === 0) {
    tabsEl.innerHTML =
      `<button class="curve-tab active" onclick="selectYield10yCountry('all',this)">Todos</button>` +
      Object.entries(yields).map(([code, y]) =>
        `<button class="curve-tab" onclick="selectYield10yCountry('${code}',this)">${y.flag} ${y.name}</button>`
      ).join('');
  }

  const colors = { US:'#0085CA', DE:'#367B35', FR:'#3b82f6', IT:'#EB5656', ES:'#f97316', UK:'#a855f7', JP:'#eab308' };
  let datasets = [], labels = [];

  if (selectedYield10yCountry === 'all') {
    Object.keys(yields).forEach(code => {
      const { dates, closes } = getYield10ySeries(code, yield10yPeriod);
      if (!labels.length) labels = dates.map(d => d.slice(5));
      datasets.push({
        label: yields[code].flag + ' ' + yields[code].name,
        data: closes,
        borderColor: colors[code] || '#888',
        borderWidth: 1.5,
        pointRadius: 0,
        tension: 0.3,
      });
    });
  } else {
    const { dates, closes } = getYield10ySeries(selectedYield10yCountry, yield10yPeriod);
    labels = dates.map(d => d.slice(5));
    datasets.push({
      label: yields[selectedYield10yCountry]?.flag + ' ' + yields[selectedYield10yCountry]?.name + ' 10Y',
      data: closes,
      borderColor: colors[selectedYield10yCountry] || '#0085CA',
      backgroundColor: (colors[selectedYield10yCountry] || '#0085CA') + '15',
      borderWidth: 2,
      fill: true,
      pointRadius: 0,
      tension: 0.3,
    });
  }

  destroyChart('yield10y-chart');
  const ctx = document.getElementById('yield10y-chart');
  if (!ctx) return;
  charts['yield10y-chart'] = new Chart(ctx.getContext('2d'), {
    type: 'line',
    data: { labels, datasets },
    options: {
      ...CHART_DEFAULTS,
      plugins: {
        ...CHART_DEFAULTS.plugins,
        legend: { display: true, labels: { color: '#2A5A72', font: { size: 10 } } },
        tooltip: {
          ...CHART_DEFAULTS.plugins.tooltip,
          callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)}%` },
        },
      },
      scales: {
        x: { grid: { color: 'rgba(6,45,63,0.06)' }, ticks: { color: '#7A9BAD', font: { size: 10 }, maxTicksLimit: 8 } },
        y: {
          grid: { color: 'rgba(6,45,63,0.06)' },
          ticks: { color: '#7A9BAD', font: { size: 10 }, callback: v => v.toFixed(2) + '%' },
          position: 'right',
        },
      },
    },
  });
}

function selectYield10yCountry(code, btn) {
  selectedYield10yCountry = code;
  document.querySelectorAll('#yield10y-country-tabs .curve-tab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderYield10yChart(yield10yPeriod);
}

function setYield10yPeriod(period, btn) {
  yield10yPeriod = period;
  document.querySelectorAll('.yield10y-period-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderYield10yChart(period);
}


// ---- CREDIT PERIOD FILTER ----
let creditPeriod = '1W';

function setCreditPeriod(period, btn) {
  creditPeriod = period;
  document.querySelectorAll('.credit-period-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderCreditCharts();
}
