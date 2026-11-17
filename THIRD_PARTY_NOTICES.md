# Avisos de terceros

Onda Radio usa los siguientes servicios y componentes de terceros. Cada uno conserva su propia licencia.

| Componente | Uso en Onda Radio | Licencia |
| --- | --- | --- |
| [Radio Browser](https://www.radio-browser.info) | Directorio de emisoras (nombre, país, etiquetas, URL del stream) | Datos de dominio público; API libre y gratuita |
| [Google AdMob](https://admob.google.com) | Anuncios en la app de Android | Servicio de Google, sujeto a sus términos |
| [Capacitor](https://capacitorjs.com) | Empaquetado para Android | MIT |
| [@capacitor-community/admob](https://github.com/capacitor-community/admob) | Conexión con AdMob | MIT |
| [@capgo/capacitor-media-session](https://github.com/Cap-go/capacitor-media-session) | Controles de reproducción y audio en segundo plano | MIT |
| [hls.js](https://github.com/video-dev/hls.js) | Reproducción de streams HLS (`.m3u8`) | Apache License 2.0 |
| [Sora](https://fonts.google.com/specimen/Sora) | Tipografía, servida por Google Fonts | SIL Open Font License 1.1 |

## Contenido de las emisoras

Onda Radio funciona como un directorio: no aloja, graba ni retransmite audio. Al reproducir, el dispositivo del usuario se conecta directamente al servidor público de cada emisora. Los nombres, logos y transmisiones pertenecen a sus respectivos dueños y se muestran solo para identificar cada emisora.

Onda Radio no está afiliada, patrocinada ni respaldada por Radio Browser ni por las emisoras listadas.

Si eres responsable de una emisora y quieres que no aparezca en Onda Radio, escribe a contacto@mariovasco.me. Las emisoras retiradas se agregan a `BLOCKED_STATION_IDS` en `src/config/app.config.ts`.
