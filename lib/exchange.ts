const CURRENCIES = ["USD", "GBP", "EUR", "CAD", "AED", "SAR", "CNY"];

export async function getExchangeRates(): Promise<string> {
  try {
    // frankfurter.app — free, no API key
    const res = await fetch(
      `https://api.frankfurter.app/latest?from=USD&to=GBP,EUR,CAD,AED,SAR,CNY`,
      { signal: AbortSignal.timeout(10_000) },
    );
    if (!res.ok) throw new Error(`API error ${res.status}`);

    const data = (await res.json()) as { rates: Record<string, number>; date: string };

    // Get NGN rate from a separate call
    const ngnRes = await fetch(
      `https://api.frankfurter.app/latest?from=NGN&to=USD,GBP,EUR`,
      { signal: AbortSignal.timeout(10_000) },
    );

    let ngnBlock = "";
    if (ngnRes.ok) {
      const ngnData = (await ngnRes.json()) as { rates: Record<string, number> };
      const usd = ngnData.rates["USD"] ? (1 / ngnData.rates["USD"]).toFixed(2) : "N/A";
      const gbp = ngnData.rates["GBP"] ? (1 / ngnData.rates["GBP"]).toFixed(2) : "N/A";
      const eur = ngnData.rates["EUR"] ? (1 / ngnData.rates["EUR"]).toFixed(2) : "N/A";

      ngnBlock =
        `\n*NGN Exchange (₦1 =)*\n` +
        `🇺🇸 USD: $${ngnData.rates["USD"]?.toFixed(6) ?? "N/A"}\n` +
        `🇬🇧 GBP: £${ngnData.rates["GBP"]?.toFixed(6) ?? "N/A"}\n` +
        `🇪🇺 EUR: €${ngnData.rates["EUR"]?.toFixed(6) ?? "N/A"}\n\n` +
        `*To get ₦1,000,000:*\n` +
        `🇺🇸 $${(1_000_000 * (ngnData.rates["USD"] ?? 0)).toFixed(2)}\n` +
        `🇬🇧 £${(1_000_000 * (ngnData.rates["GBP"] ?? 0)).toFixed(2)}\n` +
        `🇪🇺 €${(1_000_000 * (ngnData.rates["EUR"] ?? 0)).toFixed(2)}`;
    }

    const r = data.rates;
    return (
      `💱 *Exchange Rates* (${data.date})\n\n` +
      `*1 USD =*\n` +
      `🇬🇧 £${r["GBP"]?.toFixed(4) ?? "N/A"}\n` +
      `🇪🇺 €${r["EUR"]?.toFixed(4) ?? "N/A"}\n` +
      `🇨🇦 CA$${r["CAD"]?.toFixed(4) ?? "N/A"}\n` +
      `🇦🇪 د.إ${r["AED"]?.toFixed(4) ?? "N/A"}\n` +
      `🇸🇦 ﷼${r["SAR"]?.toFixed(4) ?? "N/A"}\n` +
      `🇨🇳 ¥${r["CNY"]?.toFixed(4) ?? "N/A"}` +
      ngnBlock
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return `❌ Could not fetch exchange rates: ${msg}`;
  }
}
