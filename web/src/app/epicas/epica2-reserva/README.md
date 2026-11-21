# Épica: Reserva y gestión de citas

Historias: HU-10, HU-01, HU-07 · **Fase 2** (la sube: Chávez).

## Pantallas (`paginas/`)
- `reservar`: Reservar cita en 3 pasos (HU-01)
- `mis-citas`: Mis citas: cancelar y reprogramar con la regla de 24 h (HU-07)
- `admin-agendas`: Agendas y cupos por ventanilla, con aviso de cruces (HU-10)
- `admin-tramites`: Catálogo de trámites (HU-10)

## API simulada (`api/`)
tramites.api.ts, agendas.api.ts, citas.api.ts. Cada archivo indica qué endpoint de Laravel simula.

## Componentes propios (`componentes/`)
selector-horario (calendario + horarios con cupos)
