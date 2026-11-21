import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Icono } from '../icono/icono';
import { ToastService } from './toast.service';

const ICONO: Record<string, string> = { exito: 'check-circle', error: 'x-circle', info: 'info', advertencia: 'alert-triangle' };
const COLOR: Record<string, string> = { exito: '#5BD08A', error: '#FF8A8A', info: '#7CC4FF', advertencia: '#FFC27A' };

@Component({
  selector: 'app-toasts',
  imports: [Icono],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toasts" aria-live="polite" role="status">
      @for (t of servicio.lista(); track t.id) {
        <div class="toast">
          <app-icono [nombre]="icono[t.tipo]" [tam]="20" [style.color]="color[t.tipo]" />
          <span>{{ t.texto }}</span>
          <button type="button" (click)="servicio.cerrar(t.id)" aria-label="Cerrar aviso"><app-icono nombre="x" [tam]="16" /></button>
        </div>
      }
    </div>`,
  styles: `
    .toasts { position: fixed; right: 20px; bottom: 20px; z-index: 100; display: flex; flex-direction: column; gap: 10px; max-width: min(420px, calc(100vw - 32px)); }
    .toast { display: flex; align-items: center; gap: 12px; padding: 14px 14px 14px 16px; border-radius: 12px; background: #0A2342; color: #fff; font-size: 15px; font-weight: 600; box-shadow: 0 12px 32px rgba(0,0,0,.25); animation: entra .2s ease-out; }
    .toast span { flex: 1; }
    button { border: 0; background: none; color: #C9D6E8; cursor: pointer; width: 30px; height: 30px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; }
    button:hover { background: rgba(255,255,255,.1); }
    @keyframes entra { from { transform: translateY(8px); opacity: 0; } }
  `,
})
export class Toasts {
  protected readonly servicio = inject(ToastService);
  protected readonly icono = ICONO;
  protected readonly color = COLOR;
}
