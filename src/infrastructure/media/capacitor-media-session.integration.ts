import { MediaSession, type MediaSessionPlaybackState } from '@capgo/capacitor-media-session';
import type { NowPlayingIntegration, PlayerState, RemoteControlHandlers } from '../../application/ports.js';
import type { Station } from '../../domain/station.js';

/**
 * Versión Android: el WebView no soporta la Media Session API, así que el plugin la
 * implementa en nativo. Mientras suena, mantiene un servicio en primer plano para que
 * Android no detenga la radio con la pantalla apagada, y muestra la notificación con controles.
 */
export class CapacitorMediaSessionIntegration implements NowPlayingIntegration {
  private handlersReady = false;
  private handlers: RemoteControlHandlers | null = null;

  constructor(
    private readonly albumName: string,
    private readonly describe: (station: Station) => string,
  ) {}

  show(station: Station, handlers: RemoteControlHandlers): void {
    this.handlers = handlers;
    void this.registerHandlersOnce();
    void MediaSession.setMetadata({
      title: station.name,
      artist: this.describe(station),
      album: this.albumName,
      artwork: station.faviconUrl ? [{ src: station.faviconUrl, sizes: '512x512', type: 'image/png' }] : [],
    }).catch(() => undefined);
  }

  setPlaybackState(state: PlayerState): void {
    void MediaSession.setPlaybackState({ playbackState: toSessionState(state) }).catch(() => undefined);
  }

  private async registerHandlersOnce(): Promise<void> {
    if (this.handlersReady) return;
    this.handlersReady = true;
    const call = (action: keyof RemoteControlHandlers) => () => this.handlers?.[action]();
    try {
      await MediaSession.setActionHandler({ action: 'play' }, call('play'));
      await MediaSession.setActionHandler({ action: 'pause' }, call('pause'));
      await MediaSession.setActionHandler({ action: 'stop' }, call('pause'));
      await MediaSession.setActionHandler({ action: 'nexttrack' }, call('next'));
      await MediaSession.setActionHandler({ action: 'previoustrack' }, call('previous'));
    } catch {
      this.handlersReady = false;
    }
  }
}

function toSessionState(state: PlayerState): MediaSessionPlaybackState {
  if (state === 'playing' || state === 'loading') return 'playing';
  if (state === 'paused') return 'paused';
  return 'none';
}
