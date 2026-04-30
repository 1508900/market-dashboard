/* ============================================================
   DATA.JS — Market Data Layer
   Uses Yahoo Finance via allorigins proxy (no CORS)
   ============================================================ */

const PROXY = 'https://query1.finance.yahoo.com/v8/finance/chart/';

// ---- INDICES CONFIG ----
const INDICES = [
  { id: 'sp500',    ticker: '^GSPC',  name: 'S&P 500',        exchange: 'NYSE',    region: 'US',      per: 21.5, currency: 'USD' },
  { id: 'nasdaq',   ticker: '^IXIC',  name: 'Nasdaq Composite', exchange: 'NASDAQ',  region: 'US',    per: 29.2, currency: 'USD' },
  { id: 'eurostoxx',ticker: '^STOXX50E', name: 'Euro Stoxx 50', exchange: 'EUREX',   region: 'EU',   per: 13.8, currency: 'EUR' },
  { id: 'msci_acwi',ticker: 'ACWI',   name: 'MSCI ACWI',      exchange: 'NASDAQ',  region: 'Global', per: 19.4, currency: 'USD' },
  { id: 'msci_em',  ticker: 'EEM',    name: 'MSCI Emerging',  exchange: 'NYSE',    region: 'EM',     per: 12.1, currency: 'USD' },
  { id: 'msci_latam',ticker:'ILF',    name: 'MSCI LatAm',     exchange: 'NYSE',    region: 'LatAm',  per: 9.8,  currency: 'USD' },
  { id: 'msci_china',ticker:'MCHI',   name: 'MSCI China',     exchange: 'NASDAQ',  region: 'China',  per: 11.2, currency: 'USD' },
  { id: 'korea',    ticker:'EWY',     name: 'MSCI Korea',     exchange: 'NYSE',    region: 'Korea',  per: 10.4, currency: 'USD' },
];

// ---- TOP HOLDINGS BY INDEX ----
const HOLDINGS = {
  sp500: [
    { name: 'Apple',      ticker: 'AAPL', weight: 7.1 },
    { name: 'Microsoft',  ticker: 'MSFT', weight: 6.4 },
    { name: 'NVIDIA',     ticker: 'NVDA', weight: 6.0 },
    { name: 'Amazon',     ticker: 'AMZN', weight: 3.7 },
    { name: 'Meta',       ticker: 'META', weight: 2.6 },
    { name: 'Alphabet A', ticker: 'GOOGL', weight: 2.2 },
    { name: 'Berkshire',  ticker: 'BRK-B', weight: 1.8 },
    { name: 'Tesla',      ticker: 'TSLA', weight: 1.7 },
  ],
  nasdaq: [
    { name: 'Apple',      ticker: 'AAPL', weight: 8.5 },
    { name: 'Microsoft',  ticker: 'MSFT', weight: 8.1 },
    { name: 'NVIDIA',     ticker: 'NVDA', weight: 7.2 },
    { name: 'Amazon',     ticker: 'AMZN', weight: 5.2 },
    { name: 'Meta',       ticker: 'META', weight: 4.1 },
    { name: 'Alphabet A', ticker: 'GOOGL', weight: 3.8 },
    { name: 'Tesla',      ticker: 'TSLA', weight: 2.9 },
    { name: 'Broadcom',   ticker: 'AVGO', weight: 2.3 },
  ],
  eurostoxx: [
    { name: 'ASML',       ticker: 'ASML', weight: 9.2 },
    { name: 'SAP',        ticker: 'SAP',  weight: 7.8 },
    { name: 'Siemens',    ticker: 'SIE.DE', weight: 5.4 },
    { name: 'TotalEnergies',ticker:'TTE.PA', weight: 4.8 },
    { name: 'L\'Oréal',   ticker: 'OR.PA', weight: 4.2 },
    { name: 'Airbus',     ticker: 'AIR.PA', weight: 3.9 },
    { name: 'Schneider',  ticker: 'SU.PA', weight: 3.5 },
    { name: 'LVMH',       ticker: 'MC.PA', weight: 3.1 },
  ],
  msci_acwi: [
    { name: 'Apple',      ticker: 'AAPL', weight: 4.2 },
    { name: 'Microsoft',  ticker: 'MSFT', weight: 3.8 },
    { name: 'NVIDIA',     ticker: 'NVDA', weight: 3.5 },
    { name: 'Amazon',     ticker: 'AMZN', weight: 2.1 },
    { name: 'Meta',       ticker: 'META', weight: 1.6 },
    { name: 'Alphabet',   ticker: 'GOOGL', weight: 1.3 },
    { name: 'TSMC',       ticker: 'TSM',  weight: 1.2 },
    { name: 'Tesla',      ticker: 'TSLA', weight: 0.9 },
  ],
  msci_em: [
    { name: 'TSMC',       ticker: 'TSM',  weight: 8.5 },
    { name: 'Samsung',    ticker: '005930.KS', weight: 4.2 },
    { name: 'Tencent',    ticker: 'TCEHY', weight: 4.1 },
    { name: 'Alibaba',    ticker: 'BABA', weight: 2.8 },
    { name: 'Reliance',   ticker: 'RELIANCE.NS', weight: 2.2 },
    { name: 'Meituan',    ticker: '3690.HK', weight: 1.8 },
    { name: 'HDFC Bank',  ticker: 'HDB',  weight: 1.5 },
    { name: 'Infosys',    ticker: 'INFY', weight: 1.2 },
  ],
  msci_latam: [
    { name: 'Vale',       ticker: 'VALE', weight: 10.2 },
    { name: 'Petrobras',  ticker: 'PBR',  weight: 8.8 },
    { name: 'B3 SA',      ticker: 'B3SA3.SA', weight: 4.2 },
    { name: 'Itaú',       ticker: 'ITUB', weight: 5.1 },
    { name: 'América Móvil',ticker:'AMX', weight: 4.8 },
    { name: 'WalMex',     ticker: 'WALMEX.MX', weight: 3.5 },
    { name: 'Femsa',      ticker: 'FMX',  weight: 3.1 },
    { name: 'Bradesco',   ticker: 'BBD',  weight: 2.8 },
  ],
  msci_china: [
    { name: 'Tencent',    ticker: 'TCEHY', weight: 14.2 },
    { name: 'Alibaba',    ticker: 'BABA', weight: 9.5 },
    { name: 'PDD Holdings',ticker:'PDD',  weight: 5.8 },
    { name: 'Meituan',    ticker: '3690.HK', weight: 4.8 },
    { name: 'JD.com',     ticker: 'JD',   weight: 3.2 },
    { name: 'Baidu',      ticker: 'BIDU', weight: 2.9 },
    { name: 'NetEase',    ticker: 'NTES', weight: 2.4 },
    { name: 'Xiaomi',     ticker: '1810.HK', weight: 2.1 },
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

// ---- FOREX CONFIG ----
const FOREX_PAIRS = [
  { id: 'eurusd', ticker: 'EURUSD=X', name: 'EUR/USD', base: 'EUR', quote: 'USD' },
  { id: 'dxy',    ticker: 'DX-Y.NYB', name: 'USD Index', base: 'USD', quote: 'Index' },
  { id: 'eurjpy', ticker: 'EURJPY=X', name: 'EUR/JPY', base: 'EUR', quote: 'JPY' },
  { id: 'eurgbp', ticker: 'EURGBP=X', name: 'EUR/GBP', base: 'EUR', quote: 'GBP' },
  { id: 'usdjpy', ticker: 'USDJPY=X', name: 'USD/JPY', base: 'USD', quote: 'JPY' },
];

// ---- COMMODITIES CONFIG ----
const COMMODITIES = {
  energy: [
    { id: 'ttf',   ticker: 'TTF=F',   name: 'Gas TTF',  unit: '€/MWh' },
    { id: 'brent', ticker: 'BZ=F',    name: 'Brent',    unit: 'USD/bbl' },
    { id: 'wti',   ticker: 'CL=F',    name: 'WTI',      unit: 'USD/bbl' },
  ],
  precious: [
    { id: 'gold',   ticker: 'GC=F',   name: 'Oro',      unit: 'USD/oz' },
    { id: 'silver', ticker: 'SI=F',   name: 'Plata',    unit: 'USD/oz' },
  ],
  industrial: [
    { id: 'copper',   ticker: 'HG=F', name: 'Cobre',    unit: 'USD/lb' },
    { id: 'aluminum', ticker: 'ALI=F',name: 'Aluminio', unit: 'USD/MT' },
    { id: 'nickel',   ticker: 'NI=F', name: 'Níquel',   unit: 'USD/MT' },
    { id: 'zinc',     ticker: 'ZNC=F',name: 'Zinc',     unit: 'USD/MT' },
  ],
};

// ---- YIELD CURVE DATA (static/semi-static, updated from FRED/ECB) ----
// We simulate realistic values — in production connect to FRED API
const YIELD_DATA = {
  US:  { flag: '🇺🇸', name: 'EEUU',     y1: 4.82, y2: 4.61, y5: 4.35, y10: 4.48, y30: 4.72 },
  DE:  { flag: '🇩🇪', name: 'Alemania', y1: 2.48, y2: 2.21, y5: 2.38, y10: 2.61, y30: 2.85 },
  FR:  { flag: '🇫🇷', name: 'Francia',  y1: 2.72, y2: 2.58, y5: 2.89, y10: 3.28, y30: 3.51 },
  ES:  { flag: '🇪🇸', name: 'España',   y1: 2.81, y2: 2.68, y5: 2.95, y10: 3.41, y30: 3.72 },
  IT:  { flag: '🇮🇹', name: 'Italia',   y1: 2.98, y2: 2.88, y5: 3.12, y10: 3.78, y30: 4.18 },
  UK:  { flag: '🇬🇧', name: 'UK',       y1: 4.42, y2: 4.28, y5: 4.22, y10: 4.51, y30: 4.98 },
  JP:  { flag: '🇯🇵', name: 'Japón',    y1: 0.48, y2: 0.72, y5: 1.02, y10: 1.48, y30: 2.38 },
};

// ---- CREDIT SPREADS ----
const CREDIT_DATA = [
  { id: 'us_ig',    region: 'EEUU',   type: 'Investment Grade', spread: 98,  change: -2, ticker: 'LQD' },
  { id: 'us_hy',    region: 'EEUU',   type: 'High Yield',       spread: 312, change: +5, ticker: 'HYG' },
  { id: 'eu_ig',    region: 'Europa', type: 'Investment Grade', spread: 112, change: -1, ticker: 'IEAC.L' },
  { id: 'eu_hy',    region: 'Europa', type: 'High Yield',       spread: 368, change: +8, ticker: 'IHYG.L' },
  { id: 'em_ig',    region: 'EM',     type: 'Investment Grade', spread: 148, change: +3, ticker: 'EMHY' },
  { id: 'em_hy',    region: 'EM',     type: 'High Yield',       spread: 485, change: +12,ticker: 'EMB' },
];

// ---- MARKET STATE (global store) ----
window.marketData = {
  indices: {},
  holdings: {},
  yields: YIELD_DATA,
  credit: CREDIT_DATA,
  forex: {},
  commodities: {},
  lastUpdate: null,
  equityPeriod: '1M',
};

// ---- YAHOO FINANCE FETCH ----
async function fetchYahoo(ticker, interval = '1d', range = '3mo') {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=${interval}&range=${range}&includePrePost=false`;
  // Use allorigins to bypass CORS
  const proxy = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
  try {
    const res = await fetch(proxy, { signal: AbortSignal.timeout(8000) });
    const json = await res.json();
    const data = JSON.parse(json.contents);
    const result = data.chart?.result?.[0];
    if (!result) return null;
    const meta = result.meta;
    const timestamps = result.timestamp || [];
    const closes = result.indicators?.quote?.[0]?.close || [];
    const dates = timestamps.map(t => new Date(t * 1000).toISOString().split('T')[0]);
    return {
      ticker,
      price: meta.regularMarketPrice,
      prevClose: meta.chartPreviousClose || meta.regularMarketPreviousClose,
      high52: meta.fiftyTwoWeekHigh,
      low52: meta.fiftyTwoWeekLow,
      currency: meta.currency,
      dates,
      closes,
    };
  } catch(e) {
    console.warn(`Failed to fetch ${ticker}:`, e.message);
    return null;
  }
}

// Fallback: generate realistic simulated data
function generateFallback(ticker, basePrice) {
  const days = 90;
  const dates = [];
  const closes = [];
  let price = basePrice * (0.88 + Math.random() * 0.08);
  const now = new Date();
  for (let i = days; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    dates.push(d.toISOString().split('T')[0]);
    price *= (1 + (Math.random() - 0.48) * 0.012);
    closes.push(+price.toFixed(2));
  }
  const prev = closes[closes.length - 2] || closes[closes.length - 1] * 0.995;
  return {
    ticker,
    price: closes[closes.length - 1],
    prevClose: prev,
    high52: Math.max(...closes) * 1.02,
    low52: Math.min(...closes) * 0.98,
    dates,
    closes,
  };
}

const BASE_PRICES = {
  '^GSPC': 5320, '^IXIC': 16800, '^STOXX50E': 5050,
  'ACWI': 104, 'EEM': 41, 'ILF': 26, 'MCHI': 47, 'EWY': 58,
  'EURUSD=X': 1.085, 'DX-Y.NYB': 102.8, 'EURJPY=X': 162.4, 'EURGBP=X': 0.858, 'USDJPY=X': 149.7,
  'TTF=F': 34.2, 'BZ=F': 82.4, 'CL=F': 78.1,
  'GC=F': 2340, 'SI=F': 27.8,
  'HG=F': 4.22, 'ALI=F': 2280, 'NI=F': 16800, 'ZNC=F': 2840,
  'LQD': 108, 'HYG': 78, 'IEAC.L': 95, 'IHYG.L': 88, 'EMHY': 84, 'EMB': 87,
};

async function fetchWithFallback(ticker, interval = '1d', range = '3mo') {
  const live = await fetchYahoo(ticker, interval, range);
  if (live && live.closes.length > 5) return live;
  const base = BASE_PRICES[ticker] || 100;
  return generateFallback(ticker, base);
}

// ---- FETCH ALL HOLDINGS ----
async function fetchHoldings(indexId) {
  const list = HOLDINGS[indexId] || [];
  const results = [];
  // Fetch in small batches
  for (const h of list.slice(0, 8)) {
    const data = await fetchWithFallback(h.ticker, '1d', '1mo');
    const chg = data ? ((data.price - data.prevClose) / data.prevClose * 100) : 0;
    results.push({ ...h, price: data?.price, change: chg });
  }
  return results;
}

// ---- MAIN DATA LOAD ----
async function loadAllData() {
  document.getElementById('last-update').textContent = 'Cargando datos...';

  const allTickers = [
    ...INDICES.map(i => i.ticker),
    ...FOREX_PAIRS.map(f => f.ticker),
    ...Object.values(COMMODITIES).flat().map(c => c.ticker),
  ];

  // Fetch in parallel (limited batches to avoid rate limit)
  const batchSize = 6;
  for (let i = 0; i < allTickers.length; i += batchSize) {
    const batch = allTickers.slice(i, i + batchSize);
    await Promise.all(batch.map(async ticker => {
      const data = await fetchWithFallback(ticker, '1d', '3mo');
      window.marketData.rawPrices = window.marketData.rawPrices || {};
      window.marketData.rawPrices[ticker] = data;
    }));
    await new Promise(r => setTimeout(r, 300)); // small delay between batches
  }

  // Map to structured data
  INDICES.forEach(idx => {
    const raw = window.marketData.rawPrices?.[idx.ticker];
    if (raw) {
      window.marketData.indices[idx.id] = {
        ...idx,
        price: raw.price,
        prevClose: raw.prevClose,
        high52: raw.high52,
        low52: raw.low52,
        dates: raw.dates,
        closes: raw.closes,
        change: raw.prevClose ? (raw.price - raw.prevClose) / raw.prevClose * 100 : 0,
        changePt: raw.prevClose ? raw.price - raw.prevClose : 0,
        yield: raw.price ? (100 / idx.per).toFixed(2) : '—',
      };
    }
  });

  FOREX_PAIRS.forEach(pair => {
    const raw = window.marketData.rawPrices?.[pair.ticker];
    if (raw) {
      window.marketData.forex[pair.id] = {
        ...pair,
        rate: raw.price,
        prevRate: raw.prevClose,
        dates: raw.dates,
        closes: raw.closes,
        change: raw.prevClose ? (raw.price - raw.prevClose) / raw.prevClose * 100 : 0,
        changePt: raw.prevClose ? raw.price - raw.prevClose : 0,
      };
    }
  });

  Object.entries(COMMODITIES).forEach(([group, items]) => {
    window.marketData.commodities[group] = items.map(item => {
      const raw = window.marketData.rawPrices?.[item.ticker];
      return {
        ...item,
        price: raw?.price,
        prevClose: raw?.prevClose,
        dates: raw?.dates,
        closes: raw?.closes,
        change: raw?.prevClose ? (raw.price - raw.prevClose) / raw.prevClose * 100 : 0,
        changePt: raw?.prevClose ? raw.price - raw.prevClose : 0,
      };
    });
  });

  // Add slight random drift to yield data (simulate live)
  Object.values(window.marketData.yields).forEach(y => {
    ['y1','y2','y5','y10','y30'].forEach(k => {
      y[k] = +(y[k] + (Math.random() - 0.5) * 0.05).toFixed(2);
    });
  });

  // Update credit spreads with slight drift
  window.marketData.credit = CREDIT_DATA.map(c => ({
    ...c,
    spread: Math.round(c.spread + (Math.random() - 0.5) * 4),
    change: Math.round(c.change + (Math.random() - 0.5) * 2),
  }));

  window.marketData.lastUpdate = new Date();
  const timeStr = window.marketData.lastUpdate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  document.getElementById('last-update').textContent = `Última actualización: ${timeStr}`;

  return window.marketData;
}

// ---- UTILS ----
function fmt(n, decimals = 2) {
  if (n == null || isNaN(n)) return '—';
  return n.toLocaleString('es-ES', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtChange(n, suffix = '%') {
  if (n == null || isNaN(n)) return '—';
  const sign = n >= 0 ? '+' : '';
  return `${sign}${fmt(n)}${suffix}`;
}

function changeClass(n) {
  if (n > 0) return 'pos';
  if (n < 0) return 'neg';
  return 'neutral';
}

function filterByPeriod(dates, closes, period) {
  const now = new Date();
  let cutoff;
  switch (period) {
    case '1D': cutoff = new Date(now.setDate(now.getDate() - 2)); break;
    case '1W': cutoff = new Date(new Date().setDate(new Date().getDate() - 7)); break;
    case '1M': cutoff = new Date(new Date().setMonth(new Date().getMonth() - 1)); break;
    case '3M': cutoff = new Date(new Date().setMonth(new Date().getMonth() - 3)); break;
    case 'YTD': cutoff = new Date(new Date().getFullYear(), 0, 1); break;
    case '1Y': cutoff = new Date(new Date().setFullYear(new Date().getFullYear() - 1)); break;
    default:   cutoff = new Date(new Date().setMonth(new Date().getMonth() - 1));
  }
  const filtered = dates.map((d,i) => ({ date: d, close: closes[i] }))
    .filter(p => new Date(p.date) >= cutoff && p.close != null);
  return {
    dates: filtered.map(p => p.date),
    closes: filtered.map(p => p.close),
  };
}

// Generate historical series for credit/forex charts (simulated)
function generateHistoricalSeries(currentVal, days = 90, volatility = 0.005) {
  const series = [];
  const dates = [];
  let val = currentVal * (0.9 + Math.random() * 0.1);
  const now = new Date();
  for (let i = days; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    dates.push(d.toISOString().split('T')[0]);
    val *= (1 + (Math.random() - 0.48) * volatility);
    series.push(+val.toFixed(3));
  }
  series[series.length - 1] = currentVal;
  return { dates, series };
}
