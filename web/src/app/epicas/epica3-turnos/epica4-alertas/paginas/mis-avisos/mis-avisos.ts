import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Icono } from '../../../../compartido/componentes/icono/icono';
import { ToastService } from '../../../../compartido/componentes/toast/toast.service';
import { mensajeDe } from '../../../../nucleo/api/api-error';
import { cambiosBd } from '../../../../nucleo/api/base-datos';
import { Aviso, Consentimiento } from '../../../../nucleo/modelos';
import { SesionService } from '../../../../nucleo/sesion/sesion.service';
import { enmascararCelular, fechaCorta, hora } from '../../../../nucleo/utilidades/formato';
import { guardarConsentimiento, leerConsentimiento, marcarLeidos, misAvisos } from '../../api/avisos.api';

type Tipos = Consentimiento['tipos'];

/** HU-13 · «Mis avisos»: consentimiento por canal y tipo (T13.3) + avisos recibidos (HU-03). */
@Component({
  selector: 'app-mis-avisos',
  imports: [Icono],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mis-avisos.html',
  styleUrl: './mis-avisos.scss',
})
export class MisAvisos {
  private readonly sesion = inject(SesionService);
  private readonly toast = inject(ToastService);
  protected readonly celular = computed(() => enmascararCelular(this.sesion.usuario()?.celular ?? ''));
  private readonly inicial = this.sesion.token() ? leerConsentimiento(this.sesion.token()!) : null;
  protected readonly whatsapp = signal(this.inicial ? !this.inicial.revocado && this.inicial.whatsapp : false);
  protected readonly sms = signal(this.inicial ? !this.inicial.revocado && this.inicial.sms : false);
  protected readonly tipos = signal<Tipos>(this.inicial?.tipos ?? { confirmacion: true, recordatorio: true, cambio: true, dniListo: true });
  protected readonly guardado = signal<Consentimiento | null>(this.inicial);
  protected readonly listaTipos: { clave: keyof Tipos; texto: string }[] = [
    { clave: 'confirmacion', texto: 'Confirmación de cita' }, { clave: 'recordatorio', texto: 'Recordatorio 24 horas antes' },
    { clave: 'cambio', texto: 'Cambios o cancelación de mi cita' }, { clave: 'dniListo', texto: '«DNI listo» para recoger' },
  ];
  protected readonly avisos = computed(() => { cambiosBd(); const t = this.sesion.token(); return t ? misAvisos(t) : []; });

  constructor() {
    const t = this.sesion.token();
    if (t) setTimeout(() => marcarLeidos(t), 1500); // al abrir la pantalla se marcan como leídos
  }

  protected async guardar(): Promise<void> {
    const t = this.sesion.token();
    if (!t) return;
    try {
      const c = await guardarConsentimiento(t, { whatsapp: this.whatsapp(), sms: this.sms(), tipos: this.tipos() });
      this.guardado.set(c);
      this.toast.exito(c.revocado ? 'Retiraste tu consentimiento: ya no te enviaremos avisos.' : 'Tus preferencias de avisos se guardaron.');
    } catch (e) { this.toast.error(mensajeDe(e)); }
  }

  protected cambiar(canal: 'whatsapp' | 'sms', v: boolean): void { (canal === 'whatsapp' ? this.whatsapp : this.sms).set(v); void this.guardar(); }
  protected cambiarTipo(k: keyof Tipos, v: boolean): void { this.tipos.update((t) => ({ ...t, [k]: v })); void this.guardar(); }

  protected cuando(a: Aviso): string { const d = new Date(a.fecha); return `${fechaCorta(d).replace(/ de \d{4}$/, '')} · ${hora(d)}`; }
  protected fechaTexto(iso: string): string { const d = new Date(iso); return `${fechaCorta(d)} a las ${hora(d)}`; }
  protected icono(a: Aviso): { n: string; c: string } {
    if (a.estado === 'fallo') return { n: 'alert-triangle', c: 'roja' };
    return ({ confirmacion: { n: 'check-circle', c: '' }, recordatorio: { n: 'bell', c: 'naranja' }, cambio: { n: 'calendar-clock', c: 'turquesa' }, 'dni-listo': { n: 'package', c: 'verde' } } as Record<string, { n: string; c: string }>)[a.tipo];
  }
  protected estado(a: Aviso): { t: string; c: string } | null {
    return ({ fallo: { t: 'Falló', c: 'insignia-roja' }, 'reenviado-sms': { t: 'Reenviado por SMS', c: 'insignia-naranja' }, programado: { t: 'Programado', c: 'insignia-azul' } } as Record<string, { t: string; c: string }>)[a.estado]
      ?? (a.leido ? { t: 'Leído', c: 'insignia-verde' } : { t: 'Nuevo', c: 'insignia-guinda' });
  }
}
