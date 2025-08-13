import { useEffect, useMemo, useState } from 'react';
import { calculateRelevanceScore, getScoreboard } from '../utils/scoring';
import { loadStoredNews, scrapeLatestNews, type Item } from '../utils/newsFetcher';
import { loadFixtureData, getNewsFromFixture, getVideosFromFixture } from '../utils/fixtureLoader';
import { cleanNewsItems, type CleanedNewsItem } from '../utils/dataCleaner';
import { WORKER_TIMEOUT, WORKER_TIMEOUT_SECONDS, TIMEOUT_COUNTER_INTERVAL } from '../utils/constants';
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

type NewsItem = CleanedNewsItem;

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
  const [newsItems, setNewsItems] = useState<CleanedNewsItem[]>([]);
  const [videoItems, setVideoItems] = useState<VideoItem[]>([]);
  const [scoreboard, setScoreboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<string | null>(null);
  const [timeoutCounter, setTimeoutCounter] = useState<number>(0);
  const [timeoutInterval, setTimeoutInterval] = useState<ReturnType<typeof setInterval> | null>(null);

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
      console.log('🚀 Starting to fetch all data...');
      setLoading(true);
      try {
        let newsData: Item[] = [];
        let videoData: Item[] = [];
        let cronTimestamp: string | null = null;
        
        // First, try to get the timestamp from the worker
        try {
          console.log('🌐 Trying to get timestamp from worker...');
          const workerResponse = await loadStoredNews();
          
          // Check if we got a NewsResponse with timestamp
          if (typeof workerResponse === 'object' && 'success' in workerResponse && workerResponse.success) {
            if (workerResponse.lastCronRun) {
              cronTimestamp = workerResponse.lastCronRun;
              console.log(`📅 Got timestamp from worker: ${cronTimestamp}`);
            }
            
            // If worker has news data, use it
            if (workerResponse.news && workerResponse.news.length > 0) {
              newsData = workerResponse.news;
              console.log(`✅ Got ${newsData.length} news items from worker`);
            }
          } else if (Array.isArray(workerResponse)) {
            // We got an array of items (fallback case)
            console.log(`📁 Got ${workerResponse.length} items from worker fallback`);
            newsData = workerResponse;
          }
        } catch (error) {
          console.log('⚠️ Worker unavailable, will use fixture data');
        }
        
        // If no worker data, fall back to fixture
        if (newsData.length === 0) {
          try {
            console.log('📁 Loading from news fixture...');
            const allContent = await loadFixtureData();
            newsData = getNewsFromFixture(allContent);
            console.log(`✅ Loaded ${newsData.length} news items from fixture`);
          } catch (error) {
            console.error('❌ Failed to load fixture:', error);
            newsData = [];
          }
        }
        
        // Always load videos from fixture for now
        try {
          const allContent = await loadFixtureData();
          videoData = getVideosFromFixture(allContent);
          console.log(`✅ Loaded ${videoData.length} videos from fixture`);
        } catch (error) {
          console.error('❌ Failed to load videos:', error);
          videoData = [];
        }

        // Clean and add type identifiers
        console.log('🧹 Cleaning news data...');
        const cleanedNews = cleanNewsItems(newsData);
        console.log('🏷️ Adding type identifiers...');
        const typedNews = cleanedNews.map((item: CleanedNewsItem): NewsItem => ({ ...item, type: 'news' }));
        const typedVideos = videoData.map((item: any): VideoItem => ({ ...item, type: 'video' }));

        console.log(`📰 Setting ${typedNews.length} news items`);
        console.log(`🎥 Setting ${typedVideos.length} video items`);
        
        setNewsItems(typedNews);
        setVideoItems(typedVideos);
        
        // Set the timestamp if we got one from the worker
        if (cronTimestamp) {
          setLastFetchTime(cronTimestamp);
          console.log(`📅 Set initial timestamp: ${cronTimestamp}`);
        } else {
          console.log('📅 No timestamp available (worker may not have run yet)');
        }
        
        console.log('✅ All data loaded successfully');
      } catch (error) {
        console.error('❌ Failed to fetch content:', error);
        setNewsItems([]);
        setVideoItems([]);
      } finally {
        console.log('🔄 Setting loading to false');
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
          // Infer type if not present
          const itemType = item.type || (item.hasOwnProperty('thumbnail') ? 'video' : 'news');
          
          if (itemType === 'news' && scoreboard) {
            return calculateRelevanceScore(item, scoreboard);
          } else if (itemType === 'video') {
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

  // Function to manually refresh news from worker
  const refreshNews = async () => {
    setRefreshing(true);
    setTimeoutCounter(0);
    
          // Start timeout counter
      const interval = setInterval(() => {
        setTimeoutCounter(prev => prev + 1);
      }, TIMEOUT_COUNTER_INTERVAL);
      setTimeoutInterval(interval);
    
    try {
      console.log('🔄 Manually refreshing news from worker...');
      
      // Use the new scrapeLatestNews function with timeout
      const scrapeResult = await scrapeLatestNews({ timeout: WORKER_TIMEOUT });
      
      if (scrapeResult.success && scrapeResult.lastCronRun) {
        console.log(`📅 New cron run timestamp: ${scrapeResult.lastCronRun}`);
        setLastFetchTime(scrapeResult.lastCronRun);
        
        // Update news items if we got fresh data
        if (scrapeResult.news) {
          const cleanedNews = cleanNewsItems(scrapeResult.news);
          const typedNews = cleanedNews.map((item: CleanedNewsItem): NewsItem => ({ ...item, type: 'news' }));
          setNewsItems(typedNews);
          console.log(`✅ Refreshed ${typedNews.length} news items`);
        }
      } else {
        console.error('❌ Failed to scrape latest news:', scrapeResult.error);
        // Show error to user
        alert(`Failed to refresh news: ${scrapeResult.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Failed to refresh news:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to refresh news: ${errorMessage}`);
    } finally {
      setRefreshing(false);
      setTimeoutCounter(0);
      
      // Clear timeout interval
      if (interval) {
        clearInterval(interval);
        setTimeoutInterval(null);
      }
    }
  };

  return (
    <div className="text-neutral-900 bg-white w-full">
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* News Status and Refresh Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-blue-900">News Status</h3>
              <p className="text-blue-700 text-sm">
                {newsItems.length} news items loaded
                {lastFetchTime ? ` • Last cron run: ${new Date(lastFetchTime).toLocaleString()}` : ' • Click refresh to get latest news'}
              </p>
            </div>
            <button
              onClick={refreshNews}
              disabled={refreshing}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors relative overflow-hidden"
            >
              {refreshing ? (
                <div className="flex items-center space-x-2">
                  <span>🔄 Refreshing...</span>
                  <span className="text-xs opacity-75">
                    ({timeoutCounter}s / {WORKER_TIMEOUT_SECONDS}s)
                  </span>
                </div>
              ) : (
                '🔄 Refresh News'
              )}
              
              {/* Subtle progress bar */}
              {refreshing && (
                <div 
                  className="absolute bottom-0 left-0 h-1 bg-blue-300 transition-all duration-1000 ease-linear"
                  style={{ 
                    width: `${(timeoutCounter / WORKER_TIMEOUT_SECONDS) * 100}%` 
                  }}
                />
              )}
            </button>
          </div>
        </div>

        {filtered.map((item) => {
          // Check if item has type field, otherwise infer from structure
          const itemType = item.type || (item.hasOwnProperty('thumbnail') ? 'video' : 'news');
          
          return itemType === 'news' ? (
            <TextCard
              key={`news-${item.id}`}
              item={item as NewsItem}
              scoreboard={scoreboard}
              onTagClick={(tag) => setTags([...tags, tag])}
            />
          ) : (
            <VideoCard
              key={`video-${item.id}`}
              item={item as VideoItem}
              onTagClick={(tag) => setTags([...tags, tag])}
            />
          );
        })}
      </main>
    </div>
  );
}
