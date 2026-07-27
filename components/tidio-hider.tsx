'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export function TidioHider() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'tidio-hider-style';
    
    if (isAdmin) {
      style.textContent = `
        #tidio-chat-iframe,
        #tidio-chat,
        .tidio-1lxwf94,
        iframe[title*="Tidio"],
        div[data-testid="tidio-chat"] {
          display: none !important;
          visibility: hidden !important;
        }
      `;
      document.head.appendChild(style);
    }

    return () => {
      const existingStyle = document.getElementById('tidio-hider-style');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, [isAdmin]);

  // Hide the welcome message bubble after 10 seconds
  useEffect(() => {
    if (isAdmin) return; // Don't run on admin pages

    const hideWelcomeMessage = () => {
      const tidioChatApi = (window as any).tidioChatApi;
      if (tidioChatApi && typeof tidioChatApi.popUpHide === 'function') {
        tidioChatApi.popUpHide();
      }
    };

    // Try to hide after 10 seconds
    const timer = setTimeout(() => {
      hideWelcomeMessage();
    }, 10000);

    // Also listen for Tidio ready event in case it loads later
    const onTidioReady = () => {
      setTimeout(hideWelcomeMessage, 10000);
    };

    if ((window as any).tidioChatApi) {
      // Already loaded
    } else {
      document.addEventListener('tidioChat-ready', onTidioReady);
    }

    return () => {
      clearTimeout(timer);
      document.removeEventListener('tidioChat-ready', onTidioReady);
    };
  }, [isAdmin]);

  return null;
}
