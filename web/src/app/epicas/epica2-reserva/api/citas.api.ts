// Épica 2 · HU-01 Reserva de cita y HU-07 Cancelar o reprogramar.
// Simula POST /api/v1/citas (con bloqueo del cupo), GET /api/v1/citas y PATCH /citas/{id}/cancelar|reprogramar.
import { ApiError } from '../../../nucleo/api/api-error';
import { bd, esperar, guardar, nuevoId, tokenAleatorio } from '../../../nucleo/api/base-datos';
import { Cita } from '../../../nucleo/modelos';
import { diaSemana, hora as horaDe } from '../../../nucleo/utilidades/formato';
import { yo } from '../../epica1-autenticacion/api/auth.api';
import { guardarConsentimiento, notificar, programarRecordatorio } from '../../epica4-alertas/api/avisos.api';
import { aIso, aMin } from '../../../datos/semilla';
import { disponibilidad } from './agendas.api';

export const HORAS_LIMITE = 24; // HU-07

export const fechaHoraCita = (c: Pick<Cita, 'fecha' | 'hora'>) => new Date(`${c.fecha}T${c.hora}:00`);

/** ¿Se puede reprogramar o cancelar? Solo citas confirmadas con más de 24 h de anticipación. */
export function puedeModificar(c: Cita): boolean {
  return c.estado === 'confirmada' && fechaHoraCita(c).getTime() - Date.now() > HORAS_LIMITE * 3600000;
}

function nuevoCodigo(): string {
  const db = bd();
  let c = '';
  do { c = 'CR-' + tokenAleatorio(5, 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'); } while (db.citas.some((x) => x.codigo === c));
  return c;
}

/** Elige la ventanilla con más cupos libres en ese bloque. */
function elegirVentanilla(tramiteId: string, fecha: string, hora: string): number | null {
  const b = disponibilidad(tramiteId, fecha).find((x) => x.hora === hora);
  if (!b || b.libres <= 0) return null;
  return Number(Object.entries(b.porVentanilla).sort((a, z) => z[1] - a[1])[0][0]);
}

function sugerencias(tramiteId: string, fecha: string, hora: string): string[] {
  return disponibilidad(tramiteId, fecha).filter((b) => b.libres > 0)
    .sort((a, b) => Math.abs(aMin(a.hora) - aMin(hora)) - Math.abs(aMin(b.hora) - aMin(hora)))
    .slice(0, 3).map((b) => b.hora).sort();
}

/** La API también rechaza fechas pasadas (la pantalla ya no las deja elegir). */
function validarFecha(fecha: string): void {
  if (fecha < aIso(new Date())) throw new ApiError(422, 'No puedes elegir una fecha que ya pasó.');
}

const textoRecordatorio =(c: Cita) => { const d = new Date(fechaHoraCita(c).getTime() - 24 * 3600000); return `${diaSemana(d)} ${d.getDate()} a las ${horaDe(d)}`; };

export interface DatosReserva { tramiteId: string; fecha: string; hora: string; canal: 'whatsapp' | 'sms'; aceptaAvisos: boolean; }

/** HU-01 · Registra la cita, descuenta el cupo y entrega el código único (T01.3). */
export async function reservar(token: string, d: DatosReserva): Promise<Cita> {
  await esperar(450);
  const u = yo(token);
  if (u.rol !== 'ciudadano') throw new ApiError(403, 'Solo los ciudadanos pueden reservar citas.');
  const db = bd();
  const t = db.tramites.find((x) => x.id === d.tramiteId && x.publicado);
  if (!t || !d.fecha || !d.hora) throw new ApiError(422, 'Falta elegir el trámite, el día o la hora.');
  validarFecha(d.fecha);
  const ventanilla = elegirVentanilla(d.tramiteId, d.fecha, d.hora); // en PostgreSQL: SELECT … FOR UPDATE
  if (ventanilla === null) {
    throw new ApiError(409, 'Ese horario se acaba de llenar. Elige otro cercano.', { sugerencias: sugerencias(d.tramiteId, d.fecha, d.hora).join(',') });
  }
  if (d.aceptaAvisos) {
    const usuario = db.usuarios.find((x) => x.id === u.id)!;
    const previo = usuario.consentimiento;
    await guardarConsentimiento(token, {
      whatsapp: d.canal === 'whatsapp' || !!previo?.whatsapp, sms: d.canal === 'sms' || (previo?.sms ?? true),
      tipos: previo?.tipos ?? { confirmacion: true, recordatorio: true, cambio: true, dniListo: true },
    });
  }
  const cita: Cita = {
    id: nuevoId(), codigo: nuevoCodigo(), ciudadanoId: u.id, nombre: `${u.nombres} ${u.apellidos}`, dni: u.dni,
    tramiteId: t.id, fecha: d.fecha, hora: d.hora, ventanilla, estado: 'confirmada', creada: new Date().toISOString(),
  };
  db.citas.push(cita);
  notificar(u.id, cita.nombre, u.dni, 'confirmacion', 'Confirmación de cita', `Cita ${cita.codigo} confirmada: ${t.nombre}, ${d.hora}.`);
  programarRecordatorio(u.id, cita.nombre, u.dni, cita.codigo, textoRecordatorio(cita));
  guardar();
  return cita;
}

export function misCitas(token: string): Cita[] {
  const u = yo(token, false);
  return bd().citas.filter((c) => c.ciudadanoId === u.id).sort((a, b) => (b.fecha + b.hora).localeCompare(a.fecha + a.hora));
}

function citaPropia(token: string, id: number): Cita {
  const u = yo(token);
  const c = bd().citas.find((x) => x.id === id);
  if (!c) throw new ApiError(404, 'Cita no encontrada.');
  if (c.ciudadanoId !== u.id) throw new ApiError(403, 'Esta cita no es tuya.');
  if (!puedeModificar(c)) throw new ApiError(422, 'Faltan menos de 24 horas o la cita ya no está vigente: comunícate por los canales de atención.');
  return c;
}

/** HU-07 · Cancelar: libera el cupo. */
export async function cancelar(token: string, id: number): Promise<Cita> {
  await esperar(350);
  const c = citaPropia(token, id);
  c.estado = 'cancelada';
  notificar(c.ciudadanoId, c.nombre, c.dni, 'cambio', 'Cancelación de cita', `Tu cita ${c.codigo} fue cancelada y el cupo quedó libre.`);
  guardar();
  return c;
}

/** HU-07 · Reprogramar: libera el cupo original y genera un nuevo código. */
export async function reprogramar(token: string, id: number, fecha: string, hora: string): Promise<Cita> {
  await esperar(450);
  const anterior = citaPropia(token, id);
  validarFecha(fecha);
  const ventanilla = elegirVentanilla(anterior.tramiteId, fecha, hora);
  if (ventanilla === null) throw new ApiError(409, 'Ese horario se acaba de llenar. Elige otro cercano.');
  const db = bd();
  anterior.estado = 'cancelada';
  const nueva: Cita = { ...anterior, id: nuevoId(), codigo: nuevoCodigo(), fecha, hora, ventanilla, estado: 'confirmada', creada: new Date().toISOString() };
  db.citas.push(nueva);
  notificar(nueva.ciudadanoId, nueva.nombre, nueva.dni, 'cambio', 'Cita reprogramada', `Tu cita ${anterior.codigo} ahora es ${nueva.codigo}, a las ${hora}.`);
  programarRecordatorio(nueva.ciudadanoId, nueva.nombre, nueva.dni, nueva.codigo, textoRecordatorio(nueva));
  guardar();
  return nueva;
}
