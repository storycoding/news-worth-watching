import { useEffect, useMemo, useState } from 'react';
import { calculateRelevanceScore, getScoreboard, type Item } from '../utils/scoring';
import TextCard from './TextCard';
import VideoCard from './VideoCard';

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
  type: 'video';
};

type NewsItem = Item & {
  type: 'news';
};

type ContentItem = NewsItem | VideoItem;

type ContentDashboardProps = {
  globalQuery?: string;
  globalTags?: string[];
  globalSort?: "relevance" | "recent";
  onTagsAndSourcesUpdate?: (tags: string[]) => void;
};

export default function ContentDashboard({
  globalQuery = "",
  globalTags = [],
  globalSort = "recent",
  onTagsAndSourcesUpdate
}: ContentDashboardProps) {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [videoItems, setVideoItems] = useState<VideoItem[]>([]);
  const [scoreboard, setScoreboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Unified filtering state
  const [query, setQuery] = useState(globalQuery);
  const [tags, setTags] = useState<string[]>(globalTags);
  const [sort, setSort] = useState<"relevance" | "recent">(globalSort);

  // Sync internal state with global filters
  useEffect(() => {
    setQuery(globalQuery);
  }, [globalQuery]);

  useEffect(() => {
    setTags(globalTags);
  }, [globalTags]);

  useEffect(() => {
    setSort(globalSort);
  }, [globalSort]);

  // Fetch all data
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        const [newsResponse, videoResponse] = await Promise.all([
          fetch('/sample_texts.json'),
          fetch('/sample_videos.json')
        ]);

        const newsData = await newsResponse.json() || [];
        const videoData = await videoResponse.json() || [];

        // Add type identifiers
        const typedNews = newsData.map((item: Item): NewsItem => ({ ...item, type: 'news' }));
        const typedVideos = videoData.map((item: any): VideoItem => ({ ...item, type: 'video' }));

        setNewsItems(typedNews);
        setVideoItems(typedVideos);
      } catch (error) {
        console.error('Failed to fetch content:', error);
        setNewsItems([]);
        setVideoItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
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

  // Extract all available tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    [...newsItems, ...videoItems].forEach(item => {
      item.tags?.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [newsItems, videoItems]);

  // Notify parent component when tags are available
  useEffect(() => {
    if (onTagsAndSourcesUpdate && allTags.length > 0) {
      onTagsAndSourcesUpdate(allTags);
    }
  }, [allTags, onTagsAndSourcesUpdate]);

  // Unified filtering and sorting
  const filtered = useMemo(() => {
    let allContent: ContentItem[] = [...newsItems, ...videoItems];



    // Apply query filter
    if (query.trim()) {
      const q = query.toLowerCase();
      allContent = allContent.filter(item => 
        item.title.toLowerCase().includes(q) || 
        item.summary?.toLowerCase().includes(q)
      );
    }

    // Apply tag filter
    if (tags.length > 0) {
      allContent = allContent.filter(item => 
        item.tags && tags.some(tag => item.tags!.includes(tag))
      );
    }



    // Apply sorting
    allContent = [...allContent].sort((a, b) => {
      if (sort === "recent") {
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      } else {
        // Relevance sorting - normalize scores across content types
        const getRelevanceScore = (item: ContentItem): number => {
          if (item.type === 'news' && scoreboard) {
            return calculateRelevanceScore(item, scoreboard);
          } else if (item.type === 'video') {
            // Normalize video scoring to be comparable with news scores
            let score = 0;
            if (item.tags?.includes("agroforestry")) score += 4;
            if (item.tags?.includes("regeneration")) score += 4;
            if (item.tags?.includes("permaculture")) score += 3;
            if (item.tags?.includes("island")) score += 3;
            if (item.tags?.includes("coastal")) score += 3;
            if (item.tags?.includes("water")) score += 2;
            if (item.tags?.includes("soil")) score += 2;
            // Scale up to be comparable with news scores (typically 0-20 range)
            return score * 2;
          }
          return 0;
        };

        const scoreA = getRelevanceScore(a);
        const scoreB = getRelevanceScore(b);
        

        
        return scoreB - scoreA;
      }
    });



    return allContent;
  }, [newsItems, videoItems, query, tags, sort, scoreboard]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 text-neutral-900 flex items-center justify-center">
        <div className="text-lg">Loading content...</div>
      </div>
    );
  }

  return (
    <div className="text-neutral-900 bg-white w-full">
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {filtered.map((item) => (
          item.type === 'news' ? (
                      <TextCard
            key={`news-${item.id}`}
            item={item}
            scoreboard={scoreboard}
            onTagClick={(tag) => setTags([...tags, tag])}
          />
          ) : (
            <VideoCard
              key={`video-${item.id}`}
              item={item}
              onTagClick={(tag) => setTags([...tags, tag])}
            />
          )
        ))}
      </main>
    </div>
  );
}
