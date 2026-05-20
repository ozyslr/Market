import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initSentry } from './lib/sentry';
import { initAnalytics } from './lib/analytics';
import { registerSW } from './services/swRegistration';

initSentry();
initAnalytics();

// Register service worker for PWA support
registerSW();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
