import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icono } from '../../../../compartido/componentes/icono/icono';
import { SesionService } from '../../../../nucleo/sesion/sesion.service';
import { enmascararCelular, enmascararDni, fechaLarga } from '../../../../nucleo/utilidades/formato';

/** «Mi inicio» del ciudadano (incluida en T16.4 · vista inicial por rol): sus datos y lo que llega en los siguientes sprints. */
@Component({
  selector: 'app-mi-inicio',
  imports: [RouterLink, Icono],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mi-inicio.html',
  styleUrl: './mi-inicio.scss',
})
export class MiInicio {
  private readonly sesion = inject(SesionService);
  protected readonly usuario = this.sesion.usuario;
  protected readonly hoy = fechaLarga(new Date());
  protected readonly enmascararDni = enmascararDni;
  protected readonly enmascararCelular = enmascararCelular;

  /** Funciones de las épicas 2 a 5, según el plan de sprints. */
  protected readonly proximos = [
    { icono: 'bell', titulo: 'Elegir cómo recibir avisos (WhatsApp o SMS)', sprint: 'Sprint 2' },
    { icono: 'calendar-plus', titulo: 'Reservar, cancelar o reprogramar tu cita', sprint: 'Sprint 3' },
    { icono: 'ticket', titulo: 'Seguir tu turno el día de la cita', sprint: 'Sprint 4' },
    { icono: 'id-card', titulo: 'Saber si tu DNI está listo para recoger', sprint: 'Sprint 6' },
  ];
}
