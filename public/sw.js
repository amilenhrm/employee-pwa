// 🆕 SW Version: 1.0.3
self.addEventListener("install", (event) => {
  console.log("🧩 Service Worker installed");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("✅ Service Worker activated");
  event.waitUntil(clients.claim());
});

self.addEventListener("fetch", (event) => {
  // Optional caching
});
