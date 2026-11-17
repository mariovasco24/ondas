import type { Station } from '../../domain/station.js';
import type { CountryNames } from '../../shared/format.js';
import { renderStationRow } from '../components/station-markup.js';
import { closestFromEvent } from '../dom.js';

export interface FavoritesViewHandlers {
  onPlay(stationId: string): void;
  onRemove(stationId: string): void;
}

export class FavoritesView {
  constructor(
    private readonly root: HTMLElement,
    private readonly countryNames: CountryNames,
    handlers: FavoritesViewHandlers,
  ) {
    root.addEventListener('click', (event) => {
      const stationId = closestFromEvent<HTMLElement>(event, '[data-station-id]')?.dataset['stationId'];
      const action = closestFromEvent<HTMLElement>(event, '[data-action]')?.dataset['action'];
      if (!stationId) return;
      if (action === 'remove') handlers.onRemove(stationId);
      else if (action === 'play') handlers.onPlay(stationId);
    });
  }

  render(stations: readonly Station[], currentId: string | null): void {
    if (stations.length === 0) {
      this.root.innerHTML = `
        <div class="empty">
          <h2>Aún no tienes favoritas</h2>
          <p class="muted">Toca ♡ en cualquier emisora para guardarla aquí.</p>
        </div>`;
      return;
    }
    const remove =
      '<button class="icon-btn icon-btn--accent" type="button" data-action="remove" aria-label="Quitar de favoritos">♥</button>';
    const rows = stations
      .map((station) =>
        renderStationRow(station, {
          countryName: this.countryNames.of(station.countryCode),
          isCurrent: station.id === currentId,
          trailingHtml: remove,
        }),
      )
      .join('');
    this.root.innerHTML = `<h2 class="panel__title">Tus favoritas</h2><div class="rows">${rows}</div>`;
  }

  setCurrent(currentId: string | null): void {
    this.root.querySelectorAll<HTMLElement>('.row').forEach((row) => {
      row.classList.toggle('is-current', row.dataset['stationId'] === currentId);
    });
  }
}
