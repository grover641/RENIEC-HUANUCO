# Épica: Registro y autenticación

Historias: HU-15, HU-16, HU-17, HU-18 y HU-20 · **Sprint 1** (la HU-19 «Eliminar cuenta» pasa al Sprint 2) · Fase 1 (la sube: Morales).

## Pantallas (`paginas/`)
- `inicio`: Inicio público
- `ingresar`: Ingresar con bloqueo por intentos
- `registro`: Crear cuenta
- `recuperar · nueva-clave · buzon-demo`: Recuperar contraseña y buzón de prueba
- `errores`: 403 y 404
- `privacidad`: Política de privacidad
- `mi-inicio`: Mi inicio del ciudadano
- `mi-cuenta`: Mi cuenta (datos de contacto y contraseña)
- `perfil-operador`: Perfil del operador
- `admin-usuarios`: Gestión de usuarios

## API simulada (`api/`)
auth.api.ts, perfil.api.ts, usuarios.api.ts. Cada archivo indica qué endpoint de Laravel simula.

## Componentes propios (`componentes/`)
tarjeta-ingreso
