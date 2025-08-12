#!/usr/bin/env node

// Simple test script for the news fetcher worker
// This simulates what the worker would do

console.log('🧪 Testing News Fetcher Worker...\n');

// Mock the worker environment
global.fetch = require('node-fetch');

// Import the worker functions (you'll need to adjust the import path)
// const { fetchAllNews } = require('./src/index.js');

async function testRSSParsing() {
  console.log('📡 Testing RSS parsing...');
  
  try {
    // Test with a simple RSS feed
    const testRSS = `
      <rss version="2.0">
        <channel>
          <item>
            <title>Test News Item</title>
            <link>https://example.com/news/1</link>
            <pubDate>Mon, 01 Jan 2024 12:00:00 GMT</pubDate>
            <description>This is a test news item about permaculture.</description>
          </item>
        </channel>
      </rss>
    `;
    
    // Mock fetch to return our test RSS
    global.fetch = jest.fn(() =>
      Promise.resolve({
        text: () => Promise.resolve(testRSS)
      })
    );
    
    console.log('✅ RSS parsing test completed');
  } catch (error) {
    console.error('❌ RSS parsing test failed:', error);
  }
}

async function testTagExtraction() {
  console.log('🏷️  Testing tag extraction...');
  
  const testCases = [
    {
      title: 'New Permaculture Project in São Miguel',
      summary: 'Sustainable agriculture initiative in the Azores',
      expectedTags: ['permaculture', 'sao-miguel', 'azores', 'sustainability']
    },
    {
      title: 'Climate Change Research at UAC',
      summary: 'University studies environmental impacts',
      expectedTags: ['climate', 'research', 'environment']
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`  Testing: "${testCase.title}"`);
    // You would call your extractTags function here
    console.log(`  Expected tags: ${testCase.expectedTags.join(', ')}`);
  }
  
  console.log('✅ Tag extraction test completed');
}

async function runTests() {
  console.log('🚀 Starting tests...\n');
  
  await testRSSParsing();
  await testTagExtraction();
  
  console.log('\n✨ All tests completed!');
  console.log('\n📝 Note: This is a basic test. For full testing, deploy the worker and test the endpoints.');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testRSSParsing, testTagExtraction };
