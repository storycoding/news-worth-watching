import { useEffect, useMemo, useState } from 'react'

type VideoItem = {
  id: string
  title: string
  description: string
  publishedAt: string
  channelId: string
  channelTitle: string
  thumbnails: Record<string, { url: string; width?: number; height?: number }>
  url: string
  topics?: string[]
}

type DataShape = { generatedAt: string; count: number; items: VideoItem[] }

export default function VideoGallery({ src = '/sample_videos.json' }: { src?: string }) {
  const [data, setData] = useState<DataShape | null>(null)
  const [q, setQ] = useState('')
  const [channel, setChannel] = useState('')

  useEffect(() => {
    fetch(src, { cache: 'no-store' })
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ generatedAt: '', count: 0, items: [] } as DataShape))
  }, [src])

  const channels = useMemo(() => {
    const set = new Set<string>()
    data?.items.forEach((v) => set.add(v.channelTitle))
    return Array.from(set).sort()
  }, [data])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return (data?.items || []).filter((v) => {
      const matchesQ = !term || v.title.toLowerCase().includes(term) || v.channelTitle.toLowerCase().includes(term)
      const matchesCh = !channel || v.channelTitle === channel
      return matchesQ && matchesCh
    })
  }, [data, q, channel])

  return (
    <div className="w-full">
      <Controls q={q} setQ={setQ} channel={channel} setChannel={setChannel} channels={channels} />

      {!data ? (
        <p className="text-sm opacity-70">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm opacity-70">No videos match your filters.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((v) => (
            <VideoCard key={v.id} v={v} />
          ))}
        </div>
      )}
    </div>
  )
}

function Controls({ q, setQ, channel, setChannel, channels }: {
  q: string; setQ: (v: string) => void; channel: string; setChannel: (v: string) => void; channels: string[]
}) {
  return (
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search videos…"
        className="w-full sm:w-1/2 rounded-2xl border px-4 py-2 shadow-sm focus:outline-none"
      />
      <select
        value={channel}
        onChange={(e) => setChannel(e.target.value)}
        className="w-full sm:w-1/3 rounded-2xl border px-4 py-2 shadow-sm focus:outline-none"
      >
        <option value="">All channels</option>
        {channels.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
    </div>
  )
}

function VideoCard({ v }: { v: VideoItem }) {
  return (
    <article className="rounded-2xl border bg-white shadow-sm overflow-hidden">
      <div className="relative aspect-video">
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${v.id}`}
          title={v.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
        />
      </div>
      <div className="p-4">
        <h3 className="font-medium leading-snug line-clamp-2">{v.title}</h3>
        <div className="mt-1 text-xs opacity-70">
          <span>{v.channelTitle}</span>
          <span> • {new Date(v.publishedAt).toLocaleDateString()}</span>
        </div>
      </div>
    </article>
  )
}