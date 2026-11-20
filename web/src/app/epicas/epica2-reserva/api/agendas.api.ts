// Épica 2 · HU-10 Configuración de agendas y cupos.
// Simula GET/POST/PUT /api/v1/admin/agendas y GET /api/v1/disponibilidad?tramite=…&fecha=… (T01.2).
import { ApiError } from '../../../nucleo/api/api-error';
import { bd, esperar, guardar, nuevoId } from '../../../nucleo/api/base-datos';
import { Franja, TipoFranja, Tramite } from '../../../nucleo/modelos';
import { aIso, aMin, deMin, SEDE } from '../../../datos/semilla';
import { yo } from '../../epica1-autenticacion/api/auth.api';

export const BLOQUE_MIN = 30;

/** ¿La franja admite este trámite? DNI = mayores y menores · Recojo · Todos los trámites. */
export function admite(tipo: TipoFranja, t: Tramite | undefined): boolean {
  if (!t) return false;
  if (tipo === 'todos') return true;
  if (tipo === 'dni') return t.categoria === 'DNI mayores' || t.categoria === 'DNI menores';
  return t.categoria === 'Recojo de DNI';
}

export interface Bloque { hora: string; libres: number; porVentanilla: Record<number, number>; }

/** Cupos libres de cada bloque de 30 minutos para un trámite en una fecha (T01.2). */
export function disponibilidad(tramiteId: string, fecha: string): Bloque[] {
  const db = bd();
  const t = db.tramites.find((x) => x.id === tramiteId);
  const d = new Date(fecha + 'T00:00:00');
  const ahora = new Date();
  const esHoy = fecha === aIso(ahora);
  const minAhora = ahora.getHours() * 60 + ahora.getMinutes() + 30; // se reserva con al menos 30 min de anticipación
  const mapa = new Map<string, Bloque>();
  for (const f of db.franjas.filter((x) => x.dia === d.getDay() && admite(x.tipo, t))) {
    for (let m = aMin(f.inicio); m + BLOQUE_MIN <= aMin(f.fin); m += BLOQUE_MIN) {
      const hora = deMin(m);
      if (esHoy && m < minAhora) continue;
      const tomados = (db.ocupacion[`${fecha}|${hora}|${f.ventanilla}`] ?? 0)
        + db.citas.filter((c) => c.fecha === fecha && c.hora === hora && c.ventanilla === f.ventanilla && c.estado !== 'cancelada').length;
      const libres = Math.max(0, f.cupos - tomados);
      const b = mapa.get(hora) ?? { hora, libres: 0, porVentanilla: {} };
      b.libres += libres;
      b.porVentanilla[f.ventanilla] = libres;
      mapa.set(hora, b);
    }
  }
  return [...mapa.values()].sort((a, b) => a.hora.localeCompare(b.hora));
}

/** Resumen por día para el calendario: cupos libres totales (0 = lleno o sin atención). */
export function libresDelDia(tramiteId: string, fecha: string): number {
  const d = new Date(fecha + 'T00:00:00');
  if (d.getDay() === 0 || d.getDay() === 6) return 0;
  if (fecha < aIso(new Date())) return 0;
  return disponibilidad(tramiteId, fecha).reduce((s, b) => s + b.libres, 0);
}

// ---------- Administración de franjas ----------
function soloAdmin(token: string): void {
  if (yo(token).rol !== 'administrador') throw new ApiError(403, 'No tienes permiso para esta acción.');
}

export const franjasDe = (ventanilla: number): Franja[] => bd().franjas.filter((f) => f.ventanilla === ventanilla).sort((a, b) => a.dia - b.dia || a.inicio.localeCompare(b.inicio));

/** Cupos ofertados por día en una ventanilla (suma de bloques × cupos). */
export function cuposPorDia(ventanilla: number, dia: number): number {
  return bd().franjas.filter((f) => f.ventanilla === ventanilla && f.dia === dia).reduce((s, f) => s + ((aMin(f.fin) - aMin(f.inicio)) / BLOQUE_MIN) * f.cupos, 0);
}

/** Valida una franja: sin cruces, dentro del horario, en bloques de 30 min y con cupos válidos (T10.3). */
export function validarFranja(f: Omit<Franja, 'id'>, idActual?: number): Record<string, string> {
  const e: Record<string, string> = {};
  const ini = aMin(f.inicio), fin = aMin(f.fin);
  if (!SEDE.ventanillas.includes(f.ventanilla)) e['ventanilla'] = 'Elige la ventanilla 1, 2 o 3.';
  if (!(f.dia >= 1 && f.dia <= 5)) e['dia'] = 'Solo se atiende de lunes a viernes.';
  if (isNaN(ini) || isNaN(fin) || ini >= fin) e['horario'] = 'La hora de fin debe ser posterior a la de inicio.';
  else if (ini < aMin(SEDE.apertura) || fin > aMin(SEDE.cierre)) e['horario'] = `El horario de la sede es de ${SEDE.apertura} a ${SEDE.cierre}.`;
  else if (ini % BLOQUE_MIN || fin % BLOQUE_MIN) e['horario'] = 'Usa bloques de 30 minutos (por ejemplo, 11:30 o 12:00).';
  if (!(f.cupos >= 1 && f.cupos <= 10)) e['cupos'] = 'Los cupos por bloque deben estar entre 1 y 10.';
  if (!e['horario']) {
    const cruce = bd().franjas.find((x) => x.id !== idActual && x.ventanilla === f.ventanilla && x.dia === f.dia && aMin(x.inicio) < fin && ini < aMin(x.fin));
    if (cruce) e['cruce'] = `La franja se cruza con ${cruce.inicio}–${cruce.fin} de la Ventanilla ${f.ventanilla}. Cambia el horario para poder guardar.`;
  }
  return e;
}

export async function crearFranja(token: string, f: Omit<Franja, 'id'>): Promise<Franja> {
  await esperar(250);
  soloAdmin(token);
  const e = validarFranja(f);
  if (Object.keys(e).length) throw new ApiError(422, 'La franja no es válida.', e);
  const nueva: Franja = { ...f, id: nuevoId() };
  bd().franjas.push(nueva);
  guardar();
  return nueva;
}

export async function eliminarFranja(token: string, id: number): Promise<void> {
  await esperar(200);
  soloAdmin(token);
  const db = bd();
  const f = db.franjas.find((x) => x.id === id);
  if (!f) throw new ApiError(404, 'Franja no encontrada.');
  const hoy = aIso(new Date());
  const futuras = db.citas.filter((c) => c.estado === 'confirmada' && c.fecha >= hoy && c.ventanilla === f.ventanilla
    && new Date(c.fecha + 'T00:00:00').getDay() === f.dia && aMin(c.hora) >= aMin(f.inicio) && aMin(c.hora) < aMin(f.fin));
  if (futuras.length) throw new ApiError(422, `No se puede eliminar: hay ${futuras.length} cita(s) reservadas en esa franja. Reprográmalas primero.`);
  db.franjas = db.franjas.filter((x) => x.id !== id);
  guardar();
}

/** Porcentaje de cupos reservados en una semana (para el encabezado de Agendas). */
export function porcentajeReservado(fechas: string[]): number {
  const db = bd();
  let total = 0, tomados = 0;
  for (const fecha of fechas) {
    const dia = new Date(fecha + 'T00:00:00').getDay();
    for (const f of db.franjas.filter((x) => x.dia === dia)) {
      for (let m = aMin(f.inicio); m + BLOQUE_MIN <= aMin(f.fin); m += BLOQUE_MIN) {
        const hora = deMin(m);
        total += f.cupos;
        tomados += Math.min(f.cupos, (db.ocupacion[`${fecha}|${hora}|${f.ventanilla}`] ?? 0)
          + db.citas.filter((c) => c.fecha === fecha && c.hora === hora && c.ventanilla === f.ventanilla && c.estado !== 'cancelada').length);
      }
    }
  }
  return total ? Math.round((tomados / total) * 100) : 0;
}
