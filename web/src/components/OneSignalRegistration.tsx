'use client';

import { useEffect } from 'react';

type OneSignalQueue = Array<() => void> & {
  push: (callback: () => void) => number;
  init?: (options: { appId: string }) => void;
};

declare global {
  interface Window {
    OneSignal?: OneSignalQueue;
    __vedocomproOneSignalInitialized?: boolean;
  }
}

const ONESIGNAL_SCRIPT_ID = 'onesignal-sdk';

export default function OneSignalRegistration() {
  useEffect(() => {
    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;

    if (
      typeof window === 'undefined' ||
      process.env.NODE_ENV !== 'production' ||
      !appId ||
      window.__vedocomproOneSignalInitialized
    ) {
      return;
    }

    window.__vedocomproOneSignalInitialized = true;
    window.OneSignal = window.OneSignal || ([] as unknown as OneSignalQueue);

    window.OneSignal.push(() => {
      window.OneSignal?.init?.({ appId });
    });

    if (document.getElementById(ONESIGNAL_SCRIPT_ID)) {
      return;
    }

    const script = document.createElement('script');
    script.id = ONESIGNAL_SCRIPT_ID;
    script.src = 'https://cdn.onesignal.com/sdks/OneSignalSDK.js';
    script.async = true;
    document.head.appendChild(script);
  }, []);

  return null;
}
