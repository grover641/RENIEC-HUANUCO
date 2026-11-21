import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icono } from '../../../../compartido/componentes/icono/icono';
import { mensajeDe } from '../../../../nucleo/api/api-error';
import { TramiteDni } from '../../../../nucleo/modelos';
import { consultarPorDni, EXPLICACION, NOMBRE_ESTADO, ORDEN_ESTADOS } from '../../api/dni.api';
import { LineaDni } from '../../componentes/linea-dni/linea-dni';

/** Consulta pública «¿Mi DNI está listo?» con el DNI, sin iniciar sesión (incluida en T14.4 · HU-14). */
@Component({
  selector: 'app-consulta-dni',
  imports: [RouterLink, Icono, LineaDni],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="contenedor pagina">
      <nav class="migas texto-sm"><a routerLink="/">Inicio</a><app-icono nombre="chevron-right" [tam]="14" />¿Mi DNI está listo?</nav>
      <h1>¿Mi DNI está listo?</h1>
      <p class="texto-3 sub">Consulta el estado de tu trámite con tu número de DNI. No necesitas iniciar sesión.</p>
      <form class="tarjeta form" (submit)="consultar($event)" novalidate>
        <label for="cd-dni" class="etiqueta">Número de DNI</label>
        <div class="fila" style="flex-wrap:nowrap">
          <input id="cd-dni" class="entrada" inputmode="numeric" maxlength="8" placeholder="8 dígitos, ej.: 46880452" [value]="dni()" (input)="dni.set($any($event.target).value.replace(/\D/g, ''))" />
          <button type="submit" class="btn btn-primario" [disabled]="cargando()">@if (cargando()) { <span class="girando"></span> } @else { <app-icono nombre="search" [tam]="18" /> } Consultar</button>
        </div>
        <p class="texto-xs texto-2"><app-icono nombre="shield-check" [tam]="13" /> Solo mostramos el estado del trámite. Tus datos se ven enmascarados (Ley N.º 29733). Prueba con 46880452 o 47330915.</p>
      </form>
      @if (error()) { <div class="aviso aviso-error"><app-icono nombre="x-circle" /><div>{{ error() }}</div></div> }
      @if (consultado()) {
        @if (resultado(); as t) {
          <section class="tarjeta"><app-linea-dni [tramite]="t" enlaceRecojo="/ingresar" /></section>
        } @else {
          <div class="aviso aviso-info"><app-icono nombre="info" /><div><strong>No encontramos un trámite con ese DNI</strong>Si hiciste tu trámite hace poco, puede tardar en aparecer. También puedes reservar una cita.</div></div>
        }
      }
      <section class="tarjeta significado">
        <h3>¿Qué significa cada estado?</h3>
        <div class="rejilla-4">@for (e of estados; track e) { <div><b>{{ nombre[e] }}</b><p>{{ explicacion[e] }}</p></div> }</div>
      </section>
    </div>`,
  styles: `
    :host { display: block; background: var(--fondo); }
    .pagina { padding-top: 32px; padding-bottom: 56px; max-width: 900px; }
    .migas { display: flex; align-items: center; gap: 6px; color: var(--texto-2); margin-bottom: 10px; } .migas a { font-weight: 700; text-decoration: none; }
    .sub { margin: 6px 0 18px; } .form { margin-bottom: 18px; display: flex; flex-direction: column; gap: 8px; } .form .entrada { flex: 1; }
    .significado { margin-top: 18px; } .significado b { color: var(--titulo); } .significado p { font-size: 14px; color: var(--texto-3); }
    .significado h3 { margin-bottom: 12px; } .aviso { margin-bottom: 18px; }
  `,
})
export class ConsultaDni {
  readonly dniInicial = input<string>('', { alias: 'dni' });
  protected readonly dni = signal('');
  protected readonly resultado = signal<TramiteDni | null>(null);
  protected readonly consultado = signal(false);
  protected readonly cargando = signal(false);
  protected readonly error = signal('');
  protected readonly estados = ORDEN_ESTADOS;
  protected readonly nombre = NOMBRE_ESTADO;
  protected readonly explicacion = EXPLICACION;

  constructor() {
    queueMicrotask(() => { const d = this.dniInicial(); if (d) { this.dni.set(d); void this.consultar(); } });
  }

  protected async consultar(ev?: Event): Promise<void> {
    ev?.preventDefault();
    this.cargando.set(true); this.error.set('');
    try { this.resultado.set(await consultarPorDni(this.dni())); this.consultado.set(true); }
    catch (e) { this.error.set(mensajeDe(e)); this.consultado.set(false); }
    finally { this.cargando.set(false); }
  }
}
