import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Icono } from '../../../../compartido/componentes/icono/icono';
import { ToastService } from '../../../../compartido/componentes/toast/toast.service';
import { camposDe, mensajeDe } from '../../../../nucleo/api/api-error';
import { cambiosBd } from '../../../../nucleo/api/base-datos';
import { Tramite } from '../../../../nucleo/modelos';
import { SesionService } from '../../../../nucleo/sesion/sesion.service';
import { soles } from '../../../../nucleo/utilidades/formato';
import { CATEGORIAS, guardarTramite, ICONOS_TRAMITE, todos } from '../../api/tramites.api';

const NUEVO: Tramite = { id: '', nombre: '', categoria: 'Otros', descripcion: '', duracionMin: 15, costo: 0, icono: 'file-text', tono: '', requisitos: [''], publicado: true };

/** «Trámites (catálogo)» incluida en T10.4 · HU-10: tipos de trámite con costo, duración, icono y requisitos. */
@Component({
  selector: 'app-admin-tramites',
  imports: [Icono],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-tramites.html',
  styleUrl: './admin-tramites.scss',
})
export class AdminTramites {
  private readonly sesion = inject(SesionService);
  private readonly toast = inject(ToastService);
  protected readonly categorias = CATEGORIAS;
  protected readonly iconos = ICONOS_TRAMITE;
  protected readonly soles = soles;

  protected readonly lista = computed(() => { cambiosBd(); return [...todos()]; }); // copia: así Angular nota los cambios
  protected readonly editando = signal<Tramite>(structuredClone(todos().find((t) => t.id === 'renovacion') ?? NUEVO));
  protected readonly esNuevo = signal(false);
  protected readonly consultar = signal(this.editando().costo === null);
  protected readonly errores = signal<Record<string, string>>({});
  protected readonly guardando = signal(false);

  protected elegir(t: Tramite): void { this.editando.set(structuredClone(t)); this.esNuevo.set(false); this.consultar.set(t.costo === null); this.errores.set({}); }
  protected nuevo(): void { this.editando.set(structuredClone(NUEVO)); this.esNuevo.set(true); this.consultar.set(false); this.errores.set({}); }
  protected poner<K extends keyof Tramite>(campo: K, valor: Tramite[K]): void { this.editando.update((t) => ({ ...t, [campo]: valor })); }
  protected requisito(i: number, v: string): void { this.editando.update((t) => ({ ...t, requisitos: t.requisitos.map((r, j) => (j === i ? v : r)) })); }
  protected agregar(): void { this.editando.update((t) => ({ ...t, requisitos: [...t.requisitos, ''] })); }
  protected quitar(i: number): void { this.editando.update((t) => ({ ...t, requisitos: t.requisitos.filter((_, j) => j !== i) })); }
  protected descartar(): void { const t = todos().find((x) => x.id === this.editando().id); if (t) this.elegir(t); else this.nuevo(); }

  protected async guardar(): Promise<void> {
    const token = this.sesion.token();
    if (!token) return;
    this.guardando.set(true);
    try {
      const t = await guardarTramite(token, { ...this.editando(), costo: this.consultar() ? null : Number(this.editando().costo ?? 0) }, this.esNuevo());
      this.elegir(t);
      this.toast.exito(`«${t.nombre}» se guardó. Los cambios ya se ven al reservar.`);
    } catch (e) {
      this.errores.set(camposDe(e));
      if (!Object.keys(camposDe(e)).length) this.toast.error(mensajeDe(e));
    } finally {
      this.guardando.set(false);
    }
  }
}
