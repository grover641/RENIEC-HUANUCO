import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Política de privacidad (Ley N.º 29733), enlazada desde el registro (HU-15). Texto de demostración. */
@Component({
  selector: 'app-privacidad',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="contenedor texto">
      <span class="etiqueta-seccion">Ley N.º 29733</span>
      <h1>Política de privacidad</h1>
      <p class="nota">Texto de ejemplo para un proyecto académico. No es la política oficial de RENIEC.</p>
      <h2>¿Qué datos usamos?</h2>
      <p>DNI, nombres, apellidos, correo y celular, solo para gestionar tus citas, tus turnos y los avisos que aceptaste recibir.</p>
      <h2>¿Cómo los protegemos?</h2>
      <p>El acceso es por rol, el DNI y el celular se muestran enmascarados (por ejemplo, 4123****) y las contraseñas se guardan cifradas.</p>
      <h2>Tus derechos</h2>
      <p>Puedes actualizar tus datos en «Mi cuenta», revocar el consentimiento de avisos en «Mis avisos» y eliminar tu cuenta cuando quieras. Al eliminarla, tus datos personales se anonimizan.</p>
      <h2 id="terminos">Términos y condiciones</h2>
      <p>La reserva es personal. Puedes reprogramar o cancelar hasta 24 horas antes. La atención preferente se aplica según la Ley N.º 28683.</p>
    </article>`,
  styles: `
    .texto { max-width: 820px; padding-top: 48px; padding-bottom: 64px; }
    h1 { margin: 8px 0 10px; } h2 { font-size: 20px; margin: 28px 0 8px; }
    p { color: var(--texto-3); font-size: 16px; }
    .nota { background: var(--advertencia-suave); color: var(--advertencia-texto); padding: 10px 14px; border-radius: 10px; font-size: 14px; }
  `,
})
export class Privacidad {}
