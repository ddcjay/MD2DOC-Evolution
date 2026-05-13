const isLocalhost = ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) {
    return;
  }

  window.addEventListener('load', () => {
    const swUrl = `${import.meta.env.BASE_URL}sw.js`;

    navigator.serviceWorker.register(swUrl)
      .then((registration) => {
        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing;

          if (!installingWorker) {
            return;
          }

          installingWorker.addEventListener('statechange', () => {
            if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.info('MD2DOC-Evolution is ready to update after the next reload.');
            }
          });
        });
      })
      .catch((error) => {
        if (isLocalhost) {
          console.warn('Service worker registration failed:', error);
        }
      });
  });
}
