import { supabase } from "./supabase.js";
import { chat } from "./ai.js";

export type JobCategory =
  | "sales"
  | "vibe coding"
  | "geography teacher"
  | "data analyst"
  | "data collector";

export const JOB_CATEGORIES: JobCategory[] = [
  "sales",
  "vibe coding",
  "geography teacher",
  "data analyst",
  "data collector",
];

function buildUrls(category: JobCategory): string[] {
  const q = encodeURIComponent(category);
  return [
    `https://www.jobberman.com/jobs?q=${q}&l=abuja`,
    `https://www.myjobmag.com/jobs-in-abuja/q/${encodeURIComponent(category)}`,
    `https://ngcareers.com/jobs?q=${q}&location=abuja`,
  ];
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, 5000);
}

async function scrapeOne(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return "";
    return stripHtml(await res.text());
  } catch {
    return "";
  }
}

export interface Job {
  title: string;
  company: string;
  location: string;
  salary?: string;
  deadline?: string;
  link?: string;
  category: JobCategory;
}

export async function scrapeJobs(category: JobCategory): Promise<Job[]> {
  const urls = buildUrls(category);
  const texts = await Promise.all(urls.map(scrapeOne));
  const combined = texts.filter(Boolean).join("\n\n---\n\n");

  if (!combined.trim()) return [];

  const prompt = `Extract all job listings from the text below for "${category}" jobs in Abuja, Nigeria.
Return ONLY a JSON array with objects having these fields: title, company, location, salary (or null), deadline (or null), link (or null).
If no jobs are found, return an empty array [].
Do not include jobs outside Abuja unless marked as Remote.
Text:
${combined}`;

  try {
    const raw = await chat([{ role: "user", content: prompt }]);
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) return [];
    const parsed = JSON.parse(match[0]) as Omit<Job, "category">[];
    return parsed.map((j) => ({ ...j, category }));
  } catch {
    return [];
  }
}

export async function saveJobs(jobs: Job[]): Promise<number> {
  if (!jobs.length) return 0;
  let saved = 0;
  for (const job of jobs) {
    const { error } = await supabase.from("ranti_jobs").upsert(
      {
        title: job.title,
        company: job.company ?? "Unknown",
        location: job.location ?? "Abuja, Nigeria",
        salary: job.salary,
        deadline: job.deadline,
        link: job.link,
        category: job.category,
      },
      { onConflict: "title,company", ignoreDuplicates: true },
    );
    if (!error) saved++;
  }
  return saved;
}

export async function getSavedJobs(category?: JobCategory): Promise<Job[]> {
  let query = supabase
    .from("ranti_jobs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

  if (category) query = query.eq("category", category);

  const { data } = await query;
  return (data ?? []) as Job[];
}

export function formatJobs(jobs: Job[], category?: string): string {
  if (!jobs.length) {
    return `No ${category ?? ""} jobs found in Abuja right now. Try again later.`;
  }

  const header = `💼 *${category ? category.toUpperCase() : "ALL"} JOBS — Abuja*\n`;
  const list = jobs
    .map(
      (j, i) =>
        `${i + 1}. *${j.title}*\n` +
        `   🏢 ${j.company}\n` +
        `   📍 ${j.location}` +
        (j.salary ? `\n   💰 ${j.salary}` : "") +
        (j.deadline ? `\n   📅 Deadline: ${j.deadline}` : "") +
        (j.link ? `\n   🔗 ${j.link}` : ""),
    )
    .join("\n\n");

  return header + list;
}
