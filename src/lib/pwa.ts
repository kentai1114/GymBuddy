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
