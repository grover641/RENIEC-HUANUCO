import { ChangeDetectionStrategy, Component, OnDestroy, computed, inject, input, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Icono } from '../../../../compartido/componentes/icono/icono';
import { CampoClave } from '../../../../compartido/componentes/campo-clave/campo-clave';
import { ApiError, mensajeDe } from '../../../../nucleo/api/api-error';
import { SesionService } from '../../../../nucleo/sesion/sesion.service';
import { bloqueadoHasta, ingresar, MAX_INTENTOS } from '../../api/auth.api';
import { hora } from '../../../../nucleo/utilidades/formato';

type Estado = { tipo: 'ninguno' } | { tipo: 'error'; texto?: string } | { tipo: 'quedan'; intento: number; quedan: number } | { tipo: 'bloqueado'; hasta: number };

/** HU-16 · Tarjeta «Ingresa a tu cuenta» con los estados de error, intentos restantes y bloqueo de 15 minutos. */
@Component({
  selector: 'app-tarjeta-ingreso',
  imports: [RouterLink, Icono, CampoClave],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tarjeta-ingreso.html',
  styles: `
    :host { display: block; }
    h1, h2 { font-size: 28px; font-family: var(--fuente-titulo); font-weight: 900; }
    .bajada { color: var(--texto-3); margin: 6px 0 18px; }
    form { display: flex; flex-direction: column; gap: 16px; }
    .olvido { align-self: flex-end; margin-top: -6px; font-size: 14px; font-weight: 700; }
    .aviso { margin-bottom: 4px; }
    .compacta h2 { font-size: 22px; }
    .compacta .bajada { margin-bottom: 12px; font-size: 14px; }
  `,
})
export class TarjetaIngreso implements OnDestroy {
  /** true en la portada de Inicio (tarjeta más compacta). */
  readonly compacta = input(false);

  private readonly sesion = inject(SesionService);
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);

  protected readonly identificador = signal('');
  protected readonly clave = signal('');
  protected readonly cargando = signal(false);
  protected readonly estado = signal<Estado>({ tipo: 'ninguno' });
  protected readonly ahora = signal(Date.now());
  protected readonly max = MAX_INTENTOS;
  private readonly temporizador = setInterval(() => this.revisarBloqueo(), 1000);

  protected readonly bloqueado = computed(() => {
    const e = this.estado();
    return e.tipo === 'bloqueado' && e.hasta > this.ahora();
  });
  protected readonly horaDesbloqueo = computed(() => {
    const e = this.estado();
    return e.tipo === 'bloqueado' ? hora(new Date(e.hasta)) : '';
  });
  protected readonly conError = computed(() => this.estado().tipo === 'error' || this.estado().tipo === 'quedan');

  ngOnDestroy(): void { clearInterval(this.temporizador); }

  protected cambioIdentificador(valor: string): void {
    this.identificador.set(valor);
    const hasta = valor.trim() ? bloqueadoHasta(valor) : 0;
    if (hasta > Date.now()) this.estado.set({ tipo: 'bloqueado', hasta });
    else if (this.estado().tipo === 'bloqueado') this.estado.set({ tipo: 'ninguno' });
  }

  protected async enviar(ev: Event): Promise<void> {
    ev.preventDefault();
    if (this.cargando() || this.bloqueado()) return;
    if (!this.identificador().trim() || !this.clave()) {
      this.estado.set({ tipo: 'error', texto: 'Escribe tu DNI o correo y tu contraseña.' });
      return;
    }
    this.cargando.set(true);
    try {
      const r = await ingresar(this.identificador(), this.clave());
      this.sesion.iniciar(r.token, r.usuario);
      const volver = this.ruta.snapshot.queryParamMap.get('volver');
      const destino = volver && volver.startsWith('/' + (r.usuario.rol === 'administrador' ? 'admin' : r.usuario.rol)) ? volver : this.sesion.rutaInicio(r.usuario);
      await this.router.navigateByUrl(destino);
    } catch (e) {
      if (e instanceof ApiError && e.status === 429) this.estado.set({ tipo: 'bloqueado', hasta: Number(e.campos['hasta']) });
      else if (e instanceof ApiError && e.status === 401) {
        const intento = Number(e.campos['intento']);
        const quedan = Number(e.campos['quedan']);
        this.estado.set(intento >= 3 ? { tipo: 'quedan', intento, quedan } : { tipo: 'error' });
      } else this.estado.set({ tipo: 'error', texto: mensajeDe(e) });
    } finally {
      this.cargando.set(false);
    }
  }

  private revisarBloqueo(): void {
    this.ahora.set(Date.now());
    const e = this.estado();
    if (e.tipo === 'bloqueado' && e.hasta <= Date.now()) this.estado.set({ tipo: 'ninguno' });
  }
}
