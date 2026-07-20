import type { LucideIcon } from "lucide-react";
import {
  Home,
  ShoppingBag,
  Workflow,
  Package,
  Receipt,
  Store,
  DollarSign,
  ShieldCheck,
  HelpCircle,
  Boxes,
  ClipboardList,
  UserPlus,
  Shield,
  Users,
  ArrowLeftRight,
} from "lucide-react";

/** Nav-facing roles. `admin` covers both platform admin and super_admin sessions. */
export type QuestPayRole = "guest" | "buyer" | "creator" | "admin";

export type QuestPayNavItem = {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  roles: QuestPayRole[];
  /** Hide for these roles even if listed in roles (e.g. request-creator once already creator). */
  excludeRoles?: QuestPayRole[];
  mobilePrimary?: boolean;
  group: "discover" | "workspace" | "creator" | "admin" | "trust";
};

export const questPayNav: QuestPayNavItem[] = [
  // Discover — visible to everyone
  { id: "home", label: "Home", href: "/", icon: Home, roles: ["guest", "buyer", "creator", "admin"], mobilePrimary: true, group: "discover" },
  { id: "services", label: "Services", href: "/services", icon: ShoppingBag, roles: ["guest", "buyer", "creator", "admin"], mobilePrimary: true, group: "discover" },
  { id: "how", label: "How It Works", href: "/how-it-works", icon: Workflow, roles: ["guest", "buyer", "creator", "admin"], group: "discover" },

  // Workspace — after sign-in
  { id: "orders", label: "My Orders", href: "/my-orders", icon: Package, roles: ["buyer", "creator", "admin"], mobilePrimary: true, group: "workspace" },
  { id: "receipts", label: "Receipts", href: "/receipts", icon: Receipt, roles: ["buyer", "creator", "admin"], group: "workspace" },

  // Creator Studio — creators + admins (super admin full access)
  { id: "studio", label: "Creator Studio", href: "/studio", icon: Store, roles: ["creator", "admin"], mobilePrimary: true, group: "creator" },
  { id: "studio-products", label: "Products", href: "/studio/products", icon: Boxes, roles: ["creator", "admin"], group: "creator" },
  { id: "studio-orders", label: "Studio Orders", href: "/studio/orders", icon: ClipboardList, roles: ["creator", "admin"], group: "creator" },
  { id: "earnings", label: "Earnings", href: "/studio/earnings", icon: DollarSign, roles: ["creator", "admin"], group: "creator" },
  // Authenticated non-creators (buyers without creator/admin role)
  {
    id: "request-creator",
    label: "Request Creator",
    href: "/studio/request",
    icon: UserPlus,
    roles: ["buyer"],
    excludeRoles: ["creator", "admin"],
    group: "creator",
  },

  // Admin — admin / super_admin only
  { id: "admin", label: "Admin", href: "/admin", icon: Shield, roles: ["admin"], group: "admin" },
  { id: "admin-users", label: "Users", href: "/admin/users", icon: Users, roles: ["admin"], group: "admin" },
  { id: "admin-tx", label: "Transactions", href: "/admin/transactions", icon: ArrowLeftRight, roles: ["admin"], group: "admin" },

  // Trust — visible to everyone
  { id: "verify", label: "Verify", href: "/verify", icon: ShieldCheck, roles: ["guest", "buyer", "creator", "admin"], group: "trust" },
  { id: "faq", label: "Help & FAQ", href: "/faq", icon: HelpCircle, roles: ["guest", "buyer", "creator", "admin"], group: "trust" },
];

// The mobile bottom bar was removed; the top-bar drawer now exposes the full navigation.
export const mobileMoreNav: QuestPayNavItem[] = questPayNav;

export const groupLabels: Record<string, string> = {
  discover: "Discover",
  workspace: "Workspace",
  creator: "Creator",
  admin: "Admin",
  trust: "Trust",
};

/**
 * Map raw session roles (buyer | creator | super_admin) → nav roles.
 * Super admin gets full access (buyer + creator + admin).
 */
export function sessionRolesToNavRoles(
  authenticated: boolean,
  sessionRoles: string[] = [],
): QuestPayRole[] {
  if (!authenticated) return ["guest"];

  const nav: QuestPayRole[] = ["buyer"];
  const isSuper = sessionRoles.includes("super_admin") || sessionRoles.includes("admin");
  const isCreator = sessionRoles.includes("creator") || isSuper;

  if (isCreator) nav.push("creator");
  if (isSuper) nav.push("admin");

  return nav;
}

export function filterNavByRoles(items: QuestPayNavItem[], roles: QuestPayRole[]): QuestPayNavItem[] {
  return items.filter((item) => {
    if (item.excludeRoles?.some((r) => roles.includes(r))) return false;
    return item.roles.some((r) => roles.includes(r));
  });
}
