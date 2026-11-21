import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icono } from '../../../../compartido/componentes/icono/icono';
import { bd, cambiosBd } from '../../../../nucleo/api/base-datos';
import { SesionService } from '../../../../nucleo/sesion/sesion.service';
import { enmascararCelular, enmascararDni, fechaCorta } from '../../../../nucleo/utilidades/formato';
import { misTramites } from '../../api/dni.api';
import { LineaDni } from '../../componentes/linea-dni/linea-dni';

/** HU-14 · «Mi trámite»: el ciudadano sigue su DNI sin ir a la sede (T14.4). */
@Component({
  selector: 'app-mi-tramite',
  imports: [RouterLink, Icono, LineaDni],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="encabezado-pagina"><div><h1>Mi trámite</h1><p>Sigue el estado de tu DNI desde que lo solicitas hasta que lo recibes.</p></div></div>
    @if (tramites()[0]; as t) {
      <div class="dos">
        <section class="tarjeta"><app-linea-dni [tramite]="t" [vertical]="true" /></section>
        <aside class="pila">
          <section class="tarjeta"><h3>Datos del trámite</h3>
            <dl><div><dt>DNI</dt><dd>{{ dni(t.dni) }}</dd></div><div><dt>Solicitado</dt><dd>{{ fecha(t.fechas.solicitado) }}</dd></div>
              <div><dt>Cita</dt><dd>{{ t.citaCodigo ?? '—' }}</dd></div><div><dt>Sede de recojo</dt><dd>Huánuco · V{{ t.ventanilla }}</dd></div></dl></section>
          @if (avisoListo()) {
            <section class="tarjeta aviso-env"><app-icono nombre="message" /><div><b>Aviso enviado</b>Te escribimos por {{ avisoListo()!.canal }} al {{ celular() }} cuando tu DNI quedó listo.</div></section>
          }
        </aside>
      </div>
      @if (tramites().length > 1) { <p class="texto-sm texto-2" style="margin-top:12px">Tienes {{ tramites().length - 1 }} trámite(s) anterior(es).</p> }
    } @else {
      <section class="tarjeta vacio">
        <span class="icono-caja verde" style="width:64px;height:64px"><app-icono nombre="id-card" [tam]="30" /></span>
        <b>Aún no tienes un trámite de DNI en curso</b>
        <p class="texto-3">Cuando te atiendan en ventanilla (por ejemplo, para renovar tu DNI), aquí verás cada paso: Solicitado, En proceso, Listo para recojo y Entregado.</p>
        <a class="btn btn-primario" routerLink="/ciudadano/citas">Ver mis citas</a>
      </section>
    }`,
  styles: `
    .dos { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 20px; align-items: start; }
    dl { margin: 12px 0 0; } dl div { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--borde); font-size: 14px; }
    dl div:last-child { border-bottom: 0; } dt { color: var(--texto-2); } dd { margin: 0; font-weight: 700; color: var(--titulo); }
    .aviso-env { display: flex; gap: 12px; font-size: 14px; color: var(--texto-3); } .aviso-env b { display: block; color: var(--titulo); } .aviso-env app-icono { color: var(--exito); flex-shrink: 0; }
    .vacio { display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center; max-width: 640px; margin: 0 auto; }
    @media (max-width: 1000px) { .dos { grid-template-columns: 1fr; } }
  `,
})
export class MiTramite {
  private readonly sesion = inject(SesionService);
  protected readonly tramites = computed(() => { cambiosBd(); const t = this.sesion.token(); return t ? misTramites(t) : []; });
  protected readonly celular = computed(() => enmascararCelular(this.sesion.usuario()?.celular ?? ''));
  protected readonly avisoListo = computed(() => { cambiosBd(); const u = this.sesion.usuario(); return u ? bd().avisos.find((a) => a.ciudadanoId === u.id && a.tipo === 'dni-listo' && (a.estado === 'enviado' || a.estado === 'reenviado-sms')) ?? null : null; });
  protected dni(d: string): string { return enmascararDni(d); }
  protected fecha(f?: string): string { return f ? fechaCorta(new Date(f)) : '—'; }
}
