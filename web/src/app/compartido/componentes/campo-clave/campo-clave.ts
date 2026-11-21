import { ChangeDetectionStrategy, Component, input, model, signal } from '@angular/core';
import { Icono } from '../icono/icono';

/** Campo de contraseña con icono de candado y botón para ver u ocultar. */
@Component({
  selector: 'app-campo-clave',
  imports: [Icono],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="entrada-icono">
      @if (conIcono()) { <app-icono nombre="lock" [tam]="20" /> }
      <input class="entrada" [class.con-error]="conError()" [id]="idCampo()" [type]="visible() ? 'text' : 'password'"
        [placeholder]="placeholder()" [value]="valor()" (input)="valor.set($any($event.target).value)"
        [disabled]="deshabilitado()" [attr.autocomplete]="autocompletar()" [attr.aria-invalid]="conError() || null"
        [attr.aria-describedby]="describe() || null" [style.padding-left.px]="conIcono() ? null : 14" />
      <button type="button" class="ver-clave" (click)="visible.set(!visible())" [disabled]="deshabilitado()"
        [attr.aria-label]="visible() ? 'Ocultar contraseña' : 'Ver contraseña'">
        <app-icono [nombre]="visible() ? 'eye-off' : 'eye'" [tam]="20" />
      </button>
    </div>`,
})
export class CampoClave {
  readonly valor = model('');
  readonly idCampo = input('clave');
  readonly placeholder = input('Escribe tu contraseña');
  readonly conIcono = input(true);
  readonly conError = input(false);
  readonly deshabilitado = input(false);
  readonly autocompletar = input('current-password');
  readonly describe = input('');
  protected readonly visible = signal(false);
}
