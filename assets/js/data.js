/* ============================================================
   DATA.JS — Market Data Layer
   Loads instantly with realistic data, tries live fetch in background
   ============================================================ */

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

const BASE_PRICES = {
  '^GSPC': 5320, '^IXIC': 16800, '^STOXX50E': 5050,
  'ACWI': 104, 'EEM': 41, 'ILF': 26, 'MCHI': 47, 'EWY': 58,
  'EURUSD=X': 1.085, 'DX-Y.NYB': 102.8, 'EURJPY=X': 162.4, 'EURGBP=X': 0.858, 'USDJPY=X': 149.7,
  'TTF=F': 34.2, 'BZ=F': 82.4, 'CL=F': 78.1,
  'GC=F': 2340, 'SI=F': 27.8,
  'HG=F': 4.22, 'ALI=F': 2280, 'NI=F': 16800, 'ZNC=F': 2840,
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

const YIELD_DATA = {
  US: { flag: 'US', name: 'EEUU',     y1: 4.82, y2: 4.61, y5: 4.35, y10: 4.48, y30: 4.72 },
  DE: { flag: 'DE', name: 'Alemania', y1: 2.48, y2: 2.21, y5: 2.38, y10: 2.61, y30: 2.85 },
  FR: { flag: 'FR', name: 'Francia',  y1: 2.72, y2: 2.58, y5: 2.89, y10: 3.28, y30: 3.51 },
  ES: { flag: 'ES', name: 'Espana',   y1: 2.81, y2: 2.68, y5: 2.95, y10: 3.41, y30: 3.72 },
  IT: { flag: 'IT', name: 'Italia',   y1: 2.98, y2: 2.88, y5: 3.12, y10: 3.78, y30: 4.18 },
  UK: { flag: 'UK', name: 'UK',       y1: 4.42, y2: 4.28, y5: 4.22, y10: 4.51, y30: 4.98 },
  JP: { flag: 'JP', name: 'Japon',    y1: 0.48, y2: 0.72, y5: 1.02, y10: 1.48, y30: 2.38 },
};

const CREDIT_BASE = [
  { id: 'us_ig', region: 'EEUU',   type: 'Investment Grade', spread: 98,  change: -2 },
  { id: 'us_hy', region: 'EEUU',   type: 'High Yield',       spread: 312, change: +5 },
  { id: 'eu_ig', region: 'Europa', type: 'Investment Grade', spread: 112, change: -1 },
  { id: 'eu_hy', region: 'Europa', type: 'High Yield',       spread: 368, change: +8 },
  { id: 'em_ig', region: 'EM',     type: 'Investment Grade', spread: 148, change: +3 },
  { id: 'em_hy', region: 'EM',     type: 'High Yield',       spread: 485, change: +12 },
];

window.marketData = {
  indices: {}, holdings: {}, yields: JSON.parse(JSON.stringify(YIELD_DATA)),
  credit: JSON.parse(JSON.stringify(CREDIT_BASE)), forex: {}, commodities: {}, lastUpdate: null,
};

function generateSeries(basePrice, days, volatility) {
  days = days || 90; volatility = volatility || 0.012;
  const dates = [], closes = [];
  let price = basePrice * (0.88 + Math.random() * 0.08);
  const now = new Date();
  for (let i = days; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    dates.push(d.toISOString().split('T')[0]);
    price *= (1 + (Math.random() - 0.47) * volatility);
    closes.push(+price.toFixed(4));
  }
  if (closes.length) closes[closes.length - 1] = basePrice;
  const prevClose = closes.length > 1 ? closes[closes.length - 2] : basePrice * 0.995;
  return { price: basePrice, prevClose, high52: Math.max.apply(null, closes) * 1.02, low52: Math.min.apply(null, closes) * 0.98, dates, closes };
}

function buildSimulatedData() {
  INDICES.forEach(function(idx) {
    const base = BASE_PRICES[idx.ticker] || 100;
    const series = generateSeries(base, 90, 0.012);
    const chg = (series.price - series.prevClose) / series.prevClose * 100;
    window.marketData.indices[idx.id] = Object.assign({}, idx, series, {
      change: +chg.toFixed(2), changePt: +(series.price - series.prevClose).toFixed(2), yield: (100 / idx.per).toFixed(2)
    });
  });
  FOREX_PAIRS.forEach(function(pair) {
    const base = BASE_PRICES[pair.ticker] || 1;
    const series = generateSeries(base, 90, 0.004);
    const chg = (series.price - series.prevClose) / series.prevClose * 100;
    window.marketData.forex[pair.id] = Object.assign({}, pair, {
      rate: series.price, prevRate: series.prevClose, dates: series.dates, closes: series.closes,
      change: +chg.toFixed(3), changePt: +(series.price - series.prevClose).toFixed(4)
    });
  });
  Object.keys(COMMODITIES).forEach(function(group) {
    window.marketData.commodities[group] = COMMODITIES[group].map(function(item) {
      const base = BASE_PRICES[item.ticker] || 100;
      const series = generateSeries(base, 90, 0.015);
      const chg = (series.price - series.prevClose) / series.prevClose * 100;
      return Object.assign({}, item, series, { change: +chg.toFixed(2), changePt: +(series.price - series.prevClose).toFixed(2) });
    });
  });
  Object.keys(HOLDINGS).forEach(function(indexId) {
    window.marketData.holdings[indexId] = HOLDINGS[indexId].map(function(h) {
      return Object.assign({}, h, { change: +((Math.random() - 0.45) * 3).toFixed(2) });
    });
  });
  Object.values(window.marketData.yields).forEach(function(y) {
    ['y1','y2','y5','y10','y30'].forEach(function(k) { y[k] = +(y[k] + (Math.random() - 0.5) * 0.06).toFixed(2); });
  });
  window.marketData.credit = CREDIT_BASE.map(function(c) {
    return Object.assign({}, c, { spread: Math.round(c.spread + (Math.random() - 0.5) * 6), change: Math.round(c.change + (Math.random() - 0.5) * 2) });
  });
  window.marketData.lastUpdate = new Date();
  const timeStr = window.marketData.lastUpdate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  document.getElementById('last-update').textContent = 'Actualizado: ' + timeStr + ' (datos simulados)';
}

async function loadAllData() {
  buildSimulatedData();
  return window.marketData;
}

function fmt(n, decimals) {
  decimals = decimals !== undefined ? decimals : 2;
  if (n == null || isNaN(n)) return '-';
  return n.toLocaleString('es-ES', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtChange(n, suffix) {
  suffix = suffix || '%';
  if (n == null || isNaN(n)) return '-';
  return (n >= 0 ? '+' : '') + fmt(n) + suffix;
}

function changeClass(n) {
  if (n > 0) return 'pos';
  if (n < 0) return 'neg';
  return 'neutral';
}

function filterByPeriod(dates, closes, period) {
  const now = new Date();
  let cutoff = new Date(now);
  if (period === '1D') cutoff.setDate(cutoff.getDate() - 2);
  else if (period === '1W') cutoff.setDate(cutoff.getDate() - 7);
  else if (period === '1M') cutoff.setMonth(cutoff.getMonth() - 1);
  else if (period === '3M') cutoff.setMonth(cutoff.getMonth() - 3);
  else if (period === 'YTD') cutoff = new Date(now.getFullYear(), 0, 1);
  else if (period === '1Y') cutoff.setFullYear(cutoff.getFullYear() - 1);
  else cutoff.setMonth(cutoff.getMonth() - 1);
  const filtered = (dates || []).map(function(d, i) { return { date: d, close: closes[i] }; })
    .filter(function(p) { return p.close != null && new Date(p.date) >= cutoff; });
  return { dates: filtered.map(function(p) { return p.date; }), closes: filtered.map(function(p) { return p.close; }) };
}

function generateHistoricalSeries(currentVal, days, volatility) {
  days = days || 90; volatility = volatility || 0.008;
  const series = [], dates = [];
  let val = currentVal * (0.92 + Math.random() * 0.06);
  const now = new Date();
  for (let i = days; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    dates.push(d.toISOString().split('T')[0]);
    val *= (1 + (Math.random() - 0.48) * volatility);
    series.push(+val.toFixed(3));
  }
  if (series.length) series[series.length - 1] = currentVal;
  return { dates, series };
}

function fetchHoldings(indexId) {
  return Promise.resolve(window.marketData.holdings[indexId] || []);
}
