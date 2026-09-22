import { z } from "zod";

// Seam 2 for Technical Decisions: single Zod boundary for every mutation,
// enforced inside the decision repository. Records are born complete and
// active; status only changes through supersession (seam 4 shape).
const titleField = z.string().trim().min(1).max(200);
const bodyField = z.string().trim().min(1).max(5000);

export const createDecisionSchema = z
  .object({
    title: titleField,
    context: bodyField,
    alternatives: bodyField,
    rationale: bodyField,
    supersedes: z.string().uuid().optional(),
  })
  .strict();

export const updateDecisionSchema = z
  .object({
    title: titleField.optional(),
    context: bodyField.optional(),
    alternatives: bodyField.optional(),
    rationale: bodyField.optional(),
  })
  .strict()
  .refine(
    (v) =>
      v.title !== undefined ||
      v.context !== undefined ||
      v.alternatives !== undefined ||
      v.rationale !== undefined,
    { message: "At least one field must be provided" },
  );

export type CreateDecisionInput = z.infer<typeof createDecisionSchema>;
export type UpdateDecisionInput = z.infer<typeof updateDecisionSchema>;

// Re-exported here (type-only, erased at compile) so API/UI reference the
// domain type through the seams, never `@/db/schema` directly.
export type { Decision } from "@/db/schema";
