import { z } from "zod";

// Seam 2 for Tasks: single Zod boundary for every Task mutation, enforced
// inside the task repository. New tasks are always open; status only changes
// through update.
const titleField = z.string().trim().min(1).max(200);
const statusField = z.enum(["open", "done"]);

export const createTaskSchema = z
  .object({
    title: titleField,
  })
  .strict();

export const updateTaskSchema = z
  .object({
    title: titleField.optional(),
    status: statusField.optional(),
  })
  .strict()
  .refine((v) => v.title !== undefined || v.status !== undefined, {
    message: "At least one field must be provided",
  });

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskStatus = z.infer<typeof statusField>;

// Re-exported here (type-only, erased at compile) so API/UI reference the
// domain type through the seams, never `@/db/schema` directly.
export type { Task } from "@/db/schema";
