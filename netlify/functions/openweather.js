const ALLOWED = {
  weather: (q) => `https://api.openweathermap.org/data/2.5/weather?${q}`,
  forecast: (q) => `https://api.openweathermap.org/data/2.5/forecast?${q}`,
  air_pollution: (q) =>
    `https://api.openweathermap.org/data/2.5/air_pollution?${q}`,
  geocode_reverse: (q) => `https://api.openweathermap.org/geo/1.0/reverse?${q}`,
};

exports.handler = async function (event) {
  try {
    const params = event.queryStringParameters || {};

    const endpoint = params.endpoint;
    if (!endpoint || !ALLOWED[endpoint]) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Missing or invalid 'endpoint' param.",
        }),
      };
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
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: "Server misconfigured: missing OPENWEATHER_KEY.",
        }),
      };
    }
    qs.push(`appid=${encodeURIComponent(key)}`);

    if (endpoint === "air_pollution" && (!params.lat || !params.lon)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "air_pollution requires lat and lon.",
        }),
      };
    }

    const url = ALLOWED[endpoint](qs.join("&"));

    const res = await fetch(url);
    const contentType = res.headers.get("content-type") || "";

    const body = contentType.includes("application/json")
      ? JSON.stringify(await res.json())
      : await res.text();

    return {
      statusCode: res.status,
      headers: {
        "Content-Type": contentType,
      },
      body,
    };
  } catch (err) {
    console.error("openweather function error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error" }),
    };
  }
};
