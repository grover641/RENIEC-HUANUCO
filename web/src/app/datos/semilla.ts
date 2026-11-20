// Datos de ejemplo para la demostración en clase (mismos nombres, códigos y cifras que las interfaces del diseño).
// Contraseñas de prueba: ver README.md. Ningún dato es real.
import { Aviso, BaseDatos, Cita, Consentimiento, Franja, Integracion, Pendiente, Tramite, TramiteDni, Turno, Usuario } from '../nucleo/modelos';
import { sumarDiasHabiles } from '../nucleo/utilidades/formato';

export const SEDE = {
  nombre: 'Oficina Regional Huánuco',
  direccion: 'Jr. General Prado, Huánuco (referencial)',
  horario: 'Lunes a viernes, de 8:00 a 16:30',
  apertura: '08:00',
  cierre: '16:30',
  ventanillas: [1, 2, 3],
  // Datos de contacto de demostración: no son de RENIEC.
  telefono: '(062) 000 000 · demo',
  correo: 'contacto@citareniec.demo',
  whatsapp: '900 000 000 · demo',
};

export const TRAMITES: Tramite[] = [
  { id: 'duplicado', nombre: 'Duplicado de DNI', categoria: 'DNI mayores', descripcion: 'Por pérdida, robo o deterioro de tu DNI.', duracionMin: 15, costo: 35, icono: 'copy', tono: '', publicado: true,
    requisitos: ['Acudir en persona con tu código de cita.', 'Pagar la tasa antes de tu cita.', 'Indicar el motivo: pérdida, robo o deterioro.'] },
  { id: 'renovacion', nombre: 'Renovación de DNI', categoria: 'DNI mayores', descripcion: 'Cuando tu DNI venció o está por vencer.', duracionMin: 15, costo: 41, icono: 'refresh', tono: '', publicado: true,
    requisitos: ['Presentar tu DNI actual, aunque esté vencido.', 'Pagar la tasa en Banco de la Nación, Págalo.pe o Yape.', 'Acudir en persona: se toman tu foto, firma y huellas.'] },
  { id: 'menor', nombre: 'DNI por primera vez (menor)', categoria: 'DNI menores', descripcion: 'Para niñas, niños y adolescentes.', duracionMin: 20, costo: 16, icono: 'baby', tono: 'turquesa', publicado: true,
    requisitos: ['Acta de nacimiento del menor.', 'Presencia del menor con su padre, madre o tutor (con DNI).', 'Pagar la tasa, salvo casos exonerados.'] },
  { id: 'recojo', nombre: 'Recojo de DNI', categoria: 'Recojo de DNI', descripcion: 'Cuando te avisemos que tu DNI está listo.', duracionMin: 10, costo: 0, icono: 'package', tono: 'verde', publicado: true,
    requisitos: ['Acudir en persona (el titular).', 'Llevar tu código de cita o el comprobante del trámite.', 'Haber recibido el aviso «DNI listo».'] },
  { id: 'rectificacion', nombre: 'Rectificación de datos', categoria: 'Rectificaciones', descripcion: 'Corrige nombres, fechas u otros datos.', duracionMin: 20, costo: 30, icono: 'file-pen', tono: 'guinda', publicado: true,
    requisitos: ['Documento que sustente el cambio (por ejemplo, un acta).', 'Pagar la tasa antes de tu cita.', 'Acudir en persona.'] },
  { id: 'foto-firma', nombre: 'Actualización de foto y firma', categoria: 'Otros', descripcion: 'Actualiza tu foto y tu firma en el DNI.', duracionMin: 15, costo: null, icono: 'camera', tono: 'naranja', publicado: true,
    requisitos: ['Presentar tu DNI actual.', 'Pagar la tasa antes de tu cita.', 'Acudir en persona.'] },
];

/** Qué trámites admite cada tipo de franja (HU-10). */
export const TRAMITES_POR_FRANJA: Record<string, string[]> = {
  dni: ['duplicado', 'renovacion', 'menor'],
  recojo: ['recojo'],
  todos: TRAMITES.map((t) => t.id),
};
export const NOMBRE_FRANJA: Record<string, string> = { dni: 'DNI mayores y menores', recojo: 'Recojo de DNI', todos: 'Todos los trámites' };

/** Contraseñas de prueba (se guardan cifradas en la base simulada). */
export const CLAVES_DEMO = { ciudadano: 'Ciudadano2026!', operador: 'Operador2026!', administrador: 'Admin2026!' };

/**
 * Estadísticas históricas de la sede (datos de ejemplo de la demostración, iguales a las interfaces).
 * En el sistema real las calcula la API de reportes (HU-08) a partir de citas, turnos y avisos.
 */
export const ESTADISTICAS = {
  hoy: {
    esperaPromedio: 18, metaEspera: 30, citasDigitalesPct: 72, metaDigital: 70, citasHoy: 146, cuposOfertados: 159,
    inasistencias: 9, inasistenciasPct: 6.2, turnosAtendidos: 98,
    esperaPorHora: [{ h: '08:00', v: 12 }, { h: '09:00', v: 22 }, { h: '10:00', v: 26 }, { h: '11:00', v: 19 }, { h: '12:00', v: 15 }, { h: '13:00', v: 11 }, { h: '14:00', v: 17 }, { h: '15:00', v: 21 }, { h: '16:00', v: 8 }],
    turnosPorVentanilla: [{ v: 1, n: 34 }, { v: 2, n: 35 }, { v: 3, n: 29 }],
  },
  citasPorDia: [
    { dia: 'Lun 9', digitales: 92, presenciales: 34 }, { dia: 'Mar 10', digitales: 96, presenciales: 40 }, { dia: 'Mié 11', digitales: 101, presenciales: 38 },
    { dia: 'Jue 12', digitales: 104, presenciales: 33 }, { dia: 'Vie 13', digitales: 88, presenciales: 31 }, { dia: 'Lun 16', digitales: 110, presenciales: 36 },
    { dia: 'Mar 17', digitales: 105, presenciales: 41 },
  ],
  semanas: [
    { desde: '2026-10-26', hasta: '2026-10-30', etiqueta: '26 – 30 oct', citas: 702, digitalesPct: 66, espera: 27, inasistenciaPct: 9.1, atendidos: 638, porVentanilla: [214, 222, 202] },
    { desde: '2026-11-02', hasta: '2026-11-06', etiqueta: '2 – 6 nov', citas: 731, digitalesPct: 69, espera: 23, inasistenciaPct: 7.8, atendidos: 667, porVentanilla: [225, 228, 214] },
    { desde: '2026-11-09', hasta: '2026-11-13', etiqueta: '9 – 13 nov', citas: 748, digitalesPct: 72, espera: 19, inasistenciaPct: 6.5, atendidos: 692, porVentanilla: [233, 236, 223] },
    { desde: '2026-11-16', hasta: '2026-11-20', etiqueta: '16 – 20 nov', citas: 765, digitalesPct: 74, espera: 16, inasistenciaPct: 6.2, atendidos: 687, porVentanilla: [233, 235, 219] },
  ],
};

const CONSENTIMIENTO_TOTAL = (fecha: string, sms = true): Consentimiento => ({
  whatsapp: true, sms, tipos: { confirmacion: true, recordatorio: true, cambio: true, dniListo: true }, fecha, revocado: null,
});

type UsuarioSemilla = Omit<Usuario, 'clave' | 'aceptaDatosFecha' | 'creado' | 'ultimoAcceso' | 'consentimiento'> & { ultimoAccesoDias: number | null; ultimoAccesoHora: string; avisos?: 'todos' | 'whatsapp' };

const USUARIOS: UsuarioSemilla[] = [
  { id: 1, dni: '41234578', nombres: 'Luis Alberto', apellidos: 'Ramos Quispe', correo: 'luis.ramos@gmail.com', celular: '987654321', rol: 'ciudadano', estado: 'activo', ventanilla: null, debeCambiarClave: false, ultimoAccesoDias: 0, ultimoAccesoHora: '08:10', avisos: 'todos' },
  { id: 2, dni: '40871234', nombres: 'Carmen', apellidos: 'Soto Vargas', correo: 'carmen.soto@sede.demo', celular: '964512208', rol: 'operador', estado: 'activo', ventanilla: 2, debeCambiarClave: false, ultimoAccesoDias: 0, ultimoAccesoHora: '07:52' },
  { id: 3, dni: '42190876', nombres: 'Rosa', apellidos: 'Huamán Ponce', correo: 'rosa.huaman@sede.demo', celular: '962111001', rol: 'administrador', estado: 'activo', ventanilla: null, debeCambiarClave: false, ultimoAccesoDias: 0, ultimoAccesoHora: '07:40' },
  { id: 4, dni: '43710245', nombres: 'Jorge', apellidos: 'Paredes Leiva', correo: 'jorge.paredes@sede.demo', celular: '963220145', rol: 'operador', estado: 'activo', ventanilla: 1, debeCambiarClave: false, ultimoAccesoDias: 0, ultimoAccesoHora: '07:55' },
  { id: 5, dni: '44150398', nombres: 'Milagros', apellidos: 'Rivera Soto', correo: 'milagros.rivera@sede.demo', celular: '965330412', rol: 'operador', estado: 'activo', ventanilla: 3, debeCambiarClave: false, ultimoAccesoDias: 0, ultimoAccesoHora: '07:58' },
  { id: 6, dni: '45020871', nombres: 'Kevin', apellidos: 'Alvarado Tucto', correo: 'kevin.alvarado@sede.demo', celular: '966440518', rol: 'operador', estado: 'inactivo', ventanilla: null, debeCambiarClave: false, ultimoAccesoDias: 12, ultimoAccesoHora: '16:20' },
  { id: 7, dni: '46880452', nombres: 'Lucía', apellidos: 'Fernández Ponce', correo: 'lucia.fernandez@hotmail.com', celular: '967550623', rol: 'ciudadano', estado: 'activo', ventanilla: null, debeCambiarClave: false, ultimoAccesoDias: 1, ultimoAccesoHora: '18:21', avisos: 'todos' },
  { id: 8, dni: '47330915', nombres: 'Diana', apellidos: 'Chávez Mallqui', correo: 'diana.chavez@gmail.com', celular: '968660734', rol: 'ciudadano', estado: 'activo', ventanilla: null, debeCambiarClave: false, ultimoAccesoDias: 2, ultimoAccesoHora: '10:05', avisos: 'whatsapp' },
];

/** Plantilla semanal de cada ventanilla (lunes a viernes): 24 + 8 + 21 = 53 cupos por día · 159 en las 3 ventanillas. */
const PLANTILLA: Omit<Franja, 'id' | 'ventanilla' | 'dia'>[] = [
  { inicio: '08:00', fin: '12:00', tipo: 'dni', cupos: 3 },
  { inicio: '12:00', fin: '13:00', tipo: 'recojo', cupos: 4 },
  { inicio: '13:00', fin: '16:30', tipo: 'todos', cupos: 3 },
];

export const aIso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

/** Número pseudoaleatorio fijo a partir de un texto (para que la ocupación de ejemplo no cambie al recargar). */
function semillaNum(texto: string): number {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) h = Math.imul(h ^ texto.charCodeAt(i), 16777619);
  return (h >>> 0) % 1000;
}

export function crearSemilla(cifrar: (clave: string) => string): BaseDatos {
  const ahora = new Date();
  const hoy = aIso(ahora);
  const min = (m: number) => ahora.getTime() - m * 60000;
  const haceDias = (d: number, h = '10:00') => { const x = new Date(ahora); x.setDate(x.getDate() - d); const [a, b] = h.split(':').map(Number); x.setHours(a, b, 0, 0); return x.toISOString(); };
  const creado = new Date(ahora.getFullYear(), ahora.getMonth(), 2).toISOString();

  const usuarios: Usuario[] = USUARIOS.map(({ ultimoAccesoDias, ultimoAccesoHora, avisos, ...u }) => {
    let ultimoAcceso: string | null = null;
    if (ultimoAccesoDias !== null) ultimoAcceso = haceDias(ultimoAccesoDias, ultimoAccesoHora);
    const consentimiento = avisos ? CONSENTIMIENTO_TOTAL(creado, avisos === 'todos') : null;
    return { ...u, clave: cifrar(CLAVES_DEMO[u.rol]), aceptaDatosFecha: creado, creado, ultimoAcceso, consentimiento };
  });

  // ---------- Agendas (HU-10) ----------
  const franjas: Franja[] = [];
  let idF = 1;
  for (const v of SEDE.ventanillas) for (let dia = 1; dia <= 5; dia++) for (const p of PLANTILLA) franjas.push({ id: idF++, ventanilla: v, dia, ...p });

  // Cupos ya tomados por otros ciudadanos en los próximos 15 días hábiles (para que la reserva se vea real).
  const ocupacion: Record<string, number> = {};
  let dia = new Date(ahora);
  for (let n = 0; n < 15; n++) {
    dia = n === 0 && ahora.getDay() >= 1 && ahora.getDay() <= 5 ? new Date(ahora) : sumarDiasHabiles(dia, 1);
    const f = aIso(dia);
    const lleno = semillaNum(f) % 7 === 0; // algunos días casi llenos
    for (const fr of franjas.filter((x) => x.dia === dia.getDay())) {
      for (let t = aMin(fr.inicio); t < aMin(fr.fin); t += 30) {
        const h = deMin(t);
        const r = semillaNum(`${f}|${h}|${fr.ventanilla}`);
        const libres = lleno ? (r % 10 < 8 ? 0 : 1) : r % 9 === 0 ? 0 : r % 4 === 0 ? 2 : 1;
        ocupacion[`${f}|${h}|${fr.ventanilla}`] = Math.max(0, fr.cupos - libres);
      }
    }
  }

  // ---------- Citas (HU-01, HU-07) ----------
  const proxima = sumarDiasHabiles(ahora, 4);
  const pronto1 = new Date(min(-20)); const pronto2 = new Date(min(-50)); const tarde = new Date(min(60));
  const redondear = (d: Date) => { d.setMinutes(d.getMinutes() < 30 ? 0 : 30, 0, 0); return hhmm(d); };
  const citas: Cita[] = [
    { id: 1, codigo: 'CR-7F3K9', ciudadanoId: 1, nombre: 'Luis Alberto Ramos Quispe', dni: '41234578', tramiteId: 'renovacion', fecha: hoy, hora: '08:30', ventanilla: 2, estado: 'confirmada', creada: haceDias(3, '16:05') },
    { id: 2, codigo: 'CR-2H8QD', ciudadanoId: 1, nombre: 'Luis Alberto Ramos Quispe', dni: '41234578', tramiteId: 'rectificacion', fecha: aIso(proxima), hora: '15:30', ventanilla: 1, estado: 'confirmada', creada: ahora.toISOString() },
    { id: 3, codigo: 'CR-9P1LX', ciudadanoId: 1, nombre: 'Luis Alberto Ramos Quispe', dni: '41234578', tramiteId: 'foto-firma', fecha: aIso(new Date(min(98 * 1440))), hora: '10:00', ventanilla: 3, estado: 'atendida', creada: haceDias(100) },
    { id: 4, codigo: 'CR-5B7NR', ciudadanoId: 1, nombre: 'Luis Alberto Ramos Quispe', dni: '41234578', tramiteId: 'recojo', fecha: aIso(new Date(min(260 * 1440))), hora: '09:30', ventanilla: 1, estado: 'no-asistio', creada: haceDias(262) },
    { id: 5, codigo: 'CR-3D6WE', ciudadanoId: 1, nombre: 'Luis Alberto Ramos Quispe', dni: '41234578', tramiteId: 'duplicado', fecha: aIso(new Date(min(272 * 1440))), hora: '11:00', ventanilla: 2, estado: 'atendida', creada: haceDias(274) },
    { id: 6, codigo: 'CR-8K4QA', ciudadanoId: 1, nombre: 'Luis Alberto Ramos Quispe', dni: '41234578', tramiteId: 'rectificacion', fecha: aIso(new Date(min(308 * 1440))), hora: '14:00', ventanilla: 3, estado: 'cancelada', creada: haceDias(312) },
    // Ciudadanos que ya hicieron check-in hoy (cola de la ventanilla 2)
    { id: 7, codigo: 'CR-6T2LM', ciudadanoId: null, nombre: 'María Elena Torres Ruiz', dni: '44661234', tramiteId: 'duplicado', fecha: hoy, hora: '09:00', ventanilla: 2, estado: 'confirmada', creada: haceDias(5) },
    { id: 8, codigo: 'CR-9J4KD', ciudadanoId: null, nombre: 'Juan Pablo Ccori Huanca', dni: '42771234', tramiteId: 'recojo', fecha: hoy, hora: '09:15', ventanilla: 2, estado: 'confirmada', creada: haceDias(1) },
    { id: 9, codigo: 'CR-3R8VB', ciudadanoId: null, nombre: 'Ana Lucía Chávez Rojas', dni: '43981234', tramiteId: 'rectificacion', fecha: hoy, hora: '08:45', ventanilla: 2, estado: 'confirmada', creada: haceDias(4) },
    { id: 10, codigo: 'CR-7P2QW', ciudadanoId: null, nombre: 'Pedro Cárdenas Albornoz', dni: '45211234', tramiteId: 'recojo', fecha: hoy, hora: '08:45', ventanilla: 2, estado: 'confirmada', creada: haceDias(2) },
    { id: 11, codigo: 'CR-5E9NM', ciudadanoId: null, nombre: 'Rosa María Espinoza Vela', dni: '46121234', tramiteId: 'foto-firma', fecha: hoy, hora: '09:00', ventanilla: 2, estado: 'confirmada', creada: haceDias(6) },
    { id: 12, codigo: 'CR-1H5TS', ciudadanoId: null, nombre: 'Hilda Rojas Campos', dni: '43551234', tramiteId: 'recojo', fecha: hoy, hora: '08:15', ventanilla: 2, estado: 'confirmada', creada: haceDias(2) },
    // Ciudadanos que aún no llegan (para probar el check-in)
    { id: 13, codigo: 'CR-4K7PQ', ciudadanoId: null, nombre: 'Rocío Mendoza Paz', dni: '42551234', tramiteId: 'renovacion', fecha: hoy, hora: redondear(pronto1), ventanilla: 2, estado: 'confirmada', creada: haceDias(3) },
    { id: 14, codigo: 'CR-8D2LM', ciudadanoId: null, nombre: 'Carlos Huerta Ramos', dni: '43331234', tramiteId: 'duplicado', fecha: hoy, hora: redondear(pronto2), ventanilla: 2, estado: 'confirmada', creada: haceDias(2) },
    { id: 15, codigo: 'CR-4M2T8', ciudadanoId: null, nombre: 'Teodoro Ponce Ríos', dni: '44441234', tramiteId: 'renovacion', fecha: hoy, hora: redondear(tarde), ventanilla: 2, estado: 'confirmada', creada: haceDias(7) },
  ];

  // ---------- Turnos de hoy (HU-09, HU-02) ----------
  const T = (id: number, numero: string, ventanilla: number, estado: Turno['estado'], emitidoMin: number, llamadoMin: number | null, extra: Partial<Turno> = {}): Turno => ({
    id, numero, citaId: null, ciudadanoId: null, nombre: 'Ciudadano atendido', dni: '40000000', tramiteId: 'renovacion', ventanilla, horaCita: null,
    prioridad: null, estado, emitido: min(emitidoMin), llamado: llamadoMin === null ? null : min(llamadoMin),
    terminado: estado === 'atendido' ? min((llamadoMin ?? 0) - 6) : estado === 'ausente' ? min((llamadoMin ?? 0) - 2) : null, local: false, ...extra,
  });
  const turnos: Turno[] = [
    T(1, 'A-001', 1, 'atendido', 140, 133), T(2, 'A-002', 2, 'atendido', 138, 130), T(3, 'A-003', 1, 'atendido', 132, 121),
    T(4, 'A-004', 2, 'atendido', 128, 120), T(5, 'A-005', 3, 'atendido', 124, 116), T(6, 'A-006', 2, 'atendido', 118, 108),
    T(7, 'A-007', 3, 'atendido', 110, 101), T(8, 'A-008', 2, 'atendido', 102, 95), T(9, 'A-009', 2, 'atendido', 96, 86),
    T(10, 'A-010', 2, 'ausente', 90, 80), T(11, 'A-011', 2, 'atendido', 84, 72), T(12, 'A-012', 2, 'atendido', 74, 64),
    T(13, 'A-013', 2, 'llamado', 52, 4, { nombre: 'Gloria Salazar Tarazona', dni: '41821234', tramiteId: 'duplicado', horaCita: '08:00' }),
    T(14, 'A-014', 2, 'espera', 30, null, { citaId: 12, nombre: 'Hilda Rojas Campos', dni: '43551234', tramiteId: 'recojo', horaCita: '08:15' }),
    T(15, 'A-015', 2, 'espera', 26, null, { citaId: 1, ciudadanoId: 1, nombre: 'Luis Alberto Ramos Quispe', dni: '41234578', tramiteId: 'renovacion', horaCita: '08:30' }),
    T(16, 'A-016', 2, 'espera', 14, null, { citaId: 9, nombre: 'Ana Lucía Chávez Rojas', dni: '43981234', tramiteId: 'rectificacion', horaCita: '08:45' }),
    T(17, 'A-017', 2, 'espera', 11, null, { citaId: 10, nombre: 'Pedro Cárdenas Albornoz', dni: '45211234', tramiteId: 'recojo', horaCita: '08:45' }),
    T(18, 'A-018', 2, 'espera', 6, null, { citaId: 7, nombre: 'María Elena Torres Ruiz', dni: '44661234', tramiteId: 'duplicado', horaCita: '09:00', prioridad: 'gestante' }),
    T(19, 'A-019', 2, 'espera', 5, null, { citaId: 11, nombre: 'Rosa María Espinoza Vela', dni: '46121234', tramiteId: 'foto-firma', horaCita: '09:00' }),
    T(20, 'A-020', 2, 'espera', 2, null, { citaId: 8, nombre: 'Juan Pablo Ccori Huanca', dni: '42771234', tramiteId: 'recojo', horaCita: '09:15', prioridad: 'adulto-mayor' }),
  ];

  // ---------- Avisos (HU-03, HU-13) ----------
  let idA = 1;
  const A = (ciudadanoId: number | null, nombre: string, dni: string, tipo: Aviso['tipo'], titulo: string, detalle: string, canal: Aviso['canal'], estado: Aviso['estado'], fecha: string, leido: boolean, nota = ''): Aviso =>
    ({ id: idA++, ciudadanoId, nombre, dni, tipo, titulo, detalle, canal, estado, fecha, leido, nota });
  const luis = 'Luis Alberto Ramos Quispe';
  const avisos: Aviso[] = [
    A(1, luis, '41234578', 'confirmacion', 'Confirmación de cita', 'Cita CR-2H8QD confirmada: Rectificación de datos.', 'WhatsApp', 'enviado', ahora.toISOString(), false),
    A(1, luis, '41234578', 'recordatorio', 'Recordatorio 24 h antes', 'No pudimos entregarlo por WhatsApp; lo reenviamos por SMS.', 'WhatsApp', 'fallo', haceDias(1, '08:30'), true, 'Celular apagado'),
    A(1, luis, '41234578', 'recordatorio', 'Recordatorio 24 h antes', 'Tu cita CR-7F3K9 es mañana a las 08:30.', 'SMS', 'reenviado-sms', haceDias(1, '08:31'), false, 'Entregado a las 08:31'),
    A(1, luis, '41234578', 'confirmacion', 'Confirmación de cita', 'Cita CR-7F3K9 confirmada: Renovación de DNI, 08:30.', 'WhatsApp', 'enviado', haceDias(3, '16:05'), true, 'Leído'),
    A(7, 'Lucía Fernández Ponce', '46880452', 'dni-listo', 'DNI listo', 'Tu DNI ya está listo. Reserva tu cita de recojo.', 'WhatsApp', 'fallo', haceDias(0, '07:58'), true, 'Número sin WhatsApp'),
    A(7, 'Lucía Fernández Ponce', '46880452', 'dni-listo', 'DNI listo', 'Tu DNI ya está listo. Reserva tu cita de recojo.', 'SMS', 'reenviado-sms', haceDias(0, '07:59'), true, 'Entregado a las 07:59'),
    A(8, 'Diana Chávez Mallqui', '47330915', 'cambio', 'Cambio de cita', 'Tu cita fue reprogramada.', 'WhatsApp', 'enviado', haceDias(0, '07:40'), true, 'Reprogramada'),
    A(null, 'Pedro Cárdenas Albornoz', '45211234', 'confirmacion', 'Confirmación de cita', 'Cita CR-7P2QW confirmada: Recojo de DNI.', 'SMS', 'enviado', haceDias(2, '15:12'), true, 'Sin consentimiento de WhatsApp'),
    A(null, 'Ana Lucía Chávez Rojas', '43981234', 'recordatorio', 'Recordatorio 24 h antes', 'Tu cita CR-3R8VB es mañana a las 08:45.', 'WhatsApp', 'fallo', haceDias(1, '08:45'), true, 'Celular apagado'),
    A(null, 'Ana Lucía Chávez Rojas', '43981234', 'recordatorio', 'Recordatorio 24 h antes', 'Tu cita CR-3R8VB es mañana a las 08:45.', 'SMS', 'reenviado-sms', haceDias(1, '08:46'), true, 'Entregado a las 08:46'),
    A(null, 'Juan Pablo Ccori Huanca', '42771234', 'dni-listo', 'DNI listo', 'Tu DNI ya está listo. Reserva tu cita de recojo.', 'WhatsApp', 'enviado', haceDias(1, '14:30'), true, 'Leído'),
  ];

  // ---------- Trámites de DNI en el sistema central (HU-14) ----------
  const tramitesDni: TramiteDni[] = [
    { id: 1, ciudadanoId: 7, dni: '46880452', titular: 'Lucía Fernández Ponce', tipo: 'Duplicado de DNI', estado: 'listo', ventanilla: 1, citaCodigo: 'CR-1L8KP',
      fechas: { solicitado: haceDias(8, '09:10'), 'en-proceso': haceDias(7, '11:00'), listo: haceDias(0, '07:55') }, sincronizado: haceDias(0, '07:55') },
    { id: 2, ciudadanoId: 8, dni: '47330915', titular: 'Diana Chávez Mallqui', tipo: 'Renovación de DNI', estado: 'entregado', ventanilla: 3, citaCodigo: 'CR-6W1ZR',
      fechas: { solicitado: haceDias(20, '10:20'), 'en-proceso': haceDias(19, '09:00'), listo: haceDias(9, '10:15'), entregado: haceDias(6, '11:40') }, sincronizado: haceDias(6, '11:40') },
    { id: 3, ciudadanoId: null, dni: '42771234', titular: 'Juan Pablo Ccori Huanca', tipo: 'Duplicado de DNI', estado: 'listo', ventanilla: 2, citaCodigo: 'CR-9J4KD',
      fechas: { solicitado: haceDias(10, '09:30'), 'en-proceso': haceDias(9, '10:00'), listo: haceDias(1, '14:28') }, sincronizado: haceDias(1, '14:28') },
  ];

  // ---------- Integración y respaldo (HU-04A, HU-04B) ----------
  const pendientes: Pendiente[] = [];
  for (let i = 1; i <= 45; i++) pendientes.push({ id: i, uuid: `loc-${1000 + i}`, tipo: i <= 31 ? 'Check-in y turno' : 'Atención cerrada', detalle: `Registro local ${i}`, fecha: haceDias(0, '10:1' + (i % 10)), estado: 'enviado' });
  pendientes.push({ id: 46, uuid: 'loc-1046', tipo: 'Atención cerrada', detalle: 'Turno A-031 · Recojo de DNI', fecha: haceDias(0, '10:14'), estado: 'pendiente' });
  pendientes.push({ id: 47, uuid: 'loc-1047', tipo: 'Check-in y turno', detalle: 'Cita CR-8Q2ZX · Duplicado de DNI', fecha: haceDias(0, '10:09'), estado: 'pendiente' });
  const integracion: Integracion = {
    central: 'conectado', internet: 'estable', modoLocal: false, ultimaConsulta: ahora.toISOString(), respuestaMs: 230, pendientes,
    conflictos: [
      { id: 1, titulo: 'Turno A-031 · Recojo de DNI', local: 'Atendido en Ventanilla 3 a las 10:14', central: 'Figura en espera en Ventanilla 1' },
      { id: 2, titulo: 'Cita CR-8Q2ZX · Duplicado de DNI', local: 'Check-in a las 10:09 (turno A-029)', central: 'Cancelada por el ciudadano a las 10:05' },
    ],
    eventos: [
      { fecha: haceDias(0, '10:27'), icono: 'wifi', texto: 'Internet restablecido. Empezó la sincronización de 47 registros.' },
      { fecha: haceDias(0, '10:02'), icono: 'wifi-off', texto: 'Se perdió la conexión a internet. Las ventanillas pasaron a modo local.' },
      { fecha: haceDias(0, '09:15'), icono: 'database', texto: '128 estados «DNI listo» recibidos del sistema central.' },
      { fecha: haceDias(0, '07:45'), icono: 'check-circle', texto: 'Copia de respaldo diaria completada.' },
    ],
  };

  return {
    version: 2, dia: hoy, sigId: 500, usuarios, intentos: [], tokensClave: [], sesiones: [], buzon: [],
    tramites: TRAMITES.map((t) => ({ ...t, requisitos: [...t.requisitos] })),
    citas, avisos, franjas, ocupacion, turnos, auditoria: [], tramitesDni, integracion,
  };
}

export const aMin = (h: string) => { const [a, b] = h.split(':').map(Number); return a * 60 + b; };
export const deMin = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
