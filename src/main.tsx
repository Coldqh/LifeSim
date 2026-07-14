import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './styles.css';

type StandaloneNavigator = Navigator & { standalone?: boolean };

function syncStandaloneViewport(): void {
  const standalone = window.matchMedia('(display-mode: standalone)').matches
    || Boolean((window.navigator as StandaloneNavigator).standalone);

  document.documentElement.classList.toggle('standalone-webapp', standalone);

  if (!standalone) {
    document.documentElement.style.removeProperty('--app-viewport-height');
    return;
  }

  const portrait = window.matchMedia('(orientation: portrait)').matches;
  const screenHeight = portrait
    ? Math.max(window.screen.width, window.screen.height)
    : Math.min(window.screen.width, window.screen.height);
  const hiddenSystemArea = screenHeight - window.innerHeight;
  const viewportHeight = hiddenSystemArea > 0 && hiddenSystemArea <= 120
    ? screenHeight
    : window.innerHeight;

  document.documentElement.style.setProperty('--app-viewport-height', `${Math.round(viewportHeight)}px`);
}

syncStandaloneViewport();
window.addEventListener('resize', syncStandaloneViewport);
window.addEventListener('orientationchange', syncStandaloneViewport);
window.visualViewport?.addEventListener('resize', syncStandaloneViewport);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
