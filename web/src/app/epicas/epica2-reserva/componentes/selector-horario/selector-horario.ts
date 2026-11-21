import { ChangeDetectionStrategy, Component, computed, input, model, signal } from '@angular/core';
import { Icono } from '../../../../compartido/componentes/icono/icono';
import { cambiosBd } from '../../../../nucleo/api/base-datos';
import { diaSemana } from '../../../../nucleo/utilidades/formato';
import { aIso } from '../../../../datos/semilla';
import { disponibilidad, libresDelDia } from '../../api/agendas.api';

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre'];

/**
 * T01.4 (b) · Calendario con los días disponibles y bloques de 30 minutos con sus cupos libres.
 * Lo reutiliza «Mis citas» para reprogramar (T07.2).
 */
@Component({
  selector: 'app-selector-horario',
  imports: [Icono],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './selector-horario.html',
  styleUrl: './selector-horario.scss',
})
export class SelectorHorario {
  readonly tramiteId = input.required<string>();
  readonly fecha = model<string | null>(null);
  readonly hora = model<string | null>(null);

  protected readonly mes = signal(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  protected readonly titulo = computed(() => `${MESES[this.mes().getMonth()]} ${this.mes().getFullYear()}`);
  protected readonly hoy = aIso(new Date());
  protected readonly puedeAtras = computed(() => this.mes() > new Date(new Date().getFullYear(), new Date().getMonth(), 1));

  protected readonly celdas = computed(() => {
    cambiosBd();
    const m = this.mes();
    const primero = new Date(m.getFullYear(), m.getMonth(), 1);
    const vacias = (primero.getDay() + 6) % 7; // semana empieza en lunes
    const dias = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
    const lista: ({ fecha: string; num: number; libres: number; estado: 'pasado' | 'lleno' | 'pocos' | 'libre' } | null)[] = Array(vacias).fill(null);
    for (let d = 1; d <= dias; d++) {
      const f = aIso(new Date(m.getFullYear(), m.getMonth(), d));
      const libres = f < this.hoy ? 0 : libresDelDia(this.tramiteId(), f);
      lista.push({ fecha: f, num: d, libres, estado: f < this.hoy ? 'pasado' : libres === 0 ? 'lleno' : libres <= 6 ? 'pocos' : 'libre' });
    }
    return lista;
  });

  protected readonly bloques = computed(() => {
    cambiosBd();
    const f = this.fecha();
    return f ? disponibilidad(this.tramiteId(), f) : [];
  });
  protected readonly manana = computed(() => this.bloques().filter((b) => b.hora < '13:00'));
  protected readonly tarde = computed(() => this.bloques().filter((b) => b.hora >= '13:00'));
  protected readonly tituloDia = computed(() => {
    const f = this.fecha();
    if (!f) return '';
    const d = new Date(f + 'T00:00:00');
    return `${diaSemana(d)} ${d.getDate()} de ${MESES[d.getMonth()].toLowerCase()}`;
  });

  protected mover(delta: number): void {
    const m = this.mes();
    this.mes.set(new Date(m.getFullYear(), m.getMonth() + delta, 1));
  }

  protected elegirDia(f: string): void {
    this.fecha.set(f);
    this.hora.set(null);
  }
}
