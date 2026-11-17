import type { AudioPlayer, PlayerListener, PlayerState, Unsubscribe } from '../../application/ports.js';
import type { Station } from '../../domain/station.js';

/** Lo mínimo que usamos de hls.js (se carga desde CDN como variable global). */
interface HlsInstance {
  loadSource(url: string): void;
  attachMedia(media: HTMLMediaElement): void;
  destroy(): void;
  on(event: string, callback: (event: string, data: { fatal?: boolean }) => void): void;
}
interface HlsConstructor {
  new (): HlsInstance;
  isSupported(): boolean;
  readonly Events: { readonly ERROR: string };
}
declare global {
  interface Window {
    Hls?: HlsConstructor;
  }
}

/**
 * Reproductor basado en <audio>. Usa hls.js para streams .m3u8 cuando el navegador
 * no los soporta de forma nativa. Si una emisora no arranca a tiempo, pasa a "error".
 */
export class HtmlAudioPlayer implements AudioPlayer {
  private currentState: PlayerState = 'idle';
  private currentStation: Station | null = null;
  private hls: HlsInstance | null = null;
  private loadTimer: ReturnType<typeof setTimeout> | undefined;
  private readonly listeners = new Set<PlayerListener>();

  constructor(
    private readonly audio: HTMLAudioElement,
    private readonly loadTimeoutMs = 12_000,
  ) {
    audio.addEventListener('playing', () => {
      this.clearLoadTimer();
      this.setState('playing');
    });
    // Solo una pausa externa (pantalla de bloqueo, auriculares) cambia el estado aquí;
    // las pausas internas al cambiar de emisora se ignoran.
    audio.addEventListener('pause', () => {
      if (this.currentState === 'playing') this.setState('paused');
    });
    audio.addEventListener('waiting', () => {
      if (this.currentState === 'playing') this.setState('loading');
    });
    audio.addEventListener('error', () => {
      if (!this.hls && this.currentStation && audio.getAttribute('src')) this.fail();
    });
  }

  get state(): PlayerState {
    return this.currentState;
  }

  get current(): Station | null {
    return this.currentStation;
  }

  play(station: Station): void {
    this.teardown();
    this.currentStation = station;
    this.setState('loading');

    const Hls = window.Hls;
    if (station.isHls && Hls?.isSupported()) {
      const hls = new Hls();
      this.hls = hls;
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) this.fail();
      });
      hls.loadSource(station.streamUrl);
      hls.attachMedia(this.audio);
    } else {
      this.audio.src = station.streamUrl;
    }

    this.startPlayback();
    this.loadTimer = setTimeout(() => {
      if (this.currentState === 'loading') this.fail();
    }, this.loadTimeoutMs);
  }

  pause(): void {
    this.clearLoadTimer();
    this.audio.pause();
    this.setState('paused');
  }

  /** En radio en vivo, reanudar = reconectar, para no escuchar audio atrasado. */
  resume(): void {
    if (this.currentStation) this.play(this.currentStation);
  }

  setVolume(volume: number): void {
    this.audio.volume = Math.min(1, Math.max(0, volume));
  }

  subscribe(listener: PlayerListener): Unsubscribe {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private startPlayback(): void {
    this.audio.play().catch((error: unknown) => {
      // Sin un toque previo del usuario, el navegador bloquea el audio.
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        this.clearLoadTimer();
        this.setState('paused');
      }
    });
  }

  private fail(): void {
    this.teardown();
    this.setState('error');
  }

  private teardown(): void {
    this.clearLoadTimer();
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }
    this.audio.removeAttribute('src');
    this.audio.load();
  }

  private clearLoadTimer(): void {
    clearTimeout(this.loadTimer);
    this.loadTimer = undefined;
  }

  private setState(state: PlayerState): void {
    this.currentState = state;
    this.listeners.forEach((listener) => listener(state, this.currentStation));
  }
}
