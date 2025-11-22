````markdown
# LiveWeatherWatch — Production-Grade Weather Dashboard

[![Netlify Status](https://api.netlify.com/api/v1/badges/b0b0b0-status-placeholder/deploy-status)](https://liveweatherwatch.netlify.app/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A highly performant, security-focused weather dashboard built with **Vanilla JavaScript** and **Serverless Functions**.

This project demonstrates a "security-first" approach to frontend development by implementing a custom API proxy to protect credentials, alongside robust client-side caching and resilient error handling patterns.

### 🔗 **[View Live Production Deployment](https://liveweatherwatch.netlify.app/)**

---

## 📸 Interface & UX

Designed with a responsive Glassmorphism UI that adapts to system preferences and ambient lighting conditions.

| **Desktop Light** | **Desktop Dark** |
|:---:|:---:|
| ![Desktop Light](./screenshots/desktop-light.png) | ![Desktop Dark](./screenshots/desktop-dark.png) |

| **Mobile Light** | **Mobile Dark** |
|:---:|:---:|
| ![Mobile Light](./screenshots/mobile-light.jpeg) | ![Mobile Dark](./screenshots/mobile-dark.jpeg) |

---

## 🏗️ Engineering & Architecture Decisions

This is not just a fetch-and-render application. The architecture was chosen to solve specific production challenges:

### 1. Security: Serverless API Proxy
Instead of exposing the `OPENWEATHER_KEY` in the frontend bundle (a common vulnerability), I architected a serverless middle-tier using **Netlify Functions**.
* **Mechanism:** The frontend requests data from `/.netlify/functions/openweather`.
* **Benefit:** The API key never leaves the server environment.
* **Control:** The proxy creates an allow-list of endpoints, preventing malicious actors from using my quota for unauthorized queries.

### 2. Performance: Vanilla JS & Caching
* **Why No Framework?** To demonstrate mastery of the DOM and browser APIs without the overhead of React or Vue. The app loads instantly with a near-perfect Lighthouse score.
* **Optimistic Caching:** Implemented a custom 5-minute TTL in-memory cache (`state.forecastCache`) to minimize API calls and prevent hitting rate limits during rapid navigation.

### 3. Resilience: Network Handling
* **Race Condition Handling:** Uses `AbortController` to cancel stale requests. If a user types "London" then quickly switches to "Paris", the "London" request is aborted to ensure the UI never shows mismatched data.
* **Debouncing & Timeouts:** Custom `fetchWithTimeout` wrapper ensures the app doesn't hang indefinitely on slow networks.

---

## 🚀 Key Features

* **Real-time Weather & AQI:** detailed metrics including PM2.5, PM10, NO₂, and O₃.
* **Smart Date Handling:** Timestamps are converted to the *target city's* local time zone, not the user's browser time.
* **Persistent Dark Mode:** Theme preference is saved in `localStorage` and auto-resolves against system settings on first load.
* **Geolocation API:** One-click "Locate Me" functionality with reverse geocoding.
* **Dynamic Assets:** Weather icons and background gradients adapt dynamically based on weather codes (WMO) and time of day (sunrise/sunset calculations).

---

## 🛠️ Tech Stack

* **Frontend:** HTML5, CSS3 (Variables, Flexbox/Grid), ES6+ JavaScript.
* **Backend:** Node.js (Netlify Functions).
* **Styling:** Custom CSS with Bootstrap 5 for grid utility classes.
* **API:** OpenWeatherMap (OneCall, Air Pollution, Geocoding).
* **CI/CD:** Automated deployments via Netlify on git push.

---

## 📂 Project Structure

```text
.
├── netlify/functions/    # Serverless backend logic (API Proxy)
│   └── openweather.js    # Secure wrapper for OpenWeather API
├── screenshots/          # Demo assets
├── src/
│   ├── index.html        # Semantic HTML5 structure
│   ├── js/
│   │   └── script.js     # Core application logic & state management
│   └── styles/
│       └── style.css     # CSS variables & glassmorphism styles
└── netlify.toml          # Build configuration & redirects
````

-----

## 💻 Local Development

Since this project relies on Serverless Functions, you must use the Netlify CLI to proxy the backend locally.

**1. Clone the repository**

```bash
git clone [https://github.com/Gugilla-Aakash/weather-dashboard.git](https://github.com/Gugilla-Aakash/weather-dashboard.git)
cd weather-dashboard
```

**2. Install Dependencies & CLI**

```bash
npm install
npm install -g netlify-cli
```

**3. Configure Environment Variables**
Create a `.env` file in the root or set it in your terminal session:

```bash
# Windows (PowerShell)
$env:OPENWEATHER_KEY="your_api_key_here"

# Mac/Linux
export OPENWEATHER_KEY="your_api_key_here"
```

**4. Run Locally**

```bash
netlify dev
```

*The app will run at `http://localhost:8888`. The Netlify CLI will automatically handle the routing from `/api/*` to the local serverless function.*

-----

## 🔮 Future Roadmap

  * **Unit Testing:** Integration of Jest for testing utility functions (`degToCompass`, `iconFilename`).
  * **PWA Support:** Adding a Service Worker for full offline support.
  * **Historical Data:** Charting temperature trends using a charting library.

-----

Made with ❤️ by **[Aakash Gugilla](https://www.google.com/search?q=https://github.com/Gugilla-Aakash)**.

```
```