# Onda Radio en Google Play

Paquete: `com.mariovasco.ondaradio` (no se puede cambiar después de la primera subida).

## 1. Llave de subida

La llave `onda-radio-upload.jks` (alias `upload`) firma cada versión que se sube a Google Play. **Nunca** va al repositorio. Guárdala en dos lugares seguros, junto con su contraseña. Con Play App Signing, Google guarda la llave final de la app; si pierdes la de subida, se puede reemplazar desde Play Console.

## 2. Secretos del repositorio

En **Settings → Secrets and variables → Actions**:

| Secreto | Valor |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | La llave en base64 |
| `ANDROID_KEYSTORE_PASSWORD` | Contraseña de la llave |
| `ANDROID_KEY_ALIAS` | `upload` |
| `ANDROID_KEY_PASSWORD` | La misma contraseña |
| `ADMOB_APP_ID` | Id de la app en AdMob (`ca-app-pub-…~…`) |
| `ADMOB_BANNER_ID` | Bloque de banner (`ca-app-pub-…/…`) |
| `ADMOB_INTERSTITIAL_ID` | Bloque intersticial |
| `ADMOB_REWARDED_ID` | Bloque recompensado |

Sin los secretos de AdMob, la app muestra los anuncios de prueba de Google.

## 3. Compilar

**Actions → Android → Run workflow**, o sube una etiqueta `v1.0.0`. En unos 10 minutos quedan para descargar:

- `app-release.aab`: el que se sube a Google Play.
- `app-release.apk`: para instalar directo en un Android.

El `versionCode` sube solo en cada ejecución.

## 4. Respuestas para Play Console

| Formulario | Respuesta |
| --- | --- |
| Tipo | App, gratis |
| Categoría | Música y audio |
| Política de privacidad | https://mariovasco24.github.io/ondas/privacidad.html |
| Acceso a la app | Todo disponible sin cuenta |
| Anuncios | Sí |
| Público objetivo | 18 años o más |
| App de noticias | No (reproduce emisoras de terceros, no publica noticias propias) |
| ID de publicidad | Sí, para publicidad (SDK de AdMob) |
| Servicio en primer plano | `mediaPlayback`: reproducción de radio iniciada por el usuario que sigue sonando con la pantalla apagada |
| Gobierno, salud, finanzas | No |

### Seguridad de los datos

La app no tiene cuentas ni servidores propios. Los favoritos se guardan solo en el teléfono.

| Tipo de dato | ¿Se recoge? | ¿Se comparte? | Para qué | Quién |
| --- | --- | --- | --- | --- |
| ID de dispositivo o de publicidad | Sí | Sí | Publicidad, análisis, prevención de fraude | AdMob |
| Interacciones con la app (anuncios) | Sí | Sí | Publicidad, análisis | AdMob |
| Diagnóstico (fallos) | Sí | No | Análisis | AdMob |
| Ubicación aproximada (por IP) | Sí | Sí | Publicidad | AdMob |

Cifrado en tránsito: sí. Borrado: no hay datos en servidores propios; el ID de publicidad se restablece desde Android.

## 5. Pruebas y producción

1. **Prueba interna**: subir el `.aab`, aceptar Play App Signing y compartir el enlace de tester.
2. **Prueba cerrada**: 12 testers durante 14 días seguidos (requisito de Google para cuentas personales nuevas).
3. **Solicitar acceso a producción** y lanzar por etapas.
