import type {
  Country,
  CountryRepository,
  PlayTracker,
  StationQuery,
  StationRepository,
} from '../../application/ports.js';
import type { Station } from '../../domain/station.js';
import type { RadioBrowserClient } from './radio-browser.client.js';
import {
  toCountries,
  toStation,
  type RadioBrowserCountryDto,
  type RadioBrowserStationDto,
} from './radio-browser.mapper.js';

export class RadioBrowserStationRepository implements StationRepository, PlayTracker {
  constructor(private readonly client: RadioBrowserClient) {}

  async search(query: StationQuery): Promise<Station[]> {
    const isRandom = query.order === 'random';
    const dtos = await this.client.getJson<unknown>('/json/stations/search', {
      limit: query.limit,
      offset: query.offset,
      hidebroken: true,
      is_https: true,
      order: isRandom ? 'random' : 'clickcount',
      reverse: isRandom ? undefined : true,
      countrycode: query.countryCode,
      tag: query.tag,
      name: query.name,
    });
    if (!Array.isArray(dtos)) return [];
    return (dtos as RadioBrowserStationDto[])
      .map((dto) => toStation(dto))
      .filter((s): s is Station => s !== null);
  }

  /** Radio Browser pide registrar cada reproducción para mantener su ranking. */
  registerPlay(stationId: string): void {
    this.client.ping(`/json/url/${encodeURIComponent(stationId)}`);
  }
}

export class RadioBrowserCountryRepository implements CountryRepository {
  private cache: Promise<Country[]> | null = null;

  constructor(
    private readonly client: RadioBrowserClient,
    private readonly minStationsPerCountry: number,
  ) {}

  /** La lista de países casi no cambia: se pide una vez por sesión. */
  list(): Promise<Country[]> {
    this.cache ??= this.load().catch((error: unknown) => {
      this.cache = null;
      throw error;
    });
    return this.cache;
  }

  private async load(): Promise<Country[]> {
    const dtos = await this.client.getJson<unknown>('/json/countries');
    return Array.isArray(dtos)
      ? toCountries(dtos as RadioBrowserCountryDto[], this.minStationsPerCountry)
      : [];
  }
}
