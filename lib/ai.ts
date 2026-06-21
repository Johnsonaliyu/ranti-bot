export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

// Groq models to try in order — first one that responds wins
const GROQ_MODELS = [
  "moonshotai/kimi-k2-instruct",
  "meta-llama/llama-4-scout-17b-16e-instruct",
  "llama-3.3-70b-versatile",
  "groq/compound",
  "llama3-70b-8192",
];

async function callGroq(messages: Message[]): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not set");

  let lastError: Error | null = null;

  for (const model of GROQ_MODELS) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: 1024,
          temperature: 0.7,
        }),
        signal: AbortSignal.timeout(25_000),
      });

      if (!res.ok) {
        const err = await res.text();
        console.warn(`[groq] ${model} failed (${res.status}):`, err.slice(0, 100));
        lastError = new Error(`Groq ${res.status} on ${model}`);
        continue; // try next model
      }

      const data = (await res.json()) as {
        choices: { message: { content: string } }[];
      };
      const text = data.choices[0]?.message?.content?.trim();
      if (!text) throw new Error("Empty response from Groq");
      console.log(`[groq] ✅ responded using ${model}`);
      return text;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`[groq] ${model} threw:`, lastError.message);
    }
  }

  throw lastError ?? new Error("All Groq models failed");
}

async function callNvidia(messages: Message[]): Promise<string> {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) throw new Error("NVIDIA_API_KEY not set");

  const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "meta/llama-3.3-70b-instruct",
      messages,
      max_tokens: 1024,
      temperature: 0.7,
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Nvidia ${res.status}: ${err.slice(0, 100)}`);
  }

  const data = (await res.json()) as {
    choices: { message: { content: string } }[];
  };
  const text = data.choices[0]?.message?.content?.trim();
  if (!text) throw new Error("Empty response from Nvidia");
  console.log("[nvidia] ✅ responded as fallback");
  return text;
}

// Main export — tries Groq first, Nvidia as fallback
export async function chat(messages: Message[]): Promise<string> {
  try {
    return await callGroq(messages);
  } catch (groqErr) {
    console.warn("[ai] Groq chain exhausted, trying Nvidia:", groqErr instanceof Error ? groqErr.message : groqErr);
    try {
      return await callNvidia(messages);
    } catch (nvidiaErr) {
      console.error("[ai] Both providers failed:", nvidiaErr);
      throw new Error("All AI providers are currently unavailable. Please try again shortly.");
    }
  }
}
