import type { NowPlayingIntegration, PlayerState, RemoteControlHandlers } from '../../application/ports.js';
import type { Station } from '../../domain/station.js';

/** Versión web: Media Session API del navegador (pantalla de bloqueo, auriculares). */
export class MediaSessionIntegration implements NowPlayingIntegration {
  constructor(
    private readonly albumName: string,
    private readonly describe: (station: Station) => string,
  ) {}

  show(station: Station, handlers: RemoteControlHandlers): void {
    if (!('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: station.name,
        artist: this.describe(station),
        album: this.albumName,
        artwork: station.faviconUrl ? [{ src: station.faviconUrl, sizes: '512x512' }] : [],
      });
      navigator.mediaSession.setActionHandler('play', () => handlers.play());
      navigator.mediaSession.setActionHandler('pause', () => handlers.pause());
      navigator.mediaSession.setActionHandler('nexttrack', () => handlers.next());
      navigator.mediaSession.setActionHandler('previoustrack', () => handlers.previous());
    } catch {
      // Navegador sin soporte completo de Media Session: se ignora.
    }
  }

  setPlaybackState(state: PlayerState): void {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.playbackState =
      state === 'playing' || state === 'loading' ? 'playing' : state === 'paused' ? 'paused' : 'none';
  }
}
