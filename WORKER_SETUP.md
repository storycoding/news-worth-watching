# 🚀 Cloudflare Worker Setup Guide

Your news fetcher worker is ready to deploy! Here's how to get it running:

## Quick Start

1. **Navigate to the workers directory:**
   ```bash
   cd workers
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Install Wrangler CLI globally:**
   ```bash
   npm install -g wrangler
   ```

4. **Login to Cloudflare:**
   ```bash
   wrangler login
   ```

5. **Deploy the worker:**
   ```bash
   # For development/testing
   npm run dev
   
   # For production
   npm run deploy:prod
   ```

## What the Worker Does

- **🕕 Runs daily at 6 AM GMT** via cron trigger
- **📰 Fetches news** from Azores government, research institutions, and permaculture sources
- **🏷️ Auto-tags content** with relevant categories (azores, permaculture, climate, etc.)
- **🌐 Supports multiple source types**: RSS feeds, web scraping, and APIs
- **🔧 Manual trigger** available via HTTP POST request

## Sources Included

- **Azores Government** (Governo dos Açores)
- **Diário da República** (Portuguese official gazette)
- **INOVA Açores** (Innovation agency)
- **Azores Geopark**
- **Universidade dos Açores**
- **FAO Agroecology** (RSS feed)
- **EU Environment** (RSS feed)

## Testing

Once deployed, test the worker:

```bash
# Test manual trigger
curl -X POST https://your-worker.your-subdomain.workers.dev/

# Check status
curl https://your-worker.your-subdomain.workers.dev/
```

## Monitoring

- Check logs in Cloudflare Dashboard → Workers & Pages
- Monitor cron execution in the "Logs" tab
- Set up alerts for failed executions

## Next Steps

1. **Deploy the worker** using the commands above
2. **Test the endpoints** to ensure everything works
3. **Monitor the first few runs** to verify news fetching
4. **Customize sources** if needed by editing `src/index.ts`
5. **Set up data storage** (KV/D1) for persistent news data

## Need Help?

- Check the detailed README in the `workers/` directory
- Review Cloudflare Workers documentation
- Check worker logs for any error messages

---

**Your worker will automatically start fetching news every day at 6 AM GMT! 🎉**
