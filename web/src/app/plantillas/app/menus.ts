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
      { texto: 'Mi cuenta', ruta: '/ciudadano/cuenta', icono: 'user' },
    ],
  },
  operador: {
    grupo: 'Ventanilla', etiquetaRol: 'Operador de ventanilla', fondoRol: '#E3F5F5', textoRol: '#0D7377', colorAvatar: '#0F766E',
    items: [
      { texto: 'Mi perfil', ruta: '/operador/perfil', icono: 'user' },
    ],
  },
  administrador: {
    grupo: 'Administración', etiquetaRol: 'Administración', fondoRol: '#FCE8EE', textoRol: '#B0123E', colorAvatar: '#B0123E',
    items: [
      { texto: 'Usuarios', ruta: '/admin/usuarios', icono: 'users' },
      { texto: 'Mi perfil', ruta: '/admin/cuenta', icono: 'user' },
    ],
  },
};
