const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configure the base path for assets
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Set the base URL for assets
config.resolver.assetExts.push('ttf', 'otf', 'woff', 'woff2');

// Configure the public path for web
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Add base path to asset requests
      if (req.url.startsWith('/assets/')) {
        req.url = '/chefbook-pwa' + req.url;
      }
      return middleware(req, res, next);
    };
  },
};

module.exports = config;
