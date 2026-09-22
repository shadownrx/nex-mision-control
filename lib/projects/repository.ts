import { eq } from "drizzle-orm";

import { db } from "@/db";
import { projects as projectsTable, type Project } from "@/db/schema";

import {
  createProjectSchema,
  updateProjectSchema,
  type CreateProjectInput,
  type UpdateProjectInput,
} from "./validation";

// Seam 1: persistence goes through this interface only. Drizzle/PostgreSQL
// sits behind it; callers (API, UI, activity derivation) never import the
// schema or the db client directly. Validation (seam 2) is enforced here, so
// no input reaches persistence unvalidated regardless of caller.
export interface ProjectRepository {
  list(): Promise<Project[]>;
  getById(id: string): Promise<Project | null>;
  create(input: unknown): Promise<Project>;
  update(id: string, input: unknown): Promise<Project | null>;
  remove(id: string): Promise<Project | null>;
}

export class DrizzleProjectRepository implements ProjectRepository {
  async list(): Promise<Project[]> {
    return db.select().from(projectsTable);
  }

  async getById(id: string): Promise<Project | null> {
    const rows = await db
      .select()
      .from(projectsTable)
      .where(eq(projectsTable.id, id));
    return rows[0] ?? null;
  }

  async create(input: unknown): Promise<Project> {
    const parsed: CreateProjectInput = createProjectSchema.parse(input);
    const rows = await db.insert(projectsTable).values(parsed).returning();
    const row = rows[0];
    if (!row) throw new Error("Project insert returned no row");
    return row;
  }

  async update(id: string, input: unknown): Promise<Project | null> {
    const parsed: UpdateProjectInput = updateProjectSchema.parse(input);
    const rows = await db
      .update(projectsTable)
      .set({ ...parsed, updatedAt: new Date() })
      .where(eq(projectsTable.id, id))
      .returning();
    return rows[0] ?? null;
  }

  async remove(id: string): Promise<Project | null> {
    const rows = await db
      .delete(projectsTable)
      .where(eq(projectsTable.id, id))
      .returning();
    return rows[0] ?? null;
  }
}

export const projects: ProjectRepository = new DrizzleProjectRepository();
