import type { BannerAdProvider } from '../../application/ports.js';

/** Versión web: el banner es un espacio de HTML que pinta BannerView; aquí no hay nada que cargar. */
export class HtmlBannerProvider implements BannerAdProvider {
  async show(): Promise<void> {}
  async hide(): Promise<void> {}
}
