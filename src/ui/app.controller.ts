import type { AdPolicy } from '../application/ad-policy.js';
import type { FavoritesService } from '../application/favorites.service.js';
import type { PlaybackService } from '../application/playback.service.js';
import type {
  CountryRepository,
  FullScreenAdFormat,
  FullScreenAdResult,
  FullScreenAdProvider,
  PlayerState,
  StationRepository,
} from '../application/ports.js';
import type { StationFeedService } from '../application/station-feed.service.js';
import { DEFAULT_FILTER, type Genre, type Mood, type MoodId, type StationFilter } from '../domain/filter.js';
import type { Station } from '../domain/station.js';
import type { CountryNames } from '../shared/format.js';
import { BannerView } from './components/banner.js';
import { ChipBar } from './components/chip-bar.js';
import { NowPlayingBar } from './components/now-playing-bar.js';
import { Sheet } from './components/sheet.js';
import { Toast } from './components/toast.js';
import { CountryPicker } from './sheets/country-picker.js';
import { SearchSheet } from './sheets/search-sheet.js';
import { CreditsView, type CreditsInfo } from './views/credits.view.js';
import { FavoritesView } from './views/favorites.view.js';
import { FeedView, type FeedItem } from './views/feed.view.js';

export type Tab = 'feed' | 'favorites' | 'credits';

/** Servicios que el controlador necesita (inyectados desde main.ts). */
export interface AppServices {
  readonly feed: StationFeedService;
  readonly favorites: FavoritesService;
  readonly playback: PlaybackService;
  readonly adPolicy: AdPolicy;
  readonly fullScreenAds: FullScreenAdProvider;
  readonly stations: StationRepository;
  readonly countries: CountryRepository;
  readonly countryNames: CountryNames;
}

export interface AppCatalog {
  readonly moods: readonly Mood[];
  readonly genres: readonly Genre[];
  readonly credits: CreditsInfo;
}

/** Elementos raíz del HTML. */
export interface AppDom {
  readonly startScreen: HTMLElement;
  readonly startButton: HTMLButtonElement;
  readonly tabs: HTMLElement;
  readonly searchButton: HTMLButtonElement;
  readonly chips: HTMLElement;
  readonly feed: HTMLElement;
  readonly favorites: HTMLElement;
  readonly credits: HTMLElement;
  readonly nowPlaying: HTMLElement;
  readonly banner: HTMLElement;
  readonly overlayHost: HTMLElement;
}

const SKIP_FAILED_STATION_MS = 1500;
const AD_FREE_CHECK_MS = 30_000;

/**
 * Capa de presentación: conecta las vistas con los casos de uso.
 * No sabe de HTTP, de localStorage ni de AdMob; solo usa servicios e interfaces.
 */
export class AppController {
  private filter: StationFilter = DEFAULT_FILTER;
  private tab: Tab = 'feed';
  private started = false;
  private loading = false;
  /** Cambia en cada recarga del feed para descartar respuestas viejas. */
  private generation = 0;
  private readonly knownStations = new Map<string, Station>();

  private readonly feedView: FeedView;
  private readonly favoritesView: FavoritesView;
  private readonly creditsView: CreditsView;
  private readonly chips: ChipBar;
  private readonly banner: BannerView;
  private readonly nowPlaying: NowPlayingBar;
  private readonly toast: Toast;
  private readonly countryPicker: CountryPicker;
  private readonly searchSheet: SearchSheet;
  private readonly sheet: Sheet;

  constructor(
    private readonly services: AppServices,
    private readonly catalog: AppCatalog,
    private readonly dom: AppDom,
  ) {
    const { countryNames } = services;
    this.sheet = new Sheet(dom.overlayHost);
    this.toast = new Toast(dom.overlayHost);
    this.countryPicker = new CountryPicker(this.sheet, services.countries, countryNames);
    this.searchSheet = new SearchSheet(this.sheet, services.stations, countryNames);
    this.creditsView = new CreditsView(dom.credits);
    this.banner = new BannerView(dom.banner, () => void this.claimReward());
    this.nowPlaying = new NowPlayingBar(dom.nowPlaying, () => this.toggleCurrent());

    this.feedView = new FeedView(dom.feed, {
      onStationVisible: (id) => this.onStationVisible(id),
      onToggle: (id) => this.toggle(id),
      onFavorite: (id) => this.toggleFavorite(id),
      onNearEnd: () => void this.loadMore(),
      onReset: () => this.applyFilter(DEFAULT_FILTER),
    });
    this.favoritesView = new FavoritesView(dom.favorites, countryNames, {
      onPlay: (id) => this.toggle(id),
      onRemove: (id) => this.toggleFavorite(id),
    });
    this.chips = new ChipBar(dom.chips, catalog.moods, catalog.genres, countryNames, {
      onMood: (mood) => this.selectMood(mood),
      onGenre: (tag) => this.applyFilter({ ...this.filter, genre: this.filter.genre === tag ? null : tag }),
      onCountry: () => void this.pickCountry(),
      onClearSearch: () => this.applyFilter({ ...this.filter, searchText: null }),
    });

    this.bindShellEvents();
    services.playback.subscribe((state, station) => this.onPlayerChange(state, station));
    services.playback.setNavigation({ next: () => this.feedView.step(1), previous: () => this.feedView.step(-1) });
    services.favorites.subscribe(() => this.renderFavorites());
  }

  start(): void {
    this.chips.render(this.filter);
    this.creditsView.render(this.catalog.credits);
    this.renderFavorites();
    this.refreshAdFree();
    setInterval(() => this.refreshAdFree(), AD_FREE_CHECK_MS);
    void this.reload();
  }

  // ---------- Encendido y pestañas ----------

  /** Los navegadores exigen un toque del usuario antes de reproducir audio. */
  private powerOn(stationToPlay?: Station): void {
    this.started = true;
    this.dom.startScreen.hidden = true;
    const station = stationToPlay ?? this.visibleStation() ?? this.firstLoadedStation();
    if (station) this.services.playback.play(station);
  }

  private showTab(tab: Tab): void {
    this.tab = tab;
    this.dom.tabs.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach((button) => {
      button.setAttribute('aria-selected', String(button.dataset['tab'] === tab));
    });
    this.dom.feed.hidden = tab !== 'feed';
    this.dom.chips.hidden = tab !== 'feed';
    this.dom.favorites.hidden = tab !== 'favorites';
    this.dom.credits.hidden = tab !== 'credits';

    // En el feed suena lo que se ve: al volver, se retoma la tarjeta visible.
    const visible = this.visibleStation();
    if (tab === 'feed' && this.started && visible && this.services.playback.current?.id !== visible.id) {
      this.services.playback.play(visible);
    }
    this.renderNowPlaying();
  }

  private bindShellEvents(): void {
    this.dom.startButton.addEventListener('click', () => this.powerOn());
    this.dom.tabs.addEventListener('click', (event) => {
      const tab = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-tab]') : null;
      if (tab?.dataset['tab']) this.showTab(tab.dataset['tab'] as Tab);
    });
    this.dom.searchButton.addEventListener('click', () => this.openSearch());

    // Logos rotos: se quitan y quedan las iniciales.
    document.addEventListener(
      'error',
      (event) => {
        const target = event.target;
        if (target instanceof HTMLImageElement && target.closest('.art')) target.remove();
      },
      true,
    );

    document.addEventListener('keydown', (event) => {
      if (this.sheet.isOpen || this.tab !== 'feed') return;
      if (event.key === 'ArrowDown') this.feedView.step(1);
      else if (event.key === 'ArrowUp') this.feedView.step(-1);
      else if (event.key === ' ' && this.feedView.visibleStationId) this.toggle(this.feedView.visibleStationId);
      else return;
      event.preventDefault();
    });
  }

  // ---------- Feed ----------

  private selectMood(mood: MoodId): void {
    // "Cerca de mí" no tiene sentido junto con otro país elegido.
    const countryCode = mood === 'near' ? null : this.filter.countryCode;
    this.applyFilter({ ...this.filter, mood, countryCode, searchText: null });
  }

  private async pickCountry(): Promise<void> {
    await this.countryPicker.open((countryCode) => {
      const mood = this.filter.mood === 'near' ? 'top' : this.filter.mood;
      this.applyFilter({ ...this.filter, countryCode, mood });
    });
  }

  private applyFilter(filter: StationFilter): void {
    this.filter = filter;
    this.chips.render(filter);
    this.showTab('feed');
    void this.reload();
    if (this.services.adPolicy.shouldShowInterstitialOnFilterChange()) void this.showFullScreenAd('interstitial');
  }

  private beginNewFeed(): number {
    this.generation += 1;
    this.loading = false;
    this.feedView.clear();
    this.services.adPolicy.resetNativeCounter();
    return this.generation;
  }

  private async reload(): Promise<void> {
    this.beginNewFeed();
    this.services.feed.reset(this.filter);
    this.feedView.showMessage('Sintonizando…');
    await this.loadMore();
  }

  private async loadMore(): Promise<void> {
    if (this.loading || !this.services.feed.hasMore) return;
    const generation = this.generation;
    this.loading = true;
    try {
      const stations = await this.services.feed.nextPage();
      if (generation !== this.generation) return;
      if (stations.length > 0) this.appendStations(stations);
      else if (this.feedView.isEmpty) this.feedView.showMessage('No encontramos emisoras con ese filtro.', true);
    } catch {
      if (generation !== this.generation) return;
      if (this.feedView.isEmpty) {
        this.feedView.showMessage('No se pudo conectar con el directorio de emisoras. Revisa tu conexión.', true);
      } else {
        this.toast.show('No se pudieron cargar más emisoras');
      }
    } finally {
      if (generation === this.generation) this.loading = false;
    }
  }

  private appendStations(stations: readonly Station[]): void {
    const { adPolicy, favorites, countryNames } = this.services;
    const items: FeedItem[] = [];
    for (const station of stations) {
      this.knownStations.set(station.id, station);
      items.push({
        kind: 'station',
        model: { station, isFavorite: favorites.has(station.id), countryName: countryNames.of(station.countryCode) },
      });
      if (adPolicy.shouldInsertNativeAfterStation()) items.push({ kind: 'ad' });
    }
    this.feedView.append(items);
    this.syncPlayback();

    const first = stations[0];
    if (this.started && !this.services.playback.current && this.tab === 'feed' && first) {
      this.services.playback.play(this.visibleStation() ?? first);
    }
  }

  private onStationVisible(stationId: string): void {
    const station = this.knownStations.get(stationId);
    if (station && this.started && this.tab === 'feed') this.services.playback.play(station);
  }

  // ---------- Búsqueda ----------

  private openSearch(): void {
    this.searchSheet.open({
      onSubmitQuery: (query) => this.applyFilter({ ...DEFAULT_FILTER, searchText: query }),
      onPickStation: (results, index, query) => this.showSearchResults(results, index, query),
    });
  }

  /** Muestra los resultados en el feed, empezando por la emisora elegida. */
  private showSearchResults(results: readonly Station[], index: number, query: string): void {
    this.filter = { ...DEFAULT_FILTER, searchText: query };
    this.chips.render(this.filter);
    this.showTab('feed');
    this.beginNewFeed();
    const ordered = [...results.slice(index), ...results.slice(0, index)];
    const stations = this.services.feed.useFixedList(this.filter, ordered);
    this.appendStations(stations);
    const chosen = stations[0];
    if (!chosen) return;
    if (this.started) this.services.playback.play(chosen);
    else this.powerOn(chosen);
  }

  // ---------- Reproducción ----------

  private findStation(stationId: string): Station | undefined {
    return this.knownStations.get(stationId) ?? this.services.favorites.find(stationId);
  }

  private visibleStation(): Station | undefined {
    const id = this.feedView.visibleStationId;
    return id ? this.knownStations.get(id) : undefined;
  }

  private firstLoadedStation(): Station | undefined {
    return this.knownStations.values().next().value;
  }

  private toggle(stationId: string): void {
    const station = this.findStation(stationId);
    if (!station) return;
    if (!this.started) this.powerOn(station);
    else this.services.playback.toggle(station);
  }

  private toggleCurrent(): void {
    const current = this.services.playback.current;
    if (current) this.services.playback.toggle(current);
  }

  private onPlayerChange(state: PlayerState, station: Station | null): void {
    this.syncPlayback(state, station);
    if (state !== 'error' || !station) return;

    if (this.tab === 'feed' && this.feedView.visibleStationId === station.id) {
      setTimeout(() => {
        const stillStuck =
          this.feedView.visibleStationId === station.id && this.services.playback.current?.id === station.id;
        if (stillStuck) this.feedView.step(1);
      }, SKIP_FAILED_STATION_MS);
    } else {
      this.toast.show('Esta emisora no está disponible ahora');
    }
  }

  private syncPlayback(state?: PlayerState, station?: Station | null): void {
    const current = station === undefined ? this.services.playback.current : station;
    const playerState = state ?? this.services.playback.state;
    this.feedView.setPlayback(current?.id ?? null, playerState);
    this.favoritesView.setCurrent(current?.id ?? null);
    this.nowPlaying.render(current, playerState, this.tab !== 'feed');
  }

  private renderNowPlaying(): void {
    this.syncPlayback();
  }

  // ---------- Favoritos ----------

  private toggleFavorite(stationId: string): void {
    const station = this.findStation(stationId);
    if (!station) return;
    const isFavorite = this.services.favorites.toggle(station);
    this.feedView.setFavorite(stationId, isFavorite);
    if (isFavorite) this.toast.show('Guardada en Favoritos');
  }

  private renderFavorites(): void {
    this.favoritesView.render(this.services.favorites.list(), this.services.playback.current?.id ?? null);
  }

  // ---------- Anuncios ----------

  private async showFullScreenAd(format: FullScreenAdFormat): Promise<FullScreenAdResult> {
    const { playback, adPolicy, fullScreenAds } = this.services;
    playback.setDucked(true, adPolicy.duckVolume);
    try {
      return await fullScreenAds.show(format);
    } finally {
      playback.setDucked(false, adPolicy.duckVolume);
    }
  }

  private async claimReward(): Promise<void> {
    const { completed } = await this.showFullScreenAd('rewarded');
    if (!completed) {
      this.toast.show('Para ganar el premio hay que ver el video completo');
      return;
    }
    this.services.adPolicy.grantReward();
    this.feedView.removeAds();
    this.refreshAdFree();
    this.toast.show('¡Listo! Disfruta sin anuncios 🎉');
  }

  private refreshAdFree(): void {
    const { adPolicy } = this.services;
    this.banner.render(adPolicy.isAdFree() ? adPolicy.adFreeUntil : null);
  }
}
