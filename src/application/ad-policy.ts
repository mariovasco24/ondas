import type { Clock, KeyValueStore } from './ports.js';

export interface AdPolicyConfig {
  /** Un anuncio nativo cada N emisoras del feed. */
  readonly nativeEvery: number;
  /** Tiempo mínimo entre dos intersticiales. */
  readonly interstitialMinGapMs: number;
  /** El primer intersticial aparece a partir de este número de cambios de filtro. */
  readonly interstitialAfterFilterChanges: number;
  /** Duración del premio "sin anuncios" al ver un video recompensado. */
  readonly rewardDurationMs: number;
  /** Volumen de la radio mientras se ve un anuncio a pantalla completa (nunca se corta). */
  readonly duckVolume: number;
}

const AD_FREE_UNTIL_KEY = 'adFreeUntil';

/**
 * Reglas de frecuencia de anuncios. Solo decide CUÁNDO mostrar un anuncio;
 * CÓMO se muestra es responsabilidad de un FullScreenAdProvider.
 */
export class AdPolicy {
  private stationsSinceNative = 0;
  private filterChanges = 0;
  private lastInterstitialAt = Number.NEGATIVE_INFINITY;

  constructor(
    private readonly config: AdPolicyConfig,
    private readonly clock: Clock,
    private readonly store: KeyValueStore,
  ) {}

  get duckVolume(): number {
    return this.config.duckVolume;
  }

  get adFreeUntil(): number {
    const value = this.store.get<unknown>(AD_FREE_UNTIL_KEY, 0);
    return typeof value === 'number' ? value : 0;
  }

  isAdFree(): boolean {
    return this.clock.now() < this.adFreeUntil;
  }

  resetNativeCounter(): void {
    this.stationsSinceNative = 0;
  }

  /** Se llama por cada emisora añadida al feed; devuelve true si después va un anuncio nativo. */
  shouldInsertNativeAfterStation(): boolean {
    if (this.isAdFree()) return false;
    this.stationsSinceNative += 1;
    if (this.stationsSinceNative < this.config.nativeEvery) return false;
    this.stationsSinceNative = 0;
    return true;
  }

  /** Se llama en cada cambio de filtro; devuelve true si toca mostrar un intersticial. */
  shouldShowInterstitialOnFilterChange(): boolean {
    this.filterChanges += 1;
    if (this.isAdFree() || this.filterChanges < this.config.interstitialAfterFilterChanges) return false;
    const now = this.clock.now();
    if (now - this.lastInterstitialAt < this.config.interstitialMinGapMs) return false;
    this.lastInterstitialAt = now;
    return true;
  }

  /** Activa el periodo sin anuncios y devuelve cuándo termina. */
  grantReward(): number {
    const until = this.clock.now() + this.config.rewardDurationMs;
    this.store.set(AD_FREE_UNTIL_KEY, until);
    return until;
  }
}
