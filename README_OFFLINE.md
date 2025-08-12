# 📁 Simple Setup

## How it works

Your app will:
1. **Try to connect to the worker** first
2. **Fall back to local JSON** if the worker fails
3. **Always work** - either way you get news

## To test worker integration

1. **Start the worker:**
   ```bash
   cd workers
   npx wrangler dev src/index.ts
   ```

2. **Start your app:**
   ```bash
   npm run dev
   ```

3. **The app will automatically try the worker first, then fall back to JSON**

## To work offline only (FAST LOADING)

Set the environment variable to skip worker entirely:

```bash
VITE_OFFLINE_WORKER=true npm run dev
```

This will:
- ✅ **Skip worker connection** - no waiting
- ✅ **Load directly from** `news_fixture.json`
- ✅ **Much faster loading** - no network delays
- ✅ **Perfect for development** and UI work

## To work with worker (SLOWER BUT REAL DATA)

```bash
npm run dev
```

This will:
- 🔄 **Try worker first** - may take time
- 📁 **Fall back to JSON** if worker fails
- 🌐 **Real-time data** when worker works

That's it! 🎉
