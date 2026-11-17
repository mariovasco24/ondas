import type { NavigationHandlers, NowPlayingIntegration } from '../../application/ports.js';
import type { Station } from '../../domain/station.js';

/** Muestra la emisora en la pantalla de bloqueo y conecta los botones siguiente/anterior. */
export class MediaSessionIntegration implements NowPlayingIntegration {
  constructor(
    private readonly albumName: string,
    private readonly describe: (station: Station) => string,
  ) {}

  show(station: Station, handlers: NavigationHandlers): void {
    if (!('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: station.name,
        artist: this.describe(station),
        album: this.albumName,
        artwork: station.faviconUrl ? [{ src: station.faviconUrl, sizes: '512x512' }] : [],
      });
      navigator.mediaSession.setActionHandler('nexttrack', () => handlers.next());
      navigator.mediaSession.setActionHandler('previoustrack', () => handlers.previous());
    } catch {
      // Navegador sin soporte completo de Media Session: se ignora.
    }
  }
}
