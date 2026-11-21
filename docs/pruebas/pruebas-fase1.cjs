// Pruebas de la Fase 1 en el navegador (Playwright).
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://localhost:4200';
const OUT = process.env.OUT || require('path').join(__dirname, 'capturas');
const fs = require('fs'); fs.mkdirSync(OUT, { recursive: true });

let ok = 0, fail = 0; const errores = [];
function check(nombre, cond, extra = '') { if (cond) { ok++; console.log('  ✓', nombre); } else { fail++; console.log('  ✗', nombre, extra); } }

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()); });
  page.on('pageerror', (e) => errores.push(String(e)));
  const ir = async (ruta) => { await page.goto(BASE + ruta); await page.waitForLoadState('networkidle'); };
  const shot = async (n, full = true) => page.screenshot({ path: `${OUT}/${n}.png`, fullPage: full });
  const limpiar = async () => { await ir('/'); await page.evaluate(() => localStorage.clear()); await ir('/'); };
  const login = async (id, clave) => {
    await ir('/ingresar');
    await page.fill('#ing-id', id); await page.fill('#ing-clave', clave);
    await page.click('button[type=submit]'); await page.waitForTimeout(700);
  };
  const salir = async () => { await page.evaluate(() => localStorage.removeItem('citareniec_moderno_token')); await ir('/'); };

  console.log('1. Inicio');
  await limpiar();
  check('portada', await page.isVisible('text=Reserva tu cita en RENIEC Huánuco sin hacer cola'));
  check('6 trámites', (await page.locator('.tramite').count()) === 6);
  check('aviso académico', await page.isVisible('text=No es un sitio oficial de RENIEC'));
  check('precio renovación S/ 41.00', await page.isVisible('text=S/ 41.00'));
  check('foto y firma: Consultar en sede', await page.isVisible('text=Consultar en sede'));
  check('sin placeholders', !(await page.content()).includes('[N.º'));
  await shot('01_inicio_pc');
  await page.fill('#buscar-tramite', 'recojo'); await page.waitForTimeout(200);
  check('buscador filtra', (await page.locator('.tramite').count()) === 1);
  await page.click('.tramite'); await page.waitForTimeout(200);
  check('detalle del trámite', await page.isVisible('text=Requisitos'));
  await shot('02_detalle_tramite', false);
  await page.click('text=Reservar este trámite'); await page.waitForTimeout(500);
  check('reservar sin sesión → ingresar', page.url().includes('/ingresar'));

  console.log('2. Bloqueo por intentos (HU-16)');
  await limpiar();
  for (let i = 1; i <= 2; i++) await login('41234578', 'mala');
  check('error simple', await page.isVisible('text=No pudimos iniciar sesión'));
  await shot('03_login_error', false);
  await page.fill('#ing-clave', 'mala'); await page.click('button[type=submit]'); await page.waitForTimeout(700);
  check('te quedan 2 intentos', await page.isVisible('text=te quedan 2 intentos'));
  await shot('04_login_quedan', false);
  await page.fill('#ing-clave', 'mala'); await page.click('button[type=submit]'); await page.waitForTimeout(700);
  await page.fill('#ing-clave', 'mala'); await page.click('button[type=submit]'); await page.waitForTimeout(700);
  check('bloqueado 15 min', await page.isVisible('text=Cuenta bloqueada por 15 minutos'));
  await shot('05_login_bloqueado', false);
  await ir('/ingresar'); await page.fill('#ing-id', 'luis.ramos@gmail.com'); await page.waitForTimeout(200);
  check('bloqueo también con el correo', await page.isVisible('text=Cuenta bloqueada por 15 minutos'));

  console.log('3. Ciudadano');
  await limpiar();
  await login('41234578', 'Ciudadano2026!');
  check('va a Mi inicio', page.url().endsWith('/ciudadano/inicio'));
  check('saludo', await page.isVisible('text=Hola, Luis'));
  check('próxima cita CR-7F3K9', await page.isVisible('text=CR-7F3K9'));
  check('menú ciudadano', await page.isVisible('nav >> text=Mis avisos'));
  check('reloj de sesión', await page.isVisible('text=Sesión: 30:00') || await page.isVisible('text=Sesión: 29:'));
  await shot('06_mi_inicio');
  await ir('/admin/usuarios');
  check('vista ajena → 403', page.url().endsWith('/403') && await page.isVisible('text=Acceso denegado'));
  await shot('07_error_403', false);
  await ir('/ciudadano/cuenta');
  await page.fill('#mc-cel', '12345'); await page.click('text=Guardar cambios'); await page.waitForTimeout(600);
  check('celular inválido', await page.isVisible('text=El celular debe tener 9 dígitos'));
  await page.fill('#mc-cel', '987000111'); await page.click('text=Guardar cambios'); await page.waitForTimeout(600);
  check('contacto guardado', await page.isVisible('text=Tus datos de contacto se guardaron'));
  await page.fill('#mc-a', 'equivocada'); await page.fill('#mc-n', 'NuevaClave1'); await page.fill('#mc-c', 'NuevaClave1');
  await page.click('text=Actualizar contraseña'); await page.waitForTimeout(600);
  check('clave actual incorrecta', await page.isVisible('text=La contraseña actual es incorrecta'));
  await shot('08_mi_cuenta');
  await ir('/ciudadano/reservar');
  check('reservar ya es real (paso 1)', await page.isVisible('text=Paso 1 de 3'));

  console.log('4. Registro (HU-15)');
  await salir(); await ir('/registro');
  await page.fill('#r-dni', '41234578'); await page.fill('#r-cel', '98765432'); await page.fill('#r-correo', 'mal@correo');
  await page.click('button[type=submit]'); await page.waitForTimeout(700);
  check('resumen de errores', await page.isVisible('text=marcados en rojo'));
  check('DNI ya registrado', await page.isVisible('text=Este DNI ya está registrado'));
  await shot('09_registro_errores');
  await ir('/registro');
  await page.fill('#r-dni', '48889999'); await page.fill('#r-cel', '955444333'); await page.fill('#r-nom', 'Ana Lucía');
  await page.fill('#r-ape', 'Torres Ruiz'); await page.fill('#r-correo', 'ana.torres@correo.pe');
  await page.fill('#r-clave', 'MiClave2026'); await page.fill('#r-conf', 'MiClave2026');
  await page.check('input[type=checkbox]'); await page.click('button[type=submit]'); await page.waitForTimeout(900);
  check('cuenta creada → Mi inicio', page.url().endsWith('/ciudadano/inicio') && await page.isVisible('text=Hola, Ana'));
  check('sin citas', await page.isVisible('text=Aún no tienes citas'));

  console.log('5. Eliminar cuenta (HU-19)');
  await ir('/ciudadano/cuenta');
  await page.click('text=Eliminar mi cuenta'); await page.fill('#baja-clave', 'otra'); await page.click('text=Sí, eliminar mi cuenta'); await page.waitForTimeout(600);
  check('clave errónea no elimina', await page.isVisible('text=La cuenta no se eliminó'));
  await shot('10_eliminar_cuenta', false);
  await page.fill('#baja-clave', 'MiClave2026'); await page.click('text=Sí, eliminar mi cuenta'); await page.waitForTimeout(900);
  check('cuenta eliminada → ingresar', page.url().includes('/ingresar'));
  await login('48889999', 'MiClave2026');
  check('ya no puede ingresar', page.url().includes('/ingresar'));

  console.log('6. Recuperar contraseña (HU-17)');
  await ir('/recuperar');
  await page.fill('#rec-correo', 'luis.ramos@gmail.com'); await page.click('button[type=submit]'); await page.waitForTimeout(700);
  check('enlace enviado', await page.isVisible('text=Te enviamos un enlace') && await page.isVisible('text=l***@gmail.com'));
  await shot('11_recuperar_enviado', false);
  await page.click('text=Abrir el buzón de prueba'); await page.waitForTimeout(300);
  await page.click('text=Crear nueva contraseña'); await page.waitForTimeout(400);
  check('nueva contraseña', await page.isVisible('text=Crea tu nueva contraseña'));
  const enlace = page.url();
  await page.fill('#nc-1', 'ClaveNueva26'); await page.fill('#nc-2', 'ClaveNueva26');
  await shot('12_nueva_clave', false);
  await page.click('text=Guardar contraseña'); await page.waitForTimeout(800);
  check('clave cambiada → ingresar', page.url().includes('/ingresar'));
  await page.goto(enlace); await page.waitForTimeout(400);
  check('enlace usado = vencido', await page.isVisible('text=Este enlace ya no sirve'));
  await login('luis.ramos@gmail.com', 'ClaveNueva26');
  check('ingresa con la nueva', page.url().endsWith('/ciudadano/inicio'));

  console.log('7. Administrador (HU-20)');
  await salir(); await login('42190876', 'Admin2026!');
  check('admin → dashboard', page.url().endsWith('/admin/dashboard')); await ir('/admin/usuarios');
  check('8 usuarios (la cuenta eliminada no se lista)', (await page.locator('tbody tr').count()) === 8, String(await page.locator('tbody tr').count()));
  await shot('13_admin_usuarios');
  await page.click('button.pastilla:has-text("Operadores")'); await page.waitForTimeout(400);
  check('filtro operadores = 4', (await page.locator('tbody tr').count()) === 4);
  check('3 ventanillas en la lista', (await page.locator('td:text-is("V1"), td:text-is("V2"), td:text-is("V3")').count()) === 3);
  await page.click('text=Nuevo operador'); await page.waitForTimeout(300);
  check('select con 3 ventanillas', (await page.locator('#u-ven option').count()) === 3);
  await page.fill('#u-dni', '4590123'); await page.click('button[form=form-usuario]'); await page.waitForTimeout(600);
  check('DNI de 7 dígitos', await page.isVisible('text=El DNI debe tener 8 dígitos'));
  await shot('14_nuevo_operador', false);
  await page.fill('#u-dni', '45901234'); await page.fill('#u-nom', 'Sofía'); await page.fill('#u-ape', 'Ramírez Lino');
  await page.fill('#u-correo', 'sofia.ramirez@sede.demo'); await page.selectOption('#u-ven', '3');
  await page.click('button[form=form-usuario]'); await page.waitForTimeout(800);
  check('operador creado con clave temporal', await page.isVisible('text=Operador creado'));
  const temporal = (await page.locator('.clave-temporal .mono').innerText()).trim();
  await page.click('text=Entendido');
  // desactivar a Jorge
  const filaJorge = page.locator('tr', { hasText: 'Jorge Paredes' });
  await filaJorge.locator('.interruptor span').click(); await page.waitForTimeout(600);
  check('Jorge desactivado', await filaJorge.locator('text=Inactivo').isVisible());
  // restablecer la contraseña de una ciudadana (Lucía): también debe cambiarla al ingresar
  await page.click('button.pastilla:has-text("Todos")'); await page.waitForTimeout(400);
  await page.locator('tr', { hasText: 'Lucía' }).locator('button[title="Restablecer contraseña"]').click(); await page.waitForTimeout(200);
  await page.click('text=Sí, restablecer'); await page.waitForTimeout(800);
  const temporalLucia = (await page.locator('.clave-temporal .mono').innerText()).trim();
  check('clave de ciudadana restablecida', /^Tmp-/.test(temporalLucia), temporalLucia);
  await page.click('text=Entendido');

  console.log('8. Operador con contraseña temporal');
  await salir(); await login('45901234', temporal);
  check('primer ingreso → Mi perfil', page.url().endsWith('/operador/perfil') && await page.isVisible('text=Primer ingreso'));
  await ir('/operador/panel');
  check('no puede ir al panel sin cambiar', page.url().endsWith('/operador/perfil'));
  await page.click('.app-lateral >> text=Check-in'); await page.waitForTimeout(500);
  check('tampoco al check-in desde el menú', page.url().endsWith('/operador/perfil'));
  await page.fill('#po-a', temporal); await page.fill('#po-n', 'Sofia2026!'); await page.fill('#po-c', 'Sofia2026!');
  await shot('15_perfil_operador');
  await page.click('text=Guardar y continuar'); await page.waitForTimeout(900);
  check('luego va al panel', page.url().endsWith('/operador/panel') && await page.isVisible('text=Llamar siguiente'));
  await salir(); await login('43710245', 'Operador2026!');
  check('operador desactivado no ingresa', await page.isVisible('text=desactivada'));
  await salir(); await login('43710245', 'otraClave1');
  check('clave errónea no revela que la cuenta está desactivada', !(await page.isVisible('text=desactivada')) && await page.isVisible('text=No pudimos iniciar sesión'));

  console.log('8b. Ciudadana con contraseña restablecida');
  await salir(); await login('46880452', temporalLucia);
  check('clave temporal → Mi cuenta', page.url().endsWith('/ciudadano/cuenta') && await page.isVisible('text=Cambia tu contraseña temporal'));
  await ir('/ciudadano/reservar');
  check('no puede reservar sin cambiarla', page.url().endsWith('/ciudadano/cuenta'));
  await page.click('.app-lateral >> text=Mis citas'); await page.waitForTimeout(500);
  check('tampoco desde el menú (sin recargar)', page.url().endsWith('/ciudadano/cuenta'));
  await page.fill('#mc-a', temporalLucia); await page.fill('#mc-n', 'Lucia2026!'); await page.fill('#mc-c', 'Lucia2026!');
  await page.click('text=Actualizar contraseña'); await page.waitForTimeout(900);
  check('luego va a Mi inicio', page.url().endsWith('/ciudadano/inicio'));

  console.log('9. 404 y móvil');
  await ir('/no-existe');
  check('404', await page.isVisible('text=No encontramos esta página'));
  await shot('16_error_404', false);
  await page.setViewportSize({ width: 390, height: 844 });
  await limpiar(); await shot('17_inicio_celular');
  await ir('/ingresar'); await shot('18_login_celular', false);
  await login('41234578', 'Ciudadano2026!'); await shot('19_mi_inicio_celular');
  const ancho = await page.evaluate(() => document.documentElement.scrollWidth);
  check('sin scroll horizontal en celular', ancho <= 390, String(ancho));

  check('sin errores en consola', errores.length === 0, errores.slice(0, 3).join(' | '));
  console.log(`\nResultado: ${ok} correctas, ${fail} fallidas`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
