// Pruebas de las épicas 2 a 5 en el navegador (Playwright), recorriendo el flujo completo.
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://localhost:4200';
const OUT = process.env.OUT || require('path').join(__dirname, 'capturas');
require('fs').mkdirSync(OUT, { recursive: true });
let ok = 0, fail = 0; const errores = [];
const check = (n, c, x = '') => { if (c) { ok++; console.log('  ✓', n); } else { fail++; console.log('  ✗', n, x); } };

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()); });
  page.on('pageerror', (e) => errores.push(String(e)));
  const ir = async (r) => { await page.goto(BASE + r); await page.waitForLoadState('networkidle'); await page.waitForTimeout(250); };
  const shot = (n, full = true) => page.screenshot({ path: `${OUT}/${n}.png`, fullPage: full });
  const texto = async () => page.locator('body').innerText();
  const login = async (id, clave) => { await ir('/ingresar'); await page.fill('#ing-id', id); await page.fill('#ing-clave', clave); await page.click('button[type=submit]'); await page.waitForTimeout(800); };
  const salir = async () => { await page.evaluate(() => localStorage.removeItem('citareniec_moderno_token')); await ir('/'); };

  await ir('/'); await page.evaluate(() => localStorage.clear()); await ir('/');

  console.log('Épica 2 · Reserva (ciudadano)');
  await login('41234578', 'Ciudadano2026!');
  check('Mi inicio: cita de hoy CR-7F3K9', (await texto()).includes('CR-7F3K9'));
  check('regla de 24 h en Mi inicio', (await texto()).includes('Faltan menos de 24 horas'));
  await ir('/ciudadano/reservar');
  check('catálogo con 6 trámites', (await page.locator('.producto').count()) === 6);
  check('pestaña Todos 6', (await page.locator('.pastilla', { hasText: 'Todos' }).innerText()).includes('6'));
  await shot('01_reservar_paso1');
  await page.locator('.producto', { hasText: 'Duplicado de DNI' }).locator('text=Ver detalle').click(); await page.waitForTimeout(200);
  check('detalle con requisitos', (await texto()).includes('Indicar el motivo'));
  await page.click('text=Reservar este trámite'); await page.waitForTimeout(300);
  check('paso 2', (await texto()).includes('Paso 2 de 3'));
  const dias = page.locator('button.dia:not([disabled])');
  check('hay días con cupos', (await dias.count()) > 0);
  await dias.nth(2).click(); await page.waitForTimeout(300);
  const horas = page.locator('button.hora:not([disabled])');
  check('hay horarios con cupos', (await horas.count()) > 0);
  await horas.first().click();
  await shot('02_reservar_paso2');
  await page.click('aside >> text=Continuar'); await page.waitForTimeout(300);
  check('paso 3 con «Qué debes llevar»', (await texto()).includes('Qué debes llevar'));
  await shot('03_reservar_paso3');
  await page.click('aside >> text=Confirmar cita'); await page.waitForTimeout(1100);
  const t1 = await texto();
  check('cita confirmada', t1.includes('¡Tu cita está confirmada!'));
  const codigo = (await page.locator('.codigo b').innerText()).trim();
  check('código CR-XXXXX', /^CR-[A-Z0-9]{5}$/.test(codigo), codigo);
  check('aviso por WhatsApp', t1.includes('Te enviamos la confirmación por WhatsApp'));
  await shot('04_cita_confirmada');

  console.log('Épica 2 · Mis citas (HU-07)');
  await ir('/ciudadano/citas');
  check('nueva cita en próximas', (await texto()).includes(codigo));
  check('4 pasadas', (await texto()).includes('Pasadas (4)'));
  const filaHoy = page.locator('article.cita', { hasText: 'CR-7F3K9' });
  check('cita de hoy no se puede cancelar', await filaHoy.locator('button:has-text("Cancelar")').isDisabled());
  await shot('05_mis_citas');
  const filaNueva = page.locator('article.cita', { hasText: codigo });
  await filaNueva.locator('button:has-text("Reprogramar")').click(); await page.waitForTimeout(300);
  await page.locator('app-modal button.dia:not([disabled])').nth(3).click(); await page.waitForTimeout(250);
  await page.locator('app-modal button.hora:not([disabled])').last().click();
  await page.click('text=Confirmar nuevo horario'); await page.waitForTimeout(900);
  check('reprogramada con nuevo código', (await texto()).includes('Tu nueva cita es'));
  await page.locator('article.cita', { hasText: 'CR-2H8QD' }).locator('button:has-text("Cancelar")').click();
  await page.click('text=Sí, cancelar'); await page.waitForTimeout(700);
  check('CR-2H8QD cancelada', (await texto()).includes('Cancelaste la cita CR-2H8QD'));

  console.log('Épica 3 · Mi turno (ciudadano y público)');
  await ir('/ciudadano/turno');
  check('Mi turno A-015', (await page.locator('.numero').innerText()).includes('A-015'));
  check('3 personas delante', (await page.locator('.dato b').first().innerText()).trim() === '3');
  await shot('06_mi_turno');
  await salir();
  await ir('/consulta/turno?codigo=CR-7F3K9');
  check('consulta pública por código de cita', (await texto()).includes('A-015'));
  await shot('07_consulta_turno');
  await ir('/consulta/dni?dni=46880452'); await page.waitForTimeout(700);
  check('DNI listo (pública)', (await texto()).includes('¡Tu DNI ya está listo!'));
  await shot('08_consulta_dni');

  console.log('Épica 3 · Operador');
  await login('40871234', 'Operador2026!');
  check('va al panel', page.url().endsWith('/operador/panel'));
  check('turno actual A-013', (await page.locator('.actual .numero').innerText()).includes('A-013'));
  check('7 en cola', (await texto()).includes('Cola de espera (7)'));
  const primera = await page.locator('tbody tr').first().innerText();
  check('preferente primero (A-018 gestante)', primera.includes('A-018') && primera.includes('Gestante'));
  await shot('09_panel_turnos');
  // pantalla de sala en otra pestaña
  const tv = await ctx.newPage();
  await tv.goto(BASE + '/sala'); await tv.waitForTimeout(500);
  check('TV muestra A-013', (await tv.locator('.numero').innerText()).includes('A-013'));
  await page.click('text=Llamar siguiente'); await page.waitForTimeout(900);
  check('ahora atiende A-018', (await page.locator('.actual .numero').innerText()).includes('A-018'));
  await tv.waitForTimeout(800);
  check('TV se actualiza sola: A-018 → Ventanilla 2', (await tv.locator('.numero').innerText()).includes('A-018') && (await tv.locator('.ventanilla').innerText()).includes('2'));
  await tv.screenshot({ path: `${OUT}/10_pantalla_sala.png` });
  // repriorizar sin motivo y con motivo
  await page.locator('tr', { hasText: 'A-016' }).locator('text=Repriorizar').click(); await page.waitForTimeout(200);
  await page.click('button.opcion:has-text("Persona con discapacidad")');
  await page.click('text=Guardar y reordenar cola'); await page.waitForTimeout(500);
  check('sin motivo → bloqueado', (await texto()).includes('Escribe el motivo para continuar'));
  await page.fill('#rp-mot', 'Presenta carné del CONADIS en ventanilla.');
  await page.click('text=Guardar y reordenar cola'); await page.waitForTimeout(600);
  check('cola reordenada', (await texto()).includes('Cola reordenada'));
  // check-in
  await ir('/operador/check-in');
  await page.fill('#ci-q', 'CR-4K7PQ'); await page.click('button:has-text("Buscar")'); await page.waitForTimeout(300);
  check('cita encontrada dentro del horario', (await texto()).includes('Dentro del horario'));
  await page.click('button.opcion:has-text("Adulto mayor")');
  await shot('11_check_in');
  await page.click('text=Emitir turno'); await page.waitForTimeout(700);
  check('turno emitido A-021', (await page.locator('.emitido .numero').innerText()).includes('A-021'));
  await page.click('text=Siguiente check-in');
  await page.fill('#ci-q', 'CR-4M2T8'); await page.click('button:has-text("Buscar")'); await page.waitForTimeout(300);
  check('llegó tarde → fuera de horario', (await texto()).includes('Fuera de horario'));
  await page.click('text=Atender por orden de llegada'); await page.click('text=Emitir turno'); await page.waitForTimeout(700);
  const tardio = (await page.locator('.emitido .numero').innerText()).trim();
  await ir('/operador/panel');
  const colaNums = await page.locator('.cola tbody tr td:first-child b').allInnerTexts();
  check('llegó tarde → va al final de la cola', colaNums[colaNums.length - 1] === tardio, colaNums.join(' '));
  check('la cola marca «Llegó tarde»', (await texto()).includes('Llegó tarde'));
  await ir('/operador/check-in');
  await page.fill('#ci-q', '40512345'); await page.click('button:has-text("Buscar")'); await page.waitForTimeout(300);
  check('sin cita → orden de llegada', (await texto()).includes('Atención por orden de llegada'));
  // atender hasta Luis
  await ir('/operador/panel');
  for (let i = 0; i < 8; i++) {
    if ((await page.locator('.actual .numero').innerText()).includes('A-015')) break;
    await page.click('text=Llamar siguiente'); await page.waitForTimeout(700);
  }
  check('llamó a Luis A-015', (await page.locator('.actual .numero').innerText()).includes('A-015'));
  await page.click('button:has-text("Atendido")'); await page.waitForTimeout(600);
  await tv.close();

  console.log('Épica 5 · Administración');
  await salir(); await login('42190876', 'Admin2026!');
  check('admin → dashboard', page.url().endsWith('/admin/dashboard'));
  const td = await texto();
  check('146 de 159 cupos', td.includes('146') && td.includes('de 159 cupos ofertados'));
  check('espera 18 min y 72 %', td.includes('18 min') && td.includes('72 %'));
  check('insignia de 2 conflictos', (await page.locator('.contador.naranja').innerText()).trim() === '2');
  await shot('12_dashboard');
  await ir('/admin/agendas');
  check('cruce detectado en la franja por defecto', (await texto()).includes('La franja se cruza'));
  await shot('13_agendas');
  await page.locator('.col').nth(3).locator('.bloque.recojo').click(); await page.waitForTimeout(200);
  await page.click('text=Eliminar franja'); await page.waitForTimeout(500);
  const tAg = await texto();
  check('franja de recojo eliminada', tAg.includes('Franja eliminada'), tAg.slice(0, 0));
  await page.selectOption('#ag-dia', '4'); await page.fill('#ag-ini', '12:00'); await page.fill('#ag-fin', '13:00'); await page.fill('#ag-cup', '2');
  await page.waitForTimeout(200);
  await page.click('text=Guardar franja'); await page.waitForTimeout(600);
  check('nueva franja guardada', (await texto()).includes('Franja guardada'));
  await ir('/admin/tramites');
  await page.click('text=Nuevo trámite'); await page.fill('#tr-nom', 'Constancia de inscripción'); await page.fill('#tr-desc', 'Constancia de tus datos registrados.');
  await page.fill('.req input', 'Presentar tu DNI.'); await page.click('text=Guardar cambios'); await page.waitForTimeout(600);
  check('trámite nuevo guardado', (await texto()).includes('se guardó'));
  await shot('14_tramites');
  await ir('/admin/avisos');
  check('bitácora con filas', (await page.locator('tbody tr').count()) >= 5);
  await page.click('button.pastilla:has-text("Falló")'); await page.waitForTimeout(200);
  check('filtro Falló', (await page.locator('tbody tr').count()) >= 1 && !(await page.locator('tbody').innerText()).includes('Reenviado por SMS'));
  await shot('15_avisos_enviados');
  await ir('/admin/integracion');
  await page.click('text=Simular caída de internet'); await page.waitForTimeout(600);
  check('modo local activo', (await texto()).includes('Restablecer conexión'));
  await page.click('text=Restablecer conexión y sincronizar'); await page.waitForTimeout(1300);
  check('sincronizado', (await texto()).includes('Conexión restablecida'));
  await page.locator('.conflicto').first().locator('text=Usar dato local').click(); await page.waitForTimeout(600);
  check('conflicto resuelto (queda 1)', (await texto()).includes('Conflictos para resolver (1)'));
  await page.click('text=Consultar estados de DNI'); await page.waitForTimeout(1100);
  await page.click('text=Consultar estados de DNI'); await page.waitForTimeout(1100);
  check('estados de DNI actualizados', (await texto()).includes('cambiaron de estado') || (await texto()).includes('Sin cambios'));
  await shot('16_integracion');
  await ir('/admin/reportes'); await page.waitForTimeout(600);
  const tr = await texto();
  check('reporte 21 min y 70 %', tr.includes('21 min') && tr.includes('70 %'));
  check('2 684 turnos', tr.includes('2684') || tr.includes('2 684'));
  await page.selectOption('#r-v', '1'); await page.click('text=Aplicar'); await page.waitForTimeout(600);
  check('filtro Ventanilla 1 → 905 atendidos', (await page.locator('.kpi').nth(3).innerText()).includes('905'));
  await page.selectOption('#r-v', ''); await page.click('text=Aplicar'); await page.waitForTimeout(600);
  await shot('17_reportes');
  await page.fill('#r-desde', '2025-01-01'); await page.fill('#r-hasta', '2025-02-01'); await page.click('text=Aplicar'); await page.waitForTimeout(600);
  check('rango sin datos', (await texto()).includes('Sin datos'));

  console.log('Épica 4 y 5 · vuelve el ciudadano');
  await salir(); await login('41234578', 'Ciudadano2026!');
  await ir('/ciudadano/tramite');
  check('Mi trámite: Renovación listo para recojo', (await texto()).includes('Renovación de DNI') && (await texto()).includes('¡Tu DNI ya está listo!'));
  await shot('18_mi_tramite');
  await ir('/ciudadano/avisos');
  check('aviso DNI listo recibido', (await texto()).includes('DNI listo'));
  await shot('19_mis_avisos');
  for (const c of ['WhatsApp', 'SMS']) {
    if (await page.locator(`input[aria-label="Avisos por ${c}"]`).isChecked()) { await page.locator(`.interruptor:has(input[aria-label="Avisos por ${c}"]) > span`).click(); await page.waitForTimeout(500); }
  }
  check('consentimiento revocado', (await texto()).includes('Retiraste tu consentimiento'));

  console.log('Celular');
  await page.setViewportSize({ width: 390, height: 844 });
  for (const [r, n] of [['/ciudadano/reservar', '20_reservar_celular'], ['/ciudadano/turno', '21_mi_turno_celular']]) {
    await ir(r); await shot(n);
    const w = await page.evaluate(() => document.documentElement.scrollWidth);
    check(`sin scroll horizontal ${r}`, w <= 390, String(w));
  }
  await salir(); await login('40871234', 'Operador2026!'); await ir('/operador/panel'); await shot('22_panel_celular');
  check('sin errores en consola', errores.length === 0, errores.slice(0, 3).join(' | '));
  console.log(`\nResultado: ${ok} correctas, ${fail} fallidas`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
