# 05: Documentation del proyecto

**ID:** 05-documentation

**Objetivo:** Explicaciones junto al trabajo que describen, con mínimo
ceremonial.

**Comportamiento observable:** crear (título + cuerpo), ver, editar y eliminar
documentación bajo un proyecto. Sin proyecto se rechaza.

**Blocked by:** 02-projects.

**Status:** done

**Seams:** 1 (bajo el agregado Project), 2 (validación Zod).

**Tests esperados:** ciclo de vida a nivel comportamiento, rechazo de huérfana.

**Referencias:** spec stories 12–13; CONTEXT.md (Documentation); ADR-0002.

- [x] CRUD de Documentation funciona bajo un proyecto
- [x] Huérfana rechazada
- [x] Validación Zod en cada mutación

## Comments

### Cierre 2026-09-21 (TDD + code review; verificación con DB pendiente del usuario)

**Implementación (TDD, slices rojo→verde):** `db/schema.ts` (tabla
`documentation` con `project_id NOT NULL` + FK sin cascada —Ticket 06—;
migración `drizzle/0003_documentation.sql`); `lib/docs/validation.ts`
(seam 2: create estricto title/body, update parcial, título 1–200, cuerpo
1–20000); `lib/docs/repository.ts` (seam 1: `DocumentationRepository` scoped
por proyecto vía `ownedCondition()`, `projectExists` + FK 23503 → `null`);
API anidada `GET/POST /api/projects/[id]/docs` +
`GET/PATCH/DELETE /api/projects/[id]/docs/[docId]`
(helpers `isUuid`/`notFound`/`validationError`; 404/400); UI en
`/projects/[id]` (crear, ver cuerpo completo, editar, eliminar).

**Tests:** `tests/docs.validation.test.ts` (6), `tests/docs.api-id.test.ts`
(2, sin DB), `tests/docs.repository.test.ts` (7, con DB). Verde en sandbox:
`typecheck`, `next build`, 42 tests independientes de DB. Con DB: 7 docs +
resto de repositorios pendientes de verificación externa (ECONNREFUSED
verificado como causa en sandbox).

**Code review (dos ejes, sub-agentes en paralelo, sobre working tree):**
- *Spec:* PASS, cero creep (sin Activity, sin cascada, sin extras). Límites
  200/20000 aceptados como restricción de forma, no creep.
- *Standards:* 0 violaciones duras (vocabulario Documentation, stack, seams,
  FK sin huérfanos). 2 smells aceptados sin cambio: par
  `(projectId, documentationId)` espeja las firmas de los seams hermanos;
  `ids()` consistente en las 6 rutas anidadas.

**Para verificación externa (con DB viva, en orden):**
`docker compose up -d` → `npm run db:push` → `npm test` (suite completa verde)
→ `npm run dev` → en un proyecto: crear/ver/editar/eliminar documentación;
crear sin título o sin cuerpo (→ 400).
