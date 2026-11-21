import { ChangeDetectionStrategy, Component, OnDestroy, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icono } from '../../../../compartido/componentes/icono/icono';
import { camposDe, mensajeDe } from '../../../../nucleo/api/api-error';
import { enmascararCorreo } from '../../../../nucleo/utilidades/formato';
import { MarcoAcceso } from '../../../../plantillas/acceso/marco-acceso';
import { solicitarRecuperacion } from '../../api/auth.api';

/** HU-17 · «Recuperar contraseña» y «Te enviamos un enlace» (T17.2). */
@Component({
  selector: 'app-recuperar',
  imports: [RouterLink, Icono, MarcoAcceso],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-marco-acceso>
      <a derecha routerLink="/ingresar"><app-icono nombre="arrow-left" [tam]="18" />Volver a iniciar sesión</a>
      <section class="acceso-tarjeta">
        @if (!enviadoA()) {
          <span class="icono-caja" style="width:56px;height:56px"><app-icono nombre="key" [tam]="26" /></span>
          <h1 style="margin-top:18px">Recupera tu contraseña</h1>
          <p class="bajada">Escribe el correo de tu cuenta. Te enviaremos un enlace para crear una nueva contraseña.</p>
          <form (submit)="enviar($event)" novalidate class="pila">
            <div class="campo" [class.con-error]="error()">
              <label for="rec-correo">Correo electrónico</label>
              <div class="entrada-icono">
                <app-icono nombre="mail" />
                <input id="rec-correo" class="entrada" type="email" autocomplete="email" placeholder="nombre@correo.com"
                  [value]="correo()" (input)="correo.set($any($event.target).value); error.set('')" />
              </div>
              @if (error()) { <span class="error">{{ error() }}</span> }
            </div>
            <button type="submit" class="btn btn-primario btn-bloque btn-grande" [disabled]="cargando()">
              @if (cargando()) { <span class="girando"></span>Enviando… } @else { Enviar enlace }
            </button>
          </form>
          <p class="texto-sm texto-2" style="margin-top:16px">¿Recordaste tu contraseña? <a routerLink="/ingresar">Ingresa</a></p>
        } @else {
          <span class="icono-caja verde" style="width:56px;height:56px"><app-icono nombre="mail" [tam]="26" /></span>
          <h1 style="margin-top:18px">Te enviamos un enlace</h1>
          <p class="bajada">Si <b>{{ enviadoA() }}</b> está registrado, recibirás un enlace para crear una nueva contraseña.</p>
          <div class="aviso aviso-advertencia"><app-icono nombre="clock" /><div>El enlace <b>vence en 60 minutos</b>. Revisa también tu carpeta de spam.</div></div>
          <div class="pila" style="margin-top:16px">
            <button type="button" class="btn btn-fantasma btn-bloque" [disabled]="espera() > 0 || cargando()" (click)="reenviar()">
              {{ espera() > 0 ? 'Reenviar enlace en ' + reloj() : 'Reenviar enlace' }}
            </button>
            <a class="btn btn-primario btn-bloque btn-grande" routerLink="/ingresar">Volver a iniciar sesión</a>
            <a class="texto-sm" routerLink="/buzon" style="text-align:center">Abrir el buzón de prueba (solo demostración)</a>
          </div>
        }
      </section>
    </app-marco-acceso>`,
})
export class Recuperar implements OnDestroy {
  protected readonly correo = signal('');
  protected readonly error = signal('');
  protected readonly cargando = signal(false);
  protected readonly enviadoA = signal('');
  protected readonly espera = signal(0);
  protected readonly reloj = computed(() => `${Math.floor(this.espera() / 60)}:${String(this.espera() % 60).padStart(2, '0')}`);
  private temporizador: ReturnType<typeof setInterval> | null = null;

  ngOnDestroy(): void { if (this.temporizador) clearInterval(this.temporizador); }

  protected async enviar(ev?: Event): Promise<void> {
    ev?.preventDefault();
    if (this.cargando()) return;
    this.cargando.set(true);
    try {
      await solicitarRecuperacion(this.correo());
      this.enviadoA.set(enmascararCorreo(this.correo().trim()));
      this.iniciarEspera();
    } catch (e) {
      this.error.set(camposDe(e)['correo'] ?? mensajeDe(e));
    } finally {
      this.cargando.set(false);
    }
  }

  protected reenviar(): void { void this.enviar(); }

  private iniciarEspera(): void {
    this.espera.set(45);
    if (this.temporizador) clearInterval(this.temporizador);
    this.temporizador = setInterval(() => {
      this.espera.update((s) => Math.max(0, s - 1));
      if (this.espera() === 0 && this.temporizador) clearInterval(this.temporizador);
    }, 1000);
  }
}
