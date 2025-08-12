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
    const response = await fetch('https://www.azores.gov.pt/pt');
    const html = await response.text();
    
    // This is a simplified selector - you'll need to adjust based on actual HTML structure
    return parseNewsFromHTML(html, {
      container: '<div class="news-item">([\\s\\S]*?)</div>',
      title: '<h3[^>]*>([^<]+)</h3>',
      link: '<a[^>]*href="([^"]*)"[^>]*>',
      date: '<time[^>]*>([^<]+)</time>',
      summary: '<p[^>]*>([^<]+)</p>'
    });
  } catch (error) {
    console.error('Error scraping Azores Government:', error);
    return [];
  }
}

// Scraper for Diário da República
export async function scrapeDiarioRepublica(): Promise<ScrapedNewsItem[]> {
  try {
    const response = await fetch('https://dre.pt/web/guest/home');
    const html = await response.text();
    
    return parseNewsFromHTML(html, {
      container: '<div class="dre-item">([\\s\\S]*?)</div>',
      title: '<h4[^>]*>([^<]+)</h4>',
      link: '<a[^>]*href="([^"]*)"[^>]*>',
      date: '<span class="date">([^<]+)</span>',
      summary: '<div class="summary">([^<]+)</div>'
    });
  } catch (error) {
    console.error('Error scraping Diário da República:', error);
    return [];
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
    const response = await fetch('https://azoresgeopark.com');
    const html = await response.text();
    
    return parseNewsFromHTML(html, {
      container: '<div class="news-post">([\\s\\S]*?)</div>',
      title: '<h3[^>]*>([^<]+)</h3>',
      link: '<a[^>]*href="([^"]*)"[^>]*>',
      date: '<span class="post-date">([^<]+)</span>',
      summary: '<div class="post-excerpt">([^<]+)</div>'
    });
  } catch (error) {
    console.error('Error scraping Azores Geopark:', error);
    return [];
  }
}

// Scraper for Universidade dos Açores
export async function scrapeUniversidadeAzores(): Promise<ScrapedNewsItem[]> {
  try {
    const response = await fetch('https://www.uac.pt');
    const html = await response.text();
    
    return parseNewsFromHTML(html, {
      container: '<div class="news-item">([\\s\\S]*?)</div>',
      title: '<h4[^>]*>([^<]+)</h4>',
      link: '<a[^>]*href="([^"]*)"[^>]*>',
      date: '<time[^>]*>([^<]+)</time>',
      summary: '<p[^>]*>([^<]+)</p>'
    });
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
