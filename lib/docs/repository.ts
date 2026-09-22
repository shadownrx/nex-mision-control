import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  documentation as documentationTable,
  projects as projectsTable,
  type Documentation,
} from "@/db/schema";

import {
  createDocumentationSchema,
  updateDocumentationSchema,
  type CreateDocumentationInput,
  type UpdateDocumentationInput,
} from "./validation";

// Seam 1 for Documentation: persistence goes through this interface only,
// scoped to the owning Project. `null` means "no such project/document (or
// document of another project)"; invalid input throws ZodError before any
// write.
export interface DocumentationRepository {
  listByProject(projectId: string): Promise<Documentation[]>;
  getById(projectId: string, documentationId: string): Promise<Documentation | null>;
  create(projectId: string, input: unknown): Promise<Documentation | null>;
  update(
    projectId: string,
    documentationId: string,
    input: unknown,
  ): Promise<Documentation | null>;
  remove(projectId: string, documentationId: string): Promise<Documentation | null>;
}

function ownedCondition(projectId: string, documentationId: string) {
  return and(
    eq(documentationTable.id, documentationId),
    eq(documentationTable.projectId, projectId),
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

export class DrizzleDocumentationRepository
  implements DocumentationRepository
{
  async listByProject(projectId: string): Promise<Documentation[]> {
    if (!(await projectExists(db, projectId))) return [];
    return db
      .select()
      .from(documentationTable)
      .where(eq(documentationTable.projectId, projectId));
  }

  async getById(
    projectId: string,
    documentationId: string,
  ): Promise<Documentation | null> {
    const rows = await db
      .select()
      .from(documentationTable)
      .where(ownedCondition(projectId, documentationId));
    return rows[0] ?? null;
  }

  async create(
    projectId: string,
    input: unknown,
  ): Promise<Documentation | null> {
    const parsed: CreateDocumentationInput =
      createDocumentationSchema.parse(input);
    if (!(await projectExists(db, projectId))) return null;
    try {
      const rows = await db
        .insert(documentationTable)
        .values({ ...parsed, projectId })
        .returning();
      const row = rows[0];
      if (!row) throw new Error("Documentation insert returned no row");
      return row;
    } catch (err) {
      // The project vanished between the check and the insert: the FK is
      // the final enforcer of no-orphans, mapped back to null.
      if (
        typeof err === "object" &&
        err !== null &&
        "code" in err &&
        (err as { code?: unknown }).code === "23503"
      ) {
        return null;
      }
      throw err;
    }
  }

  async update(
    projectId: string,
    documentationId: string,
    input: unknown,
  ): Promise<Documentation | null> {
    const parsed: UpdateDocumentationInput =
      updateDocumentationSchema.parse(input);
    const rows = await db
      .update(documentationTable)
      .set({ ...parsed, updatedAt: new Date() })
      .where(ownedCondition(projectId, documentationId))
      .returning();
    return rows[0] ?? null;
  }

  async remove(
    projectId: string,
    documentationId: string,
  ): Promise<Documentation | null> {
    const rows = await db
      .delete(documentationTable)
      .where(ownedCondition(projectId, documentationId))
      .returning();
    return rows[0] ?? null;
  }
}

export const docs: DocumentationRepository =
  new DrizzleDocumentationRepository();
