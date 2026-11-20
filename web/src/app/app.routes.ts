import { Routes } from '@angular/router';
import { requiereRol, soloInvitado } from './nucleo/sesion/guardas';
import { PlantillaPublica } from './plantillas/publica/plantilla-publica';
import { PlantillaApp } from './plantillas/app/plantilla-app';

// Épica 1 · Autenticación y gestión de usuarios (Fase 1)
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

// Épica 2 · Reserva y gestión de citas (Fase 2)
import { Reservar } from './epicas/epica2-reserva/paginas/reservar/reservar';
import { MisCitas } from './epicas/epica2-reserva/paginas/mis-citas/mis-citas';
import { AdminAgendas } from './epicas/epica2-reserva/paginas/admin-agendas/admin-agendas';
import { AdminTramites } from './epicas/epica2-reserva/paginas/admin-tramites/admin-tramites';

// Épica 3 · Turnos digitales inteligentes (Fase 3)
import { PanelTurnos } from './epicas/epica3-turnos/paginas/panel-turnos/panel-turnos';
import { CheckIn } from './epicas/epica3-turnos/paginas/check-in/check-in';
import { PantallaSala } from './epicas/epica3-turnos/paginas/pantalla-sala/pantalla-sala';
import { MiTurno } from './epicas/epica3-turnos/paginas/mi-turno/mi-turno';
import { ConsultaTurno } from './epicas/epica3-turnos/paginas/consulta-turno/consulta-turno';

// Épica 4 · Alertas y notificaciones (Fase 4)
import { MisAvisos } from './epicas/epica4-alertas/paginas/mis-avisos/mis-avisos';
import { AvisosEnviados } from './epicas/epica4-alertas/paginas/avisos-enviados/avisos-enviados';

// Épica 5 · Integración, respaldo y monitoreo (Fase 4)
import { MiTramite } from './epicas/epica5-integracion/paginas/mi-tramite/mi-tramite';
import { ConsultaDni } from './epicas/epica5-integracion/paginas/consulta-dni/consulta-dni';
import { Dashboard } from './epicas/epica5-integracion/paginas/dashboard/dashboard';
import { Reportes } from './epicas/epica5-integracion/paginas/reportes/reportes';
import { Integracion } from './epicas/epica5-integracion/paginas/integracion/integracion';

export const routes: Routes = [
  // ---------- Páginas públicas ----------
  {
    path: '',
    component: PlantillaPublica,
    children: [
      { path: '', component: Inicio, title: 'CitaRENIEC Huánuco · Reserva tu cita sin hacer cola' },
      { path: 'privacidad', component: Privacidad, title: 'Política de privacidad · CitaRENIEC' },
      { path: 'consulta/dni', component: ConsultaDni, title: '¿Mi DNI está listo? · CitaRENIEC' },
      { path: 'consulta/turno', component: ConsultaTurno, title: 'Mi turno · CitaRENIEC' },
      { path: '403', component: PaginaError, data: { codigo: 403 }, title: 'Acceso denegado · CitaRENIEC' },
    ],
  },
  { path: 'ingresar', component: Ingresar, canActivate: [soloInvitado], title: 'Ingresar · CitaRENIEC' },
  { path: 'registro', component: Registro, canActivate: [soloInvitado], title: 'Crear cuenta · CitaRENIEC' },
  { path: 'recuperar', component: Recuperar, title: 'Recuperar contraseña · CitaRENIEC' },
  { path: 'nueva-clave/:token', component: NuevaClave, title: 'Nueva contraseña · CitaRENIEC' },
  { path: 'buzon', component: BuzonDemo, title: 'Buzón de prueba · CitaRENIEC' },
  { path: 'sala', component: PantallaSala, title: 'Pantalla de sala · CitaRENIEC' },

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
      { path: 'reservar', component: Reservar, title: 'Reservar cita · CitaRENIEC' },
      { path: 'citas', component: MisCitas, title: 'Mis citas · CitaRENIEC' },
      { path: 'turno', component: MiTurno, title: 'Mi turno · CitaRENIEC' },
      { path: 'tramite', component: MiTramite, title: 'Mi trámite · CitaRENIEC' },
      { path: 'avisos', component: MisAvisos, title: 'Mis avisos · CitaRENIEC' },
    ],
  },

  // ---------- Operador de ventanilla ----------
  {
    path: 'operador',
    component: PlantillaApp,
    canActivate: [requiereRol('operador')],
    canActivateChild: [requiereRol('operador')],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'panel' },
      { path: 'perfil', component: PerfilOperador, title: 'Mi perfil · CitaRENIEC' },
      { path: 'panel', component: PanelTurnos, title: 'Panel de turnos · CitaRENIEC' },
      { path: 'check-in', component: CheckIn, title: 'Check-in · CitaRENIEC' },
    ],
  },

  // ---------- Administrador ----------
  {
    path: 'admin',
    component: PlantillaApp,
    canActivate: [requiereRol('administrador')],
    canActivateChild: [requiereRol('administrador')],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'usuarios', component: AdminUsuarios, title: 'Gestión de usuarios · CitaRENIEC' },
      { path: 'cuenta', component: MiCuenta, title: 'Mi perfil · CitaRENIEC' },
      { path: 'dashboard', component: Dashboard, title: 'Dashboard · CitaRENIEC' },
      { path: 'agendas', component: AdminAgendas, title: 'Agendas y cupos · CitaRENIEC' },
      { path: 'tramites', component: AdminTramites, title: 'Trámites · CitaRENIEC' },
      { path: 'avisos', component: AvisosEnviados, title: 'Avisos enviados · CitaRENIEC' },
      { path: 'integracion', component: Integracion, title: 'Integración y respaldo · CitaRENIEC' },
      { path: 'reportes', component: Reportes, title: 'Reportes · CitaRENIEC' },
    ],
  },

  // ---------- 404 ----------
  { path: '**', component: PlantillaPublica, children: [{ path: '', component: PaginaError, data: { codigo: 404 }, title: 'Página no encontrada · CitaRENIEC' }] },
];
