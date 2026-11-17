import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  RadioBrowserClient,
  RadioBrowserUnavailableError,
} from '../src/infrastructure/radio-browser/radio-browser.client.js';

function fakeFetch(handler: (url: string) => Response | Promise<Response>, calls: string[]): typeof fetch {
  return async (input) => {
    const url = String(input);
    calls.push(url);
    return handler(url);
  };
}

describe('RadioBrowserClient', () => {
  test('arma la URL omitiendo parámetros vacíos', async () => {
    const calls: string[] = [];
    const client = new RadioBrowserClient(['https://a'], 1000, fakeFetch(() => Response.json([]), calls));

    await client.getJson('/json/stations/search', { limit: 5, tag: undefined, hidebroken: true });

    assert.deepEqual(calls, ['https://a/json/stations/search?limit=5&hidebroken=true']);
  });

  test('si un servidor falla, prueba el siguiente y lo recuerda', async () => {
    const calls: string[] = [];
    const client = new RadioBrowserClient(
      ['https://a', 'https://b'],
      1000,
      fakeFetch((url) => (url.startsWith('https://a') ? new Response('', { status: 503 }) : Response.json({ ok: true })), calls),
    );

    assert.deepEqual(await client.getJson('/uno'), { ok: true });
    await client.getJson('/dos');

    assert.deepEqual(calls, ['https://a/uno', 'https://b/uno', 'https://b/dos']);
  });

  test('si todos fallan, lanza RadioBrowserUnavailableError', async () => {
    const client = new RadioBrowserClient(['https://a'], 1000, fakeFetch(() => {
      throw new TypeError('sin red');
    }, []));

    await assert.rejects(client.getJson('/x'), RadioBrowserUnavailableError);
  });
});
