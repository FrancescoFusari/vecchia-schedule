
import { registerSW } from 'virtual:pwa-register';

export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
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
  }
}
