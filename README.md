# RENIEC-MODERNO · CitaRENIEC Huánuco

> **Rama `morales-sprints-epica1`: la Épica 1 organizada por sprints.**
> Muestra solo la Épica 1 (Autenticación y gestión de usuarios), separada según el plan de sprints de Jira.
> Cada sprint es un commit con su etiqueta, para ver cómo quedó la web al cierre de cada uno.
>
> | Sprint | Fechas | Historias | Etiqueta |
> |---|---|---|---|
> | Sprint 1 | 26/10 – 06/11/2026 | HU-15 Registro · HU-16 Ingreso y acceso por rol · HU-17 Recuperar contraseña · HU-18 Perfil · HU-20 Gestión de usuarios | `sprint-1` |
> | Sprint 2 | 09/11 – 20/11/2026 | HU-19 Eliminar cuenta (no se terminó en el Sprint 1) | `sprint-2` |
>
> Las épicas 2 a 5 están en `main`, donde se unen todas las partes. Esta rama es solo para revisar la Épica 1 y no se une a `main`.

Web de **citas, turnos digitales y avisos** para la Oficina Regional de RENIEC Huánuco.
Proyecto académico del curso **Gestión de Proyectos II** (Universidad de Huánuco), Grupo G1 «Equipo Maravilla».
**No es un sitio oficial de RENIEC.**

| Integrante | Rol Scrum |
|---|---|
| Cuya Vargas, Joan Bradley | Product Owner |
| Morales Durand, Jhon Arnold | Scrum Master |
| Verde Inocencio, Stibhen Jherark | Developer (backend) |
| Chavez Figueredo, Grover | Developer (frontend) |

Alcance: 5 épicas · 19 historias de usuario · 93 SP · 78 tareas · 357 h · Sprint 0 + 8 sprints.

## Cómo verlo funcionando (para la clase)

El frontend (`web/`, Angular 21) trae una **API simulada en el navegador**, así que funciona sin Docker, PHP ni base de datos:

```bash
cd web
npm install
npm start
```

Abre **http://localhost:4200** (con Docker, `docker compose up --build` → http://localhost:14200).

### Usuarios de prueba

| Rol | DNI o correo | Contraseña |
|---|---|---|
| Ciudadano | `41234578` · luis.ramos@gmail.com | `Ciudadano2026!` |
| Operadora (ventanilla 2) | `40871234` · carmen.soto@sede.demo | `Operador2026!` |
| Administradora | `42190876` · rosa.huaman@sede.demo | `Admin2026!` |

Los datos se guardan en el navegador. Para volver a los datos de ejemplo, borra los datos del sitio
(o en la consola del navegador: `localStorage.clear()` y recarga).

## Estructura

```
RENIEC-MODERNO/
├── web/                  Frontend Angular (lo construido por el equipo)
│   └── src/
│       ├── estilos/      colores, tipografía y componentes visuales del kit de diseño
│       └── app/
│           ├── nucleo/       modelos, API simulada base, sesión y guardas por rol
│           ├── datos/        datos de ejemplo
│           ├── compartido/   icono, logo, modal, avisos (toast), campo de contraseña
│           ├── plantillas/   pública, de acceso y de la aplicación (menú por rol)
│           └── epicas/
│               ├── epica1-autenticacion/   HU-15 a HU-20
│               ├── epica2-reserva/         HU-10, HU-01, HU-07
│               ├── epica3-turnos/          HU-09, HU-02, HU-05, HU-06
│               ├── epica4-alertas/         HU-13, HU-03
│               └── epica5-integracion/     HU-14, HU-04A, HU-04B, HU-08
├── api/                  Base Laravel 13 del profesor (API REST con PostgreSQL)
├── docker/ · compose.yaml  Entorno con Docker del profesor
├── docs/                 Árbol detallado, mapa de pantallas y pruebas
```

Cada archivo de `web/src/app/epicas/*/api/` indica qué endpoint de Laravel simula (por ejemplo `POST /api/v1/auth/login`),
para reemplazarlo luego por la API real de `api/` sin cambiar las pantallas.

## Avance por fases

| Fase | Épicas | Estado |
|---|---|---|
| 1 | Base + páginas públicas + Épica 1 (registro, ingreso con bloqueo, recuperar contraseña, Mi cuenta, eliminar cuenta, gestión de usuarios) | ✅ Lista · Morales |
| 2 | Épica 2 (catálogo de trámites, reserva en 3 pasos, Mis citas, agendas y cupos) | ✅ Lista · Chávez |
| 3 | Épica 3 (check-in, panel del operador, Mi turno, pantalla de sala) | ✅ Lista · Verde |
| 4 | Épicas 4 y 5 (avisos, Mi trámite, dashboard, reportes, integración) + `docs/` | ✅ Lista · Cuya |

Probado con 118 pruebas automáticas en el navegador (`docs/pruebas/`). Árbol carpeta por carpeta: `docs/arbol-de-carpetas.md`.

---

# Entorno de desarrollo (base del profesor)

Local development stack for **CitaRENIEC Huánuco**: Laravel API (`api/`), Angular SPA (`web/`), and PostgreSQL.

## English

### Requirements

- Docker Desktop with Compose V2 (`docker compose version`)
- Optional (native run): PHP 8.4+, Composer 2, Node 22+, PostgreSQL 16.15 (or use only the `db` service)

### Ports

| Service | URL / host port |
|---------|-----------------|
| Web (Angular) | http://localhost:14200 |
| API (Laravel) | http://localhost:18080 |
| PostgreSQL | localhost:15432 |

### Run with Docker (recommended)

```bash
cp .env.example .env
docker compose up --build
```

Stop:

```bash
docker compose down
```

Useful commands:

```bash
docker compose up -d --build   # detached
docker compose logs -f api     # API logs
docker compose exec api php artisan migrate
```

Compose wires `DB_HOST=db` inside the API container. App code lives in `api/` and `web/` and is mounted as volumes.

### Run natively (without Docker for api/web)

1. Start PostgreSQL (native **or** only the DB container):

```bash
docker compose up -d db
```

2. Backend:

```bash
cd api
cp .env.example .env
# set APP_KEY if empty: php artisan key:generate
composer install
php artisan serve --host=127.0.0.1 --port=18080
```

`.env.example` points to `127.0.0.1:15432` with user `reniec` / db `reniec_huanuco` / password `reniec_dev`.

3. Frontend (another terminal):

```bash
cd web
npm install
npm start
```

Open http://localhost:4200 (port 14200 is only used with Docker). The Angular proxy sends `/api` to the API. For a fully native API on the host, change `web/proxy.conf.json` target to `http://127.0.0.1:18080`.

### Environment

Root `.env` / `.env.example` control Compose ports and DB credentials. Mail variables are placeholders (provider TBD).

---

## Español

### Requisitos

- Docker Desktop con Compose V2 (`docker compose version`)
- Opcional (nativo): PHP 8.4+, Composer 2, Node 22+, PostgreSQL 16.15 (o solo el servicio `db`)

### Puertos

| Servicio | URL / puerto host |
|----------|-------------------|
| Web (Angular) | http://localhost:14200 |
| API (Laravel) | http://localhost:18080 |
| PostgreSQL | localhost:15432 |

### Con Docker (recomendado)

```bash
cp .env.example .env
docker compose up --build
```

Detener:

```bash
docker compose down
```

Comandos útiles:

```bash
docker compose up -d --build
docker compose logs -f api
docker compose exec api php artisan migrate
```

Dentro del contenedor API, `DB_HOST=db`. El código en `api/` y `web/` se monta como volúmenes.

### Nativo (sin Docker para api/web)

1. Levantar PostgreSQL (nativo **o** solo el contenedor DB):

```bash
docker compose up -d db
```

2. Backend:

```bash
cd api
cp .env.example .env
# si APP_KEY está vacío: php artisan key:generate
composer install
php artisan serve --host=127.0.0.1 --port=18080
```

3. Frontend (otra terminal):

```bash
cd web
npm install
npm start
```

Abre http://localhost:4200 (el puerto 14200 solo se usa con Docker). El proxy de Angular envía `/api` a la API. Si la API corre en el host, cambia el `target` de `web/proxy.conf.json` a `http://127.0.0.1:18080`.

### Variables de entorno

`.env` / `.env.example` en la raíz controlan puertos de Compose y credenciales de DB. Las variables de correo son placeholders (proveedor por definir).
