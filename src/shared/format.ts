/** Utilidades puras de presentación (sin DOM), fáciles de probar. */

const REGIONAL_INDICATOR_OFFSET = 127397;

export function flagEmoji(countryCode: string | null): string {
  if (!countryCode || !/^[A-Z]{2}$/.test(countryCode)) return '🌐';
  return String.fromCodePoint(...[...countryCode].map((c) => REGIONAL_INDICATOR_OFFSET + c.charCodeAt(0)));
}

/** Color estable por emisora: el mismo nombre siempre da el mismo tono. */
export function hueFromText(text: string): number {
  let hue = 0;
  for (const char of text) hue = (hue * 31 + char.charCodeAt(0)) % 360;
  return hue;
}

export function initials(name: string): string {
  const words = name.replace(/[^\p{L}\p{N} ]/gu, ' ').trim().split(/\s+/).filter(Boolean);
  const letters = words.slice(0, 2).map((word) => [...word][0] ?? '').join('');
  return letters.toUpperCase() || '♪';
}

/** Minúsculas y sin tildes, para buscar "Peru" y encontrar "Perú". */
export function normalizeForSearch(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
}

/** "es-CO" → "CO". Si no hay región en el idioma, usa el país por defecto. */
export function countryFromLocale(locale: string | undefined, fallback: string): string {
  const region = locale?.split(/[-_]/)[1]?.toUpperCase();
  return region && /^[A-Z]{2}$/.test(region) ? region : fallback;
}

/** Nombres de países en el idioma de la app usando Intl (sin tablas propias). */
export class CountryNames {
  private readonly names: Intl.DisplayNames | null;

  constructor(locale: string) {
    let names: Intl.DisplayNames | null = null;
    try {
      names = new Intl.DisplayNames([locale], { type: 'region' });
    } catch {
      names = null;
    }
    this.names = names;
  }

  of(countryCode: string | null): string {
    if (!countryCode) return '';
    try {
      return this.names?.of(countryCode) ?? countryCode;
    } catch {
      return countryCode;
    }
  }
}
