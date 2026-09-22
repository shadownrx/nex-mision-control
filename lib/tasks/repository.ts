import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { projects as projectsTable, tasks as tasksTable, type Task } from "@/db/schema";

import {
  createTaskSchema,
  updateTaskSchema,
  type CreateTaskInput,
  type UpdateTaskInput,
} from "./validation";

// Seam 1 for Tasks: persistence goes through this interface only, scoped to
// the owning Project. `null` means "no such project/task (or task of another
// project)"; invalid input throws ZodError before any write.
export interface TaskRepository {
  listByProject(projectId: string): Promise<Task[]>;
  getById(projectId: string, taskId: string): Promise<Task | null>;
  create(projectId: string, input: unknown): Promise<Task | null>;
  update(
    projectId: string,
    taskId: string,
    input: unknown,
  ): Promise<Task | null>;
  remove(projectId: string, taskId: string): Promise<Task | null>;
}

function owned(projectId: string, taskId: string) {
  return and(
    eq(tasksTable.id, taskId),
    eq(tasksTable.projectId, projectId),
  );
}

export class DrizzleTaskRepository implements TaskRepository {
  async listByProject(projectId: string): Promise<Task[]> {
    const project = await db
      .select({ id: projectsTable.id })
      .from(projectsTable)
      .where(eq(projectsTable.id, projectId));
    if (project.length === 0) return [];
    return db
      .select()
      .from(tasksTable)
      .where(eq(tasksTable.projectId, projectId));
  }

  async getById(projectId: string, taskId: string): Promise<Task | null> {
    const rows = await db
      .select()
      .from(tasksTable)
      .where(owned(projectId, taskId));
    return rows[0] ?? null;
  }

  async create(projectId: string, input: unknown): Promise<Task | null> {
    const parsed: CreateTaskInput = createTaskSchema.parse(input);
    const project = await db
      .select({ id: projectsTable.id })
      .from(projectsTable)
      .where(eq(projectsTable.id, projectId));
    if (project.length === 0) return null;
    try {
      const rows = await db
        .insert(tasksTable)
        .values({ ...parsed, projectId })
        .returning();
      const row = rows[0];
      if (!row) throw new Error("Task insert returned no row");
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
    taskId: string,
    input: unknown,
  ): Promise<Task | null> {
    const parsed: UpdateTaskInput = updateTaskSchema.parse(input);
    const rows = await db
      .update(tasksTable)
      .set({ ...parsed, updatedAt: new Date() })
      .where(owned(projectId, taskId))
      .returning();
    return rows[0] ?? null;
  }

  async remove(projectId: string, taskId: string): Promise<Task | null> {
    const rows = await db
      .delete(tasksTable)
      .where(owned(projectId, taskId))
      .returning();
    return rows[0] ?? null;
  }
}

export const tasks: TaskRepository = new DrizzleTaskRepository();
