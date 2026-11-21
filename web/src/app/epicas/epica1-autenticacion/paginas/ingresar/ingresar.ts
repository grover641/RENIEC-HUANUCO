import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icono } from '../../../../compartido/componentes/icono/icono';
import { MarcoAcceso } from '../../../../plantillas/acceso/marco-acceso';
import { TarjetaIngreso } from '../../componentes/tarjeta-ingreso/tarjeta-ingreso';

/** HU-16 · Página «Iniciar sesión» (T16.3). */
@Component({
  selector: 'app-ingresar',
  imports: [RouterLink, Icono, MarcoAcceso, TarjetaIngreso],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-marco-acceso>
      <a derecha routerLink="/"><app-icono nombre="arrow-left" [tam]="18" />Volver al inicio</a>
      <section class="acceso-tarjeta"><app-tarjeta-ingreso /></section>
      <aside class="aviso-seguridad">
        <app-icono nombre="shield-check" [tam]="22" style="color:#7BE0A6" />
        <div><strong>Aviso de seguridad</strong>Nunca te pediremos tu contraseña por WhatsApp, SMS ni llamada. Por tu seguridad, la sesión se cierra tras 30 minutos sin actividad.</div>
      </aside>
    </app-marco-acceso>`,
})
export class Ingresar {}
