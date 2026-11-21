// Épica 5 · HU-08 Reportes de uso. Simula GET /api/v1/admin/reportes?desde=…&hasta=… y la exportación (T08.1, T08.2).
import { ApiError } from '../../../nucleo/api/api-error';
import { esperar } from '../../../nucleo/api/base-datos';
import { ESTADISTICAS } from '../../../datos/semilla';
import { yo } from '../../epica1-autenticacion/api/auth.api';

export type Semana = (typeof ESTADISTICAS.semanas)[number];
export interface Reporte {
  semanas: Semana[];
  citas: number; atendidos: number; espera: number; digitalesPct: number; inasistenciaPct: number; inasistencias: number;
  porVentanilla: number[];
  /** Ventanilla elegida (1 a 3) o null para toda la sede. Solo los turnos atendidos se separan por ventanilla. */
  ventanilla: number | null;
}

/** Turnos atendidos de una semana: de toda la sede o de una sola ventanilla. */
export const atendidosDe = (s: Semana, ventanilla: number | null) => (ventanilla ? s.porVentanilla[ventanilla - 1] : s.atendidos);

export async function generarReporte(token: string, desde: string, hasta: string, ventanilla: number | null = null): Promise<Reporte | null> {
  await esperar(350);
  if (yo(token).rol !== 'administrador') throw new ApiError(403, 'No tienes permiso para ver los reportes.');
  if (desde && hasta && desde > hasta) throw new ApiError(422, 'La fecha «desde» debe ser anterior a «hasta».');
  const semanas = ESTADISTICAS.semanas.filter((s) => (!desde || s.hasta >= desde) && (!hasta || s.desde <= hasta));
  if (!semanas.length) return null; // «sin datos»
  const citas = semanas.reduce((a, s) => a + s.citas, 0);
  const pond = (f: (s: Semana) => number) => semanas.reduce((a, s) => a + f(s) * s.citas, 0) / citas;
  const porVentanilla = [0, 1, 2].map((i) => semanas.reduce((a, s) => a + s.porVentanilla[i], 0));
  const inasistenciaPct = Math.round(pond((s) => s.inasistenciaPct) * 10) / 10;
  return {
    semanas, citas, atendidos: semanas.reduce((a, s) => a + atendidosDe(s, ventanilla), 0), espera: Math.round(pond((s) => s.espera)),
    digitalesPct: Math.round(pond((s) => s.digitalesPct)), inasistenciaPct, inasistencias: Math.round((citas * inasistenciaPct) / 100), porVentanilla, ventanilla,
  };
}

/** Exportar a Excel: archivo CSV con BOM para que Excel lo abra con tildes (en Laravel: Laravel Excel). */
export function descargarExcel(r: Reporte, desde: string, hasta: string): void {
  const v = r.ventanilla;
  const filas = v
    ? [
        ['Semana', 'Citas (sede)', '% digitales (sede)', 'Espera promedio (min, sede)', '% inasistencias (sede)', `Atendidos V${v}`],
        ...r.semanas.map((s) => [s.etiqueta, s.citas, s.digitalesPct, s.espera, s.inasistenciaPct, atendidosDe(s, v)]),
        ['Total', r.citas, r.digitalesPct, r.espera, r.inasistenciaPct, r.atendidos],
      ]
    : [
        ['Semana', 'Citas', '% digitales', 'Espera promedio (min)', '% inasistencias', 'Atendidos', 'V1', 'V2', 'V3'],
        ...r.semanas.map((s) => [s.etiqueta, s.citas, s.digitalesPct, s.espera, s.inasistenciaPct, s.atendidos, ...s.porVentanilla]),
        ['Total', r.citas, r.digitalesPct, r.espera, r.inasistenciaPct, r.atendidos, ...r.porVentanilla],
      ];
  // Excel en español usa coma decimal; solo se cambia el punto en los números.
  const celda = (c: string | number) => `"${typeof c === 'number' ? String(c).replace('.', ',') : c}"`;
  const csv = '﻿' + filas.map((f) => f.map(celda).join(';')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `reporte-citareniec_${desde || 'inicio'}_${hasta || 'hoy'}${v ? '_V' + v : ''}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
