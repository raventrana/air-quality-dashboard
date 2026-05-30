# AirPulse — Live Global Air Quality Dashboard

Welcome to **AirPulse**, a premium, high-fidelity Air Quality Live Dashboard built to track atmospheric pollutants and forecasts around the globe. It is engineered with state-of-the-art Glassmorphism styling, interactive maps, forecast charts, and dynamic health guidelines.

---

## 🌟 Key Features

1. **Dual-API Resiliency**: 
   * **Open-Meteo API**: Out-of-the-box, keyless, global air quality readings (US & European AQIs) and 7-day hourly forecasts derived from European space modeling (Copernicus systems).
   * **WAQI (World Air Quality Index) API**: Station-specific ground sensor metrics. Allows entering custom tokens or defaults to your pre-loaded key. Includes smart safety fallbacks to Open-Meteo in case of rate-limiting or token invalidity.
2. **Interactive Global Map**: Embeds an elegant, custom high-contrast dark Leaflet.js map with glowing circular markers displaying station quality bands.
3. **Advanced Forecast Visuals**: Beautiful line graphs rendered dynamically using Chart.js, toggling between **24h Hourly Trends** and **7-Day Daily Forecasts**.
4. **Autocomplete Search**: Elegant search bar with fuzzy-matching geocoding suggestions to navigate to any city globally.
5. **Auto Geolocation**: Auto-detects your location coordinates instantly using the browser Geolocation GPS API.
6. **Smart Health Advisor**: Detailed tab layout offering tailored protective precautions (outdoor sports, ventilation guides, HEPA/filter needs, mask alerts) mapped dynamically to live AQI safety levels.
7. **Premium Glassmorphic Styling**: Full responsiveness, rich HSL variables, smooth transitions, circular progress tracking, and Dark/Light toggles.

---

## ⚙️ Quick Start

No installations or compilation build steps are required! AirPulse runs fully client-side using standard ES6 modules.

### Launching Locally

For a clean developer experience (handling ES module local file restrictions in some browsers):

1. Make sure you have **Node.js** installed on your system.
2. From your terminal, navigate to this project workspace directory and run:
   ```bash
   node server.js
   ```
3. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

Alternatively, you can run any simple static host (like VSCode Live Server, `npx serve`, or `python -m http.server 8000`) in this folder!

---

## 📂 File Architecture

```
Air Quality Dashboard/
├── index.html          # Main HTML structure with semantic HTML & SEO tags
├── styles.css          # Premium CSS design system: HSL variables, glassmorphism, responsive grids
├── server.js           # Lightweight 0-dependency Node.js dev server
├── js/
│   ├── app.js          # Core coordinator: state manager, localStorage, drawers, and UI updates
│   ├── api.js          # API services: fuzzy geocoding, Open-Meteo forecast mapper, and WAQI integrations
│   ├── map.js          # Leaflet.js module: dark tiles, marker pulsers, and station popups
│   └── charts.js       # Chart.js module: forecast line plots and gradient fills
└── README.md           # Documentation guide
```

---

## 🛠️ Technology Stack
* **Structure**: HTML5 (Semantic elements)
* **Styling**: Vanilla CSS3 (Custom HSL maps, Glassmorphism, animations)
* **Logic**: JavaScript ES6 (ES Modules, LocalStorage, Async Fetch)
* **Libraries (CDN loaded)**:
  * **Leaflet.js** (Mapping logic)
  * **Chart.js** (Visual forecasting graphs)
  * **Lucide-icons** (Premium SVG glyphs)
  * **Google Fonts** (Poppins & Outfit font structures)
