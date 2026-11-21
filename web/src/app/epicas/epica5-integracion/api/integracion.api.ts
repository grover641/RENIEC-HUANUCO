// Épica 5 · HU-04A Respaldo local de la sede y HU-04B Sincronización sin duplicados.
// En el sistema real: servidor local con la misma API Laravel + tabla pendientes_sync con UUID (T04A.1, T04B.1).
import { ApiError } from '../../../nucleo/api/api-error';
import { bd, esperar, guardar } from '../../../nucleo/api/base-datos';
import { Integracion } from '../../../nucleo/modelos';
import { yo } from '../../epica1-autenticacion/api/auth.api';

function soloAdmin(token: string): void {
  if (yo(token).rol !== 'administrador') throw new ApiError(403, 'No tienes permiso para esta acción.');
}

export const estadoIntegracion = (): Integracion => bd().integracion;
export const conflictosPendientes = (): number => bd().integracion.conflictos.length;

/** Demostración: simula que se cae el internet de la sede → las ventanillas pasan solas a modo local (T04A.2). */
export async function simularCaida(token: string): Promise<void> {
  await esperar(300);
  soloAdmin(token);
  const i = bd().integracion;
  i.internet = 'caido';
  i.central = 'sin-respuesta';
  i.modoLocal = true;
  i.eventos.unshift({ fecha: new Date().toISOString(), icono: 'wifi-off', texto: 'Se perdió la conexión a internet. Las ventanillas pasaron a modo local.' });
  guardar();
}

/** Vuelve la conexión: se envía en orden lo pendiente y se omite lo que ya existe (mismo UUID) (T04B.2). */
export async function restablecer(token: string): Promise<{ enviados: number; omitidos: number }> {
  await esperar(900);
  soloAdmin(token);
  const i = bd().integracion;
  i.internet = 'estable';
  i.central = 'conectado';
  i.modoLocal = false;
  const ya = new Set(i.pendientes.filter((p) => p.estado === 'enviado').map((p) => p.uuid));
  let enviados = 0, omitidos = 0;
  const bloqueados = new Set(['loc-1046', 'loc-1047']); // los 2 registros con conflicto esperan revisión
  for (const p of i.pendientes.filter((x) => x.estado === 'pendiente' && !bloqueados.has(x.uuid))) {
    if (ya.has(p.uuid)) { omitidos++; } else { enviados++; ya.add(p.uuid); }
    p.estado = 'enviado';
  }
  const ahora = new Date().toISOString();
  i.eventos.unshift({ fecha: ahora, icono: 'wifi', texto: `Internet restablecido. Se sincronizaron ${enviados} registro(s)${omitidos ? `, ${omitidos} duplicado(s) omitidos` : ''}.` });
  i.ultimaConsulta = ahora;
  guardar();
  return { enviados, omitidos };
}

/** El administrador decide qué dato vale en un conflicto (HU-04B, criterio de error). */
export async function resolverConflicto(token: string, id: number, usar: 'local' | 'central'): Promise<void> {
  await esperar(300);
  soloAdmin(token);
  const i = bd().integracion;
  const c = i.conflictos.find((x) => x.id === id);
  if (!c) throw new ApiError(404, 'El conflicto ya fue resuelto.');
  i.conflictos = i.conflictos.filter((x) => x.id !== id);
  const uuid = id === 1 ? 'loc-1046' : 'loc-1047';
  const p = i.pendientes.find((x) => x.uuid === uuid);
  if (p) p.estado = 'enviado';
  i.eventos.unshift({ fecha: new Date().toISOString(), icono: 'check-circle', texto: `Conflicto resuelto: ${c.titulo} · se usó el dato ${usar === 'local' ? 'local (sede)' : 'del sistema central'}.` });
  guardar();
}

/** Prueba la conexión con el sistema central (botón «Probar conexión»). */
export async function probarConexion(token: string): Promise<number> {
  await esperar(500);
  soloAdmin(token);
  const i = bd().integracion;
  if (i.internet === 'caido') throw new ApiError(503, 'Sin internet: el sistema central no responde. La sede sigue en modo local.');
  i.respuestaMs = 180 + Math.round(Math.random() * 120);
  i.ultimaConsulta = new Date().toISOString();
  guardar();
  return i.respuestaMs;
}
