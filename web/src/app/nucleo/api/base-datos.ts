// Base de datos simulada en el navegador (localStorage).
// En el sistema real estos datos viven en PostgreSQL y los maneja la API Laravel de la carpeta api/.
// Aquí se simulan para que la web funcione en clase sin servidor.
import { signal } from '@angular/core';
import { crearSemilla } from '../../datos/semilla';
import { BaseDatos, Correo, Usuario, UsuarioPublico } from '../modelos';

const CLAVE_ALMACEN = 'citareniec_moderno_v2';
let cache: BaseDatos | null = null;

/**
 * Aumenta cada vez que cambian los datos (en esta pestaña o en otra).
 * Las pantallas que lo leen se actualizan solas: por ejemplo, la pantalla de sala (TV)
 * muestra al instante el turno que llamó el operador en otra pestaña.
 */
export const cambiosBd = signal(0);

try {
  window.addEventListener('storage', (e) => {
    if (e.key !== CLAVE_ALMACEN || !e.newValue) return;
    try { cache = JSON.parse(e.newValue) as BaseDatos; cambiosBd.update((n) => n + 1); } catch { /* ignorar */ }
  });
} catch { /* sin ventana */ }

/** Simula el cifrado de contraseñas (en Laravel se usa bcrypt). Funciona también fuera de HTTPS. */
export function cifrar(texto: string): string {
  let h1 = 0xdeadbeef ^ 2026, h2 = 0x41c6ce57 ^ 2026;
  const s = 'citareniec:' + texto;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
}

export function bd(): BaseDatos {
  if (cache) return cache;
  try {
    const crudo = localStorage.getItem(CLAVE_ALMACEN);
    if (crudo) {
      cache = JSON.parse(crudo) as BaseDatos;
      if (cache.dia !== hoyIso()) cache = nuevoDia(cache);
      return cache;
    }
  } catch { /* sin almacenamiento: se usa la memoria */ }
  cache = crearSemilla(cifrar);
  // Se guarda sin avisar del cambio: bd() puede llamarse mientras se dibuja una pantalla.
  try { localStorage.setItem(CLAVE_ALMACEN, JSON.stringify(cache)); } catch { /* ignorar */ }
  return cache;
}

export function guardar(): void {
  try { localStorage.setItem(CLAVE_ALMACEN, JSON.stringify(cache)); } catch { /* ignorar */ }
  cambiosBd.update((n) => n + 1);
}

const hoyIso = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

/**
 * Cambió el día: se vuelven a generar la cola, las citas y los avisos de ejemplo de «hoy»,
 * pero se conservan las cuentas, el catálogo de trámites y las agendas que configuró el equipo.
 */
function nuevoDia(viejo: BaseDatos): BaseDatos {
  const nuevo = crearSemilla(cifrar);
  const ids = new Set(nuevo.usuarios.map((u) => u.id));
  nuevo.usuarios = [...viejo.usuarios.filter((u) => ids.has(u.id)), ...viejo.usuarios.filter((u) => !ids.has(u.id))];
  nuevo.tramites = viejo.tramites;
  nuevo.franjas = viejo.franjas;
  nuevo.sigId = Math.max(viejo.sigId, nuevo.sigId);
  try { localStorage.setItem(CLAVE_ALMACEN, JSON.stringify(nuevo)); } catch { /* ignorar */ }
  return nuevo;
}

/** Vuelve a los datos de ejemplo (botón «Restablecer datos de prueba»). */
export function reiniciarBd(): void {
  cache = crearSemilla(cifrar);
  guardar();
}

/** Simula la demora de la red. */
export const esperar = (ms = 350) => new Promise<void>((r) => setTimeout(r, ms));

export function nuevoId(): number {
  const d = bd();
  return d.sigId++;
}

export function tokenAleatorio(largo = 32, letras = 'abcdefghijklmnopqrstuvwxyz0123456789'): string {
  const valores = crypto.getRandomValues(new Uint32Array(largo));
  return Array.from(valores, (n) => letras[n % letras.length]).join('');
}

export const claveTemporal = () => 'Tmp-' + tokenAleatorio(8, 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789');

export function publico(u: Usuario): UsuarioPublico {
  const { clave: _clave, ...resto } = u;
  return resto;
}

/** Deja el correo en el buzón de prueba (en Staging se usa Mailtrap). */
export function enviarCorreo(para: string, asunto: string, cuerpo: string, enlace?: string): void {
  const correo: Correo = { id: tokenAleatorio(8), para, asunto, cuerpo, enlace, fecha: new Date().toISOString() };
  bd().buzon.unshift(correo);
}
