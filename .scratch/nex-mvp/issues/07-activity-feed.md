# 07: Activity feed derivado

**ID:** 07-activity-feed

**Objetivo:** Feed de solo lectura por proyecto, derivado en vivo de cambios
reales, sin ningún storage propio.

**Comportamiento observable:** el feed muestra en orden inverso-cronológico
los creates/updates/cambios-de-estado/supersesiones de las cuatro entidades.
Refleja solo lo actualmente derivable: un item borrado simplemente deja de
aparecer (sin entrada histórica, sin event log, sin audit table). El feed no
tiene UI propia de creación/edición/borrado.

**Blocked by:** 03-tasks, 04-decisions, 05-documentation.

**Status:** done

**Seams:** 3 (función de derivación que lee repositorios y no posee storage).

**Tests esperados:** cada cambio real aparece en orden; items borrados
ausentes; escribir activity directo es imposible; no existe tabla/storage de
activity.

**Referencias:** spec story 14, Domain rules (Activity nunca escrita);
CONTEXT.md (Activity); ADR-0002.

- [x] Feed deriva creates/updates/estados/supersesiones en orden
- [x] Borrados desaparecen sin dejar rastro ni infraestructura
- [x] Cero storage propio de Activity

## Comments

### Cierre 2026-09-21 (TDD + code review; verificación con DB pendiente del usuario)

**Implementación (TDD, slices rojo→verde):** `lib/activity/derive.ts` (seam 3:
`getProjectActivity` lee los 4 repositorios en paralelo, cero storage, cero
write path; cada registro aporta created + a lo sumo un evento posterior vía
helper `pushRecord`; task done→`status-changed`, decision superseded→
`superseded`, resto→`updated`; orden inverso-cronológico con desempate por
id); API `GET /api/projects/[id]/activity` solo-lectura (404 proyecto
malformado/desconocido); UI en `/projects/[id]` (lista read-only con leyenda
explícita, se refresca tras cada mutación; sin formularios).

**Tests:** `tests/activity.derive.test.ts` (5, con DB: orden, updates/estados/
supersesiones, borrado sin rastro, proyecto borrado → `[]` —aserción diferida
del Ticket 06—, proyecto desconocido → `[]`), `tests/activity.nostorage.test.ts`
(2, sin DB: sin tablas activities/events/audit/queue, solo exporta la
derivación), `tests/activity.api-id.test.ts` (1, sin DB),
`tests/activity.api.test.ts` (1, con DB: UUID desconocido → 404). Verde en
sandbox: `typecheck`, `next build`, 45 tests independientes de DB. Con DB:
5 derive + 1 api + resto de repositorios pendientes (ECONNREFUSED verificado).

**Code review (dos ejes, sub-agentes en paralelo, sobre working tree):**
- *Spec:* conforme en lo central, cero creep (sin tabla/log/cola/eventos, sin
  rutas de mutación, sin UI de mutación). Parciales aceptados como límites de
  "solo lo actualmente derivable": reapertura done→open cae a `updated`
  (indistinguible de una edición sin historial); cada entidad colapsa a máx.
  2 ítems; `touched()` exige granularidad >1ms (tests con `sleep(15)`
  explícito). Aplicados: helper `pushRecord` (mata duplicación ×4),
  nostorage reforzado, test API con DB, chip SUPERSEDES inverso ya estaba.
- *Standards:* 0 violaciones duras (`Activity` primer nivel; `event` como
  campo subordinado aceptado). Verificación NO-storage en todo el repo:
  schema y `drizzle/` (0000–0004) limpios, cero writes fuera de memoria.

**Para verificación externa (con DB viva):** `docker compose up -d` →
`npm run db:push` → `npm test` (suite completa verde) → `npm run dev` →
crear/editar/completar/superseder contenido y ver el feed ordenado en
`/projects/[id]`; borrar un item y un proyecto (desaparecen del feed).
