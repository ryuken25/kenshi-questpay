"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import { ChevronRight, X, LogOut, User as UserIcon, Menu } from "lucide-react";
import MobileReveal from "@/components/anim/MobileReveal";
import {
  questPayNav,
  mobileMoreNav,
  groupLabels,
  sessionRolesToNavRoles,
  filterNavByRoles,
  type QuestPayRole,
  type QuestPayNavItem,
} from "./nav.config";

type SessionState = { authenticated: boolean; roles: string[] } | null;

const NAV_WIDTH = 264;
const RAIL_WIDTH = 80;

/**
 * Brand marks rendered as inline SVG (crisp at any DPR, no next/image raster).
 * `id` namespaces each instance's gradient/filter defs so multiple marks can
 * coexist in the DOM (sidebar + mobile top-bar) without id collisions.
 */
function QuestPayWordmark({ id, width = 150 }: { id: string; width?: number }) {
  const height = Math.round((width * 240) / 960);
  return (
    <svg width={width} height={height} viewBox="0 0 960 240" fill="none" role="img" aria-label="QuestPay">
      <defs>
        <linearGradient id={`${id}-g`} x1="22" y1="18" x2="208" y2="220" gradientUnits="userSpaceOnUse">
          <stop stopColor="#B487FF" />
          <stop offset="0.52" stopColor="#8048F6" />
          <stop offset="1" stopColor="#5528C4" />
        </linearGradient>
        <filter id={`${id}-glow`} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect x="12" y="12" width="216" height="216" rx="58" fill="#06050D" />
      <rect x="13" y="13" width="214" height="214" rx="57" stroke={`url(#${id}-g)`} strokeOpacity=".48" strokeWidth="2" />
      <circle cx="112" cy="108" r="61" stroke="#EADFFF" strokeWidth="16" />
      <path d="M151 148L194 191" stroke={`url(#${id}-g)`} strokeWidth="20" strokeLinecap="round" />
      <path d="M78 108L102 132L148 86" stroke={`url(#${id}-g)`} strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" filter={`url(#${id}-glow)`} />
      <text x="264" y="151" fill="#F8F6FB" fontFamily="Inter, Arial, sans-serif" fontSize="108" fontWeight="750" letterSpacing="-5">QuestPay</text>
    </svg>
  );
}

function QuestPayMark({ id, size = 32 }: { id: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" fill="none" role="img" aria-label="QuestPay">
      <defs>
        <linearGradient id={`${id}-bg`} x1="36" y1="26" x2="224" y2="232" gradientUnits="userSpaceOnUse">
          <stop stopColor="#A977FF" />
          <stop offset="0.52" stopColor="#7C45F4" />
          <stop offset="1" stopColor="#4F25B8" />
        </linearGradient>
        <linearGradient id={`${id}-ring`} x1="54" y1="48" x2="193" y2="205" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F3E9FF" />
          <stop offset="1" stopColor="#C8A7FF" />
        </linearGradient>
        <filter id={`${id}-glow`} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="9" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect x="16" y="16" width="224" height="224" rx="64" fill="#06050D" />
      <rect x="17" y="17" width="222" height="222" rx="63" stroke={`url(#${id}-bg)`} strokeOpacity="0.55" strokeWidth="2" />
      <circle cx="120" cy="116" r="67" stroke={`url(#${id}-ring)`} strokeWidth="18" />
      <path d="M163 161L207 207" stroke={`url(#${id}-bg)`} strokeWidth="22" strokeLinecap="round" />
      <path d="M82 116L108 142L158 91" stroke={`url(#${id}-bg)`} strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" filter={`url(#${id}-glow)`} />
    </svg>
  );
}


function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
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
  const items = filterNavByRoles(questPayNav, roles);
  const groups = groupItems(items);
  const groupOrder = ["discover", "workspace", "creator", "admin", "trust"];

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
            <QuestPayMark id="qp-side-mark" size={34} />
          ) : (
            <QuestPayWordmark id="qp-side-word" width={150} />
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
        <QuestPayMark id="qp-top-mark" size={30} />
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
  const items = filterNavByRoles(mobileMoreNav, roles);
  const groups = groupItems(items);
  const groupOrder = ["discover", "workspace", "creator", "admin", "trust"];
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

  const refreshSession = useCallback(() => {
    fetch("/api/auth/session", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setSession({ authenticated: Boolean(d.authenticated), roles: d.roles ?? [] }))
      .catch(() => setSession({ authenticated: false, roles: [] }));
  }, []);

  // Re-derive the session on mount AND on every route change so the navbar
  // reflects the current role immediately after SIWE login or logout. AppShell
  // lives in the root layout and does NOT remount on client navigations, so a
  // mount-only fetch would leave the nav stale until a hard reload.
  useEffect(() => {
    refreshSession();
  }, [refreshSession, pathname]);

  // Refresh on tab focus / when an auth flow dispatches `questpay:session`.
  useEffect(() => {
    const onFocus = () => refreshSession();
    const onVisible = () => {
      if (document.visibilityState === "visible") refreshSession();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("questpay:session", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("questpay:session", onFocus);
    };
  }, [refreshSession]);

  // Close drawer on route change
  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  // Super admin → full nav (buyer + creator + admin). Creators get studio. Buyers get request-creator.
  const roles: QuestPayRole[] = sessionRolesToNavRoles(
    Boolean(session?.authenticated),
    session?.roles ?? [],
  );

  // Escape key closes drawer
  useEffect(() => {
    if (!moreOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMoreOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [moreOpen]);

  return (
    <MotionConfig reducedMotion="user">
    <div className="qp-app-shell">
      {/* Mobile-lite GSAP reveal tier (no-op ≥1024px; fade-only under reduce). */}
      <MobileReveal />

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
    </MotionConfig>
  );
}
