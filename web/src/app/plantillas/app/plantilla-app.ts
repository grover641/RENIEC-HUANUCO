import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Icono } from '../../compartido/componentes/icono/icono';
import { Logo } from '../../compartido/componentes/logo/logo';
import { Modal } from '../../compartido/componentes/modal/modal';
import { rutaPerfil, SesionService } from '../../nucleo/sesion/sesion.service';
import { bd } from '../../nucleo/api/base-datos';
import { enmascararDni, iniciales, primerApellido, primerNombre } from '../../nucleo/utilidades/formato';
import { SEDE } from '../../datos/semilla';
import { MENUS } from './menus';
import { cambiosBd } from '../../nucleo/api/base-datos';

/** Plantilla de la aplicación: barra superior, menú lateral según el rol y aviso de sesión por vencer. */
@Component({
  selector: 'app-plantilla-app',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icono, Logo, Modal],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './plantilla-app.html',
  styleUrl: './plantilla-app.scss',
})
export class PlantillaApp {
  protected readonly sesion = inject(SesionService);
  private readonly router = inject(Router);

  private readonly navegacion = signal(0);
  protected readonly menuAbierto = signal(false);
  protected readonly lateralAbierto = signal(false);
  protected readonly usuario = this.sesion.usuario;
  protected readonly menu = computed(() => MENUS[this.usuario()?.rol ?? 'ciudadano']);
  protected readonly ini = computed(() => { const u = this.usuario(); return u ? iniciales(u.nombres, u.apellidos) : ''; });
  protected readonly nombreCorto = computed(() => { const u = this.usuario(); return u ? `${primerNombre(u.nombres)} ${u.rol === 'ciudadano' ? u.apellidos : primerApellido(u.apellidos)}` : ''; });
  protected readonly subtitulo = computed(() => {
    const u = this.usuario();
    if (!u) return '';
    if (u.rol === 'ciudadano') return 'DNI ' + enmascararDni(u.dni);
    if (u.rol === 'operador') return u.ventanilla ? `Operador · Ventanilla ${u.ventanilla}` : 'Operador';
    return 'Administración · TI';
  });
  protected readonly reloj = computed(() => {
    const s = this.sesion.segundosRestantes();
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  });
  protected readonly avisosSinLeer = computed(() => {
    const u = this.usuario();
    this.navegacion(); // se recalcula al navegar
    cambiosBd();
    return u ? bd().avisos.filter((a) => a.ciudadanoId === u.id && !a.leido).length : 0;
  });
  protected readonly abiertoAhora = computed(() => {
    const d = new Date();
    const min = d.getHours() * 60 + d.getMinutes();
    return d.getDay() >= 1 && d.getDay() <= 5 && min >= 8 * 60 && min < 16 * 60 + 30;
  });
  protected readonly sede = SEDE;
  protected readonly turnoDelDia = new Date().getHours() < 13 ? 'turno mañana' : 'turno tarde';

  constructor() {
    this.router.events.pipe(takeUntilDestroyed()).subscribe((e) => {
      if (e instanceof NavigationEnd) { this.lateralAbierto.set(false); this.menuAbierto.set(false); this.navegacion.update((n) => n + 1); }
    });
  }

  protected insignia(tipo?: 'avisos' | 'conflictos'): number {
    if (tipo === 'avisos') return this.avisosSinLeer();
    return 0;
  }

  protected rutaPerfil(): string {
    return rutaPerfil(this.usuario()?.rol ?? 'ciudadano');
  }

  protected salir(): void {
    this.sesion.cerrar('Cerraste sesión. ¡Hasta pronto!');
  }
}
