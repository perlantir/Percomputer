/**
 * PWA Service Worker
 * Multi-Model Agent Platform
 *
 * Features:
 * - Static asset caching
 * - Network-first for API calls
 * - Offline fallback page
 * - Background sync
 * - Push notification support
 */

// ── Constants ──────────────────────────────────────────────
const CACHE_VERSION = "v1";
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const API_CACHE = `api-${CACHE_VERSION}`;
const IMAGE_CACHE = `images-${CACHE_VERSION}`;
const OFFLINE_PAGE = "/offline.html";

// ── Static assets to pre-cache ─────────────────────────────
const PRECACHE_ASSETS = [
  "/",
  "/offline.html",
  "/manifest.json",
  "/favicon.svg",
  // Add build output assets patterns
  // Next.js static files are handled dynamically
];

// ── Install ────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  console.log("[SW] Installing...");

  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        // Pre-cache critical static assets
        return cache.addAll(PRECACHE_ASSETS).catch((err) => {
          console.warn("[SW] Pre-cache partial failure:", err);
        });
      })
      .then(() => {
        console.log("[SW] Pre-cache complete");
        // Skip waiting to activate immediately
        return self.skipWaiting();
      })
  );
});

// ── Activate ───────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating...");

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        // Delete old caches
        return Promise.all(
          cacheNames
            .filter(
              (name) =>
                name.startsWith("static-") ||
                name.startsWith("api-") ||
                name.startsWith("images-")
            )
            .filter((name) => {
              const isStatic = name === STATIC_CACHE;
              const isApi = name === API_CACHE;
              const isImage = name === IMAGE_CACHE;
              return !isStatic && !isApi && !isImage;
            })
            .map((name) => {
              console.log("[SW] Deleting old cache:", name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log("[SW] Cleanup complete");
        // Claim all clients immediately
        return self.clients.claim();
      })
  );
});

// ── Fetch ──────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests for basic caching
  if (request.method !== "GET") return;

  // Skip cross-origin requests (except APIs)
  if (url.origin !== self.location.origin && !isApiRequest(url)) return;

  // 1. API requests → Network-first
  if (isApiRequest(url)) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // 2. Images → Cache-first with network fallback
  if (isImageRequest(request)) {
    event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE));
    return;
  }

  // 3. Navigation requests → Stale-while-revalidate with offline fallback
  if (isNavigationRequest(request)) {
    event.respondWith(navigationStrategy(request));
    return;
  }

  // 4. Static assets (JS, CSS) → Stale-while-revalidate
  if (isStaticAsset(request)) {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
    return;
  }
});

// ── Strategy: Network First (for API) ──────────────────────
async function networkFirstStrategy(request) {
  const cache = await caches.open(API_CACHE);

  try {
    // Try network first
    const networkResponse = await fetch(request);

    // Cache successful GET responses
    if (networkResponse.ok && request.method === "GET") {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log("[SW] Network failed, falling back to cache:", request.url);

    // Return cached response if available
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline JSON for API requests
    return new Response(
      JSON.stringify({
        error: "You are offline",
        offline: true,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 503,
        headers: {
          "Content-Type": "application/json",
          "X-Offline": "true",
        },
      }
    );
  }
}

// ── Strategy: Cache First (for images) ─────────────────────
async function cacheFirstStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    // Refresh cache in background
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse.ok) {
          cache.put(request, networkResponse);
        }
      })
      .catch(() => {});
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Return a placeholder offline image
    return new Response(
      `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
        <rect width="200" height="200" fill="#f0f0f0"/>
        <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#999" font-size="14">
          Offline
        </text>
      </svg>`,
      {
        status: 200,
        headers: { "Content-Type": "image/svg+xml" },
      }
    );
  }
}

// ── Strategy: Stale While Revalidate ───────────────────────
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => cachedResponse);

  return cachedResponse || fetchPromise;
}

// ── Strategy: Navigation with Offline Fallback ─────────────
async function navigationStrategy(request) {
  const cache = await caches.open(STATIC_CACHE);

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log("[SW] Navigation failed, serving offline page");

    const cachedResponse = await cache.match(request);
    if (cachedResponse) return cachedResponse;

    const offlineResponse = await cache.match(OFFLINE_PAGE);
    if (offlineResponse) return offlineResponse;

    // Fallback HTML if offline page isn't cached
    return new Response(
      `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Offline | Multi-Model Agent Platform</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #FBF8F4;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      color: #2D3748;
    }
    .container {
      text-align: center;
      padding: 2rem;
      max-width: 420px;
    }
    .icon {
      width: 80px;
      height: 80px;
      margin: 0 auto 1.5rem;
      background: #20B8CD;
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 36px;
    }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; color: #1A202C; }
    p { color: #718096; margin-bottom: 1.5rem; line-height: 1.6; }
    .btn {
      display: inline-block;
      padding: 0.75rem 1.5rem;
      background: #20B8CD;
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 500;
      transition: opacity 0.2s;
    }
    .btn:hover { opacity: 0.9; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">📡</div>
    <h1>You are offline</h1>
    <p>Your previously visited pages may still be available. Check your connection and try again.</p>
    <a href="/" class="btn">Try Again</a>
  </div>
</body>
</html>`,
      {
        status: 200,
        headers: { "Content-Type": "text/html" },
      }
    );
  }
}

// ── Helpers ────────────────────────────────────────────────
function isApiRequest(url) {
  return (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/trpc/") ||
    url.pathname.startsWith("/graphql")
  );
}

function isImageRequest(request) {
  return (
    request.destination === "image" ||
    /\.(png|jpg|jpeg|gif|svg|webp|ico)$/i.test(new URL(request.url).pathname)
  );
}

function isNavigationRequest(request) {
  return (
    request.mode === "navigate" || request.destination === "document"
  );
}

function isStaticAsset(request) {
  const dest = request.destination;
  const url = new URL(request.url).pathname;
  return (
    dest === "script" ||
    dest === "style" ||
    dest === "font" ||
    /\.(js|css|woff2?|ttf|otf)$/i.test(url)
  );
}

// ═══════════════════════════════════════════════════════════
//  Background Sync
// ═══════════════════════════════════════════════════════════

const SYNC_TAG = "agent-platform-sync";
const QUEUE_STORE = "sync-queue";

self.addEventListener("sync", (event) => {
  console.log("[SW] Background sync triggered:", event.tag);

  if (event.tag === SYNC_TAG || event.tag.startsWith("sync-")) {
    event.waitUntil(processSyncQueue());
  }
});

async function processSyncQueue() {
  try {
    const db = await openDB();
    const requests = await db.getAll(QUEUE_STORE);

    const results = await Promise.allSettled(
      requests.map(async (item) => {
        try {
          const response = await fetch(item.url, {
            method: item.method || "POST",
            headers: item.headers || { "Content-Type": "application/json" },
            body: item.body,
          });

          if (response.ok) {
            await db.delete(QUEUE_STORE, item.id);
            // Notify clients of successful sync
            notifyClients({ type: "SYNC_SUCCESS", item });
            return { success: true, id: item.id };
          }
          throw new Error(`HTTP ${response.status}`);
        } catch (error) {
          return { success: false, id: item.id, error: error.message };
        }
      })
    );

    const failed = results
      .filter((r) => r.status === "fulfilled" && !r.value.success)
      .map((r) => r.value);

    if (failed.length > 0) {
      console.warn("[SW] Some sync items failed:", failed);
    }

    return results;
  } catch (error) {
    console.error("[SW] Sync processing error:", error);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════
//  Push Notifications
// ═══════════════════════════════════════════════════════════

self.addEventListener("push", (event) => {
  console.log("[SW] Push received:", event);

  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: "New Notification", body: event.data?.text() || "" };
  }

  const title = data.title || "Multi-Model Agent Platform";
  const options = {
    body: data.body || "You have a new notification",
    icon: data.icon || "/icon-192x192.png",
    badge: data.badge || "/icon-192x192.png",
    tag: data.tag || "default",
    requireInteraction: data.requireInteraction || false,
    renotify: data.renotify || false,
    data: {
      url: data.url || "/",
      notificationId: data.notificationId || null,
      category: data.category || "general",
      ...data.data,
    },
    actions: data.actions || [
      {
        action: "open",
        title: "Open",
      },
      {
        action: "dismiss",
        title: "Dismiss",
      },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ── Notification Click ─────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification clicked:", event.action);

  const { notification } = event;
  const { url, notificationId } = notification.data || {};

  notification.close();

  if (event.action === "dismiss") {
    return;
  }

  // Mark as read via API if notificationId exists
  if (notificationId) {
    event.waitUntil(
      fetch(`/api/notifications/${notificationId}/read`, {
        method: "POST",
        keepalive: true,
      }).catch(() => {})
    );
  }

  // Focus or open the target URL
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        const targetUrl = url || "/";

        // Focus existing client if same URL is open
        for (const client of clientList) {
          if (client.url === targetUrl && "focus" in client) {
            return client.focus();
          }
        }

        // Open new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});

// ── Notification Close ─────────────────────────────────────
self.addEventListener("notificationclose", (event) => {
  console.log("[SW] Notification closed");
});

// ═══════════════════════════════════════════════════════════
//  Message Handler (Client <-> SW communication)
// ═══════════════════════════════════════════════════════════

self.addEventListener("message", (event) => {
  const { type, payload } = event.data || {};

  switch (type) {
    case "SKIP_WAITING":
      self.skipWaiting();
      break;

    case "GET_VERSION":
      event.ports[0]?.postMessage({ version: CACHE_VERSION });
      break;

    case "CLEAR_CACHES":
      event.waitUntil(
        caches
          .keys()
          .then((names) =>
            Promise.all(names.map((name) => caches.delete(name)))
          )
          .then(() => {
            event.ports[0]?.postMessage({ success: true });
          })
      );
      break;

    case "QUEUE_SYNC":
      event.waitUntil(
        queueSyncItem(payload).then(() => {
          // Register for background sync
          if ("sync" in self.registration) {
            return self.registration.sync.register(SYNC_TAG);
          }
        })
      );
      break;

    case "SUBSCRIBE_PUSH":
      event.waitUntil(
        handlePushSubscribe(event.ports[0], payload)
      );
      break;

    default:
      console.log("[SW] Unknown message type:", type);
  }
});

// ── Push Subscription ──────────────────────────────────────
async function handlePushSubscribe(port, { vapidPublicKey, userId }) {
  try {
    const subscription = await self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    // Send subscription to server
    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription, userId }),
    });

    port?.postMessage({ success: true, subscription });
  } catch (error) {
    console.error("[SW] Push subscription failed:", error);
    port?.postMessage({ success: false, error: error.message });
  }
}

// ── Queue Item for Background Sync ─────────────────────────
async function queueSyncItem(payload) {
  const db = await openDB();
  const item = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    url: payload.url,
    method: payload.method || "POST",
    headers: payload.headers || { "Content-Type": "application/json" },
    body: payload.body,
    timestamp: Date.now(),
    retries: 0,
  };
  await db.add(QUEUE_STORE, item);
  return item;
}

// ── Notify all clients ─────────────────────────────────────
async function notifyClients(data) {
  const clients = await self.clients.matchAll({ type: "window" });
  for (const client of clients) {
    client.postMessage(data);
  }
}

// ═══════════════════════════════════════════════════════════
//  IndexedDB Helper (for sync queue)
// ═══════════════════════════════════════════════════════════

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("AgentPlatformSW", 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(new IDBWrapper(request.result));

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        db.createObjectStore(QUEUE_STORE, { keyPath: "id" });
      }
    };
  });
}

class IDBWrapper {
  constructor(db) {
    this.db = db;
  }

  getAll(storeName) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, "readonly");
      const store = tx.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  add(storeName, item) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      const request = store.add(item);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  delete(storeName, id) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// ── Utility: Base64 to Uint8Array ──────────────────────────
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// ── Periodic background sync (if supported) ────────────────
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "check-notifications") {
    event.waitUntil(
      fetch("/api/notifications/unread")
        .then((res) => res.json())
        .then((data) => {
          if (data.count > 0) {
            return self.registration.showNotification(
              "Multi-Model Agent Platform",
              {
                body: `You have ${data.count} unread notification${
                  data.count > 1 ? "s" : ""
                }`,
                icon: "/icon-192x192.png",
                badge: "/icon-192x192.png",
                tag: "unread-notifications",
                renotify: true,
                data: { url: "/notifications" },
              }
            );
          }
        })
        .catch(() => {})
    );
  }
});

console.log("[SW] Service Worker loaded");
