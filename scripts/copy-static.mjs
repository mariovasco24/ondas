// Copia los archivos estáticos (HTML, CSS) junto al JavaScript compilado.
import { cpSync } from 'node:fs';

cpSync('public', 'dist', { recursive: true });
cpSync('LICENSE', 'dist/LICENSE.txt');
cpSync('THIRD_PARTY_NOTICES.md', 'dist/THIRD_PARTY_NOTICES.md');
console.log('Build listo en dist/');
