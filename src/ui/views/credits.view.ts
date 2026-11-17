import { escapeHtml } from '../dom.js';

export interface CreditsInfo {
  readonly appName: string;
  readonly version: string;
  readonly author: string;
  readonly contactEmail: string;
  readonly copyrightYear: number;
  readonly privacyUrl: string;
}

interface ThirdPartyCredit {
  readonly name: string;
  readonly url: string;
  readonly role: string;
  readonly license: string;
}

const THIRD_PARTY: readonly ThirdPartyCredit[] = [
  {
    name: 'Radio Browser',
    url: 'https://www.radio-browser.info',
    role: 'Directorio comunitario de emisoras (datos de dominio público)',
    license: 'API libre y gratuita',
  },
  {
    name: 'Google AdMob',
    url: 'https://admob.google.com',
    role: 'Anuncios en la app para Android',
    license: 'Servicio de Google',
  },
  {
    name: 'Capacitor',
    url: 'https://capacitorjs.com',
    role: 'Empaquetado de la app para Android',
    license: 'MIT',
  },
  {
    name: 'hls.js',
    url: 'https://github.com/video-dev/hls.js',
    role: 'Reproducción de streams HLS',
    license: 'Apache-2.0',
  },
  {
    name: 'Sora',
    url: 'https://fonts.google.com/specimen/Sora',
    role: 'Tipografía',
    license: 'SIL Open Font License 1.1',
  },
];

/** Pestaña "Créditos": autoría, terceros, aviso de contenido, privacidad y retiro de emisoras. */
export class CreditsView {
  constructor(private readonly root: HTMLElement) {}

  render(info: CreditsInfo): void {
    const e = escapeHtml;
    const mail = `<a href="mailto:${e(info.contactEmail)}">${e(info.contactEmail)}</a>`;
    const thirdParty = THIRD_PARTY.map(
      (c) => `
        <li>
          <a href="${e(c.url)}" target="_blank" rel="noopener noreferrer">${e(c.name)}</a>
          <span class="muted">${e(c.role)} · ${e(c.license)}</span>
        </li>`,
    ).join('');

    this.root.innerHTML = `
      <article class="credits">
        <header class="credits__hero">
          <p class="credits__app">${e(info.appName)} <span class="muted">v${e(info.version)}</span></p>
          <p class="muted">Creada y desarrollada por</p>
          <h2 class="credits__author">${e(info.author)}</h2>
          <p>${mail}</p>
        </header>

        <section>
          <h3>Software y datos de terceros</h3>
          <ul class="credits__list">${thirdParty}</ul>
          <p class="muted">${e(info.appName)} no está afiliada, patrocinada ni respaldada por Radio Browser ni por las emisoras que aparecen en la app.</p>
        </section>

        <section>
          <h3>Sobre las emisoras</h3>
          <p>${e(info.appName)} es un directorio: no aloja, graba ni retransmite audio. Al reproducir, tu dispositivo se conecta directamente al servidor público de cada emisora.</p>
          <p>Los nombres, logos y transmisiones pertenecen a sus respectivos dueños y se muestran solo para identificar cada emisora.</p>
          <p>¿Eres responsable de una emisora y no quieres aparecer? Escribe a ${mail} y la retiramos.</p>
        </section>

        <section>
          <h3>Privacidad</h3>
          <p>Tus favoritos se guardan solo en este dispositivo. No pedimos cuentas ni datos personales.</p>
          <p>Como en cualquier navegador, el servidor de cada emisora recibe tu dirección IP al conectarte. En la app, los anuncios los sirve Google AdMob, que puede usar el identificador de publicidad de tu dispositivo.</p>
          <p><a href="${e(info.privacyUrl)}" target="_blank" rel="noopener noreferrer">Política de privacidad completa</a></p>
        </section>

        <footer class="credits__footer muted">
          <p>© ${info.copyrightYear} ${e(info.author)}. Todos los derechos reservados.</p>
        </footer>
      </article>`;
  }
}
