self.addEventListener("install", () => {
  console.log("Service Worker Installed");
});

self.addEventListener("activate", () => {
  console.log("Service Worker Activated");
});
// app offline open ho sake
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((res) => {
      return res || fetch(event.request);
    })
  );
});
