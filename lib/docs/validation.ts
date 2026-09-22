import { z } from "zod";

// Seam 2 for Documentation: single Zod boundary for every mutation,
// enforced inside the documentation repository.
const titleField = z.string().trim().min(1).max(200);
const bodyField = z.string().trim().min(1).max(20000);

export const createDocumentationSchema = z
  .object({
    title: titleField,
    body: bodyField,
  })
  .strict();

export const updateDocumentationSchema = z
  .object({
    title: titleField.optional(),
    body: bodyField.optional(),
  })
  .strict()
  .refine((v) => v.title !== undefined || v.body !== undefined, {
    message: "At least one field must be provided",
  });

export type CreateDocumentationInput = z.infer<
  typeof createDocumentationSchema
>;
export type UpdateDocumentationInput = z.infer<
  typeof updateDocumentationSchema
>;

// Re-exported here (type-only, erased at compile) so API/UI reference the
// domain type through the seams, never `@/db/schema` directly.
export type { Documentation } from "@/db/schema";
