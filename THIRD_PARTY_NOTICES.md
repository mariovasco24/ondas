# Avisos de terceros

Ondas usa los siguientes servicios y componentes de terceros. Cada uno conserva su propia licencia.

| Componente | Uso en Ondas | Licencia |
| --- | --- | --- |
| [Radio Browser](https://www.radio-browser.info) | Directorio de emisoras (nombre, país, etiquetas, URL del stream) | Datos de dominio público; API libre y gratuita |
| [hls.js](https://github.com/video-dev/hls.js) | Reproducción de streams HLS (`.m3u8`) | Apache License 2.0 |
| [Sora](https://fonts.google.com/specimen/Sora) | Tipografía, servida por Google Fonts | SIL Open Font License 1.1 |

## Contenido de las emisoras

Ondas funciona como un directorio: no aloja, graba ni retransmite audio. Al reproducir, el dispositivo del usuario se conecta directamente al servidor público de cada emisora. Los nombres, logos y transmisiones pertenecen a sus respectivos dueños y se muestran solo para identificar cada emisora.

Ondas no está afiliada, patrocinada ni respaldada por Radio Browser ni por las emisoras listadas.

Si eres responsable de una emisora y quieres que no aparezca en Ondas, escribe a contacto@mariovasco.me. Las emisoras retiradas se agregan a `BLOCKED_STATION_IDS` en `src/config/app.config.ts`.
