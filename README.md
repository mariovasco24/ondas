# Ondas — Radio del mundo

Prototipo web de una app de radio con feed tipo swipe (una emisora por pantalla), filtros por mood, país y género, búsqueda y favoritos. Los datos vienen de la API abierta de [Radio Browser](https://www.radio-browser.info).

## Probarlo

Abre `index.html` en Chrome o publícalo con GitHub Pages (Settings → Pages → rama `main`, carpeta `/ (root)`). Toca ▶ en la pantalla de inicio: los navegadores no reproducen audio sin un toque primero.

## Anuncios

Los anuncios son marcadores de posición pensados para AdMob. Las frecuencias se ajustan en el objeto `ADS` del script:

- Nativo dentro del feed cada 8 emisoras.
- Banner fijo abajo.
- Rewarded: 2 horas sin anuncios.
- Intersticial solo desde el 2.º cambio de filtro, máximo uno cada 4 minutos.
- La radio nunca se corta: durante un anuncio solo baja el volumen.

## Siguiente paso

Empaquetar con Capacitor, usar `@capacitor-community/admob` para los anuncios reales y un plugin de audio en segundo plano.
