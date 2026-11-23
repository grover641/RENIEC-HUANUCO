import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Icono } from '../../../../compartido/componentes/icono/icono';
import { CampoClave } from '../../../../compartido/componentes/campo-clave/campo-clave';
import { RequisitosClave } from '../../../../compartido/componentes/requisitos-clave/requisitos-clave';
import { ToastService } from '../../../../compartido/componentes/toast/toast.service';
import { camposDe, mensajeDe } from '../../../../nucleo/api/api-error';
import { SesionService } from '../../../../nucleo/sesion/sesion.service';
import { enmascararCelular, enmascararCorreo, enmascararDni, iniciales } from '../../../../nucleo/utilidades/formato';
import { cambiarClave } from '../../api/perfil.api';

/**
 * «Mi perfil» del operador (incluida en T18.2): datos asignados por el administrador y,
 * en el primer ingreso, cambio obligatorio de la contraseña temporal (HU-20).
 */
@Component({
  selector: 'app-perfil-operador',
  imports: [Icono, CampoClave, RequisitosClave],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="pila" style="max-width:900px;margin:0 auto">
      @if (usuario()?.debeCambiarClave) {
        <div class="aviso aviso-advertencia" role="alert">
          <app-icono nombre="key" [tam]="24" />
          <div><strong>Primer ingreso: cambia tu contraseña temporal</strong>Para usar el panel de turnos debes crear una contraseña propia. Las demás opciones se habilitan al guardar.</div>
        </div>
      }
      <div class="encabezado-pagina" style="margin-bottom:0"><div><h1>Mi perfil</h1><p>Datos asignados por el administrador de la sede.</p></div></div>

      <section class="tarjeta perfil">
        <div class="fila" style="flex-wrap:nowrap">
          <span class="avatar avatar-lg" style="background:#0F766E">{{ ini() }}</span>
          <div><h2>{{ usuario()?.nombres }} {{ usuario()?.apellidos }}</h2><p class="texto-3">Operador de ventanilla · DNI {{ dni() }}</p></div>
        </div>
        <dl>
          <div><dt>Ventanilla</dt><dd>{{ usuario()?.ventanilla ? 'Ventanilla ' + usuario()?.ventanilla : 'Sin asignar' }}</dd></div>
          <div><dt>Horario</dt><dd>8:00 – 16:30</dd></div>
          <div><dt>Correo</dt><dd>{{ correo() }}</dd></div>
          <div><dt>Celular</dt><dd>{{ celular() }}</dd></div>
        </dl>
      </section>

      <form class="tarjeta" [class.resaltada]="usuario()?.debeCambiarClave" (submit)="guardar($event)" novalidate>
        <h3>{{ usuario()?.debeCambiarClave ? 'Crear tu contraseña' : 'Cambiar contraseña' }}</h3>
        <div class="rejilla-3" style="margin-top:16px">
          <div class="campo" [class.con-error]="errores()['actual']">
            <label for="po-a">{{ usuario()?.debeCambiarClave ? 'Contraseña temporal' : 'Contraseña actual' }}</label>
            <app-campo-clave idCampo="po-a" [conIcono]="false" placeholder="Escríbela aquí" [(valor)]="actual" [conError]="!!errores()['actual']" />
            @if (errores()['actual']) { <span class="error">{{ errores()['actual'] }}</span> }
            @else if (usuario()?.debeCambiarClave) { <span class="ayuda">La recibiste en tu correo institucional.</span> }
          </div>
          <div class="campo" [class.con-error]="errores()['nueva']">
            <label for="po-n">Nueva contraseña</label>
            <app-campo-clave idCampo="po-n" [conIcono]="false" placeholder="Mínimo 8 caracteres" autocompletar="new-password" [(valor)]="nueva" [conError]="!!errores()['nueva']" />
            @if (errores()['nueva']) { <span class="error">{{ errores()['nueva'] }}</span> }
          </div>
          <div class="campo">
            <label for="po-c">Confirmar nueva contraseña</label>
            <app-campo-clave idCampo="po-c" [conIcono]="false" placeholder="Escríbela otra vez" autocompletar="new-password" [(valor)]="confirmar" />
          </div>
        </div>
        <div style="margin-top:16px"><app-requisitos-clave [clave]="nueva()" [confirmar]="confirmar()" /></div>
        <button type="submit" class="btn btn-primario" style="margin-top:18px" [disabled]="!listo() || guardando()">
          @if (guardando()) { <span class="girando"></span>Guardando… } @else { {{ usuario()?.debeCambiarClave ? 'Guardar y continuar' : 'Actualizar contraseña' }} }
        </button>
      </form>
    </div>`,
  styles: `
    .perfil { display: flex; justify-content: space-between; align-items: center; gap: 20px; flex-wrap: wrap; }
    .perfil h2 { font-size: 21px; font-family: var(--fuente); font-weight: 800; }
    dl { display: grid; grid-template-columns: repeat(2, minmax(150px, auto)); gap: 12px 40px; margin: 0; }
    dt { font-size: 13px; color: var(--texto-2); } dd { margin: 0; font-weight: 700; color: var(--titulo); }
    .resaltada { border: 2px solid var(--primario); box-shadow: 0 0 0 4px rgba(11, 79, 156, .12); }
  `,
})
export class PerfilOperador {
  private readonly sesion = inject(SesionService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  protected readonly usuario = this.sesion.usuario;

  protected readonly actual = signal('');
  protected readonly nueva = signal('');
  protected readonly confirmar = signal('');
  protected readonly errores = signal<Record<string, string>>({});
  protected readonly guardando = signal(false);
  protected readonly listo = computed(() => !!this.actual() && this.nueva().length >= 8 && this.nueva() === this.confirmar());

  protected readonly ini = computed(() => { const u = this.usuario(); return u ? iniciales(u.nombres, u.apellidos) : ''; });
  protected readonly dni = computed(() => enmascararDni(this.usuario()?.dni ?? ''));
  protected readonly correo = computed(() => enmascararCorreo(this.usuario()?.correo ?? ''));
  protected readonly celular = computed(() => enmascararCelular(this.usuario()?.celular ?? ''));

  protected async guardar(ev: Event): Promise<void> {
    ev.preventDefault();
    const t = this.sesion.token();
    if (!t) return;
    const eraTemporal = this.usuario()?.debeCambiarClave;
    this.guardando.set(true);
    try {
      const u = await cambiarClave(t, this.actual(), this.nueva(), this.confirmar());
      this.sesion.actualizar(u);
      this.actual.set(''); this.nueva.set(''); this.confirmar.set('');
      this.errores.set({});
      this.toast.exito(eraTemporal ? 'Listo. Ya tienes tu propia contraseña.' : 'Tu contraseña se actualizó.');
      if (eraTemporal) await this.router.navigateByUrl(this.sesion.rutaInicio(u));
    } catch (e) {
      this.errores.set(camposDe(e));
      if (!Object.keys(camposDe(e)).length) this.toast.error(mensajeDe(e));
    } finally {
      this.guardando.set(false);
    }
  }
}
