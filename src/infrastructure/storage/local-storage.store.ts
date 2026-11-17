import type { KeyValueStore } from '../../application/ports.js';

/** Guarda datos en el navegador con un prefijo. Si el almacenamiento falla, no rompe la app. */
export class LocalStorageStore implements KeyValueStore {
  constructor(
    private readonly prefix: string,
    private readonly storage: Storage | null = getLocalStorage(),
  ) {}

  get<T>(key: string, fallback: T): T {
    try {
      const raw = this.storage?.getItem(this.prefix + key);
      return raw == null ? fallback : (JSON.parse(raw) as T);
    } catch {
      return fallback;
    }
  }

  set<T>(key: string, value: T): void {
    try {
      this.storage?.setItem(this.prefix + key, JSON.stringify(value));
    } catch {
      // Sin espacio o almacenamiento bloqueado: la app sigue funcionando sin persistir.
    }
  }
}

function getLocalStorage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}
