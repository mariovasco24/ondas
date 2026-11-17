import {
  AdMob,
  AdmobConsentStatus,
  BannerAdPosition,
  BannerAdSize,
  InterstitialAdPluginEvents,
  MaxAdContentRating,
  RewardAdPluginEvents,
} from '@capacitor-community/admob';
import type {
  BannerAdProvider,
  FullScreenAdFormat,
  FullScreenAdProvider,
  FullScreenAdResult,
} from '../../application/ports.js';

export interface AdMobConfig {
  readonly bannerId: string;
  readonly interstitialId: string;
  readonly rewardedId: string;
  /** Anuncios de prueba de Google (cuando la compilación no tiene los ids reales). */
  readonly testing: boolean;
}

const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Arranque único de AdMob: muestra el formulario de consentimiento de Google (UMP)
 * donde la ley lo exige y limita el contenido de los anuncios a público general.
 */
export class AdMobSession {
  private started: Promise<boolean> | null = null;

  constructor(readonly config: AdMobConfig) {}

  /** true si se pueden pedir anuncios. */
  ready(): Promise<boolean> {
    this.started ??= this.start();
    return this.started;
  }

  private async start(): Promise<boolean> {
    try {
      await AdMob.initialize({
        initializeForTesting: this.config.testing,
        tagForChildDirectedTreatment: false,
        tagForUnderAgeOfConsent: false,
        maxAdContentRating: MaxAdContentRating.General,
      });
      let info = await AdMob.requestConsentInfo();
      if (info.isConsentFormAvailable && info.status === AdmobConsentStatus.REQUIRED) {
        info = await AdMob.showConsentForm();
      }
      return info.canRequestAds;
    } catch {
      return false;
    }
  }
}

/** Banner fijo en la parte inferior de la pantalla. */
export class AdMobBannerProvider implements BannerAdProvider {
  constructor(private readonly session: AdMobSession) {}

  async show(): Promise<void> {
    const { bannerId, testing } = this.session.config;
    if (!bannerId || !(await this.session.ready())) return;
    try {
      await AdMob.showBanner({
        adId: bannerId,
        adSize: BannerAdSize.BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        margin: 0,
        isTesting: testing,
      });
    } catch {
      // Sin anuncio disponible: el espacio queda vacío.
    }
  }

  async hide(): Promise<void> {
    try {
      await AdMob.removeBanner();
    } catch {
      // No había banner.
    }
  }
}

/** Intersticial y video recompensado. */
export class AdMobAdProvider implements FullScreenAdProvider {
  private interstitialReady = false;
  private rewardedReady = false;

  constructor(private readonly session: AdMobSession) {
    void session.ready().then((ok) => {
      if (!ok) return;
      void this.prepareInterstitial();
      void this.prepareRewarded();
    });
  }

  private get config(): AdMobConfig {
    return this.session.config;
  }

  async show(format: FullScreenAdFormat): Promise<FullScreenAdResult> {
    if (!(await this.session.ready())) return { completed: false };
    return format === 'rewarded' ? this.showRewarded() : this.showInterstitial();
  }

  private async prepareInterstitial(): Promise<void> {
    if (this.interstitialReady || !this.config.interstitialId) return;
    try {
      await AdMob.prepareInterstitial({ adId: this.config.interstitialId, isTesting: this.config.testing });
      this.interstitialReady = true;
    } catch {
      this.interstitialReady = false;
    }
  }

  private async prepareRewarded(): Promise<void> {
    if (this.rewardedReady || !this.config.rewardedId) return;
    try {
      await AdMob.prepareRewardVideoAd({ adId: this.config.rewardedId, isTesting: this.config.testing });
      this.rewardedReady = true;
    } catch {
      this.rewardedReady = false;
    }
  }

  /** Nunca hace esperar al usuario: si el anuncio no está listo, se salta esta vez. */
  private async showInterstitial(): Promise<FullScreenAdResult> {
    if (!this.interstitialReady) {
      void this.prepareInterstitial();
      return { completed: false };
    }
    let dismissed!: () => void;
    const closed = new Promise<void>((resolve) => (dismissed = resolve));
    const handles = await Promise.all([
      AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => dismissed()),
      AdMob.addListener(InterstitialAdPluginEvents.FailedToShow, () => dismissed()),
    ]);
    try {
      await AdMob.showInterstitial();
      await Promise.race([closed, wait(120_000)]);
      return { completed: true };
    } catch {
      return { completed: false };
    } finally {
      for (const handle of handles) void handle.remove();
      this.interstitialReady = false;
      void this.prepareInterstitial();
    }
  }

  private async showRewarded(): Promise<FullScreenAdResult> {
    if (!this.rewardedReady) await this.prepareRewarded();
    if (!this.rewardedReady) return { completed: false };

    let rewarded = false;
    let dismissed!: () => void;
    const closed = new Promise<void>((resolve) => (dismissed = resolve));
    const handles = await Promise.all([
      AdMob.addListener(RewardAdPluginEvents.Rewarded, () => (rewarded = true)),
      AdMob.addListener(RewardAdPluginEvents.Dismissed, () => dismissed()),
      AdMob.addListener(RewardAdPluginEvents.FailedToShow, () => dismissed()),
    ]);
    try {
      const shown = AdMob.showRewardVideoAd().then((item) => {
        if (item && item.amount > 0) rewarded = true;
      });
      await Promise.race([closed, shown.then(() => closed)]);
      await wait(300); // el premio puede llegar justo después de cerrar
    } catch {
      // No se pudo mostrar: sin premio.
    } finally {
      for (const handle of handles) void handle.remove();
      this.rewardedReady = false;
      void this.prepareRewarded();
    }
    return { completed: rewarded };
  }
}
