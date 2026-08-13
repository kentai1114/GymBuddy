import { Capacitor, WebPlugin, registerPlugin } from '@capacitor/core'

export interface YoutubeEmbedPlugin {
  open(options: { videoId: string }): Promise<void>
}

class YoutubeEmbedWeb extends WebPlugin implements YoutubeEmbedPlugin {
  async open({ videoId }: { videoId: string }): Promise<void> {
    window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank', 'noopener,noreferrer')
  }
}

const YoutubeEmbed = registerPlugin<YoutubeEmbedPlugin>('YoutubeEmbed', {
  web: () => new YoutubeEmbedWeb(),
})

export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform()
}

export async function openExerciseVideo(videoId: string): Promise<void> {
  if (!videoId) return
  if (isNativeApp()) {
    await YoutubeEmbed.open({ videoId })
    return
  }
  window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank', 'noopener,noreferrer')
}

export function youtubeEmbedUrl(videoId: string, autoplay = false): string {
  const origin =
    typeof window !== 'undefined' && window.location.protocol.startsWith('http')
      ? window.location.origin
      : 'https://www.youtube.com'
  const params = new URLSearchParams({
    rel: '0',
    modestbranding: '1',
    playsinline: '1',
    enablejsapi: '1',
    origin,
    autoplay: autoplay ? '1' : '0',
  })
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`
}
