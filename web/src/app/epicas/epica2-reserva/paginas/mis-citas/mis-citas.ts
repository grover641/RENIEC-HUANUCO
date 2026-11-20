import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icono } from '../../../../compartido/componentes/icono/icono';
import { Modal } from '../../../../compartido/componentes/modal/modal';
import { ToastService } from '../../../../compartido/componentes/toast/toast.service';
import { mensajeDe } from '../../../../nucleo/api/api-error';
import { cambiosBd } from '../../../../nucleo/api/base-datos';
import { Cita, EstadoCita } from '../../../../nucleo/modelos';
import { SesionService } from '../../../../nucleo/sesion/sesion.service';
import { diaCorto, diaSemana, fechaCorta, mesCorto } from '../../../../nucleo/utilidades/formato';
import { aIso, SEDE } from '../../../../datos/semilla';
import { cancelar, fechaHoraCita, misCitas, puedeModificar, reprogramar } from '../../api/citas.api';
import { tramitePorId } from '../../api/tramites.api';
import { AvisosDeCita } from '../../../epica4-alertas/componentes/avisos-de-cita/avisos-de-cita';
import { SelectorHorario } from '../../componentes/selector-horario/selector-horario';

type Filtro = 'todas' | 'proximas' | 'pasadas';

/** HU-07 · «Mis citas»: próximas y pasadas, reprogramar y cancelar con la regla de 24 horas (T07.2). */
@Component({
  selector: 'app-mis-citas',
  imports: [RouterLink, Icono, Modal, SelectorHorario, AvisosDeCita],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mis-citas.html',
  styleUrl: './mis-citas.scss',
})
export class MisCitas {
  private readonly sesion = inject(SesionService);
  private readonly toast = inject(ToastService);
  protected readonly sede = SEDE;
  protected readonly puedeModificar = puedeModificar;
  protected readonly fechaCorta = fechaCorta;
  protected readonly filtro = signal<Filtro>('todas');

  protected readonly citas = computed(() => { cambiosBd(); const t = this.sesion.token(); return t ? misCitas(t) : []; });
  protected readonly proximas = computed(() => {
    const hoy = aIso(new Date());
    return this.citas().filter((c) => c.estado === 'confirmada' && c.fecha >= hoy).sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));
  });
  protected readonly pasadas = computed(() => this.citas().filter((c) => !this.proximas().includes(c)));

  protected readonly porCancelar = signal<Cita | null>(null);
  protected readonly porReprogramar = signal<Cita | null>(null);
  protected readonly verCita = signal<Cita | null>(null);
  protected readonly nuevaFecha = signal<string | null>(null);
  protected readonly nuevaHora = signal<string | null>(null);
  protected readonly trabajando = signal(false);

  protected tramite(c: Cita): string { return tramitePorId(c.tramiteId)?.nombre ?? c.tramiteId; }
  protected fecha(c: Cita): Date { return fechaHoraCita(c); }
  protected dia(c: Cita): string { return diaCorto(this.fecha(c)); }
  protected mes(c: Cita): string { return mesCorto(this.fecha(c)); }
  protected larga(c: Cita): string { const d = this.fecha(c); const t = `${diaSemana(d)} ${d.getDate()} de ${fechaCorta(d).split(' de ')[1]}`; return t[0].toUpperCase() + t.slice(1); }

  protected etiqueta(e: EstadoCita): { texto: string; clase: string; icono: string } {
    return ({
      confirmada: { texto: 'Confirmada', clase: 'insignia-azul', icono: 'check' },
      atendida: { texto: 'Atendida', clase: 'insignia-verde', icono: 'check-circle' },
      cancelada: { texto: 'Cancelada', clase: 'insignia-gris', icono: 'x-circle' },
      'no-asistio': { texto: 'No asistió', clase: 'insignia-roja', icono: 'user-x' },
    } as const)[e];
  }

  protected abrirReprogramar(c: Cita): void { this.nuevaFecha.set(null); this.nuevaHora.set(null); this.porReprogramar.set(c); }

  protected async confirmarCancelar(): Promise<void> {
    const c = this.porCancelar(); const t = this.sesion.token();
    if (!c || !t) return;
    this.trabajando.set(true);
    try { await cancelar(t, c.id); this.toast.exito(`Cancelaste la cita ${c.codigo}. El cupo quedó libre.`); this.porCancelar.set(null); }
    catch (e) { this.toast.error(mensajeDe(e)); }
    finally { this.trabajando.set(false); }
  }

  protected async confirmarReprogramar(): Promise<void> {
    const c = this.porReprogramar(); const t = this.sesion.token();
    if (!c || !t || !this.nuevaFecha() || !this.nuevaHora()) return;
    this.trabajando.set(true);
    try {
      const n = await reprogramar(t, c.id, this.nuevaFecha()!, this.nuevaHora()!);
      this.toast.exito(`Listo. Tu nueva cita es ${n.codigo}.`);
      this.porReprogramar.set(null);
    } catch (e) { this.toast.error(mensajeDe(e)); }
    finally { this.trabajando.set(false); }
  }
}
