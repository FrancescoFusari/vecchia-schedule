
// This module will be provided by vite-plugin-pwa once it's properly installed
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    // We'll use a dynamic import to ensure the module is loaded only after the plugin is properly installed
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
  }
}
