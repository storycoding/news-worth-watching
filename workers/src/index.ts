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

// Extract Azores-related tags
function extractAzoresTags(text: string): string[] {
  const tags: string[] = [];
  if (text.includes('açores') || text.includes('azores')) tags.push('azores');
  if (text.includes('são miguel') || text.includes('sao miguel')) tags.push('sao-miguel');
  if (text.includes('ponta delgada')) tags.push('ponta-delgada');
  return tags;
}

// Extract permaculture and regeneration tags
function extractPermacultureTags(text: string): string[] {
  const tags: string[] = [];
  if (text.includes('permaculture') || text.includes('permacultura')) tags.push('permaculture');
  if (text.includes('agroforestry') || text.includes('agrofloresta')) tags.push('agroforestry');
  if (text.includes('regeneration') || text.includes('regeneração')) tags.push('regeneration');
  if (text.includes('sustainability') || text.includes('sustentabilidade')) tags.push('sustainability');
  if (text.includes('climate') || text.includes('clima')) tags.push('climate');
  if (text.includes('environment') || text.includes('ambiente')) tags.push('environment');
  return tags;
}

// Extract policy and research tags
function extractPolicyTags(text: string): string[] {
  const tags: string[] = [];
  if (text.includes('policy') || text.includes('política')) tags.push('policy');
  if (text.includes('research') || text.includes('investigação')) tags.push('research');
  if (text.includes('innovation') || text.includes('inovação')) tags.push('innovation');
  return tags;
}

// Extract all relevant tags from title and summary
function extractTags(title: string, summary: string): string[] {
  const text = `${title} ${summary}`.toLowerCase();
  
  // Combine all tag categories
  const allTags = [
    ...extractAzoresTags(text),
    ...extractPermacultureTags(text),
    ...extractPolicyTags(text)
  ];
  
  // Remove duplicates and return
  return [...new Set(allTags)];
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

// Route to appropriate scraper based on source label
function routeToScraper(source: Source): Promise<any[]> {
  if (source.label.includes('Governo dos Açores')) {
    return scrapeAzoresGovernment();
  } else if (source.label.includes('Diário da República')) {
    return scrapeDiarioRepublica();
  } else if (source.label.includes('INOVA')) {
    return scrapeInovaAzores();
  } else if (source.label.includes('Azores Geopark')) {
    return scrapeAzoresGeopark();
  } else if (source.label.includes('Universidade dos Açores')) {
    return scrapeUniversidadeAzores();
  } else {
    console.log(`No specific scraper for ${source.label}, using generic approach`);
    return Promise.resolve([]);
  }
}

// Convert scraped items to NewsItem format
function convertScrapedToNews(scrapedItems: any[]): NewsItem[] {
  return scrapedItems.map(item => ({
    id: generateId(item.url),
    title: item.title,
    source: extractSourceFromUrl(item.url),
    url: item.url,
    publishedAt: item.publishedAt,
    summary: item.summary,
    tags: extractTags(item.title, item.summary)
  }));
}

// Scrape specific websites using our dedicated scrapers
async function scrapeWebsite(source: Source): Promise<NewsItem[]> {
  try {
    console.log(`🔍 Scraping website: ${source.label}`);
    
    // Route to appropriate scraper
    const scrapedItems = await routeToScraper(source);
    
    if (scrapedItems.length === 0) {
      console.log(`⚠️ No items scraped from ${source.label}`);
      return [];
    }
    
    // Convert scraped items to NewsItem format
    const newsItems = convertScrapedToNews(scrapedItems);
    console.log(`✅ Converted ${scrapedItems.length} scraped items to news format`);
    
    return newsItems;
    
  } catch (error) {
    console.error(`❌ Error scraping website ${source.label}:`, error);
    return [];
  }
}

// Get the predefined news sources configuration
function getNewsSources(): SourceCategory[] {
  return [
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
}

// Fetch news from a single source with error handling
async function fetchNewsFromSourceWithErrorHandling(source: Source): Promise<NewsItem[]> {
  try {
    console.log(`Fetching news from: ${source.label}`);
    const news = await fetchNewsFromSource(source);
    console.log(`✅ Successfully fetched ${news.length} items from ${source.label}`);
    return news;
  } catch (error) {
    console.error(`❌ Error fetching from ${source.label}:`, error);
    return []; // Return empty array on error, don't fail the entire process
  }
}

// Add respectful delay between source requests
async function addFetchDelay(ms: number = 1000): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, ms));
}

// Fetch news from a single category
async function fetchNewsFromCategory(category: SourceCategory): Promise<NewsItem[]> {
  const categoryNews: NewsItem[] = [];
  
  for (const source of category.sources) {
    const news = await fetchNewsFromSourceWithErrorHandling(source);
    categoryNews.push(...news);
    
    // Add delay between sources in the same category
    await addFetchDelay(1000);
  }
  
  console.log(`📰 Category "${category.name}": ${categoryNews.length} total items`);
  return categoryNews;
}

// Main function to fetch all news
async function fetchAllNews(): Promise<NewsItem[]> {
  const sources = getNewsSources();
  const allNews: NewsItem[] = [];
  
  for (const category of sources) {
    const categoryNews = await fetchNewsFromCategory(category);
    allNews.push(...categoryNews);
    
    // Add delay between categories
    await addFetchDelay(500);
  }
  
  console.log(`🎯 Total news fetched: ${allNews.length} items`);
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

// Log news items for debugging
function logNewsItems(news: NewsItem[]): void {
  console.log('📰 News items fetched:');
  news.forEach((item, index) => {
    console.log(`${index + 1}. ${item.title} (${item.source})`);
    console.log(`   URL: ${item.url}`);
    console.log(`   Tags: ${item.tags?.join(', ') || 'none'}`);
    console.log(`   Published: ${item.publishedAt}`);
    console.log('---');
  });
}

// Get existing news from KV storage
async function getExistingNewsFromKV(env: any): Promise<NewsItem[]> {
  try {
    const storedNews = await env.NEWS_KV.get('latest-news');
    if (storedNews) {
      const existingNews = JSON.parse(storedNews);
      console.log(`📖 Found ${existingNews.length} existing news items`);
      return existingNews;
    }
  } catch (error) {
    console.log('No existing news found, starting fresh');
  }
  return [];
}

// Store merged news in KV storage
async function storeMergedNewsInKV(mergedNews: NewsItem[], env: any): Promise<void> {
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
  
  console.log(`💾 Stored ${mergedNews.length} items in KV storage`);
}

// Update fetch metadata in KV storage
async function updateFetchMetadata(mergedNews: NewsItem[], newItemsCount: number, env: any): Promise<void> {
  const metadata = {
    lastFetch: new Date().toISOString(),
    lastCronRun: new Date().toISOString(), // Track when cron actually ran
    totalItems: mergedNews.length,
    newItemsAdded: newItemsCount,
    sources: [...new Set(mergedNews.map(item => item.source))]
  };
  
  await env.NEWS_KV.put('fetch-metadata', JSON.stringify(metadata), {
    expirationTtl: 86400 * 30 // 30 days
  });
  
  console.log('📊 Fetch metadata updated');
}

// Log storage summary
function logStorageSummary(mergedNews: NewsItem[], newItemsCount: number): void {
  console.log('✅ News successfully stored in KV storage');
  console.log(`   - Total news: ${mergedNews.length} items`);
  console.log(`   - New items: ${newItemsCount} added`);
  console.log(`   - Individual items: ${mergedNews.length} stored`);
  console.log(`   - Metadata updated`);
}

// Test individual scraper for development
async function testIndividualScraper(scraperName: string, sourceUrl?: string): Promise<any> {
  console.log(`🧪 Testing scraper: ${scraperName}`);
  
  try {
    let scrapedItems: any[] = [];
    
    // Route to appropriate scraper
    switch (scraperName.toLowerCase()) {
      case 'azores-government':
        scrapedItems = await scrapeAzoresGovernment();
        break;
      case 'diario-republica':
        scrapedItems = await scrapeDiarioRepublica();
        break;
      case 'inova-azores':
        scrapedItems = await scrapeInovaAzores();
        break;
      case 'azores-geopark':
        scrapedItems = await scrapeAzoresGeopark();
        break;
      case 'universidade-azores':
        scrapedItems = await scrapeUniversidadeAzores();
        break;
      default:
        throw new Error(`Unknown scraper: ${scraperName}`);
    }
    
    // Convert to news format for testing
    const newsItems = convertScrapedToNews(scrapedItems);
    
    return {
      scraperName,
      sourceUrl: sourceUrl || 'default',
      rawScrapedItems: scrapedItems,
      convertedNewsItems: newsItems,
      itemCount: scrapedItems.length,
      success: true,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error(`❌ Error testing scraper ${scraperName}:`, error);
    return {
      scraperName,
      sourceUrl: sourceUrl || 'default',
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false,
      timestamp: new Date().toISOString()
    };
  }
}

// Test scraping with detailed logging for development
async function testScrapingWithLogging(enableVerboseLogging: boolean = true, testSpecificSources: string[] = []): Promise<any> {
  console.log('🧪 Testing scraping with detailed logging...');
  
  const startTime = Date.now();
  const results: any = {
    startTime: new Date(startTime).toISOString(),
    enableVerboseLogging,
    testSpecificSources,
    sources: [],
    summary: {
      totalSources: 0,
      successfulSources: 0,
      failedSources: 0,
      totalItems: 0
    }
  };
  
  try {
    const sources = getNewsSources();
    const sourcesToTest = testSpecificSources.length > 0 
      ? sources.filter(cat => testSpecificSources.includes(cat.name))
      : sources;
    
    results.summary.totalSources = sourcesToTest.reduce((acc, cat) => acc + cat.sources.length, 0);
    
    for (const category of sourcesToTest) {
      console.log(`\n📰 Testing category: ${category.name}`);
      
      const categoryResults: {
        categoryName: string;
        sources: Array<{
          label: string;
          url: string;
          type: 'rss' | 'api' | 'scrape';
          duration: number;
          itemCount: number;
          success: boolean;
          items: NewsItem[] | undefined;
        }>;
      } = {
        categoryName: category.name,
        sources: []
      };
      
      for (const source of category.sources) {
        console.log(`  🔍 Testing source: ${source.label}`);
        
        const sourceStartTime = Date.now();
        const sourceResult = await fetchNewsFromSourceWithErrorHandling(source);
        const sourceDuration = Date.now() - sourceStartTime;
        
        const sourceInfo = {
          label: source.label,
          url: source.url,
          type: source.type,
          duration: sourceDuration,
          itemCount: sourceResult.length,
          success: sourceResult.length >= 0,
          items: enableVerboseLogging ? sourceResult : undefined
        };
        
        categoryResults.sources.push(sourceInfo);
        
        if (sourceResult.length > 0) {
          results.summary.successfulSources++;
          results.summary.totalItems += sourceResult.length;
        } else {
          results.summary.failedSources++;
        }
        
        // Add delay between sources
        await addFetchDelay(500);
      }
      
      results.sources.push(categoryResults);
    }
    
    const totalDuration = Date.now() - startTime;
    results.endTime = new Date().toISOString();
    results.totalDuration = totalDuration;
    results.summary.totalDuration = totalDuration;
    
    console.log(`\n🎯 Scraping test completed in ${totalDuration}ms`);
    console.log(`   - Total sources: ${results.summary.totalSources}`);
    console.log(`   - Successful: ${results.summary.successfulSources}`);
    console.log(`   - Failed: ${results.summary.failedSources}`);
    console.log(`   - Total items: ${results.summary.totalItems}`);
    
    return results;
    
  } catch (error) {
    console.error('❌ Error in scraping test:', error);
    results.error = error instanceof Error ? error.message : 'Unknown error';
    results.success = false;
    return results;
  }
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
    logNewsItems(news);
    
    // Store in Cloudflare KV for persistent storage
    if (env.NEWS_KV) {
      try {
        // Get existing news to merge with new items
        const existingNews = await getExistingNewsFromKV(env);
        
        // Merge new news with existing news
        const mergedNews = mergeNewsItems(existingNews, news);
        const newItemsCount = mergedNews.length - existingNews.length;
        
        console.log(`🔄 Merged news: ${newItemsCount} new items added`);
        
        // Store the merged news
        await storeMergedNewsInKV(mergedNews, env);
        
        // Update fetch metadata
        await updateFetchMetadata(mergedNews, newItemsCount, env);
        
        // Log storage summary
        logStorageSummary(mergedNews, newItemsCount);
        
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
    
    // Log every request for debugging
    console.log(`🚀 [${new Date().toISOString()}] ${request.method} ${path}`);
    console.log(`   Headers:`, Object.fromEntries(request.headers.entries()));
    console.log(`   Origin: ${request.headers.get('origin') || 'none'}`);
    console.log(`   User-Agent: ${request.headers.get('user-agent') || 'none'}`);
    
    // Handle manual triggers via HTTP requests
    if (request.method === 'POST' && path === '/news-scraper') {
      console.log('🔄 Manual news scraping triggered via API');
      try {
        const news = await fetchAllNews();
        await storeNewsData(news, env);
        
        return new Response(JSON.stringify({
          success: true,
          message: `Fetched ${news.length} news items`,
          count: news.length,
          lastCronRun: new Date().toISOString() // This becomes the new cron run time
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
    
    // Test individual scraper endpoints for development
    if (request.method === 'POST' && path === '/test-scraper') {
      console.log('🧪 Testing individual scraper...');
      try {
        const body = await request.json() as { scraperName?: string; sourceUrl?: string };
        const { scraperName, sourceUrl } = body;
        
        if (!scraperName) {
          return new Response(JSON.stringify({
            success: false,
            error: 'scraperName is required'
          }), {
            status: 400,
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type'
            }
          });
        }
        
        const testResult = await testIndividualScraper(scraperName, sourceUrl);
        
        return new Response(JSON.stringify({
          success: true,
          scraperName,
          result: testResult
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
    
    // Test scraping with detailed logging
    if (request.method === 'POST' && path === '/test-scraping') {
      console.log('🧪 Testing scraping with detailed logging...');
      try {
        const body = await request.json() as { enableVerboseLogging?: boolean; testSpecificSources?: string[] };
        const { enableVerboseLogging = true, testSpecificSources = [] } = body;
        
        const testResult = await testScrapingWithLogging(enableVerboseLogging, testSpecificSources);
        
        return new Response(JSON.stringify({
          success: true,
          testResult
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
            'POST /news-scraper': 'Trigger news scraping manually (updates lastCronRun)',
            'POST /test-scraper': 'Test individual scraper (development)',
            'POST /test-scraping': 'Test scraping with detailed logging (development)',
            'GET /': 'This info message',
            'GET /news-loader': 'Get stored news from KV (no processing)',
            'GET /news-status': 'Get system status and metadata',
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
      
      if (path === '/news-loader') {
        // Simple storage API - just return stored data, no processing
        try {
          console.log('📖 News Loader: Serving stored news data');
          
          let news: NewsItem[] = [];
          let metadata = null;
          
          // Get stored data from KV
          if (env.NEWS_KV) {
            try {
              const storedNews = await env.NEWS_KV.get('latest-news');
              if (storedNews) {
                news = JSON.parse(storedNews);
                console.log(`📖 Retrieved ${news.length} news items from KV storage`);
              }
              
              // Get fetch metadata for timestamp
              metadata = await env.NEWS_KV.get('fetch-metadata');
            } catch (kvError) {
              console.error('Error reading from KV:', kvError);
            }
          }
          
          // Return stored data only - no fetching, no processing
          return new Response(JSON.stringify({
            success: true,
            count: news.length,
            news: news,
            lastCronRun: metadata ? JSON.parse(metadata).lastCronRun : null,
            source: 'kv-storage-only'
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
      
      if (path === '/news-status') {
        // Get fetch metadata and system status
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
              lastCronRun: null,
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
    console.log(`⏰ [${new Date().toISOString()}] Cron trigger activated - fetching news...`);
    console.log(`   Event type: ${event.type}`);
    console.log(`   Event cron: ${event.cron || 'unknown'}`);
    
    try {
      const news = await fetchAllNews();
      await storeNewsData(news, env);
      console.log(`✅ [${new Date().toISOString()}] News fetch completed successfully`);
    } catch (error) {
      console.error(`❌ [${new Date().toISOString()}] Error in scheduled news fetch:`, error);
    }
  }
};
