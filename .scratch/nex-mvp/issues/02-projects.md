# 02: Projects CRUD con seams de persistencia y validación

**ID:** 02-projects

**Objetivo:** Ciclo de vida mínimo de Project de punta a punta, estableciendo
los seams 1 (repositorio por agregado) y 2 (frontera única Zod).

**Comportamiento observable:** crear, listar, ver detalle, renombrar/editar
descripción y eliminar un proyecto. Input inválido rechazado en la frontera
de validación, nunca llega a persistencia.

**Blocked by:** 01-foundation.

**Status:** done

**Seams:** 1 (repository interface del agregado Project), 2 (validación Zod
única en cada mutación).

**Tests esperados:** comportamiento en las interfaces (CRUD, rechazo de input
inválido). Sin SQL ni detalles internos.

**Referencias:** spec stories 1–5, Domain rules; CONTEXT.md (Project);
ADR-0001.

- [x] CRUD de Project funciona de punta a punta (schema, API, UI, tests)
- [x] Input inválido rechazado en la frontera Zod
- [x] Persistencia accedida solo vía repository interface

## Comments

### Cierre 2026-09-21 (TDD + code review; verificación con DB pendiente del usuario)

**Implementación (TDD, slices verticales):** `db/schema.ts` (tabla `projects`
+ migración `drizzle/0000_projects.sql` generada); `lib/projects/validation.ts`
(seam 2: `createProjectSchema`/`updateProjectSchema`, name 1–200, description
max 2000 — límites como decisión de implementación, no feature);
`lib/projects/repository.ts` (seam 1: `ProjectRepository` + implementación
Drizzle, validación enforced adentro, `create/update` aceptan `unknown`);
`lib/projects/http.ts` (helpers `isProjectId`/`notFound`/`validationError`);
API `GET/POST /api/projects` + `GET/PATCH/DELETE /api/projects/[id]`
(ZodError→400, desconocido→404, id malformado→404);
UI `/` (lista + crear) y `/projects/[id]` (detalle + editar + eliminar).

**Tests:** `tests/projects.validation.test.ts` (9, frontera Zod),
`tests/projects.api-id.test.ts` (1, id malformado→404 sin tocar DB),
`tests/projects.repository.test.ts` (7, CRUD vía interfaz + rechazo previo a
persistencia), más los de foundation. Verde en sandbox: `typecheck` OK y
11 tests independientes de DB. `projects.repository.test.ts` (7) y
`health.smoke.test.ts` (2) requieren DB viva: rojo honesto en sandbox
(ECONNREFUSED verificado), pendientes de verificación externa.

**Code review (dos ejes, sub-agentes en paralelo, sobre working tree):**
- *Spec:* criterios cumplidos, cero scope creep (solo tabla `projects`; sin
  cascada —Ticket 06—, sin activity —Ticket 07—, sin tasks/decisions/docs
  —Tickets 03–05—). 2 menores: (1) `beforeEach` usa `db.delete` directo —
  aceptado (setup, no aserción; el repo no expone ni debe exponer "borrar
  todo"); (2) id malformado→500 — fix aplicado (`isProjectId`→404 + test).
- *Standards:* 0 violaciones duras. 4 judgement calls, 3 aplicados en revisión
  (helper HTTP compartido, `invalidId()`→`notFound()`, `Project` re-exportado
  type-only vía `lib/projects/validation` para que UI/API no referencien
  `@/db/*`); "Ticket" en comentarios/README se deja (convención del tracker,
  no vocabulario de dominio).

**Para verificación externa (con DB viva, en orden):**
`docker compose up -d` → `npm run db:push` → `npm test` (suite completa verde)
→ `npm run dev` → crear/listar/renombrar/borrar un proyecto en `/`,
probar input inválido (nombre vacío → 400) y `/api/projects/no-uuid` (→ 404).
