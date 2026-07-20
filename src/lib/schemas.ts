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

/* ── Creator applications (vNext Studio) ───────────────────────────── */

export const creatorApplicationStatusEnum = z.enum([
  "pending",
  "approved",
  "rejected",
  "withdrawn",
]);

export const createCreatorApplicationSchema = z.object({
  displayName: z.string().trim().min(2, "Display name is required (min 2 chars)").max(80),
  craft: z.string().trim().min(2, "Craft / services is required").max(200),
  portfolioUrl: z
    .string()
    .trim()
    .url("Portfolio must be a valid URL")
    .max(500)
    .optional()
    .or(z.literal("")),
  note: z.string().trim().min(20, "Tell us a bit more (min 20 chars)").max(2000),
  agree: z.literal(true, {
    errorMap: () => ({ message: "You must accept the custody / delivery terms" }),
  }),
});

export type CreateCreatorApplicationInput = z.infer<typeof createCreatorApplicationSchema>;

export const reviewCreatorApplicationSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  reviewNote: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type ReviewCreatorApplicationInput = z.infer<typeof reviewCreatorApplicationSchema>;

/* ── Creator products / services (vNext Studio) ────────────────────── */

export const creatorServiceStatusEnum = z.enum(["draft", "active", "paused", "archived"]);

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const createCreatorServiceSchema = z.object({
  title: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(slugRegex, "Slug must be lowercase kebab-case (a-z, 0-9, hyphens)")
    .optional(),
  description: z.string().trim().min(10).max(2000),
  outcome: z.string().trim().max(500).optional().or(z.literal("")),
  usdPrice: z.coerce.number().min(0).max(100_000),
  delivery: z.string().trim().min(1).max(120),
  revisions: z.string().trim().min(1).max(120),
  status: creatorServiceStatusEnum.optional().default("draft"),
  sortOrder: z.coerce.number().int().min(0).max(10_000).optional().default(0),
});

export type CreateCreatorServiceInput = z.infer<typeof createCreatorServiceSchema>;

export const updateCreatorServiceSchema = createCreatorServiceSchema.partial().extend({
  title: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().min(10).max(2000).optional(),
  usdPrice: z.coerce.number().min(0).max(100_000).optional(),
  delivery: z.string().trim().min(1).max(120).optional(),
  revisions: z.string().trim().min(1).max(120).optional(),
});

export type UpdateCreatorServiceInput = z.infer<typeof updateCreatorServiceSchema>;
