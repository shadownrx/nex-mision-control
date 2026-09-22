# V1 stack: Next.js + TypeScript + PostgreSQL + Drizzle + Zod + Vitest + Tailwind

NEX Mission Control v1 is a single-user typed web app with a relational model.
We lock this stack as a v1 choice, not as a claim that it is universally best.

## Considered Options

- Another full-stack framework or a separate frontend/backend split instead of Next.js.
- Another ORM, a query builder, or handwritten SQL instead of Drizzle.
- Another validation library instead of Zod; another runner instead of Vitest;
  another styling approach instead of Tailwind.

## Consequences

Reversibility differs per part: PostgreSQL plus the Drizzle schema is the
hardest to reverse once real data exists; Next.js is medium cost to leave;
Zod, Vitest, and Tailwind are the easiest to swap later.
