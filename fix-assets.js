// Script pour corriger les chemins des assets
(function() {
  // Intercepter les requêtes de polices
  const originalFetch = window.fetch;
  window.fetch = function(url, options) {
    // Si l'URL commence par /assets/ et ne contient pas /chefbook-pwa/
    if (url.startsWith('/assets/') && !url.includes('/chefbook-pwa/')) {
      url = '/chefbook-pwa' + url;
    }
    return originalFetch.call(this, url, options);
  };

  // Intercepter les requêtes XMLHttpRequest
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
    // Si l'URL commence par /assets/ et ne contient pas /chefbook-pwa/
    if (url.startsWith('/assets/') && !url.includes('/chefbook-pwa/')) {
      url = '/chefbook-pwa' + url;
    }
    return originalOpen.call(this, method, url, async, user, password);
  };
})();
