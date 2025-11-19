const API_KEY = "ddf48068399af2fa86871ead7fd6c50c";

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function degToCompass(deg) {
  if (deg == null) return "";
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
  const index = Math.round(deg / 22.5) % 16;
  return dirs[index];
}

function formatLocal(timestamp, timezoneOffset, options) {
  const date = new Date((timestamp + timezoneOffset) * 1000);
  return date.toLocaleString(undefined, options);
}

const formatDateOnly = (ts, tz) =>
  formatLocal(ts, tz, { year: "numeric", month: "2-digit", day: "2-digit" });

const formatTimeOnly = (ts, tz) =>
  formatLocal(ts, tz, { hour: "2-digit", minute: "2-digit" });

function updateCurrentWeather(data) {
  const { name, main, weather, dt, sys, coord, wind, timezone, clouds } = data;

  setText("cityName", name);
  setText("skyDesc", weather[0].description);

  const tempEl = document.getElementById("cityTemp");
  if (tempEl) {
    const rounded = Math.round(main.temp);
    tempEl.innerHTML = `${rounded}<span class="deg">°C</span>`;
  }

  setText("feelsLike", Math.round(main.feels_like) + "°");

  setText("date", formatDateOnly(dt, timezone));
  setText("time", formatTimeOnly(dt, timezone));

  const coordsEl = document.getElementById("coords");
  if (coordsEl) {
    coordsEl.textContent = coord.lat.toFixed(2) + ", " + coord.lon.toFixed(2);
  }

  setText(
    "windValue",
    Math.round(wind.speed) + " km/h • " + degToCompass(wind.deg)
  );

  if (clouds && typeof clouds.all === "number") {
    setText("uvValue", clouds.all + "%");
  }

  setText("humidityValue", main.humidity + "%");
  setText("pressureValue", main.pressure + " hPa");

  setText("sunriseTime", formatTimeOnly(sys.sunrise, timezone));
  setText("sunsetTime", formatTimeOnly(sys.sunset, timezone));

  const daySeconds = sys.sunset - sys.sunrise;
  const hours = Math.floor(daySeconds / 3600);
  const mins = Math.round((daySeconds % 3600) / 60);
  setText("dayLength", `${hours}h ${mins}m`);

  const offsetHours = timezone / 3600;
  const sign = offsetHours >= 0 ? "+" : "";
  setText("timezoneLabel", "UTC" + sign + offsetHours);

  const comingTitle = document.getElementById("comingFiveDaysTitle");
  if (comingTitle) comingTitle.textContent = "Coming 5 Days • " + name;
}

function mapAQIToLabel(aqi) {
  return (
    {
      1: "Good",
      2: "Fair",
      3: "Moderate",
      4: "Poor",
      5: "Very Poor",
    }[aqi] || "Unknown"
  );
}

async function fetchAQIData(lat, lon) {
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`
    );
    const data = await res.json();

    if (!data.list || !data.list.length) return;

    const first = data.list[0];
    const comp = first.components || {};
    const aqi = first.main?.aqi;

    setText("pm25", comp.pm2_5 + " µg/m³");
    setText("pm10", comp.pm10 + " µg/m³");
    setText("o3", comp.o3 + " µg/m³");
    setText("no2", comp.no2 + " µg/m³");

    const overall = document.querySelector(".overallAQI");
    if (overall) overall.textContent = aqi;

    setText("aqiLabel", mapAQIToLabel(aqi));
  } catch (err) {
    console.error("AQI fetch error:", err);
  }
}

function pickIconPath(main) {
  if (!main) return "../images/cloud.png";
  main = main.toLowerCase();

  if (main.includes("clear")) return "../images/sunny.png";
  if (main.includes("cloud")) return "../images/cloudy.png";
  if (main.includes("rain") || main.includes("drizzle"))
    return "../images/rain.png";
  if (main.includes("snow")) return "../images/snow.png";
  if (main.includes("thunder")) return "../images/storm.png";

  return "../images/cloud.png";
}

function updateFiveDayForecast(list, timezone) {
  if (!list?.length) return;

  const byDate = {};

  list.forEach((item) => {
    const key = new Date((item.dt + timezone) * 1000)
      .toISOString()
      .slice(0, 10);

    if (!byDate[key]) byDate[key] = { temps: [], sample: item };
    byDate[key].temps.push(item.main.temp);
  });

  const dates = Object.keys(byDate).sort();
  const todayKey = dates[0];

  const forecastRows = document.querySelectorAll(".forecastRow");
  let rowIndex = 0;

  dates.forEach((dateKey) => {
    if (dateKey === todayKey) return;
    if (rowIndex >= forecastRows.length) return;

    const info = byDate[dateKey];
    const avgTemp = info.temps.reduce((a, b) => a + b, 0) / info.temps.length;

    const d = new Date((info.sample.dt + timezone) * 1000);

    const row = forecastRows[rowIndex];
    row.querySelector(".tempIcon h6").innerHTML =
      Math.round(avgTemp) + ' <span class="small-deg">°C</span>';
    row.querySelector(".forecastText h6:first-child").textContent =
      d.toLocaleDateString(undefined, { weekday: "short" });
    row.querySelector(".forecastText h6.muted").textContent =
      d.toLocaleDateString();

    row.querySelector(".tempIcon img").src = pickIconPath(
      info.sample.weather[0].main
    );

    rowIndex++;
  });
}

function updateTodayHourly(list, timezone) {
  const hourly = document.querySelectorAll(".todayTemp");
  if (!hourly.length) return;

  const slice = list.slice(0, hourly.length);

  slice.forEach((item, i) => {
    const card = hourly[i];
    const d = new Date((item.dt + timezone) * 1000);

    card.querySelector("h6").textContent = d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    card.querySelector("h5").innerHTML =
      Math.round(item.main.temp) + '<span class="small-deg">°C</span>';

    card.querySelector("img").src = pickIconPath(item.weather[0].main);
  });
}

async function fetchForecast(lat, lon, timezone) {
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
    );
    const data = await res.json();

    if (!data.list?.length) return;

    updateFiveDayForecast(data.list, timezone);
    updateTodayHourly(data.list, timezone);
  } catch (err) {
    console.error("Forecast error:", err);
  }
}

async function fetchData() {
  const input = document.querySelector(".inputField");
  if (!input) return;

  const city = input.value.trim();
  if (!city) return alert("Please enter a city name.");

  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
        city
      )}&appid=${API_KEY}&units=metric`
    );

    const data = await res.json();
    if (data.cod !== 200) return alert(data.message);

    updateCurrentWeather(data);

    const { lat, lon } = data.coord;
    fetchAQIData(lat, lon);
    fetchForecast(lat, lon, data.timezone);
  } catch (err) {
    console.error("Weather fetch error:", err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const input = document.querySelector(".inputField");
  if (!input) return;
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") fetchData();
  });
});
