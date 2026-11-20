import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Gráfico de línea simple en SVG, con línea de meta opcional (dashboard: espera promedio por hora). */
@Component({
  selector: 'app-grafico-linea',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg [attr.viewBox]="'0 0 ' + W + ' ' + H" role="img" [attr.aria-label]="titulo()">
      @for (g of guias(); track g.v) {
        <line [attr.x1]="M" [attr.x2]="W - 8" [attr.y1]="g.y" [attr.y2]="g.y" stroke="#E3E8EF" />
        <text [attr.x]="M - 8" [attr.y]="g.y + 4" text-anchor="end">{{ g.v }}</text>
      }
      @if (meta() !== null) {
        <line [attr.x1]="M" [attr.x2]="W - 8" [attr.y1]="y(meta()!)" [attr.y2]="y(meta()!)" stroke="#6B7280" stroke-dasharray="6 5" />
        <text [attr.x]="W - 10" [attr.y]="y(meta()!) - 6" text-anchor="end" class="meta">{{ textoMeta() }}</text>
      }
      <polyline [attr.points]="puntos()" fill="none" stroke="#0B4F9C" stroke-width="2.5" stroke-linejoin="round" />
      @for (p of datos(); track p.etiqueta; let i = $index) {
        <circle [attr.cx]="x(i)" [attr.cy]="y(p.valor)" r="4" fill="#fff" stroke="#0B4F9C" stroke-width="2"><title>{{ p.etiqueta }}: {{ p.valor }}</title></circle>
        <text [attr.x]="x(i)" [attr.y]="H - 6" text-anchor="middle">{{ p.etiqueta }}</text>
      }
    </svg>`,
  styles: `svg { width: 100%; height: auto; display: block; } text { font-size: 11px; fill: #6B7280; font-family: var(--fuente); } .meta { font-weight: 700; fill: #1F2937; }`,
})
export class GraficoLinea {
  readonly datos = input.required<{ etiqueta: string; valor: number }[]>();
  readonly meta = input<number | null>(null);
  readonly textoMeta = input('Meta');
  readonly maximo = input(40);
  readonly titulo = input('Gráfico');
  protected readonly W = 560; protected readonly H = 220; protected readonly M = 34;
  protected x(i: number): number { const n = Math.max(1, this.datos().length - 1); return this.M + 10 + (i * (this.W - this.M - 30)) / n; }
  protected y(v: number): number { return 14 + (1 - v / this.maximo()) * (this.H - 44); }
  protected readonly puntos = computed(() => this.datos().map((p, i) => `${this.x(i)},${this.y(p.valor)}`).join(' '));
  protected readonly guias = computed(() => [0, 10, 20, 30, 40].filter((v) => v <= this.maximo()).map((v) => ({ v, y: this.y(v) })));
}
