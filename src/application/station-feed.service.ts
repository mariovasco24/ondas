import { DEFAULT_FILTER, type Mood, type StationFilter } from '../domain/filter.js';
import { hasSecureStream, type Station } from '../domain/station.js';
import type { StationQuery, StationRepository } from './ports.js';

export interface StationFeedOptions {
  readonly pageSize: number;
  readonly moods: readonly Mood[];
  readonly userCountryCode: string;
  /** Emisoras retiradas a petición de sus dueños. */
  readonly blockedStationIds?: ReadonlySet<string>;
  readonly shuffle?: <T>(items: T[]) => T[];
}

/** Si una página trae solo duplicados o streams no válidos, se piden hasta N páginas más. */
const MAX_PAGES_PER_REQUEST = 3;

/**
 * Convierte el filtro del usuario en consultas paginadas al repositorio y entrega
 * emisoras nuevas: sin duplicados, solo HTTPS y sin emisoras bloqueadas.
 */
export class StationFeedService {
  private filter: StationFilter = DEFAULT_FILTER;
  private page = 0;
  private exhausted = false;
  private readonly seen = new Set<string>();

  constructor(
    private readonly repository: StationRepository,
    private readonly options: StationFeedOptions,
  ) {}

  get currentFilter(): StationFilter {
    return this.filter;
  }

  get hasMore(): boolean {
    return !this.exhausted;
  }

  reset(filter: StationFilter): void {
    this.filter = filter;
    this.page = 0;
    this.exhausted = false;
    this.seen.clear();
  }

  /** Usa una lista ya conocida (p. ej. resultados de búsqueda) en lugar de paginar. */
  useFixedList(filter: StationFilter, stations: readonly Station[]): Station[] {
    this.reset(filter);
    this.exhausted = true;
    return this.acceptNew(stations);
  }

  async nextPage(): Promise<Station[]> {
    for (let attempt = 0; attempt < MAX_PAGES_PER_REQUEST && !this.exhausted; attempt++) {
      const raw = await this.fetchCurrentPage();
      this.page += 1;
      if (raw.length === 0) {
        this.exhausted = true;
        break;
      }
      const fresh = this.acceptNew(raw);
      if (fresh.length > 0) return fresh;
    }
    return [];
  }

  private acceptNew(stations: readonly Station[]): Station[] {
    const blocked = this.options.blockedStationIds;
    const fresh: Station[] = [];
    for (const station of stations) {
      if (!hasSecureStream(station) || blocked?.has(station.id) || this.seen.has(station.id)) continue;
      this.seen.add(station.id);
      fresh.push(station);
    }
    return fresh;
  }

  private baseQuery(limit: number): StationQuery {
    const { mood, genre, countryCode, searchText } = this.filter;
    const country = countryCode ?? (mood === 'near' ? this.options.userCountryCode : null);
    return {
      order: mood === 'random' ? 'random' : 'popular',
      limit,
      offset: this.page * limit,
      ...(country ? { countryCode: country } : {}),
      ...(genre ? { tag: genre } : {}),
      ...(searchText ? { name: searchText } : {}),
    };
  }

  /** Un mood con varias etiquetas se resuelve con una consulta por etiqueta, mezcladas. */
  private async fetchCurrentPage(): Promise<Station[]> {
    const tags = this.options.moods.find((m) => m.id === this.filter.mood)?.tags;
    const usesMoodTags = !!tags?.length && !this.filter.genre && !this.filter.searchText;
    if (!tags || !usesMoodTags) {
      return this.repository.search(this.baseQuery(this.options.pageSize));
    }

    const perTag = Math.ceil(this.options.pageSize / tags.length) + 4;
    const base = this.baseQuery(perTag);
    const results = await Promise.allSettled(tags.map((tag) => this.repository.search({ ...base, tag })));
    const succeeded = results.filter(
      (r): r is PromiseFulfilledResult<Station[]> => r.status === 'fulfilled',
    );
    if (succeeded.length === 0) {
      const firstFailure = results.find((r): r is PromiseRejectedResult => r.status === 'rejected');
      throw firstFailure?.reason ?? new Error('No se pudieron cargar emisoras');
    }
    const merged = succeeded.flatMap((r) => r.value);
    return (this.options.shuffle ?? shuffleInPlace)(merged);
  }
}

/** Fisher–Yates. */
export function shuffleInPlace<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = items[i] as T;
    items[i] = items[j] as T;
    items[j] = tmp;
  }
  return items;
}
