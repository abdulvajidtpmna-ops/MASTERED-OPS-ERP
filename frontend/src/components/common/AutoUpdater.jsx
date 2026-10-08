import React, { useEffect, useState } from 'react';
import { RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';

export function AutoUpdater() {
  const [updating, setUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let refreshing = false;

    // When the controlling service worker changes, reload the page immediately
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        setUpdating(true);
        setUpdateMessage('New update installed! Refreshing...');
        setTimeout(() => {
          window.location.reload();
        }, 800);
      }
    });

    const checkForUpdates = () => {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration) {
          // Check if there is already a waiting worker
          if (registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            return;
          }

          // Trigger registration update check
          registration.update().catch((err) => {
            console.log('[AutoUpdater] Registration update check error:', err);
          });

          // Listen for new worker installation
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    // New content is available, tell worker to skip waiting
                    setUpdating(true);
                    setUpdateMessage('New update found! Updating Mastered Ops ERP...');
                    installingWorker.postMessage({ type: 'SKIP_WAITING' });
                  }
                }
              };
            }
          };
        }
      });
    };

    // 1. Check immediately on app mount
    checkForUpdates();

    // 2. Check whenever user returns to the app / un-minimizes on Android / iOS / Desktop
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdates();
      }
    };

    const handleFocus = () => {
      checkForUpdates();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    // 3. Periodic check every 15 minutes in background
    const interval = setInterval(checkForUpdates, 15 * 60 * 1000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, []);

  if (!updating) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-6 z-50 animate-in slide-in-from-bottom duration-300">
      <div className="bg-brand-900 text-white px-4 py-3 rounded-2xl shadow-2xl border-2 border-gold-400 flex items-center gap-3">
        <RefreshCw className="w-5 h-5 text-gold-400 animate-spin" />
        <div>
          <p className="text-xs font-bold text-white flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-gold-400" /> Auto-Updating ERP...
          </p>
          <p className="text-[10px] text-brand-100">{updateMessage || 'Applying the latest updates across your device.'}</p>
        </div>
      </div>
    </div>
  );
}
