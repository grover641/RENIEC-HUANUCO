// Épica 1 · Autenticación. Simula los endpoints de la API Laravel (Sanctum):
// POST /api/v1/auth/register (HU-15) · POST /auth/login · POST /auth/logout · GET /auth/me (HU-16)
// POST /auth/forgot-password · POST /auth/reset-password (HU-17)
import { ApiError } from '../../../nucleo/api/api-error';
import { bd, cifrar, enviarCorreo, esperar, guardar, nuevoId, publico, tokenAleatorio } from '../../../nucleo/api/base-datos';
import { Usuario, UsuarioPublico } from '../../../nucleo/modelos';

export const MINUTOS_SESION = 30;   // la sesión vence tras 30 min sin actividad (HU-16)
export const MAX_INTENTOS = 5;      // bloqueo tras 5 intentos fallidos (HU-16)
export const MINUTOS_BLOQUEO = 15;
export const MINUTOS_ENLACE = 60;   // el enlace de recuperación vence a los 60 min (HU-17)

export const RX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const RX_DNI = /^\d{8}$/;
export const RX_CELULAR = /^9\d{8}$/;

export function validarClave(clave: string): string | null {
  if (!clave || clave.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
  return null;
}

/** Nivel de seguridad de 0 a 4 (solo orienta: la regla obligatoria es de 8 caracteres). */
export function nivelClave(clave: string): number {
  let n = 0;
  if (clave.length >= 8) n++;
  if (/[A-ZÁÉÍÓÚÑ]/.test(clave)) n++;
  if (/\d/.test(clave)) n++;
  if (clave.length >= 12 || /[^A-Za-z0-9]/.test(clave)) n++;
  return n;
}

export interface DatosRegistro {
  dni: string; nombres: string; apellidos: string; correo: string; celular: string;
  clave: string; confirmar: string; aceptaDatos: boolean;
}

function buscarPorIdentificador(id: string): Usuario | undefined {
  const t = id.trim().toLowerCase();
  return bd().usuarios.find((u) => u.dni === t || u.correo.toLowerCase() === t);
}

function crearSesion(usuario: Usuario): string {
  const token = tokenAleatorio(40);
  bd().sesiones.push({ token, usuarioId: usuario.id, ultimaActividad: Date.now() });
  usuario.ultimoAcceso = new Date().toISOString();
  return token;
}

/** HU-15 · Registro de ciudadano */
export async function registrar(d: DatosRegistro): Promise<{ token: string; usuario: UsuarioPublico }> {
  await esperar();
  const db = bd();
  const f: Record<string, string> = {};
  if (!RX_DNI.test(d.dni || '')) f['dni'] = 'El DNI debe tener 8 dígitos.';
  else if (db.usuarios.some((u) => u.dni === d.dni)) f['dni'] = 'Este DNI ya está registrado.';
  if (!d.nombres?.trim()) f['nombres'] = 'Ingresa tus nombres.';
  if (!d.apellidos?.trim()) f['apellidos'] = 'Ingresa tus apellidos.';
  if (!RX_CORREO.test((d.correo || '').trim())) f['correo'] = 'Escribe un correo válido, por ejemplo nombre@correo.com';
  else if (db.usuarios.some((u) => u.correo.toLowerCase() === d.correo.trim().toLowerCase())) f['correo'] = 'Este correo ya está registrado.';
  if (!RX_CELULAR.test(d.celular || '')) f['celular'] = 'Ingresa 9 dígitos. Ejemplo: 987 654 321';
  const c = validarClave(d.clave);
  if (c) f['clave'] = c;
  if (d.clave !== d.confirmar) f['confirmar'] = 'Las contraseñas no coinciden.';
  if (!d.aceptaDatos) f['aceptaDatos'] = 'Debes aceptar el tratamiento de datos (Ley N.º 29733).';
  if (Object.keys(f).length) throw new ApiError(422, 'Revisa los datos marcados.', f);

  const ahora = new Date().toISOString();
  const usuario: Usuario = {
    id: nuevoId(), dni: d.dni, nombres: d.nombres.trim(), apellidos: d.apellidos.trim(), correo: d.correo.trim(),
    celular: d.celular, rol: 'ciudadano', estado: 'activo', ventanilla: null, clave: cifrar(d.clave),
    debeCambiarClave: false, aceptaDatosFecha: ahora, creado: ahora, ultimoAcceso: null,
  };
  db.usuarios.push(usuario);
  const token = crearSesion(usuario);
  guardar();
  return { token, usuario: publico(usuario) };
}

// Los intentos se cuentan por cuenta: entrar con el DNI o con el correo de la misma persona suma al mismo contador.
function claveIntentos(id: string): string {
  const u = buscarPorIdentificador(id);
  return u ? 'usuario:' + u.id : id.trim().toLowerCase();
}

function fallosRecientes(clave: string) {
  const db = bd();
  const ahora = Date.now();
  const exitos = db.intentos.filter((i) => i.identificador === clave && i.exito).map((i) => i.fecha);
  const desde = Math.max(ahora - MINUTOS_BLOQUEO * 60000, exitos.length ? Math.max(...exitos) : 0);
  return db.intentos.filter((i) => i.identificador === clave && !i.exito && i.fecha > desde);
}

/** Hora (ms) hasta la que la cuenta queda bloqueada, o 0 si no lo está. */
export function bloqueadoHasta(identificador: string): number {
  const fallos = fallosRecientes(claveIntentos(identificador));
  if (fallos.length < MAX_INTENTOS) return 0;
  return Math.max(...fallos.map((i) => i.fecha)) + MINUTOS_BLOQUEO * 60000;
}

/** HU-16 · Inicio de sesión con DNI o correo */
export async function ingresar(identificador: string, clave: string): Promise<{ token: string; usuario: UsuarioPublico }> {
  await esperar();
  const db = bd();
  const claveCuenta = claveIntentos(identificador);
  const hasta = bloqueadoHasta(identificador);
  if (hasta > Date.now()) {
    throw new ApiError(429, 'Cuenta bloqueada por 15 minutos.', { hasta: String(hasta) });
  }
  const u = buscarPorIdentificador(identificador);
  const claveCorrecta = !!u && u.clave === cifrar(clave || '');
  const ok = claveCorrecta && u!.estado === 'activo';
  db.intentos.push({ identificador: claveCuenta, exito: ok, fecha: Date.now() });
  if (!ok) {
    guardar();
    const usados = fallosRecientes(claveCuenta).length;
    if (usados >= MAX_INTENTOS) {
      throw new ApiError(429, 'Cuenta bloqueada por 15 minutos.', { hasta: String(Date.now() + MINUTOS_BLOQUEO * 60000) });
    }
    // Solo se dice que la cuenta está desactivada si la contraseña es correcta:
    // así nadie puede averiguar qué DNI o correo existen probando claves al azar.
    if (claveCorrecta) throw new ApiError(403, 'Tu cuenta está desactivada. Comunícate con el administrador de la sede.');
    throw new ApiError(401, 'Datos incorrectos.', { intento: String(usados), quedan: String(MAX_INTENTOS - usados) });
  }
  const token = crearSesion(u!);
  guardar();
  return { token, usuario: publico(u!) };
}

/** GET /auth/me · valida el token y el vencimiento por inactividad. */
export function yo(token: string, tocar = true): UsuarioPublico {
  const db = bd();
  const s = db.sesiones.find((x) => x.token === token);
  if (!s) throw new ApiError(401, 'No has iniciado sesión.');
  if (Date.now() - s.ultimaActividad > MINUTOS_SESION * 60000) {
    db.sesiones = db.sesiones.filter((x) => x.token !== token);
    guardar();
    throw new ApiError(401, 'Tu sesión venció por inactividad. Vuelve a ingresar.');
  }
  const u = db.usuarios.find((x) => x.id === s.usuarioId);
  if (!u || u.estado !== 'activo') {
    db.sesiones = db.sesiones.filter((x) => x.token !== token);
    guardar();
    throw new ApiError(401, 'Tu cuenta no está activa.');
  }
  if (tocar) {
    s.ultimaActividad = Date.now();
    guardar();
  }
  return publico(u);
}

export function ultimaActividad(token: string): number | null {
  return bd().sesiones.find((x) => x.token === token)?.ultimaActividad ?? null;
}

export function salir(token: string): void {
  const db = bd();
  db.sesiones = db.sesiones.filter((x) => x.token !== token);
  guardar();
}

/** HU-17 · Recuperar contraseña (el mensaje es el mismo exista o no el correo). */
export async function solicitarRecuperacion(correo: string): Promise<string> {
  await esperar();
  if (!RX_CORREO.test((correo || '').trim())) throw new ApiError(422, 'Escribe un correo válido.', { correo: 'Escribe un correo válido, por ejemplo nombre@correo.com' });
  const db = bd();
  const u = db.usuarios.find((x) => x.correo.toLowerCase() === correo.trim().toLowerCase());
  if (u) {
    db.tokensClave.forEach((t) => { if (t.usuarioId === u.id) t.usado = true; }); // solo sirve el último enlace
    db.tokensClave = db.tokensClave.filter((t) => Date.now() - t.creado < 24 * 3600000);
    const token = tokenAleatorio(32);
    db.tokensClave.push({ token, usuarioId: u.id, creado: Date.now(), usado: false });
    enviarCorreo(u.correo, 'Recupera tu contraseña de CitaRENIEC',
      `Hola, ${u.nombres.split(' ')[0]}. Para crear una nueva contraseña usa este enlace. Vence en ${MINUTOS_ENLACE} minutos y solo puede usarse una vez.`,
      `/nueva-clave/${token}`);
    guardar();
  }
  return 'Si el correo está registrado, te enviamos un enlace para recuperar tu contraseña.';
}

export function enlaceValido(token: string): boolean {
  const t = bd().tokensClave.find((x) => x.token === token);
  return !!t && !t.usado && Date.now() - t.creado <= MINUTOS_ENLACE * 60000;
}

export async function restablecerClave(token: string, clave: string, confirmar: string): Promise<string> {
  await esperar();
  const db = bd();
  if (!enlaceValido(token)) throw new ApiError(422, 'El enlace venció o ya fue usado. Solicita uno nuevo.');
  const c = validarClave(clave);
  if (c) throw new ApiError(422, c, { clave: c });
  if (clave !== confirmar) throw new ApiError(422, 'Las contraseñas no coinciden.', { confirmar: 'Las contraseñas no coinciden.' });
  const t = db.tokensClave.find((x) => x.token === token)!;
  const u = db.usuarios.find((x) => x.id === t.usuarioId)!;
  u.clave = cifrar(clave);
  u.debeCambiarClave = false;
  db.tokensClave.forEach((x) => { if (x.usuarioId === u.id) x.usado = true; });
  db.sesiones = db.sesiones.filter((s) => s.usuarioId !== u.id);
  guardar();
  return 'Tu contraseña se actualizó. Ya puedes ingresar.';
}

export const buzon = () => bd().buzon;
