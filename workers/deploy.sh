#!/bin/bash

# News Fetcher Worker Deployment Script

set -e

echo "🚀 Deploying News Fetcher Worker..."

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Installing..."
    npm install -g wrangler
fi

# Check if user is logged in
if ! wrangler whoami &> /dev/null; then
    echo "❌ Not logged into Cloudflare. Please run 'wrangler login' first."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Type check
echo "🔍 Type checking..."
npm run typecheck

# Deploy based on argument
case "${1:-dev}" in
    "dev"|"development")
        echo "🌍 Deploying to development environment..."
        wrangler dev
        ;;
    "staging")
        echo "🧪 Deploying to staging environment..."
        wrangler deploy --env staging
        ;;
    "prod"|"production")
        echo "🚀 Deploying to production environment..."
        wrangler deploy --env production
        ;;
    *)
        echo "Usage: $0 [dev|staging|prod]"
        echo "  dev (default) - Start local development server"
        echo "  staging      - Deploy to staging environment"
        echo "  prod         - Deploy to production environment"
        exit 1
        ;;
esac

echo "✅ Deployment completed!"
