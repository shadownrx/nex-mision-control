# 01: Foundation local-first

**ID:** 01-foundation

**Objetivo:** Dejar el proyecto corriendo en local con base de datos conectada
y suite de tests verde, sin código de dominio todavía.

**Comportamiento observable:** con el set de comandos documentado, levanta
PostgreSQL en Docker Compose y la app Next.js; la app confirma conectividad
con la base (healthcheck); `vitest run` termina en verde con un smoke test.

**Blocked by:** None (can start immediately).

**Status:** done

**Seams:** ninguno todavía; este ticket crea la base sobre la que se montan
los seams 1–3.

**Tests esperados:** un smoke test de comportamiento (arranque + conectividad
DB + runner verde). Nada de detalles de implementación.

**Referencias:** spec Runtime y story 15; ADR-0001 (stack).

- [x] `docker compose up` + app + healthcheck DB funcionan con comandos documentados
- [x] `vitest run` verde con smoke test
- [x] Cero código de dominio (solo fundación)

## Comments

### Cierre 2026-09-21 (verificación externa + code review)

**Evidencia externa (manual, fuera del sandbox):** `docker compose up -d` OK;
PostgreSQL `16-alpine` descargada; network `nex-mision-control_default`
creada; volume `nex-mision-control_pgdata` creado; container
`nex-mision-control-db-1` iniciado; Next.js responde en localhost con
"NEX Mission Control" / "Foundation local-first — Ticket 01.". Esto confirma
que el `uv_interface_addresses` visto en el sandbox era limitación del
sandbox, no fallo del foundation.

**Code review (dos ejes, sub-agentes en paralelo, sobre working tree — sin
commits todavía no hay fixed point para `git diff`):**

- *Standards:* 1 violación dura menor — `app/page.tsx:5` expone jerga de
  tracker ("Ticket 01"; CONTEXT.md: en Task evitar "Ticket, issue"). Se deja
  como está a propósito: el texto es el que cita la evidencia externa y la
  home se reemplaza en el Ticket 02 con la UI real de Projects. 1 smell menor
  real — fallback del connection string duplicado en `db/index.ts:7` y
  `drizzle.config.ts:8-10`; se registra, sin extraer todavía (churn mínimo).
- *Spec:* sin scope creep (`db/schema.ts` declara cero tablas, `zod` sin uso
  es stack ADR-0001, no creep). Dos parciales: (1) L24 — compose levanta solo
  `db`, sin `healthcheck:` a nivel Compose ni servicio `app`; el healthcheck
  que confirma conectividad es el endpoint, que es lo que pide el ticket, así
  que se cierra sin agregar nada; (2) L19-20 — la rama 503 no estaba testeada.
  Fix aplicado en el cierre: `tests/health.degraded.test.ts` (mockea
  `checkDb()` a `false`, aserta 503 + `{status:"ok",database:"down"}`; verde
  con y sin DB). Observaciones menores sin cambio: `checkDb()` no loguea el
  error, puerto `5432:5432` fijo en compose.

**Nota de vocabulario:** los cinco roles canónicos de triage no tienen estado
terminal; se usa `done` como marcador de cierre en este tracker.

**Verde en sandbox:** `typecheck` OK; `tests/health.degraded.test.ts` OK
(1 test). `tests/health.smoke.test.ts` requiere DB viva: rojo honesto en
sandbox (ECONNREFUSED), verde en la verificación externa del usuario.
