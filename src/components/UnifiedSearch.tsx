import { useState } from 'react';

type UnifiedSearchProps = {
  query: string;
  setQuery: (query: string) => void;
  tags: string[];
  setTags: (tags: string[]) => void;
  sort: "relevance" | "recent";
  setSort: (sort: "relevance" | "recent") => void;
  allTags: string[];
};

export default function UnifiedSearch({
  query,
  setQuery,
  tags,
  setTags,
  sort,
  setSort,
  allTags,
}: UnifiedSearchProps) {
  return (
    <div className="bg-white top-0 z-10">
      <div className="max-w-4xl mx-auto px-4 py-4">
        {/* Filter controls */}
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <button
              onClick={() => document.getElementById('tag-dropdown')?.classList.toggle('hidden')}
              className="px-3 py-2 rounded-xl border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-neutral-700 text-white text-left min-w-[120px]"
            >
              {tags.length === 0 ? 'All tags selected' : tags.length === 1 ? `${tags[0]} tag selected` : `${tags.length} tags selected`}
            </button>
            <div id="tag-dropdown" className="hidden absolute top-full left-0 mt-1 w-48 bg-neutral-700 border border-neutral-600 rounded-xl shadow-lg z-20 max-h-60 overflow-y-auto">
              <div className="p-2">
                {allTags.map((tag) => (
                  <label key={tag} className="flex items-center gap-2 p-2 hover:bg-neutral-600 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tags.includes(tag)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setTags([...tags, tag]);
                        } else {
                          setTags(tags.filter(t => t !== tag));
                        }
                      }}
                      className="rounded border-neutral-400 text-blue-400 focus:ring-blue-500 bg-neutral-700"
                    />
                    <span className="text-sm text-white">{tag}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as "relevance" | "recent")}
            className="px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="relevance">Sort: Relevance</option>
            <option value="recent">Sort: Recent</option>
          </select>
        </div>
      </div>
    </div>
  );
}
