# 03: Tasks del proyecto

**ID:** 03-tasks

**Objetivo:** Trabajo visible dentro de un proyecto: CRUD de Task más cambio
de estado open/done.

**Comportamiento observable:** crear, listar dentro del proyecto, cambiar
estado, editar y eliminar una Task. Crear una Task sin proyecto se rechaza
(regla no-huérfanos).

**Blocked by:** 02-projects.

**Status:** done

**Seams:** 1 (Task bajo el agregado Project), 2 (validación Zod).

**Tests esperados:** ciclo de vida, transición open/done, rechazo de huérfana,
todo a nivel comportamiento.

**Referencias:** spec stories 6–8, Domain rules; CONTEXT.md (Task); ADR-0002.

- [x] CRUD + open/done de Task funciona bajo un proyecto
- [x] Task sin proyecto es rechazada, no almacenada
- [x] Validación Zod en cada mutación

## Comments

### Cierre 2026-09-21 (TDD + code review; verificación con DB pendiente del usuario)

**Implementación (TDD, slices rojo→verde):** `db/schema.ts` (tabla `tasks`
con `project_id NOT NULL` + FK `ON DELETE no action` — sin cascada, Ticket 06;
migración `drizzle/0001_tasks.sql`); `lib/tasks/validation.ts` (seam 2:
create estricto solo-`title`, update `title`/`status` con ≥1 campo, `status`
enum `open`/`done`, título 1–200); `lib/tasks/repository.ts` (seam 1:
`TaskRepository` scoped por `projectId` vía `owned()`, `create` devuelve
`null` sin proyecto, violación FK 23503 mapeada a `null`);
API anidada `GET/POST /api/projects/[id]/tasks` +
`GET/PATCH/DELETE /api/projects/[id]/tasks/[taskId]`
(helpers reutilizados `isUuid`/`notFound`/`validationError`; cross-project y
desconocido → 404); UI en `/projects/[id]` (alta, toggle open/done, editar
título, eliminar).

**Tests:** `tests/tasks.validation.test.ts` (11, frontera incl. strict),
`tests/tasks.api-id.test.ts` (2, ids malformados → 404 sin DB),
`tests/tasks.repository.test.ts` (8, ciclo de vida + open/done + huérfana +
cross-project, con DB). Verde en sandbox: `typecheck`, `next build` y
24 tests independientes de DB. `tasks.repository.test.ts` (8) +
`projects.repository.test.ts` (7) + `health.smoke.test.ts` (2) requieren DB
viva: rojo honesto en sandbox (ECONNREFUSED), pendientes de verificación
externa.

**Code review (dos ejes, sub-agentes en paralelo, sobre working tree):**
- *Spec:* completo y conforme, cero scope creep (FK sin cascada; sin
  Activity ni tablas/event logs; sin Decisions/Docs; sin auth/plugins/deploy/
  integraciones/IA). 2 menores aplicados: `updateTaskSchema` sin `.strict()`
  (fix + test) y carrera check-then-insert devolviendo 500 en vez de `null`
  (fix: FK 23503 → `null`; sin cobertura en sandbox, se verifica con DB).
- *Standards:* 0 violaciones duras. 3 smells posibles: alias
  `isProjectId = isUuid` eliminado (ruta `[id]` migrada a `isUuid`);
  guardia `isUuid→notFound` duplicada en 2 rutas — se deja (1 línea, abstraer
  params distintos acoplaría); `status` TEXT en DB con concepto solo en Zod —
  aceptado (el seam 2 es dueño del concepto por diseño).

**Para verificación externa (con DB viva, en orden):**
`docker compose up -d` → `npm run db:push` → `npm test` (suite completa verde)
→ `npm run dev` → en un proyecto: crear/listar/toggle open-done/editar/
eliminar tasks; crear task con título vacío (→ 400).
