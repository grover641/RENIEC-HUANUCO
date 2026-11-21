// Épica 1 · HU-20 Gestión de usuarios. Simula los endpoints protegidos con middleware role:administrador:
// GET/POST /api/v1/admin/usuarios · PUT /admin/usuarios/{id} · PATCH /admin/usuarios/{id}/estado
// POST /admin/usuarios/{id}/reset-password
import { ApiError } from '../../../nucleo/api/api-error';
import { bd, cifrar, claveTemporal, enviarCorreo, esperar, guardar, nuevoId, publico } from '../../../nucleo/api/base-datos';
import { Rol, Usuario, UsuarioPublico } from '../../../nucleo/modelos';
import { SEDE } from '../../../datos/semilla';
import { RX_CELULAR, RX_CORREO, RX_DNI, yo } from './auth.api';

export interface DatosOperador { dni: string; nombres: string; apellidos: string; correo: string; celular: string; ventanilla: number | null; }

function soloAdmin(token: string): UsuarioPublico {
  const u = yo(token);
  if (u.rol !== 'administrador') throw new ApiError(403, 'No tienes permiso para esta acción.');
  return u;
}

export async function listar(token: string, texto = '', rol: Rol | 'todos' = 'todos'): Promise<UsuarioPublico[]> {
  await esperar(150);
  soloAdmin(token);
  const t = texto.trim().toLowerCase();
  return bd().usuarios
    .filter((u) => !u.dni.startsWith('X')) // cuentas eliminadas (HU-19)
    .filter((u) => rol === 'todos' || u.rol === rol)
    .filter((u) => !t || u.dni.includes(t) || `${u.nombres} ${u.apellidos}`.toLowerCase().includes(t) || u.correo.toLowerCase().includes(t))
    .map(publico);
}

function validar(d: DatosOperador, rol: Rol, idActual?: number): Record<string, string> {
  const db = bd();
  const f: Record<string, string> = {};
  if (!RX_DNI.test(d.dni || '')) f['dni'] = 'El DNI debe tener 8 dígitos.';
  else if (db.usuarios.some((u) => u.id !== idActual && u.dni === d.dni)) f['dni'] = 'Este DNI ya está registrado.';
  if (!d.nombres?.trim()) f['nombres'] = 'Ingresa los nombres.';
  if (!d.apellidos?.trim()) f['apellidos'] = 'Ingresa los apellidos.';
  if (!RX_CORREO.test((d.correo || '').trim())) f['correo'] = 'Ingresa un correo válido.';
  else if (db.usuarios.some((u) => u.id !== idActual && u.correo.toLowerCase() === d.correo.trim().toLowerCase())) f['correo'] = 'Este correo ya está registrado.';
  if (d.celular && !RX_CELULAR.test(d.celular)) f['celular'] = 'El celular debe tener 9 dígitos y empezar con 9.';
  if (rol === 'operador' && d.ventanilla !== null && !SEDE.ventanillas.includes(Number(d.ventanilla))) f['ventanilla'] = 'Elige la ventanilla 1, 2 o 3.';
  if (rol === 'operador' && idActual === undefined && d.ventanilla === null) f['ventanilla'] = 'Elige la ventanilla 1, 2 o 3.';
  return f;
}

export async function crearOperador(token: string, d: DatosOperador): Promise<{ usuario: UsuarioPublico; temporal: string }> {
  await esperar();
  soloAdmin(token);
  const f = validar(d, 'operador');
  if (Object.keys(f).length) throw new ApiError(422, 'Revisa los datos marcados.', f);
  const temporal = claveTemporal();
  const ahora = new Date().toISOString();
  const u: Usuario = {
    id: nuevoId(), dni: d.dni, nombres: d.nombres.trim(), apellidos: d.apellidos.trim(), correo: d.correo.trim(), celular: d.celular || '',
    rol: 'operador', estado: 'activo', ventanilla: Number(d.ventanilla), clave: cifrar(temporal), debeCambiarClave: true,
    aceptaDatosFecha: ahora, creado: ahora, ultimoAcceso: null,
  };
  bd().usuarios.push(u);
  enviarCorreo(u.correo, 'Tu cuenta de operador en CitaRENIEC',
    `Hola, ${u.nombres}. Se creó tu cuenta para la ventanilla ${u.ventanilla}. Tu contraseña temporal es ${temporal}. Deberás cambiarla en tu primer ingreso.`);
  guardar();
  return { usuario: publico(u), temporal };
}

export async function editar(token: string, id: number, d: DatosOperador): Promise<UsuarioPublico> {
  await esperar();
  soloAdmin(token);
  const u = bd().usuarios.find((x) => x.id === id);
  if (!u) throw new ApiError(404, 'Usuario no encontrado.');
  const f = validar(d, u.rol, id);
  if (Object.keys(f).length) throw new ApiError(422, 'Revisa los datos marcados.', f);
  Object.assign(u, { dni: d.dni, nombres: d.nombres.trim(), apellidos: d.apellidos.trim(), correo: d.correo.trim(), celular: d.celular || u.celular });
  if (u.rol === 'operador') u.ventanilla = d.ventanilla === null ? null : Number(d.ventanilla);
  guardar();
  return publico(u);
}

export async function cambiarEstado(token: string, id: number): Promise<UsuarioPublico> {
  await esperar(200);
  const admin = soloAdmin(token);
  if (admin.id === id) throw new ApiError(422, 'No puedes desactivar tu propia cuenta.');
  const db = bd();
  const u = db.usuarios.find((x) => x.id === id);
  if (!u) throw new ApiError(404, 'Usuario no encontrado.');
  u.estado = u.estado === 'activo' ? 'inactivo' : 'activo';
  if (u.estado === 'inactivo') {
    db.sesiones = db.sesiones.filter((s) => s.usuarioId !== id);
    if (u.rol === 'operador') u.ventanilla = null; // un operador inactivo queda sin ventanilla
  }
  guardar();
  return publico(u);
}

export async function restablecer(token: string, id: number): Promise<{ usuario: UsuarioPublico; temporal: string }> {
  await esperar();
  const admin = soloAdmin(token);
  if (admin.id === id) throw new ApiError(422, 'Para cambiar tu propia contraseña usa «Mi cuenta».');
  const db = bd();
  const u = db.usuarios.find((x) => x.id === id);
  if (!u) throw new ApiError(404, 'Usuario no encontrado.');
  const temporal = claveTemporal();
  u.clave = cifrar(temporal);
  u.debeCambiarClave = true;
  db.sesiones = db.sesiones.filter((s) => s.usuarioId !== id);
  enviarCorreo(u.correo, 'Tu contraseña de CitaRENIEC fue restablecida',
    `Hola, ${u.nombres}. El administrador restableció tu contraseña. Tu contraseña temporal es ${temporal}. Deberás cambiarla al ingresar.`);
  guardar();
  return { usuario: publico(u), temporal };
}
