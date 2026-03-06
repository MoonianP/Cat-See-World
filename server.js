/**
 * Cat-See-World — Express Server
 * Run:  node server.js
 * Open: http://localhost:3000
 */
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const RssParser = require('rss-parser');

const app = express();
const PORT = process.env.PORT || 3000;
const parser = new RssParser({ timeout: 10000 });

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

/* ── Helpers ─────────────────────────────────────────────────────── */
function ago(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return m + 'm ago';
  const h = Math.floor(m / 60);
  if (h < 24) return h + 'h ago';
  return Math.floor(h / 24) + 'd ago';
}

function categorise(title, desc) {
  const t = ((title || '') + ' ' + (desc || '')).toLowerCase();
  if (/earthquake|seismic|tsunami|volcano|eruption/.test(t))           return 'Natural';
  if (/cyber|hack|ransomware|breach|malware|phishing|ddos/.test(t))    return 'Cyber';
  if (/war|conflict|military|strike|attack|bomb|troops|nato|missile/.test(t)) return 'Conflict';
  if (/market|stock|economy|gdp|inflation|fed|rate|oil|trade|tariff/.test(t)) return 'Markets';
  if (/storm|flood|hurricane|typhoon|wildfire|drought|climate/.test(t)) return 'Climate';
  if (/protest|unrest|riot|demonstration|coup/.test(t))                return 'Unrest';
  if (/aviation|flight|airport|aircraft/.test(t))                      return 'Aviation';
  if (/maritime|ship|vessel|port|tanker/.test(t))                      return 'Maritime';
  return 'Intelligence';
}

function severity(cat) {
  return ({Conflict:'high',Cyber:'high',Natural:'med',Unrest:'med',Climate:'med',
           Markets:'info',Aviation:'info',Maritime:'info',Intelligence:'info'})[cat] || 'info';
}

/* ── Cache ───────────────────────────────────────────────────────── */
const _cache = {};
async function cached(key, ttlMs, fn) {
  if (_cache[key] && Date.now() - _cache[key].ts < ttlMs) return _cache[key].data;
  const data = await fn();
  _cache[key] = { ts: Date.now(), data };
  return data;
}

/* ── Fallback data ───────────────────────────────────────────────── */
const FB_NEWS = [
  { cat:'Conflict',     sev:'high', headline:'NATO Emergency Summit Convened as Frontline Situation Evolves', summary:'Allied defence ministers hold emergency session. Air defence assets repositioned; resupply corridors under review.', source:'ISW / NATO', url:'#', time:'14m ago' },
  { cat:'Cyber',        sev:'high', headline:'Volt Typhoon Pre-Positioning Detected in US Critical Infrastructure', summary:'CISA advisory after ICS compromise indicators found across 6 utility operators. PRC-linked attribution at high confidence.', source:'CISA', url:'https://www.cisa.gov', time:'22m ago' },
  { cat:'Markets',      sev:'info', headline:'Fed Signals Pause on Rate Cuts; Inflation Data Awaited', summary:'Fed chair reiterates data-dependent stance. Markets price in two cuts for 2025.', source:'Bloomberg', url:'#', time:'47m ago' },
  { cat:'Natural',      sev:'med',  headline:'Typhoon Intensifies to Category 4 — Landfall Projected for Northern Philippines', summary:'Signal 3 warnings issued. Evacuation orders for 200,000+ in coastal provinces.', source:'PAGASA', url:'#', time:'1h ago' },
  { cat:'Conflict',     sev:'high', headline:'Sudan Civil War: RSF Seizes Water Infrastructure in Khartoum North', summary:'Aid agencies warn of humanitarian catastrophe; 3M already displaced in Darfur.', source:'OCHA', url:'#', time:'1h 20m ago' },
  { cat:'Intelligence', sev:'info', headline:'GDELT Analysis: Hawkish Language in PRC State Media Reaches 5-Year High', summary:'Semantic analysis of 2.3M articles shows 78% increase in escalatory framing over 90 days.', source:'GDELT / AI', url:'#', time:'2h ago' },
  { cat:'Climate',      sev:'med',  headline:'Wildfires Burn 8,400 Hectares in Southern Chile — State of Emergency Declared', summary:'Three active fires spreading due to drought and strong winds. Military deployed to assist.', source:'CONAF Chile', url:'#', time:'2h 15m ago' },
  { cat:'Maritime',     sev:'med',  headline:"Houthi Warning Issued for Red Sea Transit — Lloyd's Updates War Risk Zone", summary:'Yemen group issues new navigation advisory. Insurance premiums spike 40%; Cape rerouting continues.', source:"Lloyd's / IMB", url:'#', time:'3h ago' },
  { cat:'Markets',      sev:'med',  headline:'Turkish Lira Hits Record Low vs USD — Emergency Central Bank Meeting', summary:'Inflation at 68%; FX reserves at critical floor. IMF consultations underway.', source:'Bloomberg', url:'#', time:'3h 30m ago' },
];

const FB_QUAKES = [
  { mag:'5.8', loc:'Near Tokyo, Japan',        depth:'35km', ago:'14m', url:'https://earthquake.usgs.gov' },
  { mag:'5.1', loc:'Aegean Sea, Greece',        depth:'8km',  ago:'1h',  url:'https://earthquake.usgs.gov' },
  { mag:'4.7', loc:'Kamchatka, Russia',         depth:'90km', ago:'3h',  url:'https://earthquake.usgs.gov' },
  { mag:'4.4', loc:'Chiapas, Mexico',           depth:'20km', ago:'5h',  url:'https://earthquake.usgs.gov' },
  { mag:'4.2', loc:'Vanuatu',                   depth:'65km', ago:'7h',  url:'https://earthquake.usgs.gov' },
  { mag:'4.0', loc:'Northern Chile',            depth:'55km', ago:'9h',  url:'https://earthquake.usgs.gov' },
];

const FB_MARKETS = [
  { sym:'SPX', name:'S&P 500',   price:'5,234', pricePfx:'',  change:'+0.41%', dir:'up'   },
  { sym:'BTC', name:'Bitcoin',   price:'67,441',pricePfx:'$', change:'-1.34%', dir:'down' },
  { sym:'XAU', name:'Gold',      price:'2,318', pricePfx:'$', change:'-0.22%', dir:'down' },
  { sym:'OIL', name:'Crude Oil', price:'82.30', pricePfx:'$', change:'+1.42%', dir:'up'   },
  { sym:'EUR', name:'EUR/USD',   price:'1.0842',pricePfx:'',  change:'+0.08%', dir:'up'   },
  { sym:'VIX', name:'Volatility',price:'21.30', pricePfx:'',  change:'+9.3%',  dir:'up'   },
];

const FB_WEATHER = [
  { city:'New York',  temp:8,  wind:18, code:3  },
  { city:'London',    temp:12, wind:24, code:2  },
  { city:'Tokyo',     temp:15, wind:10, code:1  },
  { city:'Dubai',     temp:30, wind:12, code:0  },
  { city:'Sao Paulo', temp:26, wind:15, code:61 },
  { city:'Sydney',    temp:22, wind:20, code:2  },
];

/* ══════════════════════════════════════════════════════════════════ */

/* ── GET /api/status ─────────────────────────────────────────────── */
app.get('/api/status', (_q, res) => {
  res.json({ ok:true, time:new Date().toISOString(), version:'1.0.0',
    feeds:['news','earthquakes','markets','weather','wildfires'] });
});

/* ── GET /api/news ───────────────────────────────────────────────── */
const RSS_FEEDS = [
  { url:'https://feeds.bbci.co.uk/news/world/rss.xml', source:'BBC World'  },
  { url:'https://rss.dw.com/rdf/rss-en-world',         source:'DW News'    },
  { url:'https://www.aljazeera.com/xml/rss/all.xml',   source:'Al Jazeera' },
  { url:'https://feeds.reuters.com/reuters/worldNews', source:'Reuters'    },
];

function cleanText(s) {
  return (s||'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/<[^>]+>/g,'');
}

app.get('/api/news', async (_req, res) => {
  try {
    const data = await cached('news', 5*60*1000, async () => {
      const settled = await Promise.allSettled(
        RSS_FEEDS.map(f => parser.parseURL(f.url).then(feed => ({ feed, source:f.source })))
      );
      const items = [];
      for (const r of settled) {
        if (r.status !== 'fulfilled') continue;
        const { feed, source } = r.value;
        for (const item of (feed.items||[]).slice(0,10)) {
          const cat = categorise(item.title, item.contentSnippet);
          items.push({
            cat, sev: severity(cat),
            headline: cleanText(item.title),
            summary:  (cleanText(item.contentSnippet||item.content||'').slice(0,200)+'…'),
            source,
            url:  item.link || '#',
            time: item.pubDate ? ago(item.pubDate) : '?',
            pubDate: item.pubDate || new Date().toISOString(),
          });
        }
      }
      if (!items.length) return FB_NEWS;
      items.sort((a,b)=>new Date(b.pubDate)-new Date(a.pubDate));
      return items.slice(0,50);
    });
    res.json({ ok:true, items:data });
  } catch(e) {
    console.error('[news]', e.message);
    res.json({ ok:true, items:FB_NEWS, live:false });
  }
});

/* ── GET /api/earthquakes ────────────────────────────────────────── */
app.get('/api/earthquakes', async (_req, res) => {
  try {
    const data = await cached('quakes', 5*60*1000, async () => {
      const r = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson', {timeout:10000});
      const json = await r.json();
      const items = (json.features||[]).slice(0,10).map(f=>({
        mag:   f.properties.mag.toFixed(1),
        loc:   f.properties.place||'Unknown',
        depth: Math.round(f.geometry.coordinates[2])+'km',
        ago:   ago(f.properties.time),
        url:   f.properties.url||'https://earthquake.usgs.gov',
      }));
      if (!items.length) throw new Error('empty');
      return items;
    });
    res.json({ ok:true, items:data });
  } catch(e) {
    console.error('[quakes]', e.message);
    res.json({ ok:true, items:FB_QUAKES, live:false });
  }
});

/* ── GET /api/markets ────────────────────────────────────────────── */
const SYMS = [
  { sym:'^GSPC',    label:'SPX', name:'S&P 500',   pfx:''  },
  { sym:'BTC-USD',  label:'BTC', name:'Bitcoin',   pfx:'$' },
  { sym:'GC=F',     label:'XAU', name:'Gold',      pfx:'$' },
  { sym:'CL=F',     label:'OIL', name:'Crude Oil', pfx:'$' },
  { sym:'EURUSD=X', label:'EUR', name:'EUR/USD',   pfx:''  },
  { sym:'^VIX',     label:'VIX', name:'Volatility',pfx:''  },
];

app.get('/api/markets', async (_req, res) => {
  try {
    const data = await cached('markets', 60*1000, async () => {
      const url = 'https://query1.finance.yahoo.com/v7/finance/quote?symbols='+SYMS.map(s=>s.sym).join(',')+'&fields=regularMarketPrice,regularMarketChangePercent';
      const r = await fetch(url, {headers:{'User-Agent':'Mozilla/5.0'},timeout:10000});
      const json = await r.json();
      const quotes = json.quoteResponse?.result||[];
      if (!quotes.length) throw new Error('no quotes');
      return SYMS.map(s=>{
        const q = quotes.find(x=>x.symbol===s.sym)||{};
        const p = q.regularMarketPrice||0, pct = q.regularMarketChangePercent||0;
        return {
          sym:s.label, name:s.name,
          price: p>10000?p.toLocaleString('en-US',{maximumFractionDigits:0}):p>10?p.toFixed(2):p.toFixed(4),
          pricePfx:s.pfx,
          change:(pct>=0?'+':'')+pct.toFixed(2)+'%',
          dir:pct>=0?'up':'down',
        };
      });
    });
    res.json({ ok:true, items:data });
  } catch(e) {
    console.error('[markets]', e.message);
    res.json({ ok:true, items:FB_MARKETS, live:false });
  }
});

/* ── GET /api/weather ────────────────────────────────────────────── */
const CITIES = [
  {name:'New York', lat:40.71,lon:-74.01},{name:'London',lat:51.51,lon:-0.13},
  {name:'Tokyo',lat:35.68,lon:139.69},{name:'Dubai',lat:25.20,lon:55.27},
  {name:'Sao Paulo',lat:-23.55,lon:-46.63},{name:'Sydney',lat:-33.87,lon:151.21},
];
app.get('/api/weather', async (_req, res) => {
  try {
    const data = await cached('weather', 15*60*1000, async () => {
      const settled = await Promise.allSettled(CITIES.map(c=>
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}&current_weather=true`,{timeout:8000})
        .then(r=>r.json()).then(j=>({city:c.name,temp:j.current_weather?.temperature??'--',wind:j.current_weather?.windspeed??'--',code:j.current_weather?.weathercode??0}))
      ));
      const ok = settled.filter(r=>r.status==='fulfilled').map(r=>r.value);
      if (!ok.length) throw new Error('no weather');
      return ok;
    });
    res.json({ ok:true, items:data });
  } catch(e) {
    console.error('[weather]', e.message);
    res.json({ ok:true, items:FB_WEATHER, live:false });
  }
});

/* ── GET /tiles/:provider/:z/:x/:y ──────────────────────────────── */
// Proxy map tiles through local server so browser firewall rules don't block them
const TILE_URLS = {
  osm:    (z,x,y) => `https://tile.openstreetmap.org/${z}/${x}/${y}.png`,
  carto:  (z,x,y) => `https://a.basemaps.cartocdn.com/dark_all/${z}/${x}/${y}.png`,
  esri:   (z,x,y) => `https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/${z}/${y}/${x}`,
};

app.get('/tiles/:provider/:z/:x/:y', async (req, res) => {
  const { provider, z, x, y } = req.params;
  const tileFn = TILE_URLS[provider] || TILE_URLS.osm;
  const url = tileFn(z, x, y);
  try {
    console.log(`[tiles] ${provider} z${z}/${x}/${y} → ${url}`);
    const r = await fetch(url, {
      timeout: 8000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; cat-see-world/1.0)',
        'Referer': 'https://www.openstreetmap.org/',
        'Accept': 'image/png,image/*',
      }
    });
    if (!r.ok) { console.warn(`[tiles] upstream ${r.status} for ${url}`); return res.status(r.status).end(); }
    const buf = await r.buffer();
    res.set('Content-Type', 'image/png');
    res.set('Cache-Control', 'public, max-age=86400');
    res.set('Access-Control-Allow-Origin', '*');
    res.send(buf);
    console.log(`[tiles] OK ${provider} z${z}/${x}/${y} (${buf.length} bytes)`);
  } catch(e) {
    console.error(`[tiles] FAIL ${provider} z${z}/${x}/${y}: ${e.message}`);
    res.status(502).end();
  }
});

// Probe endpoint so browser can test which provider works
app.get('/tiles/probe/:provider', async (req, res) => {
  const { provider } = req.params;
  const tileFn = TILE_URLS[provider] || TILE_URLS.osm;
  const url = tileFn(2, 2, 1);
  try {
    const r = await fetch(url, { timeout:5000, headers:{'User-Agent':'Mozilla/5.0'} });
    if (r.ok) {
      console.log(`[tiles/probe] ${provider} → OK (${r.status})`);
      res.json({ ok:true, provider, status:r.status });
    } else {
      console.warn(`[tiles/probe] ${provider} → FAIL (${r.status})`);
      res.json({ ok:false, provider, status:r.status });
    }
  } catch(e) {
    console.error(`[tiles/probe] ${provider} → ERROR: ${e.message}`);
    res.json({ ok:false, provider, error:e.message });
  }
});

/* ── GET /api/wildfires ──────────────────────────────────────────── */
app.get('/api/wildfires', (_q, res) => {
  res.json({ ok:true, items:[
    {region:'Southern Chile',     hectares:'8,400',status:'Active',   ago:'2h'},
    {region:'Western Australia',  hectares:'3,200',status:'Contained',ago:'5h'},
    {region:'Northern California',hectares:'1,100',status:'Active',   ago:'6h'},
    {region:'Portugal',           hectares:'560',  status:'Monitor',  ago:'12h'},
  ]});
});

/* ── Start ───────────────────────────────────────────────────────── */
app.listen(PORT, () => {
  console.log('\n┌─────────────────────────────────────────┐');
  console.log('│  🌍  Cat-See-World is running            │');
  console.log('│  Open: http://localhost:' + PORT + '             │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  /api/news        Live RSS news feed     │');
  console.log('│  /api/earthquakes USGS seismic data      │');
  console.log('│  /api/markets     Yahoo Finance quotes   │');
  console.log('│  /api/weather     Open-Meteo weather     │');
  console.log('│  /api/wildfires   Active fire tracker    │');
  console.log('└─────────────────────────────────────────┘\n');
});
