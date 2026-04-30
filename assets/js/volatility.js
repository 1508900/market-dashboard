/* ============================================================
   VOLATILITY.JS — VIX, VSTOXX, MOVE
   ============================================================ */

function getVolZoneLabel(zone) {
  var map = {
    low:      { label: 'Complacencia',    color: '#72C971', bg: '#C6F3C6' },
    normal:   { label: 'Normal',          color: '#0085CA', bg: '#E3F2FD' },
    elevated: { label: 'Elevada',         color: '#E67E22', bg: '#FFF3E0' },
    extreme:  { label: 'Extrema',         color: '#EB5656', bg: '#FDEAEA' },
    crisis:   { label: 'Crisis',          color: '#8B0000', bg: '#FDEAEA' },
  };
  return map[zone] || map['normal'];
}

function renderVolatility() {
  var volData = window.marketData.volatility;
  if (!volData || Object.keys(volData).length === 0) {
    document.getElementById('vol-cards').innerHTML = '<div class="loading"><div class="pulse"></div>Cargando datos de volatilidad...</div>';
    return;
  }

  // Render cards
  var cardsHTML = Object.values(volData).map(function(v) {
    var zone = getVolZoneLabel(v.zone);
    var chgCls = v.change >= 0 ? 'neg' : 'pos'; // vol up = bad
    var ytdLabel = v.ytd != null ? (v.ytd >= 0 ? '+' : '') + v.ytd.toFixed(2) + '%' : '—';
    var ytdCls = v.ytd != null ? (v.ytd >= 0 ? 'neg' : 'pos') : 'neutral';

    return '<div class="vol-card" onclick="renderVolChart(\'' + v.id + '\')">' +
      '<div class="vol-header">' +
        '<div>' +
          '<div class="vol-name">' + v.name + '</div>' +
          '<div class="vol-market">' + v.market + '</div>' +
        '</div>' +
        '<span class="vol-zone-badge" style="background:' + zone.bg + ';color:' + zone.color + '">' + zone.label + '</span>' +
      '</div>' +
      '<div class="vol-price">' + v.price.toFixed(2) + '</div>' +
      '<div class="vol-desc">' + v.desc + '</div>' +
      '<div class="vol-stats">' +
        '<span class="' + chgCls + '">Hoy: ' + (v.change >= 0 ? '+' : '') + v.change.toFixed(2) + '%</span>' +
        '<span class="' + ytdCls + '">YTD: ' + ytdLabel + '</span>' +
      '</div>' +
      '<div class="vol-range-bar">' +
        renderVolBar(v) +
      '</div>' +
    '</div>';
  }).join('');

  document.getElementById('vol-cards').innerHTML = cardsHTML;

  // Render combined chart
  renderVolChart(Object.keys(volData)[0]);
  renderVolComparison();
}

function renderVolBar(v) {
  // Show current level vs reference zones
  var r = v.refs;
  var max = r.extreme * 1.3;
  var pct = Math.min(100, (v.price / max) * 100);
  var color = getVolZoneLabel(v.zone).color;

  return '<div class="vol-bar-labels">' +
    '<span>' + r.low + '</span>' +
    '<span>' + r.normal + '</span>' +
    '<span>' + r.elevated + '</span>' +
    '<span>' + r.extreme + '</span>' +
  '</div>' +
  '<div class="vol-bar-track">' +
    '<div class="vol-bar-zones">' +
      '<div style="width:' + (r.low/max*100) + '%;background:#C6F3C6"></div>' +
      '<div style="width:' + ((r.normal-r.low)/max*100) + '%;background:#E3F2FD"></div>' +
      '<div style="width:' + ((r.elevated-r.normal)/max*100) + '%;background:#FFF3E0"></div>' +
      '<div style="width:' + ((r.extreme-r.elevated)/max*100) + '%;background:#FDEAEA"></div>' +
    '</div>' +
    '<div class="vol-bar-needle" style="left:' + pct.toFixed(1) + '%;background:' + color + '"></div>' +
  '</div>';
}

var volCharts = {};

function renderVolChart(volId) {
  var v = window.marketData.volatility ? window.marketData.volatility[volId] : null;
  if (!v || !v.dates || !v.dates.length) return;

  // Highlight selected card
  document.querySelectorAll('.vol-card').forEach(function(c) { c.classList.remove('selected'); });
  var cards = document.querySelectorAll('.vol-card');
  var volKeys = Object.keys(window.marketData.volatility);
  var idx = volKeys.indexOf(volId);
  if (cards[idx]) cards[idx].classList.add('selected');

  var zone = getVolZoneLabel(v.zone);
  var titleEl = document.getElementById('vol-chart-title');
  if (titleEl) titleEl.textContent = v.name + ' — Evolución 3 meses · Nivel actual: ' + v.price.toFixed(2);

  if (volCharts['main']) { volCharts['main'].destroy(); delete volCharts['main']; }
  var ctx = document.getElementById('vol-main-chart');
  if (!ctx) return;

  // Add reference lines as annotations data
  var refNormal   = new Array(v.dates.length).fill(v.refs.normal);
  var refElevated = new Array(v.dates.length).fill(v.refs.elevated);

  volCharts['main'] = new Chart(ctx.getContext('2d'), {
    type: 'line',
    data: {
      labels: v.dates.map(function(d) { return d.slice(5); }),
      datasets: [
        {
          label: v.name,
          data: v.closes,
          borderColor: zone.color,
          backgroundColor: zone.color + '18',
          borderWidth: 2, fill: true, tension: 0.3, pointRadius: 0,
        },
        {
          label: 'Zona normal (' + v.refs.normal + ')',
          data: refNormal,
          borderColor: '#0085CA66', borderWidth: 1,
          borderDash: [4,4], pointRadius: 0, fill: false,
        },
        {
          label: 'Zona elevada (' + v.refs.elevated + ')',
          data: refElevated,
          borderColor: '#E67E2266', borderWidth: 1,
          borderDash: [4,4], pointRadius: 0, fill: false,
        },
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: true, labels: { color: '#2A5A72', font: { size: 11 } } },
        tooltip: {
          backgroundColor: '#062D3F', borderColor: '#0085CA', borderWidth: 1,
          titleColor: '#C8DAE2', bodyColor: '#F3F3F3', padding: 10,
          callbacks: { label: function(ctx) { return ' ' + ctx.dataset.label + ': ' + ctx.parsed.y.toFixed(2); } }
        }
      },
      scales: {
        x: { grid: { color: 'rgba(6,45,63,0.06)' }, ticks: { color: '#7A9BAD', font: { size: 10 }, maxTicksLimit: 8 } },
        y: { grid: { color: 'rgba(6,45,63,0.06)' }, ticks: { color: '#7A9BAD', font: { size: 10 } }, position: 'right' }
      }
    }
  });
}

function renderVolComparison() {
  var volData = window.marketData.volatility;
  if (!volData) return;

  var vix = volData['vix'];
  var vstoxx = volData['vstoxx'];
  if (!vix || !vstoxx) return;

  // Align dates
  var mapV = {}, mapS = {};
  (vix.dates||[]).forEach(function(d,i){ if(vix.closes[i]) mapV[d] = vix.closes[i]; });
  (vstoxx.dates||[]).forEach(function(d,i){ if(vstoxx.closes[i]) mapS[d] = vstoxx.closes[i]; });
  var common = Object.keys(mapV).filter(function(d){ return mapS[d]; }).sort().slice(-60);

  if (volCharts['comparison']) { volCharts['comparison'].destroy(); delete volCharts['comparison']; }
  var ctx = document.getElementById('vol-comparison-chart');
  if (!ctx) return;

  volCharts['comparison'] = new Chart(ctx.getContext('2d'), {
    type: 'line',
    data: {
      labels: common.map(function(d){ return d.slice(5); }),
      datasets: [
        {
          label: 'VIX', data: common.map(function(d){ return mapV[d]; }),
          borderColor: '#0085CA', borderWidth: 2, pointRadius: 0, tension: 0.3,
        },
        {
          label: 'VSTOXX', data: common.map(function(d){ return mapS[d]; }),
          borderColor: '#EB5656', borderWidth: 2, pointRadius: 0, tension: 0.3,
        },
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: true, labels: { color: '#2A5A72', font: { size: 11 } } },
        tooltip: {
          backgroundColor: '#062D3F', borderColor: '#0085CA', borderWidth: 1,
          titleColor: '#C8DAE2', bodyColor: '#F3F3F3', padding: 10,
        }
      },
      scales: {
        x: { grid: { color: 'rgba(6,45,63,0.06)' }, ticks: { color: '#7A9BAD', font: { size: 10 }, maxTicksLimit: 8 } },
        y: { grid: { color: 'rgba(6,45,63,0.06)' }, ticks: { color: '#7A9BAD', font: { size: 10 } }, position: 'right' }
      }
    }
  });
}
