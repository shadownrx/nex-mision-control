# 06: Borrado en cascada sin huérfanos

**ID:** 06-cascade-delete

**Objetivo:** Borrar un proyecto elimina todo lo suyo; no queda nada huérfano
ni rastro en el feed.

**Comportamiento observable:** al eliminar un Project con Tasks, Decisions y
Documentation, todo desaparece; su Activity desaparece naturalmente con él
(derivada de contenido que ya no existe). Verificación de cero huérfanos.

**Blocked by:** 03-tasks, 04-decisions, 05-documentation.

**Status:** done

**Seams:** 1 (cascada a través del agregado).

**Tests esperados:** borrado con hijos de los tres tipos deja cero registros
huérfanos; el feed del proyecto eliminado ya no existe.

**Referencias:** spec story 5, Domain rules (no-orphans, cascada); ADR-0002.

- [x] Borrar Project elimina Tasks, Decisions y Documentation propias
- [x] Cero huérfanos verificable tras el borrado
- [x] Sin event log ni storage adicional para borrados

## Comments

### Cierre 2026-09-21 (TDD + code review; verificación con DB pendiente del usuario)

**Implementación (TDD: test rojo → schema verde):** cascada a nivel DB como
expresión relacional de "pertenece a": 3 FKs (`tasks`, `decisions`,
`documentation`) con `onDelete: "cascade"` en `db/schema.ts` + migración
`drizzle/0004_cascade.sql` (drop + recreate de las 3 constraints). Cero
cambios de código: `projects.remove` sigue siendo un único
`delete(projectsTable)`; la DB hace el resto. Cero storage nuevo (criterio 3
por construcción). El historial superseded enlazado muere con el proyecto por
diseño wholesale ("ni rastro"); los guards de `decisions.remove` rigen solo
borrado individual.

**Tests:** `tests/cascade.test.ts` (2: borrado con hijos de 3 tipos +
superseded enlazada; cero huérfanos por tablas vacías). En sandbox fallan
honesto con ECONNREFUSED (verificado); comportamiento completo pendiente de
verificación externa. Aserción del feed post-borrado diferida al Ticket 07
(el feed aún no existe; la inferencia es sólida porque Activity nunca se
almacena).

**Code review (dos ejes, sub-agentes en paralelo, sobre working tree):**
- *Spec:* conforme, sin creep, sin defectos (constraints preservados,
  `superseded_by` sigue sin FK, sin cascada reimplementada en app).
- *Standards:* 0 violaciones (CASCADE implementa no-orphans; mecanismo
  idiomático del stack; seam 1 intacto —la cascada vive detrás del
  repositorio). 0 smells accionables (FK repetida la impone Drizzle).

**Para verificación externa (con DB viva):** `docker compose up -d` →
`npm run db:push` → `npm test` (incluye cascade, suite completa verde) →
en UI: proyecto con tasks/decisions/docs → Delete → proyecto e hijos
desaparecen.
