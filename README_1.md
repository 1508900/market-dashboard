# 📊 Market Dashboard Pro

Monitor profesional de mercados financieros globales. Diseñado para GitHub Pages.

## 🚀 Instalación en GitHub Pages

### Opción 1: Subir archivos directamente

1. Crea un repositorio en GitHub (ej: `market-dashboard`)
2. Sube todos los archivos manteniendo la estructura de carpetas:
   ```
   index.html
   assets/
     css/
       style.css
     js/
       data.js
       charts.js
       sentiment.js
       news.js
       main.js
   ```
3. Ve a **Settings → Pages → Source**: selecciona `main` branch y carpeta `/root`
4. Tu dashboard estará en: `https://tu-usuario.github.io/market-dashboard`

### Opción 2: GitHub CLI

```bash
git init
git add .
git commit -m "Market Dashboard Pro"
gh repo create market-dashboard --public --push
# Luego activa Pages en Settings
```

---

## 📈 Módulos incluidos

### Renta Variable
- **S&P 500, Nasdaq, Euro Stoxx 50, MSCI ACWI, MSCI EM, MSCI LatAm, MSCI China, Korea**
- Cotización en tiempo real (retraso 15-20 min vía Yahoo Finance)
- Top 8 holdings por índice con peso y variación
- PER Forward implícito y yield de beneficios
- Gráfico histórico con selector de período (1D, 1S, 1M, 3M, YTD, 1A)

### Renta Fija
- Curvas de tipos: **EEUU, Alemania, Francia, España, Italia, UK, Japón**
- Plazos: 1Y, 2Y, 5Y, 10Y, 30Y
- **Pendiente 2-10 años** en puntos básicos con gráfico de barras
- Visualización de la forma de la curva por país

### Crédito
- Spreads **Investment Grade y High Yield** para EEUU, Europa y EM
- Evolución temporal de spreads IG y HY
- Diferencial HY-IG como proxy de apetito por el riesgo

### Divisas
- **EUR/USD, USD Index (DXY), EUR/JPY, EUR/GBP, USD/JPY**
- Evolución temporal con gráficos
- Variación diaria y tendencia

### Materias Primas
- **Energía**: Gas TTF, Brent, WTI
- **Metales Preciosos**: Oro, Plata
- **Metales Industriales**: Cobre, Aluminio, Níquel, Zinc
- Evolución indexada (base 100) para comparar rendimiento relativo

### Fear & Greed
- **Indicador compuesto para S&P 500 y Euro Stoxx 50**
- 5 sub-indicadores con metodología propia:
  1. Volatilidad actual vs media 50 días (peso 25%)
  2. Índice vs media móvil 125 días (peso 25%)
  3. RSI 14 días (peso 20%)
  4. Diferencial HY-IG (peso 15%)
  5. Rendimiento relativo bono vs bolsa 20 días (peso 15%)
- Gauge visual con escala 0-100 y señales por indicador

### Noticias
- Feed de noticias macro, bolsa, renta fija, crédito y materias primas
- Filtro por categoría
- Integración con Reuters RSS (tiempo real cuando disponible)

---

## ⚙️ Fuentes de datos

| Dato | Fuente | Actualización |
|------|--------|---------------|
| Cotizaciones índices y ETFs | Yahoo Finance (via proxy) | 15-20 min |
| Divisas | Yahoo Finance | 15-20 min |
| Materias primas | Yahoo Finance | 15-20 min |
| Tipos de interés | Hardcoded (actualizar manualmente o integrar FRED API) | Manual |
| Spreads crédito | Estimados desde ETFs (LQD, HYG, IHYG) | 15-20 min |
| Fear & Greed | Calculado localmente | En cada carga |
| Noticias | RSS Reuters, BBC, FT | En cada carga |

---

## 🔧 Personalización

### Añadir/cambiar índices
Edita el array `INDICES` en `assets/js/data.js`:
```javascript
{ id: 'mi_indice', ticker: '^TICKER', name: 'Mi Índice', per: 18.5, currency: 'EUR' }
```

### Actualizar tipos de interés con FRED API (gratuito)
1. Obtén una API key en https://fred.stlouisfed.org
2. En `data.js`, reemplaza `YIELD_DATA` por llamadas a la API FRED:
```javascript
const res = await fetch(`https://api.stlouisfed.org/fred/series/observations?series_id=DGS10&api_key=TU_KEY&file_type=json`);
```

### Integrar tipos europeos (ECB)
La API del BCE es pública y no requiere key:
```javascript
const res = await fetch('https://data-api.ecb.europa.eu/service/data/YC/B.U2.EUR.4F.G_N_A.SV_C_YM.SR_10Y?format=csvdata');
```

---

## 📦 Dependencias

- **Chart.js 4.4** — gráficos (CDN, sin instalación)
- **DM Sans + Space Mono** — tipografía (Google Fonts)
- **allorigins.win** — proxy CORS para Yahoo Finance
- **rss2json.com** — conversión RSS a JSON para noticias

Sin npm, sin build tools. Abre directamente en el navegador.

---

## ⚠️ Disclaimer

Los datos mostrados pueden tener retraso de 15-20 minutos. Este dashboard es únicamente para uso informativo y no constituye asesoramiento de inversión.
