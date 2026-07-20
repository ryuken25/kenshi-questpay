/** Shared types for Creator Studio applications + products (vNext). */

export type CreatorApplicationStatus = "pending" | "approved" | "rejected" | "withdrawn";

export type CreatorServiceStatus = "draft" | "active" | "paused" | "archived";

export interface CreatorApplication {
  id: string;
  accountId: string;
  displayName: string;
  craft: string;
  portfolioUrl: string | null;
  note: string;
  status: CreatorApplicationStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  createdAt: string;
  updatedAt: string;
  /** Optional denormalized email for admin list UIs */
  accountEmail?: string | null;
}

export interface CreatorService {
  id: string;
  creatorAccountId: string;
  slug: string;
  title: string;
  description: string;
  outcome: string;
  usdPrice: number;
  delivery: string;
  revisions: string;
  status: CreatorServiceStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
