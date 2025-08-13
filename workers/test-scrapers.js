#!/usr/bin/env node

/**
 * Test script for worker scraping functionality
 * Run with: node test-scrapers.js
 */

const WORKER_URL = 'http://localhost:8787';

// Test individual scraper
async function testIndividualScraper(scraperName) {
  console.log(`\n🧪 Testing individual scraper: ${scraperName}`);
  
  try {
    const response = await fetch(`${WORKER_URL}/test-scraper`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scraperName })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ ${scraperName} scraper test successful`);
      console.log(`   Items found: ${result.result.itemCount}`);
      console.log(`   Duration: ${new Date(result.result.timestamp)}`);
      
      if (result.result.rawScrapedItems.length > 0) {
        console.log(`   Sample item: ${result.result.rawScrapedItems[0].title}`);
      }
    } else {
      console.log(`❌ ${scraperName} scraper test failed`);
      console.log(`   Error: ${result.result.error}`);
    }
    
    return result;
  } catch (error) {
    console.error(`❌ Error testing ${scraperName}:`, error.message);
    return null;
  }
}

// Test comprehensive scraping
async function testComprehensiveScraping(categories = []) {
  console.log(`\n🧪 Testing comprehensive scraping...`);
  if (categories.length > 0) {
    console.log(`   Categories: ${categories.join(', ')}`);
  }
  
  try {
    const response = await fetch(`${WORKER_URL}/test-scraping`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        enableVerboseLogging: true, 
        testSpecificSources: categories 
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      const summary = result.testResult.summary;
      console.log(`✅ Comprehensive scraping test completed`);
      console.log(`   Total sources: ${summary.totalSources}`);
      console.log(`   Successful: ${summary.successfulSources}`);
      console.log(`   Failed: ${summary.failedSources}`);
      console.log(`   Total items: ${summary.totalItems}`);
      console.log(`   Duration: ${summary.totalDuration}ms`);
      
      // Show detailed results for each category
      result.testResult.sources.forEach(category => {
        console.log(`\n   📰 ${category.categoryName}:`);
        category.sources.forEach(source => {
          const status = source.success ? '✅' : '❌';
          console.log(`      ${status} ${source.label}: ${source.itemCount} items (${source.duration}ms)`);
        });
      });
    } else {
      console.log(`❌ Comprehensive scraping test failed`);
      console.log(`   Error: ${result.testResult.error}`);
    }
    
    return result;
  } catch (error) {
    console.error(`❌ Error in comprehensive scraping test:`, error.message);
    return null;
  }
}

// Test all individual scrapers
async function testAllScrapers() {
  console.log('🚀 Testing all individual scrapers...');
  
  const scrapers = [
    'azores-government',
    'diario-republica', 
    'inova-azores',
    'azores-geopark',
    'universidade-azores'
  ];
  
  const results = [];
  for (const scraper of scrapers) {
    const result = await testIndividualScraper(scraper);
    results.push(result);
    
    // Add delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return results;
}

// Main test runner
async function runTests() {
  console.log('🧪 Worker Scraping Test Suite');
  console.log('==============================');
  
  try {
    // Test 1: Individual scrapers
    console.log('\n📋 Test 1: Individual Scrapers');
    await testAllScrapers();
    
    // Test 2: Comprehensive scraping (all sources)
    console.log('\n📋 Test 2: Comprehensive Scraping (All Sources)');
    await testComprehensiveScraping();
    
    // Test 3: Specific category testing
    console.log('\n📋 Test 3: Specific Category Testing');
    await testComprehensiveScraping(['Azores · Policy & Regional']);
    
    console.log('\n🎯 All tests completed!');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests();
}

module.exports = {
  testIndividualScraper,
  testComprehensiveScraping,
  testAllScrapers,
  runTests
};
