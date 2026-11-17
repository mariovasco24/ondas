/**
 * Puertos (interfaces) que la capa de aplicación necesita del mundo exterior.
 * La infraestructura los implementa; la aplicación nunca depende de clases concretas
 * (principio de inversión de dependencias).
 */
import type { Station } from '../domain/station.js';

// ---------- Datos de emisoras ----------

export type SortOrder = 'popular' | 'random';

export interface StationQuery {
  readonly order: SortOrder;
  readonly limit: number;
  readonly offset: number;
  readonly countryCode?: string;
  readonly tag?: string;
  readonly name?: string;
}

export interface StationRepository {
  search(query: StationQuery): Promise<Station[]>;
}

/** Avisa al directorio que una emisora se reprodujo (estadísticas de popularidad). */
export interface PlayTracker {
  registerPlay(stationId: string): void;
}

export interface Country {
  readonly code: string;
  readonly stationCount: number;
}

export interface CountryRepository {
  list(): Promise<Country[]>;
}

// ---------- Sistema ----------

export interface KeyValueStore {
  get<T>(key: string, fallback: T): T;
  set<T>(key: string, value: T): void;
}

export interface Clock {
  now(): number;
}

// ---------- Audio ----------

export type PlayerState = 'idle' | 'loading' | 'playing' | 'paused' | 'error';
export type PlayerListener = (state: PlayerState, station: Station | null) => void;
export type Unsubscribe = () => void;

export interface AudioPlayer {
  readonly state: PlayerState;
  readonly current: Station | null;
  play(station: Station): void;
  pause(): void;
  resume(): void;
  setVolume(volume: number): void;
  subscribe(listener: PlayerListener): Unsubscribe;
}

export interface NavigationHandlers {
  next(): void;
  previous(): void;
}

/** Controles del sistema operativo (pantalla de bloqueo, auriculares, etc.). */
export interface NowPlayingIntegration {
  show(station: Station, handlers: NavigationHandlers): void;
}

// ---------- Anuncios ----------

export type FullScreenAdFormat = 'interstitial' | 'rewarded';

export interface FullScreenAdResult {
  readonly completed: boolean;
}

/** Hoy: marcador de posición. En la app nativa: AdMob. La aplicación no nota la diferencia. */
export interface FullScreenAdProvider {
  show(format: FullScreenAdFormat): Promise<FullScreenAdResult>;
}
