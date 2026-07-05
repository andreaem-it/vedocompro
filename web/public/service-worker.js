// Service worker per VedoCompro (PWA).
// Strategia leggera e non invasiva:
// - asset statici (immagini, icone, font) -> cache-first con aggiornamento in background
// - navigazioni HTML -> network-first con fallback alla cache se offline
// Pensato per non interferire con lo sviluppo locale (Next.js dev server) né
// con i dati dinamici dell'app (API, contenuti del marketplace).

var VERSION = 'vedocompro-v1';
var STATIC_CACHE = VERSION + '-static';
var PAGES_CACHE = VERSION + '-pages';
var CURRENT_CACHES = [STATIC_CACHE, PAGES_CACHE];

var STATIC_ASSET_REGEX = /\.(png|jpg|jpeg|gif|svg|webp|ico|woff2?|ttf)$/i;

self.addEventListener('install', function (event) {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches
      .keys()
      .then(function (names) {
        return Promise.all(
          names
            .filter(function (name) {
              return CURRENT_CACHES.indexOf(name) === -1;
            })
            .map(function (name) {
              return caches.delete(name);
            })
        );
      })
      .then(function () {
        return self.clients.claim();
      })
  );
});

self.addEventListener('fetch', function (event) {
  var request = event.request;

  // Lascia passare tutto ciò che non è una GET (mutazioni, API POST, ecc.).
  if (request.method !== 'GET') {
    return;
  }

  var url = new URL(request.url);

  // Solo richieste same-origin.
  if (url.origin !== self.location.origin) {
    return;
  }

  // Non intercettare le chiamate API: devono sempre andare in rete.
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Asset statici: cache-first, con aggiornamento in background (stale-while-revalidate).
  if (STATIC_ASSET_REGEX.test(url.pathname) || url.pathname.startsWith('/_next/static/')) {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
    return;
  }

  // Navigazioni di pagina (HTML): network-first, con fallback alla cache se offline.
  var acceptHeader = request.headers.get('accept') || '';
  if (request.mode === 'navigate' || acceptHeader.indexOf('text/html') !== -1) {
    event.respondWith(networkFirst(request, PAGES_CACHE));
  }
});

function staleWhileRevalidate(request, cacheName) {
  return caches.open(cacheName).then(function (cache) {
    return cache.match(request).then(function (cached) {
      var networkFetch = fetch(request)
        .then(function (response) {
          if (response && response.ok) {
            cache.put(request, response.clone());
          }
          return response;
        })
        .catch(function () {
          return cached;
        });
      return cached || networkFetch;
    });
  });
}

function networkFirst(request, cacheName) {
  return caches.open(cacheName).then(function (cache) {
    return fetch(request)
      .then(function (response) {
        if (response && response.ok) {
          cache.put(request, response.clone());
        }
        return response;
      })
      .catch(function () {
        return cache.match(request);
      });
  });
}
