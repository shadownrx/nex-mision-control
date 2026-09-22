# 08: Verificación MVP de punta a punta

**ID:** 08-mvp-verify

**Objetivo:** Cerrar el MVP: vista conjunta del proyecto y arranque local
documentado, con todo verde.

**Comportamiento observable:** ver un proyecto con sus tasks, decisions, docs
y activity juntos; levantar todo localmente con el set documentado de
comandos; suite completa verde; nada fuera del spec (sin auth, plugins,
deploy ni integraciones).

**Blocked by:** 06-cascade-delete, 07-activity-feed.

**Status:** done

**Seams:** verificación sobre los 4 seams ya establecidos, sin seams nuevos.

**Tests esperados:** suite completa Vitest en verde; recorrido observable
crear → usar → ver-feed → borrar sin huérfanos.

**Referencias:** spec stories 3 y 15, Testing Decisions, Out of Scope;
ADR-0001 y ADR-0002.

- [x] Vista conjunta proyecto + hijos + feed funciona
- [x] Arranque local en comandos documentados, sin deploy target
- [x] Suite verde; out-of-scope intacto

## Comments

### Cierre 2026-09-21 (verificación con DB viva + TDD + code review)

**Verificación técnica (base PostgreSQL 18 local en 127.0.0.1:5432,
credenciales `nex`, base `nex`; `docker compose up -d` bloqueado en sandbox
por el socket Docker —limitación del entorno, no fallo—; el schema aplicado
es el mismo que Compose levantaría con `postgres:16-alpine`):**

- `npm run db:push` → `[✓] Changes applied`.
- `npm run typecheck` → verde (`tsc --noEmit`).
- `npm test` (sin flags) → **20 archivos, 90 tests, todo verde**.
- `npm run build` → verde, las 12 rutas (`/api/health`, `/api/projects`,
  `/api/projects/[id]`, `/activity`, `/decisions`, `/docs`, `/tasks` y
  detalle `/projects/[id]`).
- `npm run dev` / `next start` no levantan en este sandbox: Next.js muere en
  `uv_interface_addresses` (el entorno bloquea enumerar interfaces de red;
  limitación ya registrada en el Ticket 01). Tampoco se pudo hacer `curl`
  contra servidor local (el proxy del sandbox deniega HTTP a 127.0.0.1;
  no se rodeó). El recorrido HTTP/click queda para verificación externa;
  todo lo que ese recorrido invoca está cubierto por tests con DB viva.

**Defecto real encontrado y corregido (cambio mínimo, solo config):**
`npm test` en paralelo fallaba 12–15 tests con distintos archivos en cada
corrida (`setup: X create returned null`). Diagnóstico (loop de
diagnosing-bugs): suite en paralelo = rojo, misma suite con
`--maxWorkers=1` = 89/89 verde; archivos DB-dependientes corren en workers
paralelos sobre una sola base y cada `beforeEach` borra tablas que otro
archivo está usando. Hipótesis alternativas falsadas (pool agotado,
timing, schema ausente). Fix: `fileParallelism: false` en
`vitest.config.ts` con comentario de causa. Sin cambios de comportamiento.

**Verificación funcional E2E (20 pasos):** nuevo `tests/mvp-verify.test.ts`
(recorrido crear → usar → ver-feed → borrar sin huérfanos a nivel
repositorios + derivación, el seam que UI/API usan): Project crear/listar/
ver/renombrar; Task crear/open→done→open/editar/borrar + rechazo de título
vacío (ZodError); Decision completa, rechazo de incompleta, edición en
activa, supersesión con enlace, inmutabilidad de la superseded
(`DecisionImmutableError` en update y remove); Documentation crear/editar/
borrar (una sobrevive hasta la cascada para el feed); feed con
`project:created`, `decision:created`, `decision:superseded`,
`documentation:created`, `task:created+updated`, en orden
inverso-cronológico; borrado del Project → hijos eliminados, cero huérfanos
(`SELECT` directo en las 4 tablas), feed `[]`.

**Verificación de arquitectura (grep, vigente):** persistencia solo vía
repositorios (única excepción documentada: `/api/health` usa `checkDb()`,
probe aceptado desde el Ticket 01; `lib/*/validation` solo re-exporta tipos
type-only); Zod `.parse()` dentro de cada mutación de los 4 repositorios;
cero tablas de activity en schema/migraciones y cero writes en
`lib/activity/` + API; `ON DELETE CASCADE` en las 3 FKs hijas;
`DecisionImmutableError` + `status`/`supersededBy` en decisiones; cero
rastros de auth/plugins/IA/integraciones.

**Verificación de UX (estática, sin rediseño):** `app/projects/[id]/page.tsx`
carga proyecto + tasks + decisions + docs + activity juntos y refresca el
feed tras cada mutación; la sección Activity solo hace GET y mapea items
(read-only, sin POST/PATCH/DELETE).

**Reviews:** Spec (parciales documentados: boot local y vista conjunta se
verifican por corrida/estática, no por test; list/update y cobertura del
feed se agregaron al test) y Standards (0 violaciones duras; aplicados:
comentario sin conteo que se pudre, cobertura extra en el test). Sin scope
creep: cero features, cero cambios de arquitectura.

**Limitaciones del entorno (no fallos):** sin Docker, sin `dev`/`start`,
sin `curl` local en sandbox. Nada quedó marcado como verificado sin
comprobarse: lo no comprobable aquí (click-through en navegador) usa los
mismos endpoints y repos ya verdes con DB viva.
