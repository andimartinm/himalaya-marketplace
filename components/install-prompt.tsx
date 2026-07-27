'use client';

import { useState, useEffect } from 'react';
import { X, Download, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [showAndroidPrompt, setShowAndroidPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already dismissed
    const wasDismissed = localStorage.getItem('pwa-prompt-dismissed');
    if (wasDismissed) {
      const dismissedTime = parseInt(wasDismissed);
      // Show again after 7 days
      if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
        setDismissed(true);
        return;
      }
    }

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    // Android/Chrome install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowAndroidPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // iOS detection
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator as any).standalone;
    
    if (isIOS && !isInStandaloneMode) {
      setTimeout(() => setShowIOSPrompt(true), 3000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowAndroidPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
    setDismissed(true);
    setShowAndroidPrompt(false);
    setShowIOSPrompt(false);
  };

  if (dismissed) return null;

  // Android prompt
  if (showAndroidPrompt && deferredPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 bg-gradient-to-r from-green-600 to-green-700 text-white p-4 rounded-2xl shadow-2xl z-50 animate-slide-up">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-black/20">
            <img src="/icons/icon-192x192.png" alt="Pedite" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg">¡Instalá Pedite!</h3>
            <p className="text-sm text-green-100 opacity-90">Accedé más rápido desde tu pantalla de inicio</p>
          </div>
        </div>
        <button
          onClick={handleInstall}
          className="mt-3 w-full bg-white text-green-700 font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-green-50 transition-colors"
        >
          <Download className="w-5 h-5" />
          Instalar App
        </button>
      </div>
    );
  }

  // iOS prompt
  if (showIOSPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 bg-gradient-to-r from-green-600 to-green-700 text-white p-4 rounded-2xl shadow-2xl z-50 animate-slide-up">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-black/20">
            <img src="/icons/icon-192x192.png" alt="Pedite" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg">¡Instalá Pedite!</h3>
            <p className="text-sm text-green-100 opacity-90">Agregá la app a tu pantalla de inicio</p>
          </div>
        </div>
        <div className="mt-3 bg-white/10 rounded-xl p-3">
          <p className="text-sm flex items-center gap-2">
            <span className="bg-white/20 rounded-lg p-1.5"><Share className="w-4 h-4" /></span>
            <span>Tocá <strong>Compartir</strong> y luego <strong>"Agregar a inicio"</strong></span>
          </p>
        </div>
      </div>
    );
  }

  return null;
}
