#!/usr/bin/env node
/**
 * Aplica la configuración de Onda Radio al proyecto Android que genera `npx cap add android`.
 * Es idempotente (correrlo dos veces da el mismo resultado). Lo usa el workflow de Android.
 *
 * Variables de entorno:
 *   ADMOB_APP_ID           id de la app en AdMob (por defecto, el de prueba de Google)
 *   VERSION_CODE           entero que debe crecer en cada subida a Google Play
 *   ANDROID_KEYSTORE_PATH  + ANDROID_KEYSTORE_PASSWORD, ANDROID_KEY_ALIAS, ANDROID_KEY_PASSWORD
 *                          los lee Gradle al compilar para firmar (nunca van al repositorio)
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.argv[2] ?? 'android';
const TEST_ADMOB_APP_ID = 'ca-app-pub-3940256099942544~3347511713';
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const admobAppId = process.env.ADMOB_APP_ID || TEST_ADMOB_APP_ID;
const versionCode = Number.parseInt(process.env.VERSION_CODE ?? '1', 10);
if (!Number.isInteger(versionCode) || versionCode < 1) throw new Error(`VERSION_CODE inválido: ${process.env.VERSION_CODE}`);

const path = (p) => join(root, p);
const edit = (file, fn) => {
  if (!existsSync(path(file))) throw new Error(`No existe ${path(file)}: ¿corriste "npx cap add android"?`);
  const before = readFileSync(path(file), 'utf8');
  const after = fn(before);
  if (after !== before) writeFileSync(path(file), after);
  console.log(`${after !== before ? '✔ actualizado' : '· sin cambios'} ${file}`);
};
const must = (s, needle, what) => {
  if (!s.includes(needle)) throw new Error(`No encontré ${what}; la plantilla de Capacitor cambió.`);
  return s;
};

// Reproducción en segundo plano: el plugin de Media Session mantiene un servicio en primer plano.
const PERMISSIONS = [
  'android.permission.FOREGROUND_SERVICE',
  'android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK',
  'android.permission.WAKE_LOCK',
  'android.permission.POST_NOTIFICATIONS',
];

// 1) Permisos e id de AdMob
edit('app/src/main/AndroidManifest.xml', (s) => {
  must(s, '</application>', '</application>');
  const internet = '<uses-permission android:name="android.permission.INTERNET" />';
  must(s, internet, 'el permiso de INTERNET');
  for (const permission of PERMISSIONS) {
    if (!s.includes(`"${permission}"`)) {
      s = s.replace(internet, `${internet}\n    <uses-permission android:name="${permission}" />`);
    }
  }
  if (!s.includes('com.google.android.gms.ads.APPLICATION_ID')) {
    s = s.replace(
      '</application>',
      '    <meta-data\n            android:name="com.google.android.gms.ads.APPLICATION_ID"\n            android:value="@string/admob_app_id" />\n    </application>',
    );
  }
  return s;
});

edit('app/src/main/res/values/strings.xml', (s) => {
  const line = `<string name="admob_app_id">${admobAppId}</string>`;
  if (/<string name="admob_app_id">[^<]*<\/string>/.test(s)) return s.replace(/<string name="admob_app_id">[^<]*<\/string>/, line);
  return must(s, '</resources>', '</resources>').replace('</resources>', `    ${line}\n</resources>`);
});

// 2) Versión y firma de la versión de tienda desde variables de entorno
edit('app/build.gradle', (s) => {
  s = s.replace(/versionCode \d+/, `versionCode ${versionCode}`);
  s = s.replace(/versionName "[^"]*"/, `versionName "${pkg.version}"`);
  if (!s.includes('signingConfigs {')) {
    must(s, '    buildTypes {', 'buildTypes');
    s = s.replace(
      '    buildTypes {',
      [
        '    signingConfigs {',
        '        release {',
        '            def keystore = System.getenv("ANDROID_KEYSTORE_PATH")',
        '            if (keystore) {',
        '                storeFile file(keystore)',
        '                storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD")',
        '                keyAlias System.getenv("ANDROID_KEY_ALIAS")',
        '                keyPassword System.getenv("ANDROID_KEY_PASSWORD")',
        '            }',
        '        }',
        '    }',
        '    buildTypes {',
      ].join('\n'),
    );
    s = s.replace(
      /( {8}release \{\n)( {12}minifyEnabled)/,
      '$1            if (System.getenv("ANDROID_KEYSTORE_PATH")) signingConfig signingConfigs.release\n$2',
    );
    must(s, 'signingConfig signingConfigs.release', 'el bloque release de buildTypes');
  }
  return s;
});

console.log(`Listo: versión ${pkg.version} (${versionCode}), AdMob ${admobAppId === TEST_ADMOB_APP_ID ? 'de prueba' : 'real'}.`);
