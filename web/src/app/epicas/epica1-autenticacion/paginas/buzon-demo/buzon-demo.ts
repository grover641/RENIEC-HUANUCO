import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icono } from '../../../../compartido/componentes/icono/icono';
import { Correo } from '../../../../nucleo/modelos';
import { hora, fechaCorta } from '../../../../nucleo/utilidades/formato';
import { MarcoAcceso } from '../../../../plantillas/acceso/marco-acceso';
import { buzon } from '../../api/auth.api';

/**
 * Buzón de prueba, SOLO para la demostración en clase.
 * En Staging los correos se ven en Mailtrap (impedimento del Sprint 1); en producción llegan al correo real.
 */
@Component({
  selector: 'app-buzon-demo',
  imports: [RouterLink, Icono, MarcoAcceso],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-marco-acceso>
      <a derecha routerLink="/ingresar"><app-icono nombre="arrow-left" [tam]="18" />Volver a iniciar sesión</a>
      <section class="acceso-tarjeta ancha">
        <h1>Buzón de prueba</h1>
        <p class="bajada">Aquí llegan los correos del sistema durante la demostración (como Mailtrap en Staging).</p>
        <div class="aviso aviso-advertencia"><app-icono nombre="alert-triangle" /><div>Solo para la demostración: en el sistema real cada persona recibe los correos en su bandeja.</div></div>
        <div class="pila" style="margin-top:16px">
          @for (c of correos(); track c.id) {
            <article class="tarjeta-plana">
              <div class="fila-entre"><b>{{ c.asunto }}</b><span class="texto-xs texto-2">{{ cuando(c) }}</span></div>
              <p class="texto-sm texto-2" style="margin:2px 0 8px">Para: {{ c.para }}</p>
              <p class="texto-sm">{{ c.cuerpo }}</p>
              @if (c.enlace) { <a class="btn btn-primario" style="margin-top:12px" [routerLink]="c.enlace">Crear nueva contraseña</a> }
            </article>
          } @empty {
            <div class="caja-gris texto-2" style="text-align:center;padding:28px">Todavía no hay correos. Prueba «¿Olvidaste tu contraseña?».</div>
          }
        </div>
      </section>
    </app-marco-acceso>`,
})
export class BuzonDemo {
  protected readonly correos = signal<Correo[]>(buzon());
  protected cuando(c: Correo): string { const d = new Date(c.fecha); return `${fechaCorta(d)}, ${hora(d)}`; }
}
