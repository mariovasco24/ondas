type QueryValue = string | number | boolean | undefined;

export class RadioBrowserUnavailableError extends Error {
  constructor(cause: unknown) {
    super('No se pudo conectar con el directorio de emisoras', { cause });
    this.name = 'RadioBrowserUnavailableError';
  }
}

/**
 * Cliente HTTP de Radio Browser con varios servidores espejo:
 * si uno falla, prueba el siguiente y recuerda el último que respondió.
 */
export class RadioBrowserClient {
  private preferredIndex = 0;

  constructor(
    private readonly mirrors: readonly string[],
    private readonly timeoutMs = 8000,
    private readonly fetchFn: typeof fetch = (input, init) => fetch(input, init),
  ) {
    if (mirrors.length === 0) throw new Error('Se necesita al menos un servidor de Radio Browser');
  }

  async getJson<T>(path: string, params: Record<string, QueryValue> = {}): Promise<T> {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) query.set(key, String(value));
    }
    const suffix = query.size > 0 ? `?${query.toString()}` : '';

    let lastError: unknown;
    for (let i = 0; i < this.mirrors.length; i++) {
      const index = (this.preferredIndex + i) % this.mirrors.length;
      try {
        const response = await this.fetchWithTimeout(`${this.mirrors[index]}${path}${suffix}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        this.preferredIndex = index;
        return (await response.json()) as T;
      } catch (error) {
        lastError = error;
      }
    }
    throw new RadioBrowserUnavailableError(lastError);
  }

  /** Petición sin esperar respuesta (estadísticas). Los errores se ignoran a propósito. */
  ping(path: string): void {
    this.fetchWithTimeout(`${this.mirrors[this.preferredIndex]}${path}`).catch(() => undefined);
  }

  private async fetchWithTimeout(url: string): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      return await this.fetchFn(url, { signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  }
}
