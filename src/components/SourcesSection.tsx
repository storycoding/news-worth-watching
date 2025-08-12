import { useEffect, useState } from 'react';

type Source = {
  label: string;
  url: string;
};

type SourceGroup = {
  name: string;
  sources: Source[];
};

export default function SourcesSection() {
  const [sourceGroups, setSourceGroups] = useState<SourceGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSources = async () => {
      try {
        const response = await fetch('/sources.json');
        const data = await response.json();
        setSourceGroups(data);
      } catch (error) {
        console.error('Failed to load sources:', error);
        setSourceGroups([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSources();
  }, []);

  if (loading) {
    return (
      <section className="max-w-4xl mx-auto px-4 pb-10">
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-sm text-neutral-600">Loading sources...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-4xl mx-auto px-4 pb-10">
      <div className="rounded-2xl p-4">
        <h3 className="font-semibold mb-2 text-gray-500">Sources</h3>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {sourceGroups.map((group) => (
            <div key={group.name} className="rounded-xl border bg-white p-3 text-gray-500">
              <div className="text-sm font-medium mb-1">{group.name}</div>
              <ul className="text-sm list-disc list-inside text-neutral-700">
                {group.sources.map((source) => (
                  <li key={source.label}>
                    <a className="hover:underline" href={source.url} target="_blank" rel="noreferrer">
                      {source.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
