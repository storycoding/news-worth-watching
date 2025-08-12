// ===== File: components/AzoresNewsDashboard.tsx =====
"use client";
import { useEffect, useMemo, useState } from "react";
import { calculateRelevanceScore, getScoreboard, type Item } from "../utils/scoring";
import TextCard from './TextCard';

const uniq = <T,>(arr: T[]) => Array.from(new Set(arr));

export default function AzoresNewsDashboard({ 
  src = '/sample_texts.json',
  globalQuery = "",
  globalTag = null,
  globalSource = null,
  globalSort = "recent" as "relevance" | "recent"
}: { 
  src?: string;
  globalQuery?: string;
  globalTag?: string | null;
  globalSource?: string | null;
  globalSort?: "relevance" | "recent";
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [scoreboard, setScoreboard] = useState<any>(null);
  
  // Use global filters if provided, otherwise fall back to URL params
  const urlParams = new URLSearchParams(window.location.search);
  const [query, setQuery] = useState(globalQuery || urlParams.get("q") || "");
  const [tag, setTag] = useState<string | null>(globalTag ?? urlParams.get("tag"));
  const [source, setSource] = useState<string | null>(globalSource ?? urlParams.get("source"));
  const [sort, setSort] = useState<"relevance" | "recent">(globalSort || (urlParams.get("sort") as "relevance" | "recent") || "recent");

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
            {/* Individual search controls removed - now handled by unified search */}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item) => (
          <TextCard
            key={item.id}
            item={item}
            scoreboard={scoreboard}
            onTagClick={setTag}
          />
        ))}
      </main>
    </div>
  );
}