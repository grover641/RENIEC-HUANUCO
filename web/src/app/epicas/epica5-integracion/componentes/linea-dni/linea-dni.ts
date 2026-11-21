import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icono } from '../../../../compartido/componentes/icono/icono';
import { EstadoDni, TramiteDni } from '../../../../nucleo/modelos';
import { enmascararDni, fechaCorta, hora } from '../../../../nucleo/utilidades/formato';
import { EXPLICACION, NOMBRE_ESTADO, ORDEN_ESTADOS } from '../../api/dni.api';

/** Línea de tiempo del trámite de DNI (Solicitado → En proceso → Listo para recojo → Entregado) · T14.4. */
@Component({
  selector: 'app-linea-dni',
  imports: [RouterLink, Icono],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let t = tramite();
    <div class="cabeza">
      <div><h3>{{ t.tipo }} · DNI {{ dni() }}</h3><p class="texto-sm texto-2">Titular: {{ iniciales() }} · Solicitud del {{ fecha(t.fechas.solicitado) }}</p></div>
      <span class="insignia" [class]="t.estado === 'listo' ? 'insignia insignia-verde' : t.estado === 'entregado' ? 'insignia insignia-gris' : 'insignia insignia-azul'">
        <app-icono [nombre]="t.estado === 'listo' ? 'check-circle' : t.estado === 'entregado' ? 'package' : 'hourglass'" [tam]="14" />{{ nombre[t.estado] }}</span>
    </div>
    <ol class="linea" [class.vertical]="vertical()">
      @for (e of estados; track e; let i = $index) {
        <li [class.hecho]="i <= indice()" [class.actual]="i === indice()">
          <span class="punto">@if (i <= indice()) { <app-icono nombre="check" [tam]="16" [trazo]="3" /> } @else { <app-icono nombre="package" [tam]="15" /> }</span>
          <div><b>{{ nombre[e] }}</b><small>{{ t.fechas[e] ? fecha(t.fechas[e]) : 'Pendiente' }}</small>@if (vertical()) { <p>{{ explicacion[e] }}</p> }</div>
        </li>
      }
    </ol>
    @if (t.estado === 'listo') {
      <div class="listo"><app-icono nombre="package" /><div><b>¡Tu DNI ya está listo!</b>Reserva tu cita de recojo y llega a tu hora, sin hacer cola.</div>
        <a class="btn btn-exito" [routerLink]="enlaceRecojo()" [queryParams]="{ tramite: 'recojo' }"><app-icono nombre="calendar-plus" [tam]="18" />Reservar cita de recojo</a></div>
    }
    <p class="texto-xs texto-2 sinc"><app-icono nombre="refresh" [tam]="13" />Estado tomado del sistema central el {{ fecha(t.sincronizado) }} a las {{ hh(t.sincronizado) }}.</p>`,
  styles: `
    .cabeza { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; align-items: flex-start; }
    .linea { list-style: none; padding: 0; margin: 22px 0; display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
    .linea li { position: relative; display: flex; flex-direction: column; gap: 8px; }
    .linea li:not(:last-child)::after { content: ''; position: absolute; top: 15px; left: 34px; right: -4px; height: 3px; background: var(--borde); }
    .linea li.hecho:not(:last-child)::after { background: var(--exito); }
    .punto { width: 32px; height: 32px; border-radius: 50%; border: 2px solid var(--borde-campo); background: #fff; color: var(--texto-2); display: inline-flex; align-items: center; justify-content: center; position: relative; z-index: 1; }
    li.hecho .punto { background: var(--exito); border-color: var(--exito); color: #fff; }
    li b { color: var(--titulo); font-size: 15px; } li small { display: block; color: var(--texto-2); font-size: 13px; }
    li p { font-size: 14px; color: var(--texto-3); margin-top: 2px; }
    .linea.vertical { grid-template-columns: 1fr; gap: 18px; }
    .linea.vertical li { flex-direction: row; gap: 14px; }
    .linea.vertical li:not(:last-child)::after { top: 34px; bottom: -16px; left: 15px; right: auto; width: 3px; height: auto; }
    .listo { display: flex; gap: 14px; align-items: center; flex-wrap: wrap; background: var(--exito-suave); border-radius: 12px; padding: 14px 16px; color: #1E5B32; }
    .listo > div { flex: 1; min-width: 220px; } .listo b { display: block; }
    .sinc { display: flex; align-items: center; gap: 6px; margin-top: 12px; }
    @media (max-width: 640px) { .linea:not(.vertical) { grid-template-columns: 1fr 1fr; row-gap: 18px; } .linea li::after { display: none; } }
  `,
})
export class LineaDni {
  readonly tramite = input.required<TramiteDni>();
  readonly vertical = input(false);
  readonly enlaceRecojo = input('/ciudadano/reservar');
  protected readonly estados = ORDEN_ESTADOS;
  protected readonly nombre = NOMBRE_ESTADO;
  protected readonly explicacion = EXPLICACION;
  protected readonly indice = computed(() => ORDEN_ESTADOS.indexOf(this.tramite().estado as EstadoDni));
  protected readonly dni = computed(() => enmascararDni(this.tramite().dni));
  protected readonly iniciales = computed(() => this.tramite().titular.split(' ').filter(Boolean).map((p) => p[0] + '.').join(' '));
  protected fecha(f?: string): string { return f ? fechaCorta(new Date(f)) : ''; }
  protected hh(f: string): string { return hora(new Date(f)); }
}
