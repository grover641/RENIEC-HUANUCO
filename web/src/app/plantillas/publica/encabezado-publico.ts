import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SesionService } from '../../nucleo/sesion/sesion.service';
import { Icono } from '../../compartido/componentes/icono/icono';
import { Logo } from '../../compartido/componentes/logo/logo';
import { SEDE } from '../../datos/semilla';

@Component({
  selector: 'app-encabezado-publico',
  imports: [RouterLink, Icono, Logo],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header>
      <div class="franja">
        <div class="contenedor franja-int">
          <span><app-icono nombre="info" [tam]="15" />Proyecto académico · Universidad de Huánuco. No es un sitio oficial de RENIEC.</span>
          <span class="solo-pc"><app-icono nombre="clock" [tam]="15" />Atención de {{ horario }}</span>
        </div>
      </div>
      <div class="contenedor barra">
        <a routerLink="/" aria-label="CitaRENIEC Huánuco, ir al inicio"><app-logo [tam]="40" /></a>
        <button type="button" class="btn btn-icono menu-movil" (click)="abierto.set(!abierto())" [attr.aria-expanded]="abierto()" aria-label="Abrir menú">
          <app-icono [nombre]="abierto() ? 'x' : 'menu'" />
        </button>
        <div class="derecha" [class.abierto]="abierto()">
          <nav aria-label="Principal">
            <a routerLink="/" fragment="tramites" (click)="abierto.set(false)">Trámites</a>
            <a routerLink="/" fragment="como-funciona" (click)="abierto.set(false)">¿Cómo funciona?</a>
            <a routerLink="/" fragment="sedes" (click)="abierto.set(false)">Sedes</a>
            <a routerLink="/" fragment="ayuda" (click)="abierto.set(false)">Ayuda</a>
          </nav>
          <div class="fila">
            @if (sesion.usuario()) {
              <a class="btn btn-primario" [routerLink]="sesion.rutaInicio()"><app-icono nombre="user" [tam]="18" />Ir a mi espacio</a>
            } @else {
              <a class="btn btn-secundario" routerLink="/ingresar"><app-icono nombre="log-in" [tam]="18" />Ingresar</a>
              <a class="btn btn-primario" routerLink="/registro">Crear cuenta</a>
            }
          </div>
        </div>
      </div>
    </header>`,
  styles: `
    header { background: #fff; box-shadow: 0 1px 0 var(--borde); position: relative; z-index: 10; }
    .franja { background: var(--pie); color: #DCE6F5; font-size: 13px; }
    .franja-int { display: flex; justify-content: space-between; gap: 6px 24px; flex-wrap: wrap; padding-top: 8px; padding-bottom: 8px; }
    .franja span { display: inline-flex; align-items: center; gap: 8px; }
    .barra { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding-top: 14px; padding-bottom: 14px; }
    .barra > a { text-decoration: none; }
    .derecha { display: flex; align-items: center; gap: 12px 36px; flex-wrap: wrap; }
    nav { display: flex; gap: 4px 28px; font-size: 15px; font-weight: 600; flex-wrap: wrap; }
    nav a { color: var(--texto); text-decoration: none; padding: 10px 0; }
    nav a:hover { color: var(--primario); }
    .menu-movil { display: none; }
    @media (max-width: 900px) {
      .solo-pc { display: none !important; }
      .menu-movil { display: inline-flex; }
      .derecha { display: none; position: absolute; left: 0; right: 0; top: 100%; background: #fff; padding: 12px 16px 18px; border-bottom: 1px solid var(--borde); flex-direction: column; align-items: stretch; box-shadow: var(--sombra); }
      .derecha.abierto { display: flex; }
      nav { flex-direction: column; gap: 0; }
      .derecha .fila .btn { flex: 1; }
    }
  `,
})
export class EncabezadoPublico {
  /** Con sesión abierta, el encabezado lleva a su espacio en lugar de «Ingresar» y «Crear cuenta». */
  protected readonly sesion = inject(SesionService);
  protected readonly horario = SEDE.horario.toLowerCase();
  protected readonly abierto = signal(false);
}
