export class Toast {
  private element: HTMLElement | null = null;
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor(private readonly host: HTMLElement) {}

  show(message: string, durationMs = 2600): void {
    this.element?.remove();
    clearTimeout(this.timer);
    const element = document.createElement('div');
    element.className = 'toast';
    element.setAttribute('role', 'status');
    element.textContent = message;
    this.host.appendChild(element);
    this.element = element;
    this.timer = setTimeout(() => element.remove(), durationMs);
  }
}
