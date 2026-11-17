import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { AdPolicy, type AdPolicyConfig } from '../src/application/ad-policy.js';
import { MemoryStore } from '../src/infrastructure/storage/memory.store.js';
import { FakeClock } from './helpers.js';

const CONFIG: AdPolicyConfig = {
  nativeEvery: 3,
  interstitialMinGapMs: 60_000,
  interstitialAfterFilterChanges: 2,
  rewardDurationMs: 7_200_000,
  duckVolume: 0.2,
};

function setup(): { policy: AdPolicy; clock: FakeClock; store: MemoryStore } {
  const clock = new FakeClock();
  const store = new MemoryStore();
  return { policy: new AdPolicy(CONFIG, clock, store), clock, store };
}

describe('AdPolicy', () => {
  test('inserta un anuncio nativo cada N emisoras', () => {
    const { policy } = setup();
    const decisions = Array.from({ length: 7 }, () => policy.shouldInsertNativeAfterStation());
    assert.deepEqual(decisions, [false, false, true, false, false, true, false]);
  });

  test('resetNativeCounter reinicia la cuenta en un feed nuevo', () => {
    const { policy } = setup();
    policy.shouldInsertNativeAfterStation();
    policy.shouldInsertNativeAfterStation();
    policy.resetNativeCounter();
    assert.equal(policy.shouldInsertNativeAfterStation(), false);
  });

  test('el intersticial espera al 2.º cambio de filtro y respeta el tiempo mínimo', () => {
    const { policy, clock } = setup();
    assert.equal(policy.shouldShowInterstitialOnFilterChange(), false); // 1.er cambio
    assert.equal(policy.shouldShowInterstitialOnFilterChange(), true); // 2.º cambio
    clock.advance(30_000);
    assert.equal(policy.shouldShowInterstitialOnFilterChange(), false); // muy pronto
    clock.advance(30_000);
    assert.equal(policy.shouldShowInterstitialOnFilterChange(), true); // ya pasó 1 minuto
  });

  test('el premio quita todos los anuncios hasta que vence', () => {
    const { policy, clock } = setup();
    const until = policy.grantReward();

    assert.equal(until, clock.now() + CONFIG.rewardDurationMs);
    assert.equal(policy.isAdFree(), true);
    assert.equal(policy.shouldInsertNativeAfterStation(), false);
    policy.shouldShowInterstitialOnFilterChange();
    assert.equal(policy.shouldShowInterstitialOnFilterChange(), false);

    clock.advance(CONFIG.rewardDurationMs);
    assert.equal(policy.isAdFree(), false);
  });

  test('el premio se recuerda entre sesiones y tolera datos corruptos', () => {
    const { policy, clock, store } = setup();
    policy.grantReward();
    assert.equal(new AdPolicy(CONFIG, clock, store).isAdFree(), true);

    store.set('adFreeUntil', 'basura');
    assert.equal(new AdPolicy(CONFIG, clock, store).isAdFree(), false);
  });
});
