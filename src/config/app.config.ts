/**
 * Configuración central. Cambiar comportamiento (anuncios, moods, servidores)
 * se hace aquí, sin tocar la lógica.
 */
import type { AdPolicyConfig } from '../application/ad-policy.js';
import type { Genre, Mood } from '../domain/filter.js';
import type { PlaceholderAdOptions } from '../infrastructure/ads/placeholder-ad.provider.js';

export const APP_INFO = {
  name: 'Onda Radio',
  version: '1.0.0',
  author: 'Mario David Vasco Villareal',
  contactEmail: 'contacto@mariovasco.me',
  repositoryUrl: 'https://github.com/mariovasco24/ondas',
  privacyUrl: 'https://mariovasco24.github.io/ondas/privacidad.html',
  copyrightYear: 2026,
  locale: 'es',
  defaultCountry: 'CO',
} as const;

/** Servidores de Radio Browser. "all" reparte entre espejos; los demás son respaldo. */
export const RADIO_BROWSER_MIRRORS: readonly string[] = [
  'https://all.api.radio-browser.info',
  'https://de1.api.radio-browser.info',
  'https://nl1.api.radio-browser.info',
  'https://at1.api.radio-browser.info',
  'https://de2.api.radio-browser.info',
];

export const PAGE_SIZE = 30;
export const MIN_STATIONS_PER_COUNTRY = 15;

export const MOODS: readonly Mood[] = [
  { id: 'top', label: '🔥 Populares' },
  { id: 'near', label: '📍 Cerca de mí' },
  { id: 'work', label: '💻 Trabajar', tags: ['lofi', 'chillout', 'jazz'] },
  { id: 'party', label: '🎉 Fiesta', tags: ['dance', 'reggaeton', 'electronic'] },
  { id: 'sleep', label: '😴 Dormir', tags: ['ambient', 'classical', 'relax'] },
  { id: 'news', label: '📰 Noticias', tags: ['news', 'talk'] },
  { id: 'random', label: '🎲 Sorpréndeme' },
];

export const GENRES: readonly Genre[] = [
  { tag: 'salsa', label: 'Salsa' },
  { tag: 'vallenato', label: 'Vallenato' },
  { tag: 'cumbia', label: 'Cumbia' },
  { tag: 'reggaeton', label: 'Reggaetón' },
  { tag: 'rock', label: 'Rock' },
  { tag: 'pop', label: 'Pop' },
  { tag: 'jazz', label: 'Jazz' },
  { tag: 'classical', label: 'Clásica' },
  { tag: 'electronic', label: 'Electrónica' },
  { tag: 'hip hop', label: 'Hip hop' },
];

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

export const AD_POLICY: AdPolicyConfig = {
  nativeEvery: 8,
  interstitialMinGapMs: 4 * MINUTE,
  interstitialAfterFilterChanges: 2,
  rewardDurationMs: 2 * HOUR,
  duckVolume: 0.2,
};

export const PLACEHOLDER_ADS: PlaceholderAdOptions = {
  interstitialSeconds: 5,
  rewardedSeconds: 6,
  rewardDescription: 'Míralo completo y escucha 2 horas sin anuncios.',
};

/**
 * Emisoras retiradas a petición de sus dueños (por su "stationuuid" de Radio Browser).
 * Cuando una emisora pida salir de la app, se agrega aquí.
 */
export const BLOCKED_STATION_IDS: readonly string[] = [];
