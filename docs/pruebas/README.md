# Pruebas automáticas (Playwright)

Recorren la web en un navegador real y revisan reglas del negocio y que no haya errores en la consola.

| Archivo | Qué prueba | Resultado |
|---|---|---|
| `pruebas-fase1.cjs` | Épica 1: registro, ingreso, bloqueo por intentos, recuperar contraseña, Mi cuenta, eliminar cuenta, usuarios, clave temporal de operador y de ciudadano (también navegando por el menú), 404, celular | 57 de 57 correctas |
| `pruebas-fases2a4.cjs` | Épicas 2 a 5: reserva completa, reprogramar y cancelar, Mi turno, check-in (también el que llega tarde), panel + TV en vivo, repriorizar con motivo, agendas, trámites, avisos, integración, reportes (con filtro por ventanilla), Mi trámite, consentimiento, celular | 61 de 61 correctas |

Cómo ejecutarlas (con la web abierta en otra terminal con `npm start`), empezando en la raíz del repositorio:

```bash
cd docs/pruebas
npm install --no-save playwright      # se instala solo aquí; no crea package.json
npx playwright install chromium
node pruebas-fase1.cjs
node pruebas-fases2a4.cjs
```

No instales Playwright en la raíz del repositorio: crearía un `package.json` y un `node_modules/` que no deben subirse a GitHub.
Las capturas quedan en `docs/pruebas/capturas/` (Git las ignora). Cada prueba empieza borrando los datos del navegador, así que siempre parte de los datos de ejemplo.
