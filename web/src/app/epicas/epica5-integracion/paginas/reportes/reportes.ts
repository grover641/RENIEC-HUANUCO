import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Icono } from '../../../../compartido/componentes/icono/icono';
import { Logo } from '../../../../compartido/componentes/logo/logo';
import { GraficoBarras } from '../../../../compartido/componentes/graficos/grafico-barras';
import { ToastService } from '../../../../compartido/componentes/toast/toast.service';
import { mensajeDe } from '../../../../nucleo/api/api-error';
import { SesionService } from '../../../../nucleo/sesion/sesion.service';
import { SEDE } from '../../../../datos/semilla';
import { atendidosDe, descargarExcel, generarReporte, Reporte } from '../../api/reportes.api';

/** HU-08 · Reportes de uso (T08.3): rango de fechas, indicadores, gráficos, tabla y exportación a PDF y Excel. */
@Component({
  selector: 'app-reportes',
  imports: [Icono, Logo, GraficoBarras],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reportes.html',
  styles: `
    .filtros { display: flex; gap: 12px; align-items: flex-end; flex-wrap: wrap; margin-bottom: 16px; }
    .filtros .campo { min-width: 160px; }
    .kpi { background: #fff; border: 1px solid var(--borde); border-radius: 14px; padding: 16px; }
    .kpi small { display: block; font-size: 13px; color: var(--texto-2); } .kpi b { font-family: var(--fuente-titulo); font-weight: 900; font-size: 28px; color: var(--titulo); }
    .kpi span { display: block; font-size: 12px; } .ok { color: var(--exito); font-weight: 700; } .texto-2 { color: var(--texto-2); }
    .graficos { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; margin: 16px 0; }
    .graficos h3 { font-size: 15px; margin-bottom: 8px; }
    .tabla-tarjeta { padding: 0; overflow: hidden; } .tabla-tarjeta h3 { padding: 18px 20px 10px; }
    td.n, th.n { text-align: right; }
    @media (max-width: 1100px) { .graficos { grid-template-columns: 1fr; } }
  `,
})
export class Reportes {
  private readonly sesion = inject(SesionService);
  private readonly toast = inject(ToastService);
  protected readonly desde = signal('2026-10-26');
  protected readonly hasta = signal('2026-11-20');
  protected readonly ventanilla = signal<number | null>(null);
  protected readonly ventanillas = SEDE.ventanillas;
  protected readonly atendidosDe = atendidosDe;
  protected readonly reporte = signal<Reporte | null>(null);
  protected readonly sinDatos = signal(false);
  protected readonly cargando = signal(false);

  protected readonly espera = computed(() => this.reporte()?.semanas.map((s) => ({ etiqueta: s.etiqueta, valores: [s.espera] })) ?? []);
  protected readonly inasistencia = computed(() => this.reporte()?.semanas.map((s) => ({ etiqueta: s.etiqueta, valores: [s.inasistenciaPct] })) ?? []);
  protected readonly porVentanilla = computed(() => {
    const r = this.reporte();
    if (!r) return [];
    return r.porVentanilla.map((n, i) => ({ etiqueta: 'V' + (i + 1), valores: [n] })).filter((_, i) => !r.ventanilla || r.ventanilla === i + 1);
  });

  constructor() { void this.aplicar(); }

  protected async aplicar(): Promise<void> {
    const t = this.sesion.token();
    if (!t) return;
    this.cargando.set(true);
    try {
      const r = await generarReporte(t, this.desde(), this.hasta(), this.ventanilla());
      this.reporte.set(r);
      this.sinDatos.set(!r);
    } catch (e) { this.toast.error(mensajeDe(e)); }
    finally { this.cargando.set(false); }
  }

  protected pdf(): void { window.print(); }
  protected excel(): void { const r = this.reporte(); if (r) { descargarExcel(r, this.desde(), this.hasta()); this.toast.exito('Reporte descargado para Excel.'); } }
}
