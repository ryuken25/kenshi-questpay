import { z } from "zod";

export const contactMethodEnum = z.enum(["email", "discord", "telegram", "x", "whatsapp", "other"]);
export type ContactMethod = z.infer<typeof contactMethodEnum>;
export const CONTACT_METHOD_LABELS: Record<ContactMethod, string> = {
  email: "Email",
  discord: "Discord",
  telegram: "Telegram",
  x: "X / Twitter",
  whatsapp: "WhatsApp",
  other: "Other",
};

export const briefSchema = z.object({
  customerName: z.string().min(2, "Name/handle is required (min 2 chars)"),
  contactMethod: contactMethodEnum,
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
  chainKey: z.enum(["polygon", "bnb"]).default("polygon"),
  tokenSymbol: z.enum(["USDT", "USDC", "POL", "VERSE"]),
  saveProfileDefaults: z.boolean().optional().default(false),
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

export const profileSchema = z.object({
  displayName: z.string().trim().min(2).max(80),
  publicHandle: z.string().trim().max(80).optional().or(z.literal("")),
  contactMethod: contactMethodEnum,
  contactValue: z.string().trim().min(3).max(160),
  organization: z.string().trim().max(120).optional().or(z.literal("")),
  preferredChain: z.enum(["polygon", "bnb"]),
  timezone: z.string().trim().max(80).optional().or(z.literal("")),
});

export type ProfileInput = z.infer<typeof profileSchema>;
