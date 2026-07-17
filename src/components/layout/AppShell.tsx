"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, X, LogOut, User as UserIcon, Menu } from "lucide-react";
import { questPayNav, mobileMoreNav, groupLabels, type QuestPayRole, type QuestPayNavItem } from "./nav.config";

type SessionState = { authenticated: boolean; roles: string[] } | null;

const NAV_WIDTH = 264;
const RAIL_WIDTH = 80;


function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

function filterByRole(items: QuestPayNavItem[], roles: QuestPayRole[]): QuestPayNavItem[] {
  return items.filter((item) => item.roles.some((r) => roles.includes(r)));
}

function groupItems(items: QuestPayNavItem[]) {
  const groups: Record<string, QuestPayNavItem[]> = {};
  for (const item of items) {
    if (!groups[item.group]) groups[item.group] = [];
    groups[item.group].push(item);
  }
  return groups;
}

/** Desktop sidebar — full width (264px) or collapsed rail (80px) */
function DesktopSidebar({ roles, pathname, session }: { roles: QuestPayRole[]; pathname: string; session: SessionState }) {
  const [collapsed, setCollapsed] = useState(false);
  const items = filterByRole(questPayNav, roles);
  const groups = groupItems(items);
  const groupOrder = ["discover", "workspace", "creator", "trust"];

  return (
    <aside
      className="qp-sidebar"
      data-collapsed={collapsed}
      style={{ width: collapsed ? RAIL_WIDTH : NAV_WIDTH }}
    >
      {/* Brand */}
      <div className="qp-sidebar__brand">
        <Link href="/" className="qp-sidebar__logo" aria-label="QuestPay home">
          {collapsed ? (
            <Image src="/brand/questpay/questpay-mark-256.png" alt="QuestPay" width={32} height={32} />
          ) : (
            <Image src="/brand/questpay/questpay-logo-horizontal.svg" alt="QuestPay" width={130} height={28} />
          )}
        </Link>
        {!collapsed && (
          <span className="qp-sidebar__badge">Polygon</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="qp-sidebar__nav" aria-label="Primary">
        {groupOrder.map((groupKey) => {
          const groupItems = groups[groupKey];
          if (!groupItems?.length) return null;
          return (
            <div key={groupKey} className="qp-sidebar__group">
              {!collapsed && <span className="qp-sidebar__group-label">{groupLabels[groupKey]}</span>}
              {groupItems.map((item) => {
                const active = isActive(pathname, item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`qp-sidebar__item ${active ? "qp-sidebar__item--active" : ""}`}
                    title={collapsed ? item.label : undefined}
                  >
                    {active && <span className="qp-sidebar__indicator" />}
                    <Icon size={18} className="qp-sidebar__icon" />
                    {!collapsed && <span className="qp-sidebar__label">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="qp-sidebar__footer">
        {session?.authenticated ? (
          <Link href="/account" className="qp-sidebar__item" title={collapsed ? "Profile" : undefined}>
            <div className="qp-sidebar__avatar">
              <UserIcon size={16} />
            </div>
            {!collapsed && <span className="qp-sidebar__label">Account</span>}
          </Link>
        ) : (
          <Link href="/sign-in" className="qp-sidebar__item" title={collapsed ? "Sign In" : undefined}>
            <UserIcon size={18} className="qp-sidebar__icon" />
            {!collapsed && <span className="qp-sidebar__label">Sign In</span>}
          </Link>
        )}
        <button
          type="button"
          className="qp-sidebar__collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronRight size={16} style={{ transform: collapsed ? "rotate(0deg)" : "rotate(180deg)", transition: "transform 200ms" }} />
        </button>
      </div>
    </aside>
  );
}

/** Mobile top bar */
function MobileTopBar({ pathname, session, onMore }: { pathname: string; session: SessionState; onMore: () => void }) {
  const pageName = pathname === "/" ? "Home" : pathname.split("/")[1]?.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "QuestPay";
  return (
    <header className="qp-mobile-topbar">
      <Link href="/" className="qp-mobile-topbar__logo" aria-label="QuestPay home">
        <Image src="/brand/questpay/questpay-mark-256.png" alt="QuestPay" width={28} height={28} />
      </Link>
      <span className="qp-mobile-topbar__title">{pageName}</span>
      <button type="button" onClick={onMore} className="qp-mobile-topbar__action" aria-label="More menu">
        <Menu size={20} />
      </button>
    </header>
  );
}

/** Mobile "More" slide-over drawer */
function MobileMoreDrawer({ open, onClose, pathname, roles, session }: { open: boolean; onClose: () => void; pathname: string; roles: QuestPayRole[]; session: SessionState }) {
  const items = filterByRole(mobileMoreNav, roles);
  const groups = groupItems(items);
  const groupOrder = ["discover", "workspace", "creator", "trust"];
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="qp-drawer__backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="qp-drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            role="dialog"
            aria-label="More navigation"
          >
            <div className="qp-drawer__header">
              <span className="qp-drawer__title">More</span>
              <button type="button" onClick={onClose} className="qp-drawer__close" aria-label="Close">
                <X size={20} />
              </button>
            </div>
            <nav className="qp-drawer__nav">
              {groupOrder.map((groupKey) => {
                const groupItems = groups[groupKey];
                if (!groupItems?.length) return null;
                return (
                  <div key={groupKey} className="qp-sidebar__group">
                    <span className="qp-sidebar__group-label">{groupLabels[groupKey]}</span>
                    {groupItems.map((item) => {
                      const active = isActive(pathname, item.href);
                      const Icon = item.icon;
                      return (
                        <Link key={item.id} href={item.href} onClick={onClose} className={`qp-sidebar__item ${active ? "qp-sidebar__item--active" : ""}`}>
                          {active && <span className="qp-sidebar__indicator" />}
                          <Icon size={18} className="qp-sidebar__icon" />
                          <span className="qp-sidebar__label">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                );
              })}
              {/* Account / Sign out at bottom of drawer */}
              <div className="qp-sidebar__group">
                <span className="qp-sidebar__group-label">Account</span>
                {session?.authenticated ? (
                  <Link href="/account" onClick={onClose} className={`qp-sidebar__item ${isActive(pathname, "/account") ? "qp-sidebar__item--active" : ""}`}>
                    {isActive(pathname, "/account") && <span className="qp-sidebar__indicator" />}
                    <UserIcon size={18} className="qp-sidebar__icon" />
                    <span className="qp-sidebar__label">Profile</span>
                  </Link>
                ) : (
                  <Link href="/sign-in" onClick={onClose} className={`qp-sidebar__item ${isActive(pathname, "/sign-in") ? "qp-sidebar__item--active" : ""}`}>
                    {isActive(pathname, "/sign-in") && <span className="qp-sidebar__indicator" />}
                    <UserIcon size={18} className="qp-sidebar__icon" />
                    <span className="qp-sidebar__label">Sign In</span>
                  </Link>
                )}
              </div>
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [session, setSession] = useState<SessionState>(null);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => setSession({ authenticated: Boolean(d.authenticated), roles: d.roles ?? [] }))
      .catch(() => setSession({ authenticated: false, roles: [] }));
  }, []);

  // Close drawer on route change
  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  const roles: QuestPayRole[] = session?.authenticated
    ? (session.roles.includes("creator") ? ["buyer", "creator"] : ["buyer"]) as QuestPayRole[]
    : ["guest"];

  // Escape key closes drawer
  useEffect(() => {
    if (!moreOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMoreOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [moreOpen]);

  return (
    <div className="qp-app-shell">
      {/* Desktop sidebar */}
      <div className="qp-app-shell__sidebar">
        <DesktopSidebar roles={roles} pathname={pathname} session={session} />
      </div>

      {/* Mobile top bar */}
      <div className="qp-app-shell__mobile-topbar">
        <MobileTopBar pathname={pathname} session={session} onMore={() => setMoreOpen(true)} />
      </div>

      {/* Main content */}
      <main className="qp-app-shell__main">
        {children}
      </main>

      {/* Mobile navigation stays available from the top-bar More button. */}
      <MobileMoreDrawer open={moreOpen} onClose={() => setMoreOpen(false)} pathname={pathname} roles={roles} session={session} />
    </div>
  );
}
