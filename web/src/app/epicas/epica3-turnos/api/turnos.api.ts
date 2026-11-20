// Épica 3 · Turnos digitales inteligentes.
// HU-09 POST /api/v1/turnos/checkin · HU-02 GET /ventanillas/{id}/turnos, PATCH /turnos/{id}/llamar|atender
// HU-05 GET /turnos/{codigo}/estado · HU-06 PATCH /turnos/{id} (con motivo) + tabla auditoria_turnos
import { ApiError } from '../../../nucleo/api/api-error';
import { bd, esperar, guardar, nuevoId, tokenAleatorio } from '../../../nucleo/api/base-datos';
import { Cita, Prioridad, Turno } from '../../../nucleo/modelos';
import { aIso, aMin } from '../../../datos/semilla';
import { yo } from '../../epica1-autenticacion/api/auth.api';
import { registrarSolicitudDni } from '../../epica5-integracion/api/dni.api';

export const TOLERANCIA_MIN = 15; // se acepta llegar hasta 15 min tarde
export const ETIQUETA_PRIORIDAD: Record<string, string> = { gestante: 'Gestante', 'adulto-mayor': 'Adulto mayor', discapacidad: 'Persona con discapacidad' };
export const MOTIVOS = ['Atención prioritaria a población vulnerable', 'Corrección de un error de registro', 'Ausencia al ser llamado', 'Otro (detallar)'];

function operador(token: string) {
  const u = yo(token);
  if (u.rol !== 'operador') throw new ApiError(403, 'Solo los operadores de ventanilla pueden hacer esto.');
  if (!u.ventanilla) throw new ApiError(422, 'No tienes una ventanilla asignada. Pide al administrador que te asigne una.');
  return u;
}

const hoy = () => aIso(new Date());
const deHoy = (t: Turno) => aIso(new Date(t.emitido)) === hoy();

/**
 * Orden de la cola (T09.3): 1.º atención preferente (Ley N.º 28683), 2.º hora de la cita, 3.º hora de llegada.
 * Quien llegó tarde o no tiene cita va por orden de llegada, después de las citas puntuales.
 */
export function ordenar(a: Turno, b: Turno): number {
  const pa = a.prioridad ? 0 : 1, pb = b.prioridad ? 0 : 1;
  if (pa !== pb) return pa - pb;
  if (pa === 0) return a.emitido - b.emitido;
  const ha = (!a.tarde && a.horaCita) || '99:99', hb = (!b.tarde && b.horaCita) || '99:99';
  return ha.localeCompare(hb) || a.emitido - b.emitido;
}

export function colaDe(ventanilla: number): Turno[] {
  return bd().turnos.filter((t) => deHoy(t) && t.ventanilla === ventanilla && t.estado === 'espera').sort(ordenar);
}
export const actualDe = (ventanilla: number): Turno | null =>
  bd().turnos.filter((t) => deHoy(t) && t.ventanilla === ventanilla && t.estado === 'llamado').sort((a, b) => (b.llamado ?? 0) - (a.llamado ?? 0))[0] ?? null;

export function resumenVentanilla(ventanilla: number) {
  const del = bd().turnos.filter((t) => deHoy(t) && t.ventanilla === ventanilla);
  const atendidos = del.filter((t) => t.estado === 'atendido');
  const esperas = atendidos.filter((t) => t.llamado).map((t) => ((t.llamado ?? 0) - t.emitido) / 60000);
  return {
    enCola: del.filter((t) => t.estado === 'espera').length,
    atendidos: atendidos.length,
    ausentes: del.filter((t) => t.estado === 'ausente').length,
    esperaPromedio: esperas.length ? Math.round(esperas.reduce((s, x) => s + x, 0) / esperas.length) : 0,
  };
}

/** Últimos llamados de todas las ventanillas (pantalla de sala, HU-02). */
export function ultimosLlamados(n = 5): Turno[] {
  return bd().turnos.filter((t) => deHoy(t) && t.llamado).sort((a, b) => (b.llamado ?? 0) - (a.llamado ?? 0)).slice(0, n);
}

function siguienteNumero(local: boolean): string {
  const pref = local ? 'HCO-' : 'A-';
  const nums = bd().turnos.filter((t) => deHoy(t) && t.numero.startsWith(pref)).map((t) => Number(t.numero.slice(pref.length)));
  const n = (nums.length ? Math.max(...nums) : local ? 30 : 0) + 1;
  return pref + String(n).padStart(3, '0');
}

function auditar(turno: string, operadorNombre: string, accion: string, motivo: string): void {
  bd().auditoria.unshift({ id: nuevoId(), turno, operador: operadorNombre, accion, motivo, fecha: new Date().toISOString() });
}

/** Si la sede está en modo local (HU-04A), cada movimiento queda en la cola de sincronización (HU-04B). */
function registrarLocal(tipo: string, detalle: string): void {
  const integ = bd().integracion;
  if (!integ.modoLocal) return;
  integ.pendientes.push({ id: nuevoId(), uuid: 'loc-' + tokenAleatorio(10), tipo, detalle, fecha: new Date().toISOString(), estado: 'pendiente' });
}

// ---------- HU-09 · Check-in ----------
export type ResultadoBusqueda =
  | { tipo: 'cita'; cita: Cita; fueraDeHorario: boolean; yaTieneTurno: Turno | null }
  | { tipo: 'sin-cita'; dni: string };

export function buscarCita(token: string, texto: string): ResultadoBusqueda {
  operador(token);
  const q = texto.trim().toUpperCase();
  if (!q) throw new ApiError(422, 'Escribe el código de cita o el DNI.');
  const db = bd();
  const cita = db.citas.find((c) => c.fecha === hoy() && c.estado === 'confirmada' && (c.codigo === q || c.dni === q))
    ?? db.citas.find((c) => c.fecha === hoy() && c.estado === 'atendida' && (c.codigo === q || c.dni === q));
  if (!cita) {
    if (/^\d{8}$/.test(q)) return { tipo: 'sin-cita', dni: q };
    throw new ApiError(404, 'No encontramos una cita para hoy con ese código.');
  }
  const yaTieneTurno = db.turnos.find((t) => deHoy(t) && t.citaId === cita.id) ?? null;
  return { tipo: 'cita', cita, fueraDeHorario: llegoTarde(cita), yaTieneTurno };
}

/** ¿Llegó después de la hora de su cita más la tolerancia de 15 minutos? */
function llegoTarde(cita: Cita): boolean {
  const ahora = new Date();
  return ahora.getHours() * 60 + ahora.getMinutes() > aMin(cita.hora) + TOLERANCIA_MIN;
}

export async function emitirTurno(token: string, citaId: number | null, prioridad: Prioridad, datosSinCita?: { dni: string; tramiteId: string; nombre: string }): Promise<Turno> {
  await esperar(350);
  const op = operador(token);
  const db = bd();
  const cita = citaId ? db.citas.find((c) => c.id === citaId) : null;
  if (citaId && !cita) throw new ApiError(404, 'Cita no encontrada.');
  if (cita && db.turnos.some((t) => deHoy(t) && t.citaId === cita.id)) throw new ApiError(422, 'Esta cita ya tiene un turno emitido.');
  const local = db.integracion.modoLocal;
  const tarde = !!cita && llegoTarde(cita);
  const turno: Turno = {
    id: nuevoId(), numero: siguienteNumero(local), citaId: cita?.id ?? null, ciudadanoId: cita?.ciudadanoId ?? null,
    nombre: cita?.nombre ?? datosSinCita?.nombre ?? 'Ciudadano sin cita', dni: cita?.dni ?? datosSinCita?.dni ?? '',
    tramiteId: cita?.tramiteId ?? datosSinCita?.tramiteId ?? 'recojo', ventanilla: cita?.ventanilla ?? op.ventanilla!,
    horaCita: cita?.hora ?? null, tarde, prioridad, estado: 'espera', emitido: Date.now(), llamado: null, terminado: null, local,
  };
  db.turnos.push(turno);
  const operadorNombre = `${op.nombres} ${op.apellidos}`;
  if (tarde) auditar(turno.numero, operadorNombre, 'Check-in fuera de horario', `Cita de las ${cita!.hora}: se atiende por orden de llegada`);
  if (prioridad) auditar(turno.numero, operadorNombre, 'Check-in con atención preferente', ETIQUETA_PRIORIDAD[prioridad]);
  registrarLocal('Check-in y turno', `Turno ${turno.numero}${cita ? ' · cita ' + cita.codigo : ' · sin cita'}`);
  guardar();
  return turno;
}

// ---------- HU-02 · Llamar y atender ----------
function cerrarActual(ventanilla: number, estado: 'atendido' | 'ausente'): Turno | null {
  const actual = actualDe(ventanilla);
  if (!actual) return null;
  actual.estado = estado;
  actual.terminado = Date.now();
  if (estado === 'atendido') {
    const cita = actual.citaId ? bd().citas.find((c) => c.id === actual.citaId) : null;
    if (cita) cita.estado = 'atendida';
    registrarSolicitudDni(actual); // los trámites de DNI pasan a «Solicitado» en el sistema central (HU-14)
  }
  registrarLocal('Atención cerrada', `Turno ${actual.numero} · ${estado}`);
  return actual;
}

export async function llamarSiguiente(token: string): Promise<Turno | null> {
  await esperar(250);
  const op = operador(token);
  cerrarActual(op.ventanilla!, 'atendido');
  const sig = colaDe(op.ventanilla!)[0] ?? null;
  if (sig) { sig.estado = 'llamado'; sig.llamado = Date.now(); }
  guardar();
  return sig;
}

export async function marcarAtendido(token: string): Promise<void> {
  await esperar(200);
  const op = operador(token);
  if (!cerrarActual(op.ventanilla!, 'atendido')) throw new ApiError(422, 'No hay un turno en atención.');
  guardar();
}

export async function marcarAusente(token: string, motivo: string): Promise<void> {
  await esperar(200);
  const op = operador(token);
  if (!motivo.trim()) throw new ApiError(422, 'Escribe el motivo para continuar.', { motivo: 'Escribe el motivo para continuar.' });
  const t = cerrarActual(op.ventanilla!, 'ausente');
  if (!t) throw new ApiError(422, 'No hay un turno en atención.');
  const cita = t.citaId ? bd().citas.find((c) => c.id === t.citaId) : null;
  if (cita) cita.estado = 'no-asistio';
  auditar(t.numero, `${op.nombres} ${op.apellidos}`, 'Marcado como ausente', motivo.trim());
  guardar();
}

export async function rellamar(token: string): Promise<void> {
  await esperar(150);
  const op = operador(token);
  const actual = actualDe(op.ventanilla!);
  if (!actual) throw new ApiError(422, 'No hay un turno en atención.');
  actual.llamado = Date.now();
  guardar();
}

// ---------- HU-06 · Repriorizar (siempre con motivo) ----------
export async function repriorizar(token: string, turnoId: number, prioridad: Prioridad, motivo: string): Promise<Turno> {
  await esperar(300);
  const op = operador(token);
  const t = bd().turnos.find((x) => x.id === turnoId);
  if (!t) throw new ApiError(404, 'Turno no encontrado.');
  if (t.estado !== 'espera') throw new ApiError(422, 'Solo se puede repriorizar un turno que está en espera.');
  if (t.ventanilla !== op.ventanilla) throw new ApiError(403, 'Ese turno es de otra ventanilla.');
  if (!motivo.trim()) throw new ApiError(422, 'Escribe el motivo para continuar.', { motivo: 'Escribe el motivo para continuar. Quedará registrado en la bitácora.' });
  const antes = t.prioridad ? ETIQUETA_PRIORIDAD[t.prioridad] : 'Sin prioridad';
  t.prioridad = prioridad;
  auditar(t.numero, `${op.nombres} ${op.apellidos}`, `Prioridad: ${antes} → ${prioridad ? ETIQUETA_PRIORIDAD[prioridad] : 'Sin prioridad'}`, motivo.trim());
  registrarLocal('Cambio de turno', `Turno ${t.numero} repriorizado`);
  guardar();
  return t;
}

export const auditoriaDe = (numero: string) => bd().auditoria.filter((a) => a.turno === numero);

// ---------- HU-05 · Estado del turno (sin datos personales) ----------
export interface EstadoTurno { turno: Turno; delante: Turno[]; minutos: number; tramite: string; }

export function estadoTurno(codigo: string): EstadoTurno {
  const q = codigo.trim().toUpperCase();
  const db = bd();
  let t = db.turnos.find((x) => deHoy(x) && x.numero === q);
  if (!t) {
    const cita = db.citas.find((c) => c.codigo === q);
    if (cita) t = db.turnos.find((x) => deHoy(x) && x.citaId === cita.id);
  }
  if (!t || t.estado === 'atendido' || t.estado === 'ausente') {
    throw new ApiError(404, 'No encontramos un turno activo con ese código. Verifica el código o reserva una cita.');
  }
  const cola = colaDe(t.ventanilla);
  const i = cola.findIndex((x) => x.id === t!.id);
  const delante = i < 0 ? [] : cola.slice(0, i);
  const duracion = (id: string) => db.tramites.find((x) => x.id === id)?.duracionMin ?? 15;
  const actual = actualDe(t.ventanilla);
  const restoActual = actual && t.estado === 'espera' ? Math.max(1, duracion(actual.tramiteId) - Math.round((Date.now() - (actual.llamado ?? Date.now())) / 60000)) : 0;
  const minutos = t.estado === 'llamado' ? 0 : delante.reduce((s, x) => s + duracion(x.tramiteId), 0) + restoActual; // T05.1
  return { turno: t, delante, minutos, tramite: db.tramites.find((x) => x.id === t!.tramiteId)?.nombre ?? '' };
}

/** Turno activo de hoy del ciudadano que inició sesión («Mi turno»). */
export function miTurnoHoy(token: string): EstadoTurno | null {
  const u = yo(token, false);
  const t = bd().turnos.find((x) => deHoy(x) && x.ciudadanoId === u.id && (x.estado === 'espera' || x.estado === 'llamado'));
  return t ? estadoTurno(t.numero) : null;
}
