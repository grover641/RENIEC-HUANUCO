import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Icono } from '../../../../compartido/componentes/icono/icono';
import { CampoClave } from '../../../../compartido/componentes/campo-clave/campo-clave';
import { ToastService } from '../../../../compartido/componentes/toast/toast.service';
import { camposDe, mensajeDe } from '../../../../nucleo/api/api-error';
import { SesionService } from '../../../../nucleo/sesion/sesion.service';
import { MarcoAcceso } from '../../../../plantillas/acceso/marco-acceso';
import { DatosRegistro, nivelClave, registrar, RX_DNI } from '../../api/auth.api';

/** HU-15 · Registro de ciudadano (T15.3). */
@Component({
  selector: 'app-registro',
  imports: [RouterLink, Icono, CampoClave, MarcoAcceso],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './registro.html',
  styles: `
    form { display: flex; flex-direction: column; gap: 16px; }
    .medidor { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; margin-top: 4px; }
    .medidor span { height: 5px; border-radius: 3px; background: #E3E8EF; }
    .medidor span.lleno { background: var(--exito); }
    .medidor.debil span.lleno { background: var(--advertencia); }
    .acepta { background: var(--fondo); border-radius: 12px; padding: 14px 16px; }
    .nota { text-align: center; font-size: 13px; color: var(--texto-2); }
    .aviso { margin-bottom: 4px; }
  `,
})
export class Registro {
  private readonly router = inject(Router);
  private readonly sesion = inject(SesionService);
  private readonly toast = inject(ToastService);

  protected readonly d = signal<DatosRegistro>({ dni: '', nombres: '', apellidos: '', correo: '', celular: '', clave: '', confirmar: '', aceptaDatos: false });
  protected readonly clave = signal('');
  protected readonly confirmar = signal('');
  protected readonly errores = signal<Record<string, string>>({});
  protected readonly cargando = signal(false);
  protected readonly cantidadErrores = computed(() => Object.keys(this.errores()).length);
  protected readonly dniValido = computed(() => RX_DNI.test(this.d().dni) && !this.errores()['dni']);
  protected readonly nivel = computed(() => nivelClave(this.clave()));

  protected poner(campo: keyof DatosRegistro, valor: string | boolean): void {
    this.d.update((x) => ({ ...x, [campo]: valor }));
    if (this.errores()[campo]) this.errores.update(({ [campo]: _q, ...resto }) => resto);
  }

  protected soloDigitos(campo: 'dni' | 'celular', valor: string, max: number, el: HTMLInputElement): void {
    const limpio = valor.replace(/\D/g, '').slice(0, max);
    el.value = limpio;
    this.poner(campo, limpio);
  }

  protected async enviar(ev: Event): Promise<void> {
    ev.preventDefault();
    if (this.cargando()) return;
    this.cargando.set(true);
    try {
      const r = await registrar({ ...this.d(), clave: this.clave(), confirmar: this.confirmar() });
      this.sesion.iniciar(r.token, r.usuario);
      this.toast.exito(`¡Bienvenido, ${r.usuario.nombres.split(' ')[0]}! Tu cuenta quedó creada.`);
      await this.router.navigateByUrl('/ciudadano/inicio');
    } catch (e) {
      this.errores.set(camposDe(e));
      if (!Object.keys(camposDe(e)).length) this.toast.error(mensajeDe(e));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      this.cargando.set(false);
    }
  }
}
