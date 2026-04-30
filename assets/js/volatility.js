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

      '<div class="vol-range-bar">' +
        renderVolBar(v) +
      '</div>' +
    '</div>';
  }).join('');

  document.getElementById('vol-cards').innerHTML = cardsHTML;

  // Render all 4 charts
  renderVolCharts();
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

var CHART_OPTS = {
  responsive: true, maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#062D3F', borderColor: '#0085CA', borderWidth: 1,
      titleColor: '#C8DAE2', bodyColor: '#F3F3F3', padding: 10,
      callbacks: { label: function(ctx) { return ' ' + ctx.parsed.y.toFixed(2); } }
    }
  },
  scales: {
    x: { grid: { color: 'rgba(6,45,63,0.06)' }, ticks: { color: '#7A9BAD', font: { size: 10 }, maxTicksLimit: 8 } },
    y: { grid: { color: 'rgba(6,45,63,0.06)' }, ticks: { color: '#7A9BAD', font: { size: 10 } }, position: 'right' }
  }
};

function makeVolChart(canvasId, labels, datasets) {
  if (volCharts[canvasId]) { volCharts[canvasId].destroy(); delete volCharts[canvasId]; }
  var ctx = document.getElementById(canvasId);
  if (!ctx) return;
  volCharts[canvasId] = new Chart(ctx.getContext('2d'), {
    type: 'line',
    data: { labels: labels, datasets: datasets },
    options: JSON.parse(JSON.stringify(CHART_OPTS))
  });
}

function renderVolChart(volId) {}

function renderVolCharts() {
  var volData = window.marketData.volatility;
  if (!volData) return;

  var vix    = volData['vix'];
  var vstoxx = volData['vstoxx'];
  var move   = volData['move'];

  // 1. VIX chart
  if (vix && vix.dates.length) {
    var refN = new Array(vix.dates.length).fill(vix.refs.normal);
    var refE = new Array(vix.dates.length).fill(vix.refs.elevated);
    makeVolChart('vol-vix-chart',
      vix.dates.map(function(d){ return d.slice(5); }),
      [
        { label: 'VIX', data: vix.closes, borderColor: '#0085CA', backgroundColor: '#0085CA18', borderWidth: 2, fill: true, tension: 0.3, pointRadius: 0 },
        { label: 'Normal (' + vix.refs.normal + ')', data: refN, borderColor: '#0085CA55', borderWidth: 1, borderDash: [4,4], pointRadius: 0, fill: false },
        { label: 'Elevado (' + vix.refs.elevated + ')', data: refE, borderColor: '#E67E2255', borderWidth: 1, borderDash: [4,4], pointRadius: 0, fill: false },
      ]
    );
    volCharts['vol-vix-chart'].options.plugins.legend = { display: true, labels: { color: '#2A5A72', font: { size: 10 } } };
    volCharts['vol-vix-chart'].update();
  }

  // 2. VSTOXX chart
  if (vstoxx && vstoxx.dates.length) {
    var refNs = new Array(vstoxx.dates.length).fill(vstoxx.refs.normal);
    var refEs = new Array(vstoxx.dates.length).fill(vstoxx.refs.elevated);
    makeVolChart('vol-vstoxx-chart',
      vstoxx.dates.map(function(d){ return d.slice(5); }),
      [
        { label: 'VSTOXX', data: vstoxx.closes, borderColor: '#EB5656', backgroundColor: '#EB565618', borderWidth: 2, fill: true, tension: 0.3, pointRadius: 0 },
        { label: 'Normal (' + vstoxx.refs.normal + ')', data: refNs, borderColor: '#EB565655', borderWidth: 1, borderDash: [4,4], pointRadius: 0, fill: false },
        { label: 'Elevado (' + vstoxx.refs.elevated + ')', data: refEs, borderColor: '#E67E2255', borderWidth: 1, borderDash: [4,4], pointRadius: 0, fill: false },
      ]
    );
    volCharts['vol-vstoxx-chart'].options.plugins.legend = { display: true, labels: { color: '#2A5A72', font: { size: 10 } } };
    volCharts['vol-vstoxx-chart'].update();
  }

  // 3. Differential VIX - VSTOXX
  if (vix && vstoxx && vix.dates.length && vstoxx.dates.length) {
    var mapV = {}, mapS = {};
    vix.dates.forEach(function(d,i){ if(vix.closes[i]) mapV[d] = vix.closes[i]; });
    vstoxx.dates.forEach(function(d,i){ if(vstoxx.closes[i]) mapS[d] = vstoxx.closes[i]; });
    var common = Object.keys(mapV).filter(function(d){ return mapS[d]; }).sort();
    var diff = common.map(function(d){ return +(mapV[d] - mapS[d]).toFixed(2); });
    var diffColors = diff.map(function(v){ return v >= 0 ? '#0085CA' : '#EB5656'; });
    var zeroLine = new Array(common.length).fill(0);

    makeVolChart('vol-diff-chart',
      common.map(function(d){ return d.slice(5); }),
      [
        { label: 'Dif. VIX-VSTOXX', data: diff, borderColor: '#0085CA', backgroundColor: diff.map(function(v){ return v >= 0 ? '#0085CA22' : '#EB565622'; }), borderWidth: 2, fill: true, tension: 0.3, pointRadius: 0 },
        { label: '', data: zeroLine, borderColor: '#7A9BAD55', borderWidth: 1, borderDash: [3,3], pointRadius: 0, fill: false },
      ]
    );
  }

  // 4. MOVE chart
  if (move && move.dates.length) {
    var refNm = new Array(move.dates.length).fill(move.refs.normal);
    var refEm = new Array(move.dates.length).fill(move.refs.elevated);
    makeVolChart('vol-move-chart',
      move.dates.map(function(d){ return d.slice(5); }),
      [
        { label: 'MOVE', data: move.closes, borderColor: '#72C971', backgroundColor: '#72C97118', borderWidth: 2, fill: true, tension: 0.3, pointRadius: 0 },
        { label: 'Normal (' + move.refs.normal + ')', data: refNm, borderColor: '#72C97155', borderWidth: 1, borderDash: [4,4], pointRadius: 0, fill: false },
        { label: 'Elevado (' + move.refs.elevated + ')', data: refEm, borderColor: '#E67E2255', borderWidth: 1, borderDash: [4,4], pointRadius: 0, fill: false },
      ]
    );
    volCharts['vol-move-chart'].options.plugins.legend = { display: true, labels: { color: '#2A5A72', font: { size: 10 } } };
    volCharts['vol-move-chart'].update();
  }
}
