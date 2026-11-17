import type { Genre, Mood, MoodId, StationFilter } from '../../domain/filter.js';
import { CountryNames, flagEmoji } from '../../shared/format.js';
import { closestFromEvent, escapeHtml } from '../dom.js';

export interface ChipBarHandlers {
  onMood(mood: MoodId): void;
  onGenre(tag: string): void;
  onCountry(): void;
  onClearSearch(): void;
}

/** Fila de filtros: moods, país y géneros. */
export class ChipBar {
  constructor(
    private readonly root: HTMLElement,
    private readonly moods: readonly Mood[],
    private readonly genres: readonly Genre[],
    private readonly countryNames: CountryNames,
    handlers: ChipBarHandlers,
  ) {
    root.addEventListener('click', (event) => {
      const chip = closestFromEvent<HTMLButtonElement>(event, 'button');
      if (!chip) return;
      const { mood, genre, action } = chip.dataset;
      if (mood) handlers.onMood(mood as MoodId);
      else if (genre) handlers.onGenre(genre);
      else if (action === 'country') handlers.onCountry();
      else if (action === 'clear-search') handlers.onClearSearch();
    });
  }

  render(filter: StationFilter): void {
    const chip = (attrs: string, label: string, active: boolean): string =>
      `<button class="chip" type="button" ${attrs} aria-pressed="${active}">${label}</button>`;
    const separator = '<span class="chips__sep" aria-hidden="true"></span>';

    const search = filter.searchText
      ? chip('data-action="clear-search"', `🔍 “${escapeHtml(filter.searchText)}” ✕`, true) + separator
      : '';
    const moods = this.moods
      .map((m) => chip(`data-mood="${m.id}"`, escapeHtml(m.label), !filter.searchText && filter.mood === m.id))
      .join('');
    const countryLabel = filter.countryCode
      ? `${flagEmoji(filter.countryCode)} ${escapeHtml(this.countryNames.of(filter.countryCode))}`
      : '🌎 País';
    const country = chip('data-action="country"', `${countryLabel} ▾`, !!filter.countryCode);
    const genres = this.genres
      .map((g) => chip(`data-genre="${escapeHtml(g.tag)}"`, escapeHtml(g.label), filter.genre === g.tag))
      .join('');

    this.root.innerHTML = search + moods + separator + country + separator + genres;
  }
}
