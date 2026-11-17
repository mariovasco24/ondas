import { escapeHtml, requireElement } from '../dom.js';

/** Hoja inferior reutilizable (búsqueda, países). Solo una abierta a la vez. */
export class Sheet {
  private overlay: HTMLElement | null = null;

  constructor(private readonly host: HTMLElement) {
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') this.close();
    });
  }

  get isOpen(): boolean {
    return this.overlay !== null;
  }

  /** Abre la hoja y devuelve su contenedor para que el llamador lo llene. */
  open(title: string, bodyHtml: string): HTMLElement {
    this.close();
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.innerHTML = `
      <div class="sheet" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}">
        <header class="sheet__header">
          <h3>${escapeHtml(title)}</h3>
          <button class="icon-btn" data-close type="button" aria-label="Cerrar">✕</button>
        </header>
        <div class="sheet__body">${bodyHtml}</div>
      </div>`;
    overlay.addEventListener('click', (event) => {
      const target = event.target;
      if (target === overlay || (target instanceof Element && target.closest('[data-close]'))) this.close();
    });
    this.host.appendChild(overlay);
    this.overlay = overlay;
    return requireElement<HTMLElement>('.sheet__body', overlay);
  }

  close(): void {
    this.overlay?.remove();
    this.overlay = null;
  }
}
