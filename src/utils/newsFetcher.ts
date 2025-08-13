// Define Item type locally to avoid circular dependencies
export interface Item {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  tags?: string[];
  summary?: string;
}

export interface NewsResponse {
  success: boolean;
  count: number;
  news: Item[];
  fetchedAt: string;
  lastCronRun?: string;
}

import { loadFixtureData, getNewsFromFixture } from './fixtureLoader';

export interface FetchNewsOptions {
  workerUrl?: string;
  forceRefresh?: boolean;
}

// Default worker URL (update this when you deploy)
// For local development, use localhost
const DEFAULT_WORKER_URL = 'http://localhost:8787';

/**
 * Load stored news from the Cloudflare Worker or fallback to unified content
 * This is for fast data retrieval without any processing
 */
export async function loadStoredNews(options: FetchNewsOptions = {}): Promise<NewsResponse | Item[]> {
  // Check if we should skip worker and go straight to local content
  console.log('🔍 Offline mode check:', {
    hasWindow: typeof window !== 'undefined',
    offlineWorker: typeof window !== 'undefined' ? (window as any).OFFLINE_WORKER : 'no window'
  });
  
  if (typeof window !== 'undefined' && (window as any).OFFLINE_WORKER === true) {
    try {
      console.log('📁 OFFLINE MODE: Loading directly from news fixture');
      const allContent = await loadFixtureData();
      const newsItems = getNewsFromFixture(allContent);
      console.log(`✅ Loaded ${newsItems.length} news items from news fixture`);
      return newsItems;
    } catch (error) {
      console.error('❌ Error loading unified content:', error);
      return [];
    }
  }
  
  const workerUrl = options.workerUrl || DEFAULT_WORKER_URL;
  
  try {
    console.log('📖 Loading stored news from worker...');
    const response = await fetch(`${workerUrl}/news-loader`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: NewsResponse = await response.json();
    
    if (!data.success) {
      throw new Error('Failed to fetch news from worker');
    }
    
    console.log(`✅ Loaded ${data.count} stored news items from worker`);
    return data; // Return the full response to preserve lastCronRun
    
  } catch (error) {
    console.error('❌ Error loading stored news from worker:', error);
    
    // Fallback to news fixture file (only if worker is truly unavailable)
    try {
      console.log('🔄 Worker unavailable, falling back to news fixture...');
      const allContent = await loadFixtureData();
      const newsItems = getNewsFromFixture(allContent);
      console.log(`✅ Fallback: Loaded ${newsItems.length} news items from news fixture`);
      return newsItems;
    } catch (fallbackError) {
      console.error('❌ Fallback also failed:', fallbackError);
      return [];
    }
  }
}

/**
 * Manually trigger news scraping on the worker
 * This triggers the actual scraping process and updates lastCronRun
 */
export async function triggerNewsScraping(options: FetchNewsOptions = {}): Promise<{ success: boolean; lastCronRun?: string }> {
  const workerUrl = options.workerUrl || DEFAULT_WORKER_URL;
  
  try {
    console.log('🔄 Triggering news scraping on worker...');
    const response = await fetch(`${workerUrl}/news-scraper`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      console.log(`✅ News scraping triggered successfully: ${data.count} items`);
      return { success: true, lastCronRun: data.lastCronRun };
    } else {
      throw new Error(data.error || 'Unknown error');
    }
    
  } catch (error) {
    console.error('❌ Error triggering news scraping:', error);
    return { success: false };
  }
}

/**
 * Scrape latest news and get fresh data
 * This is a convenience function that combines scraping and loading
 */
export async function scrapeLatestNews(options: FetchNewsOptions = {}): Promise<{ success: boolean; lastCronRun?: string; news?: Item[] }> {
  try {
    console.log('🔄 Scraping latest news...');
    
    // First trigger the scraping
    const scrapeResult = await triggerNewsScraping(options);
    if (!scrapeResult.success) {
      return { success: false };
    }
    
    // Then load the newly scraped data
    const newsData = await loadStoredNews(options);
    const news = Array.isArray(newsData) ? newsData : newsData.news;
    
    return {
      success: true,
      lastCronRun: scrapeResult.lastCronRun,
      news: news
    };
    
  } catch (error) {
    console.error('❌ Error scraping latest news:', error);
    return { success: false };
  }
}

/**
 * Check worker health status
 */
export async function checkWorkerHealth(options: FetchNewsOptions = {}): Promise<boolean> {
  const workerUrl = options.workerUrl || DEFAULT_WORKER_URL;
  
  try {
    const response = await fetch(`${workerUrl}/health`);
    
    if (!response.ok) {
      return false;
    }
    
    const data = await response.json();
    return data.status === 'healthy';
    
  } catch (error) {
    console.error('❌ Worker health check failed:', error);
    return false;
  }
}

/**
 * Get worker info and available endpoints
 */
export async function getWorkerInfo(options: FetchNewsOptions = {}): Promise<any> {
  const workerUrl = options.workerUrl || DEFAULT_WORKER_URL;
  
  try {
    const response = await fetch(workerUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
    
  } catch (error) {
    console.error('❌ Error getting worker info:', error);
    return null;
  }
}
