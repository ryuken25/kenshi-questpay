import { getSession, requireAnyRole, type Role } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function getAuthState() {
  const session = await getSession();
  if (!session) return { kind: "visitor" as const };
  return {
    kind: "authenticated" as const,
    accountId: session.accountId,
    roles: session.roles,
  };
}

export async function requireCreatorOrAdmin() {
  return requireAnyRole(["creator", "super_admin"] as Role[]);
}

export async function requireSuperAdmin() {
  return requireAnyRole(["super_admin"] as Role[]);
}

export async function redirectIfNoRole(roles: Role[], target: string) {
  if (!roles.some((r) => ["creator", "super_admin"].includes(r))) {
    redirect(target);
  }
}
