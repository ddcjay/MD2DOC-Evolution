const GOOGLE_TAG_ID = 'G-ZXT99R0JE3';
const GOATCOUNTER_URL = 'https://eric861129.goatcounter.com/count';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function registerAnalytics() {
  if (!import.meta.env.PROD || !navigator.onLine) {
    return;
  }

  window.addEventListener('load', () => {
    loadGoogleTag();
    loadGoatCounter();
  });
}

function loadGoogleTag() {
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag(...args: unknown[]) {
    window.dataLayer?.push(args);
  };

  window.gtag('js', new Date());
  window.gtag('config', GOOGLE_TAG_ID);
  appendScript(`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_TAG_ID}`);
}

function loadGoatCounter() {
  const script = appendScript('https://gc.zgo.at/count.js');
  script.dataset.goatcounter = GOATCOUNTER_URL;
}

function appendScript(src: string) {
  const script = document.createElement('script');
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
  return script;
}
