import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ICONOS } from './iconos';

/** Icono lineal: <app-icono nombre="calendar" [tam]="20" /> */
@Component({
  selector: 'app-icono',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[style.width.px]': 'tam()', '[style.height.px]': 'tam()', style: 'display:inline-flex;flex-shrink:0' },
  template: `<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    [attr.stroke-width]="trazo()" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
    <path [attr.d]="ruta()" /></svg>`,
})
export class Icono {
  readonly nombre = input.required<string>();
  readonly tam = input(20);
  readonly trazo = input(2);
  protected readonly ruta = computed(() => ICONOS[this.nombre()] ?? ICONOS['help']);
}
