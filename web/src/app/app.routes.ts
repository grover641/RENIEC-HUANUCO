import { Routes } from '@angular/router';
import { requiereRol, soloInvitado } from './nucleo/sesion/guardas';
import { PlantillaPublica } from './plantillas/publica/plantilla-publica';
import { PlantillaApp } from './plantillas/app/plantilla-app';

// Épica 1 · Autenticación y gestión de usuarios
import { Inicio } from './epicas/epica1-autenticacion/paginas/inicio/inicio';
import { Ingresar } from './epicas/epica1-autenticacion/paginas/ingresar/ingresar';
import { Registro } from './epicas/epica1-autenticacion/paginas/registro/registro';
import { Recuperar } from './epicas/epica1-autenticacion/paginas/recuperar/recuperar';
import { NuevaClave } from './epicas/epica1-autenticacion/paginas/nueva-clave/nueva-clave';
import { BuzonDemo } from './epicas/epica1-autenticacion/paginas/buzon-demo/buzon-demo';
import { PaginaError } from './epicas/epica1-autenticacion/paginas/errores/pagina-error';
import { Privacidad } from './epicas/epica1-autenticacion/paginas/privacidad/privacidad';
import { MiInicio } from './epicas/epica1-autenticacion/paginas/mi-inicio/mi-inicio';
import { MiCuenta } from './epicas/epica1-autenticacion/paginas/mi-cuenta/mi-cuenta';
import { PerfilOperador } from './epicas/epica1-autenticacion/paginas/perfil-operador/perfil-operador';
import { AdminUsuarios } from './epicas/epica1-autenticacion/paginas/admin-usuarios/admin-usuarios';

// Las pantallas de las épicas 2 a 5 se agregan en los sprints siguientes.
export const routes: Routes = [
  // ---------- Páginas públicas ----------
  {
    path: '',
    component: PlantillaPublica,
    children: [
      { path: '', component: Inicio, title: 'CitaRENIEC Huánuco · Reserva tu cita sin hacer cola' },
      { path: 'privacidad', component: Privacidad, title: 'Política de privacidad · CitaRENIEC' },
      { path: '403', component: PaginaError, data: { codigo: 403 }, title: 'Acceso denegado · CitaRENIEC' },
    ],
  },
  { path: 'ingresar', component: Ingresar, canActivate: [soloInvitado], title: 'Ingresar · CitaRENIEC' },
  { path: 'registro', component: Registro, canActivate: [soloInvitado], title: 'Crear cuenta · CitaRENIEC' },
  { path: 'recuperar', component: Recuperar, title: 'Recuperar contraseña · CitaRENIEC' },
  { path: 'nueva-clave/:token', component: NuevaClave, title: 'Nueva contraseña · CitaRENIEC' },
  { path: 'buzon', component: BuzonDemo, title: 'Buzón de prueba · CitaRENIEC' },

  // ---------- Ciudadano ----------
  {
    path: 'ciudadano',
    component: PlantillaApp,
    canActivate: [requiereRol('ciudadano')],
    canActivateChild: [requiereRol('ciudadano')], // también al cambiar de página dentro de la sección
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'inicio' },
      { path: 'inicio', component: MiInicio, title: 'Mi inicio · CitaRENIEC' },
      { path: 'cuenta', component: MiCuenta, title: 'Mi cuenta · CitaRENIEC' },
    ],
  },

  // ---------- Operador de ventanilla ----------
  {
    path: 'operador',
    component: PlantillaApp,
    canActivate: [requiereRol('operador')],
    canActivateChild: [requiereRol('operador')],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'perfil' },
      { path: 'perfil', component: PerfilOperador, title: 'Mi perfil · CitaRENIEC' },
    ],
  },

  // ---------- Administrador ----------
  {
    path: 'admin',
    component: PlantillaApp,
    canActivate: [requiereRol('administrador')],
    canActivateChild: [requiereRol('administrador')],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'usuarios' },
      { path: 'usuarios', component: AdminUsuarios, title: 'Gestión de usuarios · CitaRENIEC' },
      { path: 'cuenta', component: MiCuenta, title: 'Mi perfil · CitaRENIEC' },
    ],
  },

  // ---------- 404 ----------
  { path: '**', component: PlantillaPublica, children: [{ path: '', component: PaginaError, data: { codigo: 404 }, title: 'Página no encontrada · CitaRENIEC' }] },
];
