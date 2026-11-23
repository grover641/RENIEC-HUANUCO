// Épica 1 · Perfil. Simula GET/PUT /api/v1/perfil, y PUT /perfil/password (HU-18).
import { ApiError } from '../../../nucleo/api/api-error';
import { bd, cifrar, esperar, guardar, publico } from '../../../nucleo/api/base-datos';
import { UsuarioPublico } from '../../../nucleo/modelos';
import { RX_CELULAR, RX_CORREO, validarClave, yo } from './auth.api';

export async function actualizarContacto(token: string, correo: string, celular: string): Promise<UsuarioPublico> {
  await esperar();
  const actual = yo(token);
  const db = bd();
  const c = (correo || '').trim();
  const cel = (celular || '').replace(/\s/g, '');
  const f: Record<string, string> = {};
  if (!RX_CORREO.test(c)) f['correo'] = 'Escribe un correo válido.';
  else if (db.usuarios.some((u) => u.id !== actual.id && u.correo.toLowerCase() === c.toLowerCase())) f['correo'] = 'Este correo ya está registrado.';
  if (!RX_CELULAR.test(cel)) f['celular'] = 'El celular debe tener 9 dígitos y empezar con 9.';
  if (Object.keys(f).length) throw new ApiError(422, 'No se guardaron los cambios.', f);
  const u = db.usuarios.find((x) => x.id === actual.id)!;
  u.correo = c;
  u.celular = cel;
  guardar();
  return publico(u);
}

export async function cambiarClave(token: string, actualClave: string, nueva: string, confirmar: string): Promise<UsuarioPublico> {
  await esperar();
  const actual = yo(token);
  const db = bd();
  const u = db.usuarios.find((x) => x.id === actual.id)!;
  if (u.clave !== cifrar(actualClave || '')) {
    throw new ApiError(422, 'La contraseña actual es incorrecta.', { actual: u.debeCambiarClave ? 'La contraseña temporal es incorrecta.' : 'La contraseña actual es incorrecta.' });
  }
  const c = validarClave(nueva);
  if (c) throw new ApiError(422, c, { nueva: c });
  if (nueva === actualClave) throw new ApiError(422, 'La nueva contraseña debe ser distinta.', { nueva: 'La nueva contraseña debe ser distinta de la actual.' });
  if (nueva !== confirmar) throw new ApiError(422, 'Las contraseñas no coinciden.', { confirmar: 'Las contraseñas no coinciden.' });
  u.clave = cifrar(nueva);
  u.debeCambiarClave = false;
  guardar();
  return publico(u);
}
