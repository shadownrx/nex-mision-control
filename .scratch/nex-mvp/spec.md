# Spec: NEX Mission Control MVP (v1)

Status: ready-for-agent

Source decisions: `CONTEXT.md`, `docs/adr/0001-v1-stack.md`,
`docs/adr/0002-v1-domain-boundaries.md`. Nothing below adds features beyond
what those documents settle.

## Problem Statement

As a solo developer, I keep projects, tasks, technical decisions, docs, and
what-happened-lately scattered across tools that do not relate them to each
other. I want one local place where these five concepts are represented
together, minimally but correctly related, so I can see the state of each
personal project at a glance.

## Solution

A local-first, single-user web app (Next.js + TypeScript + PostgreSQL via
Docker Compose) that represents Projects, Tasks, Technical Decisions, and
Documentation as minimal persisted records hanging off a Project, plus an
Activity view derived live from those records. Clean schema and modular seams
keep plugin systems, user-defined entities, auth, and deployment out of v1
while leaving room to add them later without a rewrite.

## User Stories

1. As a solo developer, I want to create a project, so that I have an anchor
   for its tasks, decisions, docs, and activity.
2. As a solo developer, I want to list my projects, so that I can pick one to
   look at.
3. As a solo developer, I want to view a project with its tasks, decisions,
   docs, and activity together, so that I see its full state in one place.
4. As a solo developer, I want to rename a project and edit its description,
   so that the representation stays accurate as the work evolves.
5. As a solo developer, I want to delete a project including everything that
   belongs to it, so that abandoned work disappears without leaving orphans.
6. As a solo developer, I want to add a task to a project, so that the work
   ahead is visible.
7. As a solo developer, I want to change a task's state (open/done), so that
   progress is recorded.
8. As a solo developer, I want to edit and delete a task, so that the task
   list stays truthful with minimum ceremony.
9. As a solo developer, I want to record a technical decision with its
   context, the alternatives I considered, and my reasoning, so that the
   knowledge survives beyond my memory.
10. As a solo developer, I want to revisit a past decision and see its full
    context (not just the outcome), so that I can judge whether it still holds.
11. As a solo developer, I want to mark a decision as superseded by a newer
    one, so that decision history stays honest without rewriting the past.
12. As a solo developer, I want to attach documentation to a project, so that
    explanations live next to the work they describe.
13. As a solo developer, I want to edit and delete documentation, so that it
    does not go stale.
14. As a solo developer, I want to see a project's activity as a
    reverse-chronological feed, so that I know what happened lately without
    maintaining a separate log.
15. As a solo developer, I want to start the whole app locally with one
    documented command set (app plus PostgreSQL via Docker Compose), so that
    v1 needs no deploy target or cloud account.

## Implementation Decisions

### Functional requirements (observable behavior)

- Project: create, list, view-detail (with children + activity), update
  (name/description), delete with cascade to everything it owns.
- Task: create under a project, list within the project, change state
  (open/done), update, delete.
- Technical Decision: record under a project with title, context, considered
  alternatives, and rationale; view full record; mark superseded (linking the
  superseding decision); update and delete before it matters, supersede after.
- Documentation: create under a project (title + body), view, update, delete.
- Activity: read-only feed per project, reverse-chronological, derived live
  from create/update/state-change/supersede events of the four stored
  entities. No create/edit/delete UI of its own.

### Domain rules (from CONTEXT.md and ADR-0002, restated as checks)

- Every Task, Technical Decision, and Documentation item belongs to exactly
  one Project; orphans are rejected, not stored.
- Deleting a Project deletes everything belonging to it (follows from the
  no-orphans rule).
- Activity is never written directly; any write path that stores activity
  separately is a spec violation.
- Single-user: no ownership or permission checks anywhere in v1.
- A Technical Decision record is incomplete without context, considered
  alternatives, and rationale. The record shape is the future AI layer's raw
  material: structured (separate fields, not one blob) so later work can feed
  decisions as context without re-parsing prose.

### Seams (highest possible, few)

1. **Persistence seam**: one repository interface per aggregate
   (Project with its Tasks, Decisions, Documentation). Drizzle/PostgreSQL sits
   behind it, so storage can evolve without touching behavior.
2. **Validation seam**: a single Zod boundary validates every input mutation.
   Nothing reaches persistence unvalidated.
3. **Activity read-model seam**: one derivation function turns entity
   changes into the activity feed. It reads through the repositories and owns
   no storage, which is what makes "no Activity table" enforceable.
4. **Decision-knowledge seam**: decision records are stored field-structured
   (title, context, alternatives, rationale, status, links). No AI is built in
   v1; the seam is the shape of the data, ready to be consumed later.

### Runtime

- Local-first: Next.js app plus PostgreSQL via Docker Compose. No deploy
  target, no cloud dependency, no infra beyond Compose in v1.

## Testing Decisions

- Framework: Vitest, per ADR-0001. Greenfield repo: no prior art to follow.
- Test external behavior only, never implementation details: behavior at the
  repository interfaces, the Zod boundary, and the activity derivation
  function — not SQL strings, not component internals.
- What gets tested: the no-orphans rejection, project cascade delete,
  decision-record completeness (missing context/alternatives/rationale is
  rejected), activity derivation (each entity change surfaces in the feed in
  order; nothing is stored by the feed itself), and the single validation
  boundary (invalid input never reaches persistence).

## Out of Scope

Exactly the v1 nos, restated so tickets cannot smuggle them back in:

- Auth, login, multi-user, multi-tenant, and any permission model.
- Plugin systems, user-defined entities, marketplaces, dynamic architecture.
- Deployment targets, hosting, CI/CD, and any infrastructure beyond local
  Docker Compose.
- External integrations (GitHub, editors, notifications, third-party APIs).
- Full-text search, comments, attachments, task assignment, due dates,
  dashboards, and any other feature not listed under Functional requirements.
- Any AI layer: v1 only keeps decision data structured enough to serve as
  future context.

## Further Notes

- MVP limits: this spec is the whole v1. A ticket that needs a product call
  not answered here (new entity, new state, new surface) is out of scope for
  the ticket — it goes back to grilling, not into the implementation.
- Evolution path, deliberately unbuilt (see ADR-0002 consequences): auth later (single-user shape makes
  ownership addable), stored activity later (seam 3 isolates the migration),
  plugins later (seams 1–2 are the extension points).
- Process record: `docs/process/skill-log.md`.
