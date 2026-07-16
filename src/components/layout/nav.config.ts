import type { LucideIcon } from "lucide-react";
import { Home, ShoppingBag, Workflow, LayoutDashboard, Package, Receipt, Store, DollarSign, ShieldCheck, HelpCircle, User } from "lucide-react";

export type QuestPayRole = "guest" | "buyer" | "creator" | "admin";

export type QuestPayNavItem = {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  roles: QuestPayRole[];
  mobilePrimary?: boolean;
  group: "discover" | "workspace" | "creator" | "trust";
};

export const questPayNav: QuestPayNavItem[] = [
  // Discover — visible to everyone
  { id: "home", label: "Home", href: "/", icon: Home, roles: ["guest", "buyer", "creator", "admin"], mobilePrimary: true, group: "discover" },
  { id: "services", label: "Services", href: "/services", icon: ShoppingBag, roles: ["guest", "buyer", "creator", "admin"], mobilePrimary: true, group: "discover" },
  { id: "how", label: "How It Works", href: "/how-it-works", icon: Workflow, roles: ["guest", "buyer", "creator", "admin"], group: "discover" },

  // Workspace — after sign-in
  { id: "overview", label: "Overview", href: "/dashboard", icon: LayoutDashboard, roles: ["buyer", "creator", "admin"], group: "workspace" },
  { id: "orders", label: "My Orders", href: "/my-orders", icon: Package, roles: ["buyer", "creator", "admin"], mobilePrimary: true, group: "workspace" },
  { id: "receipts", label: "Receipts", href: "/verify", icon: Receipt, roles: ["guest", "buyer", "creator", "admin"], group: "workspace" },

  // Creator — only for creator/admin
  { id: "studio", label: "Creator Studio", href: "/studio", icon: Store, roles: ["creator", "admin"], mobilePrimary: true, group: "creator" },
  { id: "earnings", label: "Earnings", href: "/studio", icon: DollarSign, roles: ["creator", "admin"], group: "creator" },

  // Trust — visible to everyone
  { id: "verify", label: "Verify Receipt", href: "/verify", icon: ShieldCheck, roles: ["guest", "buyer", "creator", "admin"], group: "trust" },
  { id: "faq", label: "Help & FAQ", href: "/faq", icon: HelpCircle, roles: ["guest", "buyer", "creator", "admin"], group: "trust" },
];

export const mobileBottomNav: QuestPayNavItem[] = questPayNav.filter((item) => item.mobilePrimary);

export const mobileMoreNav: QuestPayNavItem[] = questPayNav.filter((item) => !item.mobilePrimary);

export const groupLabels: Record<string, string> = {
  discover: "Discover",
  workspace: "Workspace",
  creator: "Creator",
  trust: "Trust",
};
