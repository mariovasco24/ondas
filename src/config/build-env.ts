/**
 * Valores que se inyectan al compilar (scripts/build.mjs, desde variables de entorno).
 * Sin ids reales de AdMob, la app usa los anuncios de prueba de Google.
 */
declare const __ADMOB_BANNER_ID__: string;
declare const __ADMOB_INTERSTITIAL_ID__: string;
declare const __ADMOB_REWARDED_ID__: string;
declare const __ADMOB_TESTING__: boolean;

export const BUILD_ENV = {
  admob: {
    bannerId: __ADMOB_BANNER_ID__,
    interstitialId: __ADMOB_INTERSTITIAL_ID__,
    rewardedId: __ADMOB_REWARDED_ID__,
    testing: __ADMOB_TESTING__,
  },
} as const;
