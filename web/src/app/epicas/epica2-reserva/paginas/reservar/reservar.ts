import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icono } from '../../../../compartido/componentes/icono/icono';
import { Logo } from '../../../../compartido/componentes/logo/logo';
import { Modal } from '../../../../compartido/componentes/modal/modal';
import { ToastService } from '../../../../compartido/componentes/toast/toast.service';
import { ApiError, mensajeDe } from '../../../../nucleo/api/api-error';
import { bd } from '../../../../nucleo/api/base-datos';
import { Cita, Tramite } from '../../../../nucleo/modelos';
import { SesionService } from '../../../../nucleo/sesion/sesion.service';
import { enmascararCelular, enmascararDni, fechaLarga, soles } from '../../../../nucleo/utilidades/formato';
import { SEDE } from '../../../../datos/semilla';
import { CATEGORIAS, catalogo } from '../../api/tramites.api';
import { reservar } from '../../api/citas.api';
import { consentimientoDe } from '../../../epica4-alertas/api/avisos.api';
import { SelectorHorario } from '../../componentes/selector-horario/selector-horario';

type Paso = 1 | 2 | 3 | 4;

/** HU-01 · «Reserva tu cita» estilo catálogo en 3 pasos, con resumen tipo carrito y confirmación (T01.4). */
@Component({
  selector: 'app-reservar',
  imports: [RouterLink, Icono, Logo, Modal, SelectorHorario],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reservar.html',
  styleUrl: './reservar.scss',
})
export class Reservar {
  /** ?tramite=renovacion desde la página de Inicio. */
  readonly tramite = input<string>();
  private readonly sesion = inject(SesionService);
  private readonly toast = inject(ToastService);
  protected readonly usuario = this.sesion.usuario;
  protected readonly soles = soles;
  protected readonly sede = SEDE;
  protected readonly enmascararDni = enmascararDni;
  protected readonly enmascararCelular = enmascararCelular;

  protected readonly paso = signal<Paso>(1);
  protected readonly categoria = signal<string>('Todos');
  protected readonly busqueda = signal('');
  protected readonly detalle = signal<Tramite | null>(null);
  protected readonly elegido = signal<Tramite | null>(null);
  protected readonly fecha = signal<string | null>(null);
  protected readonly hora = signal<string | null>(null);
  protected readonly canal = signal<'whatsapp' | 'sms'>('whatsapp');
  protected readonly aceptaAvisos = signal(true);
  protected readonly enviando = signal(false);
  protected readonly confirmada = signal<Cita | null>(null);
  protected readonly sugerencias = signal<string[]>([]);

  protected readonly categorias = computed(() => {
    const t = catalogo();
    return [{ nombre: 'Todos', n: t.length }, ...CATEGORIAS.map((c) => ({ nombre: c, n: t.filter((x) => x.categoria === c).length })).filter((c) => c.n)];
  });
  protected readonly lista = computed(() => {
    const q = this.busqueda().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    return catalogo().filter((t) => (this.categoria() === 'Todos' || t.categoria === this.categoria())
      && (!q || (t.nombre + ' ' + t.descripcion).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').includes(q)));
  });
  protected readonly fechaTexto = computed(() => { const f = this.fecha(); return f ? fechaLarga(new Date(f + 'T00:00:00')) : ''; });
  protected readonly yaConsiente = computed(() => !!consentimientoDe(this.usuario()?.id ?? null));
  /** Canal por el que de verdad salió la confirmación (según la bitácora de avisos), o null si no se envió. */
  protected readonly canalConfirmacion = computed(() => {
    const c = this.confirmada();
    if (!c) return null;
    const a = bd().avisos.find((x) => x.tipo === 'confirmacion' && x.detalle.includes(c.codigo) && (x.estado === 'enviado' || x.estado === 'reenviado-sms'));
    return a?.canal ?? null;
  });

  constructor() {
    queueMicrotask(() => {
      const t = catalogo().find((x) => x.id === this.tramite());
      if (t) { this.elegido.set(t); this.paso.set(2); }
    });
  }

  protected elegir(t: Tramite): void {
    this.detalle.set(null);
    if (this.elegido()?.id !== t.id) { this.fecha.set(null); this.hora.set(null); }
    this.elegido.set(t);
    this.paso.set(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  protected continuar(): void {
    if (this.paso() === 1 && this.elegido()) this.paso.set(2);
    else if (this.paso() === 2 && this.fecha() && this.hora()) this.paso.set(3);
    else if (this.paso() === 3) void this.confirmar();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  protected puedeContinuar(): boolean {
    return this.paso() === 1 ? !!this.elegido() : this.paso() === 2 ? !!(this.fecha() && this.hora()) : this.paso() === 3 ? !this.enviando() : false;
  }

  protected async confirmar(): Promise<void> {
    const t = this.sesion.token();
    const tr = this.elegido();
    if (!t || !tr || !this.fecha() || !this.hora()) return;
    this.enviando.set(true);
    try {
      const cita = await reservar(t, { tramiteId: tr.id, fecha: this.fecha()!, hora: this.hora()!, canal: this.canal(), aceptaAvisos: this.aceptaAvisos() });
      this.confirmada.set(cita);
      this.paso.set(4);
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        this.sugerencias.set((e.campos['sugerencias'] ?? '').split(',').filter(Boolean));
        this.hora.set(null);
        this.paso.set(2);
      }
      this.toast.error(mensajeDe(e));
    } finally {
      this.enviando.set(false);
    }
  }

  protected copiar(codigo: string): void {
    navigator.clipboard?.writeText(codigo).then(() => this.toast.info('Código copiado.'), () => {});
  }

  protected imprimir(): void { window.print(); }

  protected nueva(): void {
    this.confirmada.set(null); this.elegido.set(null); this.fecha.set(null); this.hora.set(null); this.paso.set(1);
  }
}
