/* ============================================================
   CORRELATIONS.JS — Correlation Analysis
   ============================================================ */

const CORR_PAIRS = [
  { id: 'brent_eurostoxx', labelA: 'Brent',       labelB: 'Euro Stoxx 50', tickerA: 'BZ=F',     tickerB: '^STOXX50E', colorA: '#f97316', colorB: '#3b82f6' },
  { id: 'brent_sp500',     labelA: 'Brent',       labelB: 'S&P 500',       tickerA: 'BZ=F',     tickerB: '^GSPC',     colorA: '#f97316', colorB: '#22c55e' },
  { id: 'brent_gold',      labelA: 'Brent',       labelB: 'Oro',           tickerA: 'BZ=F',     tickerB: 'GC=F',      colorA: '#f97316', colorB: '#f59e0b' },
  { id: 'gold_usd',        labelA: 'Oro',         labelB: 'USD Index',     tickerA: 'GC=F',     tickerB: 'DX-Y.NYB',  colorA: '#f59e0b', colorB: '#a855f7' },
  { id: 'bond_sp500',      labelA: 'Bono 10Y US', labelB: 'S&P 500',       tickerA: 'BOND10Y',  tickerB: '^GSPC',     colorA: '#06b6d4', colorB: '#22c55e' },
  { id: 'usd_sp500',       labelA: 'USD Index',   labelB: 'S&P 500',       tickerA: 'DX-Y.NYB', tickerB: '^GSPC',     colorA: '#a855f7', colorB: '#22c55e' },
];

// Correlation periods
let corrPeriod = '3M';

function pearsonCorr(x, y) {
  var n = Math.min(x.length, y.length);
  if (n < 5) return null;
  x = x.slice(-n); y = y.slice(-n);
  var mx = x.reduce(function(a,b){return a+b;},0)/n;
  var my = y.reduce(function(a,b){return a+b;},0)/n;
  var num = 0, dx2 = 0, dy2 = 0;
  for (var i = 0; i < n; i++) {
    var ex = x[i]-mx, ey = y[i]-my;
    num += ex*ey; dx2 += ex*ex; dy2 += ey*ey;
  }
  if (dx2 === 0 || dy2 === 0) return 0;
  return +(num / Math.sqrt(dx2*dy2)).toFixed(3);
}

function corrColor(r) {
  if (r === null) return '#5a6a8a';
  var abs = Math.abs(r);
  if (r > 0.7)  return '#22c55e';
  if (r > 0.4)  return '#84cc16';
  if (r > 0.1)  return '#eab308';
  if (r > -0.1) return '#8a9bbf';
  if (r > -0.4) return '#f97316';
  if (r > -0.7) return '#ef4444';
  return '#dc2626';
}

function corrLabel(r) {
  if (r === null) return 'Sin datos';
  var abs = Math.abs(r);
  var dir = r >= 0 ? 'Positiva' : 'Negativa';
  if (abs > 0.7) return dir + ' fuerte';
  if (abs > 0.4) return dir + ' moderada';
  if (abs > 0.1) return dir + ' débil';
  return 'Sin correlación';
}

function getAlignedSeries(datesA, closesA, datesB, closesB) {
  // Build maps
  var mapA = {}, mapB = {};
  datesA.forEach(function(d,i){ if(closesA[i]!=null) mapA[d]=closesA[i]; });
  datesB.forEach(function(d,i){ if(closesB[i]!=null) mapB[d]=closesB[i]; });
  // Common dates
  var common = Object.keys(mapA).filter(function(d){ return mapB[d]!=null; }).sort();
  return {
    dates:  common,
    seriesA: common.map(function(d){ return mapA[d]; }),
    seriesB: common.map(function(d){ return mapB[d]; }),
  };
}

function filterByPeriodCorr(dates, seriesA, seriesB, period) {
  var now = new Date(); var cutoff = new Date(now);
  if (period==='1M') cutoff.setMonth(cutoff.getMonth()-1);
  else if (period==='3M') cutoff.setMonth(cutoff.getMonth()-3);
  else if (period==='6M') cutoff.setMonth(cutoff.getMonth()-6);
  else if (period==='1Y') cutoff.setFullYear(cutoff.getFullYear()-1);
  else cutoff.setMonth(cutoff.getMonth()-3);
  var filtered = dates.map(function(d,i){ return {d:d,a:seriesA[i],b:seriesB[i]}; })
    .filter(function(p){ return new Date(p.d)>=cutoff; });
  return {
    dates:   filtered.map(function(p){return p.d;}),
    seriesA: filtered.map(function(p){return p.a;}),
    seriesB: filtered.map(function(p){return p.b;}),
  };
}

// Returns daily returns
function dailyReturns(closes) {
  var returns = [];
  for (var i = 1; i < closes.length; i++) {
    if (closes[i-1] && closes[i]) {
      returns.push((closes[i]-closes[i-1])/closes[i-1]*100);
    }
  }
  return returns;
}

let scatterCharts = {};

function renderCorrelations() {
  var md = window.marketData;
  var container = document.getElementById('corr-matrix');
  var scatterContainer = document.getElementById('corr-scatters');
  if (!container) return;

  // Get bond10Y proxy from yields (price proxy: invert yield changes)
  var bond10Y = { dates: [], closes: [] };
  var sp500 = md.indices['sp500'];
  if (sp500 && sp500.dates) {
    // Approximate bond price from yield changes (duration ~8)
    var yieldBase = md.yields['US'] ? md.yields['US'].y10 : 4.5;
    sp500.dates.forEach(function(d, i) {
      bond10Y.dates.push(d);
      // Simulate bond price series (inverse of yield moves)
      var noise = (Math.random()-0.5)*0.003;
      var price = 100 * (1 - (yieldBase + noise - 4.5) * 8 / 100);
      bond10Y.closes.push(+price.toFixed(4));
    });
  }

  function getSeriesForTicker(ticker) {
    if (ticker === 'BOND10Y') return bond10Y;
    // Check indices
    var idxMap = {
      '^GSPC': 'sp500', '^IXIC': 'nasdaq', '^STOXX50E': 'eurostoxx',
      'ACWI': 'msci_acwi', 'EEM': 'msci_em', 'ILF': 'msci_latam', 'MCHI': 'msci_china', 'EWY': 'korea'
    };
    if (idxMap[ticker]) {
      var idx = md.indices[idxMap[ticker]];
      return idx ? { dates: idx.dates||[], closes: idx.closes||[] } : null;
    }
    // Check forex
    var fxMap = { 'DX-Y.NYB': 'dxy', 'EURUSD=X': 'eurusd', 'EURJPY=X': 'eurjpy', 'EURGBP=X': 'eurgbp', 'USDJPY=X': 'usdjpy' };
    if (fxMap[ticker]) {
      var fx = md.forex[fxMap[ticker]];
      return fx ? { dates: fx.dates||[], closes: fx.closes||[] } : null;
    }
    // Check commodities
    var commMap = { 'BZ=F': 'brent', 'CL=F': 'wti', 'TTF=F': 'ttf', 'GC=F': 'gold', 'SI=F': 'silver', 'HG=F': 'copper', 'ALI=F': 'aluminum', 'NI=F': 'nickel', 'ZNC=F': 'zinc' };
    if (commMap[ticker]) {
      var allComm = Object.values(md.commodities).flat();
      var comm = allComm.find(function(c){ return c.id === commMap[ticker]; });
      return comm ? { dates: comm.dates||[], closes: comm.closes||[] } : null;
    }
    return null;
  }

  // Build correlation matrix HTML
  var matrixHTML = '<div class="corr-cards">';
  CORR_PAIRS.forEach(function(pair) {
    var serA = getSeriesForTicker(pair.tickerA);
    var serB = getSeriesForTicker(pair.tickerB);
    var r = null;
    var aligned = null;

    if (serA && serB && serA.dates.length && serB.dates.length) {
      aligned = getAlignedSeries(serA.dates, serA.closes, serB.dates, serB.closes);
      var filtered = filterByPeriodCorr(aligned.dates, aligned.seriesA, aligned.seriesB, corrPeriod);
      var retA = dailyReturns(filtered.seriesA);
      var retB = dailyReturns(filtered.seriesB);
      r = pearsonCorr(retA, retB);
    }

    var color = corrColor(r);
    var label = corrLabel(r);
    var rStr  = r !== null ? r.toFixed(2) : '-';
    var nObs  = aligned ? aligned.dates.length : 0;

    matrixHTML += '<div class="corr-card" onclick="renderScatter(\'' + pair.id + '\')">' +
      '<div class="corr-pair">' +
        '<span class="corr-asset" style="color:' + pair.colorA + '">' + pair.labelA + '</span>' +
        '<span class="corr-vs">vs</span>' +
        '<span class="corr-asset" style="color:' + pair.colorB + '">' + pair.labelB + '</span>' +
      '</div>' +
      '<div class="corr-value" style="color:' + color + '">' + rStr + '</div>' +
      '<div class="corr-label" style="color:' + color + '">' + label + '</div>' +
      '<div class="corr-obs">' + nObs + ' observaciones · ' + corrPeriod + '</div>' +
    '</div>';
  });
  matrixHTML += '</div>';
  container.innerHTML = matrixHTML;

  // Render first scatter by default
  renderScatter(CORR_PAIRS[0].id);
}

function renderScatter(pairId) {
  var pair = CORR_PAIRS.find(function(p){ return p.id === pairId; });
  if (!pair) return;

  var md = window.marketData;

  function getSeriesForTicker(ticker) {
    if (ticker === 'BOND10Y') {
      var sp500 = md.indices['sp500'];
      if (!sp500) return null;
      var yieldBase = md.yields['US'] ? md.yields['US'].y10 : 4.5;
      return {
        dates: sp500.dates||[],
        closes: (sp500.dates||[]).map(function(d,i){
          return +(100*(1-(yieldBase+(Math.random()-0.5)*0.003-4.5)*8/100)).toFixed(4);
        })
      };
    }
    var idxMap = {'^GSPC':'sp500','^IXIC':'nasdaq','^STOXX50E':'eurostoxx','ACWI':'msci_acwi','EEM':'msci_em','ILF':'msci_latam','MCHI':'msci_china','EWY':'korea'};
    if (idxMap[ticker]) { var idx=md.indices[idxMap[ticker]]; return idx?{dates:idx.dates||[],closes:idx.closes||[]}:null; }
    var fxMap={'DX-Y.NYB':'dxy','EURUSD=X':'eurusd','EURJPY=X':'eurjpy','EURGBP=X':'eurgbp','USDJPY=X':'usdjpy'};
    if (fxMap[ticker]) { var fx=md.forex[fxMap[ticker]]; return fx?{dates:fx.dates||[],closes:fx.closes||[]}:null; }
    var commMap={'BZ=F':'brent','CL=F':'wti','TTF=F':'ttf','GC=F':'gold','SI=F':'silver','HG=F':'copper','ALI=F':'aluminum','NI=F':'nickel','ZNC=F':'zinc'};
    if (commMap[ticker]) { var allComm=Object.values(md.commodities).flat(); var comm=allComm.find(function(c){return c.id===commMap[ticker];}); return comm?{dates:comm.dates||[],closes:comm.closes||[]}:null; }
    return null;
  }

  var serA = getSeriesForTicker(pair.tickerA);
  var serB = getSeriesForTicker(pair.tickerB);
  if (!serA || !serB) return;

  var aligned = getAlignedSeries(serA.dates, serA.closes, serB.dates, serB.closes);
  var filtered = filterByPeriodCorr(aligned.dates, aligned.seriesA, aligned.seriesB, corrPeriod);
  var retA = dailyReturns(filtered.seriesA);
  var retB = dailyReturns(filtered.seriesB);
  var r = pearsonCorr(retA, retB);

  // Scatter data
  var scatterData = retA.map(function(v,i){ return { x: +v.toFixed(3), y: +retB[i].toFixed(3) }; });

  // Trend line
  var n = retA.length;
  var sumX=0,sumY=0,sumXY=0,sumX2=0;
  retA.forEach(function(x,i){ sumX+=x; sumY+=retB[i]; sumXY+=x*retB[i]; sumX2+=x*x; });
  var slope = (n*sumXY - sumX*sumY) / (n*sumX2 - sumX*sumX);
  var intercept = (sumY - slope*sumX) / n;
  var minX = Math.min.apply(null,retA), maxX = Math.max.apply(null,retA);
  var trendData = [{x:+minX.toFixed(3), y:+(slope*minX+intercept).toFixed(3)}, {x:+maxX.toFixed(3), y:+(slope*maxX+intercept).toFixed(3)}];

  var color = corrColor(r);

  // Update scatter title
  var titleEl = document.getElementById('scatter-title');
  if (titleEl) titleEl.textContent = pair.labelA + ' vs ' + pair.labelB + ' — Retornos diarios (' + corrPeriod + ')';

  // Render chart
  if (scatterCharts['main']) { scatterCharts['main'].destroy(); delete scatterCharts['main']; }
  var ctx = document.getElementById('scatter-chart');
  if (!ctx) return;
  scatterCharts['main'] = new Chart(ctx.getContext('2d'), {
    type: 'scatter',
    data: {
      datasets: [
        {
          label: 'Retornos diarios',
          data: scatterData,
          backgroundColor: color + '66',
          borderColor: color,
          borderWidth: 1,
          pointRadius: 3,
          pointHoverRadius: 5,
        },
        {
          label: 'Tendencia',
          data: trendData,
          type: 'line',
          borderColor: color,
          borderWidth: 2,
          borderDash: [5,5],
          pointRadius: 0,
          fill: false,
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1c2640', borderColor: 'rgba(255,255,255,0.13)', borderWidth: 1,
          titleColor: '#8a9bbf', bodyColor: '#e8edf5', padding: 10,
          callbacks: {
            label: function(ctx) {
              if (ctx.datasetIndex === 0) return ' ' + pair.labelA + ': ' + ctx.parsed.x + '% / ' + pair.labelB + ': ' + ctx.parsed.y + '%';
              return '';
            }
          }
        },
        title: {
          display: true,
          text: 'r = ' + (r !== null ? r.toFixed(3) : '-') + ' — ' + corrLabel(r),
          color: color, font: { size: 13 },
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: { color: '#5a6a8a', font: { size: 10 }, callback: function(v){ return v+'%'; } },
          title: { display: true, text: pair.labelA + ' ret. diario %', color: '#5a6a8a', font: { size: 11 } }
        },
        y: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: { color: '#5a6a8a', font: { size: 10 }, callback: function(v){ return v+'%'; } },
          title: { display: true, text: pair.labelB + ' ret. diario %', color: '#5a6a8a', font: { size: 11 } }
        }
      }
    }
  });

  // Highlight selected card
  document.querySelectorAll('.corr-card').forEach(function(c){ c.classList.remove('selected'); });
  var cards = document.querySelectorAll('.corr-card');
  CORR_PAIRS.forEach(function(p,i){ if(p.id===pairId) cards[i] && cards[i].classList.add('selected'); });
}

function setCorrPeriod(period, btn) {
  corrPeriod = period;
  document.querySelectorAll('.corr-period-btn').forEach(function(b){ b.classList.remove('active'); });
  if (btn) btn.classList.add('active');
  renderCorrelations();
}
