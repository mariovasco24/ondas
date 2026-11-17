const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Todo texto que viene de la API pasa por aquí antes de entrar al HTML. */
export function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (char) => HTML_ESCAPES[char] ?? char);
}

export function requireElement<T extends Element>(selector: string, root: ParentNode = document): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`No se encontró el elemento "${selector}"`);
  return element;
}

export function htmlToElements(html: string): Element[] {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return [...template.content.children];
}

/** Elemento dentro de un evento, o null si el objetivo no es un Element. */
export function closestFromEvent<T extends Element>(event: Event, selector: string): T | null {
  return event.target instanceof Element ? event.target.closest<T>(selector) : null;
}
