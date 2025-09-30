#!/bin/bash

echo "🚀 Building ChefBook PWA..."

# Build the web version
echo "📦 Building web version..."
npx expo export --platform web

# Copy PWA files
echo "📱 Setting up PWA files..."
cp public/manifest.json dist/
cp assets/icon.png dist/icon-192.png
cp assets/icon.png dist/icon-512.png

# Create service worker
echo "⚙️ Creating service worker..."
cat > dist/sw.js << 'EOF'
const CACHE_NAME = 'chefbook-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});
EOF

echo "✅ PWA build complete!"
echo "📁 Files are in the 'dist' folder"
echo "🌐 You can now deploy to GitHub Pages, Netlify, or Vercel"
