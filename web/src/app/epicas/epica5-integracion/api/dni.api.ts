// Épica 5 · HU-14 Estado «DNI listo» del sistema central.
// EstadoDniService (T14.2) con simulador · tarea programada cada 30 min (T14.3) · tabla tramites_dni.
import { ApiError } from '../../../nucleo/api/api-error';
import { bd, esperar, guardar, nuevoId } from '../../../nucleo/api/base-datos';
import { EstadoDni, TramiteDni, Turno } from '../../../nucleo/modelos';
import { yo } from '../../epica1-autenticacion/api/auth.api';
import { notificar } from '../../epica4-alertas/api/avisos.api';

export const ORDEN_ESTADOS: EstadoDni[] = ['solicitado', 'en-proceso', 'listo', 'entregado'];
export const NOMBRE_ESTADO: Record<EstadoDni, string> = { solicitado: 'Solicitado', 'en-proceso': 'En proceso', listo: 'Listo para recojo', entregado: 'Entregado' };
export const EXPLICACION: Record<EstadoDni, string> = {
  solicitado: 'Registramos tu trámite en la sede.',
  'en-proceso': 'Tu DNI se está validando y emitiendo en el sistema central.',
  listo: 'Ya llegó a la sede Huánuco. Puedes recogerlo.',
  entregado: 'Recibiste tu DNI. El trámite terminó.',
};
const TRAMITES_DNI: Record<string, string> = { duplicado: 'Duplicado de DNI', renovacion: 'Renovación de DNI', menor: 'DNI por primera vez (menor)', 'foto-firma': 'Actualización de foto y firma', rectificacion: 'Rectificación de datos' };

/** Al atender un trámite de DNI en ventanilla, queda «Solicitado» (lo llama el panel de turnos). No guarda. */
export function registrarSolicitudDni(t: Turno): void {
  const tipo = TRAMITES_DNI[t.tramiteId];
  if (t.tramiteId === 'recojo') {
    const listo = bd().tramitesDni.find((x) => x.dni === t.dni && x.estado === 'listo');
    if (listo) { listo.estado = 'entregado'; listo.fechas.entregado = new Date().toISOString(); listo.sincronizado = new Date().toISOString(); }
    return;
  }
  if (!tipo) return;
  const cita = t.citaId ? bd().citas.find((c) => c.id === t.citaId) : null;
  const ahora = new Date().toISOString();
  bd().tramitesDni.push({ id: nuevoId(), ciudadanoId: t.ciudadanoId, dni: t.dni, titular: t.nombre, tipo, estado: 'solicitado', fechas: { solicitado: ahora }, ventanilla: t.ventanilla, citaCodigo: cita?.codigo ?? null, sincronizado: ahora });
}

/** Consulta pública «¿Mi DNI está listo?» con el DNI (sin iniciar sesión). */
export async function consultarPorDni(dni: string): Promise<TramiteDni | null> {
  await esperar(400);
  if (!/^\d{8}$/.test(dni)) throw new ApiError(422, 'Ingresa los 8 dígitos de tu DNI.');
  if (bd().integracion.central === 'sin-respuesta') throw new ApiError(503, 'El sistema central no responde en este momento. Inténtalo en unos minutos.');
  return bd().tramitesDni.filter((t) => t.dni === dni).sort((a, b) => (b.fechas.solicitado ?? '').localeCompare(a.fechas.solicitado ?? ''))[0] ?? null;
}

export function misTramites(token: string): TramiteDni[] {
  const u = yo(token, false);
  return bd().tramitesDni.filter((t) => t.ciudadanoId === u.id || t.dni === u.dni).sort((a, b) => (b.fechas.solicitado ?? '').localeCompare(a.fechas.solicitado ?? ''));
}

/**
 * Consulta periódica al sistema central (simulador): cada trámite pendiente avanza un estado.
 * Al pasar a «listo para recojo» se lanza el aviso «DNI listo» (HU-03).
 */
export async function consultarSistemaCentral(token: string): Promise<number> {
  await esperar(700);
  const u = yo(token);
  if (u.rol !== 'administrador') throw new ApiError(403, 'No tienes permiso para esta acción.');
  const db = bd();
  if (db.integracion.central === 'sin-respuesta' || db.integracion.internet === 'caido') {
    throw new ApiError(503, 'El sistema central no responde. Se conserva el último estado y se reintentará.');
  }
  const ahora = new Date().toISOString();
  let cambios = 0;
  for (const t of db.tramitesDni.filter((x) => x.estado === 'solicitado' || x.estado === 'en-proceso')) {
    t.estado = t.estado === 'solicitado' ? 'en-proceso' : 'listo';
    t.fechas[t.estado] = ahora;
    t.sincronizado = ahora;
    cambios++;
    if (t.estado === 'listo') notificar(t.ciudadanoId, t.titular, t.dni, 'dni-listo', 'DNI listo', 'Tu DNI ya está listo. Reserva tu cita de recojo en la sede Huánuco.');
  }
  db.integracion.ultimaConsulta = ahora;
  db.integracion.respuestaMs = 180 + Math.round(Math.random() * 120);
  db.integracion.eventos.unshift({ fecha: ahora, icono: 'database', texto: cambios ? `${cambios} estado(s) de DNI actualizados desde el sistema central.` : 'Consulta al sistema central: sin cambios.' });
  guardar();
  return cambios;
}
