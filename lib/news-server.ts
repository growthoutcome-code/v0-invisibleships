import { readFile } from "node:fs/promises";
import path from "node:path";
import type { NewsItem } from "@/lib/news";

/** The News index as scripts/build_news_index.py wrote it. Server only. */
export async function readNewsIndex(): Promise<NewsItem[]> {
  const raw = await readFile(path.join(process.cwd(), "public/data/news/index.json"), "utf-8");
  return JSON.parse(raw) as NewsItem[];
}
