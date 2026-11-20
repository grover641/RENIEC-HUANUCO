import { ChangeDetectionStrategy, Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icono } from '../../../../compartido/componentes/icono/icono';
import { Modal } from '../../../../compartido/componentes/modal/modal';
import { ToastService } from '../../../../compartido/componentes/toast/toast.service';
import { camposDe, mensajeDe } from '../../../../nucleo/api/api-error';
import { bd, cambiosBd } from '../../../../nucleo/api/base-datos';
import { Prioridad, Turno } from '../../../../nucleo/modelos';
import { SesionService } from '../../../../nucleo/sesion/sesion.service';
import { enmascararDni, fechaLarga, hora } from '../../../../nucleo/utilidades/formato';
import { actualDe, colaDe, ETIQUETA_PRIORIDAD, llamarSiguiente, marcarAtendido, marcarAusente, MOTIVOS, rellamar, repriorizar, resumenVentanilla } from '../../api/turnos.api';

/** HU-02 · Panel de turnos del operador (T02.3) con modo sin conexión (T02.4) y HU-06 · repriorizar con motivo (T06.3). */
@Component({
  selector: 'app-panel-turnos',
  imports: [RouterLink, Icono, Modal],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './panel-turnos.html',
  styleUrl: './panel-turnos.scss',
})
export class PanelTurnos implements OnDestroy {
  private readonly sesion = inject(SesionService);
  private readonly toast = inject(ToastService);
  protected readonly etiqueta = ETIQUETA_PRIORIDAD;
  protected readonly motivos = MOTIVOS;
  protected readonly enmascararDni = enmascararDni;

  protected readonly ventanilla = computed(() => this.sesion.usuario()?.ventanilla ?? 0);
  protected readonly ahora = signal(Date.now());
  protected readonly ultimaActualizacion = signal(Date.now());
  protected readonly enLinea = signal(navigator.onLine);
  private readonly reloj = setInterval(() => {
    this.ahora.set(Date.now());
    if (Date.now() - this.ultimaActualizacion() >= 30000) this.ultimaActualizacion.set(Date.now()); // consulta cada 30 s
  }, 1000);
  private readonly red = () => this.enLinea.set(navigator.onLine);

  protected readonly modoLocal = computed(() => { cambiosBd(); return bd().integracion.modoLocal; });
  protected readonly cola = computed(() => { cambiosBd(); this.ultimaActualizacion(); return colaDe(this.ventanilla()); });
  protected readonly actual = computed(() => { cambiosBd(); this.ultimaActualizacion(); return actualDe(this.ventanilla()); });
  protected readonly resumen = computed(() => { cambiosBd(); this.ultimaActualizacion(); return resumenVentanilla(this.ventanilla()); });
  protected readonly fechaHoy = computed(() => `${fechaLarga(new Date(this.ahora()))} · ${hora(new Date(this.ahora()))}`);
  protected readonly haceSeg = computed(() => Math.max(0, Math.round((this.ahora() - this.ultimaActualizacion()) / 1000)));
  protected readonly ocupado = signal(false);

  protected readonly porRepriorizar = signal<Turno | null>(null);
  protected readonly nuevaPrioridad = signal<Prioridad>(null);
  protected readonly motivo = signal('');
  protected readonly errorMotivo = signal('');
  protected readonly confirmarAusente = signal(false);
  protected readonly motivoAusente = signal(MOTIVOS[2]);

  constructor() {
    window.addEventListener('online', this.red);
    window.addEventListener('offline', this.red);
  }
  ngOnDestroy(): void {
    clearInterval(this.reloj);
    window.removeEventListener('online', this.red);
    window.removeEventListener('offline', this.red);
  }

  protected tramite(id: string): string { return bd().tramites.find((t) => t.id === id)?.nombre ?? id; }
  protected espera(t: Turno): number { return Math.max(0, Math.round((this.ahora() - t.emitido) / 60000)); }
  protected atendiendoHace(t: Turno): string {
    const s = Math.max(0, Math.round((this.ahora() - (t.llamado ?? this.ahora())) / 1000));
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  }

  private async hacer(fn: () => Promise<unknown>, ok?: string): Promise<void> {
    if (this.ocupado()) return;
    this.ocupado.set(true);
    try { await fn(); if (ok) this.toast.exito(ok); this.ultimaActualizacion.set(Date.now()); }
    catch (e) { this.toast.error(mensajeDe(e)); }
    finally { this.ocupado.set(false); }
  }

  protected llamar(): void {
    const t = this.sesion.token();
    if (!t) return;
    void this.hacer(async () => {
      const sig = await llamarSiguiente(t);
      this.toast.info(sig ? `Llamando a ${sig.numero} → Ventanilla ${sig.ventanilla}` : 'No hay más turnos en la cola.');
    });
  }
  protected atendido(): void { const t = this.sesion.token(); if (t) void this.hacer(() => marcarAtendido(t), 'Turno marcado como atendido.'); }
  protected volverALlamar(): void { const t = this.sesion.token(); if (t) void this.hacer(() => rellamar(t), 'Se volvió a llamar en la pantalla de sala.'); }

  protected ausente(): void {
    const t = this.sesion.token();
    if (!t) return;
    void this.hacer(async () => { await marcarAusente(t, this.motivoAusente()); this.confirmarAusente.set(false); }, 'Turno marcado como ausente. Quedó en la bitácora.');
  }

  protected abrirRepriorizar(t: Turno): void {
    this.porRepriorizar.set(t);
    this.nuevaPrioridad.set(t.prioridad);
    this.motivo.set('');
    this.errorMotivo.set('');
  }

  protected guardarRepriorizar(): void {
    const t = this.sesion.token();
    const turno = this.porRepriorizar();
    if (!t || !turno) return;
    void this.hacer(async () => {
      try {
        await repriorizar(t, turno.id, this.nuevaPrioridad(), this.motivo());
        this.porRepriorizar.set(null);
        this.toast.exito(`Cola reordenada. El cambio de ${turno.numero} quedó registrado.`);
      } catch (e) {
        this.errorMotivo.set(camposDe(e)['motivo'] ?? '');
        throw e;
      }
    });
  }
}
