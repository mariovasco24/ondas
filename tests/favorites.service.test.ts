import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { FavoritesService } from '../src/application/favorites.service.js';
import { MemoryStore } from '../src/infrastructure/storage/memory.store.js';
import { makeStation } from './helpers.js';

describe('FavoritesService', () => {
  test('agrega al inicio, quita y avisa a los suscriptores', () => {
    const service = new FavoritesService(new MemoryStore());
    let notifications = 0;
    service.subscribe(() => notifications++);

    assert.equal(service.toggle(makeStation({ id: 'a' })), true);
    assert.equal(service.toggle(makeStation({ id: 'b' })), true);
    assert.deepEqual(service.list().map((s) => s.id), ['b', 'a']);

    assert.equal(service.toggle(makeStation({ id: 'a' })), false);
    assert.deepEqual(service.list().map((s) => s.id), ['b']);
    assert.equal(notifications, 3);
  });

  test('persiste en el almacenamiento y descarta datos inválidos al cargar', () => {
    const store = new MemoryStore();
    new FavoritesService(store).toggle(makeStation({ id: 'guardada' }));
    assert.deepEqual(new FavoritesService(store).list().map((s) => s.id), ['guardada']);

    store.set('favorites', [{ id: 'rota' }, 42, null, makeStation({ id: 'buena' })]);
    assert.deepEqual(new FavoritesService(store).list().map((s) => s.id), ['buena']);

    store.set('favorites', 'no es una lista');
    assert.deepEqual(new FavoritesService(store).list(), []);
  });
});
