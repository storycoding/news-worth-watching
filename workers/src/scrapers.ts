interface ScrapedNewsItem {
  title: string;
  url: string;
  publishedAt: string;
  summary: string;
}

// Generic HTML parser for news items
function parseNewsFromHTML(html: string, selectors: {
  container: string;
  title: string;
  link: string;
  date?: string;
  summary?: string;
}): ScrapedNewsItem[] {
  const items: ScrapedNewsItem[] = [];
  
  // This is a simplified parser - in production you might want to use a proper HTML parser
  // For now, we'll use regex-based extraction
  
  const containerRegex = new RegExp(selectors.container, 'g');
  let match;
  
  while ((match = containerRegex.exec(html)) !== null) {
    try {
      const container = match[1];
      
      // Extract title
      const titleMatch = container.match(new RegExp(selectors.title));
      if (!titleMatch) continue;
      
      // Extract link
      const linkMatch = container.match(new RegExp(selectors.link));
      if (!linkMatch) continue;
      
      // Extract date (optional)
      let publishedAt = new Date().toISOString();
      if (selectors.date) {
        const dateMatch = container.match(new RegExp(selectors.date));
        if (dateMatch) {
          publishedAt = new Date(dateMatch[1]).toISOString();
        }
      }
      
      // Extract summary (optional)
      let summary = '';
      if (selectors.summary) {
        const summaryMatch = container.match(new RegExp(selectors.summary));
        if (summaryMatch) {
          summary = summaryMatch[1].replace(/<[^>]*>/g, '').trim();
        }
      }
      
      items.push({
        title: titleMatch[1].replace(/<[^>]*>/g, '').trim(),
        url: linkMatch[1],
        publishedAt,
        summary
      });
    } catch (error) {
      console.error('Error parsing news item:', error);
      continue;
    }
  }
  
  return items;
}

// Scraper for Governo dos Açores
export async function scrapeAzoresGovernment(): Promise<ScrapedNewsItem[]> {
  try {
    console.log('🔍 Scraping Azores Government portal...');
    
    // Fetch the actual website (updated URL)
    const response = await fetch('https://portal.azores.gov.pt');
    const html = await response.text();
    
    // Parse news items using the real HTML structure
    const newsItems: ScrapedNewsItem[] = [];
    
    // Extract news items from the carousel
    const carouselRegex = /<a[^>]*href="([^"]*news-detail[^"]*)"[^>]*class="carousel-item[^"]*"[^>]*>([\s\S]*?)<\/a>/g;
    let match;
    
    while ((match = carouselRegex.exec(html)) !== null && newsItems.length < 10) {
      try {
        const url = match[1];
        const content = match[2];
        
        // Extract title
        const titleMatch = content.match(/<span class="gacs-portlet-highlights--title-span">([^<]+)<\/span>/);
        if (!titleMatch) continue;
        
        const title = titleMatch[1].trim();
        
        // Extract entity/department
        const entityMatch = content.match(/<span class="gacs-portlet-highlights--entity-span"[^>]*>([^<]+)<\/span>/);
        const entity = entityMatch ? entityMatch[1].trim() : 'Governo dos Açores';
        
        // Extract image alt text as summary (if available)
        const imageMatch = content.match(/<img[^>]*alt="([^"]*)"[^>]*>/);
        const summary = imageMatch && imageMatch[1] !== 'Artigo sem Imagem' 
          ? imageMatch[1].trim() 
          : `${title} - ${entity}`;
        
        // Normalize URL
        const fullUrl = url.startsWith('http') ? url : `https://portal.azores.gov.pt${url}`;
        
        newsItems.push({
          title,
          url: fullUrl,
          publishedAt: new Date().toISOString(), // We'll need to extract real dates later
          summary
        });
        
      } catch (error) {
        console.error('Error parsing news item:', error);
        continue;
      }
    }
    
    console.log(`✅ Scraped ${newsItems.length} news items from Azores Government`);
    return newsItems;
    
  } catch (error) {
    console.error('Error scraping Azores Government:', error);
    
    // Return fallback data if scraping fails
    return [
      {
        title: "Test News from Azores Government (Fallback)",
        url: "https://portal.azores.gov.pt/test-news-fallback",
        publishedAt: new Date().toISOString(),
        summary: "This is a fallback test news item to verify the system works."
      }
    ];
  }
}

// Scraper for Diário da República
export async function scrapeDiarioRepublica(): Promise<ScrapedNewsItem[]> {
  try {
    console.log('🔍 Testing Diário da República scraper...');
    const response = await fetch('https://dre.pt/web/guest/home');
    const html = await response.text();
    
    // For now, return mock data to test the system
    return [
      {
        title: "Test News from Diário da República",
        url: "https://dre.pt/web/guest/home/test-news",
        publishedAt: new Date().toISOString(),
        summary: "This is a test news item to verify the cron job and KV storage are working properly."
      }
    ];
  } catch (error) {
    console.error('Error scraping Diário da República:', error);
    return [
      {
        title: "Test News from Diário da República (Fallback)",
        url: "https://dre.pt/web/guest/home/test-news-fallback",
        publishedAt: new Date().toISOString(),
        summary: "This is a fallback test news item to verify the system works."
      }
    ];
  }
}

// Scraper for INOVA Açores
export async function scrapeInovaAzores(): Promise<ScrapedNewsItem[]> {
  try {
    const response = await fetch('https://inova.azores.gov.pt');
    const html = await response.text();
    
    return parseNewsFromHTML(html, {
      container: '<article[^>]*>([\\s\\S]*?)</article>',
      title: '<h2[^>]*>([^<]+)</h2>',
      link: '<a[^>]*href="([^"]*)"[^>]*>',
      date: '<time[^>]*>([^<]+)</time>',
      summary: '<div class="excerpt">([^<]+)</div>'
    });
  } catch (error) {
    console.error('Error scraping INOVA Açores:', error);
    return [];
  }
}

// Scraper for Azores Geopark
export async function scrapeAzoresGeopark(): Promise<ScrapedNewsItem[]> {
  try {
    console.log('🔍 Scraping Azores Geopark...');
    
    // Use the correct URL with www
    const response = await fetch('https://www.azoresgeopark.com/');
    const html = await response.text();
    
    const newsItems: ScrapedNewsItem[] = [];
    
    // Extract news items using the real HTML structure
    const newsRegex = /<a href="([^"]*noticia\.php[^"]*)" class="link_noticias_home">([^<]+)<\/a>/g;
    let match;
    
    while ((match = newsRegex.exec(html)) !== null && newsItems.length < 10) {
      try {
        const url = match[1];
        const title = match[2].trim();
        
        // Normalize URL
        const fullUrl = url.startsWith('http') ? url : `https://www.azoresgeopark.com${url}`;
        
        // Try to extract image alt text for summary
        const imageRegex = new RegExp(`<img[^>]*src="[^"]*"[^>]*alt="([^"]*)"[^>]*>.*?<a href="${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 's');
        const imageMatch = html.match(imageRegex);
        const summary = imageMatch && imageMatch[1] ? imageMatch[1].trim() : title;
        
        newsItems.push({
          title,
          url: fullUrl,
          publishedAt: new Date().toISOString(), // We'll extract real dates later
          summary
        });
        
      } catch (error) {
        console.error('Error parsing news item:', error);
        continue;
      }
    }
    
    console.log(`✅ Scraped ${newsItems.length} news items from Azores Geopark`);
    return newsItems;
    
  } catch (error) {
    console.error('Error scraping Azores Geopark:', error);
    return [];
  }
}

// Scraper for Universidade dos Açores
export async function scrapeUniversidadeAzores(): Promise<ScrapedNewsItem[]> {
  try {
    console.log('🔍 Scraping Universidade dos Açores RSS feed...');
    
    // Use the dedicated news RSS feed
    const response = await fetch('https://noticias.uac.pt/feed/');
    const xml = await response.text();
    
    const newsItems: ScrapedNewsItem[] = [];
    
    // Parse RSS XML to extract news items
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    
    while ((match = itemRegex.exec(xml)) !== null && newsItems.length < 10) {
      try {
        const itemContent = match[1];
        
        // Extract title
        const titleMatch = itemContent.match(/<title>([^<]+)<\/title>/);
        if (!titleMatch) continue;
        const title = titleMatch[1].trim();
        
        // Extract link
        const linkMatch = itemContent.match(/<link>([^<]+)<\/link>/);
        if (!linkMatch) continue;
        const url = linkMatch[1].trim();
        
        // Extract publication date
        const dateMatch = itemContent.match(/<pubDate>([^<]+)<\/pubDate>/);
        let publishedAt = new Date().toISOString();
        if (dateMatch) {
          try {
            publishedAt = new Date(dateMatch[1].trim()).toISOString();
          } catch (dateError) {
            console.log('Could not parse date, using current time');
          }
        }
        
        // Extract creator/author
        const creatorMatch = itemContent.match(/<dc:creator><!\[CDATA\[([^\]]+)\]><\/dc:creator>/);
        const creator = creatorMatch ? creatorMatch[1].trim() : 'Universidade dos Açores';
        
        // Create summary from title and creator
        const summary = `${title} - ${creator}`;
        
        newsItems.push({
          title,
          url,
          publishedAt,
          summary
        });
        
      } catch (error) {
        console.error('Error parsing RSS item:', error);
        continue;
      }
    }
    
    console.log(`✅ Scraped ${newsItems.length} news items from Universidade dos Açores RSS feed`);
    return newsItems;
    
  } catch (error) {
    console.error('Error scraping Universidade dos Açores:', error);
    return [];
  }
}

// Helper function to clean and normalize URLs
export function normalizeUrl(url: string, baseUrl: string): string {
  if (url.startsWith('http')) {
    return url;
  }
  
  if (url.startsWith('/')) {
    return new URL(url, baseUrl).href;
  }
  
  return new URL(`/${url}`, baseUrl).href;
}

// Helper function to extract text content from HTML
export function extractTextFromHTML(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}
