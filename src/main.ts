/**
 * Composition root: el único lugar donde se crean las clases concretas
 * y se conectan entre sí. Para pasar a la app nativa basta con cambiar
 * implementaciones aquí (p. ej. PlaceholderAdProvider → AdMobAdProvider).
 */
import { AdPolicy } from './application/ad-policy.js';
import { FavoritesService } from './application/favorites.service.js';
import { PlaybackService } from './application/playback.service.js';
import { StationFeedService } from './application/station-feed.service.js';
import {
  AD_POLICY,
  APP_INFO,
  BLOCKED_STATION_IDS,
  GENRES,
  MIN_STATIONS_PER_COUNTRY,
  MOODS,
  PAGE_SIZE,
  PLACEHOLDER_ADS,
  RADIO_BROWSER_MIRRORS,
} from './config/app.config.js';
import { PlaceholderAdProvider } from './infrastructure/ads/placeholder-ad.provider.js';
import { HtmlAudioPlayer } from './infrastructure/audio/html-audio.player.js';
import { MediaSessionIntegration } from './infrastructure/media/media-session.integration.js';
import { RadioBrowserClient } from './infrastructure/radio-browser/radio-browser.client.js';
import {
  RadioBrowserCountryRepository,
  RadioBrowserStationRepository,
} from './infrastructure/radio-browser/radio-browser.repositories.js';
import { LocalStorageStore } from './infrastructure/storage/local-storage.store.js';
import { systemClock } from './infrastructure/system/system.clock.js';
import { CountryNames, countryFromLocale } from './shared/format.js';
import { AppController } from './ui/app.controller.js';
import { requireElement } from './ui/dom.js';

function bootstrap(): void {
  const store = new LocalStorageStore('ondas.');
  const countryNames = new CountryNames(APP_INFO.locale);

  const client = new RadioBrowserClient(RADIO_BROWSER_MIRRORS);
  const stations = new RadioBrowserStationRepository(client);
  const countries = new RadioBrowserCountryRepository(client, MIN_STATIONS_PER_COUNTRY);

  const player = new HtmlAudioPlayer(requireElement<HTMLAudioElement>('#audio'));
  const nowPlaying = new MediaSessionIntegration(APP_INFO.name, (s) => countryNames.of(s.countryCode));

  const controller = new AppController(
    {
      feed: new StationFeedService(stations, {
        pageSize: PAGE_SIZE,
        moods: MOODS,
        userCountryCode: countryFromLocale(navigator.language, APP_INFO.defaultCountry),
        blockedStationIds: new Set(BLOCKED_STATION_IDS),
      }),
      favorites: new FavoritesService(store),
      playback: new PlaybackService(player, stations, nowPlaying),
      adPolicy: new AdPolicy(AD_POLICY, systemClock, store),
      fullScreenAds: new PlaceholderAdProvider(document.body, PLACEHOLDER_ADS),
      stations,
      countries,
      countryNames,
    },
    {
      moods: MOODS,
      genres: GENRES,
      credits: {
        appName: APP_INFO.name,
        version: APP_INFO.version,
        author: APP_INFO.author,
        contactEmail: APP_INFO.contactEmail,
        repositoryUrl: APP_INFO.repositoryUrl,
        copyrightYear: APP_INFO.copyrightYear,
      },
    },
    {
      startScreen: requireElement('#start-screen'),
      startButton: requireElement('#start-button'),
      tabs: requireElement('#tabs'),
      searchButton: requireElement('#search-button'),
      chips: requireElement('#chips'),
      feed: requireElement('#feed'),
      favorites: requireElement('#favorites'),
      credits: requireElement('#credits'),
      nowPlaying: requireElement('#now-playing'),
      banner: requireElement('#banner'),
      overlayHost: document.body,
    },
  );

  controller.start();
}

bootstrap();
