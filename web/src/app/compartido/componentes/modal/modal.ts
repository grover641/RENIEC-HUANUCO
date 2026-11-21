import { ChangeDetectionStrategy, Component, ElementRef, afterNextRender, inject, input, output } from '@angular/core';
import { Icono } from '../icono/icono';

/**
 * Ventana emergente accesible: se cierra con Escape o con la X,
 * lleva el foco al primer campo y lo devuelve al cerrar.
 */
@Component({
  selector: 'app-modal',
  imports: [Icono],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'cerrar.emit()' },
  template: `
    <div class="fondo" (click)="cerrar.emit()"></div>
    <div class="ventana" role="dialog" aria-modal="true" [attr.aria-label]="titulo()" [style.max-width.px]="ancho()">
      <div class="cabecera">
        @if (icono()) { <span class="icono-caja" [class]="'icono-caja ' + tono()"><app-icono [nombre]="icono()!" [tam]="22" /></span> }
        <div class="textos">
          <h2>{{ titulo() }}</h2>
          @if (subtitulo()) { <p>{{ subtitulo() }}</p> }
        </div>
        <button type="button" class="btn btn-icono cerrar" (click)="cerrar.emit()" aria-label="Cerrar ventana"><app-icono nombre="x" /></button>
      </div>
      <div class="contenido"><ng-content /></div>
      <div class="pie"><ng-content select="[pie]" /></div>
    </div>`,
  styles: `
    :host { position: fixed; inset: 0; z-index: 90; display: flex; align-items: center; justify-content: center; padding: 16px; }
    .fondo { position: absolute; inset: 0; background: rgba(10, 35, 66, .55); }
    .ventana { position: relative; width: 100%; max-height: calc(100vh - 32px); overflow: auto; background: #fff; border-radius: 18px; box-shadow: var(--sombra-alta); animation: aparece .15s ease-out; }
    .cabecera { display: flex; gap: 14px; align-items: flex-start; padding: 22px 24px 8px; }
    .textos { flex: 1; } h2 { font-size: 22px; } p { color: var(--texto-3); font-size: 15px; margin-top: 4px; }
    .cerrar { flex-shrink: 0; }
    .contenido { padding: 12px 24px 20px; }
    .pie { display: flex; justify-content: flex-end; gap: 10px; flex-wrap: wrap; padding: 16px 24px; border-top: 1px solid var(--borde); background: #FAFBFC; border-radius: 0 0 18px 18px; }
    .pie:empty { display: none; }
    @keyframes aparece { from { transform: scale(.97); opacity: 0; } }
  `,
})
export class Modal {
  readonly titulo = input.required<string>();
  readonly subtitulo = input<string>();
  readonly icono = input<string>();
  readonly tono = input<'' | 'guinda' | 'verde' | 'naranja' | 'turquesa' | 'roja'>('');
  readonly ancho = input(560);
  readonly cerrar = output<void>();

  private readonly anterior = document.activeElement as HTMLElement | null;
  private readonly el = inject(ElementRef<HTMLElement>);

  constructor() {
    afterNextRender(() => {
      const primero = this.el.nativeElement.querySelector('.contenido input, .contenido select, .contenido textarea, .contenido button') as HTMLElement | null;
      (primero ?? this.el.nativeElement.querySelector('.cerrar'))?.focus();
    });
  }

  ngOnDestroy(): void {
    this.anterior?.focus?.();
  }
}
