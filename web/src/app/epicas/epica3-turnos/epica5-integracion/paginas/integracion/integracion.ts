import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Icono } from '../../../../compartido/componentes/icono/icono';
import { ToastService } from '../../../../compartido/componentes/toast/toast.service';
import { mensajeDe } from '../../../../nucleo/api/api-error';
import { bd, cambiosBd } from '../../../../nucleo/api/base-datos';
import { SesionService } from '../../../../nucleo/sesion/sesion.service';
import { hora } from '../../../../nucleo/utilidades/formato';
import { consultarSistemaCentral } from '../../api/dni.api';
import { probarConexion, resolverConflicto, restablecer, simularCaida } from '../../api/integracion.api';

/** «Integración y respaldo» (incluida en T04B.3 · HU-04B): sistema central, internet, modo local, sincronización y conflictos. */
@Component({
  selector: 'app-integracion',
  imports: [Icono],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './integracion.html',
  styleUrl: './integracion.scss',
})
export class Integracion {
  private readonly sesion = inject(SesionService);
  private readonly toast = inject(ToastService);
  protected readonly i = computed(() => { cambiosBd(); return { ...bd().integracion }; }); // copia: así Angular nota los cambios
  protected readonly total = computed(() => this.i().pendientes.length);
  protected readonly enviados = computed(() => this.i().pendientes.filter((p) => p.estado === 'enviado').length);
  protected readonly checkins = computed(() => this.i().pendientes.filter((p) => p.estado === 'enviado' && p.tipo === 'Check-in y turno').length);
  protected readonly cerradas = computed(() => this.i().pendientes.filter((p) => p.estado === 'enviado' && p.tipo !== 'Check-in y turno').length);
  protected readonly pendientes = computed(() => this.total() - this.enviados());
  protected readonly ultima = computed(() => hora(new Date(this.i().ultimaConsulta)));
  protected readonly dniPendientes = computed(() => { cambiosBd(); return bd().tramitesDni.filter((t) => t.estado === 'solicitado' || t.estado === 'en-proceso').length; });
  /** Hora del último corte de internet (el evento más reciente puede ser otro, por ejemplo un conflicto resuelto). */
  protected readonly caidaDesde = computed(() => { const e = this.i().eventos.find((x) => x.icono === 'wifi-off'); return e ? hora(new Date(e.fecha)) : '—'; });
  protected readonly ocupado = signal(false);
  protected hora(f: string): string { return hora(new Date(f)); }

  private async hacer(fn: (t: string) => Promise<string | void>): Promise<void> {
    const t = this.sesion.token();
    if (!t || this.ocupado()) return;
    this.ocupado.set(true);
    try { const msg = await fn(t); if (msg) this.toast.exito(msg); }
    catch (e) { this.toast.error(mensajeDe(e)); }
    finally { this.ocupado.set(false); }
  }

  protected probar(): void { void this.hacer(async (t) => `Sistema central conectado · respuesta en ${await probarConexion(t)} ms.`); }
  protected caida(): void { void this.hacer(async (t) => { await simularCaida(t); return 'Simulación: se cayó el internet. Las ventanillas pasaron a modo local.'; }); }
  protected volver(): void { void this.hacer(async (t) => { const r = await restablecer(t); return `Conexión restablecida · ${r.enviados} registro(s) sincronizados${r.omitidos ? `, ${r.omitidos} duplicados omitidos` : ''}.`; }); }
  protected resolver(id: number, usar: 'local' | 'central'): void { void this.hacer(async (t) => { await resolverConflicto(t, id, usar); return 'Conflicto resuelto.'; }); }
  protected consultarDni(): void { void this.hacer(async (t) => { const n = await consultarSistemaCentral(t); return n ? `${n} trámite(s) de DNI cambiaron de estado. Se avisó a quienes tienen el DNI listo.` : 'Sin cambios en los trámites de DNI.'; }); }
}
