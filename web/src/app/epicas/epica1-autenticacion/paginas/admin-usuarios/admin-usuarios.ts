import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Icono } from '../../../../compartido/componentes/icono/icono';
import { Modal } from '../../../../compartido/componentes/modal/modal';
import { ToastService } from '../../../../compartido/componentes/toast/toast.service';
import { camposDe, mensajeDe } from '../../../../nucleo/api/api-error';
import { Rol, UsuarioPublico } from '../../../../nucleo/modelos';
import { SesionService } from '../../../../nucleo/sesion/sesion.service';
import { enmascararCorreo, enmascararDni, haceCuanto, iniciales } from '../../../../nucleo/utilidades/formato';
import { SEDE } from '../../../../datos/semilla';
import { cambiarEstado, crearOperador, DatosOperador, editar, listar, restablecer } from '../../api/usuarios.api';

const POR_PAGINA = 8;
const VACIO: DatosOperador = { dni: '', nombres: '', apellidos: '', correo: '', celular: '', ventanilla: 1 };

/** HU-20 · «Gestión de usuarios» (T20.2) con la ventana «Nuevo operador». */
@Component({
  selector: 'app-admin-usuarios',
  imports: [Icono, Modal],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-usuarios.html',
  styleUrl: './admin-usuarios.scss',
})
export class AdminUsuarios {
  private readonly sesion = inject(SesionService);
  private readonly toast = inject(ToastService);

  protected readonly ventanillas = SEDE.ventanillas;
  protected readonly enmascararDni = enmascararDni;
  protected readonly enmascararCorreo = enmascararCorreo;
  protected readonly haceCuanto = haceCuanto;
  protected readonly iniciales = iniciales;

  protected readonly texto = signal('');
  protected readonly rol = signal<Rol | 'todos'>('todos');
  protected readonly pagina = signal(1);
  protected readonly usuarios = signal<UsuarioPublico[]>([]);
  protected readonly cargando = signal(true);

  protected readonly total = computed(() => this.usuarios().length);
  protected readonly paginas = computed(() => Math.max(1, Math.ceil(this.total() / POR_PAGINA)));
  protected readonly listaPaginas = computed(() => Array.from({ length: this.paginas() }, (_, i) => i + 1));
  protected readonly visibles =computed(() => this.usuarios().slice((this.pagina() - 1) * POR_PAGINA, this.pagina() * POR_PAGINA));

  // Ventana de alta o edición
  protected readonly formAbierto = signal(false);
  protected readonly editando = signal<UsuarioPublico | null>(null);
  protected readonly form = signal<DatosOperador>({ ...VACIO });
  protected readonly errores = signal<Record<string, string>>({});
  protected readonly guardando = signal(false);
  // Resultado con contraseña temporal
  protected readonly temporal = signal<{ nombre: string; correo: string; clave: string; nuevo: boolean } | null>(null);
  protected readonly porRestablecer = signal<UsuarioPublico | null>(null);

  protected readonly filtros: { valor: Rol | 'todos'; texto: string }[] = [
    { valor: 'todos', texto: 'Todos' }, { valor: 'ciudadano', texto: 'Ciudadanos' },
    { valor: 'operador', texto: 'Operadores' }, { valor: 'administrador', texto: 'Administradores' },
  ];

  constructor() { void this.cargar(); }

  protected async cargar(): Promise<void> {
    const t = this.sesion.token();
    if (!t) return;
    this.cargando.set(true);
    try {
      this.usuarios.set(await listar(t, this.texto(), this.rol()));
      if (this.pagina() > this.paginas()) this.pagina.set(1);
    } catch (e) {
      this.toast.error(mensajeDe(e));
    } finally {
      this.cargando.set(false);
    }
  }

  protected filtrar(rol: Rol | 'todos'): void { this.rol.set(rol); this.pagina.set(1); void this.cargar(); }
  protected buscar(v: string): void { this.texto.set(v); this.pagina.set(1); void this.cargar(); }

  protected esYo(u: UsuarioPublico): boolean { return u.id === this.sesion.usuario()?.id; }

  protected async alternar(u: UsuarioPublico): Promise<void> {
    const t = this.sesion.token();
    if (!t) return;
    try {
      const r = await cambiarEstado(t, u.id);
      if (r.rol === 'operador' && r.estado === 'activo' && !r.ventanilla) {
        this.toast.advertencia(`${r.nombres} ${r.apellidos} quedó activo, pero sin ventanilla. Asígnale una con «Editar».`);
      } else {
        this.toast.exito(`${r.nombres} ${r.apellidos} quedó ${r.estado}.`);
      }
      await this.cargar();
    } catch (e) { this.toast.error(mensajeDe(e)); await this.cargar(); } // recarga para que el interruptor vuelva a su estado real
  }

  protected abrirNuevo(): void {
    this.editando.set(null);
    this.form.set({ ...VACIO });
    this.errores.set({});
    this.formAbierto.set(true);
  }

  protected abrirEditar(u: UsuarioPublico): void {
    this.editando.set(u);
    this.form.set({ dni: u.dni, nombres: u.nombres, apellidos: u.apellidos, correo: u.correo, celular: u.celular, ventanilla: u.ventanilla });
    this.errores.set({});
    this.formAbierto.set(true);
  }

  protected poner(campo: keyof DatosOperador, valor: string): void {
    const v = campo === 'ventanilla' ? (valor === '' ? null : Number(valor)) : campo === 'dni' || campo === 'celular' ? valor.replace(/\D/g, '') : valor;
    this.form.update((f) => ({ ...f, [campo]: v }));
  }

  protected async guardar(ev: Event): Promise<void> {
    ev.preventDefault();
    const t = this.sesion.token();
    if (!t) return;
    this.guardando.set(true);
    try {
      const ed = this.editando();
      if (ed) {
        const u = await editar(t, ed.id, this.form());
        if (this.esYo(u)) this.sesion.actualizar(u);
        this.toast.exito('Los datos se guardaron.');
      } else {
        const r = await crearOperador(t, this.form());
        this.temporal.set({ nombre: `${r.usuario.nombres} ${r.usuario.apellidos}`, correo: r.usuario.correo, clave: r.temporal, nuevo: true });
      }
      this.formAbierto.set(false);
      await this.cargar();
    } catch (e) {
      this.errores.set(camposDe(e));
      if (!Object.keys(camposDe(e)).length) this.toast.error(mensajeDe(e));
    } finally {
      this.guardando.set(false);
    }
  }

  protected async confirmarRestablecer(): Promise<void> {
    const u = this.porRestablecer();
    const t = this.sesion.token();
    if (!u || !t) return;
    try {
      const r = await restablecer(t, u.id);
      this.porRestablecer.set(null);
      this.temporal.set({ nombre: `${r.usuario.nombres} ${r.usuario.apellidos}`, correo: r.usuario.correo, clave: r.temporal, nuevo: false });
    } catch (e) {
      this.porRestablecer.set(null);
      this.toast.error(mensajeDe(e));
    }
  }

  protected copiar(texto: string): void {
    navigator.clipboard?.writeText(texto).then(() => this.toast.info('Contraseña temporal copiada.'), () => {});
  }

  protected etiquetaRol(r: Rol): string { return { ciudadano: 'Ciudadano', operador: 'Operador', administrador: 'Administrador' }[r]; }
  protected claseRol(r: Rol): string { return { ciudadano: 'insignia-azul', operador: 'insignia-turquesa', administrador: 'insignia-guinda' }[r]; }
}
