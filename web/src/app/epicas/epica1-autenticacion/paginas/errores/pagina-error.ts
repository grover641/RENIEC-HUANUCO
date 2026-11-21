import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icono } from '../../../../compartido/componentes/icono/icono';
import { SesionService } from '../../../../nucleo/sesion/sesion.service';

/** HU-16 · Páginas de error 403 (acceso denegado) y 404 (no encontrada), con ilustración del ticket. */
@Component({
  selector: 'app-pagina-error',
  imports: [RouterLink, Icono],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="contenedor error">
      <svg viewBox="0 0 360 240" class="ilustracion" aria-hidden="true">
        <ellipse cx="175" cy="222" rx="160" ry="12" fill="#E3E8EF" />
        <path d="M20 22h330v40a22 22 0 0 0 0 44v40H20v-40a22 22 0 0 0 0-44z" fill="#fff" stroke="#C9D6E8" stroke-width="3" />
        <path d="M128 30v116" stroke="#C9D6E8" stroke-width="3" stroke-dasharray="7 7" />
        <path d="M58 70h40M58 88h30" stroke="#A9C1E3" stroke-width="7" stroke-linecap="round" />
        <text x="238" y="114" text-anchor="middle" font-family="Nunito Sans, sans-serif" font-size="76" font-weight="900" fill="#0B4F9C">{{ codigo() }}</text>
        @if (codigo() === 403) {
          <path d="M272 150v-24a28 28 0 0 1 56 0v24" fill="none" stroke="#0A2342" stroke-width="10" />
          <rect x="258" y="146" width="84" height="68" rx="12" fill="#B0123E" />
          <circle cx="300" cy="174" r="9" fill="#fff" /><rect x="296" y="178" width="8" height="18" rx="3" fill="#fff" />
        } @else {
          <circle cx="292" cy="170" r="30" fill="none" stroke="#0A2342" stroke-width="10" />
          <path d="M314 192l26 26" stroke="#0A2342" stroke-width="12" stroke-linecap="round" />
        }
      </svg>
      <div>
        <span class="insignia insignia-guinda">Error {{ codigo() }}</span>
        <h1>{{ codigo() === 403 ? 'Acceso denegado' : 'No encontramos esta página' }}</h1>
        <p>{{ codigo() === 403
          ? 'No tienes permiso para ver esta página. Si eres personal de la sede, ingresa con tu cuenta de operador o de administrador.'
          : 'La dirección no existe o cambió. Revisa el enlace o vuelve al inicio.' }}</p>
        <div class="fila">
          <a class="btn btn-primario" [routerLink]="sesion.usuario() ? sesion.rutaInicio() : '/'"><app-icono nombre="home" [tam]="18" />Ir al inicio</a>
          @if (codigo() === 403) {
            <button type="button" class="btn btn-secundario" (click)="otraCuenta()"><app-icono nombre="log-in" [tam]="18" />Ingresar con otra cuenta</button>
          }
        </div>
        <p class="texto-sm texto-2 atajos">También puedes ir a:
          <a routerLink="/consulta/dni">¿Mi DNI está listo?</a> <a routerLink="/consulta/turno">Mi turno</a> <a routerLink="/" fragment="ayuda">Ayuda</a></p>
      </div>
    </section>`,
  styles: `
    :host { display: block; background: var(--fondo); }
    .error { min-height: 62vh; display: grid; grid-template-columns: 1fr 1fr; align-items: center; gap: 48px; padding-top: 64px; padding-bottom: 64px; }
    .ilustracion { width: 100%; max-width: 380px; justify-self: center; }
    h1 { margin: 14px 0 12px; font-size: 40px; }
    p { color: var(--texto-3); font-size: 17px; margin-bottom: 22px; max-width: 520px; }
    .atajos a { margin-left: 12px; font-weight: 700; }
    @media (max-width: 800px) { .error { grid-template-columns: 1fr; text-align: left; gap: 24px; } .ilustracion { max-width: 280px; } }
  `,
})
export class PaginaError {
  readonly codigo = input<403 | 404>(404);
  protected readonly sesion = inject(SesionService);
  protected otraCuenta(): void { this.sesion.cerrar(); }
}
