/* ============================================================
   BBG-IMPORT.JS — Importación Bloomberg desde DAtos_Claude.xlsx
   Estructura: fila ticker en fila 3 o 4, datos desde fila 4/5/6
   Columnas alternadas: col_impar = fecha, col_par = valor
   ============================================================ */

// ---- MAPEO TICKERS BBG → marketData ----
const BBG_MAP = {
  // Bolsa valores (fila ticker=3, datos desde fila 4)
  'NDX Index':             { section:'indices',    id:'nasdaq'     },
  'SPX Index':             { section:'indices',    id:'sp500'      },
  'SX5E Index':            { section:'indices',    id:'eurostoxx'  },
  'MXWD Index':            { section:'indices',    id:'msci_acwi'  },
  'NKY Index':             { section:'indices',    id:'nikkei'     },
  'MXEF Index':            { section:'indices',    id:'msci_em'    },
  'MXLA Index':            { section:'indices',    id:'msci_latam' },
  'MXCN Index':            { section:'indices',    id:'msci_china' },
  'VIX Index':             { section:'volatility', id:'vix'        },
  'V2X Index':             { section:'volatility', id:'vstoxx'     },
  // Div. valores (fila ticker=4, datos desde fila 6)
  'EURUSD BGN Curncy':     { section:'forex',      id:'eurusd'     },
  'DXY Curncy':            { section:'forex',      id:'dxy'        },
  'EURJPY BGN Curncy':     { section:'forex',      id:'eurjpy'     },
  'USDJPY BGN Curncy':     { section:'forex',      id:'usdjpy'     },
  // MMPP valores (fila ticker=4, datos desde fila 6)
  'XAU BGN Curncy':        { section:'commodities', group:'precious',   id:'gold'   },
  'XAG BGN Curncy':        { section:'commodities', group:'precious',   id:'silver' },
  'CO1 Comdty':            { section:'commodities', group:'energy',     id:'brent'  },
  'CL1 Comdty':            { section:'commodities', group:'energy',     id:'wti'    },
  'TTFG1MON SPEC Index':   { section:'commodities', group:'energy',     id:'ttf'    },
  'NG1 COMB Comdty':       { section:'commodities', group:'energy',     id:'natgas' },
  // tipos valores (fila ticker=4, datos desde fila 6 — fila 5 corrupta)
  'USGG2YR Index':         { section:'yields', country:'US', tenor:'y2'  },
  'USGG5YR Index':         { section:'yields', country:'US', tenor:'y5'  },
  'USGG10YR Index':        { section:'yields', country:'US', tenor:'y10' },
  'USGG30YR Index':        { section:'yields', country:'US', tenor:'y30' },
  'GDBR2 Index':           { section:'yields', country:'DE', tenor:'y2'  },
  'GDBR5 Index':           { section:'yields', country:'DE', tenor:'y5'  },
  'GDBR10 Index':          { section:'yields', country:'DE', tenor:'y10' },
  'GDBR30 Index':          { section:'yields', country:'DE', tenor:'y30' },
  'GJGB2 Index':           { section:'yields', country:'JP', tenor:'y2'  },
  'GJGB10 Index':          { section:'yields', country:'JP', tenor:'y10' },
  'GJGB30 Index':          { section:'yields', country:'JP', tenor:'y30' },
  'GUKG2 Index':           { section:'yields', country:'UK', tenor:'y2'  },
  'GUKG10 Index':          { section:'yields', country:'UK', tenor:'y10' },
  'GUKG30 Index':          { section:'yields', country:'UK', tenor:'y30' },
  // spread valores (fila ticker=4, datos desde fila 5)
  'CDX IG CDSI GEN 5Y Corp':      { section:'credit', id:'us_ig' },
  'CDX HY CDSI GEN 5Y SPRD Corp': { section:'credit', id:'us_hy' },
  'ITRX EUR CDSI GEN 5Y Corp':    { section:'credit', id:'eu_ig' },
  'ITRX XOVER CDSI GEN 5Y Corp':  { section:'credit', id:'eu_hy' },
};

// PER — valoración valores
const BBG_PER_MAP = {
  'NDX Index':'nasdaq', 'SPX Index':'sp500', 'SX5E Index':'eurostoxx',
  'MXWD Index':'msci_acwi', 'NKY Index':'nikkei', 'MXEF Index':'msci_em',
  'MXLA Index':'msci_latam', 'MXCN Index':'msci_china',
};

// ---- PARSE DATE CELL ----
// SheetJS con cellDates:true devuelve objetos Date o strings ISO
function parseDateCell(cell) {
  if (!cell) return null;
  if (cell instanceof Date) {
    if (isNaN(cell.getTime())) return null;
    // Filter out Excel's epoch artifacts (before 1990)
    if (cell.getFullYear() < 1990) return null;
    return cell.toISOString().slice(0, 10);
  }
  if (typeof cell === 'string') {
    const m = cell.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (m) return cell.slice(0, 10);
  }
  return null;
}

// ---- PARSE ONE SHEET ----
// Returns: { ticker: { dates:[], values:[] }, ... }
function parseSheet(sheet, allMaps) {
  const data = XLSX.utils.sheet_to_json(sheet, { header:1, defval:null, raw:false, cellDates:true });
  if (!data || data.length < 3) return {};

  // 1. Find the ticker row (first row that has a known ticker)
  let tickerRowIdx = -1;
  let colMap = {}; // colIndex → ticker string

  for (let i = 0; i < Math.min(data.length, 8); i++) {
    const row = data[i];
    if (!row) continue;
    const found = {};
    row.forEach((cell, col) => {
      if (typeof cell === 'string') {
        const t = cell.trim();
        if (allMaps[t]) found[col] = t;
      }
    });
    if (Object.keys(found).length > 0) {
      tickerRowIdx = i;
      colMap = found;
      break;
    }
  }

  if (tickerRowIdx === -1 || Object.keys(colMap).length === 0) return {};

  // 2. Read data rows: each ticker is in colMap[col], value is in col+1
  const series = {};
  Object.values(colMap).forEach(t => { series[t] = { dates:[], values:[] }; });

  for (let i = tickerRowIdx + 1; i < data.length; i++) {
    const row = data[i];
    if (!row) continue;

    Object.entries(colMap).forEach(([colStr, ticker]) => {
      const col = parseInt(colStr);
      const dateCell = row[col];
      const valCell  = row[col + 1];

      const dateStr = parseDateCell(dateCell);
      if (!dateStr) return;

      const val = (typeof valCell === 'number') ? valCell
                : (typeof valCell === 'string') ? parseFloat(valCell)
                : null;
      if (val === null || isNaN(val)) return;

      series[ticker].dates.push(dateStr);
      series[ticker].values.push(+val.toFixed(4));
    });
  }

  // Remove empty series
  Object.keys(series).forEach(t => {
    if (series[t].dates.length === 0) delete series[t];
  });

  return series;
}

// ---- PARSE FULL WORKBOOK ----
function parseBBGExcel(workbook) {
  const log = [];
  const result = {
    indices:{}, forex:{}, commodities:{}, yields:{},
    credit:[], volatility:{}, per:{},
    _bbgImport: true,
  };

  // Combine all maps for the parser
  const allMaps = { ...BBG_MAP };
  Object.keys(BBG_PER_MAP).forEach(k => { if (!allMaps[k]) allMaps[k] = { section:'per', id: BBG_PER_MAP[k] }; });

  const SHEET_CONFIG = {
    'Bolsa valores':      BBG_MAP,
    'Div. valores':       BBG_MAP,
    'MMPP valores':       BBG_MAP,
    'tipos valores':      BBG_MAP,
    'spread valores':     BBG_MAP,
    'valoración valores': { ...allMaps },
  };

  Object.entries(SHEET_CONFIG).forEach(([sheetName, mapToUse]) => {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) { log.push(`⚠ Hoja "${sheetName}" no encontrada`); return; }

    const series = parseSheet(sheet, mapToUse);
    const count = Object.keys(series).length;
    log.push(`📄 ${sheetName}: ${count} series`);

    Object.entries(series).forEach(([ticker, s]) => {
      if (s.dates.length === 0) return;

      const mapping = mapToUse[ticker];
      if (!mapping) return;

      const lastVal = s.values[s.values.length - 1];

      // YTD: desde 1-ene del año en curso
      const yearStart = new Date().getFullYear() + '-01-01';
      let ytd = null;
      const ytdIdx = s.dates.findIndex(d => d >= yearStart);
      if (ytdIdx >= 0 && s.values[ytdIdx]) {
        ytd = +((lastVal - s.values[ytdIdx]) / Math.abs(s.values[ytdIdx]) * 100).toFixed(2);
      }

      log.push(`  ✓ ${ticker} = ${lastVal} (${s.dates.length} pts, YTD: ${ytd != null ? ytd+'%' : 'n/a'})`);

      if (mapping.section === 'per') {
        result.per[mapping.id] = lastVal;
      } else if (mapping.section === 'indices') {
        result.indices[mapping.id] = { price:lastVal, ytd, dates:s.dates, closes:s.values };
      } else if (mapping.section === 'volatility') {
        result.volatility[mapping.id] = { price:+lastVal.toFixed(2), ytd, dates:s.dates, closes:s.values };
      } else if (mapping.section === 'forex') {
        result.forex[mapping.id] = { rate:lastVal, ytd, dates:s.dates, closes:s.values };
      } else if (mapping.section === 'commodities') {
        if (!result.commodities[mapping.group]) result.commodities[mapping.group] = {};
        result.commodities[mapping.group][mapping.id] = { price:lastVal, ytd, dates:s.dates, closes:s.values };
      } else if (mapping.section === 'yields') {
        if (!result.yields[mapping.country]) result.yields[mapping.country] = {};
        result.yields[mapping.country][mapping.tenor] = lastVal;
        if (mapping.tenor === 'y10') {
          result.yields[mapping.country]._series10y = { dates:s.dates, values:s.values };
        }
      } else if (mapping.section === 'credit') {
        result.credit.push({ id:mapping.id, spread:Math.round(lastVal), dates:s.dates, values:s.values });
      }
    });
  });

  result._log = log;
  return result;
}

// ---- APLICAR AL MARKETDATA ----
function applyBBGUpdates(updates) {
  const md = window.marketData;

  // Indices
  Object.entries(updates.indices).forEach(([id, data]) => {
    if (!md.indices[id]) return;
    Object.assign(md.indices[id], data);
    if (data.closes && data.closes.length >= 2) {
      const prev = data.closes[data.closes.length - 2];
      const last = data.closes[data.closes.length - 1];
      md.indices[id].change = prev ? +((last - prev) / prev * 100).toFixed(2) : 0;
    }
  });

  // PER
  Object.entries(updates.per).forEach(([id, per]) => {
    if (md.indices[id]) md.indices[id].per = +per.toFixed(1);
  });

  // Forex
  Object.entries(updates.forex).forEach(([id, data]) => {
    if (md.forex[id]) Object.assign(md.forex[id], data);
  });

  // Commodities
  ['energy','precious','industrial'].forEach(group => {
    if (!updates.commodities[group]) return;
    Object.entries(updates.commodities[group]).forEach(([id, data]) => {
      const item = md.commodities[group]?.find(c => c.id === id);
      if (item) Object.assign(item, data);
    });
  });

  // Yields
  Object.entries(updates.yields).forEach(([country, data]) => {
    if (!md.yields[country]) return;
    const { _series10y, ...tenors } = data;
    Object.assign(md.yields[country], tenors);
    if (_series10y) {
      if (!window.yield10yData) window.yield10yData = {};
      window.yield10yData[country] = { dates:_series10y.dates, values:_series10y.values };
    }
  });

  // Credit
  updates.credit.forEach(u => {
    const existing = md.credit.find(c => c.id === u.id);
    if (existing) { existing.spread = u.spread; existing.dates = u.dates; existing.values = u.values; }
    else md.credit.push(u);
  });

  // Volatility
  Object.entries(updates.volatility).forEach(([id, data]) => {
    if (!md.volatility[id]) return;
    Object.assign(md.volatility[id], data);
    if (data.closes && data.closes.length >= 2) {
      const prev = data.closes[data.closes.length - 2];
      const last = data.closes[data.closes.length - 1];
      md.volatility[id].change = +(last - prev).toFixed(2);
    }
    const refs = md.volatility[id].refs;
    if (refs) {
      const p = data.price;
      md.volatility[id].zone = p < refs.low ? 'low' : p < refs.normal ? 'normal' : p < refs.elevated ? 'elevated' : p < refs.extreme ? 'extreme' : 'crisis';
    }
  });

  md._bbgImport = true;
  md._bbgImportTime = new Date().toLocaleTimeString('es-ES', { hour:'2-digit', minute:'2-digit' });
}

// ---- UI ----
function initBBGImport() {
  const refreshBtn = document.querySelector('.refresh-btn');
  if (!refreshBtn) return;

  const btn = document.createElement('button');
  btn.className = 'refresh-btn';
  btn.innerHTML = '📊 BBG';
  btn.style.cssText = 'background:#367B35;margin-left:8px;';
  btn.onclick = openBBGImportModal;
  refreshBtn.parentNode.insertBefore(btn, refreshBtn.nextSibling);

  document.body.insertAdjacentHTML('beforeend', `
    <div id="bbg-modal" style="display:none;position:fixed;inset:0;z-index:9999;align-items:center;justify-content:center;background:rgba(6,20,40,0.75);backdrop-filter:blur(4px);">
      <div style="background:#f0f4f8;border-radius:16px;width:540px;max-width:95vw;box-shadow:0 24px 64px rgba(0,0,0,0.3);overflow:hidden;">
        <div style="background:#062D3F;color:#e8edf5;padding:20px 24px;display:flex;align-items:center;justify-content:space-between;">
          <div>
            <h3 style="margin:0 0 2px;font-size:16px;font-weight:600;">📊 Importar Bloomberg</h3>
            <div style="font-size:11px;color:#7A9BAD;">DAtos_Claude.xlsx</div>
          </div>
          <button onclick="closeBBGModal()" style="background:none;border:none;color:#e8edf5;font-size:20px;cursor:pointer;line-height:1;padding:0;">✕</button>
        </div>
        <div style="padding:24px;">
          <p style="color:#2A5A72;font-size:13px;line-height:1.6;margin:0 0 18px;">
            Carga las hojas de <strong>valores</strong>: Bolsa, Divisas, MMPP, Tipos, Spreads y Valoración.<br>
            Se actualizarán precios, series históricas, YTD y PER en todo el dashboard.
          </p>
          <div id="bbg-drop" onclick="document.getElementById('bbg-file').click()"
            style="border:2px dashed #0085CA;border-radius:12px;padding:28px 24px;text-align:center;cursor:pointer;background:#fff;transition:all .2s;">
            <div style="font-size:36px;margin-bottom:8px;">📂</div>
            <div style="color:#062D3F;font-weight:500;font-size:14px;">Arrastra aquí o haz clic</div>
            <div style="color:#7A9BAD;font-size:11px;margin-top:4px;">DAtos_Claude.xlsx</div>
          </div>
          <input type="file" id="bbg-file" accept=".xlsx,.xls" style="display:none" onchange="handleBBGFile(this.files[0])">
          <div id="bbg-status" style="display:none;margin-top:14px;padding:10px 14px;border-radius:8px;font-size:13px;font-weight:500;"></div>
          <div id="bbg-log" style="display:none;margin-top:10px;background:#fff;border:1px solid #dee2e6;border-radius:8px;padding:12px;max-height:200px;overflow-y:auto;font-size:11px;color:#555;line-height:2;font-family:monospace;"></div>
        </div>
        <div style="padding:14px 24px;background:#e8edf5;display:flex;justify-content:flex-end;gap:10px;">
          <button onclick="closeBBGModal()" style="background:none;border:1px solid #adb5bd;color:#495057;padding:8px 16px;border-radius:8px;cursor:pointer;font-size:13px;">Cancelar</button>
          <button id="bbg-apply-btn" onclick="applyAndClose()" style="display:none;background:#367B35;color:#fff;border:none;padding:8px 18px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;">✓ Aplicar al dashboard</button>
        </div>
      </div>
    </div>
  `);

  const dz = document.getElementById('bbg-drop');
  dz.addEventListener('dragover', e => { e.preventDefault(); dz.style.background='#e3f2fd'; dz.style.borderColor='#367B35'; });
  dz.addEventListener('dragleave', () => { dz.style.background='#fff'; dz.style.borderColor='#0085CA'; });
  dz.addEventListener('drop', e => {
    e.preventDefault(); dz.style.background='#fff'; dz.style.borderColor='#0085CA';
    if (e.dataTransfer.files[0]) handleBBGFile(e.dataTransfer.files[0]);
  });
}

let _pending = null;

function openBBGImportModal() {
  _pending = null;
  ['bbg-status','bbg-log'].forEach(id => document.getElementById(id).style.display = 'none');
  document.getElementById('bbg-apply-btn').style.display = 'none';
  document.getElementById('bbg-file').value = '';
  document.getElementById('bbg-modal').style.display = 'flex';
}
function closeBBGModal() { document.getElementById('bbg-modal').style.display = 'none'; }

async function handleBBGFile(file) {
  if (!file) return;
  const statusEl = document.getElementById('bbg-status');
  const logEl    = document.getElementById('bbg-log');
  const applyBtn = document.getElementById('bbg-apply-btn');

  statusEl.style.cssText = 'display:block;margin-top:14px;padding:10px 14px;border-radius:8px;font-size:13px;font-weight:500;background:#cce5ff;color:#004085;';
  statusEl.textContent = '⏳ Leyendo archivo...';
  logEl.style.display = 'none';
  applyBtn.style.display = 'none';

  try {
    const buf = await file.arrayBuffer();
    const wb  = XLSX.read(buf, { type:'array', cellDates:true });
    const updates = parseBBGExcel(wb);

    const okCount = updates._log.filter(l => l.includes('✓')).length;

    if (okCount === 0) {
      statusEl.style.cssText = 'display:block;margin-top:14px;padding:10px 14px;border-radius:8px;font-size:13px;font-weight:500;background:#f8d7da;color:#721c24;';
      statusEl.textContent = '⚠ No se encontraron datos. ¿Tiene Bloomberg actualizado?';
    } else {
      statusEl.style.cssText = 'display:block;margin-top:14px;padding:10px 14px;border-radius:8px;font-size:13px;font-weight:500;background:#d4edda;color:#155724;';
      statusEl.textContent = `✓ ${okCount} series cargadas correctamente`;
      _pending = updates;
      applyBtn.style.display = 'block';
    }

    logEl.innerHTML = updates._log.map(l => `<div>${l}</div>`).join('');
    logEl.style.display = 'block';

  } catch(e) {
    statusEl.style.cssText = 'display:block;margin-top:14px;padding:10px 14px;border-radius:8px;font-size:13px;font-weight:500;background:#f8d7da;color:#721c24;';
    statusEl.textContent = `✗ Error: ${e.message}`;
    console.error('BBG import error:', e);
  }
}

function applyAndClose() {
  if (!_pending) return;
  applyBBGUpdates(_pending);

  const fns = [
    'renderIndexCards','updateTickerBar','renderCreditCards','renderCreditCharts',
    'renderForexCards','renderForexCharts','renderCommodityCards','renderCommodityCharts',
    'renderYieldTable','renderSlopeChart','renderVolatility','renderYield10yChart',
  ];
  fns.forEach(fn => { if (typeof window[fn] === 'function') window[fn](); });
  if (typeof renderCurveChart === 'function') renderCurveChart(window.selectedCurveCountry || 'US');

  const el = document.getElementById('last-update');
  if (el) el.textContent = `📊 BBG · ${window.marketData._bbgImportTime}`;

  closeBBGModal();

  // Toast
  let toast = document.getElementById('bbg-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'bbg-toast';
    toast.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#367B35;color:#fff;padding:12px 20px;border-radius:10px;font-size:13px;font-weight:500;z-index:9998;box-shadow:0 4px 16px rgba(0,0,0,0.2);transition:opacity .4s;';
    document.body.appendChild(toast);
  }
  const n = _pending._log.filter(l=>l.includes('✓')).length;
  toast.textContent = `✓ Bloomberg aplicado — ${n} series`;
  toast.style.opacity = '1';
  setTimeout(() => toast.style.opacity = '0', 4000);
}

document.addEventListener('DOMContentLoaded', () => {
  if (typeof XLSX !== 'undefined') initBBGImport();
  else setTimeout(() => typeof XLSX !== 'undefined' && initBBGImport(), 1500);
});
