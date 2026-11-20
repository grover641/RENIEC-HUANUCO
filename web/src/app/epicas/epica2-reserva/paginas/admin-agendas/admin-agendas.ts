import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icono } from '../../../../compartido/componentes/icono/icono';
import { Modal } from '../../../../compartido/componentes/modal/modal';
import { ToastService } from '../../../../compartido/componentes/toast/toast.service';
import { camposDe, mensajeDe } from '../../../../nucleo/api/api-error';
import { cambiosBd } from '../../../../nucleo/api/base-datos';
import { Franja, TipoFranja } from '../../../../nucleo/modelos';
import { SesionService } from '../../../../nucleo/sesion/sesion.service';
import { aIso, aMin, NOMBRE_FRANJA, SEDE } from '../../../../datos/semilla';
import { BLOQUE_MIN, crearFranja, cuposPorDia, eliminarFranja, franjasDe, porcentajeReservado, validarFranja } from '../../api/agendas.api';
import { catalogo } from '../../api/tramites.api';

const DIAS = ['', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'setiembre', 'octubre', 'noviembre', 'diciembre'];
const INICIO = 8 * 60, FIN = 16 * 60 + 30, PX_HORA = 56;

/** HU-10 · «Agendas y cupos»: calendario semanal por ventanilla, franjas, cupos y validación de cruces (T10.4). */
@Component({
  selector: 'app-admin-agendas',
  imports: [RouterLink, Icono, Modal],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-agendas.html',
  styleUrl: './admin-agendas.scss',
})
export class AdminAgendas {
  private readonly sesion = inject(SesionService);
  private readonly toast = inject(ToastService);
  protected readonly ventanillas = SEDE.ventanillas;
  protected readonly nombreFranja = NOMBRE_FRANJA;
  protected readonly tipos: TipoFranja[] = ['dni', 'recojo', 'todos'];
  protected readonly horas = Array.from({ length: 9 }, (_, i) => `${String(8 + i).padStart(2, '0')}:00`);
  protected readonly altoTotal = ((FIN - INICIO) / 60) * PX_HORA;

  protected readonly ventanilla = signal(2);
  protected readonly lunes = signal(lunesDe(new Date()));
  protected readonly elegida = signal<Franja | null>(null);
  protected readonly form = signal({ dia: 4, inicio: '11:30', fin: '13:00', tipo: 'todos' as TipoFranja, cupos: 2 });
  protected readonly errores = signal<Record<string, string>>({});
  protected readonly guardando = signal(false);

  protected readonly fechas = computed(() => [1, 2, 3, 4, 5].map((i) => { const d = new Date(this.lunes()); d.setDate(d.getDate() + i - 1); return d; }));
  protected readonly tituloSemana = computed(() => { const f = this.fechas(); return `Semana del ${f[0].getDate()} al ${f[4].getDate()} de ${MESES[f[4].getMonth()]} de ${f[4].getFullYear()}`; });
  protected readonly reservado = computed(() => { cambiosBd(); return porcentajeReservado(this.fechas().map(aIso)); });
  protected readonly franjas = computed(() => { cambiosBd(); return franjasDe(this.ventanilla()); });
  protected readonly cuposDia = computed(() => { cambiosBd(); return [1, 2, 3, 4, 5].map((d) => cuposPorDia(this.ventanilla(), d)); });
  protected readonly cuposSede = computed(() => { cambiosBd(); const hoy = new Date().getDay(); const d = hoy >= 1 && hoy <= 5 ? hoy : 1; return SEDE.ventanillas.reduce((s, v) => s + cuposPorDia(v, d), 0); });
  protected readonly tramites = computed(() => { cambiosBd(); return catalogo(); });
  /** Validación en vivo mientras se escribe (muestra el cruce antes de guardar). */
  protected readonly vivo = computed(() => { cambiosBd(); const f = this.form(); return validarFranja({ ...f, ventanilla: this.ventanilla() }); });
  protected readonly erroresVisibles = computed(() => ({ ...this.vivo(), ...this.errores() }));
  protected readonly previa = computed(() => {
    const f = this.form();
    const ini = aMin(f.inicio), fin = aMin(f.fin);
    if (isNaN(ini) || isNaN(fin) || ini >= fin) return null;
    return { dia: f.dia, top: this.y(f.inicio), alto: ((fin - ini) / 60) * PX_HORA, cruce: !!this.vivo()['cruce'] };
  });

  protected dia(n: number): string { return DIAS[n]; }
  protected y(h: string): number { return ((aMin(h) - INICIO) / 60) * PX_HORA; }
  protected alto(f: Franja): number { return ((aMin(f.fin) - aMin(f.inicio)) / 60) * PX_HORA; }
  protected delDia(n: number): Franja[] { return this.franjas().filter((f) => f.dia === n); }
  protected bloques(f: Franja): number { return (aMin(f.fin) - aMin(f.inicio)) / BLOQUE_MIN; }
  protected mover(semanas: number): void { const d = new Date(this.lunes()); d.setDate(d.getDate() + 7 * semanas); this.lunes.set(d); }
  protected poner(campo: string, valor: string): void {
    this.errores.set({});
    this.form.update((f) => ({ ...f, [campo]: campo === 'dia' || campo === 'cupos' ? Number(valor) : valor }));
  }

  protected async guardar(ev: Event): Promise<void> {
    ev.preventDefault();
    const t = this.sesion.token();
    if (!t) return;
    this.guardando.set(true);
    try {
      await crearFranja(t, { ...this.form(), ventanilla: this.ventanilla() });
      this.toast.exito(`Franja guardada y publicada en la Ventanilla ${this.ventanilla()}.`);
    } catch (e) {
      this.errores.set(camposDe(e));
      if (!Object.keys(camposDe(e)).length) this.toast.error(mensajeDe(e));
    } finally {
      this.guardando.set(false);
    }
  }

  protected async eliminar(f: Franja): Promise<void> {
    const t = this.sesion.token();
    if (!t) return;
    try { await eliminarFranja(t, f.id); this.elegida.set(null); this.toast.exito('Franja eliminada.'); }
    catch (e) { this.toast.error(mensajeDe(e)); }
  }
}

function lunesDe(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dia = x.getDay();
  x.setDate(x.getDate() + (dia === 0 ? 1 : dia === 6 ? 2 : 1 - dia));
  return x;
}
