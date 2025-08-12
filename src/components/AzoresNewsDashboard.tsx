// ===== File: components/AzoresNewsDashboard.tsx =====
"use client";
import { useEffect, useMemo, useState } from "react";
import { calculateRelevanceScore, getScoreboard, type Item } from "../utils/scoring";

const fmt = (iso?: string) => (iso ? new Date(iso).toLocaleString() : "");
const uniq = <T,>(arr: T[]) => Array.from(new Set(arr));

export default function AzoresNewsDashboard({ src = '/sample_texts.json' }: { src?: string }) {
  const [items, setItems] = useState<Item[]>([]);
  const [scoreboard, setScoreboard] = useState<any>(null);
  
  // Get initial values from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const [query, setQuery] = useState(urlParams.get("q") || "");
  const [tag, setTag] = useState<string | null>(urlParams.get("tag"));
  const [source, setSource] = useState<string | null>(urlParams.get("source"));
  const [sort, setSort] = useState<"relevance" | "recent">((urlParams.get("sort") as "relevance" | "recent") || "recent");

  // Function to update URL params
  const updateURL = (updates: Record<string, string | null>) => {
    const url = new URL(window.location.href);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "") {
        url.searchParams.delete(key);
      } else {
        url.searchParams.set(key, value);
      }
    });
    window.history.replaceState({}, "", url.toString());
  };

  // Update URL when state changes
  useEffect(() => {
    updateURL({ q: query, tag, source, sort });
  }, [query, tag, source, sort]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // TODO: fetch from /api/news
        // const response = await fetch("/api/news");
        // const response = await fetch(src);
        // const data = await response.json();
        const res = await fetch(src);
        const data = await res.json() || [];
        setItems(data);
      } catch {
        setItems([]);
      }
    };

    fetchData();
  }, []);

  // Fetch scoreboard
  useEffect(() => {
    const loadScoreboard = async () => {
      try {
        const board = await getScoreboard();
        setScoreboard(board);
      } catch (error) {
        console.error('Failed to load scoreboard:', error);
      }
    };
    
    loadScoreboard();
  }, []);

  const tags = useMemo(() => uniq(items.flatMap((i) => i.tags ?? [])).sort(), [items]);
  const sources = useMemo(() => uniq(items.map((i) => i.source)).sort(), [items]);

  const filtered = useMemo(() => {
    let out = items;
    if (query.trim()) {
      const q = query.toLowerCase();
      out = out.filter((i) => i.title.toLowerCase().includes(q) || i.summary?.toLowerCase().includes(q));
    }
    if (tag) out = out.filter((i) => i.tags?.includes(tag));
    if (source) out = out.filter((i) => i.source === source);
    out = [...out].sort((a, b) => {
      if (sort === "recent") {
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      } else if (scoreboard) {
        return calculateRelevanceScore(b, scoreboard) - calculateRelevanceScore(a, scoreboard);
      }
      return 0;
    });
    return out;
  }, [items, query, tag, source, sort]);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <header>
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Sovereign Information Dashboard — Azores</h1>
            <p className="text-sm text-neutral-600">Noise-free curation for São Miguel · Azores · analogous ecosystems</p>
          </div>
          <div className="flex gap-2 flex-wrap items-center text-white">
            {/* <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search titles & summaries"
              className="px-3 py-2 rounded-xl border w-64"
            /> */}
            <select value={tag ?? ""} onChange={(e) => setTag(e.target.value || null)} className="px-3 py-2 rounded-xl border">
              <option value="">All tags</option>
              {tags.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <select value={source ?? ""} onChange={(e) => setSource(e.target.value || null)} className="px-3 py-2 rounded-xl border">
              <option value="">All sources</option>
              {sources.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select value={sort} onChange={(e) => setSort(e.target.value as "relevance" | "recent")} className="px-3 py-2 rounded-xl border">
              <option value="relevance">Sort: Relevance</option>
              <option value="recent">Sort: Recent</option>
            </select>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item) => (
          <article key={item.id} className="group rounded-2xl border bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold leading-snug">
                <a href={item.url} target="_blank" rel="noreferrer" className="hover:underline">
                  {item.title}
                </a>
              </h2>
              <span className="text-xs px-2 py-1 rounded-full bg-neutral-100 border">
                {scoreboard ? calculateRelevanceScore(item, scoreboard).toFixed(1) : '-'}
              </span>
            </div>
            <p className="mt-2 text-sm text-neutral-700">{item.summary}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs text-neutral-600">{fmt(item.publishedAt)}</span>
              <span className="text-xs text-neutral-500">·</span>
              <span className="text-xs text-neutral-700">{item.source}</span>
              {item.tags?.map((t) => (
                <button
                  key={t}
                  onClick={() => setTag(t)}
                  className="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                >
                  #{t}
                </button>
              ))}
            </div>
          </article>
        ))}
      </main>

      <aside className="max-w-6xl mx-auto px-4 pb-10">
        <div className="rounded-2xl border bg-white p-4">
          <h3 className="font-semibold mb-2">Sources (configurable)</h3>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                name: "Azores · Policy & Regional",
                sources: [
                  { label: "Governo dos Açores", url: "https://www.azores.gov.pt/rss" },
                  { label: "Diário da República", url: "https://dre.pt/rss" },
                  { label: "INOVA (Inovação Açores)", url: "https://inova.azores.gov.pt/rss" },
                ],
              },
              {
                name: "São Miguel · Environment & Research",
                sources: [
                  { label: "Azores Geopark", url: "https://azoresgeopark.com/feed" },
                  { label: "Universidade dos Açores", url: "https://www.uac.pt/rss" },
                  { label: "Nature/Science (Azores)", url: "https://www.nature.com/subjects/island-biology.rss" },
                ],
              },
              {
                name: "Permaculture & Regeneration",
                sources: [
                  { label: "FAO Agroecology", url: "https://www.fao.org/agroecology/rss/en/" },
                  { label: "Regeneration.org", url: "https://www.regeneration.org/rss" },
                  { label: "EU Environment", url: "https://environment.ec.europa.eu/news_en?format=rss" },
                ],
              },
            ].map((g) => (
              <div key={g.name} className="rounded-xl border p-3">
                <div className="text-sm font-medium mb-1">{g.name}</div>
                <ul className="text-sm list-disc list-inside text-neutral-700">
                  {g.sources.map((s) => (
                    <li key={s.label}>
                      <a className="hover:underline" href={s.url} target="_blank" rel="noreferrer">
                        {s.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="text-xs text-neutral-600 mt-3">Tip: Move these URLs to a backend Worker that fetches & normalizes feeds, then expose /api/news.</p>
        </div>
      </aside>

      <footer className="max-w-6xl mx-auto px-4 pb-10 text-xs text-neutral-500">Built for a sovereign information diet: pre-curated sources, scoring, and noise controls.</footer>
    </div>
  );
}