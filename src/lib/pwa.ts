export function registerServiceWorker(): void {
  if (typeof window === 'undefined') return
  if (!('serviceWorker' in navigator)) return
  if (import.meta.env.DEV) return
  if (typeof document !== 'undefined' && document.location.protocol === 'capacitor:') return

  const swUrl = `${import.meta.env.BASE_URL}service-worker.js`
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register(swUrl, { scope: import.meta.env.BASE_URL }).catch(() => {
      /* ignore: private mode / unsupported */
    })
  })
}

/** Ask the browser not to evict local data (helps iOS PWA). */
export function requestPersistentStorage(): void {
  if (typeof navigator === 'undefined' || !navigator.storage?.persist) return
  void navigator.storage.persist().catch(() => {
    /* ignore */
  })
}
