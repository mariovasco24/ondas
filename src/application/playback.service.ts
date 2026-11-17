import type { Station } from '../domain/station.js';
import type {
  AudioPlayer,
  NavigationHandlers,
  NowPlayingIntegration,
  PlayerListener,
  PlayerState,
  PlayTracker,
  Unsubscribe,
} from './ports.js';

/** Casos de uso de reproducción: reproducir, alternar, bajar volumen durante anuncios. */
export class PlaybackService {
  private navigation: NavigationHandlers = { next: () => {}, previous: () => {} };

  constructor(
    private readonly player: AudioPlayer,
    private readonly tracker: PlayTracker,
    private readonly nowPlaying: NowPlayingIntegration,
  ) {}

  get current(): Station | null {
    return this.player.current;
  }

  get state(): PlayerState {
    return this.player.state;
  }

  get isActive(): boolean {
    return this.player.state === 'playing' || this.player.state === 'loading';
  }

  /** Qué hacer con "siguiente/anterior" desde la pantalla de bloqueo o los auriculares. */
  setNavigation(handlers: NavigationHandlers): void {
    this.navigation = handlers;
  }

  play(station: Station): void {
    const isSameStation = this.player.current?.id === station.id && this.player.state !== 'error';
    if (isSameStation) {
      if (this.player.state === 'paused') this.player.resume();
      return;
    }
    this.player.play(station);
    this.tracker.registerPlay(station.id);
    this.nowPlaying.show(station, {
      next: () => this.navigation.next(),
      previous: () => this.navigation.previous(),
    });
  }

  toggle(station: Station): void {
    if (this.player.current?.id === station.id && this.isActive) this.player.pause();
    else this.play(station);
  }

  /** La radio nunca se corta por un anuncio: solo baja el volumen. */
  setDucked(ducked: boolean, duckVolume: number): void {
    this.player.setVolume(ducked ? duckVolume : 1);
  }

  subscribe(listener: PlayerListener): Unsubscribe {
    return this.player.subscribe(listener);
  }
}
