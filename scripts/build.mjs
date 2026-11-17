// Empaqueta la app (src/main.ts) en dist/js con esbuild e inyecta los ids de AdMob.
// Variables de entorno opcionales: ADMOB_BANNER_ID, ADMOB_INTERSTITIAL_ID, ADMOB_REWARDED_ID.
// Si falta alguna, se usan los anuncios de prueba de Google.
import { build } from 'esbuild';

const TEST_IDS = {
  banner: 'ca-app-pub-3940256099942544/6300978111',
  interstitial: 'ca-app-pub-3940256099942544/1033173712',
  rewarded: 'ca-app-pub-3940256099942544/5224354917',
};
const real = {
  banner: process.env.ADMOB_BANNER_ID,
  interstitial: process.env.ADMOB_INTERSTITIAL_ID,
  rewarded: process.env.ADMOB_REWARDED_ID,
};
const testing = !(real.banner && real.interstitial && real.rewarded);
const ids = testing ? TEST_IDS : real;

await build({
  entryPoints: ['src/main.ts'],
  outdir: 'dist/js',
  bundle: true,
  splitting: true,
  format: 'esm',
  target: 'es2022',
  minify: true,
  sourcemap: true,
  legalComments: 'linked',
  define: {
    __ADMOB_BANNER_ID__: JSON.stringify(ids.banner),
    __ADMOB_INTERSTITIAL_ID__: JSON.stringify(ids.interstitial),
    __ADMOB_REWARDED_ID__: JSON.stringify(ids.rewarded),
    __ADMOB_TESTING__: String(testing),
  },
  logLevel: 'info',
});
console.log(`AdMob: ${testing ? 'anuncios de prueba' : 'ids reales'}`);
