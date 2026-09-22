import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// Project: the aggregate root everything else hangs off (CONTEXT.md,
// ADR-0002). Child tables (tasks, decisions, documentation) arrive with
// Tickets 03-05 and reference this table; cascade delete is Ticket 06.
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Project = typeof projects.$inferSelect;

// Task: a unit of work belonging to exactly one Project; never orphaned
// (CONTEXT.md, ADR-0002). Project delete cascades to its tasks
// (Ticket 06: ON DELETE CASCADE).
export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  status: text("status").notNull().default("open"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Task = typeof tasks.$inferSelect;

// Technical Decision: structured knowledge (title, context, considered
// alternatives, rationale, status, links) — seam 4. Every record belongs to
// exactly one Project; never orphaned. `supersededBy` is a plain reference
// (no FK): history links are enforced by the repository, and no silent
// DB-level rewrite may touch them. Project delete cascades (Ticket 06),
// including linked history: wholesale delete leaves no trace by design.
export const decisions = pgTable("decisions", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  context: text("context").notNull(),
  alternatives: text("alternatives").notNull(),
  rationale: text("rationale").notNull(),
  status: text("status").notNull().default("active"),
  supersededBy: uuid("superseded_by"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Decision = typeof decisions.$inferSelect;

// Documentation: written material belonging to exactly one Project
// (CONTEXT.md, ADR-0002). Never orphaned. Project delete cascades
// (Ticket 06: ON DELETE CASCADE).
export const documentation = pgTable("documentation", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Documentation = typeof documentation.$inferSelect;
