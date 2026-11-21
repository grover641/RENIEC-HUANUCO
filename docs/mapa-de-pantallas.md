# Mapa de pantallas · ruta, épica e historia

Todas las pantallas están enlazadas a una de las 5 épicas y a sus historias de usuario (HU). No se agregaron HU nuevas: las pantallas extra del diseño entran en HU existentes.

| Ruta | Pantalla | Épica | HU | Quién entra |
|---|---|---|---|---|
| `/` | Inicio público | 1 | HU-15 / HU-16 | Todos |
| `/ingresar` | Ingresar (bloqueo tras 5 intentos, 15 min) | 1 | HU-16 | Invitado |
| `/registro` | Crear cuenta | 1 | HU-15 | Invitado |
| `/recuperar` · `/nueva-clave/:token` | Recuperar contraseña (enlace de 60 min, un solo uso) | 1 | HU-17 | Todos |
| `/buzon` | Buzón de correo de prueba (para ver el enlace) | 1 | HU-17 | Todos |
| `/403` · cualquier ruta inexistente | Acceso denegado · Página no encontrada | 1 | HU-16 | Todos |
| `/privacidad` | Política de privacidad (Ley N.º 29733) | 1 | HU-15 | Todos |
| `/ciudadano/inicio` | Mi inicio | 1 | HU-16 | Ciudadano |
| `/ciudadano/cuenta` | Mi cuenta y eliminar cuenta | 1 | HU-18 / HU-19 | Ciudadano |
| `/operador/perfil` | Perfil del operador (cambio obligatorio de clave temporal) | 1 | HU-18 / HU-20 | Operador |
| `/admin/usuarios` · `/admin/cuenta` | Gestión de usuarios · Mi perfil | 1 | HU-20 / HU-18 | Administrador |
| `/ciudadano/reservar` | Reservar cita en 3 pasos | 2 | HU-01 | Ciudadano |
| `/ciudadano/citas` | Mis citas: cancelar y reprogramar (regla de 24 h) | 2 | HU-07 | Ciudadano |
| `/admin/agendas` | Agendas y cupos (detecta cruces de franjas) | 2 | HU-10 | Administrador |
| `/admin/tramites` | Trámites (catálogo, duración, costo, requisitos) | 2 | HU-10 | Administrador |
| `/operador/check-in` | Check-in y emisión del turno (prioridad Ley N.º 28683) | 3 | HU-09 | Operador |
| `/operador/panel` | Panel de turnos: llamar, atendido, ausente, repriorizar con motivo | 3 | HU-02 / HU-06 | Operador |
| `/sala` | Pantalla de TV de la sala (se actualiza sola) | 3 | HU-02 | Todos |
| `/ciudadano/turno` | Mi turno (posición y tiempo estimado) | 3 | HU-05 | Ciudadano |
| `/consulta/turno` | Consulta pública de turno | 3 | HU-05 | Todos |
| `/ciudadano/avisos` | Mis avisos y consentimiento | 4 | HU-13 / HU-03 | Ciudadano |
| `/admin/avisos` | Avisos enviados (bitácora WhatsApp → SMS) | 4 | HU-03 | Administrador |
| `/ciudadano/tramite` | Mi trámite (estado del DNI) | 5 | HU-14 | Ciudadano |
| `/consulta/dni` | ¿Mi DNI está listo? (pública) | 5 | HU-14 | Todos |
| `/admin/integracion` | Integración y respaldo (modo local, sincronización, conflictos) | 5 | HU-04A / HU-04B / HU-14 | Administrador |
| `/admin/dashboard` | Dashboard (146 de 159 cupos) | 5 | HU-08 | Administrador |
| `/admin/reportes` | Reportes (PDF y Excel) | 5 | HU-08 | Administrador |

## Recorrido sugerido para la exposición
1. Ciudadano `41234578` / `Ciudadano2026!`: Reservar cita → Mis citas (reprogramar) → Mi turno → Mi trámite → Mis avisos.
2. Operadora `40871234` / `Operador2026!`: abre `/sala` en otra pestaña o TV, y en el Panel pulsa «Llamar siguiente»: la TV cambia sola. Check-in con `CR-4K7PQ`.
3. Administradora `42190876` / `Admin2026!`: Dashboard → Agendas → Integración («Simular caída de internet» y «Restablecer») → Reportes.
