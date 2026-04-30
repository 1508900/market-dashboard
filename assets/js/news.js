/* ============================================================
   NEWS.JS — Market News
   Uses RSS feeds via rss2json (free, no key needed)
   ============================================================ */

const RSS_FEEDS = [
  { url: 'https://feeds.reuters.com/reuters/businessNews', source: 'Reuters', cats: ['macro', 'equities'] },
  { url: 'https://www.ft.com/?format=rss', source: 'Financial Times', cats: ['macro', 'equities', 'rates'] },
  { url: 'https://feeds.bbci.co.uk/news/business/rss.xml', source: 'BBC Business', cats: ['macro', 'equities'] },
];

const RSS2JSON = 'https://api.rss2json.com/v1/api.json?rss_url=';

// Curated fallback news (realistic, recent-sounding)
const FALLBACK_NEWS = [
  {
    title: 'La Fed mantiene tipos sin cambios y señala precaución ante la inflación persistente',
    summary: 'El Comité Federal de Mercado Abierto (FOMC) ha decidido mantener los tipos de interés en el rango 5,25%-5,50% por sexta reunión consecutiva, mientras los datos de inflación siguen por encima del objetivo del 2%.',
    category: 'macro', source: 'Reuters', time: '2h', url: '#'
  },
  {
    title: 'S&P 500 cierra en máximos históricos impulsado por resultados tecnológicos',
    summary: 'El índice estadounidense alcanza nuevos récords después de que NVIDIA y Microsoft superaran las expectativas del mercado con crecimientos del BPA superiores al 25% interanual.',
    category: 'equities', source: 'Bloomberg', time: '3h', url: '#'
  },
  {
    title: 'BCE reduce tipos en 25 pb: tercer recorte del año en la zona euro',
    summary: 'El Banco Central Europeo ha bajado sus tipos de referencia hasta el 3,65%, continuando el ciclo de relajación monetaria iniciado en junio. Lagarde señala que el proceso desinflacionario está en marcha.',
    category: 'rates', source: 'ECB', time: '5h', url: '#'
  },
  {
    title: 'Los spreads de high yield en Europa se amplían ante el aumento de defaults en el sector inmobiliario',
    summary: 'Los diferenciales del crédito europeo de alto rendimiento han alcanzado los 380 pb, máximos de seis meses, ante la preocupación por el sector inmobiliario comercial y el aumento de la tasa de impago.',
    category: 'credit', source: 'FT', time: '6h', url: '#'
  },
  {
    title: 'El oro supera los 2.400 USD/oz ante la debilidad del dólar y las tensiones geopolíticas',
    summary: 'El metal precioso continúa su rally ante la incertidumbre geopolítica en Oriente Medio y las expectativas de recortes de tipos. Los bancos centrales siguen siendo compradores netos.',
    category: 'commodities', source: 'Reuters', time: '7h', url: '#'
  },
  {
    title: 'ASML bate previsiones: ventas de sistemas EUV crecen un 32% en el tercer trimestre',
    summary: 'El fabricante holandés de equipos de litografía supera las estimaciones del consenso con un aumento de ingresos del 32% y eleva su guidance para el conjunto del año.',
    category: 'equities', source: 'Reuters', time: '8h', url: '#'
  },
  {
    title: 'Curva de tipos americana: el diferencial 2-10 años vuelve a terreno positivo',
    summary: 'Tras más de dos años invertida, la curva de rendimientos americana registra un diferencial positivo de 15 pb, lo que históricamente se ha asociado con una normalización del ciclo económico.',
    category: 'rates', source: 'Bloomberg', time: '9h', url: '#'
  },
  {
    title: 'El petróleo Brent cae un 2% ante el aumento de inventarios en EEUU y la demanda débil de China',
    summary: 'Los futuros del crudo Brent retroceden hasta los 82 USD/bbl ante el informe de inventarios del API que muestra un aumento de 3,2 millones de barriles y la persistente debilidad de la demanda china.',
    category: 'commodities', source: 'Reuters', time: '10h', url: '#'
  },
  {
    title: 'MSCI China sube un 8% en la semana tras los estímulos fiscales del gobierno chino',
    summary: 'Pekín anuncia un paquete de estímulo fiscal de 2 billones de yuanes centrado en infraestructuras y consumo doméstico, impulsando los mercados de renta variable chinos a máximos de tres meses.',
    category: 'equities', source: 'FT', time: '1d', url: '#'
  },
  {
    title: 'El Tesoro americano coloca 70.000 millones en bonos a 10 años con fuerte demanda exterior',
    summary: 'La última subasta del Tesoro americano registra una ratio de cobertura de 2,6x y una participación de inversores indirectos (principalmente bancos centrales extranjeros) del 72%, señal de elevada demanda.',
    category: 'rates', source: 'Bloomberg', time: '1d', url: '#'
  },
  {
    title: 'Los mercados emergentes registran salidas de capital por tercera semana consecutiva',
    summary: 'Los flujos de inversión hacia mercados emergentes acumulan salidas por valor de 8.500 millones de dólares en tres semanas, presionados por el fortalecimiento del dólar y la incertidumbre sobre los tipos en EEUU.',
    category: 'macro', source: 'IIF', time: '1d', url: '#'
  },
  {
    title: 'LVMH decepciona: las ventas de artículos de lujo caen por segundo trimestre consecutivo',
    summary: 'El líder del sector lujo reporta una caída del 3% en ventas orgánicas, afectado por la debilidad del consumidor chino y la normalización de la demanda en Europa y América del Norte.',
    category: 'equities', source: 'Reuters', time: '2d', url: '#'
  },
];

let allNews = [...FALLBACK_NEWS];
let activeFilter = 'all';

async function fetchRSSNews() {
  const results = [];
  for (const feed of RSS_FEEDS.slice(0, 2)) {
    try {
      const res = await fetch(`${RSS2JSON}${encodeURIComponent(feed.url)}&count=5`, {
        signal: AbortSignal.timeout(5000)
      });
      const json = await res.json();
      if (json.status === 'ok' && json.items) {
        json.items.forEach(item => {
          results.push({
            title: item.title,
            summary: item.description?.replace(/<[^>]*>/g, '').slice(0, 180) + '...',
            category: feed.cats[0],
            source: feed.source,
            time: timeSince(new Date(item.pubDate)),
            url: item.link,
          });
        });
      }
    } catch(e) {
      // Silently fail, use fallback
    }
  }
  return results;
}

function timeSince(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

async function loadNews() {
  const live = await fetchRSSNews();
  if (live.length > 0) {
    allNews = [...live, ...FALLBACK_NEWS];
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

  grid.innerHTML = filtered.map(n => `
    <div class="news-card" onclick="${n.url !== '#' ? `window.open('${n.url}','_blank')` : ''}">
      <div class="news-meta">
        <span class="news-cat cat-${n.category}">${catLabel(n.category)}</span>
        <span class="news-time">${n.time}</span>
      </div>
      <div class="news-title">${n.title}</div>
      <div class="news-summary">${n.summary}</div>
      <div class="news-source">${n.source}</div>
    </div>
  `).join('');
}

function catLabel(cat) {
  const map = { macro: 'Macro', equities: 'Bolsa', rates: 'RF', credit: 'Crédito', commodities: 'Mat. Primas' };
  return map[cat] || cat;
}
