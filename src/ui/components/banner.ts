import { requireElement } from '../dom.js';

/** Banner inferior: espacio de anuncio + botón de recompensa, o aviso de "sin anuncios". */
export class BannerView {
  private readonly slot: HTMLElement;
  private readonly note: HTMLElement;
  private readonly rewardButton: HTMLButtonElement;

  constructor(root: HTMLElement, onReward: () => void) {
    this.slot = requireElement<HTMLElement>('[data-banner-slot]', root);
    this.note = requireElement<HTMLElement>('[data-banner-note]', root);
    this.rewardButton = requireElement<HTMLButtonElement>('[data-banner-reward]', root);
    this.rewardButton.addEventListener('click', onReward);
  }

  /** adFreeUntil = null → se muestran anuncios. */
  render(adFreeUntil: number | null): void {
    const adFree = adFreeUntil !== null;
    this.slot.hidden = adFree;
    this.rewardButton.hidden = adFree;
    this.note.hidden = !adFree;
    if (adFree) {
      const time = new Date(adFreeUntil).toLocaleTimeString('es', { hour: 'numeric', minute: '2-digit' });
      this.note.textContent = `Sin anuncios hasta las ${time}`;
    }
  }
}
