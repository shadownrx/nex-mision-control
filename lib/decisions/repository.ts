import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  decisions as decisionsTable,
  projects as projectsTable,
  type Decision,
} from "@/db/schema";

import {
  createDecisionSchema,
  updateDecisionSchema,
  type CreateDecisionInput,
  type UpdateDecisionInput,
} from "./validation";

// Thrown when a write would silently alter history: editing or deleting a
// superseded decision, or deleting a decision another one links to.
export class DecisionImmutableError extends Error {
  constructor(message = "Decision history is immutable") {
    super(message);
    this.name = "DecisionImmutableError";
  }
}

// Seam 1 for Technical Decisions: persistence goes through this interface
// only, scoped to the owning Project. `null` means "no such project/decision
// (or decision of another project)"; invalid input throws ZodError before any
// write; history violations throw DecisionImmutableError.
export interface DecisionRepository {
  listByProject(projectId: string): Promise<Decision[]>;
  getById(projectId: string, decisionId: string): Promise<Decision | null>;
  create(projectId: string, input: unknown): Promise<Decision | null>;
  update(
    projectId: string,
    decisionId: string,
    input: unknown,
  ): Promise<Decision | null>;
  remove(projectId: string, decisionId: string): Promise<Decision | null>;
}

function ownedCondition(projectId: string, decisionId: string) {
  return and(
    eq(decisionsTable.id, decisionId),
    eq(decisionsTable.projectId, projectId),
  );
}

async function projectExists(
  runner: Pick<typeof db, "select">,
  projectId: string,
): Promise<boolean> {
  const rows = await runner
    .select({ id: projectsTable.id })
    .from(projectsTable)
    .where(eq(projectsTable.id, projectId));
  return rows.length > 0;
}

export class DrizzleDecisionRepository implements DecisionRepository {
  async listByProject(projectId: string): Promise<Decision[]> {
    if (!(await projectExists(db, projectId))) return [];
    return db
      .select()
      .from(decisionsTable)
      .where(eq(decisionsTable.projectId, projectId));
  }

  async getById(
    projectId: string,
    decisionId: string,
  ): Promise<Decision | null> {
    const rows = await db
      .select()
      .from(decisionsTable)
      .where(ownedCondition(projectId, decisionId));
    return rows[0] ?? null;
  }

  async create(projectId: string, input: unknown): Promise<Decision | null> {
    const parsed: CreateDecisionInput = createDecisionSchema.parse(input);
    return db.transaction(async (tx) => {
      if (!(await projectExists(tx, projectId))) return null;

      let supersededBy: string | null = null;
      if (parsed.supersedes !== undefined) {
        const targets = await tx
          .select()
          .from(decisionsTable)
          .where(ownedCondition(projectId, parsed.supersedes));
        const target = targets[0];
        // Only an active decision of the same project can be superseded.
        if (!target || target.status !== "active") return null;
        supersededBy = parsed.supersedes;
      }

      const rows = await tx
        .insert(decisionsTable)
        .values({
          title: parsed.title,
          context: parsed.context,
          alternatives: parsed.alternatives,
          rationale: parsed.rationale,
          projectId,
        })
        .returning();
      const created = rows[0];
      if (!created) throw new Error("Decision insert returned no row");

      if (supersededBy !== null) {
        await tx
          .update(decisionsTable)
          .set({
            status: "superseded",
            supersededBy: created.id,
            updatedAt: new Date(),
          })
          .where(ownedCondition(projectId, supersededBy));
      }
      return created;
    });
  }

  async update(
    projectId: string,
    decisionId: string,
    input: unknown,
  ): Promise<Decision | null> {
    const parsed: UpdateDecisionInput = updateDecisionSchema.parse(input);
    const current = await this.getById(projectId, decisionId);
    if (!current) return null;
    if (current.status !== "active") {
      throw new DecisionImmutableError(
        "Superseded decisions are immutable; create a new one that supersedes it",
      );
    }
    const rows = await db
      .update(decisionsTable)
      .set({ ...parsed, updatedAt: new Date() })
      .where(ownedCondition(projectId, decisionId))
      .returning();
    return rows[0] ?? null;
  }

  async remove(
    projectId: string,
    decisionId: string,
  ): Promise<Decision | null> {
    const current = await this.getById(projectId, decisionId);
    if (!current) return null;
    if (current.status !== "active") {
      throw new DecisionImmutableError(
        "Superseded decisions are immutable history",
      );
    }
    const linked = await db
      .select({ id: decisionsTable.id })
      .from(decisionsTable)
      .where(
        and(
          eq(decisionsTable.projectId, projectId),
          eq(decisionsTable.supersededBy, decisionId),
        ),
      );
    if (linked.length > 0) {
      throw new DecisionImmutableError(
        "Decisions linked by a supersession cannot be deleted",
      );
    }
    const rows = await db
      .delete(decisionsTable)
      .where(ownedCondition(projectId, decisionId))
      .returning();
    return rows[0] ?? null;
  }
}

export const decisions: DecisionRepository = new DrizzleDecisionRepository();
