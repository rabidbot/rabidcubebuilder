import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import { initDatabase } from './lib/db';

async function bootstrap() {
  try {
    await initDatabase();
  } catch (err) {
    const root = document.getElementById('root');
    if (root) {
      root.innerHTML = `<div style="padding:2rem;color:#ff3355;font-family:system-ui,sans-serif;text-align:center;">
        Failed to initialize database: ${err instanceof Error ? err.message : 'Unknown error'}
      </div>`;
    }
  }

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <HashRouter>
        <App />
      </HashRouter>
    </React.StrictMode>,
  );
}

bootstrap();
