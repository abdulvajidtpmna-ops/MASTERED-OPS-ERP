import React, { useState, useEffect } from 'react';
import {
  Download,
  Smartphone,
  Monitor,
  Share,
  PlusSquare,
  CheckCircle2,
  X,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Button } from './Button';

export function InstallAppModal({ isOpen, onClose }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [activeDevice, setActiveDevice] = useState('android'); // 'android' | 'ios' | 'desktop'

  useEffect(() => {
    // Check if already running in standalone mode (PWA / Installed App)
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setIsInstalled(true);
    }

    // Detect device type for default tab
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
      setActiveDevice('ios');
    } else if (/android/i.test(userAgent)) {
      setActiveDevice('android');
    } else {
      setActiveDevice('desktop');
    }

    // Listen for the beforeinstallprompt event (Android / Chromium WebAPK prompt)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      window.deferredInstallPrompt = e;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Also check if already saved
    if (window.deferredInstallPrompt) {
      setDeferredPrompt(window.deferredInstallPrompt);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    const promptEvent = deferredPrompt || window.deferredInstallPrompt;
    if (promptEvent) {
      promptEvent.prompt();
      const choiceResult = await promptEvent.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        window.deferredInstallPrompt = null;
        if (onClose) onClose();
      }
    } else {
      // If prompt not ready, switch to step-by-step guidance
      if (activeDevice === 'android') {
        alert('To install the Mastered Ops ERP APK on Android:\n1. Open Chrome menu (⋮ 3 dots top-right)\n2. Tap "Install App" or "Add to Home screen"');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-brand-500/20 overflow-hidden text-brand-900">
        
        {/* Header with Brand Logo */}
        <div className="bg-gradient-to-r from-brand-900 via-brand-700 to-brand-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-brand-800/80 border border-gold-400/40 p-2 flex items-center justify-center shadow-lg">
              <img
                src="/logo-white-transparent.png"
                alt="MASTERED OPS ERP"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <span className="text-[10px] font-bold text-gold-400 uppercase tracking-widest block">
                Official Multi-Platform App
              </span>
              <h3 className="text-xl font-poppins font-bold text-white leading-tight">
                Install MASTERED OPS ERP
              </h3>
              <p className="text-xs text-brand-100 mt-0.5">
                Fast, offline-capable mobile APK & desktop application
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Device Tabs */}
          <div className="flex rounded-xl bg-gray-100 p-1">
            <button
              onClick={() => setActiveDevice('android')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                activeDevice === 'android'
                  ? 'bg-brand-900 text-white shadow-sm'
                  : 'text-gray-600 hover:text-brand-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              Android (APK)
            </button>
            <button
              onClick={() => setActiveDevice('ios')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                activeDevice === 'ios'
                  ? 'bg-brand-900 text-white shadow-sm'
                  : 'text-gray-600 hover:text-brand-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              iOS / iPhone
            </button>
            <button
              onClick={() => setActiveDevice('desktop')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                activeDevice === 'desktop'
                  ? 'bg-brand-900 text-white shadow-sm'
                  : 'text-gray-600 hover:text-brand-900'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              Windows / Mac
            </button>
          </div>

          {/* Android Tab */}
          {activeDevice === 'android' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Direct WebAPK Installation Supported</span>
                </div>
                <p className="text-xs text-emerald-700 mt-1">
                  Installs as a native Android application package on your homescreen with instant notifications and fast loading.
                </p>
              </div>

              {(deferredPrompt || window.deferredInstallPrompt) ? (
                <Button
                  variant="primary"
                  size="lg"
                  icon={Download}
                  onClick={handleInstallClick}
                  className="w-full shadow-gold-glow"
                >
                  Install APK Now (1-Click)
                </Button>
              ) : (
                <div className="space-y-2.5 text-xs text-gray-700">
                  <p className="font-semibold text-brand-900">How to install on Android Chrome / Brave / Edge:</p>
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <span className="w-5 h-5 rounded-full bg-brand-900 text-gold-400 font-bold flex items-center justify-center text-[11px] shrink-0">1</span>
                    <p>Tap the <strong>three dots menu (⋮)</strong> at the top right of your browser.</p>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <span className="w-5 h-5 rounded-full bg-brand-900 text-gold-400 font-bold flex items-center justify-center text-[11px] shrink-0">2</span>
                    <p>Select <strong>"Install App"</strong> or <strong>"Add to Home screen"</strong>.</p>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <span className="w-5 h-5 rounded-full bg-brand-900 text-gold-400 font-bold flex items-center justify-center text-[11px] shrink-0">3</span>
                    <p>Tap <strong>Install</strong>. The APK will be added to your app drawer & homescreen.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* iOS Tab */}
          {activeDevice === 'ios' && (
            <div className="space-y-3 text-xs text-gray-700">
              <p className="font-semibold text-brand-900">Install on iPhone / iPad (Safari):</p>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <Share className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <p>1. Tap the <strong>Share button</strong> (square with arrow) at the bottom of Safari.</p>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <PlusSquare className="w-5 h-5 text-brand-900 shrink-0 mt-0.5" />
                <p>2. Scroll down and select <strong>"Add to Home Screen"</strong>.</p>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <p>3. Tap <strong>Add</strong> in the top-right. Mastered Ops ERP will run as a full-screen app.</p>
              </div>
            </div>
          )}

          {/* Desktop Tab */}
          {activeDevice === 'desktop' && (
            <div className="space-y-4">
              <p className="text-xs text-gray-600">
                Install as a standalone desktop program on Windows, Mac, or ChromeOS for quick taskbar access.
              </p>
              {(deferredPrompt || window.deferredInstallPrompt) ? (
                <Button
                  variant="primary"
                  size="lg"
                  icon={Download}
                  onClick={handleInstallClick}
                  className="w-full shadow-gold-glow"
                >
                  Install Desktop App
                </Button>
              ) : (
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-2 text-gray-700">
                  <p>In Chrome or Edge, click the <strong>Install icon (🖥️ or ➕)</strong> in the address bar right next to the bookmark star to install.</p>
                </div>
              )}
            </div>
          )}

          {/* App Info Highlights */}
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500 font-medium">
            <span className="flex items-center gap-1 text-brand-900 font-bold">
              <Sparkles className="w-3.5 h-3.5 text-gold-500" /> Version 2.0 (Production)
            </span>
            <span>All Devices & OSs Compatible</span>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 border-t border-gray-100 flex justify-end">
          <Button variant="secondary" size="md" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
