import { ChangeDetectionStrategy, Component, OnDestroy, computed, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icono } from '../../../../compartido/componentes/icono/icono';
import { ApiError } from '../../../../nucleo/api/api-error';
import { cambiosBd } from '../../../../nucleo/api/base-datos';
import { EstadoTurno, estadoTurno } from '../../api/turnos.api';
import { TarjetaTurno } from '../../componentes/tarjeta-turno/tarjeta-turno';

/** Consulta pública «Mi turno» con el código de turno o de cita, sin iniciar sesión (incluida en T05.2 · HU-05). */
@Component({
  selector: 'app-consulta-turno',
  imports: [RouterLink, Icono, TarjetaTurno],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="contenedor pagina">
      <nav class="migas texto-sm"><a routerLink="/">Inicio</a><app-icono nombre="chevron-right" [tam]="14" />Mi turno</nav>
      <h1>Mi turno</h1>
      <p class="texto-3 sub">Escribe tu código de turno o de cita para ver tu posición en la cola.</p>
      <form class="tarjeta form" (submit)="consultar($event)" novalidate>
        <label for="ct-cod" class="etiqueta">Código de turno o de cita</label>
        <div class="fila" style="flex-wrap:nowrap">
          <input id="ct-cod" class="entrada mayus" placeholder="Ej.: A-015 o CR-7F3K9" [value]="texto()" (input)="texto.set($any($event.target).value)" />
          <button type="submit" class="btn btn-acento"><app-icono nombre="ticket" [tam]="18" />Ver mi turno</button>
        </div>
      </form>
      @if (resultado(); as r) {
        @if (r.ok) { <section class="tarjeta"><app-tarjeta-turno [estado]="r.estado" /></section> }
        @else { <div class="aviso aviso-error"><app-icono nombre="x-circle" /><div><strong>No encontramos ese turno</strong>{{ r.mensaje }} <a routerLink="/ingresar">Reserva una cita</a>.</div></div> }
      }
    </div>`,
  styles: `
    .pagina { padding-top: 32px; padding-bottom: 56px; background: var(--fondo); }
    :host { display: block; background: var(--fondo); }
    .migas { display: flex; align-items: center; gap: 6px; color: var(--texto-2); margin-bottom: 10px; } .migas a { font-weight: 700; text-decoration: none; }
    .sub { margin: 6px 0 18px; } .form { margin-bottom: 18px; display: flex; flex-direction: column; gap: 8px; }
    .mayus { text-transform: uppercase; flex: 1; } .mayus::placeholder { text-transform: none; }
  `,
})
export class ConsultaTurno implements OnDestroy {
  readonly codigo = input<string>();
  protected readonly texto = signal('');
  protected readonly consultado = signal('');
  private readonly tic = signal(0);
  private readonly t = setInterval(() => this.tic.update((n) => n + 1), 30000);
  ngOnDestroy(): void { clearInterval(this.t); }

  constructor() {
    queueMicrotask(() => { const c = this.codigo(); if (c) { this.texto.set(c); this.consultado.set(c); } });
  }

  protected readonly resultado = computed<{ ok: true; estado: EstadoTurno } | { ok: false; mensaje: string } | null>(() => {
    cambiosBd(); this.tic();
    const c = this.consultado();
    if (!c) return null;
    try { return { ok: true, estado: estadoTurno(c) }; }
    catch (e) { return { ok: false, mensaje: e instanceof ApiError ? e.message : 'Inténtalo otra vez.' }; }
  });

  protected consultar(ev: Event): void { ev.preventDefault(); this.consultado.set(this.texto().trim()); }
}
