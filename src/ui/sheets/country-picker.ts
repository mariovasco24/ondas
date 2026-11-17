import type { Country, CountryRepository } from '../../application/ports.js';
import { CountryNames, flagEmoji, normalizeForSearch } from '../../shared/format.js';
import type { Sheet } from '../components/sheet.js';
import { closestFromEvent, escapeHtml, requireElement } from '../dom.js';

type NamedCountry = Country & { readonly name: string };

export class CountryPicker {
  constructor(
    private readonly sheet: Sheet,
    private readonly countries: CountryRepository,
    private readonly countryNames: CountryNames,
  ) {}

  async open(onPick: (countryCode: string | null) => void): Promise<void> {
    const body = this.sheet.open(
      'Elige un país',
      `<input class="field" type="search" placeholder="Buscar país…" aria-label="Buscar país" autocomplete="off">
       <div class="sheet__list"><p class="muted">Cargando países…</p></div>`,
    );
    const input = requireElement<HTMLInputElement>('input', body);
    const list = requireElement<HTMLElement>('.sheet__list', body);

    let countries: NamedCountry[];
    try {
      countries = (await this.countries.list())
        .map((c) => ({ ...c, name: this.countryNames.of(c.code) }))
        .sort((a, b) => a.name.localeCompare(b.name, 'es'));
    } catch {
      list.innerHTML = '<p class="muted">No se pudo cargar la lista de países.</p>';
      return;
    }

    const render = (query: string): void => {
      const needle = normalizeForSearch(query);
      const matches = countries.filter((c) => normalizeForSearch(c.name).includes(needle));
      list.innerHTML =
        `<button class="row__main" type="button" data-code=""><span class="row__text"><b>🌎 Todos los países</b></span></button>` +
        matches
          .map(
            (c) => `
            <button class="row__main" type="button" data-code="${escapeHtml(c.code)}">
              <span class="row__text">
                <b>${flagEmoji(c.code)} ${escapeHtml(c.name)}</b>
                <small>${c.stationCount.toLocaleString('es')} emisoras</small>
              </span>
            </button>`,
          )
          .join('');
    };

    render('');
    input.addEventListener('input', () => render(input.value));
    list.addEventListener('click', (event) => {
      const button = closestFromEvent<HTMLElement>(event, '[data-code]');
      if (!button) return;
      this.sheet.close();
      onPick(button.dataset['code'] || null);
    });
  }
}
