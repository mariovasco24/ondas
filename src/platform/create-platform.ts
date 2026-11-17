/**
 * Elige las implementaciones según dónde corre la app: navegador o app nativa (Capacitor).
 * Los adaptadores nativos se cargan con import() dinámico para que la web no los descargue.
 */
import type { BannerAdProvider, FullScreenAdProvider, NowPlayingIntegration } from '../application/ports.js';
import type { PlaceholderAdOptions } from '../infrastructure/ads/placeholder-ad.provider.js';
import type { Station } from '../domain/station.js';

declare global {
  interface Window {
    Capacitor?: { isNativePlatform?: () => boolean };
  }
}

export interface Platform {
  readonly isNative: boolean;
  readonly fullScreenAds: FullScreenAdProvider;
  readonly bannerAds: BannerAdProvider;
  readonly nowPlaying: NowPlayingIntegration;
  /** AdMob no ofrece anuncios nativos en este plugin: en la app, el feed va sin tarjetas de anuncio. */
  readonly feedAdsSupported: boolean;
}

export interface PlatformOptions {
  readonly appName: string;
  readonly describeStation: (station: Station) => string;
  readonly overlayHost: HTMLElement;
  readonly placeholderAds: PlaceholderAdOptions;
}

export function isNativePlatform(): boolean {
  try {
    return window.Capacitor?.isNativePlatform?.() === true;
  } catch {
    return false;
  }
}

export async function createPlatform(options: PlatformOptions): Promise<Platform> {
  if (isNativePlatform()) {
    const [{ AdMobAdProvider, AdMobBannerProvider, AdMobSession }, { CapacitorMediaSessionIntegration }, { BUILD_ENV }] =
      await Promise.all([
        import('../infrastructure/ads/admob-ad.provider.js'),
        import('../infrastructure/media/capacitor-media-session.integration.js'),
        import('../config/build-env.js'),
      ]);
    const session = new AdMobSession(BUILD_ENV.admob);
    return {
      isNative: true,
      fullScreenAds: new AdMobAdProvider(session),
      bannerAds: new AdMobBannerProvider(session),
      nowPlaying: new CapacitorMediaSessionIntegration(options.appName, options.describeStation),
      feedAdsSupported: false,
    };
  }

  const [{ PlaceholderAdProvider }, { HtmlBannerProvider }, { MediaSessionIntegration }] = await Promise.all([
    import('../infrastructure/ads/placeholder-ad.provider.js'),
    import('../infrastructure/ads/html-banner.provider.js'),
    import('../infrastructure/media/media-session.integration.js'),
  ]);
  return {
    isNative: false,
    fullScreenAds: new PlaceholderAdProvider(options.overlayHost, options.placeholderAds),
    bannerAds: new HtmlBannerProvider(),
    nowPlaying: new MediaSessionIntegration(options.appName, options.describeStation),
    feedAdsSupported: true,
  };
}
