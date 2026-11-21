// Formatos en español del Perú y enmascarado de datos personales (Ley N.º 29733).

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'setiembre', 'octubre', 'noviembre', 'diciembre'];

export const enmascararDni = (dni: string) => (dni ? dni.slice(0, 4) + '****' : '');
export const enmascararCelular = (c: string) => (c ? `${c.slice(0, 3)} *** ${c.slice(-3)}` : '—');
export function enmascararCorreo(correo: string): string {
  const [u, d] = (correo || '').split('@');
  return u && d ? `${u[0]}***@${d}` : '';
}
export function iniciales(nombres: string, apellidos: string): string {
  return ((nombres || ' ')[0] + (apellidos || ' ')[0]).toUpperCase();
}
export const primerNombre = (nombres: string) => (nombres || '').split(' ')[0];
export const primerApellido = (apellidos: string) => (apellidos || '').split(' ')[0];

export function fechaLarga(d: Date): string {
  const t = `${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
  return t[0].toUpperCase() + t.slice(1);
}
export const fechaCorta = (d: Date) => `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
export const diaSemana = (d: Date) => DIAS[d.getDay()];
export const mesCorto = (d: Date) => MESES[d.getMonth()].slice(0, 3).toUpperCase();
export const diaCorto = (d: Date) => DIAS[d.getDay()].slice(0, 3).toUpperCase().replace('MIÉ', 'MIÉ');
export const mesAnio = (d: Date) => `${MESES[d.getMonth()]} de ${d.getFullYear()}`;
export const hora = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

/** «Hoy, 08:10», «Ayer, 18:21», «Hace 12 días». */
export function haceCuanto(iso?: string | null): string {
  if (!iso) return 'Nunca';
  const d = new Date(iso);
  const hoy = new Date();
  const dias = Math.floor((new Date(hoy.toDateString()).getTime() - new Date(d.toDateString()).getTime()) / 86400000);
  if (dias <= 0) return `Hoy, ${hora(d)}`;
  if (dias === 1) return `Ayer, ${hora(d)}`;
  return `Hace ${dias} días`;
}

export const soles = (n: number | null) => (n === null ? 'Consultar en sede' : n === 0 ? 'Sin costo' : `S/ ${n.toFixed(2)}`);

/** Suma días hábiles (lunes a viernes) a una fecha. */
export function sumarDiasHabiles(base: Date, n: number): Date {
  const d = new Date(base);
  let quedan = n;
  while (quedan > 0) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) quedan--;
  }
  return d;
}
