import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

import './theme/theme.css';

// Load Telegram WebApp script
const script = document.createElement('script');
script.src = 'https://telegram.org/js/telegram-web-app.js';
script.async = true;
document.head.appendChild(script);

const container = document.getElementById('root');
const root = createRoot(container!);

script.onload = () => {
  console.log('Telegram WebApp loaded');
  
  // Initialize Telegram WebApp
  if (window.Telegram?.WebApp) {
    window.Telegram.WebApp.ready();
    window.Telegram.WebApp.expand();
  }

  // Render app after Telegram script loads
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

// Fallback if script fails to load (for development outside Telegram)
script.onerror = () => {
  console.warn('Telegram WebApp script failed to load - running in dev mode');
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};
