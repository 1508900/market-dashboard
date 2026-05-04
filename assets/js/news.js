/* ============================================================
   NEWS.JS — Market News via RSS feeds
   ============================================================ */

const RSS2JSON = 'https://api.rss2json.com/v1/api.json?rss_url=';

const RSS_FEEDS = [
  { 
    url: 'https://feeds.reuters.com/reuters/businessNews', 
    source: 'Reuters', 
    cats: ['macro', 'equities'] 
  },
  { 
    url: 'https://feeds.reuters.com/reuters/financialNews', 
    source: 'Reuters Finance', 
    cats: ['rates', 'credit'] 
  },
  { 
    url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html', 
    source: 'CNBC', 
    cats: ['equities', 'macro'] 
  },
  { 
    url: 'https://www.cnbc.com/id/20910258/device/rss/rss.html', 
    source: 'CNBC Markets', 
    cats: ['equities', 'macro'] 
  },
  { 
    url: 'https://feeds.marketwatch.com/marketwatch/topstories/', 
    source: 'MarketWatch', 
    cats: ['equities', 'macro'] 
  },
  { 
    url: 'https://feeds.marketwatch.com/marketwatch/marketpulse/', 
    source: 'MarketWatch Pulse', 
    cats: ['equities', 'macro'] 
  },
  {
    url: 'https://seekingalpha.com/market_currents.xml',
    source: 'Seeking Alpha',
    cats: ['equities', 'macro']
  },
];

const FALLBACK_NEWS = [
  {
    title: 'La Fed mantiene tipos sin cambios y señala precaución ante la inflación persistente',
    summary: 'El Comité Federal de Mercado Abierto (FOMC) ha decidido mantener los tipos de interés en el rango actual, mientras los datos de inflación siguen por encima del objetivo del 2%.',
    category: 'macro', source: 'Reuters', time: '2h', url: 'https://www.reuters.com/business/'
  },
  {
    title: 'S&P 500 sube impulsado por resultados tecnológicos por encima de expectativas',
    summary: 'Los principales índices americanos registran avances tras la publicación de resultados del sector tecnológico que superan las estimaciones del consenso de analistas.',
    category: 'equities', source: 'CNBC', time: '3h', url: 'https://www.cnbc.com/markets/'
  },
  {
    title: 'BCE mantiene tipos y señala que el proceso desinflacionario sigue su curso',
    summary: 'El Banco Central Europeo mantiene sus tipos de referencia sin cambios. Lagarde señala que el proceso desinflacionario avanza pero que la política monetaria seguirá siendo restrictiva.',
    category: 'rates', source: 'Reuters', time: '5h', url: 'https://www.reuters.com/markets/'
  },
  {
    title: 'Los spreads de crédito corporativo se estrechan ante el apetito por el riesgo',
    summary: 'Los diferenciales del crédito investment grade y high yield registran estrechamiento en Europa y EEUU, reflejando el mayor apetito inversor por activos de riesgo.',
    category: 'credit', source: 'MarketWatch', time: '6h', url: 'https://www.marketwatch.com/'
  },
  {
    title: 'El oro alcanza nuevos máximos históricos ante la incertidumbre geopolítica',
    summary: 'El metal precioso continúa su rally ante la incertidumbre geopolítica y las expectativas de recortes de tipos. Los bancos centrales siguen siendo compradores netos.',
    category: 'commodities', source: 'Reuters', time: '7h', url: 'https://www.reuters.com/markets/commodities/'
  },
  {
    title: 'NVIDIA bate previsiones y eleva su guidance anual por la demanda de chips de IA',
    summary: 'El fabricante de chips supera las estimaciones del consenso con un crecimiento de ingresos superior al 20% interanual, impulsado por la fuerte demanda de chips para inteligencia artificial.',
    category: 'equities', source: 'CNBC', time: '8h', url: 'https://www.cnbc.com/technology/'
  },
  {
    title: 'Curva de tipos americana: el diferencial 2-10 años vuelve a terreno positivo',
    summary: 'Tras un período de inversión, la curva de rendimientos americana registra un diferencial positivo, lo que históricamente se ha asociado con una normalización del ciclo económico.',
    category: 'rates', source: 'MarketWatch', time: '9h', url: 'https://www.marketwatch.com/economy-politics/'
  },
  {
    title: 'El petróleo cae ante el aumento de inventarios y la debilidad de la demanda china',
    summary: 'Los futuros del crudo retroceden ante el informe de inventarios que muestra un aumento superior al esperado y la persistente debilidad de la demanda china.',
    category: 'commodities', source: 'Reuters', time: '10h', url: 'https://www.reuters.com/markets/commodities/'
  },
  {
    title: 'Los mercados emergentes registran entradas de capital por tercer mes consecutivo',
    summary: 'Los flujos de inversión hacia mercados emergentes continúan siendo positivos, impulsados por la debilidad del dólar y las expectativas de recortes de tipos en EEUU.',
    category: 'macro', source: 'Seeking Alpha', time: '1d', url: 'https://seekingalpha.com/'
  },
  {
    title: 'ASML reporta sólidos resultados y mantiene su guidance para el año',
    summary: 'El fabricante holandés de equipos de litografía reporta resultados en línea con las expectativas y confirma su guidance para el conjunto del ejercicio.',
    category: 'equities', source: 'Reuters', time: '1d', url: 'https://www.reuters.com/technology/'
  },
  {
    title: 'El Bund alemán a 10 años sube ante los datos de inflación en la eurozona',
    summary: 'La rentabilidad del bono alemán de referencia sube tras la publicación de datos de inflación en la eurozona, que muestran una persistencia mayor de la esperada.',
    category: 'rates', source: 'MarketWatch', time: '1d', url: 'https://www.marketwatch.com/investing/bonds/'
  },
  {
    title: 'El cobre sube ante las expectativas de mayor demanda por la transición energética',
    summary: 'El metal industrial registra avances impulsado por las perspectivas de mayor demanda a largo plazo vinculada a la electrificación y la transición energética global.',
    category: 'commodities', source: 'Reuters', time: '2d', url: 'https://www.reuters.com/markets/commodities/'
  },
];

let allNews = [...FALLBACK_NEWS];
let activeFilter = 'all';

async function fetchRSSFeed(feed) {
  try {
    const url = `${RSS2JSON}${encodeURIComponent(feed.url)}&count=6&api_key=`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    const json = await res.json();
    if (json.status !== 'ok' || !json.items) return [];
    
    return json.items.map(item => {
      const summary = (item.description || item.content || '')
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 220);
      
      return {
        title: item.title || 'Sin título',
        summary: summary ? summary + '...' : '',
        category: feed.cats[0],
        source: feed.source,
        time: timeSince(new Date(item.pubDate)),
        url: item.link || item.guid || '#',
        date: new Date(item.pubDate),
      };
    });
  } catch(e) {
    return [];
  }
}

async function fetchAllNews() {
  const results = [];
  
  // Fetch feeds in parallel
  const promises = RSS_FEEDS.map(feed => fetchRSSFeed(feed));
  const allResults = await Promise.allSettled(promises);
  
  allResults.forEach(result => {
    if (result.status === 'fulfilled') {
      results.push(...result.value);
    }
  });
  
  // Sort by date (newest first)
  results.sort((a, b) => (b.date || 0) - (a.date || 0));
  
  return results;
}

function timeSince(date) {
  if (!date || isNaN(date)) return '—';
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 60) return 'ahora';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

async function loadNews() {
  const grid = document.getElementById('news-grid');
  grid.innerHTML = '<div class="loading"><div class="pulse"></div>Cargando noticias...</div>';
  
  try {
    const liveNews = await fetchAllNews();
    if (liveNews.length > 3) {
      allNews = liveNews;
    } else {
      // Use fallback but with real URLs
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
    grid.innerHTML = '<div class="loading">No hay noticias disponibles</div>';
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
  const map = { 
    macro: 'Macro', 
    equities: 'Bolsa', 
    rates: 'RF', 
    credit: 'Crédito', 
    commodities: 'Mat. Primas' 
  };
  return map[cat] || cat;
}
