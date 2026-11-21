# Árbol de carpetas detallado

Cada carpeta y archivo con lo que contiene. Las flechas (←) explican para qué sirve. Se omiten `node_modules/`, `dist/`, las fuentes `.woff2` y el interior de `api/` y `docker/` (base del profesor, sin cambios).

```
RENIEC-MODERNO/
├── api/   ← Base Laravel 13 del profesor (no se modificó)
├── docker/   ← Configuración Docker del profesor
├── docs/   ← Documentación técnica: árbol, mapa de pantallas y pruebas · Fase 4 · Cuya
│   └── pruebas/   ← Pruebas automáticas en el navegador (Playwright)
│       ├── pruebas-fase1.cjs   ← 57 pruebas de la Fase 1
│       └── pruebas-fases2a4.cjs   ← 61 pruebas de las Fases 2 a 4
├── web/   ← Frontend Angular 21 (la aplicación que se ve en el navegador)
│   ├── public/   ← Archivos que se copian tal cual: favicon, fuentes e ilustraciones
│   │   ├── fuentes/   ← Fuentes Inter y Nunito Sans (licencia OFL, sin depender de internet)
│   │   │   ├── LICENCIA-Inter-OFL.txt
│   │   │   └── LICENCIA-NunitoSans-OFL.txt
│   │   ├── img/   ← Ilustraciones propias (paisaje de Huánuco y mapa de la sede)
│   │   │   ├── huanuco-paisaje.svg
│   │   │   └── mapa-sede.svg
│   │   └── favicon.svg · favicon.ico · apple-touch-icon.png · icono-192.png · icono-512.png   ← íconos del logo propio
│   ├── src/   ← Código fuente
│   │   ├── app/   ← Aplicación
│   │   │   ├── compartido/   ← Componentes reutilizables por todas las épicas
│   │   │   │   └── componentes/
│   │   │   │       ├── campo-clave/   ← campo de contraseña con ojo
│   │   │   │       │   └── campo-clave.ts
│   │   │   │       ├── graficos/   ← gráficos de línea y barras en SVG
│   │   │   │       │   ├── grafico-barras.ts
│   │   │   │       │   └── grafico-linea.ts
│   │   │   │       ├── icono/
│   │   │   │       │   ├── icono.ts
│   │   │   │       │   └── iconos.ts   ← 97 iconos del kit
│   │   │   │       ├── logo/   ← logo propio: dos personas que forman el Puente Calicanto (no oficial)
│   │   │   │       │   └── logo.ts
│   │   │   │       ├── modal/   ← ventana modal accesible
│   │   │   │       │   └── modal.ts
│   │   │   │       ├── requisitos-clave/   ← requisitos de la contraseña
│   │   │   │       │   └── requisitos-clave.ts
│   │   │   │       └── toast/   ← avisos flotantes
│   │   │   │           ├── toast.service.ts
│   │   │   │           └── toasts.ts
│   │   │   ├── datos/   ← Datos de ejemplo del diseño (usuarios, trámites, citas, turnos)
│   │   │   │   └── semilla.ts   ← datos de ejemplo iguales al diseño
│   │   │   ├── epicas/   ← Una carpeta por épica del proyecto
│   │   │   │   ├── epica1-autenticacion/   ← Épica 1 · Registro y autenticación (HU-15, 16, 17, 18, 19, 20) · Fase 1 · Morales
│   │   │   │   │   ├── api/
│   │   │   │   │   │   ├── auth.api.ts   ← POST /auth/login, /register, /forgot… (bloqueo 5 intentos)
│   │   │   │   │   │   ├── perfil.api.ts   ← GET/PUT /me, DELETE /me
│   │   │   │   │   │   └── usuarios.api.ts   ← CRUD /admin/usuarios
│   │   │   │   │   ├── componentes/
│   │   │   │   │   │   └── tarjeta-ingreso/   ← formulario de ingreso
│   │   │   │   │   │       ├── tarjeta-ingreso.html
│   │   │   │   │   │       └── tarjeta-ingreso.ts
│   │   │   │   │   └── paginas/
│   │   │   │   │       ├── admin-usuarios/   ← Gestión de usuarios (HU-20)
│   │   │   │   │       │   ├── admin-usuarios.html
│   │   │   │   │       │   ├── admin-usuarios.scss
│   │   │   │   │       │   └── admin-usuarios.ts
│   │   │   │   │       ├── buzon-demo/   ← Buzón de correo de prueba (HU-17)
│   │   │   │   │       │   └── buzon-demo.ts
│   │   │   │   │       ├── errores/   ← 403 y 404 (HU-16)
│   │   │   │   │       │   └── pagina-error.ts
│   │   │   │   │       ├── ingresar/   ← Ingresar (HU-16)
│   │   │   │   │       │   └── ingresar.ts
│   │   │   │   │       ├── inicio/   ← Inicio público (HU-15/16)
│   │   │   │   │       │   ├── inicio.html
│   │   │   │   │       │   ├── inicio.scss
│   │   │   │   │       │   └── inicio.ts
│   │   │   │   │       ├── mi-cuenta/   ← Mi cuenta y eliminar cuenta (HU-18/19)
│   │   │   │   │       │   ├── mi-cuenta.html
│   │   │   │   │       │   └── mi-cuenta.ts
│   │   │   │   │       ├── mi-inicio/   ← Mi inicio del ciudadano
│   │   │   │   │       │   ├── mi-inicio.html
│   │   │   │   │       │   ├── mi-inicio.scss
│   │   │   │   │       │   └── mi-inicio.ts
│   │   │   │   │       ├── nueva-clave/   ← Nueva contraseña (HU-17)
│   │   │   │   │       │   └── nueva-clave.ts
│   │   │   │   │       ├── perfil-operador/   ← Perfil del operador (HU-18/20)
│   │   │   │   │       │   └── perfil-operador.ts
│   │   │   │   │       ├── privacidad/   ← Política de privacidad
│   │   │   │   │       │   └── privacidad.ts
│   │   │   │   │       ├── recuperar/   ← Recuperar contraseña (HU-17)
│   │   │   │   │       │   └── recuperar.ts
│   │   │   │   │       └── registro/   ← Crear cuenta (HU-15)
│   │   │   │   │           ├── registro.html
│   │   │   │   │           └── registro.ts
│   │   │   │   ├── epica2-reserva/   ← Épica 2 · Reserva y gestión de citas (HU-10, 01, 07) · Fase 2 · Chávez
│   │   │   │   │   ├── api/
│   │   │   │   │   │   ├── agendas.api.ts   ← franjas y cupos por ventanilla
│   │   │   │   │   │   ├── citas.api.ts   ← reservar, cancelar y reprogramar (regla 24 h)
│   │   │   │   │   │   └── tramites.api.ts   ← GET /tramites, PUT /admin/tramites
│   │   │   │   │   ├── componentes/
│   │   │   │   │   │   └── selector-horario/   ← calendario + horarios con cupos
│   │   │   │   │   │       ├── selector-horario.html
│   │   │   │   │   │       ├── selector-horario.scss
│   │   │   │   │   │       └── selector-horario.ts
│   │   │   │   │   ├── paginas/
│   │   │   │   │   │   ├── admin-agendas/   ← Agendas y cupos (HU-10)
│   │   │   │   │   │   │   ├── admin-agendas.html
│   │   │   │   │   │   │   ├── admin-agendas.scss
│   │   │   │   │   │   │   └── admin-agendas.ts
│   │   │   │   │   │   ├── admin-tramites/   ← Trámites (HU-10)
│   │   │   │   │   │   │   ├── admin-tramites.html
│   │   │   │   │   │   │   ├── admin-tramites.scss
│   │   │   │   │   │   │   └── admin-tramites.ts
│   │   │   │   │   │   ├── mis-citas/   ← Mis citas: cancelar y reprogramar (HU-07)
│   │   │   │   │   │   │   ├── mis-citas.html
│   │   │   │   │   │   │   ├── mis-citas.scss
│   │   │   │   │   │   │   └── mis-citas.ts
│   │   │   │   │   │   └── reservar/   ← Reservar cita en 3 pasos (HU-01)
│   │   │   │   │   │       ├── reservar.html
│   │   │   │   │   │       ├── reservar.scss
│   │   │   │   │   │       └── reservar.ts
│   │   │   │   │   └── README.md
│   │   │   │   ├── epica3-turnos/   ← Épica 3 · Turnos y atención en sede (HU-09, 02, 05, 06) · Fase 3 · Verde
│   │   │   │   │   ├── api/
│   │   │   │   │   │   └── turnos.api.ts   ← check-in, cola con prioridad (Ley 28683), llamar, ausente
│   │   │   │   │   ├── componentes/
│   │   │   │   │   │   └── tarjeta-turno/   ← tarjeta azul del turno
│   │   │   │   │   │       ├── tarjeta-turno.scss
│   │   │   │   │   │       └── tarjeta-turno.ts
│   │   │   │   │   ├── paginas/
│   │   │   │   │   │   ├── check-in/   ← Check-in y emisión del turno (HU-09)
│   │   │   │   │   │   │   ├── check-in.html
│   │   │   │   │   │   │   ├── check-in.scss
│   │   │   │   │   │   │   └── check-in.ts
│   │   │   │   │   │   ├── consulta-turno/   ← Consulta pública de turno (HU-05)
│   │   │   │   │   │   │   └── consulta-turno.ts
│   │   │   │   │   │   ├── mi-turno/   ← Mi turno (HU-05)
│   │   │   │   │   │   │   └── mi-turno.ts
│   │   │   │   │   │   ├── panel-turnos/   ← Panel del operador y modificación de turnos (HU-02/06)
│   │   │   │   │   │   │   ├── panel-turnos.html
│   │   │   │   │   │   │   ├── panel-turnos.scss
│   │   │   │   │   │   │   └── panel-turnos.ts
│   │   │   │   │   │   └── pantalla-sala/   ← Pantalla de TV de la sala (HU-02)
│   │   │   │   │   │       └── pantalla-sala.ts
│   │   │   │   │   └── README.md
│   │   │   │   ├── epica4-alertas/   ← Épica 4 · Alertas y notificaciones (HU-13, 03) · Fase 4 · Cuya
│   │   │   │   │   ├── api/
│   │   │   │   │   │   └── avisos.api.ts   ← WhatsApp → SMS, consentimiento, bitácora
│   │   │   │   │   ├── componentes/
│   │   │   │   │   │   └── avisos-de-cita/   ← avisos de una cita
│   │   │   │   │   │       └── avisos-de-cita.ts
│   │   │   │   │   ├── paginas/
│   │   │   │   │   │   ├── avisos-enviados/   ← Bitácora de avisos enviados (HU-03)
│   │   │   │   │   │   │   ├── avisos-enviados.html
│   │   │   │   │   │   │   └── avisos-enviados.ts
│   │   │   │   │   │   └── mis-avisos/   ← Mis avisos y consentimiento (HU-13/03)
│   │   │   │   │   │       ├── mis-avisos.html
│   │   │   │   │   │       ├── mis-avisos.scss
│   │   │   │   │   │       └── mis-avisos.ts
│   │   │   │   │   └── README.md
│   │   │   │   └── epica5-integracion/   ← Épica 5 · Integración y reportes (HU-14, 04A, 04B, 08) · Fase 4 · Cuya
│   │   │   │       ├── api/
│   │   │   │       │   ├── dni.api.ts   ← estado del DNI y consulta al sistema central
│   │   │   │       │   ├── integracion.api.ts   ← modo local, sincronización sin duplicados, conflictos
│   │   │   │       │   └── reportes.api.ts   ← indicadores y exportar Excel (CSV)
│   │   │   │       ├── componentes/
│   │   │   │       │   └── linea-dni/   ← línea de tiempo del DNI
│   │   │   │       │       └── linea-dni.ts
│   │   │   │       ├── paginas/
│   │   │   │       │   ├── consulta-dni/   ← ¿Mi DNI está listo? (HU-14)
│   │   │   │       │   │   └── consulta-dni.ts
│   │   │   │       │   ├── dashboard/   ← Dashboard (HU-08)
│   │   │   │       │   │   ├── dashboard.html
│   │   │   │       │   │   ├── dashboard.scss
│   │   │   │       │   │   └── dashboard.ts
│   │   │   │       │   ├── integracion/   ← Integración y respaldo (HU-04A/04B)
│   │   │   │       │   │   ├── integracion.html
│   │   │   │       │   │   ├── integracion.scss
│   │   │   │       │   │   └── integracion.ts
│   │   │   │       │   ├── mi-tramite/   ← Mi trámite (HU-14)
│   │   │   │       │   │   └── mi-tramite.ts
│   │   │   │       │   └── reportes/   ← Reportes PDF/Excel (HU-08)
│   │   │   │       │       ├── reportes.html
│   │   │   │       │       └── reportes.ts
│   │   │   │       └── README.md
│   │   │   ├── nucleo/   ← Lo que usa toda la app: modelos, API simulada, sesión y formatos
│   │   │   │   ├── api/   ← «Base de datos» en localStorage y errores de la API
│   │   │   │   │   ├── api-error.ts   ← error con código HTTP (401, 409, 423…)
│   │   │   │   │   └── base-datos.ts   ← lee/guarda en localStorage y avisa cambios entre pestañas
│   │   │   │   ├── sesion/   ← Sesión de 30 min y guardas por rol
│   │   │   │   │   ├── guardas.ts   ← quién puede entrar a cada ruta
│   │   │   │   │   └── sesion.service.ts   ← usuario actual y vencimiento a los 30 min
│   │   │   │   ├── utilidades/   ← Máscaras de DNI/celular/correo, fechas y soles
│   │   │   │   │   └── formato.ts   ← 4123****, 987 *** 321, fechas en español
│   │   │   │   └── modelos.ts   ← tipos: Usuario, Cita, Turno, Aviso…
│   │   │   ├── plantillas/   ← Marcos de página: pública, de acceso y de la aplicación
│   │   │   │   ├── acceso/   ← Marco de las pantallas de ingreso y registro
│   │   │   │   │   └── marco-acceso.ts
│   │   │   │   ├── app/   ← Barra superior + menú lateral según el rol
│   │   │   │   │   ├── menus.ts   ← opciones del menú por rol
│   │   │   │   │   ├── plantilla-app.html
│   │   │   │   │   ├── plantilla-app.scss
│   │   │   │   │   └── plantilla-app.ts
│   │   │   │   └── publica/   ← Encabezado y pie de las páginas públicas
│   │   │   │       ├── encabezado-publico.ts
│   │   │   │       ├── pie-publico.ts
│   │   │   │       └── plantilla-publica.ts
│   │   │   ├── app.config.ts   ← configuración: router sin zone.js
│   │   │   ├── app.html   ← router-outlet + avisos flotantes
│   │   │   ├── app.routes.ts   ← todas las rutas con guardas por rol
│   │   │   └── app.ts   ← componente raíz
│   │   ├── estilos/   ← Estilos globales: colores del kit, utilidades y componentes CSS
│   │   │   ├── _base.scss   ← rejillas, filas, contenedor
│   │   │   ├── _componentes.scss   ← botones, campos, interruptores, tarjetas, insignias, tablas
│   │   │   ├── _plantillas.scss   ← diseño de la app, fondo de acceso e impresión
│   │   │   └── _tokens.scss   ← colores y fuentes del kit
│   │   ├── index.html   ← página base (lang="es")
│   │   ├── main.ts   ← arranque de Angular
│   │   └── styles.scss   ← une los estilos globales
│   ├── README.md
│   ├── angular.json
│   ├── package.json
│   ├── proxy.conf.json
│   ├── tsconfig.app.json
│   ├── tsconfig.json
│   └── tsconfig.spec.json
├── README.md
└── compose.yaml   ← Docker: web 14200, api 18080, db 15432```

## Regla para crecer

- Toda pantalla nueva va en `web/src/app/epicas/epicaN-*/paginas/<pantalla>/` de la épica a la que pertenece.
- Lo que llama a la API va en `api/` de esa épica (un comentario indica el endpoint de Laravel que simula).
- Lo que usan dos o más épicas va en `compartido/` o `nucleo/`.
