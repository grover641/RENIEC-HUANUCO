import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Rol, UsuarioPublico } from '../modelos';
import { MINUTOS_SESION, salir, ultimaActividad, yo } from '../../epicas/epica1-autenticacion/api/auth.api';
import { ToastService } from '../../compartido/componentes/toast/toast.service';

const CLAVE_TOKEN = 'citareniec_moderno_token';

/**
 * Estado de la sesión (HU-16): usuario actual, rol y vencimiento tras 30 minutos sin actividad.
 * Equivale al token de Sanctum que el frontend guarda y envía en cada petición.
 */
@Injectable({ providedIn: 'root' })
export class SesionService {
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly token = signal<string | null>(leerToken());
  readonly usuario = signal<UsuarioPublico | null>(null);
  readonly segundosRestantes = signal(MINUTOS_SESION * 60);
  readonly porVencer = computed(() => !!this.usuario() && this.segundosRestantes() <= 60);
  readonly rol = computed<Rol | null>(() => this.usuario()?.rol ?? null);
  private ultimoToque = 0;

  constructor() {
    const t = this.token();
    if (t) {
      try { this.usuario.set(yo(t, false)); } catch { this.limpiar(); }
    }
    setInterval(() => this.revisar(), 1000);
    const tocar = () => this.actividad();
    document.addEventListener('click', tocar, { passive: true });
    document.addEventListener('keydown', tocar, { passive: true });
  }

  iniciar(token: string, usuario: UsuarioPublico): void {
    try { localStorage.setItem(CLAVE_TOKEN, token); } catch { /* ignorar */ }
    this.token.set(token);
    this.usuario.set(usuario);
    this.segundosRestantes.set(MINUTOS_SESION * 60);
  }

  /** Vuelve a leer el usuario (por ejemplo, tras editar su perfil). */
  actualizar(usuario: UsuarioPublico): void {
    this.usuario.set(usuario);
  }

  cerrar(mensaje?: string): void {
    const t = this.token();
    if (t) salir(t);
    this.limpiar();
    if (mensaje) this.toast.info(mensaje);
    this.router.navigateByUrl('/ingresar');
  }

  /** Mantiene la sesión activa (botón «Seguir conectado» o cualquier clic). */
  seguir(): void {
    this.ultimoToque = 0;
    this.actividad();
  }

  rutaInicio(u: UsuarioPublico | null = this.usuario()): string {
    if (!u) return '/ingresar';
    if (u.debeCambiarClave) return rutaPerfil(u.rol); // contraseña temporal: primero debe cambiarla (HU-20)
    if (u.rol === 'administrador') return '/admin/usuarios';
    if (u.rol === 'operador') return '/operador/perfil';
    return '/ciudadano/inicio';
  }

  private actividad(): void {
    const t = this.token();
    if (!t || !this.usuario()) return;
    if (Date.now() - this.ultimoToque < 10000) return; // como mucho una vez cada 10 s
    this.ultimoToque = Date.now();
    try {
      this.usuario.set(yo(t, true));
      this.segundosRestantes.set(MINUTOS_SESION * 60);
    } catch (e) {
      this.expirar(e instanceof Error ? e.message : undefined);
    }
  }

  private revisar(): void {
    const t = this.token();
    if (!t || !this.usuario()) return;
    const ultima = ultimaActividad(t);
    if (ultima === null) return this.expirar('Tu sesión se cerró. Vuelve a ingresar.');
    const resto = Math.max(0, Math.round((ultima + MINUTOS_SESION * 60000 - Date.now()) / 1000));
    this.segundosRestantes.set(resto);
    if (resto <= 0) this.expirar('Tu sesión venció por inactividad. Vuelve a ingresar.');
  }

  private expirar(mensaje = 'Tu sesión venció. Vuelve a ingresar.'): void {
    const t = this.token();
    if (t) salir(t);
    this.limpiar();
    this.toast.advertencia(mensaje);
    this.router.navigateByUrl('/ingresar');
  }

  private limpiar(): void {
    try { localStorage.removeItem(CLAVE_TOKEN); } catch { /* ignorar */ }
    this.token.set(null);
    this.usuario.set(null);
  }
}

/** Página de perfil de cada rol (donde también se cambia la contraseña). */
export function rutaPerfil(rol: Rol): string {
  return rol === 'operador' ? '/operador/perfil' : rol === 'administrador' ? '/admin/cuenta' : '/ciudadano/cuenta';
}

function leerToken(): string | null {
  try { return localStorage.getItem(CLAVE_TOKEN); } catch { return null; }
}
