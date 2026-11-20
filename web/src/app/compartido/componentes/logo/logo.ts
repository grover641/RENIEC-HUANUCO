import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Logo propio de CitaRENIEC Huánuco (diseño original del equipo, nov. 2026).
 * Dos personas, una guinda (el ciudadano) y una gris (el personal
 * de la sede), forman el arco del Puente Calicanto. No usa ni imita el logo oficial de RENIEC.
 * - Fondo claro: versión a color (guinda #B0123E y gris #6B7280).
 * - Fondo oscuro (`oscuro`): versión en negativo (blanco y gris claro #D5DAE1).
 */
@Component({
  selector: 'app-logo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="logo" [style.gap.px]="tam() * 0.2">
      <svg [attr.width]="tam()" [attr.height]="tam()" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
        <circle cx="18.25" cy="15.5" r="8" [attr.fill]="colores().a" />
        <path d="M5.75 54.5V39.5A12.5 12.5 0 0 1 30.75 39.5V44.58A10 10 0 0 0 22 54.5Z" [attr.fill]="colores().a" />
        <circle cx="45.75" cy="15.5" r="8" [attr.fill]="colores().b" />
        <path d="M58.25 54.5V39.5A12.5 12.5 0 0 0 33.25 39.5V44.58A10 10 0 0 1 42 54.5Z" [attr.fill]="colores().b" />
      </svg>
      <span class="logo-texto" [style.gap.px]="Math.max(3, tam() * 0.1)">
        <span class="logo-nombre" [style.font-size.px]="tam() * 0.5"><span [style.color]="colores().a">Cita</span><span [style.color]="colores().b">RENIEC</span></span>
        @if (sub()) { <span class="logo-sub" [style.font-size.px]="Math.max(9, tam() * 0.17)" [style.color]="colores().b">HUÁNUCO</span> }
      </span>
    </span>`,
  styles: `
    .logo { display: inline-flex; align-items: center; line-height: 1; white-space: nowrap; font-family: var(--fuente-titulo); }
    .logo svg { flex-shrink: 0; }
    .logo-texto { display: flex; flex-direction: column; }
    .logo-nombre { font-weight: 900; letter-spacing: -.01em; }
    .logo-sub { font-weight: 800; letter-spacing: .26em; }
  `,
})
export class Logo {
  /** Tamaño del símbolo en px (mínimo 32 con «HUÁNUCO», 24 sin él). */
  readonly tam = input(40);
  /** true sobre fondos oscuros (azul noche, foto con velo, TV). */
  readonly oscuro = input(false);
  /** Muestra «HUÁNUCO» debajo del nombre. */
  readonly sub = input(true);
  protected readonly Math = Math;
  protected readonly colores = computed(() => (this.oscuro() ? { a: '#FFFFFF', b: '#D5DAE1' } : { a: '#B0123E', b: '#6B7280' }));
}
