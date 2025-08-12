# News Fetcher Worker

A Cloudflare Worker that automatically fetches news from various sources every day at 6 AM GMT.

## Features

- **Automated News Fetching**: Runs daily at 6 AM GMT via cron trigger
- **Multiple Source Types**: Supports RSS feeds, APIs, and web scraping
- **Smart Tagging**: Automatically extracts relevant tags from content
- **Azores & Permaculture Focus**: Specialized for your news aggregation platform
- **Manual Trigger**: Can be triggered manually via HTTP POST request

## Sources

The worker fetches news from:

- **Azores Government & Policy**: Governo dos Açores, Diário da República, INOVA
- **São Miguel Research**: Azores Geopark, Universidade dos Açores
- **Permaculture & Regeneration**: FAO Agroecology, EU Environment

## Setup

### 1. Install Dependencies

```bash
cd workers
npm install
```

### 2. Install Wrangler CLI

```bash
npm install -g wrangler
```

### 3. Login to Cloudflare

```bash
wrangler login
```

### 4. Configure Environment Variables

Create a `.dev.vars` file for local development:

```bash
# .dev.vars
NEWS_KV_NAMESPACE_ID=your_kv_namespace_id
```

### 5. Deploy

```bash
# Deploy to development
npm run dev

# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:prod
```

## Development

### Local Development

```bash
npm run dev
```

This starts the worker locally for testing.

### Type Checking

```bash
npm run typecheck
```

## API Endpoints

### GET /
Returns information about the worker and available endpoints.

### POST /
Manually triggers a news fetch operation.

**Response:**
```json
{
  "success": true,
  "message": "Fetched 15 news items",
  "count": 15
}
```

## Cron Schedule

The worker runs automatically every day at **6:00 AM GMT** using the cron expression:
```
0 6 * * *
```

## Data Storage

Currently, the worker logs fetched news items. For production use, consider:

1. **Cloudflare KV**: Store news data with expiration
2. **Cloudflare D1**: Database storage for structured data
3. **Webhook Integration**: Send data to your main application
4. **File Storage**: Update static JSON files in your public directory

## Customization

### Adding New Sources

Edit the `sources` array in `src/index.ts`:

```typescript
{
  name: "New Category",
  sources: [
    { 
      label: "Source Name", 
      url: "https://example.com", 
      type: 'rss' // or 'api' or 'scrape'
    }
  ]
}
```

### Modifying Tags

Update the `extractTags` function to add new tag extraction logic.

### Changing Schedule

Modify the cron expression in `wrangler.toml`:

```toml
[triggers]
crons = ["0 6 * * *"]  # Change this to your preferred schedule
```

## Monitoring

Check worker logs in the Cloudflare Dashboard:
1. Go to Workers & Pages
2. Select your worker
3. View logs in the "Logs" tab

## Troubleshooting

### Common Issues

1. **Cron not triggering**: Check the cron expression format
2. **Fetch errors**: Verify source URLs are accessible
3. **Deployment failures**: Ensure you're logged into Cloudflare

### Debug Mode

Enable debug logging by adding console.log statements in the worker code.

## Security Considerations

- The worker runs in Cloudflare's secure environment
- No sensitive data is stored in the worker
- Rate limiting is implemented to be respectful to sources
- Consider implementing authentication for manual triggers in production

## Next Steps

1. **Set up KV storage** for persistent news data
2. **Implement webhook integration** with your main app
3. **Add more sophisticated content parsing**
4. **Implement content deduplication**
5. **Add error reporting and monitoring**
