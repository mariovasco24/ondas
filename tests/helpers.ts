import type { Clock, StationQuery, StationRepository } from '../src/application/ports.js';
import type { Station } from '../src/domain/station.js';

export function makeStation(overrides: Partial<Station> & { id: string }): Station {
  return {
    name: `Radio ${overrides.id}`,
    streamUrl: `https://stream.example.com/${overrides.id}`,
    isHls: false,
    faviconUrl: null,
    homepageUrl: null,
    countryCode: 'CO',
    region: null,
    tags: [],
    ...overrides,
  };
}

/** Repositorio falso: responde según una función y guarda las consultas recibidas. */
export class FakeStationRepository implements StationRepository {
  readonly queries: StationQuery[] = [];

  constructor(private readonly respond: (query: StationQuery) => Station[] | Promise<Station[]>) {}

  async search(query: StationQuery): Promise<Station[]> {
    this.queries.push(query);
    return this.respond(query);
  }
}

export class FakeClock implements Clock {
  constructor(public time = 1_000_000) {}

  now(): number {
    return this.time;
  }

  advance(ms: number): void {
    this.time += ms;
  }
}
