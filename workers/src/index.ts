interface NewsItem {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  tags?: string[];
  summary?: string;
  relevanceScore?: number;
}

interface Source {
  label: string;
  url: string;
  type: 'rss' | 'api' | 'scrape';
}

interface SourceCategory {
  name: string;
  sources: Source[];
}

import { 
  scrapeAzoresGovernment, 
  scrapeDiarioRepublica, 
  scrapeInovaAzores,
  scrapeAzoresGeopark,
  scrapeUniversidadeAzores
} from './scrapers.js';

// RSS Feed Parser
async function parseRSSFeed(url: string): Promise<NewsItem[]> {
  try {
    const response = await fetch(url);
    const text = await response.text();
    
    // Simple RSS parsing (you might want to use a proper RSS parser)
    const items: NewsItem[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    
    while ((match = itemRegex.exec(text)) !== null) {
      const itemContent = match[1];
      
      const titleMatch = itemContent.match(/<title>(.*?)<\/title>/);
      const linkMatch = itemContent.match(/<link>(.*?)<\/link>/);
      const pubDateMatch = itemContent.match(/<pubDate>(.*?)<\/pubDate>/);
      const descriptionMatch = itemContent.match(/<description>(.*?)<\/description>/);
      
      if (titleMatch && linkMatch) {
        const title = titleMatch[1].replace(/<[^>]*>/g, '').trim();
        const url = linkMatch[1].trim();
        const publishedAt = pubDateMatch ? new Date(pubDateMatch[1]).toISOString() : new Date().toISOString();
        const summary = descriptionMatch ? descriptionMatch[1].replace(/<[^>]*>/g, '').trim() : '';
        
        items.push({
          id: generateId(url),
          title,
          source: extractSourceFromUrl(url),
          url,
          publishedAt,
          summary,
          tags: extractTags(title, summary)
        });
      }
    }
    
    return items;
  } catch (error) {
    console.error(`Error parsing RSS feed ${url}:`, error);
    return [];
  }
}

// Generate unique ID for news items
function generateId(url: string): string {
  return btoa(url).replace(/[^a-zA-Z0-9]/g, '').substring(0, 12);
}

// Extract source name from URL
function extractSourceFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return 'unknown';
  }
}

// Extract relevant tags from title and summary
function extractTags(title: string, summary: string): string[] {
  const text = `${title} ${summary}`.toLowerCase();
  const tags: string[] = [];
  
  // Azores-related tags
  if (text.includes('açores') || text.includes('azores')) tags.push('azores');
  if (text.includes('são miguel') || text.includes('sao miguel')) tags.push('sao-miguel');
  if (text.includes('ponta delgada')) tags.push('ponta-delgada');
  
  // Permaculture and regeneration tags
  if (text.includes('permaculture') || text.includes('permacultura')) tags.push('permaculture');
  if (text.includes('agroforestry') || text.includes('agrofloresta')) tags.push('agroforestry');
  if (text.includes('regeneration') || text.includes('regeneração')) tags.push('regeneration');
  if (text.includes('sustainability') || text.includes('sustentabilidade')) tags.push('sustainability');
  if (text.includes('climate') || text.includes('clima')) tags.push('climate');
  if (text.includes('environment') || text.includes('ambiente')) tags.push('environment');
  
  // Policy and research tags
  if (text.includes('policy') || text.includes('política')) tags.push('policy');
  if (text.includes('research') || text.includes('investigação')) tags.push('research');
  if (text.includes('innovation') || text.includes('inovação')) tags.push('innovation');
  
  return tags;
}

// Fetch news from a single source
async function fetchNewsFromSource(source: Source): Promise<NewsItem[]> {
  try {
    switch (source.type) {
      case 'rss':
        return await parseRSSFeed(source.url);
      case 'api':
        // Handle API-based sources (you can implement specific API calls here)
        return [];
      case 'scrape':
        // Handle web scraping sources using our scrapers
        return await scrapeWebsite(source);
      default:
        return [];
    }
  } catch (error) {
    console.error(`Error fetching from source ${source.label}:`, error);
    return [];
  }
}

// Scrape specific websites using our dedicated scrapers
async function scrapeWebsite(source: Source): Promise<NewsItem[]> {
  try {
    let scrapedItems: any[] = [];
    
    // Route to appropriate scraper based on source label
    if (source.label.includes('Governo dos Açores')) {
      scrapedItems = await scrapeAzoresGovernment();
    } else if (source.label.includes('Diário da República')) {
      scrapedItems = await scrapeDiarioRepublica();
    } else if (source.label.includes('INOVA')) {
      scrapedItems = await scrapeInovaAzores();
    } else if (source.label.includes('Azores Geopark')) {
      scrapedItems = await scrapeAzoresGeopark();
    } else if (source.label.includes('Universidade dos Açores')) {
      scrapedItems = await scrapeUniversidadeAzores();
    } else {
      console.log(`No specific scraper for ${source.label}, using generic approach`);
      return [];
    }
    
    // Convert scraped items to NewsItem format
    return scrapedItems.map(item => ({
      id: generateId(item.url),
      title: item.title,
      source: extractSourceFromUrl(item.url),
      url: item.url,
      publishedAt: item.publishedAt,
      summary: item.summary,
      tags: extractTags(item.title, item.summary)
    }));
    
  } catch (error) {
    console.error(`Error scraping website ${source.label}:`, error);
    return [];
  }
}

// Main function to fetch all news
async function fetchAllNews(): Promise<NewsItem[]> {
  const sources: SourceCategory[] = [
    {
      name: "Azores · Policy & Regional",
      sources: [
        { label: "Governo dos Açores", url: "https://www.azores.gov.pt/pt", type: 'scrape' },
        { label: "Diário da República", url: "https://dre.pt/web/guest/home", type: 'scrape' },
        { label: "INOVA (Inovação Açores)", url: "https://inova.azores.gov.pt", type: 'scrape' }
      ]
    },
    {
      name: "São Miguel · Environment & Research",
      sources: [
        { label: "Azores Geopark", url: "https://azoresgeopark.com", type: 'scrape' },
        { label: "Universidade dos Açores", url: "https://www.uac.pt", type: 'scrape' }
      ]
    },
    {
      name: "Permaculture & Regeneration",
      sources: [
        { label: "FAO Agroecology", url: "https://www.fao.org/agroecology/en/", type: 'rss' },
        { label: "EU Environment", url: "https://environment.ec.europa.eu/news_en?format=rss", type: 'rss' }
      ]
    }
  ];

  const allNews: NewsItem[] = [];
  
  for (const category of sources) {
    for (const source of category.sources) {
      console.log(`Fetching news from: ${source.label}`);
      const news = await fetchNewsFromSource(source);
      allNews.push(...news);
      
      // Add a small delay to be respectful to sources
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return allNews;
}

// Merge new news with existing news to avoid duplicates
function mergeNewsItems(existingNews: NewsItem[], newNews: NewsItem[]): NewsItem[] {
  const existingUrls = new Set(existingNews.map(item => item.url));
  const uniqueNewItems = newNews.filter(item => !existingUrls.has(item.url));
  
  // Combine existing and new items, sort by published date
  const mergedNews = [...existingNews, ...uniqueNewItems].sort((a, b) => 
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
  
  // Keep only the latest 100 items to avoid storage bloat
  return mergedNews.slice(0, 100);
}

// Store news data in Cloudflare KV for persistent storage
async function storeNewsData(news: NewsItem[], env: any): Promise<void> {
  try {
    console.log(`Successfully fetched ${news.length} news items`);
    
    if (news.length === 0) {
      console.log('No new news items to store');
      return;
    }
    
    // Log the news items for debugging
    console.log('📰 News items fetched:');
    news.forEach((item, index) => {
      console.log(`${index + 1}. ${item.title} (${item.source})`);
      console.log(`   URL: ${item.url}`);
      console.log(`   Tags: ${item.tags?.join(', ') || 'none'}`);
      console.log(`   Published: ${item.publishedAt}`);
      console.log('---');
    });
    
    // Store in Cloudflare KV for persistent storage
    if (env.NEWS_KV) {
      try {
        // Get existing news to merge with new items
        let existingNews: NewsItem[] = [];
        try {
          const storedNews = await env.NEWS_KV.get('latest-news');
          if (storedNews) {
            existingNews = JSON.parse(storedNews);
            console.log(`📖 Found ${existingNews.length} existing news items`);
          }
        } catch (error) {
          console.log('No existing news found, starting fresh');
        }
        
        // Merge new news with existing news
        const mergedNews = mergeNewsItems(existingNews, news);
        const newItemsCount = mergedNews.length - existingNews.length;
        
        console.log(`🔄 Merged news: ${newItemsCount} new items added`);
        
        // Store the merged news
        await env.NEWS_KV.put('latest-news', JSON.stringify(mergedNews), { 
          expirationTtl: 86400 * 7 // 7 days expiration
        });
        
        // Store individual news items for easier access
        for (const item of mergedNews) {
          await env.NEWS_KV.put(`news-${item.id}`, JSON.stringify(item), {
            expirationTtl: 86400 * 30 // 30 days for individual items
          });
        }
        
        // Store metadata about the fetch
        await env.NEWS_KV.put('fetch-metadata', JSON.stringify({
          lastFetch: new Date().toISOString(),
          totalItems: mergedNews.length,
          newItemsAdded: newItemsCount,
          sources: [...new Set(mergedNews.map(item => item.source))]
        }), {
          expirationTtl: 86400 * 30 // 30 days
        });
        
        console.log('✅ News successfully stored in KV storage');
        console.log(`   - Total news: ${mergedNews.length} items`);
        console.log(`   - New items: ${newItemsCount} added`);
        console.log(`   - Individual items: ${mergedNews.length} stored`);
        console.log(`   - Metadata updated`);
        
      } catch (kvError) {
        console.error('❌ Error storing in KV:', kvError);
        // Continue execution even if KV storage fails
      }
    } else {
      console.log('⚠️ KV storage not available - news will not be persisted');
    }
    
  } catch (error) {
    console.error('Error storing news data:', error);
  }
}

// Main handler for the worker
export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // Handle manual triggers via HTTP requests
    if (request.method === 'POST' && path === '/') {
      try {
        const news = await fetchAllNews();
        await storeNewsData(news, env);
        
        return new Response(JSON.stringify({
          success: true,
          message: `Fetched ${news.length} news items`,
          count: news.length,
          news: news // Include the actual news data
        }), {
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
          }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }), {
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
          }
        });
      }
    }
    
    // Handle OPTIONS requests for CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }
    
    // Handle GET requests for different endpoints
    if (request.method === 'GET') {
      if (path === '/') {
        // Main info endpoint
        return new Response(JSON.stringify({
          message: 'News Fetcher Worker is running',
          endpoints: {
            'POST /': 'Trigger news fetch manually',
            'GET /': 'This info message',
            'GET /news': 'Get latest fetched news from KV storage',
            'GET /metadata': 'Get fetch metadata and statistics',
            'GET /health': 'Health check'
          }
        }), {
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
          }
        });
      }
      
      if (path === '/news') {
        // Return the latest news from KV storage
        try {
          let news: NewsItem[] = [];
          let fetchedAt = new Date().toISOString();
          
          // Try to get news from KV storage first
          if (env.NEWS_KV) {
            try {
              const storedNews = await env.NEWS_KV.get('latest-news');
              if (storedNews) {
                news = JSON.parse(storedNews);
                console.log(`📖 Retrieved ${news.length} news items from KV storage`);
              }
              
              // Get fetch metadata
              const metadata = await env.NEWS_KV.get('fetch-metadata');
              if (metadata) {
                const meta = JSON.parse(metadata);
                fetchedAt = meta.lastFetch;
              }
            } catch (kvError) {
              console.error('Error reading from KV:', kvError);
            }
          }
          
          // If no stored news, fetch fresh data
          if (news.length === 0) {
            console.log('No stored news found, fetching fresh data...');
            news = await fetchAllNews();
            fetchedAt = new Date().toISOString();
            
            // Store the fresh data
            if (news.length > 0) {
              await storeNewsData(news, env);
            }
          }
          
                  return new Response(JSON.stringify({
          success: true,
          count: news.length,
          news: news,
          fetchedAt: fetchedAt,
          source: 'kv-storage'
        }), {
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
          }
        });
        } catch (error) {
          return new Response(JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
      
      if (path === '/health') {
        // Health check endpoint
        return new Response(JSON.stringify({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          uptime: Date.now()
        }), {
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
          }
        });
      }
      
      if (path === '/metadata') {
        // Get fetch metadata
        try {
          let metadata = null;
          if (env.NEWS_KV) {
            const storedMetadata = await env.NEWS_KV.get('fetch-metadata');
            if (storedMetadata) {
              metadata = JSON.parse(storedMetadata);
            }
          }
          
                  return new Response(JSON.stringify({
          success: true,
          metadata: metadata || {
            lastFetch: null,
            totalItems: 0,
            sources: []
          }
        }), {
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
          }
        });
        } catch (error) {
          return new Response(JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
    }
    
    return new Response('Method not allowed', { status: 405 });
  },
  
  // Cron trigger handler
  async scheduled(event: any, env: any, ctx: any): Promise<void> {
    console.log('Cron trigger activated - fetching news...');
    
    try {
      const news = await fetchAllNews();
      await storeNewsData(news, env);
      console.log('✅ News fetch completed successfully');
    } catch (error) {
      console.error('❌ Error in scheduled news fetch:', error);
    }
  }
};
