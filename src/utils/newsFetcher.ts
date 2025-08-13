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
import { DEFAULT_WORKER_URL, WORKER_TIMEOUT } from './constants';

export interface FetchNewsOptions {
  workerUrl?: string;
  forceRefresh?: boolean;
  timeout?: number; // Timeout in milliseconds
}

// Default timeout for worker requests (30 seconds)
const DEFAULT_TIMEOUT = WORKER_TIMEOUT;

/**
 * Create a fetch request with timeout
 */
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout: number = DEFAULT_TIMEOUT): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeout}ms`);
    }
    throw error;
  }
}

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
    const timeout = options.timeout || DEFAULT_TIMEOUT;
    const response = await fetchWithTimeout(`${workerUrl}/news-loader`, {}, timeout);
    
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
    
    // Provide specific error messages based on the error type
    let errorMessage = 'Unknown error occurred';
    if (error instanceof Error) {
      if (error.message.includes('timed out')) {
        errorMessage = `Worker request timed out after ${options.timeout || DEFAULT_TIMEOUT}ms. The worker may be overloaded or experiencing issues.`;
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Unable to connect to the worker. Please check your internet connection and try again.';
      } else if (error.message.includes('HTTP error')) {
        errorMessage = `Worker returned an error: ${error.message}`;
      } else {
        errorMessage = error.message;
      }
    }
    
    // Fallback to news fixture file (only if worker is truly unavailable)
    try {
      console.log('🔄 Worker unavailable, falling back to news fixture...');
      const allContent = await loadFixtureData();
      const newsItems = getNewsFromFixture(allContent);
      console.log(`✅ Fallback: Loaded ${newsItems.length} news items from news fixture`);
      return newsItems;
    } catch (fallbackError) {
      console.error('❌ Fallback also failed:', fallbackError);
      throw new Error(`Worker unavailable and fallback failed: ${errorMessage}`);
    }
  }
}

/**
 * Manually trigger news scraping on the worker
 * This triggers the actual scraping process and updates lastCronRun
 */
export async function triggerNewsScraping(options: FetchNewsOptions = {}): Promise<{ success: boolean; lastCronRun?: string; error?: string }> {
  const workerUrl = options.workerUrl || DEFAULT_WORKER_URL;
  
  try {
    console.log('🔄 Triggering news scraping on worker...');
    const timeout = options.timeout || DEFAULT_TIMEOUT;
    const response = await fetchWithTimeout(`${workerUrl}/news-scraper`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, timeout);
    
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
    
    // Provide specific error messages
    let errorMessage = 'Unknown error occurred';
    if (error instanceof Error) {
      if (error.message.includes('timed out')) {
        errorMessage = `News scraping timed out after ${options.timeout || DEFAULT_TIMEOUT}ms. The worker may be overloaded.`;
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Unable to connect to the worker. Please check your internet connection.';
      } else if (error.message.includes('HTTP error')) {
        errorMessage = `Worker returned an error: ${error.message}`;
      } else {
        errorMessage = error.message;
      }
    }
    
    return { 
      success: false, 
      error: errorMessage 
    };
  }
}

/**
 * Scrape latest news and get fresh data
 * This is a convenience function that combines scraping and loading
 */
export async function scrapeLatestNews(options: FetchNewsOptions = {}): Promise<{ success: boolean; lastCronRun?: string; news?: Item[]; error?: string }> {
  try {
    console.log('🔄 Scraping latest news...');
    
    // First trigger the scraping
    const scrapeResult = await triggerNewsScraping(options);
    if (!scrapeResult.success) {
      return { 
        success: false, 
        error: scrapeResult.error || 'News scraping failed'
      };
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return { 
      success: false, 
      error: errorMessage
    };
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
