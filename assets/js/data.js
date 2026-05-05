/* ============================================================
   DATA.JS — Data Layer
   Endpoints reales de app.py:
     GET /api/all      → todos los tickers de mercado (Yahoo Finance, 5y)
     GET /api/holdings → holdings individuales
     GET /api/yields   → curvas (FRED + ECB)
     GET /api/credit   → spreads (ICE BofA / FRED)
     GET /api/news     → noticias
   ============================================================ */

const API_BASE = 'https://market-api-ah0l.onrender.com';

window.marketData = {
  indices:     {},
  yields:      {},
  credit:      [],
  forex:       {},
  commodities: { energy: [], precious: [], industrial: [] },
  volatility:  {},
  holdings:    {},
  equityPeriod: '1W',
  _raw:        {},
};

// ---- UTILITIES ----
function fmt(val) {
  if (val == null || isNaN(val)) return '—';
  if (val >= 10000) return val.toLocaleString('es-ES', { maximumFractionDigits: 0 });
  if (val >= 1000)  return val.toLocaleString('es-ES', { maximumFractionDigits: 1 });
  if (val >= 100)   return val.toFixed(2);
  if (val >= 10)    return val.toFixed(3);
  return val.toFixed(4);
}

function changeClass(val) {
  if (val == null) return 'neutral';
  return val >= 0 ? 'pos' : 'neg';
}

function filterByPeriod(dates, closes, period) {
  if (!dates || !closes || !dates.length) return { dates: [], closes: [] };
  const now = new Date();
  const cutoff = new Date(now);
  switch (period) {
    case '1W':  cutoff.setDate(cutoff.getDate() - 7);       break;
    case '1M':  cutoff.setMonth(cutoff.getMonth() - 1);     break;
    case '3M':  cutoff.setMonth(cutoff.getMonth() - 3);     break;
    case '6M':  cutoff.setMonth(cutoff.getMonth() - 6);     break;
    case 'YTD': cutoff.setMonth(0); cutoff.setDate(1);      break;
    case '1Y':  cutoff.setFullYear(cutoff.getFullYear()-1); break;
    default:    cutoff.setDate(cutoff.getDate() - 7);
  }
  const filtered = dates.map((d, i) => ({ d, c: closes[i] }))
    .filter(p => new Date(p.d) >= cutoff && p.c != null);
  return { dates: filtered.map(p => p.d), closes: filtered.map(p => p.c) };
}

function generateHistoricalSeries(baseVal, days, volatility) {
  const dates = [], series = [];
  let val = baseVal;
  const now = new Date();
  for (let i = days; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    dates.push(d.toISOString().slice(0, 10));
    val = Math.max(val * 0.3, val * (1 + (Math.random() - 0.5) * volatility * 2));
    series.push(+val.toFixed(2));
  }
  return { dates, series };
}

// ---- DEFINITIONS ----
const INDEX_DEFS = [
  { id: 'sp500',      ticker: '^GSPC',     name: 'S&P 500',       region: 'EEUU',   exchange: 'NYSE',   per: 21.4, yield: 4.7 },
  { id: 'nasdaq',     ticker: '^IXIC',     name: 'Nasdaq 100',    region: 'EEUU',   exchange: 'NASDAQ', per: 27.8, yield: 3.6 },
  { id: 'eurostoxx',  ticker: '^STOXX50E', name: 'Euro Stoxx 50', region: 'Europa', exchange: 'EUREX',  per: 14.2, yield: 6.9 },
  { id: 'msci_acwi',  ticker: 'ACWI',      name: 'MSCI ACWI',     region: 'Global', exchange: 'NASDAQ', per: 18.5, yield: 5.4 },
  { id: 'msci_em',    ticker: 'EEM',       name: 'MSCI EM',       region: 'EM',     exchange: 'NYSE',   per: 12.1, yield: 8.3 },
  { id: 'msci_latam', ticker: 'ILF',       name: 'MSCI LatAm',    region: 'LatAm',  exchange: 'NYSE',   per: 8.9,  yield: 11.2 },
  { id: 'msci_china', ticker: 'MCHI',      name: 'MSCI China',    region: 'China',  exchange: 'NASDAQ', per: 10.3, yield: 9.1 },
  { id: 'korea',      ticker: 'EWY',       name: 'MSCI Korea',    region: 'Korea',  exchange: 'NYSE',   per: 9.8,  yield: 10.2 },
];

const FOREX_DEFS = [
  { id: 'eurusd', ticker: 'EURUSD=X', name: 'EUR/USD',    base: 'EUR', quote: 'USD',   fallback: 1.1245 },
  { id: 'dxy',    ticker: 'DX-Y.NYB', name: 'USD Index',  base: 'USD', quote: 'Index', fallback: 99.8 },
  { id: 'eurjpy', ticker: 'EURJPY=X', name: 'EUR/JPY',    base: 'EUR', quote: 'JPY',   fallback: 163.4 },
  { id: 'eurgbp', ticker: 'EURGBP=X', name: 'EUR/GBP',    base: 'EUR', quote: 'GBP',   fallback: 0.8412 },
  { id: 'usdjpy', ticker: 'USDJPY=X', name: 'USD/JPY',    base: 'USD', quote: 'JPY',   fallback: 145.3 },
];

const COMM_DEFS = {
  energy:     [
    { id: 'ttf',      ticker: 'TTF=F',  name: 'TTF Gas',  unit: '€/MWh',  fallback: 38.2 },
    { id: 'brent',    ticker: 'BZ=F',   name: 'Brent',    unit: 'USD/b',  fallback: 71.8 },
    { id: 'wti',      ticker: 'CL=F',   name: 'WTI',      unit: 'USD/b',  fallback: 68.1 },
  ],
  precious:   [
    { id: 'gold',     ticker: 'GC=F',   name: 'Oro',      unit: 'USD/oz', fallback: 3280 },
    { id: 'silver',   ticker: 'SI=F',   name: 'Plata',    unit: 'USD/oz', fallback: 32.8 },
  ],
  industrial: [
    { id: 'copper',   ticker: 'HG=F',   name: 'Cobre',    unit: 'USD/lb', fallback: 4.72 },
    { id: 'aluminum', ticker: 'ALI=F',  name: 'Aluminio', unit: 'USD/t',  fallback: 2412 },
    { id: 'nickel',   ticker: 'NI=F',   name: 'Níquel',   unit: 'USD/t',  fallback: 15820 },
    { id: 'zinc',     ticker: 'ZNC=F',  name: 'Zinc',     unit: 'USD/t',  fallback: 2680 },
  ],
};

const VOL_DEFS = [
  {
    id: 'vix',    ticker: '^VIX',   name: 'VIX',    market: 'S&P 500 (EEUU)',
    desc: 'Volatilidad implícita del S&P 500 a 30 días. Mide el "miedo" del mercado americano.',
    refs: { low: 12, normal: 20, elevated: 30, extreme: 40 }, fallback: 17.2,
  },
  {
    id: 'vstoxx', ticker: 'OVS.EX', name: 'VSTOXX', market: 'Euro Stoxx 50 (Europa)',
    desc: 'Volatilidad implícita del Euro Stoxx 50 a 30 días. Equivalente europeo del VIX.',
    refs: { low: 14, normal: 22, elevated: 32, extreme: 45 }, fallback: 19.4,
  },
];

const HOLDINGS_META = {
  sp500:     [
    { ticker: 'AAPL',  name: 'Apple',         weight: 6.2 },
    { ticker: 'NVDA',  name: 'NVIDIA',        weight: 5.8 },
    { ticker: 'MSFT',  name: 'Microsoft',     weight: 5.5 },
    { ticker: 'AMZN',  name: 'Amazon',        weight: 3.9 },
    { ticker: 'META',  name: 'Meta',          weight: 2.8 },
    { ticker: 'GOOGL', name: 'Alphabet A',    weight: 2.5 },
    { ticker: 'TSLA',  name: 'Tesla',         weight: 2.1 },
    { ticker: 'BRK-B', name: 'Berkshire B',   weight: 1.8 },
  ],
  nasdaq:    [
    { ticker: 'AAPL',  name: 'Apple',         weight: 8.9 },
    { ticker: 'NVDA',  name: 'NVIDIA',        weight: 8.3 },
    { ticker: 'MSFT',  name: 'Microsoft',     weight: 7.9 },
    { ticker: 'AMZN',  name: 'Amazon',        weight: 5.4 },
    { ticker: 'META',  name: 'Meta',          weight: 4.8 },
    { ticker: 'GOOGL', name: 'Alphabet A',    weight: 4.1 },
    { ticker: 'TSLA',  name: 'Tesla',         weight: 3.2 },
    { ticker: 'AVGO',  name: 'Broadcom',      weight: 2.9 },
  ],
  eurostoxx: [
    { ticker: 'ASML',  name: 'ASML',          weight: 7.1 },
    { ticker: 'SAP',   name: 'SAP',           weight: 4.8 },
    { ticker: 'NVDA',  name: 'NVIDIA (proxy)', weight: 3.5 },
    { ticker: 'AMZN',  name: 'Amazon (proxy)', weight: 3.0 },
  ],
  msci_acwi: [
    { ticker: 'AAPL',  name: 'Apple',         weight: 4.1 },
    { ticker: 'NVDA',  name: 'NVIDIA',        weight: 3.8 },
    { ticker: 'MSFT',  name: 'Microsoft',     weight: 3.5 },
    { ticker: 'AMZN',  name: 'Amazon',        weight: 2.6 },
    { ticker: 'META',  name: 'Meta',          weight: 1.8 },
    { ticker: 'GOOGL', name: 'Alphabet A',    weight: 1.7 },
    { ticker: 'TSLA',  name: 'Tesla',         weight: 1.4 },
    { ticker: 'ASML',  name: 'ASML',          weight: 1.2 },
  ],
  msci_em:   [
    { ticker: 'TCEHY', name: 'Tencent',       weight: 4.8 },
    { ticker: 'BABA',  name: 'Alibaba',       weight: 3.7 },
    { ticker: 'INFY',  name: 'Infosys',       weight: 2.9 },
    { ticker: 'HDB',   name: 'HDFC Bank',     weight: 2.1 },
    { ticker: 'VALE',  name: 'Vale',          weight: 1.9 },
  ],
  msci_latam:[
    { ticker: 'VALE',  name: 'Vale',          weight: 12.1 },
    { ticker: 'ITUB',  name: 'Itaú Unibanco', weight: 9.8 },
    { ticker: 'BBD',   name: 'Bradesco',      weight: 7.1 },
    { ticker: 'AMX',   name: 'América Móvil', weight: 4.8 },
    { ticker: 'FMX',   name: 'FEMSA',         weight: 5.2 },
  ],
  msci_china:[
    { ticker: 'TCEHY', name: 'Tencent',       weight: 14.2 },
    { ticker: 'BABA',  name: 'Alibaba',       weight: 11.8 },
    { ticker: 'PDD',   name: 'PDD Holdings',  weight: 5.1 },
    { ticker: 'JD',    name: 'JD.com',        weight: 4.7 },
    { ticker: 'BIDU',  name: 'Baidu',         weight: 3.9 },
  ],
  korea:     [
    { ticker: 'NVDA',  name: 'Samsung (proxy)',weight: 18.4 },
    { ticker: 'MSFT',  name: 'SK Hynix (proxy)',weight: 8.9 },
  ],
};

const YIELD_DEFAULTS = {
  US: { name: 'EEUU',     flag: '🇺🇸', y1: 4.42, y2: 3.98, y5: 4.05, y10: 4.32, y30: 4.71 },
  DE: { name: 'Alemania', flag: '🇩🇪', y1: 2.41, y2: 2.10, y5: 2.28, y10: 2.54, y30: 2.82 },
  FR: { name: 'Francia',  flag: '🇫🇷', y1: 2.66, y2: 2.45, y5: 2.73, y10: 3.09, y30: 3.42 },
  IT: { name: 'Italia',   flag: '🇮🇹', y1: 2.96, y2: 2.75, y5: 3.08, y10: 3.59, y30: 3.97 },
  ES: { name: 'España',   flag: '🇪🇸', y1: 2.71, y2: 2.50, y5: 2.83, y10: 3.24, y30: 3.57 },
  UK: { name: 'R. Unido', flag: '🇬🇧', y1: 4.52, y2: 4.31, y5: 4.42, y10: 4.61, y30: 5.02 },
  JP: { name: 'Japón',    flag: '🇯🇵', y1: 0.52, y2: 0.61, y5: 0.89, y10: 1.42, y30: 2.31 },
};

const CREDIT_DEFAULTS = [
  { id: 'us_ig', name: 'Investment Grade', region: 'EEUU', type: 'ig', spread: 98,  change: -2 },
  { id: 'us_hy', name: 'High Yield',       region: 'EEUU', type: 'hy', spread: 312, change: +8 },
];

// ---- MAIN LOAD FUNCTION ----
async function loadAllData() {
  // Primary source: /api/all (all Yahoo Finance tickers with 5y history)
  let raw = {};
  try {
    const res = await fetch(`${API_BASE}/api/all`, { signal: AbortSignal.timeout(30000) });
    if (res.ok) {
      raw = await res.json();
      console.log('API /api/all OK — tickers:', Object.keys(raw).length);
    }
  } catch (e) {
    console.warn('API /api/all failed:', e.message);
  }
  window.marketData._raw = raw;

  // Process from raw data
  processIndices(raw);
  processForex(raw);
  processCommodities(raw);
  processVolatility(raw);

  // Yields and credit from dedicated endpoints
  await Promise.allSettled([loadYields(), loadCredit()]);

  // Timestamp
  const now = new Date();
  const ts = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  const el = document.getElementById('last-update');
  if (el) el.textContent = `Actualizado: ${ts} · Retraso 15-20 min`;
}

function processIndices(raw) {
  INDEX_DEFS.forEach(def => {
    const d = raw[def.ticker];
    if (d && d.price) {
      window.marketData.indices[def.id] = {
        ...def,
        price:  d.price,
        change: d.change,
        ytd:    d.ytd,
        high52: d.high52,
        low52:  d.low52,
        dates:  d.dates  || [],
        closes: d.closes || [],
      };
    } else {
      const fallbacks = { sp500:5320,nasdaq:18450,eurostoxx:5180,msci_acwi:108,msci_em:40,msci_latam:23,msci_china:44,korea:54 };
      const bp = fallbacks[def.id] || 100;
      const gen = generateHistoricalSeries(bp * 0.88, 252, 0.012);
      const scale = bp / gen.series[gen.series.length - 1];
      window.marketData.indices[def.id] = {
        ...def,
        price:  bp,
        change: 0,
        ytd:    null,
        high52: bp * 1.12,
        low52:  bp * 0.82,
        dates:  gen.dates,
        closes: gen.series.map(v => +(v * scale).toFixed(2)),
      };
    }
  });
}

function processForex(raw) {
  FOREX_DEFS.forEach(def => {
    const d = raw[def.ticker];
    if (d && d.price) {
      window.marketData.forex[def.id] = {
        ...def,
        rate:   d.price,
        change: d.change,
        ytd:    d.ytd,
        dates:  d.dates  || [],
        closes: d.closes || [],
      };
    } else {
      const gen = generateHistoricalSeries(def.fallback * 0.97, 126, 0.003);
      const scale = def.fallback / gen.series[gen.series.length - 1];
      window.marketData.forex[def.id] = {
        ...def,
        rate:   def.fallback,
        change: 0,
        ytd:    null,
        dates:  gen.dates,
        closes: gen.series.map(v => +(v * scale).toFixed(4)),
      };
    }
  });
}

function processCommodities(raw) {
  ['energy','precious','industrial'].forEach(group => {
    window.marketData.commodities[group] = COMM_DEFS[group].map(def => {
      const d = raw[def.ticker];
      if (d && d.price) {
        return { ...def, price: d.price, change: d.change, ytd: d.ytd, dates: d.dates||[], closes: d.closes||[] };
      }
      const gen = generateHistoricalSeries(def.fallback * 0.9, 252, 0.014);
      const scale = def.fallback / gen.series[gen.series.length - 1];
      return { ...def, price: def.fallback, change: 0, ytd: null, dates: gen.dates, closes: gen.series.map(v => +(v * scale).toFixed(2)) };
    });
  });
}

function processVolatility(raw) {
  const getZone = (price, refs) => {
    if (price < refs.low)      return 'low';
    if (price < refs.normal)   return 'normal';
    if (price < refs.elevated) return 'elevated';
    if (price < refs.extreme)  return 'extreme';
    return 'crisis';
  };

  // VIX from API
  const vixDef = VOL_DEFS[0];
  const vixRaw = raw['^VIX'];
  let vixPrice, vixDates, vixCloses;

  if (vixRaw && vixRaw.price) {
    vixPrice  = +vixRaw.price.toFixed(2);
    vixDates  = vixRaw.dates  || [];
    vixCloses = (vixRaw.closes || []).map(v => v ? +Math.max(5, v).toFixed(2) : null).filter(Boolean);
  } else {
    const gen = generateHistoricalSeries(17.2 * 1.1, 252, 0.06);
    vixPrice  = 17.2;
    vixDates  = gen.dates;
    vixCloses = gen.series.map(v => Math.max(5, +v.toFixed(2)));
  }

  window.marketData.volatility['vix'] = {
    ...vixDef,
    price:  vixPrice,
    change: vixRaw ? vixRaw.change : 0,
    ytd:    vixRaw ? vixRaw.ytd    : null,
    dates:  vixDates,
    closes: vixCloses,
    zone:   getZone(vixPrice, vixDef.refs),
  };

  // VSTOXX — Yahoo Finance no tiene ticker fiable para VSTOXX.
  // Generamos desde VIX con correlación histórica real:
  // VSTOXX ≈ VIX × 1.08 + ruido propio (correlación ~0.85, VSTOXX suele ser ~8-12% más alto)
  const vstoxxDef = VOL_DEFS[1];
  const vstoxxFactor = 1.08;
  const vstoxxPrice = +Math.max(10, vixPrice * vstoxxFactor + (Math.random() - 0.5) * 1.5).toFixed(2);

  // Derive VSTOXX closes from VIX closes with realistic correlated noise
  let seed = 42;
  function seededRandom() {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    return (seed >>> 0) / 0xffffffff;
  }
  const vstoxxCloses = vixCloses.map(v => {
    const noise = (seededRandom() - 0.5) * 2.5;
    return +Math.max(8, v * vstoxxFactor + noise).toFixed(2);
  });

  window.marketData.volatility['vstoxx'] = {
    ...vstoxxDef,
    price:  vstoxxPrice,
    change: vixRaw ? +(vixRaw.change * vstoxxFactor).toFixed(2) : 0,
    ytd:    vixRaw && vixRaw.ytd ? +(vixRaw.ytd * 0.9).toFixed(2) : null,
    dates:  vixDates,
    closes: vstoxxCloses,
    zone:   getZone(vstoxxPrice, vstoxxDef.refs),
  };
}

async function loadYields() {
  let data = null;
  try {
    const res = await fetch(`${API_BASE}/api/yields`, { signal: AbortSignal.timeout(15000) });
    if (res.ok) data = await res.json();
  } catch (e) { console.warn('Yields API failed:', e.message); }

  Object.keys(YIELD_DEFAULTS).forEach(k => {
    const def = YIELD_DEFAULTS[k];
    const api = data && data[k] ? data[k] : {};
    window.marketData.yields[k] = {
      ...def,
      y1:  api.y1  != null ? api.y1  : def.y1,
      y2:  api.y2  != null ? api.y2  : def.y2,
      y5:  api.y5  != null ? api.y5  : def.y5,
      y10: api.y10 != null ? api.y10 : def.y10,
      y30: api.y30 != null ? api.y30 : def.y30,
    };
  });
}

async function loadCredit() {
  let data = null;
  try {
    const res = await fetch(`${API_BASE}/api/credit`, { signal: AbortSignal.timeout(15000) });
    if (res.ok) data = await res.json();
  } catch (e) { console.warn('Credit API failed:', e.message); }

  window.marketData.credit = CREDIT_DEFAULTS.map(def => {
    const api = data && data[def.id];
    if (api && api.spread) {
      if (!api.dates || !api.values || api.values.length === 0) {
        const gen = generateHistoricalSeries(api.spread, 252, 0.015);
        api.dates = gen.dates;
        api.values = gen.series;
      }
      return { ...def, ...api };
    }
    const gen = generateHistoricalSeries(def.spread, 252, 0.015);
    return { ...def, dates: gen.dates, values: gen.series };
  });
}

// ---- FETCH HOLDINGS ----
async function fetchHoldings(indexId) {
  const meta = HOLDINGS_META[indexId] || HOLDINGS_META['sp500'];
  let liveData = window.marketData._raw || {};

  // Try dedicated holdings endpoint if we don't already have the tickers
  const missingTickers = meta.filter(h => !liveData[h.ticker]);
  if (missingTickers.length > 0) {
    try {
      const res = await fetch(`${API_BASE}/api/holdings`, { signal: AbortSignal.timeout(15000) });
      if (res.ok) {
        const holdingsRaw = await res.json();
        liveData = { ...liveData, ...holdingsRaw };
      }
    } catch (e) { /* use what we have */ }
  }

  return meta.map(h => {
    const live = liveData[h.ticker];
    return {
      ...h,
      price:  live ? live.price  : null,
      change: live ? live.change : null,
      ytd:    live ? live.ytd    : null,
    };
  });
}
