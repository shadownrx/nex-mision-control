import { z } from "zod";

// Seam 2: single Zod boundary for every Project mutation. Nothing reaches
// persistence without passing one of these schemas (enforced inside the
// repository, so API and UI share the same gate).
const nameField = z.string().trim().min(1).max(200);
const descriptionField = z.string().trim().max(2000);

export const createProjectSchema = z.object({
  name: nameField,
  description: descriptionField.default(""),
});

export const updateProjectSchema = z
  .object({
    name: nameField.optional(),
    description: descriptionField.optional(),
  })
  .refine((v) => v.name !== undefined || v.description !== undefined, {
    message: "At least one field must be provided",
  });

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

// Re-exported here (type-only, erased at compile) so UI and API reference
// the domain type through the seams, never `@/db/schema` directly.
export type { Project } from "@/db/schema";
