# 🌍 Cat-See-World

**Global Intelligence Platform** — a real-time news & situational awareness dashboard.

## Quick Start

```bash
cd cat-see-world
npm install      # only needed once
npm start        # or: node server.js
```

Then open **http://localhost:3000** in your browser.

## What's Live

| Endpoint | Data Source | Refresh |
|---|---|---|
| `/api/news` | BBC, DW, Al Jazeera, Reuters RSS | 5 min |
| `/api/earthquakes` | USGS M4.5+ feed | 5 min |
| `/api/markets` | Yahoo Finance | 1 min |
| `/api/weather` | Open-Meteo | 15 min |
| `/api/wildfires` | Static (curated) | — |

## Features

- ✅ Category nav filter (All / Conflict / Cyber / etc.)
- ✅ Search bar (filters headline, summary, source, category)
- ✅ Story modal popup (click any card or hero story)
- ✅ Load More button
- ✅ Market refresh button
- ✅ Alert panel (save/delete keyword alerts)
- ✅ Dark mode toggle
- ✅ Auto-refresh every 5 minutes with alert matching

## Port

Default: **3000**. Change with `PORT=8080 node server.js`.
