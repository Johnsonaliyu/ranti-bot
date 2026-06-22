export interface PrayerTimes {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

export async function getPrayerTimes(city = "Abuja", country = "Nigeria"): Promise<string> {
  try {
    const today = new Date();
    const d = today.getDate();
    const m = today.getMonth() + 1;
    const y = today.getFullYear();

    const url = `https://api.aladhan.com/v1/timingsByCity/${d}-${m}-${y}?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=3`;

    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) throw new Error(`API error ${res.status}`);

    const json = (await res.json()) as {
      data: { timings: PrayerTimes; date: { readable: string } };
    };

    const t = json.data.timings;
    const date = json.data.date.readable;

    return (
      `🕌 *Prayer Times — ${city}*\n` +
      `📅 ${date}\n\n` +
      `🌙 Fajr       ${t.Fajr}\n` +
      `🌅 Sunrise    ${t.Sunrise}\n` +
      `☀️ Dhuhr     ${t.Dhuhr}\n` +
      `🌤 Asr        ${t.Asr}\n` +
      `🌆 Maghrib   ${t.Maghrib}\n` +
      `🌃 Isha       ${t.Isha}`
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return `❌ Could not fetch prayer times: ${msg}`;
  }
}
