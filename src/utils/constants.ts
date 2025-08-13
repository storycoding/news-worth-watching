// Shared constants for the application

// Worker configuration
export const DEFAULT_WORKER_URL = 'https://news-fetcher.youknownuno.workers.dev';

// Timeout configuration (in milliseconds)
export const WORKER_TIMEOUT = 30000; // 30 seconds
export const WORKER_TIMEOUT_SECONDS = WORKER_TIMEOUT / 1000; // 30 seconds for display

// Update interval for timeout counter (in milliseconds)
export const TIMEOUT_COUNTER_INTERVAL = 1000; // 1 second

// Other configuration constants can be added here
export const MAX_NEWS_ITEMS = 100;
export const MAX_RETRY_ATTEMPTS = 3;
