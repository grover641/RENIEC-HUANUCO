import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Icono } from '../icono/icono';

/**
 * Lista de requisitos de la contraseña. Obligatorio: 8 caracteres y que coincidan (HU-15/17/18).
 * Mayúscula y número solo se recomiendan: «exigir un número» es una mejora de la Sprint Review pendiente en el backlog.
 */
@Component({
  selector: 'app-requisitos-clave',
  imports: [Icono],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul class="caja-gris">
      @for (r of reglas(); track r.texto) {
        <li [class.ok]="r.ok">
          <app-icono [nombre]="r.ok ? 'check-circle' : 'x-circle'" [tam]="17" /><span>{{ r.texto }}@if (r.opcional) { <small>(recomendado)</small> }</span>
        </li>
      }
    </ul>`,
  styles: `
    ul { list-style: none; margin: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 8px 16px; }
    li { display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--texto-2); }
    li.ok { color: var(--exito); font-weight: 600; }
    small { font-size: 12px; font-weight: 500; color: var(--texto-2); margin-left: 4px; }
    li app-icono { flex-shrink: 0; }
  `,
})
export class RequisitosClave {
  readonly clave = input('');
  readonly confirmar = input<string | null>(null);
  protected readonly reglas = computed(() => {
    const c = this.clave();
    const lista = [
      { texto: 'Al menos 8 caracteres', ok: c.length >= 8, opcional: false },
      { texto: 'Una letra mayúscula', ok: /[A-ZÁÉÍÓÚÑ]/.test(c), opcional: true },
      { texto: 'Un número', ok: /\d/.test(c), opcional: true },
    ];
    if (this.confirmar() !== null) lista.push({ texto: 'Las contraseñas coinciden', ok: !!c && c === this.confirmar(), opcional: false });
    return lista;
  });
}
