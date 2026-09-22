# NEX Mission Control

Aplicación web single-user y local-first para representar los proyectos
técnicos de una persona junto con sus tareas, decisiones técnicas,
documentación y actividad, todo relacionado en un solo lugar.

## Qué problema resuelve

Como desarrollador solo, los proyectos, las tareas, las decisiones técnicas,
la documentación y lo que pasó últimamente viven dispersos en herramientas
que no los relacionan entre sí. NEX Mission Control es el lugar local donde
esos cinco conceptos se representan juntos, relacionados de forma mínima
pero correcta, para ver el estado de cada proyecto personal de un vistazo
(spec: `.scratch/nex-mvp/spec.md`).

## Stack

Decisión registrada en `docs/adr/0001-v1-stack.md` (lock de stack para v1,
no afirmación universal):

| Capa       | Tecnología                                  |
| ---------- | ------------------------------------------- |
| App        | Next.js 15 + React 19 + TypeScript          |
| Base       | PostgreSQL 16 (`postgres:16-alpine`)        |
| Acceso     | Drizzle ORM (`drizzle-orm` + `drizzle-kit`) |
| Validación | Zod (frontera única por mutación)           |
| Tests      | Vitest                                      |
| Estilos    | Tailwind CSS v4                             |

## Arranque local

Requiere Node 20+ y Docker.

```bash
docker compose up -d   # PostgreSQL en localhost:5432 (usuario/clave/db: nex)
cp .env.example .env   # si todavía no existe .env
npm install
npm run db:push        # aplica el schema Drizzle a la base
npm run dev            # app en http://localhost:3000
curl http://localhost:3000/api/health
```

`GET /api/health` responde `{ "status": "ok", "database": "up" }` cuando
PostgreSQL responde a `SELECT 1`, y 503 `{ "status": "ok", "database": "down" }`
cuando no hay base: el degradado se ve en la propia respuesta, nunca como
éxito silencioso.

### PostgreSQL con Docker Compose

`docker-compose.yml` levanta un único servicio `db` (`postgres:16-alpine`,
credenciales `nex`/`nex`, base `nex`, puerto `5432:5432`, datos persistidos
en el volumen `pgdata`). La app se conecta con `DATABASE_URL`
(`.env.example`: `postgres://nex:nex@localhost:5432/nex`); sin esa variable
el código usa el mismo valor como fallback local (`db/index.ts`,
`drizzle.config.ts`).

### Schema / migraciones

```bash
npm run db:generate  # genera SQL en drizzle/ desde db/schema.ts
npm run db:push      # aplica el schema directo a la base (flujo local del MVP)
```

Las migraciones generadas viven en `drizzle/` (`0000_projects.sql`,
`0001_tasks.sql`, más `drizzle/meta/`). Después de levantar la base por
primera vez (o tras agregar una tabla), `npm run db:push` es obligatorio:
sin ese paso las tablas no existen y los tests de repositorio fallan.

### Tests

```bash
npm test  # vitest run
```

`tests/setup.ts` carga `.env`, así que la suite apunta a la base local.
Dos grupos:

- **Sin base:** validación Zod, manejo de ids (`*.validation.test.ts`,
  `*.api-id.test.ts`) y rama degradada (`health.degraded.test.ts`, mockea
  `checkDb()`).
- **Con base viva:** repositorios y smoke de salud
  (`*.repository.test.ts`, `health.smoke.test.ts`). Sin PostgreSQL fallan
  de forma honesta con `ECONNREFUSED`, no es un bug: levantá la base y
  corré `npm run db:push` primero.

Los tests cubren comportamiento en las interfaces (repositorios, frontera
Zod, endpoints), nunca detalles de implementación (sin SQL ni componentes
internos).

### Typecheck / build

```bash
npm run typecheck  # tsc --noEmit
npm run build      # next build
```

## Estructura del proyecto

```text
app/
  page.tsx                        # / — lista de Projects + crear
  projects/[id]/page.tsx          # /projects/[id] — detalle + editar + eliminar
  api/health/route.ts             # GET /api/health (200/503 según la base)
  api/projects/route.ts           # GET/POST /api/projects
  api/projects/[id]/route.ts      # GET/PATCH/DELETE /api/projects/[id]
  api/projects/[id]/tasks/…       # GET/POST y GET/PATCH/DELETE de Tasks
  api/projects/[id]/decisions/…  # GET/POST y GET/PATCH/DELETE de Decisions
  api/projects/[id]/docs/…       # GET/POST y GET/PATCH/DELETE de Documentation
  api/projects/[id]/activity/…  # GET feed derivado, solo lectura
  layout.tsx · globals.css · console-clock.tsx
lib/
  projects/  validation.ts · repository.ts · http.ts   # seams 1 y 2
  tasks/     validation.ts · repository.ts             # seams 1 y 2
  decisions/ validation.ts · repository.ts             # seams 1, 2 y 4
  docs/      validation.ts · repository.ts             # seams 1 y 2
  activity/  derive.ts  # seam 3: read-model sin storage, lee repositorios
db/
  index.ts    # cliente + checkDb()
  schema.ts   # tablas projects, tasks, decisions, documentation
drizzle/      # migraciones generadas + meta
tests/        # Vitest por comportamiento
docs/
  adr/        # decisiones de arquitectura
  agents/     # cómo usan este repo las engineering skills
  process/    # skill-log.md — trazabilidad del proceso
.scratch/nex-mvp/
  spec.md     # spec del MVP (Status: ready-for-agent)
  issues/     # 8 tickets trazadores con blocking edges
CONTEXT.md    # glosario de dominio (Project, Task, Technical Decision,
              # Documentation, Activity)
```

Reglas de arquitectura vigentes: persistencia solo vía repositorios
(`ProjectRepository`, `TaskRepository`, `DecisionRepository`,
`DocumentationRepository`), validación
Zod única dentro de cada mutación del repositorio, la UI/API nunca referencia
`@/db/*` (tipos re-exportados type-only desde `lib/*/validation`), toda Task,
toda Technical Decision y todo Documentation pertenece a exactamente un
Project (FKs NOT NULL, sin huérfanos), y la historia de decisiones es
inmutable una vez enlazada (superseded no se edita ni se borra; 409 en la
API), y Activity es un read-model derivado en vivo sin storage propio
(`getProjectActivity` lee los repositorios; lo borrado desaparece del feed).

## Estado actual del MVP

| Ticket | Alcance                              | Estado           |
| ------ | ------------------------------------ | ---------------- |
| 01     | Foundation local-first               | `done`           |
| 02     | Projects CRUD + seams 1 y 2          | `done`           |
| 03     | Tasks del proyecto                   | `done`           |
| 04     | Technical Decisions + supersesión    | `done`           |
| 05     | Documentation del proyecto           | `done`           |
| 06     | Borrado en cascada                   | `done`           |
| 07     | Activity feed derivado               | `done`           |
| 08     | Verificación MVP punta a punta       | `done`           |

Detalle por ticket en `.scratch/nex-mvp/issues/` (no modificar: son el
tracker vigente).

Nota de honestidad sobre el working tree: los tickets mandan sobre el
código. Tickets 01–08 cerrados con `## Comments` (el MVP está completo).
UI de Tasks, Decisions, Documentation y Activity integrada en
`/projects/[id]`; suite verificada con DB viva en el Ticket 08
(`npm test`: 20 archivos, 90 tests en verde; `typecheck` y `build` verdes).
`docker compose up -d`, `npm run dev`/`start` y `curl` local no corren en
el sandbox (socket Docker denegado, `uv_interface_addresses` bloqueado,
proxy sin HTTP a 127.0.0.1): limitaciones del entorno documentadas en el
ticket 08, no fallos; la base usada para verificar es PostgreSQL local con
el mismo schema y credenciales que Compose levantaría.

## Fuera de scope (v1)

De la spec, sección Out of Scope: auth, login, multi-usuario y cualquier
permiso; plugins, entidades definidas por el usuario, marketplaces;
deploy, hosting, CI/CD e infraestructura más allá del Compose local;
integraciones externas; búsqueda full-text, comentarios, adjuntos,
asignación, vencimientos, dashboards; y cualquier capa de IA (v1 solo deja
los datos de decisiones con forma estructurada para consumirlos después).

## Development Evidence

Hechos del proceso de desarrollo, respaldados por el repo y sus docs
(fuente principal: `docs/process/skill-log.md` y los `## Comments` de cada
ticket; nada de lo de abajo es reconstrucción inventada):

- **Docker Compose para PostgreSQL.** La base local vive en Compose desde
  el Ticket 01 (`postgres:16-alpine`, network + volumen creados). La
  verificación externa del usuario confirmó container, network y volumen
  funcionando con Next.js respondiendo en localhost (ticket 01, `## Comments`).
- **Permisos de Docker en sandbox.** El sandbox deniega el socket Docker
  (`EPERM` en `docker compose up -d`); la salida documentada es pedir
  re-ejecución con red habilitada o correrlo fuera del sandbox. De la misma
  forma, `npm run dev` no levanta dentro del sandbox (Next.js muere en
  `uv_interface_addresses` porque el entorno bloquea enumerar interfaces).
  Ambas son limitaciones del entorno, no fallos del proyecto, y así quedaron
  registradas.
- **`npm run db:push` obligatorio.** Los checklists de verificación de los
  tickets 01 y 02 lo ponen como paso explícito (`compose up → db:push →
  tests → dev → recorrido UI`). Sin push, la suite de repositorio falla
  porque las tablas no existen.
- **Sandbox vs. entorno local.** En sandbox solo lo independiente de DB es
  verificable (`typecheck`, validación, api-id, rama degradada). Lo que
  necesita PostgreSQL queda en "rojo honesto" (`ECONNREFUSED` verificado
  como causa, no como bug) y su oracle es la verificación externa con base
  viva. El endpoint de salud y el test degradado mockeado existen justamente
  para que el degradado sea observable en cualquier entorno.
- **Decisiones de code reviews.** Cada ticket implementado se revisó en dos
  ejes (Standards + Spec) sobre el working tree —sin commits no hay punto
  fijo para `git diff`, adaptación registrada en los tickets—. Decisiones
  reales aplicadas: rama 503 sin test → creado `health.degraded.test.ts`;
  id malformado que devolvía 500 → 404 con `isProjectId()` + test;
  helpers HTTP compartidos en `lib/projects/http.ts`; `Project` re-exportado
  type-only para que UI/API no toquen `@/db/*`; `db.delete` en `beforeEach`
  aceptado como setup (el repo no expone "borrar todo" por diseño); límites
  `name` 1–200 / `description` máx. 2000 como decisión de implementación.
  Conveciones adoptadas: `done` como marcador de cierre (los cinco roles de
  triage no tienen estado terminal) y "Ticket" permitido en tracker/comentarios
  aunque el glosario lo evita en dominio.
- **Trazabilidad del proceso.** Cada fase dejó paper trail antes de avanzar:
  `CONTEXT.md` + 2 ADRs (grilling), `spec.md` (spec), 8 tickets con blocking
  edges (tickets), `## Comments` de cierre con evidencia (implementación).
  El log completo está en `docs/process/skill-log.md` y es la materia prima
  del blog técnico.
- **Cierre del MVP (Ticket 08).** La suite en paralelo flakeaba (12–15
  fallos rotando por archivo, `create returned null`): workers paralelos
  sobre una sola base + `beforeEach` que borra tablas. Fix solo-config:
  `fileParallelism: false` en `vitest.config.ts`. `tests/mvp-verify.test.ts`
  recorre crear → usar → ver-feed → borrar sin huérfanos (20 pasos) a nivel
  repositorios + derivación. Final: `npm test` 20 archivos / 90 tests verde,
  `typecheck` y `build` verdes. Evidencia completa en el ticket 08.
