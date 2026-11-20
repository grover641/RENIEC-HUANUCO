import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Icono } from '../../../../compartido/componentes/icono/icono';
import { CampoClave } from '../../../../compartido/componentes/campo-clave/campo-clave';
import { RequisitosClave } from '../../../../compartido/componentes/requisitos-clave/requisitos-clave';
import { ToastService } from '../../../../compartido/componentes/toast/toast.service';
import { mensajeDe } from '../../../../nucleo/api/api-error';
import { bd } from '../../../../nucleo/api/base-datos';
import { enmascararCorreo } from '../../../../nucleo/utilidades/formato';
import { MarcoAcceso } from '../../../../plantillas/acceso/marco-acceso';
import { enlaceValido, MINUTOS_ENLACE, restablecerClave } from '../../api/auth.api';

/** HU-17 · «Crea tu nueva contraseña» desde el enlace del correo, con el estado «enlace vencido». */
@Component({
  selector: 'app-nueva-clave',
  imports: [RouterLink, Icono, CampoClave, RequisitosClave, MarcoAcceso],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-marco-acceso>
      <section class="acceso-tarjeta">
        @if (valido()) {
          <span class="icono-caja" style="width:56px;height:56px"><app-icono nombre="lock" [tam]="26" /></span>
          <h1 style="margin-top:18px">Crea tu nueva contraseña</h1>
          <p class="bajada">Cuenta de {{ cuenta() }} · enlace válido por {{ minutosRestantes() }} minutos más.</p>
          <form class="pila" (submit)="guardar($event)" novalidate>
            <div class="campo">
              <label for="nc-1">Nueva contraseña</label>
              <app-campo-clave idCampo="nc-1" [conIcono]="false" placeholder="Mínimo 8 caracteres" autocompletar="new-password" [(valor)]="clave" />
            </div>
            <div class="campo">
              <label for="nc-2">Confirma la contraseña</label>
              <app-campo-clave idCampo="nc-2" [conIcono]="false" placeholder="Escríbela otra vez" autocompletar="new-password" [(valor)]="confirmar" />
            </div>
            <app-requisitos-clave [clave]="clave()" [confirmar]="confirmar()" />
            @if (error()) { <div class="aviso aviso-error"><app-icono nombre="x-circle" /><div>{{ error() }}</div></div> }
            <button type="submit" class="btn btn-primario btn-bloque btn-grande" [disabled]="!listo() || cargando()">
              @if (cargando()) { <span class="girando"></span>Guardando… } @else { Guardar contraseña }
            </button>
          </form>
        } @else {
          <span class="icono-caja roja" style="width:56px;height:56px"><app-icono nombre="hourglass" [tam]="26" /></span>
          <h1 style="margin-top:18px">Este enlace ya no sirve</h1>
          <p class="bajada">El enlace venció (dura 60 minutos) o ya fue usado. Por seguridad, solo sirve el último enlace que te enviamos.</p>
          <div class="pila">
            <a class="btn btn-primario btn-bloque btn-grande" routerLink="/recuperar">Pedir un enlace nuevo</a>
            <a class="btn btn-secundario btn-bloque" routerLink="/ingresar">Volver a iniciar sesión</a>
          </div>
        }
      </section>
    </app-marco-acceso>`,
})
export class NuevaClave {
  readonly token = input.required<string>();
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly clave = signal('');
  protected readonly confirmar = signal('');
  protected readonly error = signal('');
  protected readonly cargando = signal(false);
  protected readonly valido = computed(() => enlaceValido(this.token()));
  private readonly registro = computed(() => bd().tokensClave.find((t) => t.token === this.token()));
  protected readonly cuenta = computed(() => {
    const u = bd().usuarios.find((x) => x.id === this.registro()?.usuarioId);
    return u ? enmascararCorreo(u.correo) : '';
  });
  protected readonly minutosRestantes = computed(() => {
    const t = this.registro();
    return t ? Math.max(1, Math.ceil((t.creado + MINUTOS_ENLACE * 60000 - Date.now()) / 60000)) : 0;
  });
  protected readonly listo = computed(() => this.clave().length >= 8 && this.clave() === this.confirmar());

  protected async guardar(ev: Event): Promise<void> {
    ev.preventDefault();
    this.cargando.set(true);
    try {
      const msg = await restablecerClave(this.token(), this.clave(), this.confirmar());
      this.toast.exito(msg);
      await this.router.navigateByUrl('/ingresar');
    } catch (e) {
      this.error.set(mensajeDe(e));
    } finally {
      this.cargando.set(false);
    }
  }
}
