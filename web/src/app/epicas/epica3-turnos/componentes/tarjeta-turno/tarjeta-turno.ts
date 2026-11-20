import { ChangeDetectionStrategy, Component, OnDestroy, computed, input, signal } from '@angular/core';
import { Icono } from '../../../../compartido/componentes/icono/icono';
import { EstadoTurno } from '../../api/turnos.api';

/** T05.2 · Tarjeta «Tu turno»: número grande, personas delante, tiempo estimado y ventanilla; se actualiza cada 30 s. */
@Component({
  selector: 'app-tarjeta-turno',
  imports: [Icono],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let e = estado();
    <div class="turno" [class.llamado]="e.turno.estado === 'llamado'">
      <div class="grande">
        <span class="et">Tu turno</span>
        <b class="numero">{{ e.turno.numero }}</b>
        @if (e.turno.estado === 'llamado') {
          <span class="pill llamado-pill"><app-icono nombre="megaphone" [tam]="16" />¡Es tu turno! Acércate a la Ventanilla {{ e.turno.ventanilla }}</span>
        } @else {
          <span class="pill"><i></i>En cola · check-in {{ horaCheckin() }}</span>
        }
        <p class="tramite">{{ e.tramite }}@if (e.turno.horaCita) { <small>Cita de las {{ e.turno.horaCita }} · Sede Huánuco</small> }</p>
      </div>
      <div class="lado">
        <div class="rejilla-3 datos">
          <div class="dato"><span><app-icono nombre="users" [tam]="16" />Personas delante</span><b>{{ e.delante.length }}</b></div>
          <div class="dato"><span><app-icono nombre="hourglass" [tam]="16" />Tiempo estimado</span><b>{{ e.turno.estado === 'llamado' ? 'Ahora' : '≈ ' + e.minutos }}<small>{{ e.turno.estado === 'llamado' ? '' : ' min' }}</small></b></div>
          <div class="dato"><span><app-icono nombre="monitor" [tam]="16" />Ventanilla</span><b>{{ e.turno.ventanilla }}</b></div>
        </div>
        @if (e.delante.length) {
          <p class="delante">Delante de ti: @for (d of e.delante; track d.id) { <span class="chip">{{ d.numero }}</span> } <app-icono nombre="arrow-right" [tam]="14" /><span class="chip yo">{{ e.turno.numero }} · tú</span></p>
        }
        <div class="refresco">
          <div class="fila-entre"><span><app-icono nombre="refresh" [tam]="15" />Se actualiza cada 30 segundos</span><span class="texto-2">Próxima actualización en {{ faltan() }} s</span></div>
          <div class="barra"><i [style.width.%]="((30 - faltan()) / 30) * 100"></i></div>
        </div>
        <p class="nota"><app-icono nombre="info" [tam]="16" />Mantente cerca de la sala. Cuando tu turno aparezca en la pantalla, acércate a la ventanilla indicada. También te avisaremos por WhatsApp.</p>
      </div>
    </div>`,
  styleUrl: './tarjeta-turno.scss',
})
export class TarjetaTurno implements OnDestroy {
  readonly estado = input.required<EstadoTurno>();
  /** Se emite cada 30 s para que la página vuelva a consultar el estado. */
  readonly faltan = signal(30);
  private readonly t = setInterval(() => this.faltan.update((s) => (s <= 1 ? 30 : s - 1)), 1000);
  protected readonly horaCheckin = computed(() => { const d = new Date(this.estado().turno.emitido); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; });
  ngOnDestroy(): void { clearInterval(this.t); }
}
