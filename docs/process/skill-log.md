# NEX Mission Control — Skill Log

Registro del proceso de desarrollo con las AI Engineering Skills de Matt Pocock.
Sirve como fuente para el blog técnico: qué se construyó, qué skills se usaron,
cuándo, qué decisiones se tomaron y cómo cambió el proceso.

## Entrada: setup-matt-pocock-skills

- **Fecha / fase:** 2026-09-21 — Fase Setup (pre-flujo, sin implementación)
- **Objetivo:** Configurar tracker, vocabulario de triage y layout de domain docs
  que las demás skills asumen.
- **Decisiones tomadas:**
  - Issue tracker: local markdown en `.scratch/` (sin remote, proyecto solo,
    proceso documentado dentro del repo).
  - Triage labels: defaults (`needs-triage`, `needs-info`, `ready-for-agent`,
    `ready-for-human`, `wontfix`).
  - Domain docs: single-context (`CONTEXT.md` + `docs/adr/` en root).
  - Archivo de agentes: crear `AGENTS.md` (no existía ni `AGENTS.md` ni `CLAUDE.md`).
- **Cambios en el repositorio:**
  - Creado `AGENTS.md` (bloque `## Agent skills`).
  - Creados `docs/agents/issue-tracker.md`, `docs/agents/triage-labels.md`,
    `docs/agents/domain.md` (desde plantillas de la skill, sin modificaciones).
- **Artefactos generados:** los 4 archivos anteriores. Sin código de producto.
- **Problemas o desacuerdos:**
  - `read_skill` devolvió `disabled-skill` para `setup-matt-pocock-skills` y
    `ask-matt` (`disable-model-invocation: true`). Se leyeron por archivo
    (`muse.read_file`) en vez de invocarlas como skill model-invocable.
  - Ningún desacuerdo de contenido: las 3 decisiones se confirmaron por
    pregunta estructurada antes de escribir.
- **Qué aprendimos del proceso:** el setup fuerza decisiones de infraestructura
  de trabajo (dónde viven los issues, qué significan las labels) antes de
  discutir producto. Eso evita asumir GitHub por defecto en un repo sin remote.

## Entrada: ask-matt (router)

- **Fecha / fase:** 2026-09-21 — Router, entre Setup y Grilling
- **Objetivo:** Determinar el flujo apropiado para NEX Mission Control.
- **Decisiones tomadas:**
  - Arrancar en `/grill-with-docs` (hay working directory; deja paper trail en
    `CONTEXT.md` + ADRs).
  - No usar `/wayfinder` por ahora; reconsiderar solo con evidencia de que el
    proyecto se volvió demasiado grande, ambiguo o multi-sesión.
  - Frontera de fase: no avanzar a `/to-spec`, `/to-tickets` ni implementación
    hasta cerrar el grilling.
- **Cambios en el repositorio:** ninguno.
- **Artefactos generados:** ninguno (decisión registrada aquí).
- **Problemas o desacuerdos:** ninguno.
- **Qué aprendimos del proceso:** el router distingue idea afilable en una
  sesión (`grill-with-docs`) de esfuerzo foggy multi-sesión (`wayfinder`).
  Nombrar esa diferencia evitó sobredimensionar el proceso.

## Entrada: grill-with-docs (cerrada)

- **Fecha / fase:** 2026-09-21 — Fase Grilling, rondas 1 y 2 cerradas, fase cerrada
- **Objetivo:** Afilar la idea de NEX Mission Control sin inventar requisitos:
  alcance de uso, alcance funcional MVP y lock del stack. Paper trail en
  `CONTEXT.md` y ADRs solo cuando un término se resuelva o una decisión cumpla
  los 3 criterios ADR.
- **Decisiones tomadas (ronda 1):**
  - Q1: single-user sin auth ni multi-tenant en v1; auth re-evaluable después.
  - Q2: las 5 entidades (Projects, Tasks, Technical Decisions, Documentation,
    Activity) entran en v1 con representación mínima; objetivo: demostrar que
    el modelo las representa y relaciona sin inflar el MVP.
  - Q3: stack lockeado como decisión v1 (no afirmación universal): Next.js,
    TypeScript, PostgreSQL, Drizzle, Zod, Vitest, Tailwind.
- **Cambios en el repositorio:**
  - Creado `docs/process/skill-log.md` (este archivo).
  - Creado `CONTEXT.md` (glosario inicial, 5 términos, sin detalles de
    implementación).
  - Creado `docs/adr/0001-v1-stack.md` (decisión v1, alternativas y
    reversibilidad por parte).
- **Decisiones tomadas (ronda 2):**
  - Q4: todo pertenece a un Project, sin huérfanos; Activity es vista derivada
    de las demás entidades, sin persistencia propia (no duplicar información).
  - Q5: extensibilidad v1 = schema limpio + seams modulares; explícitamente
    fuera de v1: plugins, entidades definidas por usuarios, marketplace,
    arquitectura dinámica.
  - Q6: local-first (Next.js + PostgreSQL en Docker Compose), sin deploy
    target; nada de infraestructura antes de validar el MVP.
  - Cierre: no se abrió ronda final; lo restante (campos exactos, matriz CRUD,
    layout UI) es trabajo de `/to-spec`, no del grilling.
- **Cambios en el repositorio (ronda 2):**
  - Actualizado `CONTEXT.md` (pertenencia a Project, Activity como vista
    derivada).
  - Creado `docs/adr/0002-v1-domain-boundaries.md` (bordes de dominio, nos
    explícitos, consecuencias de migración futura).
  - Actualizado este skill-log con el cierre de fase.
- **Artefactos generados:** rondas 1 y 2 (6 preguntas) del grilling, en el
  hilo; `CONTEXT.md`; `docs/adr/0001-v1-stack.md`,
  `docs/adr/0002-v1-domain-boundaries.md`.
- **Problemas o desacuerdos:**
  - `grill-with-docs` también es `disable-model-invocation`; se ejecutó
    leyendo `grilling` + `domain-modeling` por archivo y aplicando su proceso
    (rondas con frontera y recomendación; glosario inline; ADR solo con los 3
    criterios).
  - `Documentation` y `Activity` quedaron definidos en mínimo en ronda 1 y se
    afilaron en ronda 2 en vez de asumirlos; `Activity` pasó de "registro" a
    "vista derivada" por decisión explícita del usuario.
  - Local-first se dejó fuera del ADR a propósito: es fácilmente reversible y
    no sorprende a un lector futuro, así que no cumple los 3 criterios.
- **Qué aprendimos del proceso:** el grilling en rondas con frontera evitó dos
  asunciones caras (tabla Activity propia, sistema de plugins) antes de que
  existiera una línea de código. El paper trail (`CONTEXT.md` + 2 ADRs) deja al
  futuro lector —y al blog— el porqué de cada no: single-user, sin huérfanos,
  sin plugins, sin deploy. El proceso cambió en un punto concreto: en vez de
  discutir campos y pantallas, la fase se detuvo en bordes y vocabulario, y lo
  detallado quedó explícitamente delegado a `/to-spec`.

## Entrada: to-tickets (propuesta, pendiente de aprobación)

- **Fecha / fase:** 2026-09-21 — Fase Tickets, breakdown propuesto, publicación
  pendiente de aprobación del usuario
- **Objetivo:** Convertir `.scratch/nex-mvp/spec.md` en slices verticales
  trazadores con blocking edges explícitos, sin agregar features ni cambiar
  decisiones.
- **Decisiones tomadas:**
  - 8 tickets: 01-foundation (local-first corriendo + Vitest verde), 02-projects
    (agregado + seams 1 y 2), 03-tasks, 04-decisions (shape estructurado,
    seam 4), 05-documentation, 06-cascade-delete, 07-activity-feed (seam 3,
    sin storage), 08-mvp-verify (vista conjunta + arranque documentado).
  - Orden: 01 → 02 → {03, 04, 05 en paralelo} → 06 y 07 → 08. Proyecto
    funcionando después de cada ticket.
  - Sin dependencias circulares. 03/04/05 solo dependen de 02; 06 y 07 de
    03/04/05; 08 de 06/07.
  - Archivos todavía NO publicados en `.scratch/nex-mvp/issues/`: la skill
    exige aprobar el breakdown antes de publicar.
- **Cambios en el repositorio:** solo este skill-log. Ni spec, ni CONTEXT.md,
  ni ADRs se tocaron en esta fase.
- **Artefactos generados:** breakdown de 8 tickets (en el hilo); pendiente su
  publicación como un archivo por ticket en `.scratch/nex-mvp/issues/`.
- **Problemas o desacuerdos:**
  - `to-tickets` también es `disable-model-invocation`; se ejecutó leyendo la
    skill por archivo.
  - Intento fallido de edición sobre `spec.md` con un find inexistente (sin
    efecto, verificado); el spec quedó intacto como corresponde.
  - Ambigüedades del spec detectadas para tu revisión (ver reporte): eventos
    de borrado en el feed, frontera update-vs-supersede en decisiones.
- **Qué aprendimos del proceso:** el quiz obligatorio de la skill (granularidad
  / edges / merge-split) es la compuerta que impide publicar tickets mal
  cortados; el grafo con 03/04/05 en paralelo muestra que el corte vertical
  permite trabajo concurrente real, no solo secuencial.

## Entrada: to-tickets (cerrada)

- **Fecha / fase:** 2026-09-21 — Fase Tickets, breakdown aprobado y publicado,
  fase cerrada
- **Objetivo:** Publicar los 8 tickets verticales aprobados en el tracker
  local, con las dos ambigüedades resueltas por el usuario incorporadas.
- **Decisiones tomadas:**
  - Granularidad y blocking edges aprobados sin cambios (8 tickets, grafo
    01 → 02 → {03, 04, 05} → 06/07 → 08).
  - Activity y borrados: estrictamente derivada, sin event log ni audit
    table; lo borrado desaparece del feed; el feed del proyecto borrado muere
    con él. Expresado en tickets 06 y 07.
  - Update vs supersede: editable hasta superseder; superseded inmutable; el
    reemplazo es una nueva decisión que referencia a la anterior. Expresado
    como regla de dominio + criterios en el ticket 04.
- **Cambios en el repositorio:**
  - Publicados `.scratch/nex-mvp/issues/01-foundation.md` a
    `08-mvp-verify.md` (un archivo por ticket, `Status: ready-for-agent`,
    con ID, objetivo, comportamiento, criterios, dependencias, seams, tests
    y referencias).
  - Actualizado este skill-log.
- **Artefactos generados:** los 8 archivos de ticket, numerados en orden de
  dependencias (bloqueadores primero).
- **Problemas o desacuerdos:**
  - Ninguna dependencia circular; el grafo admite 03/04/05 en paralelo.
  - Ningún desacuerdo: los tickets solo transcriben spec + decisiones
    aprobadas, sin features nuevas.
- **Qué aprendimos del proceso:** las dos ambigüedades (borrados en feed,
  update-vs-supersede) confirman el valor del quiz: sin esa compuerta, cada
  implementador las habría resuelto por su cuenta. Resolverlas antes de
  publicar dejó a los tickets 04, 06 y 07 con reglas que se pueden testear
  sin interpretación.

## Entrada: implement 01-foundation (cerrada 2026-09-21, code review incluido)

- **Fecha / fase:** 2026-09-21 — Fase Implement, Ticket 01 retomado de sesión
  anterior (quedó a medio instalar: `node_modules` corrupto, sin `app/`, `db/`
  ni compose; el test `tests/health.smoke.test.ts` ya existía)
- **Objetivo:** Completar la foundation local-first del Ticket 01 sin tocar
  dominio (Tickets 02+): Next.js + TS, PostgreSQL en Compose, Drizzle
  conectado, Vitest verde, comandos documentados.
- **Decisiones tomadas:**
  - Estructura mínima en raíz (`app/`, `db/`) respetando los imports que el
    smoke test ya esperaba (`@/app/api/health/route`, `@/db`).
  - `db/index.ts` expone `checkDb()` (`SELECT 1` → boolean); `GET /api/health`
    responde 200 `{status:"ok",database:"up"}` y 503
    `{status:"ok",database:"down"}` si la base no responde (el degradado se
    ve en la propia respuesta, no como éxito silencioso).
  - `db/schema.ts` placeholder vacío explícito: cero tablas hasta el Ticket 02.
  - `docker-compose.yml` con `postgres:16-alpine` (nex/nex/nex en 5432);
    `README.md` con el set de comandos documentado (story 15 del spec).
- **Cambios en el repositorio:**
  - Creados `docker-compose.yml`, `drizzle.config.ts`, `db/index.ts`,
    `db/schema.ts`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`,
    `app/api/health/route.ts`, `next.config.ts`, `postcss.config.mjs`,
    `next-env.d.ts`, `README.md`, `.env` (local, gitignored).
  - Reinstalado `node_modules` limpio (estaba corrupto por corte anterior) y
    generado `package-lock.json`.
- **Artefactos generados:** los archivos de foundation listados arriba.
- **Problemas o desacuerdos:**
  - Sandbox sin acceso al socket Docker: `docker compose up -d` denegado
    (EPERM); pide re-ejecutar con `--sandbox-network enabled` o
    `--disable-sandbox`. Sin PostgreSQL, `vitest run` falla honesto 2/2
    (503 `database:"down"`).
  - `npm run dev` no levanta en este sandbox: Next.js muere en
    `uv_interface_addresses` (el sandbox bloquea enumerar interfaces de red).
  - `npm run typecheck` verde.
  - Sin commits todavía (regla: no commitear sin pedido explícito).
- **Qué aprendimos del proceso:** el smoke test preexistente fijó la forma de
  `db` y `health` antes de escribir código (TDD invertido por corte de
  sesión, pero el test mandó igual); el endpoint que reporta su propio
  degradado (503 + `down`) deja la verificación bloqueada pero honesta.
- **Cierre (verificación externa del usuario + review):**
  - Evidencia externa manual: `docker compose up -d` OK, imagen
    `16-alpine`, network + volume + container creados, Next.js en localhost
    con "NEX Mission Control" / "Foundation local-first — Ticket 01.".
    `uv_interface_addresses` era limitación del sandbox, no fallo.
  - Code review en dos sub-agentes paralelos (Standards + Spec) sobre working
    tree — sin commits no hay fixed point para `git diff`, adaptación honesta
    registrada en el ticket. Standards: 1 violación menor (`Ticket` en UI de
    `app/page.tsx`, diferida al Ticket 02 que reemplaza la home) + 1 smell
    menor (fallback de connection string duplicado, registrado sin extraer).
    Spec: cero scope creep; L24 parcial aceptado (el healthcheck es el
    endpoint, sin `healthcheck:` en Compose); L19-20 parcial con fix aplicado
    (`tests/health.degraded.test.ts`, rama 503 mockeada, verde con y sin DB).
  - Ticket 01 en `Status: done` con checkboxes y `## Comments`; los cinco
    roles de triage no tienen estado terminal, se adopta `done` como marcador.
  - Verde en sandbox: `typecheck` OK, degraded test OK (1 test); smoke test
    rojo honesto sin DB (ECONNREFUSED).

## Entrada: implement 02-projects (cerrada 2026-09-21, TDD + code review)

- **Fecha / fase:** 2026-09-21 — Fase Implement, Ticket 02 con Ticket 01 ya en
  `done` (evidencia externa del usuario como oracle de DB)
- **Objetivo:** Ciclo de vida mínimo de Project punta a punta, estableciendo
  seams 1 (repository por agregado) y 2 (frontera Zod única). Sin cascada
  (Ticket 06), sin activity (Ticket 07), sin tablas hijas (Tickets 03–05).
- **Decisiones tomadas:**
  - TDD en slices verticales: validación (rojo→verde, 9 tests) → repositorio
    (rojo por módulo ausente; en verde solo falta DB) → schema + migración
    generada sin DB → API → UI → fixes de review.
  - `create/update` del repositorio aceptan `unknown` y parsean adentro: la
    frontera Zod se enforcea en el seam 1, ningún caller puede saltearla.
  - Límites name 1–200 / description max 2000 como decisión de
    implementación (validación razonable, no feature).
  - `db.delete` en `beforeEach` aceptado como setup (el repo no expone
    "borrar todo" por diseño); id malformado→404 con test sin DB.
  - `Project` re-exportado type-only vía `lib/projects/validation` para que
    UI/API no referencien `@/db/*` (cero costo runtime, todo `import type`).
- **Cambios en el repositorio:**
  - Creados `lib/projects/validation.ts`, `lib/projects/repository.ts`,
    `lib/projects/http.ts`, `app/api/projects/route.ts`,
    `app/api/projects/[id]/route.ts`, `app/projects/[id]/page.tsx`,
    `drizzle/0000_projects.sql` (+ `drizzle/meta/`), `tests/projects.*.ts`
    (3 archivos), `tests/health.degraded.test.ts` (cierre del Ticket 01).
  - Reescritos `db/schema.ts` (tabla `projects`), `app/page.tsx` (lista +
    crear; el placeholder "Ticket 01" desaparece con la UI real, cerrando el
    hallazgo de Standards del Ticket 01).
  - Tocados `package.json` (scripts `db:generate`/`db:push`), `README.md`
    (comando `db:push` + estado Ticket 02).
  - Sin commits (regla: no commitear sin pedido explícito).
- **Artefactos generados:** CRUD completo + 18 tests (11 verdes sin DB;
  7 de repositorio + 2 de smoke pendientes de DB viva).
- **Problemas o desacuerdos:**
  - Code review en dos sub-agentes paralelos por ticket; sin commits se revisa
    working tree (adaptación registrada en cada ticket). Spec 02: cumplido,
    cero creep. Standards 02: 0 violaciones duras, 3 fixes menores aplicados.
  - Resultados de sub-agentes llegan truncados por el runtime; el texto
    íntegro se recuperó del `session.jsonl` del parent (registros
    `subagent.control.result_ready`).
  - Sandbox sin DB: `projects.repository.test.ts` falla honesto con
    ECONNREFUSED (causa verificada, no bug). Checklist de verificación
    externa dejado en el ticket (db:push → suite verde → recorrido UI).
- **Qué aprendimos del proceso:** el mock de `checkDb()` deja un test de rama
  degradada verde en cualquier entorno; los tests que necesitan DB quedan
  explícitamente marcados y su oracle es la verificación externa, no el
  sandbox. El review en etapa separada (no dentro del loop rojo→verde)
  produjo fixes reales y baratos (404 de id, helper HTTP, re-export de tipo).

## Entrada: implement 03-tasks (cerrada 2026-09-21, TDD + code review)

- **Fecha / fase:** 2026-09-21 — Fase Implement, Ticket 03 con 01 y 02 en
  `done`; 04+ no iniciados
- **Objetivo:** Tasks visibles dentro de un proyecto (CRUD + open/done, regla
  no-huérfanos), reutilizando seams 1–2 y patrones del Ticket 02. Sin cascada
  (06), sin activity (07), sin tocar Decisions/Docs (04–05).
- **Decisiones tomadas:**
  - Rutas API anidadas bajo `/api/projects/[id]/tasks` (se unificó el
    segmento dinámico en `[id]`: Next no admite `[id]` y `[projectId]` al
    mismo nivel).
  - `TaskRepository.create(projectId, input)` devuelve `null` si el proyecto
    no existe; violación FK 23503 (carrera con borrado) también → `null`.
    La FK queda `ON DELETE no action`: borrar proyecto con tasks falla hasta
    que el Ticket 06 implemente cascada.
  - Create estricto solo-`title` (toda task nace `open`); status solo vía
    update, ambas direcciones. Título 1–200 como en 02.
  - `isProjectId` renombrado a `isUuid` reutilizable (ruta `[id]` migrada);
    `Project`/`Task` como `import type` vía `lib/*/validation` (cero runtime).
  - Smells aceptados sin cambio: guardia de 1 línea duplicada en 2 rutas,
    `status` TEXT con concepto en Zod (el seam 2 es dueño por diseño).
- **Cambios en el repositorio:**
  - Creados `lib/tasks/validation.ts`, `lib/tasks/repository.ts`,
    `app/api/projects/[id]/tasks/route.ts`,
    `app/api/projects/[id]/tasks/[taskId]/route.ts`,
    `drizzle/0001_tasks.sql`, `tests/tasks.*.test.ts` (3 archivos).
  - Tocados `db/schema.ts` (tabla `tasks`), `lib/projects/http.ts`
    (`isProjectId`→`isUuid`), `app/api/projects/[id]/route.ts` (rename),
    `app/projects/[id]/page.tsx` (sección Tasks con el lenguaje visual
    existente), `README.md` (estado Ticket 03).
  - No tocados: `app/layout.tsx`, `app/console-clock.tsx`, `app/globals.css`,
    `app/page.tsx` (trabajo paralelo del usuario en el árbol; propiedad ajena).
  - Sin commits (regla vigente).
- **Artefactos generados:** CRUD de Tasks punta a punta + 21 tests de tasks
  (11 validación, 2 api-id, 8 repositorio).
- **Problemas o desacuerdos:**
  - Code review en dos sub-agentes paralelos; textos íntegros recuperados del
    `session.jsonl`. Spec: completo, cero creep. Standards: 0 duras.
    3 fixes aplicados (strict + test, FK→null, alias eliminado).
  - `npm run build` falló una vez con `.next` obsoleto
    (`/_not-found`, `/api/health` — páginas no tocadas por el ticket);
    rebuild limpio tras `rm -rf .next`: verde, con las 7 rutas listadas.
  - Sandbox sin DB: 8 tests de tasks + 7 de projects + 2 de smoke quedan para
    verificación externa (checklist en el ticket). Fix FK→null sin cobertura
    en sandbox por la misma causa.
- **Qué aprendimos del proceso:** anidar rutas bajo el agregado hace que el
  scoping sea estructural (el `projectId` viene del path, no del body); el
  `null` como "sin proyecto" unifica 404 en API sin tipos de error nuevos.
  Un build rojo en páginas ajenas al ticket se diagnostica antes de culpar al
  cambio propio: era caché de build, no el diff.

## Entrada: implement 04-decisions (cerrada 2026-09-21, TDD + code review)

- **Fecha / fase:** 2026-09-21 — Fase Implement, Ticket 04 con 01–03 en
  `done`; 05+ no iniciados
- **Objetivo:** Technical Decisions como conocimiento estructurado bajo un
  Project (seam 4: title/context/alternatives/rationale/status/links), con
  supersesión enlazada e historia inmutable. Sin activity (07), sin cascada
  (06), sin tocar Documentation (05).
- **Decisiones tomadas:**
  - TDD en slices: validación (rojo→verde, 8 tests) → repositorio (rojo por
    módulo ausente; en verde solo falta DB) → schema + migración generada sin
    DB → API → UI → fixes de review.
  - `superseded_by` como uuid plano SIN FK: los enlaces los enforcea el
    repositorio y ningún rewrite silencioso a nivel DB puede tocar la
    historia (un `ON DELETE SET NULL` violaría la regla).
  - `remove` rechaza superseded Y decisiones enlazadas por otra
    (`DecisionImmutableError` → 409): borrar el reemplazo dejaría dangling en
    la superseded; solo activas sin enlaces se borran ("delete before it
    matters").
  - Create-con-supersedes en transacción (insert + mark atómicos); target
    inexistente/de otro proyecto/ya-superseded → `null`; FK 23503 → `null`.
  - POST distingue proyecto inexistente (404) de supersedes inválido (400);
    update no admite `status`/`supersedes` (el estado solo cambia por
    supersesión).
  - Archivo vigente leído como `04-decisions.md` (el nombre
    `04-technical-decisions.md` del pedido no existe en el tracker).
- **Cambios en el repositorio:**
  - Creados `lib/decisions/validation.ts`, `lib/decisions/repository.ts`,
    `app/api/projects/[id]/decisions/route.ts`,
    `app/api/projects/[id]/decisions/[decisionId]/route.ts`,
    `drizzle/0002_decisions.sql`, `tests/decisions.*.test.ts` (3 archivos).
  - Tocados `db/schema.ts` (tabla `decisions`), `lib/decisions/*` (fixes),
    `app/projects/[id]/page.tsx` (sección Technical Decisions con registro
    completo + badges + selector/botón de supersesión), `README.md` (mapa,
    reglas, tabla 03–04 a `done`, nota de honestidad).
  - No tocados: layout/console-clock/globals/home (trabajo paralelo ajeno).
  - Sin commits (regla vigente).
- **Artefactos generados:** Decisions CRUD + supersesión punta a punta;
  22 tests de decisions (8 validación, 2 api-id, 12 repositorio).
- **Problemas o desacuerdos:**
  - Code review en dos sub-agentes paralelos; textos íntegros del
    `session.jsonl`. Spec: completo, cero creep, sin defectos de historia;
    2 cosméticos aplicados (400 vs 404, chip SUPERSEDES inverso). Standards:
    0 duras; 2 smells aplicados (`ownedCondition`, `projectExists`
    reutilizado, con ajuste de tipo a `Pick<typeof db, "select">` porque `db`
    no es asignable a `PgTransaction`); 3 aceptados con motivo.
  - Sandbox sin DB: 12 tests de decisions quedan para verificación externa
    (checklist en el ticket). `next build` verde con las 9 rutas.
- **Qué aprendimos del proceso:** la inmutabilidad histórica se implementa en
  tres capas coherentes (Zod niega el campo, el repositorio niega el write,
  la API traduce a 409) en vez de un solo check; y un enlace sin FK es una
  decisión de diseño defendible cuando el dueño de la invariante es el
  repositorio, no la base.

## Entrada: implement 05-documentation (cerrada 2026-09-21, TDD + code review)

- **Fecha / fase:** 2026-09-21 — Fase Implement, Ticket 05 con 01–04 en
  `done`; 06+ no iniciados
- **Objetivo:** Documentation (título + cuerpo) bajo un Project, mínimo
  ceremonial, reutilizando seams 1–2 y patrones de Tasks/Decisions. Sin
  activity (07), sin cascada (06).
- **Decisiones tomadas:**
  - TDD en slices: validación (rojo→verde, 6 tests) → repositorio (rojo por
    módulo ausente; en verde solo falta DB) → schema + migración generada sin
    DB → API → UI → review sin fixes.
  - Módulo `lib/docs/` + tests `tests/docs.*` (corto, pareado como
    tasks/decisions); tabla `documentation` (incontable, término de dominio).
  - Cuerpo 1–20000 como decisión de implementación (prosa más larga que un
    rationale).
- **Cambios en el repositorio:**
  - Creados `lib/docs/validation.ts`, `lib/docs/repository.ts`,
    `app/api/projects/[id]/docs/route.ts`,
    `app/api/projects/[id]/docs/[docId]/route.ts`,
    `drizzle/0003_documentation.sql`, `tests/docs.*.test.ts` (3 archivos).
  - Tocados `db/schema.ts` (tabla `documentation`),
    `app/projects/[id]/page.tsx` (sección Documentation), `README.md` (mapa,
    reglas, nota de honestidad; tabla 05 queda para el cierre).
  - Sin commits (regla vigente).
- **Artefactos generados:** Documentation CRUD punta a punta + 15 tests
  (6 validación, 2 api-id, 7 repositorio).
- **Problemas o desacuerdos:**
  - Code review en dos sub-agentes paralelos. Spec: PASS, cero creep.
    Standards: 0 duras; 2 smells aceptados con motivo (firma espeja seams,
    `ids()` consistente). Sin fixes requeridos.
  - Sandbox sin DB: 7 tests de docs quedan para verificación externa.
    `next build` verde con las 11 rutas.
- **Qué aprendimos del proceso:** al cuarto agregado el patrón ya es mecánico
  (validation → repository → rutas → UI → review); la variación real entre
  tickets está solo en las reglas de dominio (open/done, supersesión,
  nada en docs), no en la arquitectura.

## Entrada: implement 06-cascade-delete (cerrada 2026-09-21, TDD + code review)

- **Fecha / fase:** 2026-09-21 — Fase Implement, Ticket 06 con 01–05 en
  `done`; 07+ no iniciado
- **Objetivo:** Borrar un Project elimina Tasks, Decisions y Documentation
  sin huérfanos ni rastro, sin event log ni storage adicional.
- **Decisiones tomadas:**
  - TDD: `tests/cascade.test.ts` en rojo (2 tests) → verde vía schema
    (en sandbox el rojo es ECONNREFUSED; con DB sería violación FK).
  - Cascada a nivel DB (`ON DELETE CASCADE` en las 3 FKs) como expresión
    relacional de "pertenece a": cero cambios de código, cero storage,
    historial superseded incluido por diseño wholesale.
  - Aserción del feed post-borrado diferida al Ticket 07 (el feed aún no
    existe).
- **Cambios en el repositorio:**
  - Tocados `db/schema.ts` (3× `onDelete: "cascade"` + comentarios) y nada
    más de código.
  - Creados `drizzle/0004_cascade.sql`, `tests/cascade.test.ts`.
  - Sin commits (regla vigente).
- **Artefactos generados:** migración de cascada + 2 tests.
- **Problemas o desacuerdos:**
  - Code review en dos sub-agentes paralelos. Spec: conforme, cero creep.
    Standards: 0 violaciones, 0 smells accionables. Sin fixes.
  - Sandbox sin DB: los 2 tests quedan para verificación externa.
    `next build` verde.
- **Qué aprendimos del proceso:** cuando la invariante ya vive en la base
  (FKs no-orphans), el ticket se resuelve moviendo la invariante, no
  agregando código: el diff es schema + migración + tests.

## Entrada: implement 07-activity-feed (cerrada 2026-09-21, TDD + code review)

- **Fecha / fase:** 2026-09-21 — Fase Implement, Ticket 07 con 01–06 en
  `done`; 08 no iniciado (límite explícito)
- **Objetivo:** Feed read-only por proyecto derivado en vivo (seam 3), sin
  storage propio de ninguna forma.
- **Decisiones tomadas:**
  - TDD en slices: derive (rojo por módulo ausente; en verde solo falta DB)
    → API solo-GET → UI read-only → fixes de review.
  - `getProjectActivity` en `lib/activity/derive.ts`: lee los 4 repositorios
    en paralelo; cada registro aporta created + ≤1 evento posterior
    (done→status-changed, superseded→superseded, resto→updated);
    inverso-cronológico con desempate por id.
  - Límites aceptados de "solo lo actualmente derivable": reapertura →
    `updated`, colapso a 2 ítems, `touched()` >1ms (tests con `sleep`
    explícito). `event` como nombre de campo aceptado (subordinado a
    `Activity`).
  - Aserción del feed post-borrado del Ticket 06, saldada aquí.
- **Cambios en el repositorio:**
  - Creados `lib/activity/derive.ts`,
    `app/api/projects/[id]/activity/route.ts`, `tests/activity.*.test.ts`
    (4 archivos: derive, nostorage, api-id, api).
  - Tocados `app/projects/[id]/page.tsx` (sección Activity read-only +
    refresh tras mutaciones), `README.md` (mapa, reglas).
  - Sin commits (regla vigente).
- **Artefactos generados:** feed derivado punta a punta + 9 tests
  (5 derive, 2 nostorage, 1 api-id, 1 api).
- **Problemas o desacuerdos:**
  - Code review en dos sub-agentes paralelos. Spec: conforme central, cero
    creep; parciales aceptados/documentados. Standards: 0 duras + grep
    NO-storage en todo el repo. Aplicados: helper `pushRecord`, nostorage
    reforzado (9 claves + exports), test API con DB.
  - Sandbox sin DB: 5 derive + 1 api quedan para verificación externa.
    `next build` verde con las 12 rutas.
- **Qué aprendimos del proceso:** un read-model sin storage se testea en tres
  niveles (invariante estática sin DB, derivación con DB, borde API mixto);
  el review de un derivado honesto produce límites documentados, no fixes
  infinitos: sin historial almacenado no hay completitud que exigir.

## Entrada: domain-modeling (aplicada dentro de grill-with-docs)

- **Fecha / fase:** 2026-09-21 — Soporte del Grilling, rondas 1 y 2
- **Objetivo:** Dar vocabulario al grilling: glosario inline en `CONTEXT.md`
  en vez de discutir campos y pantallas.
- **Decisiones tomadas:** 5 términos con definición + uso a evitar
  (Project, Task, Technical Decision, Documentation, Activity); en ronda 2 se
  afilaron pertenencia a Project y Activity como vista derivada.
- **Cambios en el repositorio:** `CONTEXT.md` (creación en ronda 1,
  actualización en ronda 2). Ningún otro archivo.
- **Artefactos generados:** el glosario, consumido luego por spec y tickets
  como vocabulario obligatorio.
- **Problemas o desacuerdos:** `domain-modeling` se aplicó leyendo la skill
  por archivo (misma limitación `disable-model-invocation` que las demás);
  `Activity` pasó de "registro" a "vista derivada" por decisión explícita
  del usuario, no por propuesta de la skill.
- **Qué aprendimos del proceso:** detener el grilling en bordes y
  vocabulario —y delegar lo detallado a `/to-spec`— evitó dos asunciones
  caras (tabla Activity propia, sistema de plugins) antes de que existiera
  código.

## Entrada: to-spec (cerrada)

- **Fecha / fase:** 2026-09-21 — Fase Spec, síntesis sin entrevista, fase cerrada
- **Objetivo:** Convertir las decisiones de `CONTEXT.md` + ADRs en una spec de
  MVP con comportamiento observable, precisa para tickets verticales sin
  nuevas decisiones fundamentales de producto.
- **Decisiones tomadas:**
  - Spec en `.scratch/nex-mvp/spec.md` con `Status: ready-for-agent`, usando
    el vocabulario del glosario y respetando ADR-0001 (stack) y ADR-0002
    (bordes).
  - Diferenciación explícita pedida: requisitos funcionales, reglas de
    dominio, seams, runtime, testing, out-of-scope, límites del MVP.
  - Ciclo de vida mínimo (crear, ver, actualizar, eliminar + cascada por la
    regla no-huérfanos) derivado de "gestionar" + Q4, no inventado como
    feature.
  - Technical Decision como registro estructurado (título, contexto,
    alternativas, razonamiento, estado, supersesión) pensado como materia
    prima de la futura capa de IA, sin construir IA en v1.
  - Activity como feed de solo lectura derivado en vivo; escribir activity es
    violación de spec.
  - 4 seams propuestos (persistencia, validación Zod, read-model de activity,
    shape estructurado de decisiones); repo greenfield, sin seams existentes
    que reutilizar.
- **Cambios en el repositorio:**
  - Creado `.scratch/nex-mvp/spec.md` (único archivo de la fase).
  - Actualizado este skill-log con la entrada de cierre.
- **Artefactos generados:** la spec (15 user stories; reglas testeables;
  out-of-scope blindado con los nos de v1).
- **Problemas o desacuerdos:**
  - `to-spec` también es `disable-model-invocation`; se ejecutó leyendo la
    skill por archivo y aplicando su proceso (síntesis sin entrevista,
    plantilla de la skill, publicación en el tracker local con
    `ready-for-agent`).
  - El check de seams con el usuario que pide la skill quedó como único punto
    abierto antes de `/to-tickets` (ver reporte), en vez de una ronda de
    preguntas.
  - Ningún desacuerdo de contenido: la spec solo deriva de decisiones ya
    tomadas; lo no decidido (transporte API vs server actions, campos exactos
    de UI) quedó explícitamente del lado de tickets/implementación.
- **Qué aprendimos del proceso:** la plantilla de la skill + las reglas del
  usuario se complementaron: la plantilla dio el esqueleto (stories,
  decisiones, testing, out-of-scope) y las reglas el filo (qué va en cada
  sección y qué está prohibido). El out-of-scope explícito funciona como
  candado contra el scope creep en la fase de tickets: un ticket que necesite
  una decisión no respondida vuelve a grilling en vez de colarse en la
  implementación.

## Entrada: tdd (aplicada dentro de implement 02-projects)

- **Fecha / fase:** 2026-09-21 — Dentro del Ticket 02, por slices verticales
- **Objetivo:** Construir el CRUD de Project en ciclos rojo→verde por slice,
  con los tests mandando sobre el código.
- **Decisiones tomadas:** orden validación (9 tests, rojo→verde) → repositorio
  (rojo por módulo ausente; verde pendiente de DB) → schema + migración
  generada sin DB → API → UI → fixes de review. El smoke test preexistente
  del Ticket 01 fijó la forma de `db` y `health` antes del código (TDD
  invertido por corte de sesión, pero el test mandó igual).
- **Cambios en el repositorio:** `tests/projects.validation.test.ts`,
  `tests/projects.repository.test.ts`, `tests/projects.api-id.test.ts`
  (documentados en la entrada de implement 02).
- **Artefactos generados:** 18 tests del ticket (11 verdes sin DB; resto con
  DB como oracle externo).
- **Problemas o desacuerdos:** el review se mantuvo en etapa separada, fuera
  del loop rojo→verde, y produjo fixes reales y baratos (ver entrada de
  code-review).
- **Qué aprendimos del proceso:** mockear `checkDb()` deja la rama degradada
  verde en cualquier entorno; los tests con DB quedan marcados y su oracle es
  la verificación externa, no el sandbox.

## Entrada: code-review (aplicada dentro de implement 01 y 02)

- **Fecha / fase:** 2026-09-21 — Cierre de los Tickets 01 y 02
- **Objetivo:** Revisar cada ticket en dos ejes (Standards: estándares del
  repo; Spec: fidelidad a lo que pedía el ticket) antes de darlo por hecho.
- **Decisiones tomadas (01):** 1 violación menor diferida a propósito
  ("Ticket" en la home, la evidencia externa citaba ese texto y el Ticket 02
  reemplazaba la home) + 1 smell registrado sin extraer (fallback de
  connection string duplicado); fix aplicado: `health.degraded.test.ts`.
  Parciales aceptados sin agregar nada: healthcheck a nivel Compose (el
  endpoint es lo que pide el ticket).
- **Decisiones tomadas (02):** Spec cumplido, cero creep; fix aplicado: id
  malformado 500→404 (`isProjectId()` + test). Standards: 0 violaciones
  duras; aplicados helper HTTP compartido, `notFound()` y re-export type-only
  de `Project`; aceptado `db.delete` en `beforeEach` como setup.
- **Cambios en el repositorio:** fixes listados arriba, más `## Comments` de
  cierre en cada ticket. Sin commits (regla vigente).
- **Artefactos generados:** reportes Standards + Spec por ticket, archivados
  en los tickets.
- **Problemas o desacuerdos:** sin commits no hay fixed point para `git diff`;
  se revisa el working tree (adaptación registrada). Los resultados de
  sub-agentes llegan truncados por el runtime; el texto íntegro se recuperó
  del `session.jsonl` del parent.
- **Qué aprendimos del proceso:** el review como etapa separada del loop
  TDD encuentra fixes baratos que el loop no ve (contratos 404, helpers
  compartidos, fugas de `@/db/*` a UI); diferir o registrar en vez de
  arreglar todo también es una decisión y queda escrita.

## Entrada: pasada de documentación y evidencia (fuera de skills, 2026-09-21)

- **Fecha / fase:** 2026-09-21 — Tarea independiente de los tickets
  funcionales; sin tocar código, APIs, DB ni tickets
- **Objetivo:** Dejar documentación profesional y trazabilidad lista como
  materia prima del blog técnico final.
- **Decisiones tomadas:**
  - `README.md` reescrito (qué es, problema, stack, arranque, Compose,
    migraciones, tests, typecheck/build, estructura, estado MVP, out of
    scope, sección Development Evidence). Cada afirmación anclada en archivos
    reales verificados en la pasada.
  - `CONTEXT.md` sin cambios: el glosario sigue vigente, nada quedó obsoleto.
  - `docs/adr/` sin cambios: ADR-0001 coincide con `package.json` +
    Compose; ADR-0002 coincide con schema (`tasks.project_id NOT NULL`),
    ausencia de storage de Activity y ausencia de plugins. Verificación
    registrada aquí en vez de ediciones innecesarias.
  - Nota de honestidad en README: la capa de Tasks existe en el working tree
    (tabla, migración `0001`, `lib/tasks/`, rutas API, tests) pero el Ticket
    03 sigue abierto y sin UI; los tickets mandan sobre el código a medio
    integrar.
- **Cambios en el repositorio:** solo `README.md` y este skill-log.
- **Problemas o desacuerdos:** ninguno; la pasada solo reorganiza hechos ya
  registrados en tickets y log.

## Entrada: implement 08-mvp-verify (cerrada 2026-09-21, verificación + TDD + code review)

- **Fecha / fase:** 2026-09-21 — Fase Implement, Ticket 08 con 01–07 en
  `done`; último ticket del MVP, verificación solamente (cero features por
  diseño)
- **Objetivo:** Demostrar que NEX Mission Control funciona integrado de
  punta a punta y que 01–07 cumplen el MVP del spec, sin refactors ni
  features nuevas.
- **Decisiones tomadas:**
  - Verificación con DB viva real: `docker compose up -d` bloqueado en
    sandbox (socket Docker denegado), así que se levantó PostgreSQL 18
    local en 127.0.0.1:5432 con las mismas credenciales/base (`nex`) y se
    aplicó el mismo schema vía `npm run db:push`. Diferencia honesta
    documentada en el ticket: versión del motor (18 vs 16-alpine), mismos
    DDL.
  - Defecto real corregido con cambio mínimo: la suite en paralelo fallaba
    12–15 tests rotando por archivo (`create returned null`). Loop de
    diagnosing-bugs (paralelo = rojo, `--maxWorkers=1` = 89/89 verde;
    hipótesis de pool/timing/schema falsadas) → causa: workers paralelos
    sobre una sola base + `beforeEach` que borra tablas. Fix solo-config:
    `fileParallelism: false` en `vitest.config.ts`. Sin commits no hay
    `git bisect`, la variable aislada fue el flag.
  - Nuevo `tests/mvp-verify.test.ts`: el recorrido de 20 pasos a nivel
    repositorios + derivación (el seam que UI/API usan), con `sleep(15)`
    siguiendo la convención de `activity.derive.test.ts`.
  - Reviews en dos sub-agentes paralelos (textos íntegros recuperados del
    `session.jsonl`). Spec: sin scope creep; 4 parciales, 2 agregados al
    test (list/update de Project, eventos `task:updated` y
    `documentation:created` en el feed), 2 documentados como verificación
    por corrida/estática (boot local, vista conjunta). Standards: 0
    violaciones duras; aplicados (comentario sin conteo que se pudre,
    cobertura extra); aceptado con motivo (duplicación `if (!x) throw`
    tolerada en journey test de un solo `it`).
  - `npm run dev`/`start` y `curl` local imposibles en sandbox
    (`uv_interface_addresses` bloqueado; proxy deniega HTTP a 127.0.0.1,
    sin rodeos). El click-through en navegador queda para verificación
    externa; cada seam que invocaría está verde con DB viva.
- **Cambios en el repositorio:**
  - Creados `tests/mvp-verify.test.ts` (+cobertura pedida por reviews).
  - Tocados `vitest.config.ts` (`fileParallelism: false` + comentario),
    `.scratch/nex-mvp/issues/08-mvp-verify.md` (`done` + `## Comments` con
    evidencia), `README.md` (tabla 08 a `done`, nota de honestidad,
    evidencia), este skill-log.
  - No tocados: dominio, API, UI, schema, migraciones. Sin commits (regla).
- **Artefactos generados:** recorrido E2E de 20 pasos + evidencia final;
  MVP completo 01–08 ✅.
- **Problemas o desacuerdos:** ninguno de contenido. El MVP termina acá:
  ninguna feature nueva después del cierre.
- **Qué aprendimos del proceso:** la "suite verde" como requisito de cierre
  es lo que pescó el bug de paralelismo: siete tickets verdes por separado
  nunca lo habrían visto porque cada archivo pasaba solo. El ticket de
  verificación no es ceremonia —es el único que corre todo junto. Y la
  distinción fallo-real vs limitación-entorno, sostenida desde el Ticket
  01, es lo que permite cerrar con honestidad sin Docker en el sandbox.
