self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : { title: 'Konopek OS', body: 'Nowe powiadomienie' };
  const options = {
    body: data.body,
    icon: 'https://i0.wp.com/weed4u.pl/wp-content/uploads/2026/02/logo_round.png?resize=300%2C300&ssl=1',
    vibrate: [200, 100, 200],
    badge: 'https://i0.wp.com/weed4u.pl/wp-content/uploads/2026/02/logo_round.png?resize=300%2C300&ssl=1'
  };
  event.waitUntil(self.registration.showNotification(data.title, options));
});
