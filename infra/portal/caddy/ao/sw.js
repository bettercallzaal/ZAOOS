// Minimal no-op service worker. Stops the console MIME-type registration error.
// Real SW from upstream AO is not shipped in the npm build; this placeholder
// keeps the browser happy until AO ships sw.js or we clone source.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
