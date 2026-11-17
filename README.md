# Onda Radio — Radio del mundo

App de radio con un feed tipo swipe: cada emisora ocupa la pantalla y suena al deslizar. Tiene filtros por mood, país y género, búsqueda, favoritos y espacios de anuncios listos para AdMob. Los datos vienen de la API abierta de [Radio Browser](https://www.radio-browser.info).

Creada y desarrollada por **Mario David Vasco Villareal** (contacto@mariovasco.me).

## Cómo usarlo

```bash
npm install
npm test          # pruebas unitarias
npm run build     # genera dist/ (web)
npm run serve     # sirve dist/ en local
```

La app de Android se compila en GitHub Actions (`.github/workflows/android.yml`). Guía de publicación: [docs/PLAY_STORE.md](docs/PLAY_STORE.md).

Cada push a `main` ejecuta las pruebas y publica `dist/` en GitHub Pages (`.github/workflows/deploy.yml`). En **Settings → Pages**, la fuente debe ser **GitHub Actions**.

## Arquitectura

Capas con dependencias hacia adentro (Clean Architecture):

```
src/
├── domain/          Modelos puros: Station, StationFilter. Sin dependencias.
├── application/     Casos de uso y reglas: feed, favoritos, reproducción, política de anuncios.
│   └── ports.ts     Interfaces que la aplicación necesita (repositorios, reproductor, anuncios...).
├── infrastructure/  Implementaciones de los puertos: Radio Browser, <audio> + hls.js,
│                    localStorage, Media Session, anuncios de prueba.
├── ui/              Vistas y componentes. AppController conecta vistas con servicios.
├── platform/        Elige implementaciones web o nativas (AdMob, Media Session de Android).
├── shared/          Utilidades puras (banderas, colores, normalización de texto).
├── config/          Configuración central (anuncios, moods, géneros, servidores, bloqueos).
└── main.ts          Composition root: único lugar donde se crean las clases concretas.
```

Cómo se aplican los principios SOLID:

- **S**: cada clase tiene una sola razón para cambiar. `AdPolicy` decide *cuándo* mostrar un anuncio y `FullScreenAdProvider` decide *cómo*. `StationFeedService` pagina y `FeedView` solo pinta.
- **O**: la app nativa usa `AdMobAdProvider` y la web `PlaceholderAdProvider`, ambos detrás de `FullScreenAdProvider`; la lógica no cambia.
- **L**: cualquier implementación de un puerto (por ejemplo `MemoryStore` o `LocalStorageStore`) se puede usar en lugar de otra.
- **I**: las interfaces son pequeñas y específicas: `StationRepository`, `PlayTracker`, `CountryRepository`.
- **D**: la aplicación depende de interfaces (`ports.ts`), nunca de `fetch`, `localStorage` ni del DOM.

## Anuncios

Las frecuencias se ajustan en `AD_POLICY` (`src/config/app.config.ts`):

- Un anuncio nativo dentro del feed cada 8 emisoras.
- Un banner fijo abajo.
- Un video recompensado que da 2 horas sin anuncios.
- Un intersticial solo a partir del 2.º cambio de filtro, como máximo uno cada 4 minutos.
- La radio nunca se corta: durante un anuncio solo baja el volumen.

## Aspectos legales

- Onda Radio es un directorio: no aloja, graba ni retransmite audio. El dispositivo se conecta directamente a cada emisora.
- La pestaña **Créditos** muestra autoría, terceros, el aviso de contenido, la privacidad y cómo pedir el retiro de una emisora.
- Las emisoras retiradas a petición de sus dueños se agregan a `BLOCKED_STATION_IDS`.
- Licencias de terceros: [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Licencia del proyecto: [LICENSE](LICENSE).

## App de Android

- Capacitor 8 con `@capacitor-community/admob` (banner, intersticial y recompensado) y `@capgo/capacitor-media-session` (notificación, pantalla de bloqueo y reproducción con la pantalla apagada).
- En la app no hay tarjetas de anuncio dentro del feed: el plugin de AdMob no ofrece anuncios nativos.
- Política de privacidad: https://mariovasco24.github.io/ondas/privacidad.html
