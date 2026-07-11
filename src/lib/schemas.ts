import { z } from "zod";

export const briefSchema = z.object({
  customerName: z.string().min(2, "Name/handle is required (min 2 chars)"),
  contactMethod: z.string().min(3, "Contact method is required (e.g., email, Discord, X DM)"),
  contactValue: z.string().min(3, "Contact value is required"),
  projectLink: z.string().url().optional().or(z.literal("")),
  deadline: z.string().optional().or(z.literal("")),
  mainProblem: z.string().min(10, "Describe your problem (min 10 chars)"),
  expectedOutput: z.string().optional().or(z.literal("")),
  refLinks: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export type BriefFormData = z.infer<typeof briefSchema>;

export const createOrderSchema = z.object({
  slug: z.string().min(1),
  tokenSymbol: z.enum(["USDT", "USDC", "POL", "VERSE"]),
  brief: briefSchema,
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const verifyPaymentSchema = z.object({
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, "Invalid tx hash"),
});

export const magicLinkSchema = z.object({
  email: z.string().email(),
  next: z.string().optional(),
  intent: z.string().optional(),
});

export type MagicLinkInput = z.infer<typeof magicLinkSchema>;
