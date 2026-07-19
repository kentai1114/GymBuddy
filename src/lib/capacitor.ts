import { Capacitor } from '@capacitor/core'

export async function initNativeShell(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return

  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar')
    await StatusBar.setStyle({ style: Style.Dark })
    await StatusBar.setBackgroundColor({ color: '#0B0F0E' })
  } catch {
    /* web or unsupported */
  }

  try {
    const { Keyboard } = await import('@capacitor/keyboard')
    await Keyboard.setAccessoryBarVisible({ isVisible: false })
  } catch {
    /* optional */
  }
}
