import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export interface Barra { etiqueta: string; valores: number[]; }

/**
 * Gráfico de barras en SVG: vertical (una o dos series apiladas) u horizontal.
 * Colores: azul (serie 1) y guinda (serie 2), igual que el diseño.
 */
@Component({
  selector: 'app-grafico-barras',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (horizontal()) {
      <div class="horizontal" role="img" [attr.aria-label]="titulo()">
        @for (b of datos(); track b.etiqueta) {
          <div class="fila"><span class="et">{{ b.etiqueta }}</span>
            <span class="pista"><i [style.width.%]="(b.valores[0] / max()) * 100"></i></span><b>{{ b.valores[0] }}</b></div>
        }
      </div>
    } @else {
      <svg [attr.viewBox]="'0 0 ' + W + ' ' + H" role="img" [attr.aria-label]="titulo()">
        @for (g of guias(); track g) { <line x1="34" [attr.x2]="W" [attr.y1]="y(g)" [attr.y2]="y(g)" stroke="#E3E8EF" /><text x="28" [attr.y]="y(g) + 4" text-anchor="end">{{ g }}</text> }
        @for (b of datos(); track b.etiqueta; let i = $index) {
          @let s0 = b.valores[0]; @let s1 = b.valores.length > 1 ? b.valores[1] : 0;
          <rect [attr.x]="x(i)" [attr.width]="ancho()" [attr.y]="y(s0)" [attr.height]="H - 26 - y(s0)" fill="#0B4F9C" rx="3"><title>{{ b.etiqueta }}: {{ s0 }}</title></rect>
          @if (s1) { <rect [attr.x]="x(i)" [attr.width]="ancho()" [attr.y]="y(s0 + s1)" [attr.height]="y(s0) - y(s0 + s1)" fill="#C66A86" rx="3"><title>{{ b.etiqueta }}: {{ s1 }}</title></rect> }
          @if (etiquetasValor()) { <text [attr.x]="x(i) + ancho() / 2" [attr.y]="y(s0 + s1) - 5" text-anchor="middle" class="valor">{{ s0 + s1 }}{{ sufijo() }}</text> }
          <text [attr.x]="x(i) + ancho() / 2" [attr.y]="H - 8" text-anchor="middle">{{ b.etiqueta }}</text>
        }
        @if (meta() !== null) { <line x1="34" [attr.x2]="W" [attr.y1]="y(meta()!)" [attr.y2]="y(meta()!)" stroke="#6B7280" stroke-dasharray="6 5" /><text [attr.x]="W - 2" [attr.y]="y(meta()!) - 6" text-anchor="end" class="valor">Meta {{ meta() }}{{ sufijo() }}</text> }
      </svg>
    }`,
  styles: `
    svg { width: 100%; height: auto; display: block; } text { font-size: 11px; fill: #6B7280; font-family: var(--fuente); } .valor { font-weight: 700; fill: #1F2937; }
    .horizontal { display: flex; flex-direction: column; gap: 14px; padding: 6px 0; }
    .fila { display: grid; grid-template-columns: 34px 1fr 44px; align-items: center; gap: 10px; font-size: 14px; }
    .et { font-weight: 700; color: var(--titulo); } b { text-align: right; color: var(--titulo); }
    .pista { height: 14px; background: #EEF1F5; border-radius: 7px; overflow: hidden; } .pista i { display: block; height: 100%; background: #0B4F9C; border-radius: 7px; }
  `,
})
export class GraficoBarras {
  readonly datos = input.required<Barra[]>();
  readonly horizontal = input(false);
  readonly meta = input<number | null>(null);
  readonly sufijo = input('');
  readonly etiquetasValor = input(false);
  readonly titulo = input('Gráfico de barras');
  protected readonly W = 560; protected readonly H = 220;
  protected readonly max = computed(() => {
    const m = Math.max(...this.datos().map((b) => b.valores.reduce((s, v) => s + v, 0)), this.meta() ?? 0, 1);
    const paso = m > 100 ? 50 : m > 40 ? 10 : 5;
    return Math.ceil((m * 1.1) / paso) * paso;
  });
  protected readonly guias = computed(() => { const m = this.max(); return [0, m / 4, m / 2, (3 * m) / 4, m].map((v) => Math.round(v)); });
  protected readonly ancho = computed(() => Math.min(52, ((this.W - 50) / this.datos().length) * 0.6));
  protected x(i: number): number { const paso = (this.W - 50) / this.datos().length; return 44 + i * paso + (paso - this.ancho()) / 2; }
  protected y(v: number): number { return 10 + (1 - v / this.max()) * (this.H - 36); }
}
