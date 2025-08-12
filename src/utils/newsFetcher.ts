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
}

export interface FetchNewsOptions {
  workerUrl?: string;
  forceRefresh?: boolean;
}

// Default worker URL (update this when you deploy)
// For local development, use localhost
const DEFAULT_WORKER_URL = 'http://localhost:8787';

/**
 * Fetch latest news from the Cloudflare Worker or fallback to unified content
 */
export async function fetchLatestNews(options: FetchNewsOptions = {}): Promise<Item[]> {
  // Check if we should skip worker and go straight to local content
  console.log('🔍 Offline mode check:', {
    hasWindow: typeof window !== 'undefined',
    offlineWorker: typeof window !== 'undefined' ? (window as any).OFFLINE_WORKER : 'no window'
  });
  
  if (typeof window !== 'undefined' && (window as any).OFFLINE_WORKER === true) {
    try {
      console.log('📁 OFFLINE MODE: Loading directly from news fixture');
      const response = await fetch('/news_fixture.json');
      const allContent = await response.json();
      const newsItems = allContent.filter((item: any) => item.type === 'news');
      console.log(`✅ Loaded ${newsItems.length} news items from news fixture`);
      return newsItems;
    } catch (error) {
      console.error('❌ Error loading unified content:', error);
      return [];
    }
  }
  
  const workerUrl = options.workerUrl || DEFAULT_WORKER_URL;
  
  try {
    const response = await fetch(`${workerUrl}/news`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: NewsResponse = await response.json();
    
    if (!data.success) {
      throw new Error('Failed to fetch news from worker');
    }
    
    console.log(`✅ Fetched ${data.count} news items from worker`);
    return data.news;
    
  } catch (error) {
    console.error('❌ Error fetching news from worker:', error);
    
    // Fallback to news fixture file
    try {
      console.log('🔄 Worker failed, falling back to news fixture...');
      const response = await fetch('/news_fixture.json');
      const allContent = await response.json();
      // Filter to only news items
      const newsItems = allContent.filter((item: any) => item.type === 'news');
      console.log(`✅ Fallback: Loaded ${newsItems.length} news items from news fixture`);
      return newsItems;
    } catch (fallbackError) {
      console.error('❌ Fallback also failed:', fallbackError);
      return [];
    }
  }
}

/**
 * Manually trigger news fetch on the worker
 */
export async function triggerNewsFetch(options: FetchNewsOptions = {}): Promise<boolean> {
  const workerUrl = options.workerUrl || DEFAULT_WORKER_URL;
  
  try {
    const response = await fetch(`${workerUrl}/`, {
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
      console.log(`✅ News fetch triggered successfully: ${data.count} items`);
      return true;
    } else {
      throw new Error(data.error || 'Unknown error');
    }
    
  } catch (error) {
    console.error('❌ Error triggering news fetch:', error);
    return false;
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
