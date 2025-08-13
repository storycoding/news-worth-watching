import type { Item } from './newsFetcher';

export interface CleanedNewsItem extends Item {
  // Enhanced fields for better display
  cleanTitle: string;
  cleanSummary: string;
  sourceDisplay: string;
  category: string;
  relevanceScore?: number;
  language: 'pt' | 'en';
  type?: 'news'; // Optional type field for compatibility
}

/**
 * Clean and standardize news item data
 */
export function cleanNewsItem(item: Item): CleanedNewsItem {
  // Clean title - remove extra whitespace and normalize
  const cleanTitle = item.title
    .replace(/\s+/g, ' ')
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .trim();

  // Clean summary - remove HTML entities and normalize
  const cleanSummary = (item.summary || '')
    .replace(/&[a-zA-Z]+;/g, (match) => {
      const entities: { [key: string]: string } = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#39;': "'",
        '&#8211;': '–',
        '&#8230;': '...',
        '&#8217;': "'",
        '&#8216;': "'",
        '&#8220;': '"',
        '&#8221;': '"'
      };
      return entities[match] || match;
    })
    .replace(/\s+/g, ' ')
    .trim();

  // Determine source display name
  const sourceDisplay = getSourceDisplayName(item.source);

  // Determine category based on source
  const category = getSourceCategory(item.source);

  // Detect language (simple heuristic)
  const language: 'pt' | 'en' = detectLanguage(cleanTitle + ' ' + cleanSummary);

  // Calculate relevance score based on content
  const relevanceScore = calculateRelevanceScore(cleanTitle, cleanSummary, item.tags || []);

  return {
    ...item,
    cleanTitle,
    cleanSummary,
    sourceDisplay,
    category,
    language,
    relevanceScore
  };
}

/**
 * Get a user-friendly display name for the source
 */
function getSourceDisplayName(source: string): string {
  const sourceMap: { [key: string]: string } = {
    'portal.azores.gov.pt': 'Governo dos Açores',
    'dre.pt': 'Diário da República',
    'inova.azores.gov.pt': 'INOVA Açores',
    'azoresgeopark.com': 'Azores Geopark',
    'noticias.uac.pt': 'Universidade dos Açores',
    'fao.org': 'FAO',
    'environment.ec.europa.eu': 'EU Environment'
  };

  return sourceMap[source] || source;
}

/**
 * Categorize sources for better organization
 */
function getSourceCategory(source: string): string {
  if (source.includes('azores.gov.pt') || source.includes('dre.pt')) {
    return 'Policy & Regional';
  }
  if (source.includes('azoresgeopark') || source.includes('uac.pt')) {
    return 'Environment & Research';
  }
  if (source.includes('fao.org') || source.includes('environment.ec.europa.eu')) {
    return 'International';
  }
  return 'Other';
}

/**
 * Simple language detection
 */
function detectLanguage(text: string): 'pt' | 'en' {
  const portugueseWords = ['dos', 'das', 'para', 'com', 'não', 'mais', 'muito', 'também', 'ainda', 'sempre'];
  const englishWords = ['the', 'and', 'for', 'with', 'not', 'more', 'very', 'also', 'still', 'always'];
  
  const textLower = text.toLowerCase();
  const ptCount = portugueseWords.filter(word => textLower.includes(word)).length;
  const enCount = englishWords.filter(word => textLower.includes(word)).length;
  
  return ptCount > enCount ? 'pt' : 'en';
}

/**
 * Calculate relevance score based on content
 */
function calculateRelevanceScore(title: string, summary: string, tags: string[]): number {
  let score = 0;
  const content = (title + ' ' + summary).toLowerCase();
  
  // Boost for Azores-related content
  if (content.includes('açores') || content.includes('azores')) score += 10;
  if (content.includes('são miguel') || content.includes('sao miguel')) score += 8;
  if (content.includes('ponta delgada')) score += 6;
  
  // Boost for environmental/regeneration content
  if (content.includes('ambiente') || content.includes('environment')) score += 5;
  if (content.includes('sustentável') || content.includes('sustainable')) score += 5;
  if (content.includes('regeneração') || content.includes('regeneration')) score += 5;
  
  // Boost for policy/government content
  if (content.includes('governo') || content.includes('government')) score += 4;
  if (content.includes('política') || content.includes('policy')) score += 4;
  
  // Boost for research/education content
  if (content.includes('investigação') || content.includes('research')) score += 4;
  if (content.includes('universidade') || content.includes('university')) score += 4;
  
  // Boost for tags
  score += tags.length * 2;
  
  return Math.min(score, 100); // Cap at 100
}

/**
 * Clean an array of news items
 */
export function cleanNewsItems(items: Item[]): CleanedNewsItem[] {
  return items.map(cleanNewsItem);
}
