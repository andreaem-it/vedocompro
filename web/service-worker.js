importScripts('app/cache-polyfill.js');

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
        caches.open('vedocompro').then(function(cache) {
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

self.addEventListener('activate', event => {
    console.log('Service worker activating...');
});

self.addEventListener('fetch', event => {
    console.log('Fetching:', event.request.url);
    event.respondWith(
        caches.open('mysite-dynamic').then(function(cache) {
            return cache.match(event.request).then(function (response) {
                return response || fetch(event.request).then(function(response) {
                    cache.put(event.request, response.clone());
                    return response;
                });
            });
        })
    );
});