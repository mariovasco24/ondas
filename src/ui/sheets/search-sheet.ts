import type { StationRepository } from '../../application/ports.js';
import { hasSecureStream, type Station } from '../../domain/station.js';
import type { CountryNames } from '../../shared/format.js';
import type { Sheet } from '../components/sheet.js';
import { renderStationRow } from '../components/station-markup.js';
import { closestFromEvent, requireElement } from '../dom.js';

export interface SearchSheetHandlers {
  /** El usuario tocó un resultado: el feed muestra los resultados empezando por ese. */
  onPickStation(results: readonly Station[], index: number, query: string): void;
  /** El usuario presionó Enter: el feed se filtra por ese texto. */
  onSubmitQuery(query: string): void;
}

const MIN_QUERY_LENGTH = 2;
const RESULT_LIMIT = 40;

export class SearchSheet {
  constructor(
    private readonly sheet: Sheet,
    private readonly stations: StationRepository,
    private readonly countryNames: CountryNames,
    private readonly debounceMs = 400,
  ) {}

  open(handlers: SearchSheetHandlers): void {
    const body = this.sheet.open(
      'Buscar emisora',
      `<input class="field" type="search" placeholder="Nombre de la emisora…" aria-label="Nombre de la emisora" autocomplete="off" enterkeyhint="search">
       <div class="sheet__list"><p class="muted">Escribe al menos 2 letras. Ej.: Tropicana, BBC, Jazz.</p></div>`,
    );
    const input = requireElement<HTMLInputElement>('input', body);
    const list = requireElement<HTMLElement>('.sheet__list', body);
    input.focus();

    let results: Station[] = [];
    let timer: ReturnType<typeof setTimeout> | undefined;
    let latestRequest = 0;
    const query = (): string => input.value.trim();

    const search = async (text: string): Promise<void> => {
      const requestId = ++latestRequest;
      list.innerHTML = '<p class="muted">Buscando…</p>';
      try {
        const found = await this.stations.search({ name: text, order: 'popular', limit: RESULT_LIMIT, offset: 0 });
        if (requestId !== latestRequest) return; // llegó una búsqueda más nueva
        results = found.filter(hasSecureStream);
        list.innerHTML = results.length
          ? results
              .map((s) => renderStationRow(s, { countryName: this.countryNames.of(s.countryCode) }))
              .join('')
          : '<p class="muted">Sin resultados.</p>';
      } catch {
        if (requestId === latestRequest) list.innerHTML = '<p class="muted">No hay conexión.</p>';
      }
    };

    input.addEventListener('input', () => {
      clearTimeout(timer);
      const text = query();
      if (text.length >= MIN_QUERY_LENGTH) timer = setTimeout(() => void search(text), this.debounceMs);
    });
    input.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' || query().length < MIN_QUERY_LENGTH) return;
      clearTimeout(timer);
      this.sheet.close();
      handlers.onSubmitQuery(query());
    });
    list.addEventListener('click', (event) => {
      const stationId = closestFromEvent<HTMLElement>(event, '[data-station-id]')?.dataset['stationId'];
      const index = results.findIndex((s) => s.id === stationId);
      if (index < 0) return;
      this.sheet.close();
      handlers.onPickStation(results, index, query());
    });
  }
}
