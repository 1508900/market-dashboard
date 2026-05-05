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

  // Ensure values are in basis points
  function toSeries(item, fallbackSpread) {
    if (item && item.dates && item.dates.length > 5 && item.values && item.values.length > 5) {
      const sample = item.values[item.values.length - 1];
      const vals = sample < 5 ? item.values.map(v => +(v * 100).toFixed(1)) : item.values;
      return { dates: item.dates, series: vals };
    }
    const gen = generateHistoricalSeries(fallbackSpread, 252, 0.015);
    return { dates: gen.dates, series: gen.series };
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
