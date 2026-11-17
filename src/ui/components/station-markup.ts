import type { Station } from '../../domain/station.js';
import { flagEmoji, hueFromText, initials } from '../../shared/format.js';
import { escapeHtml } from '../dom.js';

export interface StationCardModel {
  readonly station: Station;
  readonly isFavorite: boolean;
  readonly countryName: string;
}

/** Logo de la emisora con sus iniciales detrás, por si la imagen no carga. */
export function renderArtwork(station: Station): string {
  const image = station.faviconUrl
    ? `<img src="${escapeHtml(station.faviconUrl)}" alt="" loading="lazy" referrerpolicy="no-referrer">`
    : '';
  return `<span class="art" aria-hidden="true"><span class="art__initials">${escapeHtml(initials(station.name))}</span>${image}</span>`;
}

export function renderStationCard({ station, isFavorite, countryName }: StationCardModel): string {
  const place = [`${flagEmoji(station.countryCode)} ${escapeHtml(countryName)}`, escapeHtml(station.region ?? '')]
    .filter((part) => part.trim())
    .join(' · ');
  const tags = station.tags
    .slice(0, 4)
    .map((tag) => `<span>${escapeHtml(tag)}</span>`)
    .join('');

  return `
    <section class="card card--station" data-station-id="${escapeHtml(station.id)}" style="--hue:${hueFromText(station.name)}">
      ${renderArtwork(station)}
      <h2 class="card__title">${escapeHtml(station.name)}</h2>
      <p class="card__place">${place}</p>
      ${tags ? `<div class="card__tags">${tags}</div>` : ''}
      <div class="eq" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
      <div class="card__controls">
        <button class="icon-btn" data-action="favorite" aria-pressed="${isFavorite}" aria-label="Guardar en favoritos">${isFavorite ? '♥' : '♡'}</button>
        <button class="play-btn" data-action="toggle" aria-label="Reproducir o pausar">▶</button>
        <button class="icon-btn" data-action="next" aria-label="Siguiente emisora">⌄</button>
      </div>
      <p class="card__status" role="status"></p>
    </section>`;
}

/** Espacio para un anuncio nativo (AdMob Native Advanced en la app). */
export function renderNativeAdCard(): string {
  return `
    <section class="card card--ad">
      <span class="ad-label">Anuncio</span>
      <div class="ad-slot">Anuncio nativo<small>AdMob · Native Advanced</small></div>
      <p class="muted">La radio sigue sonando mientras ves esto. Desliza para continuar.</p>
      <button class="btn btn--ghost" type="button">Más información</button>
    </section>`;
}

export interface StationRowOptions {
  readonly countryName: string;
  readonly isCurrent?: boolean;
  /** Botón extra a la derecha (p. ej. quitar de favoritos). */
  readonly trailingHtml?: string;
}

export function renderStationRow(station: Station, options: StationRowOptions): string {
  return `
    <div class="row${options.isCurrent ? ' is-current' : ''}" data-station-id="${escapeHtml(station.id)}" style="--hue:${hueFromText(station.name)}">
      <button class="row__main" data-action="play" type="button">
        ${renderArtwork(station)}
        <span class="row__text">
          <b>${escapeHtml(station.name)}</b>
          <small>${flagEmoji(station.countryCode)} ${escapeHtml(options.countryName)}</small>
        </span>
      </button>
      ${options.trailingHtml ?? ''}
    </div>`;
}
