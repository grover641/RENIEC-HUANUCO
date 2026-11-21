import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Icono } from '../../../../compartido/componentes/icono/icono';
import { bd, cambiosBd } from '../../../../nucleo/api/base-datos';
import { fechaCorta, hora } from '../../../../nucleo/utilidades/formato';

/** T03.5 · Historial de avisos de una cita, mostrado dentro de «Mis citas» (lee la bitácora de T03.4). */
@Component({
  selector: 'app-avisos-de-cita',
  imports: [Icono],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <b>Avisos de esta cita</b>
    <ul>
      @for (a of avisos(); track a.id) {
        <li><app-icono [nombre]="a.canal === 'SMS' ? 'sms' : 'message'" [tam]="16" />
          <span>{{ a.titulo }} · {{ a.canal }}<small>{{ cuando(a.fecha) }}</small></span>
          <span class="insignia" [class]="'insignia ' + clase(a.estado)">{{ texto(a.estado) }}</span></li>
      } @empty { <li class="texto-2">Aún no hay avisos para esta cita.</li> }
    </ul>`,
  styles: `
    ul { list-style: none; padding: 0; margin: 10px 0 0; display: flex; flex-direction: column; gap: 10px; }
    li { display: flex; align-items: center; gap: 10px; font-size: 14px; }
    li > span:nth-child(2) { flex: 1; } small { display: block; color: var(--texto-2); font-size: 12px; }
  `,
})
export class AvisosDeCita {
  readonly codigo = input.required<string>();
  protected readonly avisos = computed(() => { cambiosBd(); return bd().avisos.filter((a) => a.detalle.includes(this.codigo()) && a.estado !== 'sin-consentimiento'); });
  protected cuando(f: string): string { const d = new Date(f); return `${fechaCorta(d)}, ${hora(d)}`; }
  protected texto(e: string): string { return ({ enviado: 'Enviado', programado: 'Programado', fallo: 'Falló', 'reenviado-sms': 'Reenviado por SMS' } as Record<string, string>)[e] ?? e; }
  protected clase(e: string): string { return ({ enviado: 'insignia-verde', programado: 'insignia-azul', fallo: 'insignia-roja', 'reenviado-sms': 'insignia-naranja' } as Record<string, string>)[e] ?? 'insignia-gris'; }
}
