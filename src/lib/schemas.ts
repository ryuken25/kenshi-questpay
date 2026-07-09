import { z } from "zod";

export const briefSchema = z.object({
  handle: z.string().min(2, "Name/handle is required (min 2 chars)"),
  contactMethod: z.string().min(3, "Contact method is required (e.g., email, Discord, X DM)"),
  contactValue: z.string().min(3, "Contact value is required"),
  projectLink: z.string().url().optional().or(z.literal("")),
  packageId: z.number().min(1).max(5, "Select a package"),
  deadline: z.string().optional().or(z.literal("")),
  mainProblem: z.string().min(10, "Describe your problem (min 10 chars)"),
  expectedOutput: z.string().optional().or(z.literal("")),
  refLinks: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export type BriefFormData = z.infer<typeof briefSchema>;
