import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Icono } from '../../../../compartido/componentes/icono/icono';
import { Modal } from '../../../../compartido/componentes/modal/modal';
import { SesionService } from '../../../../nucleo/sesion/sesion.service';
import { Tramite } from '../../../../nucleo/modelos';
import { soles } from '../../../../nucleo/utilidades/formato';
import { SEDE } from '../../../../datos/semilla';
import { bd } from '../../../../nucleo/api/base-datos';
import { TarjetaIngreso } from '../../componentes/tarjeta-ingreso/tarjeta-ingreso';

/**
 * Página de Inicio pública (incluida en T15.3 · HU-15): portada con buscador y tarjeta de ingreso,
 * trámites más solicitados, «¿Cómo funciona?», consultas rápidas, sede y canales de atención.
 */
@Component({
  selector: 'app-inicio',
  imports: [RouterLink, Icono, Modal, TarjetaIngreso],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './inicio.html',
  styleUrl: './inicio.scss',
})
export class Inicio {
  private readonly router = inject(Router);
  protected readonly sesion = inject(SesionService);
  protected readonly sede = SEDE;
  protected readonly soles = soles;

  protected readonly busqueda = signal('');
  protected readonly detalle = signal<Tramite | null>(null);

  protected readonly tramites = computed(() => {
    const t = normalizar(this.busqueda());
    const lista = bd().tramites.filter((x) => x.publicado);
    return t ? lista.filter((x) => normalizar(x.nombre + ' ' + x.descripcion + ' ' + x.categoria).includes(t)) : lista;
  });

  protected readonly pasos = [
    { n: '01', icono: 'calendar-plus', titulo: 'Reserva', texto: 'Elige tu trámite, el día y la hora desde tu celular o tu computadora.' },
    { n: '02', icono: 'map-pin', titulo: 'Llega', texto: 'Ven 10 minutos antes y haz check-in con tu código de cita o tu DNI.' },
    { n: '03', icono: 'ticket', titulo: 'Sigue tu turno', texto: 'Mira en vivo cuántas personas faltan y a qué ventanilla debes ir.' },
    { n: '04', icono: 'bell', titulo: 'Recibe avisos', texto: 'Confirmación, recordatorio 24 h antes y aviso de «DNI listo» por WhatsApp o SMS.' },
  ];

  protected readonly canales = [
    { icono: 'smartphone', titulo: 'Web y celular', texto: 'Reserva y consulta a cualquier hora.' },
    { icono: 'message', titulo: 'WhatsApp', texto: `${SEDE.whatsapp} · avisos y consultas.` },
    { icono: 'phone', titulo: 'Teléfono', texto: `${SEDE.telefono} · lunes a viernes.` },
    { icono: 'building', titulo: 'Presencial', texto: 'Módulo de orientación en la sede.' },
  ];

  protected buscar(ev?: Event): void {
    ev?.preventDefault();
    document.getElementById('tramites')?.scrollIntoView({ behavior: 'smooth' });
  }

  protected elegirRapido(texto: string): void {
    this.busqueda.set(texto);
    this.buscar();
  }

  protected reservar(t: Tramite): void {
    this.detalle.set(null);
    this.router.navigate(['/registro']); // la reserva llega en el Sprint 3: primero se crea la cuenta
  }

  protected irA(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }
}

function normalizar(t: string): string {
  return t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
}
