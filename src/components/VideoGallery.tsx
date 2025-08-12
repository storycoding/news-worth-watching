import { useEffect, useMemo, useState } from 'react'
import VideoCard from './VideoCard'

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

export default function VideoGallery({ 
  src = '/sample_videos.json',
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
  const [items, setItems] = useState<VideoItem[]>([])
  const [query, setQuery] = useState(globalQuery)
  const [tag, setTag] = useState<string | null>(globalTag)
  const [source, setSource] = useState<string | null>(globalSource)
  const [sort, setSort] = useState<"relevance" | "recent">(globalSort)

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



  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="max-w-6xl mx-auto px-4 py-3">
        <div>
          <h1 className="text-2xl font-bold">Regenerative Agriculture Video Library</h1>
          <p className="text-sm text-neutral-600">Curated videos from @DiscoverPermaculture and @amillison</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item) => (
          <VideoCard
            key={item.id}
            item={item}
            onTagClick={setTag}
          />
        ))}
      </main>
    </div>
  )
}