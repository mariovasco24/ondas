/**
 * Emisora de radio tal como la entiende la app.
 * Es independiente de la API de origen: cualquier proveedor se adapta a esta forma.
 */
export interface Station {
  readonly id: string;
  readonly name: string;
  readonly streamUrl: string;
  readonly isHls: boolean;
  readonly faviconUrl: string | null;
  readonly homepageUrl: string | null;
  readonly countryCode: string | null;
  readonly region: string | null;
  readonly tags: readonly string[];
}

/** Solo se reproducen streams HTTPS: evita contenido mixto en web y en Android. */
export function hasSecureStream(station: Station): boolean {
  return station.streamUrl.startsWith('https://');
}

/** Valida datos que vienen de fuera (p. ej. favoritos guardados en el dispositivo). */
export function isStation(value: unknown): value is Station {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v['id'] === 'string' &&
    typeof v['name'] === 'string' &&
    typeof v['streamUrl'] === 'string' &&
    typeof v['isHls'] === 'boolean' &&
    Array.isArray(v['tags'])
  );
}
