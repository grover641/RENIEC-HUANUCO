import { ChangeDetectionStrategy, Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icono } from '../../../../compartido/componentes/icono/icono';
import { bd, cambiosBd } from '../../../../nucleo/api/base-datos';
import { SesionService } from '../../../../nucleo/sesion/sesion.service';
import { fechaLarga } from '../../../../nucleo/utilidades/formato';
import { aIso } from '../../../../datos/semilla';
import { miTurnoHoy } from '../../api/turnos.api';
import { TarjetaTurno } from '../../componentes/tarjeta-turno/tarjeta-turno';

/** HU-05 · «Mi turno» del ciudadano el día de su cita (T05.2). */
@Component({
  selector: 'app-mi-turno',
  imports: [RouterLink, Icono, TarjetaTurno],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="encabezado-pagina"><div><h1>Mi turno</h1><p>{{ subtitulo() }}</p></div></div>
    @if (estado(); as e) {
      <section class="tarjeta"><app-tarjeta-turno [estado]="e" /></section>
    } @else {
      <section class="tarjeta vacio">
        <span class="icono-caja guinda" style="width:64px;height:64px"><app-icono nombre="ticket" [tam]="30" /></span>
        <b>Hoy no tienes un turno activo</b>
        @if (citaHoy(); as c) {
          <p class="texto-3">Tienes una cita hoy a las {{ c.hora }} (código {{ c.codigo }}). Cuando llegues a la sede, haz check-in en el módulo con tu código o DNI y tu turno aparecerá aquí.</p>
        } @else {
          <p class="texto-3">Tu turno aparecerá aquí el día de tu cita, después de hacer check-in en la sede.</p>
          <a class="btn btn-primario" routerLink="/ciudadano/citas">Ver mis citas</a>
        }
      </section>
    }`,
  styles: `.vacio { display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center; max-width: 620px; margin: 0 auto; }`,
})
export class MiTurno implements OnDestroy {
  private readonly sesion = inject(SesionService);
  private readonly tic = signal(0);
  private readonly t = setInterval(() => this.tic.update((n) => n + 1), 30000); // consulta cada 30 s
  ngOnDestroy(): void { clearInterval(this.t); }

  protected readonly estado = computed(() => { cambiosBd(); this.tic(); const t = this.sesion.token(); return t ? miTurnoHoy(t) : null; });
  protected readonly citaHoy = computed(() => {
    cambiosBd();
    const u = this.sesion.usuario();
    return u ? bd().citas.find((c) => c.ciudadanoId === u.id && c.fecha === aIso(new Date()) && c.estado === 'confirmada') ?? null : null;
  });
  protected readonly subtitulo = computed(() => {
    const e = this.estado();
    return `${fechaLarga(new Date())}${e ? ' · ' + e.tramite : ''}`;
  });
}
