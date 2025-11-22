const ICON_FOLDER = "../images/";
const LOCAL_FALLBACK_ICON = ICON_FOLDER + "unknown.png";

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
function maybeSetText(id, value) {
  const el = document.getElementById(id);
  if (!el) return false;
  el.textContent = value;
  return true;
}
function degToCompass(deg) {
  if (deg == null) return "";
  const n = Number(deg);
  if (!Number.isFinite(n)) return "";
  const dirs = [
    "N",
    "NNE",
    "NE",
    "ENE",
    "E",
    "ESE",
    "SE",
    "SSE",
    "S",
    "SSW",
    "SW",
    "WSW",
    "W",
    "WNW",
    "NW",
    "NNW",
  ];
  return dirs[Math.round((n % 360) / 22.5) % 16];
}
function formatLocal(timestamp, timezoneOffset, options) {
  const ms = (Number(timestamp || 0) + Number(timezoneOffset || 0)) * 1000;
  const d = new Date(ms);
  return d.toLocaleString(undefined, { ...options, timeZone: "UTC" });
}
const formatDateOnly = (ts, tz) =>
  formatLocal(ts, tz, { year: "numeric", month: "2-digit", day: "2-digit" });
const formatTimeOnly = (ts, tz) =>
  formatLocal(ts, tz, { hour: "2-digit", minute: "2-digit", hourCycle: "h12" });

function isDay(item, timezoneOffset, sun = null) {
  if (!item) return true;
  const icon = item.weather?.[0]?.icon;
  if (typeof icon === "string" && icon.length === 3) return icon.endsWith("d");
  if (
    sun &&
    typeof sun.sunrise === "number" &&
    typeof sun.sunset === "number"
  ) {
    const local = Number(item.dt || 0) + Number(timezoneOffset || 0);
    return local >= sun.sunrise && local < sun.sunset;
  }
  const localDate = new Date(
    (Number(item.dt || 0) + Number(timezoneOffset || 0)) * 1000
  );
  const h = localDate.getUTCHours();
  return h >= 6 && h < 18;
}
function iconFilename(item, timezoneOffset, sunData = null) {
  const w = item.weather?.[0] || {};
  const main = (w.main || "").toLowerCase();
  const desc = (w.description || "").toLowerCase();
  const icon = w.icon;
  const day = isDay(item, timezoneOffset, sunData);
  if (icon && typeof icon === "string" && icon.length === 3) {
    const p = icon.slice(0, 2);
    switch (p) {
      case "01":
        return day ? "clear_day.png" : "clear_night.png";
      case "02":
        return day ? "partly_cloudy_day.png" : "partly_cloudy_night.png";
      case "03":
      case "04":
        return "cloudy.png";
      case "09":
        return "shower_rain.png";
      case "10":
        return "rain.png";
      case "11":
        return "thunder.png";
      case "13":
        return "snow.png";
      case "50":
        return "fog.png";
    }
  }
  if (main.includes("clear")) return day ? "clear_day.png" : "clear_night.png";
  if (main.includes("cloud")) {
    if (
      desc.includes("few") ||
      desc.includes("scattered") ||
      desc.includes("partly")
    )
      return day ? "partly_cloudy_day.png" : "partly_cloudy_night.png";
    return "cloudy.png";
  }
  if (main.includes("rain")) {
    if (desc.includes("shower") || desc.includes("drizzle"))
      return "shower_rain.png";
    return "rain.png";
  }
  if (main.includes("drizzle")) return "drizzle.png";
  if (main.includes("thunder") || desc.includes("thunder"))
    return "thunder.png";
  if (main.includes("snow")) return "snow.png";
  if (main.includes("sleet") || desc.includes("freezing")) return "sleet.png";
  if (main.includes("mist") || main.includes("fog") || desc.includes("fog"))
    return "fog.png";
  if (main.includes("wind") || desc.includes("wind")) return "wind.png";
  return "unknown.png";
}
function iconPath(filename) {
  return ICON_FOLDER + filename;
}
function setImgAltFromFilename(img, filename) {
  if (!img) return;
  if (!filename) {
    img.alt = "weather icon";
    return;
  }
  const name = filename.replace(/[_\-.](png|jpe?g)?/g, " ").replace(/\d+/g, "");
  img.alt = `Icon: ${name.trim()}`.replace(/\s+/g, " ");
}
function setImgSrcWithFallback(img, src) {
  if (!img) return;
  img.onerror = () => {
    img.onerror = null;
    img.src = LOCAL_FALLBACK_ICON;
    setImgAltFromFilename(img, "unknown.png");
  };
  img.src = src || LOCAL_FALLBACK_ICON;
  if (typeof src === "string") {
    const filename = src.split("/").pop();
    setImgAltFromFilename(img, filename);
  }
}
function imageExists(url, timeout = 4000) {
  return new Promise((resolve) => {
    const img = new Image();
    let finished = false;
    img.onload = () => {
      if (!finished) {
        finished = true;
        resolve(true);
      }
    };
    img.onerror = () => {
      if (!finished) {
        finished = true;
        resolve(false);
      }
    };
    setTimeout(() => {
      if (!finished) {
        finished = true;
        resolve(false);
      }
    }, timeout);
    img.src = url;
  });
}
async function resolveDarkBackground(filenameBase) {
  const exts = ["png", "jpg", "jpeg"];
  for (const ext of exts) {
    const url = ICON_FOLDER + filenameBase + "." + ext;
    if (await imageExists(url)) return url;
  }
  return null;
}
function animateEl(el) {
  if (!el) return;
  el.classList.remove("fade-in");
  void el.offsetWidth;
  el.classList.add("fade-in");
}
(function ensureToast() {
  if (document.getElementById("app-toast")) return;
  const t = document.createElement("div");
  t.id = "app-toast";
  t.style.cssText =
    "position:fixed;right:18px;bottom:18px;padding:10px 14px;background:rgba(0,0,0,0.72);color:#fff;border-radius:10px;display:none;z-index:9999;font-weight:700;";
  document.body.appendChild(t);
})();
function showToast(msg, ms = 2200) {
  const t = document.getElementById("app-toast");
  if (!t) {
    alert(msg);
    return;
  }
  t.textContent = msg;
  t.style.display = "block";
  clearTimeout(t._t);
  t._t = setTimeout(() => (t.style.display = "none"), ms);
}
function handleHttpError(res, label = "Request") {
  if (!res) return false;
  if (res.status === 401) {
    showToast(`${label}: Invalid API key (401).`);
    return true;
  }
  if (res.status === 429) {
    showToast(`${label}: Rate limit (429).`);
    return true;
  }
  return false;
}
const state = {
  lastFetchController: null,
  forecastCache: {},
  cacheTTL: 1000 * 60 * 5,
};

function updateCurrentWeather(data) {
  if (!data) return;
  const {
    name,
    main = {},
    weather = [],
    dt,
    sys = {},
    coord,
    wind = {},
    timezone = 0,
    clouds,
    visibility,
  } = data;
  setText("cityName", name || "Unknown");
  setText("skyDesc", weather[0]?.description || "N/A");
  const tempEl = document.getElementById("cityTemp");
  if (tempEl) {
    tempEl.innerHTML = `${Math.round(
      main.temp ?? 0
    )}<span class="deg">°C</span>`;
    animateEl(tempEl);
  }
  const imgEl = document.querySelector(".currentWeatherIcon img");
  if (imgEl) {
    const sampleItem = {
      dt: dt ?? Math.floor(Date.now() / 1000),
      weather,
      main,
    };
    const sunData = {
      sunrise: (sys.sunrise ?? 0) + timezone,
      sunset: (sys.sunset ?? 0) + timezone,
    };
    const file = iconFilename(sampleItem, timezone, sunData) || "unknown.png";
    setImgSrcWithFallback(imgEl, iconPath(file));
    animateEl(imgEl);
  }
  setText("feelsLike", Math.round(main.feels_like ?? 0) + "°");
  setText(
    "date",
    formatDateOnly(dt ?? Math.floor(Date.now() / 1000), timezone)
  );
  setText(
    "time",
    formatTimeOnly(dt ?? Math.floor(Date.now() / 1000), timezone)
  );
  if (coord && typeof coord.lat === "number" && typeof coord.lon === "number")
    setText(
      "coords",
      `${Number(coord.lat).toFixed(2)}, ${Number(coord.lon).toFixed(2)}`
    );
  setText(
    "windValue",
    `${Math.round(wind?.speed ?? 0)} km/h${
      wind?.deg != null ? " • " + degToCompass(wind.deg) : ""
    }`
  );
  if (clouds?.all != null) setText("uvValue", clouds.all + "%");
  else maybeSetText("uvValue", "N/A");
  setText("humidityValue", main.humidity != null ? main.humidity + "%" : "N/A");
  setText(
    "pressureValue",
    main.pressure != null ? main.pressure + " hPa" : "N/A"
  );
  if (visibility != null)
    maybeSetText("visibilityValue", (visibility / 1000).toFixed(1) + " km");
  if (sys.sunrise)
    setText("sunriseTime", formatTimeOnly(sys.sunrise, timezone));
  else maybeSetText("sunriseTime", "N/A");
  if (sys.sunset) setText("sunsetTime", formatTimeOnly(sys.sunset, timezone));
  else maybeSetText("sunsetTime", "N/A");
  if (sys.sunrise && sys.sunset) {
    const len = sys.sunset - sys.sunrise;
    maybeSetText(
      "dayLength",
      `${Math.floor(len / 3600)}h ${Math.round((len % 3600) / 60)}m`
    );
  } else maybeSetText("dayLength", "N/A");
  const tzH = timezone / 3600;
  setText("timezoneLabel", `UTC${tzH >= 0 ? "+" : ""}${tzH}`);
  if (document.getElementById("lastUpdated"))
    setText("lastUpdated", new Date().toLocaleString());
  animateEl(document.querySelector(".cityHeader"));
}

function updateFiveDayForecast(list, timezone) {
  if (!list || !list.length) return;
  const byDate = {};
  list.forEach((i) => {
    const key = new Date((i.dt + timezone) * 1000).toISOString().slice(0, 10);
    if (!byDate[key]) byDate[key] = { temps: [], sample: i };
    byDate[key].temps.push(i.main.temp);
  });
  const dates = Object.keys(byDate).sort();
  const nowUTCsecs = Math.floor(Date.now() / 1000);
  const todayKey = new Date((nowUTCsecs + timezone) * 1000)
    .toISOString()
    .slice(0, 10);
  const rows = document.querySelectorAll(".forecastRow");
  let idx = 0;
  dates.forEach((date) => {
    if (date === todayKey) return;
    if (idx >= rows.length) return;
    const info = byDate[date];
    const avg = info.temps.reduce((a, b) => a + b, 0) / info.temps.length;
    const d = new Date((info.sample.dt + timezone) * 1000);
    const row = rows[idx];
    const tempIconH6 = row.querySelector(".tempIcon h6");
    if (tempIconH6)
      tempIconH6.innerHTML = `${Math.round(
        avg
      )} <span class="small-deg">°C</span>`;
    const weekday = d.toLocaleDateString(undefined, {
      weekday: "short",
      timeZone: "UTC",
    });
    const dateOnly = d.toLocaleDateString(undefined, { timeZone: "UTC" });
    const head = row.querySelector(".forecastText h6:first-child");
    if (head) head.textContent = weekday;
    const muted = row.querySelector(".forecastText h6.muted");
    if (muted) muted.textContent = dateOnly;
    const img = row.querySelector(".tempIcon img");
    const file = iconFilename(info.sample, timezone);
    setImgSrcWithFallback(img, iconPath(file));
    animateEl(row);
    idx++;
  });
}

function updateTodayHourly(list, timezone) {
  const cards = document.querySelectorAll(".todayTemp");
  if (!cards.length || !list || !list.length) return;
  const nowUTC = Math.floor(Date.now() / 1000);
  let start = list.findIndex((i) => i.dt >= nowUTC);
  if (start < 0) start = 0;
  const arr = list.slice(start, start + cards.length);
  arr.forEach((item, i) => {
    const card = cards[i];
    if (!card) return;
    const d = new Date((item.dt + timezone) * 1000);
    const timeText = d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h12",
      timeZone: "UTC",
    });
    const h6 = card.querySelector("h6");
    if (h6) h6.textContent = timeText;
    const h5 = card.querySelector("h5");
    if (h5)
      h5.innerHTML = `${Math.round(
        item.main.temp
      )}<span class="small-deg">°C</span>`;
    const img = card.querySelector("img");
    const file = iconFilename(item, timezone);
    if (img) setImgSrcWithFallback(img, iconPath(file));
    animateEl(card);
  });
}

function mapAQIToLabel(aqi) {
  return (
    { 1: "Good", 2: "Fair", 3: "Moderate", 4: "Poor", 5: "Very Poor" }[aqi] ||
    "Unknown"
  );
}
function getAQIClass(aqi) {
  if (aqi === null || aqi === undefined) return "aqi-poor";
  const n = Number(aqi);
  if (Number.isInteger(n) && n >= 1 && n <= 5) {
    if (n === 1) return "aqi-good";
    if (n === 2 || n === 3) return "aqi-moderate";
    return "aqi-poor";
  }
  if (!Number.isFinite(n)) return "aqi-poor";
  if (n <= 50) return "aqi-good";
  if (n <= 100) return "aqi-moderate";
  return "aqi-poor";
}

async function fetchAQIData(lat, lon) {
  if (!lat || !lon) return;
  try {
    const url = `/.netlify/functions/openweather?endpoint=air_pollution&lat=${encodeURIComponent(
      lat
    )}&lon=${encodeURIComponent(lon)}`;
    const res = await fetchWithTimeout(url, {}, 10000);
    if (!res.ok) {
      if (handleHttpError(res, "AQI")) return;
      console.warn("AQI fetch failed:", res.status);
      return;
    }
    const data = await res.json();
    if (!data.list || !data.list.length) return;
    const first = data.list[0];
    const comp = first.components || {};
    const aqi = first.main?.aqi;
    if (comp.pm2_5 != null) maybeSetText("pm25", comp.pm2_5 + " µg/m³");
    if (comp.pm10 != null) maybeSetText("pm10", comp.pm10 + " µg/m³");
    if (comp.o3 != null) maybeSetText("o3", comp.o3 + " µg/m³");
    if (comp.no2 != null) maybeSetText("no2", comp.no2 + " µg/m³");
    const overall = document.querySelector(".overallAQI");
    const labelEl = document.getElementById("aqiLabel");
    if (overall && aqi != null) overall.textContent = aqi;
    if (aqi != null && labelEl) labelEl.textContent = mapAQIToLabel(aqi);
    const stateClasses = ["aqi-good", "aqi-moderate", "aqi-poor"];
    if (overall) {
      overall.classList.remove(...stateClasses);
      overall.classList.add(getAQIClass(aqi));
      animateEl(overall);
    }
    if (labelEl) {
      labelEl.classList.remove(...stateClasses);
      labelEl.classList.add(getAQIClass(aqi));
      animateEl(labelEl);
    }
  } catch (err) {
    console.error("AQI fetch error:", err);
  }
}

async function reverseGeocode(lat, lon) {
  try {
    const url = `/.netlify/functions/openweather?endpoint=geocode_reverse&lat=${encodeURIComponent(
      lat
    )}&lon=${encodeURIComponent(lon)}&limit=1`;
    const res = await fetchWithTimeout(url, {}, 8000);
    if (!res.ok) {
      console.warn("Reverse geocode failed:", res.status);
      return null;
    }
    const data = await res.json();
    if (!data) return null;
    if (typeof data === "string") return data;
    if (data.name) return data.name;
    if (Array.isArray(data) && data.length)
      return data[0].name || data[0].local_names?.en || null;
    return null;
  } catch (err) {
    console.warn("Reverse geocode failed:", err);
    return null;
  }
}

async function fetchWithTimeout(resource, options = {}, timeout = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const merged = { ...options, signal: controller.signal };
    const res = await fetch(resource, merged);
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

async function fetchForecast(lat, lon, tz) {
  if (!lat || !lon) return;
  try {
    const cacheKey = `forecast_${lat.toFixed(3)}_${lon.toFixed(3)}`;
    const cached = state.forecastCache[cacheKey];
    const now = Date.now();
    if (cached && now - cached.ts < state.cacheTTL) {
      updateFiveDayForecast(cached.data.list, tz);
      updateTodayHourly(cached.data.list, tz);
      return;
    }
    const url = `/.netlify/functions/openweather?endpoint=forecast&lat=${encodeURIComponent(
      lat
    )}&lon=${encodeURIComponent(lon)}&units=metric`;
    const res = await fetchWithTimeout(url, {}, 12000);
    if (!res.ok) {
      if (handleHttpError(res, "Forecast")) return;
      console.warn("Forecast fetch failed:", res.status);
      return;
    }
    const data = await res.json();
    if (!data.list) return;
    state.forecastCache[cacheKey] = { ts: now, data };
    updateFiveDayForecast(data.list, tz);
    updateTodayHourly(data.list, tz);
  } catch (err) {
    console.error("Forecast error:", err);
  }
}

async function fetchDataCity(cityName, saveToStorage = true) {
  if (!cityName) return;
  if (state.lastFetchController)
    try {
      state.lastFetchController.abort();
    } catch (e) {}
  state.lastFetchController = new AbortController();
  try {
    const url = `/.netlify/functions/openweather?endpoint=weather&q=${encodeURIComponent(
      cityName
    )}&units=metric`;
    const res = await fetchWithTimeout(
      url,
      { signal: state.lastFetchController.signal },
      10000
    );
    state.lastFetchController = null;
    if (!res.ok) {
      if (handleHttpError(res, "Weather")) return;
      const text = await res.text().catch(() => "");
      try {
        const j = JSON.parse(text || "{}");
        showToast(j.message || `Weather fetch failed: ${res.status}`);
      } catch {
        showToast(`Weather fetch failed: ${res.status}`);
      }
      return;
    }
    const data = await res.json();
    if (data.cod && Number(data.cod) !== 200) {
      showToast(data.message || "City not found");
      return;
    }
    updateCurrentWeather(data);
    if (saveToStorage) localStorage.setItem("lastCity", cityName);
    const { lat, lon } = data.coord || {};
    fetchAQIData(lat, lon);
    fetchForecast(lat, lon, data.timezone || 0);
  } catch (err) {
    state.lastFetchController = null;
    if (err.name === "AbortError") return;
    console.error("Weather fetch error:", err);
    showToast("Network error fetching weather");
  }
}

async function fetchDataByCoords(lat, lon) {
  if (!lat || !lon) return;
  if (state.lastFetchController)
    try {
      state.lastFetchController.abort();
    } catch (e) {}
  state.lastFetchController = new AbortController();
  try {
    const name = await reverseGeocode(lat, lon);
    if (name) {
      const inp = document.querySelector(".inputField");
      if (inp) inp.value = name;
      await fetchDataCity(name, true);
      state.lastFetchController = null;
      return;
    }
    const url = `/.netlify/functions/openweather?endpoint=weather&lat=${encodeURIComponent(
      lat
    )}&lon=${encodeURIComponent(lon)}&units=metric`;
    const res = await fetchWithTimeout(
      url,
      { signal: state.lastFetchController.signal },
      10000
    );
    state.lastFetchController = null;
    if (!res.ok) {
      if (handleHttpError(res, "Weather (coords)")) return;
      console.warn("fetchDataByCoords failed:", res.status);
      return;
    }
    const data = await res.json();
    if (data?.cod === 200 || data) {
      updateCurrentWeather(data);
      localStorage.setItem("lastCity", data.name || "");
      fetchAQIData(lat, lon);
      fetchForecast(lat, lon, data.timezone || 0);
    }
  } catch (err) {
    state.lastFetchController = null;
    if (err.name === "AbortError") return;
    console.error("fetchDataByCoords error:", err);
  }
}

async function fetchData() {
  const inp = document.querySelector(".inputField");
  if (!inp) return;
  const city = inp.value.trim();
  if (!city) return showToast("Please enter a city name.");
  await fetchDataCity(city, true);
}

async function initAutoLocationAndLastCity() {
  try {
    const last = localStorage.getItem("lastCity");
    const input = document.querySelector(".inputField");
    if (last) {
      if (input) input.value = last;
      fetchDataCity(last, false);
      return;
    }
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          await fetchDataByCoords(lat, lon);
        },
        (err) => {
          console.warn("Geolocation failed or denied:", err);
        },
        { timeout: 8000 }
      );
    }
  } catch (err) {
    console.error("initAutoLocationAndLastCity error:", err);
  }
}

function _cleanVarValue(v) {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

async function initDarkMode() {
  const root = document.documentElement;
  const body = document.body;

  let computedBg = _cleanVarValue(
    getComputedStyle(root).getPropertyValue("--bg-image")
  );
  if (!computedBg || computedBg === "none") {
    computedBg = _cleanVarValue(
      getComputedStyle(body).getPropertyValue("--bg-image")
    );
  }
  const originalBg =
    computedBg && computedBg !== "none"
      ? computedBg
      : `url("${ICON_FOLDER}background.jpg")`;
  root.dataset.originalBg = originalBg;

  const resolvedDarkUrlRaw = await resolveDarkBackground("dark_background");
  const resolvedDark = resolvedDarkUrlRaw
    ? `url("${resolvedDarkUrlRaw}")`
    : `url("${ICON_FOLDER}dark_background.jpg")`;
  root.dataset.darkBg = resolvedDark;
  root.style.setProperty("--bg-image-dark", resolvedDark);

  const stored = localStorage.getItem("darkMode") === "1";
  if (stored) {
    body.classList.add("dark-mode");
    root.style.setProperty("--bg-image", root.dataset.darkBg || originalBg);
  } else {
    body.classList.remove("dark-mode");
    root.style.setProperty("--bg-image", originalBg);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const inp = document.querySelector(".inputField");
  if (inp)
    inp.addEventListener("keydown", (e) => {
      if (e.key === "Enter") fetchData();
    });
  const clearBtnEl = document.getElementById("clearLastBtn");
  if (clearBtnEl)
    clearBtnEl.addEventListener("click", () => {
      localStorage.removeItem("lastCity");
      showToast("Last saved city cleared.");
    });

  const darkButtons = Array.from(document.querySelectorAll("#darkModeBtn"));
  if (darkButtons.length > 1) darkButtons.slice(1).forEach((el) => el.remove());
  const darkBtnEl = document.getElementById("darkModeBtn");
  if (darkBtnEl) {
    const isAlreadyDark =
      document.body.classList.contains("dark-mode") ||
      localStorage.getItem("darkMode") === "1";
    darkBtnEl.textContent = isAlreadyDark ? "Light" : "Dark";
    darkBtnEl.addEventListener("click", () => {
      const body = document.body;
      const root = document.documentElement;
      const isDark = body.classList.toggle("dark-mode");
      localStorage.setItem("darkMode", isDark ? "1" : "0");
      darkBtnEl.textContent = isDark ? "Light" : "Dark";
      const originalBg = _cleanVarValue(
        root.dataset.originalBg ||
          getComputedStyle(root).getPropertyValue("--bg-image") ||
          "none"
      );
      const darkBg = _cleanVarValue(
        root.dataset.darkBg ||
          getComputedStyle(root).getPropertyValue("--bg-image-dark") ||
          ""
      );
      if (isDark) {
        root.style.setProperty("--bg-image", darkBg || originalBg);
      } else {
        root.style.setProperty("--bg-image", originalBg);
      }
    });
  }

  await initDarkMode();
  initAutoLocationAndLastCity();
});
