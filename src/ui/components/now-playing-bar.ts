import type { PlayerState } from '../../application/ports.js';
import type { Station } from '../../domain/station.js';
import { requireElement } from '../dom.js';

/** Mini reproductor visible fuera del feed (Favoritos, Créditos). */
export class NowPlayingBar {
  private readonly name: HTMLElement;
  private readonly button: HTMLButtonElement;

  constructor(private readonly root: HTMLElement, onToggle: () => void) {
    this.name = requireElement<HTMLElement>('[data-now-playing-name]', root);
    this.button = requireElement<HTMLButtonElement>('[data-now-playing-toggle]', root);
    this.button.addEventListener('click', onToggle);
  }

  render(station: Station | null, state: PlayerState, visible: boolean): void {
    this.root.hidden = !visible || !station;
    if (!station) return;
    this.name.textContent = station.name;
    this.button.textContent = state === 'playing' || state === 'loading' ? '❚❚' : '▶';
  }
}
