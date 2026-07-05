'use client';

import { useEffect } from 'react';

/**
 * Registra il service worker della PWA lato client.
 * Non renderizza nulla: si limita a effettuare la registrazione dopo il mount.
 */
export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    if (process.env.NODE_ENV !== 'production') {
      return;
    }

    navigator.serviceWorker.register('/service-worker.js').catch(() => {
      // Registrazione non riuscita: non è un errore bloccante per l'app.
    });
  }, []);

  return null;
}
