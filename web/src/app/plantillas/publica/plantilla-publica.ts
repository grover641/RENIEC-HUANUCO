import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { EncabezadoPublico } from './encabezado-publico';
import { PiePublico } from './pie-publico';

/** Plantilla de las páginas públicas: encabezado, contenido y pie. */
@Component({
  selector: 'app-plantilla-publica',
  imports: [RouterOutlet, EncabezadoPublico, PiePublico],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-encabezado-publico /><main><router-outlet /></main><app-pie-publico />`,
  styles: `main { min-height: 50vh; background: #fff; }`,
})
export class PlantillaPublica {}
