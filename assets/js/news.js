/* ============================================================
   NEWS.JS — Market News via NewsAPI.org
   ============================================================ */

const NEWS_API_KEY = 'd4176b33a2c44707b2c4376667a7a1ae';
const NEWS_API_BASE = 'https://newsapi.org/v2/everything';

const NEWS_QUERIES = [
  { q: 'stock market S&P 500 Wall Street',     category: 'equities',    label: 'Bolsa EEUU' },
  { q: 'Federal Reserve interest rates Fed',   category: 'rates',       label: 'Fed' },
  { q: 'ECB European Central Bank eurozone',   category: 'rates',       label: 'BCE' },
  { q: 'credit spreads high yield bonds',      category: 'credit',      label: 'Crédito' },
  { q: 'oil gold commodities markets',         category: 'commodities', label: 'Mat. Primas' },
  { q: 'GDP inflation macro economy',          category: 'macro',       label: 'Macro' },
  { q: 'Nasdaq tech earnings results',         category: 'equities',    label: 'Tech' },
  { q: 'Euro Stoxx European stocks markets',   category: 'equities',    label: 'Europa' },
];

const SOURCES = 'reuters,bloomberg,cnbc,marketwatch,the-wall-street-journal,financial-times,fortune,business-insider';

const FALLBACK_NEWS = [
  { title: 'La Fed mantiene tipos y señala precaución ante la inflación persistente', summary: 'El FOMC decide mantener los tipos en el rango actual mientras los datos de inflación siguen por encima del objetivo del 2%.', category: 'rates', source: 'Reuters', time: '2h', url: 'https://www.reuters.com/markets/' },
  { title: 'S&P 500 sube impulsado por resultados tecnológicos por encima de expectativas', summary: 'Los principales índices americanos registran avances tras resultados del sector tecnológico que superan las estimaciones del consenso.', category: 'equities', source: 'CNBC', time: '3h', url: 'https://www.cnbc.com/markets/' },
  { title: 'BCE mantiene tipos y señala que el proceso desinflacionario sigue su curso', summary: 'El Banco Central Europeo mantiene sus tipos sin cambios. Lagarde señala que la política monetaria seguirá siendo restrictiva mientras sea necesario.', category: 'rates', source: 'Reuters', time: '5h', url: 'https://www.reuters.com/markets/' },
  { title: 'Los spreads de crédito corporativo se estrechan ante el apetito por el riesgo', summary: 'Los diferenciales del crédito investment grade y high yield registran estrechamiento en Europa y EEUU.', category: 'credit', source: 'MarketWatch', time: '6h', url: 'https://www.marketwatch.com/' },
  { title: 'El oro alcanza nuevos máximos ante la incertidumbre geopolítica', summary: 'El metal precioso continúa su rally ante la incertidumbre geopolítica y las expectativas de recortes de tipos.', category: 'commodities', source: 'Reuters', time: '7h', url: 'https://www.reuters.com/markets/commodities/' },
  { title: 'NVIDIA eleva su guidance anual por la demanda de chips de IA', summary: 'El fabricante de chips supera las estimaciones del consenso con un crecimiento de ingresos superior al 20% interanual.', category: 'equities', source: 'CNBC', time: '8h', url: 'https://www.cnbc.com/technology/' },
  { title: 'PIB EEUU supera expectativas en el primer trimestre del año', summary: 'La economía americana crece por encima de lo esperado, impulsada por el consumo privado y la inversión empresarial.', category: 'macro', source: 'Reuters', time: '9h', url: 'https://www.reuters.com/markets/' },
  { title: 'El cobre sube ante las expectativas de mayor demanda por la transición energética', summary: 'El metal industrial registra avances impulsado por las perspectivas de mayor demanda vinculada a la electrificación global.', category: 'commodities', source: 'Reuters', time: '10h', url: 'https://www.reuters.com/markets/commodities/' },
];

let allNews = [...FALLBACK_NEWS];
let activeFilter = 'all';
let newsLoaded = false;

function timeSince(date) {
  if (!date || isNaN(date)) return '—';
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 60) return 'ahora';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

async function loadNews() {
  if (newsLoaded) {
    renderNews(activeFilter);
    return;
  }

  const grid = document.getElementById('news-grid');
  grid.innerHTML = '<div class="loading"><div class="pulse"></div>Cargando noticias...</div>';

  try {
    // Fetch news via our API server (avoids CORS/426 issues)
    const res = await fetch('https://market-api-ah0l.onrender.com/api/news', { 
      signal: AbortSignal.timeout(15000) 
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.length > 5) {
        allNews = data.map(a => ({
          ...a,
          date: new Date(a.publishedAt || a.date),
          time: timeSince(new Date(a.publishedAt || a.date)),
        }));
        allNews.sort((a, b) => (b.date || 0) - (a.date || 0));
        newsLoaded = true;
      } else {
        allNews = FALLBACK_NEWS;
      }
    } else {
      allNews = FALLBACK_NEWS;
    }
  } catch(e) {
    allNews = FALLBACK_NEWS;
  }

  renderNews(activeFilter);
}

function filterNews(cat, btn) {
  activeFilter = cat;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderNews(cat);
}

function renderNews(cat) {
  const grid = document.getElementById('news-grid');
  const filtered = cat === 'all' ? allNews : allNews.filter(n => n.category === cat);

  if (!filtered.length) {
    grid.innerHTML = '<div class="loading">No hay noticias disponibles para esta categoría</div>';
    return;
  }

  grid.innerHTML = filtered.map(n => {
    const hasLink = n.url && n.url !== '#';
    return `
      <div class="news-card" ${hasLink ? `onclick="window.open('${n.url}','_blank')"` : ''} style="${hasLink ? 'cursor:pointer' : ''}">
        <div class="news-meta">
          <span class="news-cat cat-${n.category}">${catLabel(n.category)}</span>
          <span class="news-time">${n.time}</span>
          ${hasLink ? '<span class="news-link-icon">↗</span>' : ''}
        </div>
        <div class="news-title">${n.title}</div>
        <div class="news-summary">${n.summary}</div>
        <div class="news-source">${n.source}</div>
      </div>
    `;
  }).join('');
}

function catLabel(cat) {
  const map = { macro: 'Macro', equities: 'Bolsa', rates: 'RF', credit: 'Crédito', commodities: 'Mat. Primas' };
  return map[cat] || cat;
}
