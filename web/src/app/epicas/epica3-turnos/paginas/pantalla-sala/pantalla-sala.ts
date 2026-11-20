import { ChangeDetectionStrategy, Component, OnDestroy, computed, signal } from '@angular/core';
import { Logo } from '../../../../compartido/componentes/logo/logo';
import { Icono } from '../../../../compartido/componentes/icono/icono';
import { cambiosBd } from '../../../../nucleo/api/base-datos';
import { fechaLarga, hora } from '../../../../nucleo/utilidades/formato';
import { ultimosLlamados } from '../../api/turnos.api';

/**
 * Pantalla de sala de espera (TV), incluida en T02.3 · HU-02: es la otra cara de «Llamar siguiente».
 * Se abre en otra pestaña o en el televisor de la sala y se actualiza sola cuando el operador llama un turno.
 */
@Component({
  selector: 'app-pantalla-sala',
  imports: [Logo, Icono],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tv">
      <header>
        <div class="marca"><app-logo [tam]="44" [oscuro]="true" /><span class="sede">Oficina Regional Huánuco</span></div>
        <div class="reloj"><span>{{ fecha() }}</span><b>{{ horaActual() }}</b></div>
      </header>
      <main>
        <section class="llamado" [class.destello]="destello()">
          @if (actual(); as a) {
            <span class="et">Turno llamado</span>
            <b class="numero">{{ a.numero }}</b>
            <p class="ventanilla"><span class="flecha">→</span>Ventanilla {{ a.ventanilla }}</p>
            <span class="pastilla-dni">Acérquese con su DNI</span>
          } @else {
            <span class="et">Bienvenido</span>
            <b class="numero chico">Pronto llamaremos al primer turno</b>
          }
        </section>
        <aside>
          <h2>Últimos llamados</h2>
          @for (t of anteriores(); track t.id) {
            <div class="previo"><b>{{ t.numero }}</b><span>Ventanilla<b>{{ t.ventanilla }}</b></span></div>
          } @empty { <p class="vacio">Aún no hay llamados.</p> }
        </aside>
      </main>
      <footer><app-icono nombre="info" [tam]="26" />Bienvenido · Ten a la mano tu código de cita o tu DNI · Atención preferente por ley (Ley N.º 28683)
        <button type="button" class="completa" (click)="pantallaCompleta()" aria-label="Pantalla completa"><app-icono nombre="monitor" [tam]="20" /></button></footer>
    </div>`,
  styles: `
    :host { display: block; }
    .tv { min-height: 100vh; background: #0A2342; color: #fff; display: flex; flex-direction: column; font-family: var(--fuente); }
    header { display: flex; justify-content: space-between; align-items: center; padding: 22px 36px; gap: 20px; flex-wrap: wrap; }
    .marca { display: flex; align-items: center; gap: 22px; }
    .sede { font-size: 24px; font-weight: 700; padding-left: 22px; border-left: 2px solid rgba(255,255,255,.25); }
    .reloj { display: flex; align-items: center; gap: 18px; text-align: right; }
    .reloj span { font-size: 18px; color: #C9D6E8; max-width: 220px; }
    .reloj b { font-family: var(--fuente-titulo); font-size: 56px; font-weight: 900; font-variant-numeric: tabular-nums; }
    main { flex: 1; display: grid; grid-template-columns: minmax(0, 1.7fr) minmax(280px, 1fr); gap: 28px; padding: 0 36px 28px; }
    .llamado { background: #0B4F9C; border: 3px solid #4C86CF; border-radius: 26px; padding: 34px 44px; display: flex; flex-direction: column; justify-content: center; }
    .llamado.destello { animation: destello 1s ease-in-out 3; }
    @keyframes destello { 50% { background: #1A64BA; box-shadow: 0 0 0 12px rgba(255,255,255,.15); } }
    .et { font-size: 30px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; color: #DCE6F5; }
    .numero { font-family: var(--fuente-titulo); font-weight: 900; font-size: clamp(110px, 16vw, 230px); line-height: .95; white-space: nowrap; }
    .numero.chico { font-size: 52px; line-height: 1.2; white-space: normal; }
    .ventanilla { font-family: var(--fuente-titulo); font-weight: 900; font-size: clamp(54px, 7vw, 96px); display: flex; align-items: center; gap: 22px; margin: 8px 0 18px; }
    .flecha { color: #FF8FAE; }
    .pastilla-dni { align-self: flex-start; background: #fff; color: #0A2342; border-radius: 999px; padding: 10px 26px; font-size: 26px; font-weight: 800; }
    aside h2 { color: #fff; font-family: var(--fuente-titulo); font-size: 32px; margin-bottom: 16px; }
    .previo { display: flex; align-items: center; justify-content: space-between; background: #112F57; border-radius: 16px; padding: 14px 24px; margin-bottom: 12px; }
    .previo > b { font-family: var(--fuente-titulo); font-weight: 900; font-size: 56px; }
    .previo span { text-align: right; font-size: 20px; color: #C9D6E8; display: flex; flex-direction: column; }
    .previo span b { font-family: var(--fuente-titulo); font-size: 40px; color: #fff; line-height: 1; }
    .vacio { color: #C9D6E8; font-size: 20px; }
    footer { background: #B0123E; display: flex; align-items: center; gap: 16px; padding: 18px 36px; font-size: 24px; font-weight: 700; }
    .completa { margin-left: auto; background: rgba(255,255,255,.15); border: 0; color: #fff; width: 44px; height: 44px; border-radius: 10px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; }
    @media (max-width: 900px) { main { grid-template-columns: 1fr; } footer { font-size: 17px; } }
  `,
})
export class PantallaSala implements OnDestroy {
  protected readonly ahora = signal(new Date());
  private readonly reloj = setInterval(() => this.ahora.set(new Date()), 1000);
  private ultimoVisto = 0;
  protected readonly destello = signal(false);

  protected readonly fecha = computed(() => fechaLarga(this.ahora()).replace(/ de (\d{4})$/, ' de $1'));
  protected readonly horaActual = computed(() => hora(this.ahora()));
  protected readonly llamados = computed(() => {
    cambiosBd();
    const lista = ultimosLlamados(5);
    const ultimo = lista[0]?.llamado ?? 0;
    if (ultimo && ultimo !== this.ultimoVisto) {
      this.ultimoVisto = ultimo;
      queueMicrotask(() => { this.destello.set(true); setTimeout(() => this.destello.set(false), 3200); });
    }
    return lista;
  });
  protected readonly actual = computed(() => this.llamados()[0] ?? null);
  protected readonly anteriores = computed(() => this.llamados().slice(1, 5));

  ngOnDestroy(): void { clearInterval(this.reloj); }

  protected pantallaCompleta(): void {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.();
  }
}
