import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icono } from '../../../../compartido/componentes/icono/icono';
import { ToastService } from '../../../../compartido/componentes/toast/toast.service';
import { mensajeDe } from '../../../../nucleo/api/api-error';
import { bd } from '../../../../nucleo/api/base-datos';
import { Prioridad, Turno } from '../../../../nucleo/modelos';
import { SesionService } from '../../../../nucleo/sesion/sesion.service';
import { diaSemana, enmascararDni, hora, mesCorto } from '../../../../nucleo/utilidades/formato';
import { catalogo } from '../../../epica2-reserva/api/tramites.api';
import { buscarCita, emitirTurno, ETIQUETA_PRIORIDAD, ResultadoBusqueda, TOLERANCIA_MIN } from '../../api/turnos.api';

/** HU-09 · Check-in: busca la cita por código o DNI, marca la atención preferente y emite el turno (T09.4). */
@Component({
  selector: 'app-check-in',
  imports: [RouterLink, Icono],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './check-in.html',
  styleUrl: './check-in.scss',
})
export class CheckIn {
  private readonly sesion = inject(SesionService);
  private readonly toast = inject(ToastService);
  protected readonly enmascararDni = enmascararDni;
  protected readonly etiqueta = ETIQUETA_PRIORIDAD;
  protected readonly tolerancia = TOLERANCIA_MIN;
  protected readonly tramites = catalogo();
  protected readonly opciones: { v: Prioridad; texto: string; icono: string }[] = [
    { v: null, texto: 'General', icono: 'user' }, { v: 'gestante', texto: 'Gestante', icono: 'heart' },
    { v: 'adulto-mayor', texto: 'Adulto mayor', icono: 'cane' }, { v: 'discapacidad', texto: 'Persona con discapacidad', icono: 'accessibility' },
  ];

  protected readonly texto = signal('');
  protected readonly resultado = signal<ResultadoBusqueda | null>(null);
  protected readonly error = signal('');
  protected readonly prioridad = signal<Prioridad>(null);
  protected readonly emitido = signal<Turno | null>(null);
  protected readonly ocupado = signal(false);
  protected readonly sinCitaTramite = signal('recojo');
  protected readonly sinCitaNombre = signal('');
  protected readonly permitirTarde = signal(false);
  protected readonly cabecera = computed(() => { const d = new Date(); return `${diaSemana(d)[0].toUpperCase() + diaSemana(d).slice(1)} ${d.getDate()} de ${mesCorto(d).toLowerCase()} · ${hora(d)}`; });

  protected tramite(id: string): string { return bd().tramites.find((t) => t.id === id)?.nombre ?? id; }
  protected duracion(id: string): number { return bd().tramites.find((t) => t.id === id)?.duracionMin ?? 15; }

  protected buscar(ev?: Event): void {
    ev?.preventDefault();
    const t = this.sesion.token();
    if (!t) return;
    this.error.set(''); this.emitido.set(null); this.prioridad.set(null); this.permitirTarde.set(false);
    try { this.resultado.set(buscarCita(t, this.texto())); }
    catch (e) { this.resultado.set(null); this.error.set(mensajeDe(e)); }
  }

  protected async emitir(): Promise<void> {
    const t = this.sesion.token();
    const r = this.resultado();
    if (!t || !r || this.ocupado()) return;
    this.ocupado.set(true);
    try {
      const turno = r.tipo === 'cita'
        ? await emitirTurno(t, r.cita.id, this.prioridad())
        : await emitirTurno(t, null, this.prioridad(), { dni: r.dni, tramiteId: this.sinCitaTramite(), nombre: this.sinCitaNombre().trim() || 'Ciudadano sin cita' });
      this.emitido.set(turno);
      this.resultado.set(null);
      this.texto.set('');
      this.toast.exito(`Turno ${turno.numero} emitido para la Ventanilla ${turno.ventanilla}.`);
    } catch (e) { this.toast.error(mensajeDe(e)); }
    finally { this.ocupado.set(false); }
  }

  protected probar(codigo: string): void { this.texto.set(codigo); this.buscar(); }
}
