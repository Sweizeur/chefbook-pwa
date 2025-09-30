// Script pour corriger les chemins des assets - S'exécute immédiatement
(function() {
  console.log('🔧 Fixing asset paths...');
  
  // Intercepter les requêtes de polices
  const originalFetch = window.fetch;
  window.fetch = function(url, options) {
    // Si l'URL commence par /assets/ et ne contient pas /chefbook-pwa/
    if (url.startsWith('/assets/') && !url.includes('/chefbook-pwa/')) {
      const newUrl = '/chefbook-pwa' + url;
      console.log('🔄 Redirecting asset:', url, '->', newUrl);
      url = newUrl;
    }
    return originalFetch.call(this, url, options);
  };

  // Intercepter les requêtes XMLHttpRequest
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
    // Si l'URL commence par /assets/ et ne contient pas /chefbook-pwa/
    if (url.startsWith('/assets/') && !url.includes('/chefbook-pwa/')) {
      const newUrl = '/chefbook-pwa' + url;
      console.log('🔄 Redirecting asset:', url, '->', newUrl);
      url = newUrl;
    }
    return originalOpen.call(this, method, url, async, user, password);
  };

  // Intercepter les requêtes de style
  const originalCreateElement = document.createElement;
  document.createElement = function(tagName) {
    const element = originalCreateElement.call(this, tagName);
    if (tagName.toLowerCase() === 'link') {
      const originalHref = Object.getOwnPropertyDescriptor(HTMLLinkElement.prototype, 'href');
      Object.defineProperty(element, 'href', {
        get: function() {
          return originalHref.get.call(this);
        },
        set: function(value) {
          if (value && value.startsWith('/assets/') && !value.includes('/chefbook-pwa/')) {
            const newValue = '/chefbook-pwa' + value;
            console.log('🔄 Redirecting link asset:', value, '->', newValue);
            value = newValue;
          }
          originalHref.set.call(this, value);
        }
      });
    }
    return element;
  };

  console.log('✅ Asset path fixer loaded');
})();
