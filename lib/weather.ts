export async function getWeather(city: string = "Abuja"): Promise<string> {
  try {
    const url = `https://wttr.in/${encodeURIComponent(city)}?format=j1`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8_000),
    });

    if (!res.ok) return `Could not fetch weather for ${city}.`;

    const data = (await res.json()) as {
      current_condition: {
        temp_C: string;
        FeelsLikeC: string;
        humidity: string;
        windspeedKmph: string;
        weatherDesc: { value: string }[];
      }[];
      weather: {
        date: string;
        maxtempC: string;
        mintempC: string;
        hourly: { weatherDesc: { value: string }[] }[];
      }[];
      nearest_area: { areaName: { value: string }[] }[];
    };

    const c = data.current_condition[0];
    const area = data.nearest_area[0]?.areaName[0]?.value ?? city;
    const forecast = data.weather.slice(0, 3).map((d) => ({
      date: d.date,
      max: d.maxtempC,
      min: d.mintempC,
      condition: d.hourly[4]?.weatherDesc[0]?.value ?? "—",
    }));

    const forecastText = forecast
      .map((d) => `  📅 ${d.date}: ${d.condition}, ${d.min}°–${d.max}°C`)
      .join("\n");

    return [
      `🌤 *Weather in ${area}*`,
      `🌡 ${c.temp_C}°C (feels like ${c.FeelsLikeC}°C)`,
      `☁️ ${c.weatherDesc[0]?.value ?? "Unknown"}`,
      `💧 Humidity: ${c.humidity}%`,
      `💨 Wind: ${c.windspeedKmph} km/h`,
      ``,
      `*3-Day Forecast:*`,
      forecastText,
    ].join("\n");
  } catch {
    return `❌ Weather service unavailable. Try again shortly.`;
  }
}
