import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { toCountries, toStation } from '../src/infrastructure/radio-browser/radio-browser.mapper.js';

describe('toStation', () => {
  test('convierte el DTO de Radio Browser al modelo de dominio', () => {
    const station = toStation({
      stationuuid: ' abc ',
      name: ' Radio Prueba ',
      url: 'https://viejo.example.com',
      url_resolved: 'https://stream.example.com/live',
      favicon: 'https://img.example.com/logo.png',
      homepage: 'http://sitio.example.com',
      countrycode: 'co',
      state: 'Bolívar',
      tags: 'salsa, tropical,,vallenato',
    });

    assert.deepEqual(station, {
      id: 'abc',
      name: 'Radio Prueba',
      streamUrl: 'https://stream.example.com/live',
      isHls: false,
      faviconUrl: 'https://img.example.com/logo.png',
      homepageUrl: null,
      countryCode: 'CO',
      region: 'Bolívar',
      tags: ['salsa', 'tropical', 'vallenato'],
    });
  });

  test('detecta HLS por bandera o por extensión .m3u8', () => {
    assert.equal(toStation({ stationuuid: '1', name: 'A', url: 'https://x/a', hls: 1 })?.isHls, true);
    assert.equal(toStation({ stationuuid: '2', name: 'B', url: 'https://x/live.m3u8?t=1' })?.isHls, true);
  });

  test('rechaza datos incompletos y limpia valores inválidos', () => {
    assert.equal(toStation({ name: 'Sin id', url: 'https://x' }), null);
    assert.equal(toStation({ stationuuid: '1', name: '   ', url: 'https://x' }), null);
    assert.equal(toStation({ stationuuid: '1', name: 'Sin url' }), null);

    const station = toStation({ stationuuid: '1', name: 'A', url: 'https://x', favicon: 'no-es-url', countrycode: 'COL' });
    assert.equal(station?.faviconUrl, null);
    assert.equal(station?.countryCode, null);
  });
});

describe('toCountries', () => {
  test('suma emisoras por país y descarta países con pocas', () => {
    const countries = toCountries(
      [
        { iso_3166_1: 'CO', stationcount: 10 },
        { iso_3166_1: 'co', stationcount: 10 },
        { iso_3166_1: 'XX', stationcount: 3 },
        { iso_3166_1: '', stationcount: 99 },
      ],
      15,
    );
    assert.deepEqual(countries, [{ code: 'CO', stationCount: 20 }]);
  });
});
