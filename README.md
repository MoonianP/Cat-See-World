Advanced situational awareness dashboard for monitoring live global events in one place.

Track real-time conflicts, cyber threats, seismic activity, market signals, intelligence feeds, strategic predictions, and more — all overlaid on an interactive world map.

<img width="3570" height="1808" alt="front" src="https://github.com/user-attachments/assets/1a4f5cc9-2414-4fa5-ac19-1b7cf82909bd" />


## What It Does

Cat-See-World aggregates and visualizes high-signal open-source intelligence (OSINT) and live feeds:
- Geopolitical conflicts and military movements
- Cyber attacks and infrastructure alerts
- Earthquakes, natural disasters, and seismic data
- Financial/market volatility indicators
- Intel summaries, news streams, and predictive insights

Designed for quick scanning — no more tab-juggling during fast-moving events.

## Features (Current & Planned)

- Interactive global map with layered overlays (conflict zones, military bases, nuclear sites, etc.)
- Real-time event markers and timelines
- Live news/intel feeds integration
- Custom alerts and filters
- Dark-mode UI optimized for long monitoring sessions

## Tech Stack

  Frontend  →  Vanilla HTML/JS, D3.js (Natural Earth projection), TopoJSON
  
  Backend   →  Node.js + Express
  
  Data      →  Live RSS aggregation, USGS Earthquake API, Yahoo Finance,
               Open-Meteo weather, CISA advisories
               
  Map       →  D3 geoNaturalEarth1 with zoom/pan, layered SVG markers,
               per-event detail panels with location photography


## Quick Start

<img width="701" height="364" alt="image" src="https://github.com/user-attachments/assets/be8e7ff9-de90-45af-a26f-4093eb3da590" />

  git clone https://github.com/MoonianP/Cat-See-World.git
  
  cd Cat-See-World
  
  npm install
  
  node server.js
  
  Open http://localhost:3000

  Or just run: ./start.sh
