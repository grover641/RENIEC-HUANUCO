// Épica 2 · HU-10 Tipos de trámite (catálogo). Simula GET /api/v1/tramites y POST/PUT /api/v1/admin/tramites.
import { ApiError } from '../../../nucleo/api/api-error';
import { bd, esperar, guardar } from '../../../nucleo/api/base-datos';
import { Tramite } from '../../../nucleo/modelos';
import { yo } from '../../epica1-autenticacion/api/auth.api';

export const CATEGORIAS: Tramite['categoria'][] = ['DNI mayores', 'DNI menores', 'Recojo de DNI', 'Rectificaciones', 'Otros'];
export const ICONOS_TRAMITE = ['copy', 'refresh', 'baby', 'package', 'file-pen', 'camera', 'id-card', 'user', 'calendar', 'shield-check', 'clipboard', 'file-text'];

/** Catálogo que ve el ciudadano (solo los publicados). */
export const catalogo = (): Tramite[] => bd().tramites.filter((t) => t.publicado);
export const todos = (): Tramite[] => bd().tramites;
export const tramitePorId = (id: string): Tramite | undefined => bd().tramites.find((t) => t.id === id);

export async function guardarTramite(token: string, t: Tramite, nuevo: boolean): Promise<Tramite> {
  await esperar(300);
  if (yo(token).rol !== 'administrador') throw new ApiError(403, 'No tienes permiso para esta acción.');
  const f: Record<string, string> = {};
  if (!t.nombre.trim()) f['nombre'] = 'Escribe el nombre del trámite.';
  if (t.costo !== null && (isNaN(t.costo) || t.costo < 0)) f['costo'] = 'El costo no puede ser negativo.';
  if (!(t.duracionMin >= 5 && t.duracionMin <= 60)) f['duracionMin'] = 'La duración debe estar entre 5 y 60 minutos.';
  if (!t.requisitos.filter((r) => r.trim()).length) f['requisitos'] = 'Agrega al menos un requisito.';
  const db = bd();
  if (db.tramites.some((x) => x.id !== t.id && x.nombre.trim().toLowerCase() === t.nombre.trim().toLowerCase())) f['nombre'] = 'Ya existe un trámite con ese nombre.';
  if (Object.keys(f).length) throw new ApiError(422, 'Revisa los datos marcados.', f);
  const limpio: Tramite = { ...t, nombre: t.nombre.trim(), requisitos: t.requisitos.map((r) => r.trim()).filter(Boolean) };
  if (nuevo) {
    limpio.id = limpio.nombre.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    if (db.tramites.some((x) => x.id === limpio.id)) limpio.id += '-' + Date.now().toString(36);
    db.tramites.push(limpio);
  } else {
    const i = db.tramites.findIndex((x) => x.id === t.id);
    if (i < 0) throw new ApiError(404, 'Trámite no encontrado.');
    db.tramites[i] = limpio;
  }
  guardar();
  return limpio;
}
