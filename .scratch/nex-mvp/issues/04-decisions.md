# 04: Technical Decisions estructuradas con supersesión

**ID:** 04-decisions

**Objetivo:** Registrar decisiones como conocimiento estructurado
(contexto + alternativas + razonamiento), listo para la futura capa de IA.

**Comportamiento observable:** registrar una decisión bajo un proyecto con
título, contexto, alternativas consideradas y razonamiento; ver el registro
completo; marcarla como superseded enlazando la decisión que la reemplaza;
editarla mientras no esté superseded; una decisión superseded es inmutable
(cualquier cambio exige crear una nueva que la superseda).

**Regla de dominio:** registro incompleto (sin contexto, alternativas o
razonamiento) se rechaza. Decisión superseded inmutable. Sin huérfanos.

**Blocked by:** 02-projects.

**Status:** done

**Seams:** 4 (shape estructurado title/context/alternatives/rationale/status/
links), 1 y 2 como en los demás agregados.

**Tests esperados:** rechazo por incompletitud, edición permitida antes de
superseder, inmutabilidad después, enlace de supersesión, rechazo de huérfana.

**Referencias:** spec stories 9–11, Domain rules, seam 4; CONTEXT.md
(Technical Decision); ADR-0002.

- [x] Registro estructurado completo exigible (contexto + alternativas + razonamiento)
- [x] Supersesión con enlace a la reemplazante
- [x] Superseded inmutable; no-superseded editable
- [x] Huérfana rechazada

## Comments

### Cierre 2026-09-21 (TDD + code review; verificación con DB pendiente del usuario)

**Implementación (TDD, slices rojo→verde):** `db/schema.ts` (tabla `decisions`:
`project_id NOT NULL` + FK sin cascada —Ticket 06—; `superseded_by` uuid sin
FK: los enlaces de historia los enforcea el repositorio, ningún rewrite
silencioso a nivel DB; migración `drizzle/0002_decisions.sql`);
`lib/decisions/validation.ts` (seam 2: create estricto title/context/
alternatives/rationale + `supersedes` uuid opcional; update parcial sin
`status`/`supersedes`; título 1–200, cuerpos 1–5000);
`lib/decisions/repository.ts` (seam 1 + seam 4: `DecisionRepository` scoped
por proyecto vía `ownedCondition()`; supersesión transaccional insert + mark;
`DecisionImmutableError` en update/delete de superseded y delete de decisión
enlazada; FK 23503 → `null` como en tasks);
API anidada `GET/POST /api/projects/[id]/decisions` +
`GET/PATCH/DELETE /api/projects/[id]/decisions/[decisionId]`
(helpers `isUuid`/`notFound`/`validationError`; 404 proyecto/ids/cross;
400 supersedes inválido; 409 historia inmutable);
UI en `/projects/[id]` (registro completo visible con badges ACTIVE /
SUPERSEDED BY / SUPERSEDES, crear con selector, editar, superseder, eliminar).

**Tests:** `tests/decisions.validation.test.ts` (8, frontera incl. strict e
incompletitud), `tests/decisions.api-id.test.ts` (2, ids malformados → 404
sin DB), `tests/decisions.repository.test.ts` (12, ciclo de vida + enlace +
inmutabilidad + huérfana + cross-project, con DB). Verde en sandbox:
`typecheck`, `next build`, 34 tests independientes de DB. Con DB:
12 decisions + 8 tasks + 7 projects + 2 smoke pendientes de verificación
externa (ECONNREFUSED verificado como causa en sandbox).

**Code review (dos ejes, sub-agentes en paralelo, sobre working tree):**
- *Spec:* completo, sin creep (sin Activity, cascadas, auth, búsqueda,
  dashboards, IA ni entidades nuevas), sin defectos de historia (sin dangling:
  borrar reemplazo enlazado bloqueado; borrar superseded bloqueado).
  2 cosméticos aplicados: supersedes inválido 404→400 con proyecto existente
  (mensaje UI ajustado) y chip inverso SUPERSEDES en la reemplazante.
- *Standards:* 0 violaciones duras (sin `ADR` como entidad; sin `@/db/*` en
  callers; FK sin huérfanos; stack exacto). 5 smells: 2 aplicados
  (`owned()`→`ownedCondition()`, `listByProject` reusa `projectExists`);
  3 aceptados (literales active/superseded —el seam 2 es dueño del concepto—;
  fixture COMPLETE duplicada en 2 tests; guardia de 1 línea en 2 rutas).

**Para verificación externa (con DB viva, en orden):**
`docker compose up -d` → `npm run db:push` → `npm test` (suite completa verde)
→ `npm run dev` → en un proyecto: registrar decisión completa, intentar
incompleta (→ 400), supersederla (badge + enlace), intentar editar/borrar la
superseded (→ 409), borrar una activa sin enlaces.
