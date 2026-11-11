# reniec-huanuco

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

Open http://localhost:14200. The Angular proxy sends `/api` to the API. For a fully native API on the host, change `web/proxy.conf.json` target to `http://127.0.0.1:18080`.

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

Abre http://localhost:14200. El proxy de Angular envía `/api` a la API. Si la API corre en el host, cambia el `target` de `web/proxy.conf.json` a `http://127.0.0.1:18080`.

### Variables de entorno

`.env` / `.env.example` en la raíz controlan puertos de Compose y credenciales de DB. Las variables de correo son placeholders (proveedor por definir).
