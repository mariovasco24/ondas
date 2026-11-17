import type { KeyValueStore } from '../../application/ports.js';

/** Almacenamiento en memoria: útil para pruebas o cuando no hay localStorage. */
export class MemoryStore implements KeyValueStore {
  private readonly data = new Map<string, unknown>();

  get<T>(key: string, fallback: T): T {
    return this.data.has(key) ? (this.data.get(key) as T) : fallback;
  }

  set<T>(key: string, value: T): void {
    this.data.set(key, value);
  }
}
