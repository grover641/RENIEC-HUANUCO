import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icono } from '../../../../compartido/componentes/icono/icono';
import { bd } from '../../../../nucleo/api/base-datos';
import { SesionService } from '../../../../nucleo/sesion/sesion.service';
import { diaCorto, diaSemana, fechaCorta, fechaLarga, hora, mesCorto } from '../../../../nucleo/utilidades/formato';
import { aIso, SEDE } from '../../../../datos/semilla';
import { misTramites, NOMBRE_ESTADO } from '../../../epica5-integracion/api/dni.api';

/** «Mi inicio» del ciudadano (incluida en T16.4 · vista inicial por rol): próxima cita, estado del DNI, accesos y avisos. */
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
  protected readonly sede = SEDE;

  protected readonly cita = computed(() => {
    const u = this.usuario();
    if (!u) return null;
    const hoy = aIso(new Date()); // fecha local (Perú), no UTC
    const c = bd().citas.filter((x) => x.ciudadanoId === u.id && x.estado === 'confirmada' && x.fecha >= hoy).sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora))[0];
    if (!c) return null;
    const fecha = new Date(`${c.fecha}T${c.hora}:00`);
    const limite = new Date(fecha.getTime() - 24 * 3600000);
    return {
      ...c,
      tramite: bd().tramites.find((t) => t.id === c.tramiteId)?.nombre ?? '',
      dia: diaCorto(fecha), num: fecha.getDate(), mes: mesCorto(fecha),
      limiteTexto: `${diaSemana(limite)} ${limite.getDate()} a las ${hora(limite)}`,
      puedeCambiar: Date.now() < limite.getTime(),
      vence: fechaCorta(new Date(fecha.getTime() + 3 * 86400000)),
    };
  });

  /** Tarjeta «Estado de tu DNI»: el trámite real del sistema central o, si su próxima cita es para renovar, el aviso de vencimiento. */
  protected readonly estadoDni = computed(() => {
    const t = this.sesion.token();
    const tramite = t ? misTramites(t).find((x) => x.estado !== 'entregado') : undefined;
    if (tramite) return { tipo: 'tramite' as const, nombre: tramite.tipo, estado: NOMBRE_ESTADO[tramite.estado], listo: tramite.estado === 'listo' };
    const c = this.cita();
    if (c?.tramiteId === 'renovacion') return { tipo: 'por-vencer' as const, vence: c.vence };
    return null;
  });

  protected readonly avisos = computed(() => {
    const u = this.usuario();
    return u ? bd().avisos.filter((a) => a.ciudadanoId === u.id && a.estado !== 'sin-consentimiento').slice(0, 3) : [];
  });
  protected readonly sinLeer = computed(() => this.avisos().filter((a) => !a.leido).length);

  protected estadoTexto(e: string): string {
    return ({ enviado: 'enviado', programado: 'programado, con SMS de respaldo', fallo: 'no se pudo entregar', 'reenviado-sms': 'reenviado por SMS', 'sin-consentimiento': 'no enviado' } as Record<string, string>)[e] ?? e;
  }
}
