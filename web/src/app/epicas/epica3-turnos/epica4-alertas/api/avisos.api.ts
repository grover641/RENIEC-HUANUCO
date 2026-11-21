// Épica 4 · Alertas y notificaciones.
// HU-13 Consentimiento: GET y PUT /api/v1/perfil/notificaciones
// HU-03 Alertas: Laravel Notifications (WhatsApp Business API + pasarela SMS) y tabla bitacora_alertas.
import { ApiError } from '../../../nucleo/api/api-error';
import { bd, esperar, guardar, nuevoId } from '../../../nucleo/api/base-datos';
import { Aviso, Consentimiento, UsuarioPublico } from '../../../nucleo/modelos';
import { yo } from '../../epica1-autenticacion/api/auth.api';

export type TipoAviso = Aviso['tipo'];
const CLAVE_TIPO: Record<TipoAviso, keyof Consentimiento['tipos']> = { confirmacion: 'confirmacion', recordatorio: 'recordatorio', cambio: 'cambio', 'dni-listo': 'dniListo' };

/** Plantillas de mensajes (T03.2): cortas y sin datos personales completos. */
export const PLANTILLAS: Record<TipoAviso, string> = {
  confirmacion: 'CitaRENIEC: tu cita {codigo} quedó confirmada para el {fecha} a las {hora}. Llega 10 min antes.',
  recordatorio: 'CitaRENIEC: te recordamos tu cita {codigo} de mañana a las {hora}. Si no puedes ir, reprograma en la web.',
  cambio: 'CitaRENIEC: tu cita {codigo} cambió. Revisa los detalles en «Mis citas».',
  'dni-listo': 'CitaRENIEC: tu DNI ya está listo para recoger en la sede Huánuco. Reserva tu cita de recojo.',
};

export function consentimientoDe(usuarioId: number | null): Consentimiento | null {
  if (usuarioId === null) return null;
  const c = bd().usuarios.find((u) => u.id === usuarioId)?.consentimiento ?? null;
  return c && !c.revocado ? c : null;
}

/**
 * Envía un aviso respetando el consentimiento (HU-13). Si WhatsApp falla, reenvía por SMS (HU-03).
 * En la demostración WhatsApp «falla» cuando el celular termina en 0 (para ver el respaldo por SMS).
 * No guarda: la función que lo llama guarda al final de su transacción.
 */
export function notificar(ciudadanoId: number | null, nombre: string, dni: string, tipo: TipoAviso, titulo: string, detalle: string): void {
  const db = bd();
  const ahora = new Date().toISOString();
  const c = consentimientoDe(ciudadanoId);
  const base = { ciudadanoId, nombre, dni, tipo, titulo, detalle, fecha: ahora, leido: false };
  if (!c || !c.tipos[CLAVE_TIPO[tipo]] || (!c.whatsapp && !c.sms)) {
    db.avisos.unshift({ id: nuevoId(), ...base, canal: 'WhatsApp', estado: 'sin-consentimiento', leido: true, nota: 'No se envió: sin consentimiento' });
    return;
  }
  const celular = db.usuarios.find((u) => u.id === ciudadanoId)?.celular ?? '';
  if (c.whatsapp) {
    const falla = celular.endsWith('0');
    db.avisos.unshift({ id: nuevoId(), ...base, canal: 'WhatsApp', estado: falla ? 'fallo' : 'enviado', leido: falla, nota: falla ? 'Número sin WhatsApp' : 'Entregado' });
    if (!falla) return;
    if (c.sms) db.avisos.unshift({ id: nuevoId(), ...base, canal: 'SMS', estado: 'reenviado-sms', nota: 'Reenviado por SMS en menos de 1 minuto' });
    return;
  }
  db.avisos.unshift({ id: nuevoId(), ...base, canal: 'SMS', estado: 'enviado', nota: 'Entregado' });
}

/** Deja programado el recordatorio de 24 h antes (tarea programada cada hora, T03.3). */
export function programarRecordatorio(ciudadanoId: number | null, nombre: string, dni: string, codigo: string, cuando: string): void {
  if (!consentimientoDe(ciudadanoId)?.tipos.recordatorio) return;
  bd().avisos.unshift({ id: nuevoId(), ciudadanoId, nombre, dni, tipo: 'recordatorio', titulo: 'Recordatorio programado',
    detalle: `Te escribiremos el ${cuando} por tu cita ${codigo}.`, canal: 'WhatsApp', estado: 'programado', fecha: new Date().toISOString(), leido: true, nota: 'Con SMS de respaldo' });
}

// ---------- HU-13 · Consentimiento ----------
export function leerConsentimiento(token: string): Consentimiento | null {
  const u = yo(token, false);
  return bd().usuarios.find((x) => x.id === u.id)?.consentimiento ?? null;
}

export async function guardarConsentimiento(token: string, datos: Omit<Consentimiento, 'fecha' | 'revocado'>): Promise<Consentimiento> {
  await esperar(250);
  const u = yo(token);
  if (u.rol !== 'ciudadano') throw new ApiError(403, 'Solo el propio ciudadano puede cambiar sus avisos.');
  const db = bd();
  const usuario = db.usuarios.find((x) => x.id === u.id)!;
  const ahora = new Date().toISOString();
  const algunCanal = datos.whatsapp || datos.sms;
  const anterior = usuario.consentimiento;
  usuario.consentimiento = {
    ...datos,
    fecha: algunCanal && (!anterior || anterior.revocado) ? ahora : anterior?.fecha ?? ahora,
    revocado: algunCanal ? null : ahora, // revocar no borra: guarda la fecha (T13.1)
  };
  guardar();
  return usuario.consentimiento;
}

// ---------- Mis avisos (ciudadano) ----------
export function misAvisos(token: string): Aviso[] {
  const u = yo(token, false);
  return bd().avisos.filter((a) => a.ciudadanoId === u.id && a.estado !== 'sin-consentimiento');
}

export function marcarLeidos(token: string): void {
  const u = yo(token, false);
  let cambio = false;
  bd().avisos.forEach((a) => { if (a.ciudadanoId === u.id && !a.leido) { a.leido = true; cambio = true; } });
  if (cambio) guardar();
}

// ---------- Bitácora para el administrador (T03.4 / T03.5) ----------
export function bitacora(token: string): Aviso[] {
  const u: UsuarioPublico = yo(token, false);
  if (u.rol !== 'administrador') throw new ApiError(403, 'No tienes permiso para ver la bitácora.');
  return bd().avisos.filter((a) => a.estado !== 'programado');
}
