#!/bin/bash

echo "🚀 Deploying Gospel Gather to production..."

# Build the application
echo "📦 Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build successful!"

# Check if dist directory exists
if [ ! -d "dist" ]; then
    echo "❌ Dist directory not found!"
    exit 1
fi

echo "📁 Production files ready in dist/ directory"
echo "📊 Build size:"
du -sh dist/*

echo ""
echo "🎯 Next steps:"
echo "1. Upload the contents of the 'dist' folder to your web server"
echo "2. Configure your web server to serve index.html for all routes (SPA routing)"
echo "3. Set up HTTPS for security"
echo ""
echo "🌐 For local testing, run: npm run serve"
echo "🔧 For development, run: npm run dev"

