import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Logo } from '../../compartido/componentes/logo/logo';

/**
 * Marco de las páginas de acceso (ingresar, registro, recuperar, nueva contraseña):
 * fondo de Huánuco oscurecido, logo arriba y la tarjeta al centro.
 * Lo de la derecha de la barra se proyecta con el atributo [derecha].
 */
@Component({
  selector: 'app-marco-acceso',
  imports: [RouterLink, Logo],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="acceso">
      <div class="acceso-barra">
        <a routerLink="/" aria-label="CitaRENIEC Huánuco, ir al inicio"><app-logo [tam]="40" [oscuro]="true" /></a>
        <ng-content select="[derecha]" />
      </div>
      <main class="acceso-centro"><ng-content /></main>
      <div class="acceso-pie">
        <span>Proyecto académico · No es un sitio oficial de RENIEC</span>
        <a routerLink="/privacidad">Protección de datos personales (Ley N.º 29733)</a>
        <a routerLink="/" fragment="ayuda">Ayuda</a>
      </div>
    </div>`,
})
export class MarcoAcceso {}
