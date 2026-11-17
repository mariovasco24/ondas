export type MoodId = 'top' | 'near' | 'work' | 'party' | 'sleep' | 'news' | 'random';

/** Un "mood" agrupa varias etiquetas de género bajo una intención del usuario. */
export interface Mood {
  readonly id: MoodId;
  readonly label: string;
  readonly tags?: readonly string[];
}

export interface Genre {
  readonly tag: string;
  readonly label: string;
}

/** Lo que el usuario eligió ver en el feed. Inmutable: cada cambio crea un filtro nuevo. */
export interface StationFilter {
  readonly mood: MoodId;
  readonly genre: string | null;
  readonly countryCode: string | null;
  readonly searchText: string | null;
}

export const DEFAULT_FILTER: StationFilter = {
  mood: 'top',
  genre: null,
  countryCode: null,
  searchText: null,
};
