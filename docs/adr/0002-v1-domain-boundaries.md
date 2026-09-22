# V1 domain boundaries: everything belongs to a Project, Activity is derived

In v1 every Task, Technical Decision, and Documentation item belongs to exactly
one Project; orphaned entities do not exist. Activity is not stored on its own:
it is a view derived from the other entities. There is no plugin system, no
user-defined entities, and no dynamic architecture in v1; extensibility means a
clean schema with modular seams so those can be added later without a rewrite.

## Considered Options

- Allowing orphaned Tasks, Decisions, or Documentation outside a Project.
- Storing Activity as its own persisted entity alongside the others.
- Building plugin or user-defined-entity infrastructure in v1.

## Consequences

Moving from derived to stored Activity later, or allowing orphans, means a
data-model migration; keeping the seams clean now is what keeps that migration
cheap. Local-first running (Next.js plus PostgreSQL via Docker Compose, no
deploy target) stays out of this decision on purpose until the MVP is validated.
