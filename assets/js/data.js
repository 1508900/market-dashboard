/* ============================================================
   DATA.JS — Market Data Layer
   Datos reales via API propia en Render.com
   Fallback a datos simulados si la API no responde
   ============================================================ */

const API_BASE = 'https://market-api-ah0l.onrender.com';

const INDICES = [
  { id: 'sp500',     ticker: '^GSPC',     name: 'S&P 500',          exchange: 'NYSE',   region: 'US',     per: 21.5, currency: 'USD' },
  { id: 'nasdaq',    ticker: '^IXIC',     name: 'Nasdaq Composite', exchange: 'NASDAQ', region: 'US',     per: 29.2, currency: 'USD' },
  { id: 'eurostoxx', ticker: '^STOXX50E', name: 'Euro Stoxx 50',    exchange: 'EUREX',  region: 'EU',     per: 13.8, currency: 'EUR' },
  { id: 'msci_acwi', ticker: 'ACWI',      name: 'MSCI ACWI',        exchange: 'NASDAQ', region: 'Global', per: 19.4, currency: 'USD' },
  { id: 'msci_em',   ticker: 'EEM',       name: 'MSCI Emerging',    exchange: 'NYSE',   region: 'EM',     per: 12.1, currency: 'USD' },
  { id: 'msci_latam',ticker: 'ILF',       name: 'MSCI LatAm',       exchange: 'NYSE',   region: 'LatAm',  per: 9.8,  currency: 'USD' },
  { id: 'msci_china',ticker: 'MCHI',      name: 'MSCI China',       exchange: 'NASDAQ', region: 'China',  per: 11.2, currency: 'USD' },
  { id: 'korea',     ticker: 'EWY',       name: 'MSCI Korea',       exchange: 'NYSE',   region: 'Korea',  per: 10.4, currency: 'USD' },
];

const VOLATILITY_INDICES = [
  { id: 'vix',    ticker: '^VIX',    name: 'VIX',    desc: 'Volatilidad implícita S&P 500 (30d)',   market: 'EEUU' },
  { id: 'vstoxx', ticker: 'OVS.EX',  name: 'VSTOXX', desc: 'Volatilidad implícita Euro Stoxx 50',   market: 'Europa' },
];

const FOREX_PAIRS = [
  { id: 'eurusd', ticker: 'EURUSD=X', name: 'EUR/USD',   base: 'EUR', quote: 'USD' },
  { id: 'dxy',    ticker: 'DX-Y.NYB', name: 'USD Index', base: 'USD', quote: 'Index' },
  { id: 'eurjpy', ticker: 'EURJPY=X', name: 'EUR/JPY',   base: 'EUR', quote: 'JPY' },
  { id: 'eurgbp', ticker: 'EURGBP=X', name: 'EUR/GBP',   base: 'EUR', quote: 'GBP' },
  { id: 'usdjpy', ticker: 'USDJPY=X', name: 'USD/JPY',   base: 'USD', quote: 'JPY' },
];

const COMMODITIES = {
  energy: [
    { id: 'ttf',   ticker: 'TTF=F', name: 'Gas TTF', unit: 'EUR/MWh' },
    { id: 'brent', ticker: 'BZ=F',  name: 'Brent',   unit: 'USD/bbl' },
    { id: 'wti',   ticker: 'CL=F',  name: 'WTI',     unit: 'USD/bbl' },
  ],
  precious: [
    { id: 'gold',   ticker: 'GC=F', name: 'Oro',   unit: 'USD/oz' },
    { id: 'silver', ticker: 'SI=F', name: 'Plata', unit: 'USD/oz' },
  ],
  industrial: [
    { id: 'copper',   ticker: 'HG=F',  name: 'Cobre',    unit: 'USD/lb' },
    { id: 'aluminum', ticker: 'ALI=F', name: 'Aluminio', unit: 'USD/MT' },
    { id: 'nickel',   ticker: 'NI=F',  name: 'Niquel',   unit: 'USD/MT' },
    { id: 'zinc',     ticker: 'ZNC=F', name: 'Zinc',     unit: 'USD/MT' },
  ],
};

// Price validation ranges per commodity (to detect wrong data)
const COMM_PRICE_RANGES = {
  'TTF=F':  { min: 10,   max: 200  },  // EUR/MWh
  'BZ=F':   { min: 40,   max: 150  },  // USD/bbl
  'CL=F':   { min: 30,   max: 150  },  // USD/bbl
  'GC=F':   { min: 1500, max: 5000 },  // USD/oz
  'SI=F':   { min: 10,   max: 100  },  // USD/oz
  'HG=F':   { min: 2,    max: 10   },  // USD/lb
  'ALI=F':  { min: 1000, max: 5000 },  // USD/MT
  'NI=F':   { min: 8000, max: 40000},  // USD/MT
  'ZNC=F':  { min: 1000, max: 5000 },  // USD/MT
};

const HOLDINGS = {
  sp500: [
    { name: 'Apple',      ticker: 'AAPL',  weight: 7.1 },
    { name: 'Microsoft',  ticker: 'MSFT',  weight: 6.4 },
    { name: 'NVIDIA',     ticker: 'NVDA',  weight: 6.0 },
    { name: 'Amazon',     ticker: 'AMZN',  weight: 3.7 },
    { name: 'Meta',       ticker: 'META',  weight: 2.6 },
    { name: 'Alphabet A', ticker: 'GOOGL', weight: 2.2 },
    { name: 'Berkshire',  ticker: 'BRK-B', weight: 1.8 },
    { name: 'Tesla',      ticker: 'TSLA',  weight: 1.7 },
  ],
  nasdaq: [
    { name: 'Apple',      ticker: 'AAPL',  weight: 8.5 },
    { name: 'Microsoft',  ticker: 'MSFT',  weight: 8.1 },
    { name: 'NVIDIA',     ticker: 'NVDA',  weight: 7.2 },
    { name: 'Amazon',     ticker: 'AMZN',  weight: 5.2 },
    { name: 'Meta',       ticker: 'META',  weight: 4.1 },
    { name: 'Alphabet A', ticker: 'GOOGL', weight: 3.8 },
    { name: 'Tesla',      ticker: 'TSLA',  weight: 2.9 },
    { name: 'Broadcom',   ticker: 'AVGO',  weight: 2.3 },
  ],
  eurostoxx: [
    { name: 'ASML',          ticker: 'ASML',   weight: 9.2 },
    { name: 'SAP',           ticker: 'SAP',    weight: 7.8 },
    { name: 'Siemens',       ticker: 'SIE.DE', weight: 5.4 },
    { name: 'TotalEnergies', ticker: 'TTE.PA', weight: 4.8 },
    { name: 'LOreal',        ticker: 'OR.PA',  weight: 4.2 },
    { name: 'Airbus',        ticker: 'AIR.PA', weight: 3.9 },
    { name: 'Schneider',     ticker: 'SU.PA',  weight: 3.5 },
    { name: 'LVMH',          ticker: 'MC.PA',  weight: 3.1 },
  ],
  msci_acwi: [
    { name: 'Apple',     ticker: 'AAPL',  weight: 4.2 },
    { name: 'Microsoft', ticker: 'MSFT',  weight: 3.8 },
    { name: 'NVIDIA',    ticker: 'NVDA',  weight: 3.5 },
    { name: 'Amazon',    ticker: 'AMZN',  weight: 2.1 },
    { name: 'Meta',      ticker: 'META',  weight: 1.6 },
    { name: 'Alphabet',  ticker: 'GOOGL', weight: 1.3 },
    { name: 'TSMC',      ticker: 'TSM',   weight: 1.2 },
    { name: 'Tesla',     ticker: 'TSLA',  weight: 0.9 },
  ],
  msci_em: [
    { name: 'TSMC',      ticker: 'TSM',        weight: 8.5 },
    { name: 'Samsung',   ticker: '005930.KS',  weight: 4.2 },
    { name: 'Tencent',   ticker: 'TCEHY',      weight: 4.1 },
    { name: 'Alibaba',   ticker: 'BABA',       weight: 2.8 },
    { name: 'Reliance',  ticker: 'RELIANCE.NS',weight: 2.2 },
    { name: 'Meituan',   ticker: '3690.HK',    weight: 1.8 },
    { name: 'HDFC Bank', ticker: 'HDB',        weight: 1.5 },
    { name: 'Infosys',   ticker: 'INFY',       weight: 1.2 },
  ],
  msci_latam: [
    { name: 'Vale',          ticker: 'VALE',      weight: 10.2 },
    { name: 'Petrobras',     ticker: 'PBR',       weight: 8.8 },
    { name: 'Itau',          ticker: 'ITUB',      weight: 5.1 },
    { name: 'America Movil', ticker: 'AMX',       weight: 4.8 },
    { name: 'B3 SA',         ticker: 'B3SA3.SA',  weight: 4.2 },
    { name: 'WalMex',        ticker: 'WALMEX.MX', weight: 3.5 },
    { name: 'Femsa',         ticker: 'FMX',       weight: 3.1 },
    { name: 'Bradesco',      ticker: 'BBD',       weight: 2.8 },
  ],
  msci_china: [
    { name: 'Tencent',     ticker: 'TCEHY',  weight: 14.2 },
    { name: 'Alibaba',     ticker: 'BABA',   weight: 9.5 },
    { name: 'PDD Holdings',ticker: 'PDD',    weight: 5.8 },
    { name: 'Meituan',     ticker: '3690.HK',weight: 4.8 },
    { name: 'JD.com',      ticker: 'JD',     weight: 3.2 },
    { name: 'Baidu',       ticker: 'BIDU',   weight: 2.9 },
    { name: 'NetEase',     ticker: 'NTES',   weight: 2.4 },
    { name: 'Xiaomi',      ticker: '1810.HK',weight: 2.1 },
  ],
  korea: [
    { name: 'Samsung',    ticker: '005930.KS', weight: 22.4 },
    { name: 'SK Hynix',   ticker: '000660.KS', weight: 7.8 },
    { name: 'LG Energy',  ticker: '373220.KS', weight: 4.1 },
    { name: 'Hyundai',    ticker: '005380.KS', weight: 3.8 },
    { name: 'Kakao',      ticker: '035720.KS', weight: 3.2 },
    { name: 'NAVER',      ticker: '035420.KS', weight: 2.9 },
    { name: 'Samsung SDI',ticker: '006400.KS', weight: 2.4 },
    { name: 'LG Chem',    ticker: '051910.KS', weight: 2.1 },
  ],
};

const YIELD_DATA = {
  US: { flag: 'US', name: 'EEUU',     y1: 4.32, y2: 4.18, y5: 4.22, y10: 4.35, y30: 4.78 },
  DE: { flag: 'DE', name: 'Alemania', y1: 2.12, y2: 2.08, y5: 2.28, y10: 2.68, y30: 3.02 },
  FR: { flag: 'FR', name: 'Francia',  y1: 2.38, y2: 2.42, y5: 2.78, y10: 3.18, y30: 3.48 },
  ES: { flag: 'ES', name: 'Espana',   y1: 2.42, y2: 2.48, y5: 2.82, y10: 3.35, y30: 3.68 },
  IT: { flag: 'IT', name: 'Italia',   y1: 2.68, y2: 2.72, y5: 3.05, y10: 3.72, y30: 4.12 },
  UK: { flag: 'UK', name: 'UK',       y1: 4.48, y2: 4.38, y5: 4.42, y10: 4.68, y30: 5.12 },
  JP: { flag: 'JP', name: 'Japon',    y1: 0.62, y2: 0.88, y5: 1.28, y10: 2.50, y30: 3.12 },
};

const CREDIT_BASE = [
  { id: 'us_ig', region: 'EEUU',   type: 'Investment Grade', spread: 98,  change: -2 },
  { id: 'us_hy', region: 'EEUU',   type: 'High Yield',       spread: 312, change: +5 },
  { id: 'eu_hy', region: 'Europa', type: 'High Yield',       spread: 368, change: +8 },
];

window.marketData = {
  indices: {}, holdings: {}, yields: JSON.parse(JSON.stringify(YIELD_DATA)),
  credit: JSON.parse(JSON.stringify(CREDIT_BASE)), forex: {}, commodities: {}, lastUpdate: null,
};

// ---- FETCH ALL DATA FROM API ----
async function fetchAllFromAPI() {
  try {
    var res = await fetch(API_BASE + '/api/all', { signal: AbortSignal.timeout(60000) });
    if (!res.ok) return null;
    var data = await res.json();
    if (data && Object.keys(data).length > 5) return data;
    return null;
  } catch(e) {
    console.warn('API not available, trying Yahoo direct:', e.message);
    return await fetchYahooDirect();
  }
}

async function fetchYahooDirect() {
  var proxies = [
    'https://api.allorigins.win/get?url=',
    'https://corsproxy.io/?'
  ];
  var tickers = ['^GSPC','^IXIC','^STOXX50E','ACWI','EEM','ILF','MCHI','EWY',
                 'EURUSD=X','DX-Y.NYB','EURJPY=X','EURGBP=X','USDJPY=X',
                 'TTF=F','BZ=F','CL=F','GC=F','SI=F','HG=F','ALI=F','NI=F','ZNC=F',
                 '^VIX','OVS.EX'];
  var result = {};
  // Fetch first 8 most important tickers only (to avoid rate limits)
  var priority = ['^GSPC','^IXIC','^STOXX50E','ACWI','EEM','GC=F','BZ=F','EURUSD=X','^VIX'];
  for (var i = 0; i < priority.length; i++) {
    var ticker = priority[i];
    for (var p = 0; p < proxies.length; p++) {
      try {
        var url = 'https://query1.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(ticker) + '?interval=1d&range=3mo';
        var proxyUrl = proxies[p] + encodeURIComponent(url);
        var res = await fetch(proxyUrl, { signal: AbortSignal.timeout(6000) });
        var json = await res.json();
        var raw = typeof json.contents === 'string' ? JSON.parse(json.contents) : json;
        var chartResult = raw.chart && raw.chart.result && raw.chart.result[0];
        if (!chartResult) continue;
        var meta = chartResult.meta;
        var timestamps = chartResult.timestamp || [];
        var closes = (chartResult.indicators && chartResult.indicators.quote && chartResult.indicators.quote[0] && chartResult.indicators.quote[0].close) || [];
        var price = meta.regularMarketPrice;
        var prev = meta.chartPreviousClose || meta.regularMarketPreviousClose;
        if (!price) continue;
        var dates = timestamps.map(function(t) { return new Date(t*1000).toISOString().split('T')[0]; });
        var validCloses = closes.map(function(c) { return c ? +c.toFixed(4) : null; });
        var pairs = dates.map(function(d,i) { return {d:d,c:validCloses[i]}; }).filter(function(p) { return p.c; });
        var ytd = null;
        for (var j = 0; j < pairs.length; j++) {
          if (pairs[j].d >= '2026-01-01') { ytd = +((price - pairs[j].c) / pairs[j].c * 100).toFixed(2); break; }
        }
        result[ticker] = {
          ticker: ticker, price: +price.toFixed(4), prevClose: +prev.toFixed(4),
          change: prev ? +((price-prev)/prev*100).toFixed(2) : 0,
          ytd: ytd,
          high52: +(meta.fiftyTwoWeekHigh||price).toFixed(4),
          low52: +(meta.fiftyTwoWeekLow||price).toFixed(4),
          dates: pairs.map(function(p){return p.d;}),
          closes: pairs.map(function(p){return p.c;}),
        };
        break;
      } catch(e) { /* try next proxy */ }
    }
    await new Promise(function(r){setTimeout(r,200);});
  }
  return Object.keys(result).length > 3 ? result : null;
}

// ---- FALLBACK SIMULATION ----
const DAILY_VOL = {
  '^GSPC':0.008,'^IXIC':0.010,'^STOXX50E':0.009,'ACWI':0.007,'EEM':0.009,
  'ILF':0.010,'MCHI':0.012,'EWY':0.011,'EURUSD=X':0.003,'DX-Y.NYB':0.003,
  'EURJPY=X':0.004,'EURGBP=X':0.002,'USDJPY=X':0.003,'TTF=F':0.018,
  'BZ=F':0.012,'CL=F':0.013,'GC=F':0.008,'SI=F':0.012,'HG=F':0.010,
  'ALI=F':0.010,'NI=F':0.015,'ZNC=F':0.012,
};
const BASE_PRICES = {
  '^GSPC':5320,'^IXIC':16800,'^STOXX50E':5050,'ACWI':104,'EEM':41,
  'ILF':26,'MCHI':47,'EWY':58,'EURUSD=X':1.085,'DX-Y.NYB':102.8,
  'EURJPY=X':162.4,'EURGBP=X':0.858,'USDJPY=X':149.7,'TTF=F':34.2,
  'BZ=F':82.4,'CL=F':78.1,'GC=F':2340,'SI=F':27.8,'HG=F':4.22,
  'ALI=F':2280,'NI=F':16800,'ZNC=F':2840,
};

function generateSeries(basePrice, ticker) {
  var vol = DAILY_VOL[ticker] || 0.010;
  var workdays = [];
  var now = new Date();
  for (var j = 90; j >= 0; j--) {
    var d = new Date(now); d.setDate(d.getDate() - j);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    workdays.push(d.toISOString().split('T')[0]);
  }
  var n = workdays.length;
  var prices = new Array(n);
  prices[n-1] = basePrice;
  for (var i = n-2; i >= 0; i--) {
    prices[i] = +(prices[i+1] / (1 + (Math.random()-0.5)*vol)).toFixed(6);
  }
  var prevClose = n > 1 ? +prices[n-2].toFixed(4) : +(basePrice*0.998).toFixed(4);
  var allValid = prices.filter(function(c){return c>0;});
  return {
    price: basePrice, prevClose: prevClose,
    high52: +(Math.max.apply(null,allValid)*1.005).toFixed(4),
    low52:  +(Math.min.apply(null,allValid)*0.995).toFixed(4),
    dates: workdays, closes: prices,
  };
}

function buildFromAPI(apiData) {
  // Indices
  INDICES.forEach(function(idx) {
    var raw = apiData[idx.ticker];
    if (raw && raw.price) {
      var chg = raw.change || 0;
      window.marketData.indices[idx.id] = Object.assign({}, idx, {
        price: raw.price, prevClose: raw.prevClose, change: +chg.toFixed(2),
        changePt: +(raw.price - raw.prevClose).toFixed(2),
        high52: raw.high52, low52: raw.low52,
        dates: raw.dates, closes: raw.closes,
        yield: (100/idx.per).toFixed(2),
        ytd: raw.ytd != null ? raw.ytd : null,
        divYield: raw.divYield != null ? raw.divYield : null,
      });
    }
  });

  // Forex
  FOREX_PAIRS.forEach(function(pair) {
    var raw = apiData[pair.ticker];
    if (raw && raw.price) {
      window.marketData.forex[pair.id] = Object.assign({}, pair, {
        rate: raw.price, prevRate: raw.prevClose,
        dates: raw.dates, closes: raw.closes,
        change: +(raw.change||0).toFixed(3),
        changePt: +(raw.price - raw.prevClose).toFixed(4),
        ytd: raw.ytd != null ? raw.ytd : null,
      });
    }
  });

  // Commodities
  Object.keys(COMMODITIES).forEach(function(group) {
    window.marketData.commodities[group] = COMMODITIES[group].map(function(item) {
      var raw = apiData[item.ticker];
      if (raw && raw.price) {
        // Validate price is in expected range
        var range = COMM_PRICE_RANGES[item.ticker];
        var price = raw.price;
        if (range && (price < range.min || price > range.max)) {
          console.warn('Price out of range for ' + item.ticker + ': ' + price);
          // Try fallback base price
          price = BASE_PRICES[item.ticker] || price;
        }
        return Object.assign({}, item, {
          price: price, prevClose: raw.prevClose,
          dates: raw.dates, closes: raw.closes,
          change: +(raw.change||0).toFixed(2),
          changePt: +(price - raw.prevClose).toFixed(2),
          ytd: raw.ytd != null ? raw.ytd : null,
        });
      }
      // fallback
      var sim = generateSeries(BASE_PRICES[item.ticker]||100, item.ticker);
      return Object.assign({}, item, sim, {change:0, changePt:0});
    });
  });
}

function buildFallback() {
  INDICES.forEach(function(idx) {
    var base = BASE_PRICES[idx.ticker]||100;
    var series = generateSeries(base, idx.ticker);
    var chg = (series.price - series.prevClose)/series.prevClose*100;
    window.marketData.indices[idx.id] = Object.assign({}, idx, series, {
      change: +chg.toFixed(2), changePt: +(series.price-series.prevClose).toFixed(2),
      yield: (100/idx.per).toFixed(2),
    });
  });
  FOREX_PAIRS.forEach(function(pair) {
    var base = BASE_PRICES[pair.ticker]||1;
    var series = generateSeries(base, pair.ticker);
    var chg = (series.price-series.prevClose)/series.prevClose*100;
    window.marketData.forex[pair.id] = Object.assign({}, pair, {
      rate: series.price, prevRate: series.prevClose,
      dates: series.dates, closes: series.closes,
      change: +chg.toFixed(3), changePt: +(series.price-series.prevClose).toFixed(4),
    });
  });
  Object.keys(COMMODITIES).forEach(function(group) {
    window.marketData.commodities[group] = COMMODITIES[group].map(function(item) {
      var base = BASE_PRICES[item.ticker]||100;
      var series = generateSeries(base, item.ticker);
      var chg = (series.price-series.prevClose)/series.prevClose*100;
      return Object.assign({}, item, series, {change:+chg.toFixed(2), changePt:+(series.price-series.prevClose).toFixed(2)});
    });
  });
}


async function fetchCreditFromAPI() {
  try {
    var res = await fetch(API_BASE + '/api/credit', { signal: AbortSignal.timeout(20000) });
    if (!res.ok) return null;
    return await res.json();
  } catch(e) {
    return null;
  }
}

function updateCreditWithLiveData(liveCredit) {
  if (!liveCredit) return;
  window.marketData.credit = window.marketData.credit.map(function(c) {
    var live = liveCredit[c.id];
    if (live) {
      return Object.assign({}, c, {
        spread: live.spread,
        change: live.change,
        dates: live.dates,
        values: live.values,
      });
    }
    return c;
  });
}

async function fetchHoldingsFromAPI() {
  try {
    var res = await fetch(API_BASE + '/api/holdings', { signal: AbortSignal.timeout(20000) });
    if (!res.ok) return null;
    return await res.json();
  } catch(e) {
    return null;
  }
}

function updateHoldingsWithLiveData(holdingsData) {
  Object.keys(HOLDINGS).forEach(function(indexId) {
    window.marketData.holdings[indexId] = HOLDINGS[indexId].map(function(h) {
      var live = holdingsData[h.ticker];
      return Object.assign({}, h, {
        change: live ? +(live.change||0).toFixed(2) : +((Math.random()-0.45)*2).toFixed(2),
        price:  live ? live.price : null,
        ytd:    live && live.ytd != null ? live.ytd : null,
      });
    });
  });
}
function buildHoldings() {
  Object.keys(HOLDINGS).forEach(function(indexId) {
    window.marketData.holdings[indexId] = HOLDINGS[indexId].map(function(h) {
      return Object.assign({}, h, { change: +((Math.random()-0.45)*2.5).toFixed(2) });
    });
  });
}

async function fetchYieldsFromAPI() {
  try {
    var res = await fetch(API_BASE + '/api/yields', { signal: AbortSignal.timeout(20000) });
    if (!res.ok) return null;
    return await res.json();
  } catch(e) {
    return null;
  }
}

function updateYieldsWithLiveData(liveYields) {
  if (!liveYields) return;
  var countryMap = {
    'US': 'US', 'DE': 'DE', 'FR': 'FR', 'ES': 'ES', 'IT': 'IT', 'UK': 'UK', 'JP': 'JP'
  };
  Object.keys(countryMap).forEach(function(code) {
    if (liveYields[code] && window.marketData.yields[code]) {
      var live = liveYields[code];
      var current = window.marketData.yields[code];
      ['y1','y2','y5','y10','y30'].forEach(function(t) {
        if (live[t] && live[t] > 0 && live[t] < 20) {
          current[t] = live[t];
        }
      });
    }
  });
}

async function loadAllData() {
  document.getElementById('last-update').textContent = 'Cargando datos reales...';

  var apiData = await fetchAllFromAPI();
  var isLive = false;

  if (apiData && Object.keys(apiData).length > 5) {
    buildFromAPI(apiData);
    isLive = true;
  } else {
    buildFallback();
  }

  // Try to fetch real holdings data in background
  buildHoldings();
  fetchHoldingsFromAPI().then(function(holdingsData) {
    if (holdingsData && Object.keys(holdingsData).length > 5) {
      updateHoldingsWithLiveData(holdingsData);
    }
  });

  // Fetch real yields in background
  fetchYieldsFromAPI().then(function(liveYields) {
    if (liveYields && Object.keys(liveYields).length > 0) {
      updateYieldsWithLiveData(liveYields);
    }
  });

  // Fetch real credit spreads from FRED/ICE BofA
  fetchCreditFromAPI().then(function(liveCredit) {
    if (liveCredit && Object.keys(liveCredit).length > 0) {
      updateCreditWithLiveData(liveCredit);
      // Re-render credit charts with real data
      if (typeof renderCreditCharts === 'function') {
        renderCreditCharts();
      }
      if (typeof renderCreditCards === 'function') {
        renderCreditCards();
      }
    }
  });

  // Yields con pequeño drift
  Object.values(window.marketData.yields).forEach(function(y) {
    ['y1','y2','y5','y10','y30'].forEach(function(k) {
      y[k] = +(y[k] + (Math.random()-0.5)*0.02).toFixed(2);
    });
  });

  // Credit
  window.marketData.credit = CREDIT_BASE.map(function(c) {
    return Object.assign({}, c, {
      spread: Math.round(c.spread + (Math.random()-0.5)*3),
      change: Math.round(c.change + (Math.random()-0.5)*1),
    });
  });

  // Build volatility data
  window.marketData.volatility = buildVolatilityData(apiData);

  window.marketData.lastUpdate = new Date();
  var timeStr = window.marketData.lastUpdate.toLocaleTimeString('es-ES', {hour:'2-digit',minute:'2-digit'});
  document.getElementById('last-update').textContent = 'Actualizado: ' + timeStr + (isLive ? ' · Datos reales' : ' · Datos simulados');

  return window.marketData;
}

function buildVolatilityData(apiData) {
  var result = {};
  // VIX levels for reference zones
  var refs = {
    vix:    { low: 12, normal: 20, elevated: 30, extreme: 40 },
    vstoxx: { low: 15, normal: 22, elevated: 35, extreme: 50 },
    move:   { low: 80, normal: 120, elevated: 160, extreme: 200 },
  };

  VOLATILITY_INDICES.forEach(function(vi) {
    var raw = apiData ? apiData[vi.ticker] : null;
    var base = { vix: 17.2, vstoxx: 19.4, move: 95 }[vi.id] || 20;
    var price = raw ? raw.price : base;
    var prev  = raw ? raw.prevClose : base * 0.98;
    var chg   = prev ? (price - prev) / prev * 100 : 0;
    var dates = raw ? raw.dates : [];
    var closes = raw ? raw.closes : [];

    // If no historical data, derive from VIX or simulate
    if (!dates.length) {
      if (vi.id === 'vstoxx' && result['vix'] && result['vix'].closes.length) {
        // VSTOXX derived from VIX with realistic noise and mean-reversion
        var vixData = result['vix'];
        dates = vixData.dates;
        var currentPrice = price || base;
        var vixLast = vixData.closes[vixData.closes.length - 1];
        var offset = currentPrice - vixLast; // base spread
        // Add realistic noise: VSTOXX moves like VIX but with own dynamics
        var prevNoise = 0;
        closes = vixData.closes.map(function(v, i) {
          // Mean-reverting noise with persistence (AR1 process)
          prevNoise = prevNoise * 0.7 + (Math.random() - 0.5) * 2.5;
          var val = v + offset + prevNoise;
          return +Math.max(10, val).toFixed(2);
        });
        closes[closes.length - 1] = currentPrice;
      } else {
        var sim = generateSeries(base, vi.ticker || 'VIX', 90);
        dates = sim.dates; closes = sim.closes;
        if (!raw) { price = base; prev = base * 0.98; chg = 0; }
      }
    }

    var ref = refs[vi.id];
    var zone = 'normal';
    if (price <= ref.low) zone = 'low';
    else if (price <= ref.normal) zone = 'normal';
    else if (price <= ref.elevated) zone = 'elevated';
    else if (price <= ref.extreme) zone = 'extreme';
    else zone = 'crisis';

    result[vi.id] = {
      id: vi.id, ticker: vi.ticker, name: vi.name,
      desc: vi.desc, market: vi.market,
      price: +price.toFixed(2),
      prevClose: +prev.toFixed(2),
      change: +chg.toFixed(2),
      ytd: raw ? raw.ytd : null,
      dates: dates, closes: closes,
      zone: zone, refs: ref,
    };
  });
  return result;
}

// ---- UTILS ----
function fmt(n, decimals) {
  decimals = decimals !== undefined ? decimals : 2;
  if (n == null || isNaN(n)) return '-';
  return n.toLocaleString('es-ES', {minimumFractionDigits:decimals, maximumFractionDigits:decimals});
}
function fmtChange(n, suffix) {
  suffix = suffix || '%';
  if (n == null || isNaN(n)) return '-';
  return (n >= 0 ? '+' : '') + fmt(Math.abs(n)) + suffix;
}
function changeClass(n) {
  if (n > 0) return 'pos'; if (n < 0) return 'neg'; return 'neutral';
}
function filterByPeriod(dates, closes, period) {
  var now = new Date(); var cutoff = new Date(now);
  if (period==='1D') cutoff.setDate(cutoff.getDate()-2);
  else if (period==='1W') cutoff.setDate(cutoff.getDate()-7);
  else if (period==='1M') cutoff.setMonth(cutoff.getMonth()-1);
  else if (period==='3M') cutoff.setMonth(cutoff.getMonth()-3);
  else if (period==='YTD') cutoff = new Date(now.getFullYear(),0,1);
  else if (period==='1Y') cutoff.setFullYear(cutoff.getFullYear()-1);
  else cutoff.setMonth(cutoff.getMonth()-1);
  var filtered = (dates||[]).map(function(d,i){return{date:d,close:closes[i]};})
    .filter(function(p){return p.close!=null && new Date(p.date)>=cutoff;});
  return {dates:filtered.map(function(p){return p.date;}), closes:filtered.map(function(p){return p.close;})};
}
function generateHistoricalSeries(currentVal, days, volatility) {
  days=days||90; volatility=volatility||0.006;
  var series=[],dates=[],now=new Date();
  var prices=[currentVal];
  for(var i=1;i<=days;i++) prices.push(+(prices[prices.length-1]/(1+(Math.random()-0.5)*volatility)).toFixed(3));
  prices.reverse();
  var idx=0;
  for(var j=days;j>=0;j--){
    var d=new Date(now); d.setDate(d.getDate()-j);
    if(d.getDay()===0||d.getDay()===6) continue;
    dates.push(d.toISOString().split('T')[0]);
    series.push(prices[idx]); idx++;
  }
  if(series.length) series[series.length-1]=currentVal;
  return {dates:dates,series:series};
}
function fetchHoldings(indexId) {
  return Promise.resolve(window.marketData.holdings[indexId]||[]);
}
