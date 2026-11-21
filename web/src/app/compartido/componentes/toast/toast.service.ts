import { Injectable, signal } from '@angular/core';

export type TipoToast = 'exito' | 'error' | 'info' | 'advertencia';
export interface Toast { id: number; tipo: TipoToast; texto: string; }

/** Avisos flotantes (toast) que se cierran solos a los 5 segundos. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private siguiente = 1;
  readonly lista = signal<Toast[]>([]);

  mostrar(texto: string, tipo: TipoToast = 'info', ms = 5000): void {
    const id = this.siguiente++;
    this.lista.update((l) => [...l, { id, tipo, texto }].slice(-3));
    setTimeout(() => this.cerrar(id), ms);
  }
  exito(texto: string) { this.mostrar(texto, 'exito'); }
  error(texto: string) { this.mostrar(texto, 'error'); }
  info(texto: string) { this.mostrar(texto, 'info'); }
  advertencia(texto: string) { this.mostrar(texto, 'advertencia'); }

  cerrar(id: number): void {
    this.lista.update((l) => l.filter((t) => t.id !== id));
  }
}
