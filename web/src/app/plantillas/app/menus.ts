import { Rol } from '../../nucleo/modelos';

export interface ItemMenu { texto: string; ruta: string; icono: string; insignia?: 'avisos' | 'conflictos'; nuevaPestana?: boolean; }
export interface MenuRol {
  grupo: string;
  etiquetaRol: string;
  fondoRol: string;
  textoRol: string;
  colorAvatar: string;
  items: ItemMenu[];
}

/** Menú lateral distinto para cada rol (kit de componentes del diseño). */
export const MENUS: Record<Rol, MenuRol> = {
  ciudadano: {
    grupo: 'Mi espacio', etiquetaRol: 'Ciudadano', fondoRol: '#E6EEF8', textoRol: '#0B4F9C', colorAvatar: '#0B4F9C',
    items: [
      { texto: 'Mi inicio', ruta: '/ciudadano/inicio', icono: 'home' },
      { texto: 'Reservar cita', ruta: '/ciudadano/reservar', icono: 'calendar-plus' },
      { texto: 'Mis citas', ruta: '/ciudadano/citas', icono: 'calendar' },
      { texto: 'Mi turno', ruta: '/ciudadano/turno', icono: 'ticket' },
      { texto: 'Mi trámite', ruta: '/ciudadano/tramite', icono: 'id-card' },
      { texto: 'Mis avisos', ruta: '/ciudadano/avisos', icono: 'bell', insignia: 'avisos' },
      { texto: 'Mi cuenta', ruta: '/ciudadano/cuenta', icono: 'user' },
    ],
  },
  operador: {
    grupo: 'Ventanilla', etiquetaRol: 'Operador de ventanilla', fondoRol: '#E3F5F5', textoRol: '#0D7377', colorAvatar: '#0F766E',
    items: [
      { texto: 'Panel de turnos', ruta: '/operador/panel', icono: 'megaphone' },
      { texto: 'Check-in', ruta: '/operador/check-in', icono: 'scan' },
      { texto: 'Pantalla de sala', ruta: '/sala', icono: 'monitor', nuevaPestana: true },
      { texto: 'Mi perfil', ruta: '/operador/perfil', icono: 'user' },
    ],
  },
  administrador: {
    grupo: 'Administración', etiquetaRol: 'Administración', fondoRol: '#FCE8EE', textoRol: '#B0123E', colorAvatar: '#B0123E',
    items: [
      { texto: 'Dashboard', ruta: '/admin/dashboard', icono: 'dashboard' },
      { texto: 'Agendas y cupos', ruta: '/admin/agendas', icono: 'calendar-clock' },
      { texto: 'Usuarios', ruta: '/admin/usuarios', icono: 'users' },
      { texto: 'Trámites', ruta: '/admin/tramites', icono: 'grid' },
      { texto: 'Avisos enviados', ruta: '/admin/avisos', icono: 'send' },
      { texto: 'Integración y respaldo', ruta: '/admin/integracion', icono: 'database', insignia: 'conflictos' },
      { texto: 'Reportes', ruta: '/admin/reportes', icono: 'bar-chart' },
    ],
  },
};
