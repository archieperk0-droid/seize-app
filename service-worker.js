/* ============================================================
   Seize the Day — Service Worker v1
   Handles: offline caching, push notifications, scheduled alerts
   ============================================================ */

const CACHE_NAME = 'seize-v1';
const BASE = '/seize-app';
const ASSETS = [
  BASE + '/',
  BASE + '/index.html',
  BASE + '/manifest.json',
  BASE + '/icon-192.png',
  BASE + '/icon-512.png',
  BASE + '/icon-180.png'
];

/* ---- Install: pre-cache shell assets ---- */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS).catch(err => {
        console.warn('Cache addAll partial failure (ok):', err);
      });
    })
  );
  self.skipWaiting();
});

/* ---- Activate: clean old caches ---- */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

/* ---- Fetch: cache-first, with iOS path redirect fix ---- */
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Redirect /seize-app (no trailing slash) to /seize-app/ — fixes iOS PWA 404
  if (url.pathname === BASE) {
    event.respondWith(Response.redirect(url.origin + BASE + '/', 301));
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response.ok && response.type !== 'opaque') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        return caches.match(BASE + '/index.html');
      });
    })
  );
});

/* ---- Push: show notification ---- */
self.addEventListener('push', event => {
  let data = { title: 'Seize the Day', body: 'Time to check your schedule.' };
  if (event.data) {
    try { data = event.data.json(); } catch(e) { data.body = event.data.text(); }
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'Seize the Day', {
      body: data.body,
      icon: BASE + '/icon-192.png',
      badge: BASE + '/icon-192.png',
      tag: data.tag || 'seize-reminder',
      renotify: true,
      vibrate: [200, 100, 200],
      data: { url: data.url || BASE + '/' }
    })
  );
});

/* ---- Notification click: open/focus the app ---- */
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || BASE + '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (const client of windowClients) {
        if ('focus' in client) { client.focus(); return; }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

/* ---- Message: receive reminder schedule from the app ---- */
self.addEventListener('message', event => {
  if (!event.data) return;
  if (event.data.type === 'SCHEDULE_REMINDERS') scheduleLocalReminders(event.data.reminders);
  if (event.data.type === 'CANCEL_REMINDERS') cancelAllReminders();
  if (event.data.type === 'REQUEST_REMINDERS') {
    clients.matchAll({ includeUncontrolled: true }).then(all => {
      if (all[0]) all[0].postMessage({ type: 'REQUEST_REMINDERS' });
    });
  }
});

/* ---- Local reminder scheduling ---- */
let scheduledTimers = [];

function cancelAllReminders() {
  scheduledTimers.forEach(t => clearTimeout(t));
  scheduledTimers = [];
}

function scheduleLocalReminders(reminders) {
  cancelAllReminders();
  if (!reminders || !reminders.length) return;
  const now = new Date();
  reminders.forEach(reminder => {
    const [h, m] = reminder.time.split(':').map(Number);
    const target = new Date();
    target.setHours(h, m, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1);
    const delay = target.getTime() - now.getTime();
    scheduledTimers.push(setTimeout(() => {
      self.registration.showNotification('Seize the Day', {
        body: reminder.text,
        icon: BASE + '/icon-192.png',
        badge: BASE + '/icon-192.png',
        tag: 'reminder-' + reminder.id,
        renotify: true,
        vibrate: [200, 100, 200]
      });
    }, delay));
  });
}
