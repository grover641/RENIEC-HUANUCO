import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Icono } from '../../../../compartido/componentes/icono/icono';
import { GraficoBarras } from '../../../../compartido/componentes/graficos/grafico-barras';
import { GraficoLinea } from '../../../../compartido/componentes/graficos/grafico-linea';
import { bd, cambiosBd } from '../../../../nucleo/api/base-datos';
import { fechaLarga, hora } from '../../../../nucleo/utilidades/formato';
import { aIso, ESTADISTICAS } from '../../../../datos/semilla';

type Rango = 'hoy' | '7' | '30';

/**
 * Dashboard del administrador (incluido en T08.3 · HU-08): indicadores del día frente a las metas,
 * gráficos y estado del sistema. Las cifras históricas son datos de ejemplo; los turnos atendidos
 * suman también los que se atienden en la demostración.
 */
@Component({
  selector: 'app-dashboard',
  imports: [NgTemplateOutlet, RouterLink, Icono, GraficoBarras, GraficoLinea],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  protected readonly e = ESTADISTICAS.hoy;
  protected readonly rango = signal<Rango>('hoy');
  protected readonly enTabla = signal(false);
  protected readonly cabecera = `Sede Huánuco · ${fechaLarga(new Date()).toLowerCase()} · actualizado a las ${hora(new Date())}`;

  /** Turnos atendidos en la demostración hoy, por ventanilla (se suman a la base del día). */
  private readonly demo = computed(() => {
    cambiosBd();
    const hoy = aIso(new Date());
    const extra = [0, 0, 0];
    for (const t of bd().turnos) if (t.estado === 'atendido' && t.id >= 13 && aIso(new Date(t.emitido)) === hoy) extra[t.ventanilla - 1]++;
    return extra;
  });
  protected readonly porVentanilla = computed(() => this.e.turnosPorVentanilla.map((v, i) => ({ etiqueta: 'V' + v.v, valores: [v.n + this.demo()[i]] })));
  protected readonly atendidos = computed(() => this.porVentanilla().reduce((s, b) => s + b.valores[0], 0));
  protected readonly esperaHora = this.e.esperaPorHora.map((p) => ({ etiqueta: p.h.slice(0, 5), valor: p.v }));
  protected readonly citasDia = ESTADISTICAS.citasPorDia.map((d) => ({ etiqueta: d.dia, valores: [d.digitales, d.presenciales] }));
  protected readonly digitalesSemana = Math.round((ESTADISTICAS.citasPorDia.reduce((s, d) => s + d.digitales, 0) / ESTADISTICAS.citasPorDia.reduce((s, d) => s + d.digitales + d.presenciales, 0)) * 100);
  protected readonly integ = computed(() => { cambiosBd(); return { ...bd().integracion }; }); // copia: así Angular nota los cambios
  protected readonly pendientes = computed(() => this.integ().pendientes.filter((p) => p.estado === 'pendiente').length);
}
