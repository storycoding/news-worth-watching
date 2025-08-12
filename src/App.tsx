import { useState, useMemo } from 'react';
import ContentDashboard from "./components/ContentDashboard";
import SourcesSection from "./components/SourcesSection";
import UnifiedSearch from "./components/UnifiedSearch";

export default function App() {
  // Global filtering state
  const [query, setQuery] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [sort, setSort] = useState<"relevance" | "recent">("recent");

  // Placeholder for tags and sources - these will be populated by ContentDashboard
  const [allTags, setAllTags] = useState<string[]>([]);
  const [allSources, setAllSources] = useState<string[]>([]);

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-7xl px-4 py-8 bg-white">
        {/* Site Header */}
        <header className="mb-8">
          <div className="max-w-4xl mx-auto px-4">
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">News Worth Watching</h1>
            <p className="text-lg text-neutral-600">News that empower you to make informed decisions</p>
          </div>
        </header>

        {/* Unified Search Bar */}
        <UnifiedSearch
          query={query}
          setQuery={setQuery}
          tags={tags}
          setTags={setTags}
          sort={sort}
          setSort={setSort}
          contentType="all"
          setContentType={() => {}}
          allTags={allTags}
          allSources={allSources}
        />

        {/* Unified Content Dashboard */}
        <section className="mb-10 bg-gray-100">
          <ContentDashboard 
            globalQuery={query}
            globalTags={tags}
            globalSort={sort}
            onTagsAndSourcesUpdate={(tags, sources) => {
              setAllTags(tags);
              setAllSources(sources);
            }}
          />
        </section>

        {/* Sources Section */}
        <section className="mb-10">
          <SourcesSection />
        </section>

        <footer className="mt-16 border-t pt-6 text-xs opacity-60">
          <div className="max-w-4xl mx-auto px-4">
            <p>© {new Date().getFullYear()} Served by Nuno Neves</p>
          </div>
        </footer>
      </div>
    </div>
  )
}