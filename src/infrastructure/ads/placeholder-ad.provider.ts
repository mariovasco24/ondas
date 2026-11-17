import type {
  FullScreenAdFormat,
  FullScreenAdProvider,
  FullScreenAdResult,
} from '../../application/ports.js';

export interface PlaceholderAdOptions {
  readonly interstitialSeconds: number;
  readonly rewardedSeconds: number;
  readonly rewardDescription: string;
}

/**
 * Simula intersticiales y videos recompensados en la versión web.
 * En la app nativa se reemplaza por un AdMobAdProvider con la misma interfaz.
 */
export class PlaceholderAdProvider implements FullScreenAdProvider {
  constructor(
    private readonly host: HTMLElement,
    private readonly options: PlaceholderAdOptions,
  ) {}

  show(format: FullScreenAdFormat): Promise<FullScreenAdResult> {
    const rewarded = format === 'rewarded';
    let remaining = rewarded ? this.options.rewardedSeconds : this.options.interstitialSeconds;
    let completed = false;

    const overlay = document.createElement('div');
    overlay.className = 'overlay overlay--center';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Anuncio');
    overlay.innerHTML = `
      <div class="ad-full">
        <div class="ad-full__top">
          <span>${rewarded ? 'Video con recompensa' : 'Anuncio'}</span>
          <button class="btn btn--ghost" data-close></button>
        </div>
        <div class="ad-slot ad-slot--tall">${rewarded ? 'Video recompensado' : 'Intersticial'}<small>AdMob · ${rewarded ? 'Rewarded' : 'Interstitial'}</small></div>
        <p class="muted">${rewarded ? '' : 'La radio sigue sonando más bajito.'}</p>
      </div>`;
    const description = overlay.querySelector('p');
    if (description && rewarded) description.textContent = this.options.rewardDescription;

    const button = overlay.querySelector<HTMLButtonElement>('[data-close]');
    if (!button) return Promise.resolve({ completed: false });

    const label = (): string => {
      if (rewarded) return completed ? '✓ Listo' : `Saltar (${remaining})`;
      return completed ? 'Cerrar ✕' : String(remaining);
    };
    button.disabled = !rewarded;
    button.textContent = label();
    this.host.appendChild(overlay);
    button.focus();

    return new Promise((resolve) => {
      const timer = setInterval(() => {
        remaining -= 1;
        if (remaining <= 0) {
          completed = true;
          clearInterval(timer);
          button.disabled = false;
        }
        button.textContent = label();
      }, 1000);

      button.addEventListener(
        'click',
        () => {
          clearInterval(timer);
          overlay.remove();
          resolve({ completed });
        },
        { once: true },
      );
    });
  }
}
