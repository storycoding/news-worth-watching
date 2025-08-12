export type Item = {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  tags?: string[];
  summary?: string;
};

// Scoreboard type definition
type Scoreboard = {
  tags: Record<string, number>;
  content: Record<string, number>;
  sources: Record<string, number>;
};

// Cache for the scoreboard to avoid repeated fetches
let scoreboardCache: Scoreboard | null = null;

/**
 * Fetch the scoreboard configuration from the public JSON file
 */
async function getScoreboard(): Promise<Scoreboard> {
  if (scoreboardCache) {
    return scoreboardCache;
  }
  
  try {
    const response = await fetch('/scoreboard.json');
    const scoreboard = await response.json();
    scoreboardCache = scoreboard;
    return scoreboard;
  } catch (error) {
    console.error('Failed to load scoreboard:', error);
    // Fallback to default scoring if scoreboard fails to load
    return {
      tags: {},
      content: {},
      sources: {}
    };
  }
}

/**
 * Calculate relevance score based on content and tags
 * This should be distinct from recency to make sorting meaningful
 */
export function calculateRelevanceScore(item: Item, scoreboard: Scoreboard): number {
  let score = 0;
  
  // Tag-based scoring
  if (item.tags) {
    for (const tag of item.tags) {
      if (tag in scoreboard.tags) {
        score += scoreboard.tags[tag];
      }
    }
  }
  
  // Content-based scoring
  if (item.summary) {
    const summaryLower = item.summary.toLowerCase();
    for (const [keyword, points] of Object.entries(scoreboard.content)) {
      if (summaryLower.includes(keyword.toLowerCase())) {
        score += points as number;
      }
    }
  }
  
  // Source credibility scoring
  for (const [sourcePattern, points] of Object.entries(scoreboard.sources)) {
    if (item.source.includes(sourcePattern)) {
      score += points as number;
    }
  }
  
  return score;
}

/**
 * Get the scoreboard (exported for component use)
 */
export { getScoreboard };


