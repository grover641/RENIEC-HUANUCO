import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Icono } from '../../../../compartido/componentes/icono/icono';
import { CampoClave } from '../../../../compartido/componentes/campo-clave/campo-clave';
import { ToastService } from '../../../../compartido/componentes/toast/toast.service';
import { camposDe, mensajeDe } from '../../../../nucleo/api/api-error';
import { SesionService } from '../../../../nucleo/sesion/sesion.service';
import { enmascararDni, iniciales, mesAnio } from '../../../../nucleo/utilidades/formato';
import { actualizarContacto, cambiarClave } from '../../api/perfil.api';

/** HU-18 · «Mi cuenta» (T18.2). */
@Component({
  selector: 'app-mi-cuenta',
  imports: [Icono, CampoClave],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mi-cuenta.html',
  styles: `
    .pila-cuenta { display: flex; flex-direction: column; gap: 20px; max-width: 900px; margin: 0 auto; }
    .perfil { display: flex; align-items: center; gap: 18px; flex-wrap: wrap; }
    .perfil h2 { font-size: 21px; font-family: var(--fuente); font-weight: 800; }
    .candado { margin-left: auto; display: inline-flex; gap: 6px; align-items: center; font-size: 13px; color: var(--texto-2); }
    .tarjeta h3 { margin-bottom: 18px; }
    .pie-form { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; margin-top: 16px; }
    .resaltada { border: 2px solid var(--primario); box-shadow: 0 0 0 4px rgba(11, 79, 156, .12); }
  `,
})
export class MiCuenta {
  private readonly sesion = inject(SesionService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  protected readonly usuario = this.sesion.usuario;
  protected readonly enmascararDni = enmascararDni;

  protected readonly correo = signal(this.usuario()?.correo ?? '');
  protected readonly celular = signal(this.usuario()?.celular ?? '');
  protected readonly erroresContacto = signal<Record<string, string>>({});
  protected readonly guardandoContacto = signal(false);

  protected readonly actual = signal('');
  protected readonly nueva = signal('');
  protected readonly confirmar = signal('');
  protected readonly erroresClave = signal<Record<string, string>>({});
  protected readonly guardandoClave = signal(false);


  protected readonly ini = computed(() => { const u = this.usuario(); return u ? iniciales(u.nombres, u.apellidos) : ''; });
  protected readonly desde = computed(() => { const u = this.usuario(); return u ? mesAnio(new Date(u.creado)) : ''; });
  protected readonly rolTexto = computed(() => ({ ciudadano: 'ciudadano', operador: 'operador', administrador: 'administración · TI' })[this.usuario()?.rol ?? 'ciudadano']);

  protected async guardarContacto(ev: Event): Promise<void> {
    ev.preventDefault();
    const t = this.sesion.token();
    if (!t) return;
    this.guardandoContacto.set(true);
    try {
      const u = await actualizarContacto(t, this.correo(), this.celular());
      this.sesion.actualizar(u);
      this.erroresContacto.set({});
      this.toast.exito('Tus datos de contacto se guardaron.');
    } catch (e) {
      this.erroresContacto.set(camposDe(e));
      if (!Object.keys(camposDe(e)).length) this.toast.error(mensajeDe(e));
    } finally {
      this.guardandoContacto.set(false);
    }
  }

  protected async guardarClave(ev: Event): Promise<void> {
    ev.preventDefault();
    const t = this.sesion.token();
    if (!t) return;
    const eraTemporal = this.usuario()?.debeCambiarClave;
    this.guardandoClave.set(true);
    try {
      const u = await cambiarClave(t, this.actual(), this.nueva(), this.confirmar());
      this.sesion.actualizar(u);
      this.actual.set(''); this.nueva.set(''); this.confirmar.set('');
      this.erroresClave.set({});
      this.toast.exito(eraTemporal ? 'Listo. Ya puedes usar todas las opciones.' : 'Tu contraseña se actualizó.');
      if (eraTemporal) await this.router.navigateByUrl(this.sesion.rutaInicio(u));
    } catch (e) {
      this.erroresClave.set(camposDe(e));
      if (!Object.keys(camposDe(e)).length) this.toast.error(mensajeDe(e));
    } finally {
      this.guardandoClave.set(false);
    }
  }

}
