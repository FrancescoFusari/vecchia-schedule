
// This module will be provided by vite-plugin-pwa once it's properly installed
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    // Use a more robust way to check if the module is available
    try {
      // We need to use a dynamic import with a specific pattern for Vite to recognize it
      import('virtual:pwa-register')
        .then(({ registerSW }) => {
          const updateSW = registerSW({
            onNeedRefresh() {
              // This function will be called when a new service worker is available
              if (confirm('Nuova versione disponibile. Aggiornare?')) {
                updateSW(true);
              }
            },
            onOfflineReady() {
              console.log('App pronta per l\'uso offline');
            },
          });
        })
        .catch(error => {
          console.error('Failed to register service worker:', error);
        });
    } catch (error) {
      console.error('Error loading PWA module:', error);
    }
  }
}

// Fallback function in case the virtual module is not available
export function isAppInstalled() {
  return window.matchMedia('(display-mode: standalone)').matches;
}
