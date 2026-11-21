import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Rol } from '../modelos';
import { rutaPerfil, SesionService } from './sesion.service';

/** Solo deja entrar a quien tiene sesión y el rol indicado. Sin sesión → /ingresar · rol ajeno → /403 (HU-16). */
export function requiereRol(rol: Rol): CanActivateFn {
  return (_ruta, estado) => {
    const sesion = inject(SesionService);
    const router = inject(Router);
    const u = sesion.usuario();
    if (!u) return router.createUrlTree(['/ingresar'], { queryParams: { volver: estado.url } });
    if (u.rol !== rol) return router.createUrlTree(['/403']);
    // Contraseña temporal (operador nuevo o clave restablecida por el administrador):
    // solo puede abrir su perfil hasta cambiarla (HU-20).
    if (u.debeCambiarClave && !estado.url.startsWith(rutaPerfil(u.rol))) {
      return router.createUrlTree([rutaPerfil(u.rol)]);
    }
    return true;
  };
}

/** Páginas de invitado (ingresar, registro): si ya hay sesión, va a la vista de su rol. */
export const soloInvitado: CanActivateFn = () => {
  const sesion = inject(SesionService);
  const router = inject(Router);
  return sesion.usuario() ? router.createUrlTree([sesion.rutaInicio()]) : true;
};
