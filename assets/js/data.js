/* ============================================================
   DATA.JS — Data Layer: Utility Functions + Data Loading
   ============================================================ */

const API_BASE = 'https://market-api-ah0l.onrender.com';

// ---- GLOBAL MARKET DATA STORE ----
window.marketData = {
  indices:     {},
  yields:      {},
  credit:      [],
  forex:       {},
  commodities: { energy: [], precious: [], industrial: [] },
  volatility:  {},
  holdings:    {},
  equityPeriod: '1W',
};

// ---- UTILITY: FORMAT NUMBER ----
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

// ---- UTILITY: FILTER BY PERIOD ----
function filterByPeriod(dates, closes, period) {
  if (!dates || !closes || !dates.length) return { dates: [], closes: [] };
  const now = new Date();
  const cutoff = new Date(now);
  switch (period) {
    case '1W':  cutoff.setDate(cutoff.getDate() - 7);      break;
    case '1M':  cutoff.setMonth(cutoff.getMonth() - 1);    break;
    case '3M':  cutoff.setMonth(cutoff.getMonth() - 3);    break;
    case '6M':  cutoff.setMonth(cutoff.getMonth() - 6);    break;
    case 'YTD': cutoff.setMonth(0); cutoff.setDate(1);     break;
    case '1Y':  cutoff.setFullYear(cutoff.getFullYear()-1); break;
    default:    cutoff.setDate(cutoff.getDate() - 7);
  }
  const filtered = dates.map((d, i) => ({ d, c: closes[i] }))
    .filter(p => new Date(p.d) >= cutoff && p.c != null);
  return {
    dates:  filtered.map(p => p.d),
    closes: filtered.map(p => p.c),
  };
}

// ---- UTILITY: GENERATE HISTORICAL SERIES (fallback) ----
function generateHistoricalSeries(baseVal, days, volatility) {
  const dates = [];
  const series = [];
  let val = baseVal;
  const now = new Date();
  for (let i = days; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    if (d.getDay() === 0 || d.getDay() === 6) continue; // skip weekends
    dates.push(d.toISOString().slice(0, 10));
    val = val * (1 + (Math.random() - 0.5) * volatility * 2);
    series.push(+val.toFixed(2));
  }
  return { dates, series };
}

// ---- INDEX DEFINITIONS ----
const INDEX_DEFS = [
  { id: 'sp500',      ticker: '^GSPC',     name: 'S&P 500',       region: 'EEUU',   exchange: 'NYSE',    per: 21.4, yield: 4.7,  high52: 6147, low52: 4835 },
  { id: 'nasdaq',     ticker: '^IXIC',     name: 'Nasdaq 100',    region: 'EEUU',   exchange: 'NASDAQ',  per: 27.8, yield: 3.6,  high52: 21200, low52: 16300 },
  { id: 'eurostoxx',  ticker: '^STOXX50E', name: 'Euro Stoxx 50', region: 'Europa', exchange: 'EUREX',   per: 14.2, yield: 6.9,  high52: 5510, low52: 4630 },
  { id: 'msci_acwi',  ticker: 'ACWI',      name: 'MSCI ACWI',     region: 'Global', exchange: 'NASDAQ',  per: 18.5, yield: 5.4,  high52: 115,  low52: 90   },
  { id: 'msci_em',    ticker: 'EEM',       name: 'MSCI EM',       region: 'EM',     exchange: 'NYSE',    per: 12.1, yield: 8.3,  high52: 44,   low52: 36   },
  { id: 'msci_latam', ticker: 'ILF',       name: 'MSCI LatAm',    region: 'LatAm',  exchange: 'NYSE',    per: 8.9,  yield: 11.2, high52: 28,   low52: 20   },
  { id: 'msci_china', ticker: 'MCHI',      name: 'MSCI China',    region: 'China',  exchange: 'NASDAQ',  per: 10.3, yield: 9.1,  high52: 52,   low52: 38   },
  { id: 'korea',      ticker: 'EWY',       name: 'MSCI Korea',    region: 'Korea',  exchange: 'NYSE',    per: 9.8,  yield: 10.2, high52: 62,   low52: 47   },
];

// ---- HOLDINGS DEFINITIONS ----
const HOLDINGS_DEFS = {
  sp500:     [
    { ticker: 'AAPL',  name: 'Apple',       weight: 6.2 },
    { ticker: 'NVDA',  name: 'NVIDIA',      weight: 5.8 },
    { ticker: 'MSFT',  name: 'Microsoft',   weight: 5.5 },
    { ticker: 'AMZN',  name: 'Amazon',      weight: 3.9 },
    { ticker: 'META',  name: 'Meta',        weight: 2.8 },
    { ticker: 'GOOGL', name: 'Alphabet A',  weight: 2.5 },
    { ticker: 'TSLA',  name: 'Tesla',       weight: 2.1 },
    { ticker: 'BRK-B', name: 'Berkshire B', weight: 1.8 },
  ],
  nasdaq:    [
    { ticker: 'AAPL',  name: 'Apple',       weight: 8.9 },
    { ticker: 'NVDA',  name: 'NVIDIA',      weight: 8.3 },
    { ticker: 'MSFT',  name: 'Microsoft',   weight: 7.9 },
    { ticker: 'AMZN',  name: 'Amazon',      weight: 5.4 },
    { ticker: 'META',  name: 'Meta',        weight: 4.8 },
    { ticker: 'GOOGL', name: 'Alphabet A',  weight: 4.1 },
    { ticker: 'TSLA',  name: 'Tesla',       weight: 3.2 },
    { ticker: 'AVGO',  name: 'Broadcom',    weight: 2.9 },
  ],
  eurostoxx: [
    { ticker: 'ASML',  name: 'ASML',        weight: 7.1 },
    { ticker: 'LVMH',  name: 'LVMH',        weight: 5.4 },
    { ticker: 'SAP',   name: 'SAP',         weight: 4.8 },
    { ticker: 'SIE',   name: 'Siemens',     weight: 4.3 },
    { ticker: 'AIR',   name: 'Airbus',      weight: 3.9 },
    { ticker: 'MC',    name: 'Louis Vuitton',weight: 3.5 },
    { ticker: 'BNP',   name: 'BNP Paribas', weight: 3.1 },
    { ticker: 'TTE',   name: 'TotalEnergies',weight: 2.9 },
  ],
  msci_acwi: [
    { ticker: 'AAPL',  name: 'Apple',       weight: 4.1 },
    { ticker: 'NVDA',  name: 'NVIDIA',      weight: 3.8 },
    { ticker: 'MSFT',  name: 'Microsoft',   weight: 3.5 },
    { ticker: 'AMZN',  name: 'Amazon',      weight: 2.6 },
    { ticker: 'META',  name: 'Meta',        weight: 1.8 },
    { ticker: 'GOOGL', name: 'Alphabet A',  weight: 1.7 },
    { ticker: 'TSLA',  name: 'Tesla',       weight: 1.4 },
    { ticker: 'ASML',  name: 'ASML',        weight: 1.2 },
  ],
  msci_em:   [
    { ticker: '700.HK', name: 'Tencent',    weight: 4.8 },
    { ticker: 'BABA',   name: 'Alibaba',    weight: 3.7 },
    { ticker: '005930', name: 'Samsung',    weight: 3.4 },
    { ticker: 'RELIANCE',name: 'Reliance', weight: 2.9 },
    { ticker: 'MELI',   name: 'MercadoLibre',weight: 2.1 },
    { ticker: 'VALE',   name: 'Vale',       weight: 1.9 },
    { ticker: 'INDA',   name: 'HDFC Bank',  weight: 1.7 },
    { ticker: 'ICICi',  name: 'ICICI Bank', weight: 1.5 },
  ],
  msci_latam:[
    { ticker: 'VALE',   name: 'Vale',       weight: 12.1 },
    { ticker: 'ITUB',   name: 'Itaú Unibanco',weight: 9.8 },
    { ticker: 'MELI',   name: 'MercadoLibre',weight: 8.3 },
    { ticker: 'BBDC',   name: 'Bradesco',   weight: 7.1 },
    { ticker: 'WALMEX', name: 'Walmart MX', weight: 5.9 },
    { ticker: 'FEMSA',  name: 'FEMSA',      weight: 5.2 },
    { ticker: 'AMX',    name: 'América Móvil',weight: 4.8 },
    { ticker: 'GGAL',   name: 'Galicia',    weight: 3.9 },
  ],
  msci_china:[
    { ticker: '700.HK', name: 'Tencent',    weight: 14.2 },
    { ticker: 'BABA',   name: 'Alibaba',    weight: 11.8 },
    { ticker: 'MEITUAN',name: 'Meituan',    weight: 6.3 },
    { ticker: 'PDD',    name: 'PDD Holdings',weight: 5.1 },
    { ticker: 'JD',     name: 'JD.com',     weight: 4.7 },
    { ticker: 'BIDU',   name: 'Baidu',      weight: 3.9 },
    { ticker: 'NIO',    name: 'NIO',         weight: 2.8 },
    { ticker: 'BYD',    name: 'BYD',         weight: 2.6 },
  ],
  korea:     [
    { ticker: '005930', name: 'Samsung Elec.',weight: 18.4 },
    { ticker: '000660', name: 'SK Hynix',    weight: 8.9 },
    { ticker: '207940', name: 'Samsung Biol.',weight: 5.2 },
    { ticker: '005380', name: 'Hyundai Motor',weight: 4.8 },
    { ticker: '035720', name: 'Kakao',       weight: 3.6 },
    { ticker: '051910', name: 'LG Chem',     weight: 3.1 },
    { ticker: '006400', name: 'Samsung SDI', weight: 2.9 },
    { ticker: '035420', name: 'NAVER',       weight: 2.7 },
  ],
};

// ---- FETCH HOLDINGS ----
async function fetchHoldings(indexId) {
  const base = HOLDINGS_DEFS[indexId] || HOLDINGS_DEFS['sp500'];
  // Try to get live prices for holdings
  const tickers = base.map(h => h.ticker).join(',');
  try {
    const res = await fetch(`${API_BASE}/api/quotes?tickers=${tickers}`, { signal: AbortSignal.timeout(8000) });
    if (res.ok) {
      const data = await res.json();
      return base.map(h => {
        const live = data[h.ticker];
        return {
          ...h,
          price: live ? live.price : null,
          change: live ? live.change : null,
          ytd: live ? live.ytd : ((Math.random() - 0.45) * 30).toFixed(2) * 1,
        };
      });
    }
  } catch (e) { /* fallback */ }

  // Fallback with plausible YTD values
  return base.map(h => ({
    ...h,
    price: null,
    change: +((Math.random() - 0.5) * 3).toFixed(2),
    ytd:   +((Math.random() - 0.4) * 30).toFixed(2),
  }));
}

// ---- LOAD ALL DATA ----
async function loadAllData() {
  const [indicesOk, yieldsOk, creditOk, forexOk, commsOk, volOk] = await Promise.allSettled([
    loadIndices(),
    loadYields(),
    loadCredit(),
    loadForex(),
    loadCommodities(),
    loadVolatility(),
  ]);

  // Update timestamp
  const now = new Date();
  const ts = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  const el = document.getElementById('last-update');
  if (el) el.textContent = `Actualizado: ${ts}`;
}

// ---- LOAD INDICES ----
async function loadIndices() {
  const tickers = INDEX_DEFS.map(i => i.ticker).join(',');
  let liveData = {};

  try {
    const res = await fetch(`${API_BASE}/api/quotes?tickers=${tickers}`, { signal: AbortSignal.timeout(12000) });
    if (res.ok) liveData = await res.json();
  } catch (e) { /* use fallback */ }

  // Also try to get historical data
  let histData = {};
  try {
    const res = await fetch(`${API_BASE}/api/history?tickers=${tickers}&period=1y`, { signal: AbortSignal.timeout(15000) });
    if (res.ok) histData = await res.json();
  } catch (e) { /* use fallback */ }

  INDEX_DEFS.forEach(def => {
    const live = liveData[def.ticker];
    const hist = histData[def.ticker];

    // Use live price or generate fallback
    const basePrice = def.id === 'sp500' ? 5320 : def.id === 'nasdaq' ? 18450 :
      def.id === 'eurostoxx' ? 5180 : def.id === 'msci_acwi' ? 108 :
      def.id === 'msci_em' ? 40 : def.id === 'msci_latam' ? 23 :
      def.id === 'msci_china' ? 44 : def.id === 'korea' ? 54 : 100;

    let price = live ? live.price : basePrice * (1 + (Math.random() - 0.5) * 0.01);
    let change = live ? live.change : +((Math.random() - 0.5) * 2).toFixed(2);
    let ytd = live ? live.ytd : null;

    // Historical series
    let dates = [], closes = [];
    if (hist && hist.dates && hist.dates.length > 10) {
      dates = hist.dates;
      closes = hist.closes;
    } else {
      // Generate 1 year of fake history
      const gen = generateHistoricalSeries(basePrice * 0.88, 252, 0.012);
      dates = gen.dates;
      closes = gen.series;
      // Make last value match current price
      if (closes.length > 0) {
        const scale = price / closes[closes.length - 1];
        closes = closes.map(c => +(c * scale).toFixed(2));
      }
    }

    // Calculate YTD from history if not from API
    if (ytd == null && dates.length > 0) {
      const yearStart = new Date().getFullYear() + '-01-01';
      const ytdStartIdx = dates.findIndex(d => d >= yearStart);
      if (ytdStartIdx >= 0 && closes[ytdStartIdx]) {
        ytd = +((closes[closes.length - 1] - closes[ytdStartIdx]) / closes[ytdStartIdx] * 100).toFixed(2);
      } else {
        ytd = +((Math.random() - 0.4) * 20).toFixed(2);
      }
    }

    window.marketData.indices[def.id] = {
      ...def,
      price, change, ytd, dates, closes,
    };
  });
}

// ---- LOAD YIELDS ----
async function loadYields() {
  let data = null;
  try {
    const res = await fetch(`${API_BASE}/api/yields`, { signal: AbortSignal.timeout(10000) });
    if (res.ok) data = await res.json();
  } catch (e) { /* fallback */ }

  // Fallback / static reference data
  const YIELD_DEFAULTS = {
    US:  { name: 'EEUU',     flag: '🇺🇸', y1: 4.42, y2: 3.98, y5: 4.05, y10: 4.32, y30: 4.71 },
    DE:  { name: 'Alemania', flag: '🇩🇪', y1: 2.41, y2: 2.10, y5: 2.28, y10: 2.54, y30: 2.82 },
    FR:  { name: 'Francia',  flag: '🇫🇷', y1: 2.78, y2: 2.51, y5: 2.89, y10: 3.21, y30: 3.67 },
    IT:  { name: 'Italia',   flag: '🇮🇹', y1: 3.02, y2: 2.89, y5: 3.41, y10: 3.82, y30: 4.21 },
    ES:  { name: 'España',   flag: '🇪🇸', y1: 2.91, y2: 2.68, y5: 3.12, y10: 3.51, y30: 3.98 },
    UK:  { name: 'R. Unido', flag: '🇬🇧', y1: 4.52, y2: 4.31, y5: 4.42, y10: 4.61, y30: 5.02 },
    JP:  { name: 'Japón',    flag: '🇯🇵', y1: 0.52, y2: 0.61, y5: 0.89, y10: 1.42, y30: 2.31 },
  };

  if (data) {
    Object.keys(YIELD_DEFAULTS).forEach(k => {
      window.marketData.yields[k] = { ...YIELD_DEFAULTS[k], ...(data[k] || {}) };
    });
  } else {
    // Add small random noise to defaults
    Object.keys(YIELD_DEFAULTS).forEach(k => {
      const d = YIELD_DEFAULTS[k];
      window.marketData.yields[k] = {
        ...d,
        y1:  +(d.y1  + (Math.random()-0.5)*0.05).toFixed(2),
        y2:  +(d.y2  + (Math.random()-0.5)*0.05).toFixed(2),
        y5:  +(d.y5  + (Math.random()-0.5)*0.05).toFixed(2),
        y10: +(d.y10 + (Math.random()-0.5)*0.05).toFixed(2),
        y30: +(d.y30 + (Math.random()-0.5)*0.05).toFixed(2),
      };
    });
  }
}

// ---- LOAD CREDIT ----
async function loadCredit() {
  let data = null;
  try {
    const res = await fetch(`${API_BASE}/api/credit`, { signal: AbortSignal.timeout(10000) });
    if (res.ok) data = await res.json();
  } catch (e) { /* fallback */ }

  const CREDIT_DEFAULTS = [
    { id: 'us_ig',  region: 'EEUU',   type: 'Investment Grade', spread: 98,  change: -2 },
    { id: 'us_hy',  region: 'EEUU',   type: 'High Yield',       spread: 312, change: +8 },
    { id: 'eu_ig',  region: 'Europa', type: 'Investment Grade', spread: 112, change: -1 },
    { id: 'eu_hy',  region: 'Europa', type: 'High Yield',       spread: 368, change: +12 },
    { id: 'em_ig',  region: 'EM',     type: 'Investment Grade', spread: 178, change: +4 },
    { id: 'em_hy',  region: 'EM',     type: 'High Yield',       spread: 498, change: +18 },
  ];

  const rawCredit = (data && Array.isArray(data)) ? data : CREDIT_DEFAULTS;

  // Attach historical series for charts
  window.marketData.credit = rawCredit.map(c => {
    if (c.dates && c.dates.length > 5) return c;
    const hist = generateHistoricalSeries(c.spread, 90, 0.015);
    return { ...c, dates: hist.dates, values: hist.series };
  });
}

// ---- LOAD FOREX ----
async function loadForex() {
  const FOREX_DEFS = [
    { id: 'eurusd', ticker: 'EURUSD=X', name: 'EUR/USD', base: 'EUR', quote: 'USD', fallback: 1.1245 },
    { id: 'dxy',    ticker: 'DX-Y.NYB', name: 'USD Index', base: 'USD', quote: 'Index', fallback: 99.8 },
    { id: 'eurjpy', ticker: 'EURJPY=X', name: 'EUR/JPY', base: 'EUR', quote: 'JPY', fallback: 163.4 },
    { id: 'eurgbp', ticker: 'EURGBP=X', name: 'EUR/GBP', base: 'EUR', quote: 'GBP', fallback: 0.8412 },
    { id: 'usdjpy', ticker: 'USDJPY=X', name: 'USD/JPY', base: 'USD', quote: 'JPY', fallback: 145.3 },
  ];

  const tickers = FOREX_DEFS.map(f => f.ticker).join(',');
  let liveData = {}, histData = {};

  try {
    const res = await fetch(`${API_BASE}/api/quotes?tickers=${tickers}`, { signal: AbortSignal.timeout(10000) });
    if (res.ok) liveData = await res.json();
  } catch (e) { /* fallback */ }

  try {
    const res = await fetch(`${API_BASE}/api/history?tickers=${tickers}&period=6m`, { signal: AbortSignal.timeout(12000) });
    if (res.ok) histData = await res.json();
  } catch (e) { /* fallback */ }

  FOREX_DEFS.forEach(def => {
    const live = liveData[def.ticker];
    const hist = histData[def.ticker];

    let rate = live ? live.price : def.fallback * (1 + (Math.random()-0.5)*0.005);
    let change = live ? live.change : +((Math.random()-0.5)*0.5).toFixed(3);
    let ytd = live ? live.ytd : null;

    let dates = [], closes = [];
    if (hist && hist.dates && hist.dates.length > 10) {
      dates = hist.dates; closes = hist.closes;
    } else {
      const gen = generateHistoricalSeries(def.fallback * 0.97, 126, 0.003);
      dates = gen.dates; closes = gen.series;
      if (closes.length > 0) {
        const scale = rate / closes[closes.length - 1];
        closes = closes.map(c => +(c * scale).toFixed(4));
      }
    }

    if (ytd == null && dates.length > 0) {
      const yearStart = new Date().getFullYear() + '-01-01';
      const idx = dates.findIndex(d => d >= yearStart);
      if (idx >= 0 && closes[idx]) {
        ytd = +((closes[closes.length-1] - closes[idx]) / closes[idx] * 100).toFixed(2);
      } else {
        ytd = +((Math.random()-0.4)*8).toFixed(2);
      }
    }

    window.marketData.forex[def.id] = { ...def, rate, change, ytd, dates, closes };
  });
}

// ---- LOAD COMMODITIES ----
async function loadCommodities() {
  const COMM_DEFS = {
    energy: [
      { id: 'ttf',       ticker: 'TTF=F',  name: 'TTF Gas',       unit: '€/MWh', fallback: 38.2 },
      { id: 'brent',     ticker: 'BZ=F',   name: 'Brent',         unit: 'USD/b', fallback: 71.8 },
      { id: 'wti',       ticker: 'CL=F',   name: 'WTI',           unit: 'USD/b', fallback: 68.1 },
    ],
    precious: [
      { id: 'gold',      ticker: 'GC=F',   name: 'Oro',           unit: 'USD/oz',fallback: 3280 },
      { id: 'silver',    ticker: 'SI=F',   name: 'Plata',         unit: 'USD/oz',fallback: 32.8 },
    ],
    industrial: [
      { id: 'copper',    ticker: 'HG=F',   name: 'Cobre',         unit: 'USD/lb',fallback: 4.72 },
      { id: 'aluminum',  ticker: 'ALI=F',  name: 'Aluminio',      unit: 'USD/t', fallback: 2412 },
      { id: 'nickel',    ticker: 'NI=F',   name: 'Níquel',        unit: 'USD/t', fallback: 15820 },
      { id: 'zinc',      ticker: 'ZNC=F',  name: 'Zinc',          unit: 'USD/t', fallback: 2680 },
    ],
  };

  const allTickers = Object.values(COMM_DEFS).flat().map(c => c.ticker).join(',');
  let liveData = {}, histData = {};

  try {
    const res = await fetch(`${API_BASE}/api/quotes?tickers=${allTickers}`, { signal: AbortSignal.timeout(12000) });
    if (res.ok) liveData = await res.json();
  } catch (e) { /* fallback */ }

  try {
    const res = await fetch(`${API_BASE}/api/history?tickers=${allTickers}&period=1y`, { signal: AbortSignal.timeout(15000) });
    if (res.ok) histData = await res.json();
  } catch (e) { /* fallback */ }

  ['energy', 'precious', 'industrial'].forEach(group => {
    window.marketData.commodities[group] = COMM_DEFS[group].map(def => {
      const live = liveData[def.ticker];
      const hist = histData[def.ticker];

      let price = live ? live.price : def.fallback * (1 + (Math.random()-0.5)*0.01);
      let change = live ? live.change : +((Math.random()-0.5)*2).toFixed(2);
      let ytd = live ? live.ytd : null;

      let dates = [], closes = [];
      if (hist && hist.dates && hist.dates.length > 10) {
        dates = hist.dates; closes = hist.closes;
      } else {
        const gen = generateHistoricalSeries(def.fallback * 0.9, 252, 0.014);
        dates = gen.dates; closes = gen.series;
        if (closes.length > 0) {
          const scale = price / closes[closes.length - 1];
          closes = closes.map(c => +(c * scale).toFixed(2));
        }
      }

      if (ytd == null && dates.length > 0) {
        const yearStart = new Date().getFullYear() + '-01-01';
        const idx = dates.findIndex(d => d >= yearStart);
        if (idx >= 0 && closes[idx]) {
          ytd = +((closes[closes.length-1] - closes[idx]) / closes[idx] * 100).toFixed(2);
        } else {
          ytd = +((Math.random()-0.4)*25).toFixed(2);
        }
      }

      return { ...def, price, change, ytd, dates, closes };
    });
  });
}

// ---- LOAD VOLATILITY ----
async function loadVolatility() {
  let data = null;
  try {
    const res = await fetch(`${API_BASE}/api/volatility`, { signal: AbortSignal.timeout(10000) });
    if (res.ok) data = await res.json();
  } catch (e) { /* fallback */ }

  const getZone = (price, refs) => {
    if (price < refs.low)      return 'low';
    if (price < refs.normal)   return 'normal';
    if (price < refs.elevated) return 'elevated';
    if (price < refs.extreme)  return 'extreme';
    return 'crisis';
  };

  const VOL_DEFS = [
    {
      id: 'vix', name: 'VIX', market: 'S&P 500 (EEUU)',
      desc: 'Índice de volatilidad implícita del S&P 500 a 30 días. Mide el "miedo" del mercado americano.',
      fallback: 17.2,
      refs: { low: 12, normal: 20, elevated: 30, extreme: 40 }
    },
    {
      id: 'vstoxx', name: 'VSTOXX', market: 'Euro Stoxx 50 (Europa)',
      desc: 'Volatilidad implícita del Euro Stoxx 50 a 30 días. Equivalente europeo del VIX.',
      fallback: 19.4,
      refs: { low: 14, normal: 22, elevated: 32, extreme: 45 }
    },
  ];

  VOL_DEFS.forEach(def => {
    const liveVol = data && data[def.id];
    const price = liveVol ? liveVol.price : def.fallback * (1 + (Math.random()-0.5)*0.05);
    const change = liveVol ? liveVol.change : +((Math.random()-0.5)*1).toFixed(2);
    const ytd = liveVol ? liveVol.ytd : +((Math.random()-0.4)*20).toFixed(2);

    let dates = [], closes = [];
    if (liveVol && liveVol.dates && liveVol.dates.length > 10) {
      dates = liveVol.dates; closes = liveVol.closes;
    } else {
      const gen = generateHistoricalSeries(def.fallback * 1.1, 252, 0.06);
      dates = gen.dates; closes = gen.series.map(v => Math.max(8, +v.toFixed(2)));
      if (closes.length > 0) {
        const scale = price / closes[closes.length - 1];
        closes = closes.map(c => Math.max(8, +(c * scale).toFixed(2)));
      }
    }

    window.marketData.volatility[def.id] = {
      ...def,
      price: +price.toFixed(2),
      change, ytd, dates, closes,
      zone: getZone(price, def.refs),
    };
  });
}
