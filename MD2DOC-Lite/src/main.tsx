import React from 'react';
import { createRoot } from 'react-dom/client';
import './services/browserRuntime';
import App from './App';
import './globals.css';
import './services/i18n';
import { registerAnalytics } from './services/analytics';
import { registerServiceWorker } from './services/pwaRegistration';

const container = document.getElementById('root');

if (!container) {
  throw new Error('Could not find root element to mount to');
}

createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

registerServiceWorker();
registerAnalytics();
