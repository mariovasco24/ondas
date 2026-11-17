import type { PlayerState } from '../../application/ports.js';
import { renderNativeAdCard, renderStationCard, type StationCardModel } from '../components/station-markup.js';
import { closestFromEvent, escapeHtml, htmlToElements } from '../dom.js';

export interface FeedViewHandlers {
  onStationVisible(stationId: string): void;
  onToggle(stationId: string): void;
  onFavorite(stationId: string): void;
  onNearEnd(): void;
  onReset(): void;
}

export type FeedItem =
  | { readonly kind: 'station'; readonly model: StationCardModel }
  | { readonly kind: 'ad' };

/** Cuántas tarjetas antes del final se pide la siguiente página. */
const PREFETCH_DISTANCE = 4;

/** Feed vertical tipo swipe: una tarjeta por pantalla. Solo pinta y avisa; no decide. */
export class FeedView {
  private readonly observer: IntersectionObserver;
  private visibleId: string | null = null;

  constructor(
    private readonly root: HTMLElement,
    private readonly handlers: FeedViewHandlers,
  ) {
    this.observer = new IntersectionObserver((entries) => this.onIntersect(entries), {
      root,
      threshold: 0.6,
    });
    root.addEventListener('click', (event) => this.onClick(event));
  }

  get visibleStationId(): string | null {
    return this.visibleId;
  }

  get isEmpty(): boolean {
    return this.root.querySelector('.card') === null;
  }

  clear(): void {
    this.observer.disconnect();
    this.root.innerHTML = '';
    this.root.scrollTop = 0;
    this.visibleId = null;
  }

  showMessage(text: string, withReset = false): void {
    this.root.querySelector('.feed__message')?.remove();
    const reset = withReset
      ? '<button class="btn btn--ghost" type="button" data-action="reset">Ver populares</button>'
      : '';
    this.root.insertAdjacentHTML(
      'beforeend',
      `<div class="feed__message"><p>${escapeHtml(text)}</p>${reset}</div>`,
    );
  }

  append(items: readonly FeedItem[]): void {
    this.root.querySelector('.feed__message')?.remove();
    const html = items
      .map((item) => (item.kind === 'station' ? renderStationCard(item.model) : renderNativeAdCard()))
      .join('');
    for (const element of htmlToElements(html)) {
      this.root.appendChild(element);
      this.observer.observe(element);
    }
  }

  removeAds(): void {
    this.root.querySelectorAll('.card--ad').forEach((ad) => {
      this.observer.unobserve(ad);
      ad.remove();
    });
  }

  scrollToStation(stationId: string): void {
    const card = this.cardFor(stationId);
    if (card) this.root.scrollTo({ top: card.offsetTop });
  }

  step(direction: 1 | -1): void {
    const card = this.visibleId ? this.cardFor(this.visibleId) : null;
    const target = direction === 1 ? card?.nextElementSibling : card?.previousElementSibling;
    if (target instanceof HTMLElement) this.root.scrollTo({ top: target.offsetTop, behavior: 'smooth' });
  }

  setPlayback(stationId: string | null, state: PlayerState): void {
    for (const card of this.root.querySelectorAll<HTMLElement>('.card--station')) {
      const isCurrent = card.dataset['stationId'] === stationId;
      const active = isCurrent && (state === 'playing' || state === 'loading');
      card.classList.toggle('is-playing', isCurrent && state === 'playing');
      card.classList.toggle('is-loading', isCurrent && state === 'loading');
      card.classList.toggle('is-error', isCurrent && state === 'error');

      const button = card.querySelector('[data-action="toggle"]');
      if (button) button.textContent = active ? '❚❚' : '▶';
      const status = card.querySelector('.card__status');
      if (status) status.textContent = isCurrent ? statusText(state) : '';
    }
  }

  setFavorite(stationId: string, isFavorite: boolean): void {
    const button = this.cardFor(stationId)?.querySelector('[data-action="favorite"]');
    if (!button) return;
    button.setAttribute('aria-pressed', String(isFavorite));
    button.textContent = isFavorite ? '♥' : '♡';
  }

  private cardFor(stationId: string): HTMLElement | null {
    return this.root.querySelector<HTMLElement>(`.card--station[data-station-id="${CSS.escape(stationId)}"]`);
  }

  private onIntersect(entries: IntersectionObserverEntry[]): void {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const element = entry.target as HTMLElement;
      const stationId = element.dataset['stationId'];
      if (stationId && stationId !== this.visibleId) {
        this.visibleId = stationId;
        this.handlers.onStationVisible(stationId);
      }
      const cards = this.root.children;
      if (Array.prototype.indexOf.call(cards, element) >= cards.length - PREFETCH_DISTANCE) {
        this.handlers.onNearEnd();
      }
    }
  }

  private onClick(event: Event): void {
    const action = closestFromEvent<HTMLElement>(event, '[data-action]')?.dataset['action'];
    if (action === 'reset') return this.handlers.onReset();
    const stationId = closestFromEvent<HTMLElement>(event, '.card--station')?.dataset['stationId'];
    if (!stationId) return;
    if (action === 'toggle') this.handlers.onToggle(stationId);
    else if (action === 'favorite') this.handlers.onFavorite(stationId);
    else if (action === 'next') this.step(1);
  }
}

function statusText(state: PlayerState): string {
  if (state === 'loading') return 'Conectando…';
  if (state === 'error') return 'No disponible · pasando a la siguiente…';
  return '';
}
