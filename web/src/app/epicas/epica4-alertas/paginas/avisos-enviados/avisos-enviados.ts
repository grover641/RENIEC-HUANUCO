import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Icono } from '../../../../compartido/componentes/icono/icono';
import { cambiosBd } from '../../../../nucleo/api/base-datos';
import { Aviso } from '../../../../nucleo/modelos';
import { SesionService } from '../../../../nucleo/sesion/sesion.service';
import { enmascararDni, fechaLarga, hora } from '../../../../nucleo/utilidades/formato';
import { aIso } from '../../../../datos/semilla';
import { bitacora } from '../../api/avisos.api';

type FEstado = 'todos' | 'enviado' | 'fallo' | 'reenviado-sms' | 'sin-consentimiento';
type FCanal = 'todos' | 'WhatsApp' | 'SMS';

/** Bitácora «Avisos enviados» del administrador (incluida en T03.5 · HU-03; lee bitacora_alertas de T03.4). */
@Component({
  selector: 'app-avisos-enviados',
  imports: [Icono],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './avisos-enviados.html',
  styles: `
    .kpi { background: #fff; border: 1px solid var(--borde); border-radius: 14px; padding: 16px 18px; }
    .kpi small { display: block; color: var(--texto-2); font-size: 13px; } .kpi b { font-family: var(--fuente-titulo); font-weight: 900; font-size: 28px; color: var(--titulo); }
    .tabla-tarjeta { padding: 0; overflow: hidden; margin-top: 16px; }
    .filtros { display: flex; gap: 10px 16px; flex-wrap: wrap; align-items: center; padding: 16px 18px; border-bottom: 1px solid var(--borde); }
    .filtros .entrada { width: auto; min-height: 42px; }
    .pastilla { min-height: 36px; font-size: 14px; padding: 0 12px; }
    .ciudadano b { display: block; color: var(--titulo); } .ciudadano small { color: var(--texto-2); font-size: 12px; }
    .canal { display: inline-flex; align-items: center; gap: 6px; }
    .pie-tabla { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px; padding: 14px 18px; border-top: 1px solid var(--borde); font-size: 13px; color: var(--texto-3); }
  `,
})
export class AvisosEnviados {
  private readonly sesion = inject(SesionService);
  protected readonly enmascararDni = enmascararDni;
  protected readonly fecha = signal(aIso(new Date()));
  protected readonly fEstado = signal<FEstado>('todos');
  protected readonly fCanal = signal<FCanal>('todos');
  protected readonly hoyTexto = fechaLarga(new Date()).toLowerCase();

  private readonly todos = computed(() => { cambiosBd(); const t = this.sesion.token(); return t ? bitacora(t) : []; });
  protected readonly delDia = computed(() => this.todos().filter((a) => aIso(new Date(a.fecha)) === this.fecha()));
  protected readonly filas = computed(() => this.delDia().filter((a) => (this.fEstado() === 'todos' || a.estado === this.fEstado()) && (this.fCanal() === 'todos' || a.canal === this.fCanal())));
  protected readonly kpis = computed(() => {
    const d = this.delDia().filter((a) => a.estado !== 'sin-consentimiento');
    const fallaron = d.filter((a) => a.estado === 'fallo').length;
    return { enviados: d.length, entregados: d.length ? Math.round(((d.length - fallaron) / d.length) * 1000) / 10 : 0, fallaron, reenviados: d.filter((a) => a.estado === 'reenviado-sms').length };
  });
  protected readonly estados: { v: FEstado; t: string }[] = [{ v: 'todos', t: 'Todos los estados' }, { v: 'enviado', t: 'Enviado' }, { v: 'fallo', t: 'Falló' }, { v: 'reenviado-sms', t: 'Reenviado por SMS' }, { v: 'sin-consentimiento', t: 'Sin consentimiento' }];
  protected readonly canales: { v: FCanal; t: string }[] = [{ v: 'todos', t: 'Todos los canales' }, { v: 'WhatsApp', t: 'WhatsApp' }, { v: 'SMS', t: 'SMS' }];

  protected hora(a: Aviso): string { return hora(new Date(a.fecha)); }
  protected corto(n: string): string { const p = n.split(' '); return p.length >= 3 ? `${p[0]} ${p[1][0]}. ${p[2]}${p[3] ? ' ' + p[3][0] + '.' : ''}` : n; }
  protected tipo(a: Aviso): string { return ({ confirmacion: 'Confirmación de cita', recordatorio: 'Recordatorio 24 h', cambio: 'Cambio de cita', 'dni-listo': 'DNI listo' } as Record<string, string>)[a.tipo]; }
  protected est(a: Aviso): { t: string; c: string; i: string } {
    return ({ enviado: { t: 'Enviado', c: 'insignia-verde', i: 'check-check' }, fallo: { t: 'Falló', c: 'insignia-roja', i: 'x-circle' },
      'reenviado-sms': { t: 'Reenviado por SMS', c: 'insignia-naranja', i: 'refresh' }, 'sin-consentimiento': { t: 'Sin consentimiento', c: 'insignia-gris', i: 'shield' } } as Record<string, { t: string; c: string; i: string }>)[a.estado]
      ?? { t: a.estado, c: 'insignia-gris', i: 'info' };
  }
}
