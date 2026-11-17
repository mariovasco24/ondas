import type { Country } from '../../application/ports.js';
import type { Station } from '../../domain/station.js';

/** Forma (parcial) de una emisora en la API de Radio Browser. */
export interface RadioBrowserStationDto {
  stationuuid?: string;
  name?: string;
  url?: string;
  url_resolved?: string;
  hls?: number;
  favicon?: string;
  homepage?: string;
  countrycode?: string;
  state?: string;
  tags?: string;
}

export interface RadioBrowserCountryDto {
  iso_3166_1?: string;
  stationcount?: number;
}

const COUNTRY_CODE = /^[A-Za-z]{2}$/;
const MAX_TAGS = 6;

/** Adapta el DTO externo al modelo de dominio. Devuelve null si los datos no sirven. */
export function toStation(dto: RadioBrowserStationDto): Station | null {
  const id = dto.stationuuid?.trim();
  const name = dto.name?.trim();
  const streamUrl = (dto.url_resolved || dto.url || '').trim();
  if (!id || !name || !streamUrl) return null;

  return {
    id,
    name,
    streamUrl,
    isHls: dto.hls === 1 || /\.m3u8(\?|$)/i.test(streamUrl),
    faviconUrl: toHttpsUrl(dto.favicon),
    homepageUrl: toHttpsUrl(dto.homepage),
    countryCode: toCountryCode(dto.countrycode),
    region: dto.state?.trim() || null,
    tags: (dto.tags ?? '')
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, MAX_TAGS),
  };
}

/** Suma emisoras por código de país (la API puede repetir códigos) y descarta países pequeños. */
export function toCountries(dtos: readonly RadioBrowserCountryDto[], minStations: number): Country[] {
  const totals = new Map<string, number>();
  for (const dto of dtos) {
    const code = toCountryCode(dto.iso_3166_1);
    if (!code) continue;
    totals.set(code, (totals.get(code) ?? 0) + (dto.stationcount ?? 0));
  }
  return [...totals]
    .filter(([, count]) => count >= minStations)
    .map(([code, stationCount]) => ({ code, stationCount }));
}

function toCountryCode(value?: string): string | null {
  const code = value?.trim() ?? '';
  return COUNTRY_CODE.test(code) ? code.toUpperCase() : null;
}

/** Solo URLs HTTPS válidas: una imagen http rompería la página por contenido mixto. */
function toHttpsUrl(value?: string): string | null {
  if (!value) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}
