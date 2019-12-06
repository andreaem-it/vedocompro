importScripts('app/cache-polyfill.js');
var cacheName = 'vedocompro-v1';


self.addEventListener('push', function(event) {
    console.log(self.Notification, Notification.requestPermission)
    self.Notification.requestPermission().then(res => console.log(res))

    if (Notification.permission === 'denied') {
        console.log('Permission wasn\'t granted. Allow a retry.');
        return;
    }

    if (Notification.permission === 'default') {
        console.log('The permission request was dismissed.');
        return;
    }

    console.log('The permission request is granted!');

    try {
        event.waitUntil(
            self.registration.showNotification(event && event.data && event.data.text() || 'Some Notification Here!')
        );
    } catch (e) {
        throw new Error(`Error in SW: ${e}`)
    }
});

self.addEventListener('install', event => {
    console.log('Service worker installing...');

    event.waitUntil(
        caches.open(cacheName).then(function(cache) {
            return cache.addAll([
                '/',
                '/app.php',
                '/css/bootstrap.min.css',
                '/css/base.css',
                '/css/custom.css',
                '/js/bootstrap.min.js',
                '/js/jquery-3.3.1.min.js'
            ]);
        })
    );

});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if(cacheName.indexOf(key) === -1) {
                    return caches.delete(key);
                }
            }));
        })
    );
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((r) => {
            console.log('[Service Worker] Fetching resource: '+e.request.url);
            return r || fetch(e.request).then((response) => {
                return caches.open(cacheName).then((cache) => {
                    console.log('[Service Worker] Caching new resource: '+e.request.url);
                    cache.put(e.request, response.clone());
                    return response;
                });
            });
        })
    );
});