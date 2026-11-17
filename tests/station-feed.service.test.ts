import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { StationFeedService } from '../src/application/station-feed.service.js';
import { DEFAULT_FILTER, type Mood } from '../src/domain/filter.js';
import { FakeStationRepository, makeStation } from './helpers.js';

const MOODS: readonly Mood[] = [
  { id: 'top', label: 'Populares' },
  { id: 'near', label: 'Cerca' },
  { id: 'party', label: 'Fiesta', tags: ['dance', 'reggaeton'] },
  { id: 'random', label: 'Sorpréndeme' },
];
const identity = <T>(items: T[]): T[] => items;

function createService(repo: FakeStationRepository, blocked: string[] = []): StationFeedService {
  return new StationFeedService(repo, {
    pageSize: 4,
    moods: MOODS,
    userCountryCode: 'CO',
    blockedStationIds: new Set(blocked),
    shuffle: identity,
  });
}

describe('StationFeedService', () => {
  test('descarta duplicados, streams no HTTPS y emisoras bloqueadas', async () => {
    const repo = new FakeStationRepository(() => [
      makeStation({ id: 'a' }),
      makeStation({ id: 'a' }),
      makeStation({ id: 'b', streamUrl: 'http://inseguro.example.com' }),
      makeStation({ id: 'c' }),
      makeStation({ id: 'bloqueada' }),
    ]);
    const service = createService(repo, ['bloqueada']);
    service.reset(DEFAULT_FILTER);

    const page = await service.nextPage();

    assert.deepEqual(page.map((s) => s.id), ['a', 'c']);
  });

  test('pagina con offset y marca el final cuando la API no devuelve nada', async () => {
    const repo = new FakeStationRepository((q) =>
      q.offset === 0 ? [makeStation({ id: '1' }), makeStation({ id: '2' })] : [],
    );
    const service = createService(repo);
    service.reset(DEFAULT_FILTER);

    assert.equal((await service.nextPage()).length, 2);
    assert.deepEqual(await service.nextPage(), []);
    assert.equal(service.hasMore, false);
    assert.deepEqual(repo.queries.map((q) => q.offset), [0, 4]);
  });

  test('si una página trae solo repetidas, pide la siguiente', async () => {
    const repo = new FakeStationRepository((q) =>
      q.offset < 8 ? [makeStation({ id: 'misma' })] : [makeStation({ id: 'nueva' })],
    );
    const service = createService(repo);
    service.reset(DEFAULT_FILTER);

    await service.nextPage();
    const second = await service.nextPage();

    assert.deepEqual(second.map((s) => s.id), ['nueva']);
  });

  test('"Cerca de mí" usa el país del usuario; un país elegido tiene prioridad', async () => {
    const repo = new FakeStationRepository(() => [makeStation({ id: 'x' })]);
    const service = createService(repo);

    service.reset({ ...DEFAULT_FILTER, mood: 'near' });
    await service.nextPage();
    service.reset({ ...DEFAULT_FILTER, mood: 'near', countryCode: 'MX' });
    await service.nextPage();

    assert.equal(repo.queries[0]?.countryCode, 'CO');
    assert.equal(repo.queries[1]?.countryCode, 'MX');
  });

  test('un mood con varias etiquetas hace una consulta por etiqueta y mezcla', async () => {
    const repo = new FakeStationRepository((q) => [makeStation({ id: `${q.tag}-1` })]);
    const service = createService(repo);
    service.reset({ ...DEFAULT_FILTER, mood: 'party' });

    const page = await service.nextPage();

    assert.deepEqual(repo.queries.map((q) => q.tag), ['dance', 'reggaeton']);
    assert.deepEqual(page.map((s) => s.id), ['dance-1', 'reggaeton-1']);
  });

  test('si falla una etiqueta, usa las demás; si fallan todas, lanza el error', async () => {
    const partial = new FakeStationRepository((q) => {
      if (q.tag === 'dance') throw new Error('caída');
      return [makeStation({ id: 'ok' })];
    });
    const service = createService(partial);
    service.reset({ ...DEFAULT_FILTER, mood: 'party' });
    assert.deepEqual((await service.nextPage()).map((s) => s.id), ['ok']);

    const broken = new FakeStationRepository(() => {
      throw new Error('sin red');
    });
    const failing = createService(broken);
    failing.reset({ ...DEFAULT_FILTER, mood: 'party' });
    await assert.rejects(failing.nextPage(), /sin red/);
  });

  test('un género elegido reemplaza las etiquetas del mood', async () => {
    const repo = new FakeStationRepository(() => []);
    const service = createService(repo);
    service.reset({ ...DEFAULT_FILTER, mood: 'party', genre: 'salsa' });

    await service.nextPage();

    assert.deepEqual(repo.queries.map((q) => q.tag), ['salsa']);
  });

  test('"Sorpréndeme" pide orden aleatorio', async () => {
    const repo = new FakeStationRepository(() => []);
    const service = createService(repo);
    service.reset({ ...DEFAULT_FILTER, mood: 'random' });

    await service.nextPage();

    assert.equal(repo.queries[0]?.order, 'random');
  });

  test('useFixedList filtra la lista y no pagina más', async () => {
    const repo = new FakeStationRepository(() => [makeStation({ id: 'no-debe-pedirse' })]);
    const service = createService(repo);

    const list = service.useFixedList(DEFAULT_FILTER, [
      makeStation({ id: 'a' }),
      makeStation({ id: 'b', streamUrl: 'http://x' }),
    ]);

    assert.deepEqual(list.map((s) => s.id), ['a']);
    assert.equal(service.hasMore, false);
    assert.deepEqual(await service.nextPage(), []);
    assert.equal(repo.queries.length, 0);
  });
});
