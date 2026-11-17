import { isStation, type Station } from '../domain/station.js';
import type { KeyValueStore, Unsubscribe } from './ports.js';

const FAVORITES_KEY = 'favorites';

/** Favoritos guardados solo en el dispositivo del usuario. */
export class FavoritesService {
  private items: Station[];
  private readonly listeners = new Set<() => void>();

  constructor(private readonly store: KeyValueStore) {
    const stored = store.get<unknown>(FAVORITES_KEY, []);
    this.items = Array.isArray(stored) ? stored.filter(isStation) : [];
  }

  list(): readonly Station[] {
    return this.items;
  }

  has(stationId: string): boolean {
    return this.items.some((s) => s.id === stationId);
  }

  find(stationId: string): Station | undefined {
    return this.items.find((s) => s.id === stationId);
  }

  /** Agrega o quita la emisora. Devuelve true si quedó como favorita. */
  toggle(station: Station): boolean {
    const wasFavorite = this.has(station.id);
    this.items = wasFavorite
      ? this.items.filter((s) => s.id !== station.id)
      : [station, ...this.items];
    this.store.set(FAVORITES_KEY, this.items);
    this.listeners.forEach((listener) => listener());
    return !wasFavorite;
  }

  subscribe(listener: () => void): Unsubscribe {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}
