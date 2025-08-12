import { calculateRelevanceScore } from '../utils/scoring';

type Item = {
  id: string;
  title: string;
  url: string;
  summary?: string;
  publishedAt: string;
  source: string;
  tags?: string[];
};

type TextCardProps = {
  item: Item;
  scoreboard: any;
  onTagClick: (tag: string) => void;
};

export default function TextCard({ item, scoreboard, onTagClick }: TextCardProps) {
  const fmt = (iso?: string) => (iso ? new Date(iso).toLocaleString() : "");

  return (
    <article className="group rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-semibold leading-snug mb-3">
            <a href={item.url} target="_blank" rel="noreferrer" className="hover:underline">
              {item.title}
            </a>
          </h2>
          <p className="text-base text-neutral-700 leading-relaxed">{item.summary}</p>
        </div>
        <span className="text-sm px-3 py-1 rounded-full bg-neutral-100 border flex-shrink-0">
          {scoreboard ? calculateRelevanceScore(item, scoreboard).toFixed(1) : '-'}
        </span>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className="text-sm text-neutral-600">{fmt(item.publishedAt)}</span>
        <span className="text-sm text-neutral-500">·</span>
        <span className="text-sm text-neutral-700">{item.source}</span>
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
    </article>
  );
}
