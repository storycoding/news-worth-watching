import { cleanTranscriptText } from '../utils/transcript';

type VideoItem = {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  tags?: string[];
  summary?: string;
  thumbnail: string;
  duration: string;
  channel: string;
  transcript?: string;
};

type VideoCardProps = {
  item: VideoItem;
  onTagClick: (tag: string) => void;
};

export default function VideoCard({ item, onTagClick }: VideoCardProps) {
  const fmt = (iso?: string) => (iso ? new Date(iso).toLocaleString() : "");

  const formatDuration = (duration: string) => {
    // Convert ISO 8601 duration to readable format
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return duration;
    
    const hours = match[1]?.replace('H', '') || '0';
    const minutes = match[2]?.replace('M', '') || '0';
    const seconds = match[3]?.replace('S', '') || '0';
    
    if (hours !== '0') {
      return `${hours}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.padStart(2, '0')}`;
  };

  return (
    <article className="group rounded-2xl border bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="relative aspect-video">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${item.url.split('v=')[1]}`}
          title={item.title}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
        />
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white text-sm px-2 py-1 rounded">
          {formatDuration(item.duration)}
        </div>
      </div>
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold leading-snug mb-3">
              <a href={item.url} target="_blank" rel="noreferrer" className="hover:underline">
                {item.title}
              </a>
            </h2>
            <p className="text-base text-neutral-700 leading-relaxed">{item.summary}</p>
          </div>
        </div>
        {item.transcript && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Transcript:</span> {cleanTranscriptText(item.transcript)}
            </p>
          </div>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="text-sm text-neutral-600">{fmt(item.publishedAt)}</span>
          <span className="text-sm text-neutral-500">•</span>
          <span className="text-sm text-neutral-600">{item.channel}</span>
          <div className="flex flex-wrap gap-2">
            {item.tags?.map((t) => (
              <button
                key={t}
                onClick={() => onTagClick(t)}
                className="text-sm px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
              >
                #{t}
              </button>
              ))}
          </div>
        </div>
      </div>
    </article>
  );
}
