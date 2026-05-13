const CACHE_VERSION = 'md2doc-evolution-v2';
const APP_SHELL_CACHE = `${CACHE_VERSION}-app-shell`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const BASE_PATH = '/MD2DOC-Evolution/';
const VITE_MANIFEST_URL = `${BASE_PATH}.vite/manifest.json`;
const APP_SHELL = [
  BASE_PATH,
  `${BASE_PATH}index.html`,
  `${BASE_PATH}offline.html`,
  `${BASE_PATH}logo.svg`,
  `${BASE_PATH}manifest.webmanifest`,
  VITE_MANIFEST_URL,
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => precacheBuildAssets())
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith('md2doc-evolution-') && ![APP_SHELL_CACHE, RUNTIME_CACHE].includes(key))
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  const requestUrl = new URL(request.url);
  const isAppAsset = requestUrl.origin === self.location.origin && requestUrl.pathname.startsWith(BASE_PATH);
  const isRuntimeAsset = ['script', 'style', 'image', 'font'].includes(request.destination);

  if (isAppAsset || isRuntimeAsset) {
    event.respondWith(staleWhileRevalidate(request));
  }
});

async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(RUNTIME_CACHE);
    cache.put(request, response.clone());
    return response;
  } catch {
    return (await caches.match(request))
      || (await caches.match(BASE_PATH))
      || (await caches.match(`${BASE_PATH}offline.html`));
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cachedResponse = await cache.match(request);
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      cache.put(request, networkResponse.clone());
      return networkResponse;
    })
    .catch(() => cachedResponse);

  return cachedResponse || fetchPromise;
}

async function precacheBuildAssets() {
  try {
    const response = await fetch(VITE_MANIFEST_URL);
    const manifest = await response.json();
    const assetUrls = collectBuildAssetUrls(manifest);

    if (assetUrls.length === 0) {
      return;
    }

    const cache = await caches.open(APP_SHELL_CACHE);
    await cache.addAll(assetUrls);
  } catch (error) {
    console.warn('Build asset precache skipped:', error);
  }
}

function collectBuildAssetUrls(manifest) {
  const urls = new Set();
  const visited = new Set();

  function addAsset(assetPath) {
    if (assetPath) {
      urls.add(`${BASE_PATH}${assetPath}`);
    }
  }

  function visit(entryName) {
    if (!entryName || visited.has(entryName)) {
      return;
    }

    visited.add(entryName);
    const entry = manifest[entryName];

    if (!entry) {
      return;
    }

    addAsset(entry.file);
    entry.css?.forEach(addAsset);
    entry.assets?.forEach(addAsset);
    entry.imports?.forEach(visit);
    entry.dynamicImports?.forEach(visit);
  }

  Object.keys(manifest).forEach(visit);
  return [...urls];
}
