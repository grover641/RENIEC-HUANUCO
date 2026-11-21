import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icono } from '../../compartido/componentes/icono/icono';
import { Logo } from '../../compartido/componentes/logo/logo';
import { SEDE } from '../../datos/semilla';

@Component({
  selector: 'app-pie-publico',
  imports: [RouterLink, Icono, Logo],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer id="ayuda">
      <div class="contenedor columnas">
        <div>
          <app-logo [tam]="36" [oscuro]="true" />
          <p class="lema">Menos colas, más tiempo para ti</p>
          <p class="texto">Reserva tu cita, sigue tu turno en vivo y recibe avisos por WhatsApp o SMS.</p>
        </div>
        <div>
          <h4>Atención presencial</h4>
          <p><app-icono nombre="map-pin" [tam]="16" />{{ sede.nombre }} · {{ sede.direccion }}</p>
          <p><app-icono nombre="clock" [tam]="16" />{{ sede.horario }}</p>
        </div>
        <div>
          <h4>Canales de contacto <span class="demo">datos de ejemplo</span></h4>
          <p><app-icono nombre="phone" [tam]="16" />Teléfono: {{ sede.telefono }}</p>
          <p><app-icono nombre="mail" [tam]="16" />Correo: {{ sede.correo }}</p>
          <p><app-icono nombre="message" [tam]="16" />WhatsApp: {{ sede.whatsapp }}</p>
        </div>
        <div>
          <h4>Información</h4>
          <a routerLink="/privacidad">Política de privacidad (Ley N.º 29733)</a>
          <a routerLink="/privacidad" fragment="terminos">Términos y condiciones</a>
          <a routerLink="/" fragment="como-funciona">Centro de ayuda</a>
          <a routerLink="/" fragment="como-funciona">Preguntas frecuentes</a>
        </div>
      </div>
      <div class="contenedor legal">
        <span>© 2026 CitaRENIEC Huánuco · Grupo G1 «Equipo Maravilla» · Gestión de Proyectos II, Universidad de Huánuco</span>
        <span>Proyecto académico. No es un sitio oficial de RENIEC.</span>
      </div>
    </footer>`,
  styles: `
    footer { background: var(--pie); color: #C9D6E8; padding-top: 44px; font-size: 14px; }
    .columnas { display: grid; grid-template-columns: 1.2fr 1fr 1fr 1fr; gap: 32px; padding-bottom: 32px; }
    h4 { color: #fff; font-size: 13px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; margin-bottom: 14px; display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
    .demo { font-size: 11px; letter-spacing: 0; text-transform: none; font-weight: 700; background: rgba(255,255,255,.12); color: #DCE6F5; padding: 2px 8px; border-radius: 999px; }
    p { display: flex; gap: 10px; align-items: flex-start; margin-bottom: 12px; }
    p app-icono { margin-top: 2px; color: #8FB3E0; }
    .lema { color: #fff; font-weight: 800; font-size: 17px; margin: 18px 0 10px; display: block; }
    .texto { display: block; }
    a { display: block; color: #E8EEF7; text-decoration: none; margin-bottom: 12px; }
    a:hover { text-decoration: underline; }
    .legal { display: flex; justify-content: space-between; gap: 8px 24px; flex-wrap: wrap; padding-top: 18px; padding-bottom: 22px; border-top: 1px solid rgba(255,255,255,.12); font-size: 13px; }
    @media (max-width: 900px) { .columnas { grid-template-columns: 1fr 1fr; } }
    @media (max-width: 560px) { .columnas { grid-template-columns: 1fr; } }
  `,
})
export class PiePublico {
  protected readonly sede = SEDE;
}
