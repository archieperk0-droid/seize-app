/* ============================================================
   Operations PWA — Service Worker
   Handles: offline caching, push notifications, scheduled alerts
   ============================================================ */

const CACHE_NAME = 'archie-ops-v3';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

/* ---- Install: pre-cache shell assets ---- */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
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

/* ---- Fetch: cache-first for shell, network-first for data ---- */
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => caches.match('/index.html'));
    })
  );
});

/* ---- Push: receive push event and show notification ---- */
self.addEventListener('push', event => {
  let data = { title: 'Operations', body: 'Time to check your schedule.' };
  if (event.data) {
    try { data = event.data.json(); } catch(e) { data.body = event.data.text(); }
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'Operations — Archie', {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: data.tag || 'ops-reminder',
      renotify: true,
      vibrate: [200, 100, 200],
      data: { url: data.url || '/' }
    })
  );
});

/* ---- Notification click: open/focus the app ---- */
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          return;
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

/* ---- Message: receive reminder schedule from the app ---- */
self.addEventListener('message', event => {
  if (event.data?.type === 'SCHEDULE_REMINDERS') {
    scheduleLocalReminders(event.data.reminders);
  }
  if (event.data?.type === 'CANCEL_REMINDERS') {
    cancelAllReminders();
  }
});

/* ---- Local reminder scheduling via alarms ---- */
/* 
  The Web Alarms API isn't widely supported yet, so we use a 
  periodic sync approach. The app sends reminders on each load;
  the SW fires them via setTimeout within the SW lifetime, and 
  re-schedules on next load. For iOS PWAs this means the app 
  needs to be opened at least once per day — which is the intent.
*/

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

    if (target <= now) {
      target.setDate(target.getDate() + 1);
    }

    const delay = target.getTime() - now.getTime();

    const timer = setTimeout(() => {
      self.registration.showNotification('Operations — Archie', {
        body: reminder.text,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: 'reminder-' + reminder.id,
        renotify: true,
        vibrate: [200, 100, 200],
        data: { url: '/' }
      });
    }, delay);

    scheduledTimers.push(timer);
  });
}

/* ---- Periodic background sync (where supported) ---- */
self.addEventListener('periodicsync', event => {
  if (event.tag === 'ops-daily-sync') {
    event.waitUntil(dailySync());
  }
});

async function dailySync() {
  /* Re-read reminders from storage and reschedule */
  const allClients = await clients.matchAll({ includeUncontrolled: true });
  if (allClients.length) {
    allClients[0].postMessage({ type: 'REQUEST_REMINDERS' });
  }
}
