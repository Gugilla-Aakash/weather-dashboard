export default async function handler(req, res) {
  const ALLOWED = {
    weather: (q) => `https://api.openweathermap.org/data/2.5/weather?${q}`,
    forecast: (q) => `https://api.openweathermap.org/data/2.5/forecast?${q}`,
    air_pollution: (q) =>
      `https://api.openweathermap.org/data/2.5/air_pollution?${q}`,
    geocode_reverse: (q) =>
      `https://api.openweathermap.org/geo/1.0/reverse?${q}`,
  };

  try {
    const params = req.query || {};
    const endpoint = params.endpoint;

    if (!endpoint || !ALLOWED[endpoint]) {
      return res
        .status(400)
        .json({ message: "Missing or invalid 'endpoint' param." });
    }

    const allowedKeys = ["q", "lat", "lon", "units", "lang", "limit"];
    const qs = [];

    for (const k of allowedKeys) {
      if (params[k] !== undefined) {
        qs.push(`${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`);
      }
    }

    const key = process.env.OPENWEATHER_KEY;
    if (!key) {
      return res
        .status(500)
        .json({ message: "Server misconfigured: missing OPENWEATHER_KEY." });
    }
    qs.push(`appid=${encodeURIComponent(key)}`);

    if (endpoint === "air_pollution" && (!params.lat || !params.lon)) {
      return res
        .status(400)
        .json({ message: "air_pollution requires lat and lon." });
    }

    const url = ALLOWED[endpoint](qs.join("&"));

    const response = await fetch(url);
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const data = await response.json();
      return res.status(response.status).json(data);
    } else {
      const text = await response.text();
      return res.status(response.status).send(text);
    }
  } catch (err) {
    console.error("weather function error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
