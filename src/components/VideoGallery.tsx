import { useEffect, useMemo, useState } from 'react'
import { cleanTranscriptText } from '../utils/transcript'

const fmt = (iso?: string) => (iso ? new Date(iso).toLocaleString() : "")

type VideoItem = {
  id: string
  title: string
  source: string
  url: string
  publishedAt: string
  tags?: string[]
  summary?: string
  thumbnail: string
  duration: string
  channel: string
  transcript?: string
}

export default function VideoGallery({ src = '/sample_videos.json' }: { src?: string }) {
  const [items, setItems] = useState<VideoItem[]>([])
  const [query, setQuery] = useState('')
  const [tag, setTag] = useState<string | null>(null)
  const [source, setSource] = useState<string | null>(null)
  const [sort, setSort] = useState<"relevance" | "recent">("recent")

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(src)
        const data = await res.json() || []
        setItems(data)
      } catch {
        setItems([])
      }
    }

    fetchData()
  }, [src])

  const tags = useMemo(() => {
    const set = new Set<string>()
    items.forEach((v) => v.tags?.forEach(tag => set.add(tag)))
    return Array.from(set).sort()
  }, [items])

  const sources = useMemo(() => {
    const set = new Set<string>()
    items.forEach((v) => set.add(v.source))
    return Array.from(set).sort()
  }, [items])

  const filtered = useMemo(() => {
    let out = items
    if (query.trim()) {
      const q = query.toLowerCase()
      out = out.filter((i) => i.title.toLowerCase().includes(q) || i.summary?.toLowerCase().includes(q))
    }
    if (tag) out = out.filter((i) => i.tags?.includes(tag))
    if (source) out = out.filter((i) => i.source === source)
    
    out = [...out].sort((a, b) => {
      if (sort === "recent") {
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      } else {
        // Simple relevance scoring based on tags
        const getRelevanceScore = (item: VideoItem) => {
          let score = 0
          if (item.tags?.includes("agroforestry")) score += 4
          if (item.tags?.includes("regeneration")) score += 4
          if (item.tags?.includes("permaculture")) score += 3
          if (item.tags?.includes("island")) score += 3
          if (item.tags?.includes("coastal")) score += 3
          if (item.tags?.includes("water")) score += 2
          if (item.tags?.includes("soil")) score += 2
          return score
        }
        return getRelevanceScore(b) - getRelevanceScore(a)
      }
    })
    return out
  }, [items, query, tag, source, sort])

  const formatDuration = (duration: string) => {
    // Convert ISO 8601 duration to readable format
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/)
    if (!match) return duration
    
    const hours = match[1]?.replace('H', '') || '0'
    const minutes = match[2]?.replace('M', '') || '0'
    const seconds = match[3]?.replace('S', '') || '0'
    
    if (hours !== '0') {
      return `${hours}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`
    }
    return `${minutes}:${seconds.padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      {/* <header>
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Regenerative Agriculture Video Library</h1>
            <p className="text-sm text-neutral-600">Curated videos from @DiscoverPermaculture and @amillison</p>
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search videos..."
              className="px-3 py-2 rounded-xl border w-48"
            />
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
      </header> */}

      <main className="max-w-6xl mx-auto px-4 py-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item) => (
          <article key={item.id} className="group rounded-2xl border bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden">
            <div className="relative aspect-video">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${item.url.split('v=')[1]}`}
                title={item.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
              />
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white text-xs px-2 py-1 rounded">
                {formatDuration(item.duration)}
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-semibold leading-snug">
                  <a href={item.url} target="_blank" rel="noreferrer" className="hover:underline">
                    {item.title}
                  </a>
                </h2>
              </div>
              <p className="mt-2 text-sm text-neutral-700">{item.summary}</p>
              {item.transcript && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-800">
                    <span className="font-medium">Transcript:</span> {cleanTranscriptText(item.transcript)}
                  </p>
                </div>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-xs text-neutral-600">{fmt(item.publishedAt)}</span>
                <span className="text-xs text-neutral-500">•</span>
                <span className="text-xs text-neutral-600">{item.channel}</span>
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
            </div>
          </article>
        ))}
      </main>
    </div>
  )
}