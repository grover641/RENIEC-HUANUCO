// Modelos de datos. Equivalen a las tablas de PostgreSQL de la API Laravel (api/).

export type Rol = 'ciudadano' | 'operador' | 'administrador';
export type EstadoUsuario = 'activo' | 'inactivo';

export interface Usuario {
  id: number;
  dni: string;
  nombres: string;
  apellidos: string;
  correo: string;
  celular: string;
  rol: Rol;
  estado: EstadoUsuario;
  ventanilla: number | null;
  clave: string;              // hash (en Laravel: bcrypt)
  debeCambiarClave: boolean;  // operador con contraseña temporal (HU-20)
  aceptaDatosFecha: string;   // consentimiento Ley N.º 29733 (HU-15)
  creado: string;
  ultimoAcceso: string | null;
  consentimiento?: Consentimiento | null; // HU-13
}

/** HU-13 · Consentimiento de avisos (Ley N.º 29733). Nunca se borra: se marca la fecha de revocación. */
export interface Consentimiento {
  whatsapp: boolean;
  sms: boolean;
  tipos: { confirmacion: boolean; recordatorio: boolean; cambio: boolean; dniListo: boolean };
  fecha: string;
  revocado: string | null;
}
export type UsuarioPublico = Omit<Usuario, 'clave'>;

export interface Tramite {
  id: string;
  nombre: string;
  categoria: 'DNI mayores' | 'DNI menores' | 'Recojo de DNI' | 'Rectificaciones' | 'Otros';
  descripcion: string;
  duracionMin: number;
  costo: number | null;       // null = «Consultar en sede»
  icono: string;
  tono: '' | 'guinda' | 'verde' | 'naranja' | 'turquesa';
  requisitos: string[];
  publicado: boolean;
}

/** HU-10 · Franja horaria de una ventanilla en un día de la semana (bloques de 30 min). */
export type TipoFranja = 'dni' | 'recojo' | 'todos';
export interface Franja {
  id: number;
  ventanilla: number;
  dia: number;            // 1 = lunes … 5 = viernes
  inicio: string;         // HH:MM
  fin: string;            // HH:MM
  tipo: TipoFranja;
  cupos: number;          // cupos por bloque de 30 minutos
}

export type EstadoCita = 'confirmada' | 'atendida' | 'cancelada' | 'no-asistio';
export interface Cita {
  id: number;
  codigo: string;             // p. ej. CR-7F3K9
  ciudadanoId: number | null; // null = ciudadano sin cuenta (cita tomada por teléfono o en sede)
  nombre: string;
  dni: string;
  tramiteId: string;
  fecha: string;              // AAAA-MM-DD
  hora: string;               // HH:MM
  ventanilla: number;
  estado: EstadoCita;
  creada: string;
}

export interface Aviso {
  id: number;
  ciudadanoId: number | null;
  nombre: string;
  dni: string;
  tipo: 'confirmacion' | 'recordatorio' | 'cambio' | 'dni-listo';
  titulo: string;
  detalle: string;
  canal: 'WhatsApp' | 'SMS';
  estado: 'enviado' | 'programado' | 'fallo' | 'reenviado-sms' | 'sin-consentimiento';
  fecha: string;
  leido: boolean;
  nota?: string;
}

/** HU-09 · Turno emitido en el check-in. */
export type Prioridad = 'gestante' | 'adulto-mayor' | 'discapacidad' | null;
export type EstadoTurno = 'espera' | 'llamado' | 'atendido' | 'ausente';
export interface Turno {
  id: number;
  numero: string;          // A-015 (o HCO-031 en modo local)
  citaId: number | null;   // null = atención por orden de llegada
  ciudadanoId: number | null;
  nombre: string;
  dni: string;
  tramiteId: string;
  ventanilla: number;
  horaCita: string | null;
  tarde?: boolean;         // llegó después de la tolerancia: entra por orden de llegada (HU-09)
  prioridad: Prioridad;
  estado: EstadoTurno;
  emitido: number;
  llamado: number | null;
  terminado: number | null;
  local: boolean;          // emitido en modo local (HU-04A)
}

/** HU-06 · Registro de auditoría de los cambios de turnos. */
export interface Auditoria { id: number; turno: string; operador: string; accion: string; motivo: string; fecha: string; }

/** HU-14 · Trámite de DNI con su estado en el sistema central. */
export type EstadoDni = 'solicitado' | 'en-proceso' | 'listo' | 'entregado';
export interface TramiteDni {
  id: number;
  ciudadanoId: number | null;
  dni: string;
  titular: string;
  tipo: string;
  estado: EstadoDni;
  fechas: Partial<Record<EstadoDni, string>>;
  ventanilla: number;
  citaCodigo: string | null;
  sincronizado: string;
}

/** HU-04A/04B · Estado de la integración, modo local y cola de sincronización. */
export interface Pendiente { id: number; uuid: string; tipo: string; detalle: string; fecha: string; estado: 'pendiente' | 'enviado'; }
export interface Conflicto { id: number; titulo: string; local: string; central: string; }
export interface Evento { fecha: string; icono: string; texto: string; }
export interface Integracion {
  central: 'conectado' | 'sin-respuesta';
  internet: 'estable' | 'caido';
  modoLocal: boolean;
  ultimaConsulta: string;
  respuestaMs: number;
  pendientes: Pendiente[];
  conflictos: Conflicto[];
  eventos: Evento[];
}

export interface Intento { identificador: string; exito: boolean; fecha: number; }
export interface TokenClave { token: string; usuarioId: number; creado: number; usado: boolean; }
export interface Sesion { token: string; usuarioId: number; ultimaActividad: number; }
export interface Correo { id: string; para: string; asunto: string; cuerpo: string; enlace?: string; fecha: string; }

export interface BaseDatos {
  version: number;
  dia: string;               // día de la demostración (AAAA-MM-DD)
  sigId: number;
  usuarios: Usuario[];
  intentos: Intento[];       // intentos_acceso (HU-16)
  tokensClave: TokenClave[]; // password_reset_tokens (HU-17)
  sesiones: Sesion[];        // personal_access_tokens (Sanctum)
  buzon: Correo[];           // buzón de prueba (Mailtrap en Staging)
  tramites: Tramite[];       // catálogo (HU-10)
  citas: Cita[];             // citas (HU-01)
  avisos: Aviso[];           // bitácora de avisos (HU-03)
  franjas: Franja[];         // agendas y cupos (HU-10)
  ocupacion: Record<string, number>; // cupos ya tomados por otros ciudadanos (datos de ejemplo)
  turnos: Turno[];           // turnos y colas (HU-09)
  auditoria: Auditoria[];    // auditoria_turnos (HU-06)
  tramitesDni: TramiteDni[]; // tramites_dni (HU-14)
  integracion: Integracion;  // HU-04A / HU-04B
}
