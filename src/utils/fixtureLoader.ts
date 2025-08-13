// Centralized fixture loader to prevent duplicate calls
let fixtureCache: any = null;
let fixturePromise: Promise<any> | null = null;

export async function loadFixtureData(): Promise<any> {
  // If we already have the data, return it immediately
  if (fixtureCache) {
    console.log('📁 Using cached fixture data');
    return fixtureCache;
  }
  
  // If a request is already in progress, wait for it
  if (fixturePromise) {
    console.log('📁 Waiting for existing fixture request...');
    return await fixturePromise;
  }
  
  // Create new request
  console.log('📁 Loading fixture data...');
  fixturePromise = fetch('/news_fixture.json')
    .then(response => response.json())
    .then(data => {
      fixtureCache = data;
      fixturePromise = null;
      console.log('✅ Fixture data loaded and cached');
      return data;
    })
    .catch(error => {
      fixturePromise = null;
      console.error('❌ Failed to load fixture:', error);
      throw error;
    });
  
  return await fixturePromise;
}

export function getNewsFromFixture(allContent: any[]): any[] {
  return allContent.filter((item: any) => item.type === 'news');
}

export function getVideosFromFixture(allContent: any[]): any[] {
  return allContent.filter((item: any) => item.type === 'video');
}

export function clearFixtureCache(): void {
  fixtureCache = null;
  fixturePromise = null;
}
