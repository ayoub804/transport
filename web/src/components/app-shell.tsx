"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BusFront,
  ChartNoAxesCombined,
  ClipboardList,
  LogOut,
  Menu,
  ScanLine,
  Ticket,
  Users,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { RouteGuard } from "@/components/route-guard";
import { ThemeToggle } from "@/components/theme-toggle";
import type { UserRole } from "@/lib/types";

interface NavigationItem {
  href: string;
  label: string;
  icon: typeof BusFront;
}

const navigation: Record<UserRole, NavigationItem[]> = {
  CLIENT: [
    { href: "/trips", label: "Find a trip", icon: BusFront },
    { href: "/my-reservations", label: "My reservations", icon: Ticket },
  ],
  DRIVER: [
    { href: "/driver/trips", label: "My trips", icon: BusFront },
    { href: "/driver/scan", label: "Scan ticket", icon: ScanLine },
  ],
  ADMIN: [
    { href: "/admin/dashboard", label: "Overview", icon: ChartNoAxesCombined },
    { href: "/admin/vehicles", label: "Vehicles", icon: BusFront },
    { href: "/admin/trips", label: "Trips", icon: ClipboardList },
    { href: "/admin/reservations", label: "Reservations", icon: Users },
  ],
};

function pageTitle(pathname: string) {
  if (pathname.startsWith("/admin/dashboard")) return "Overview";
  if (pathname.startsWith("/admin/vehicles")) return "Vehicles";
  if (pathname.startsWith("/admin/trips")) return "Trip management";
  if (pathname.startsWith("/admin/reservations")) return "Reservations";
  if (pathname.startsWith("/driver/scan")) return "Ticket scanner";
  if (pathname.startsWith("/driver/trips")) return "My trips";
  if (pathname.startsWith("/my-reservations")) return "My reservations";
  if (pathname.startsWith("/trips/")) return "Trip details";
  return "Find your next trip";
}

export function AppShell({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles: UserRole[];
}) {
  return (
    <RouteGuard roles={roles}>
      <ShellFrame>{children}</ShellFrame>
    </RouteGuard>
  );
}

function ShellFrame({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const media = window.matchMedia("(max-width: 760px)");
    if (!media.matches) return;
    const menuButton = menuRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const links = sidebarRef.current?.querySelectorAll<HTMLElement>("a, button");
    links?.[0]?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
      if (event.key !== "Tab" || !links?.length) return;
      const first = links[0];
      const last = links[links.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    const onResize = () => { if (!media.matches) setOpen(false); };
    media.addEventListener("change", onResize);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      media.removeEventListener("change", onResize);
      menuButton?.focus();
    };
  }, [open]);
  if (!user) return null;
  const items = navigation[user.role];

  return (
    <div className="app-frame">
      <a className="skip-link" href="#main-content">Skip to content</a>
      {open && <button className="mobile-backdrop" aria-label="Close menu" onClick={() => setOpen(false)} />}
      <aside id="app-navigation" ref={sidebarRef} className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <button className="icon-button sidebar-close" aria-label="Close menu" onClick={() => setOpen(false)}><X size={20} /></button>
        <Link className="brand-lockup" href={user.role === "CLIENT" ? "/trips" : items[0].href} onClick={() => setOpen(false)}>
          <span className="brand-mark"><BusFront size={21} strokeWidth={2.2} /></span>
          <span><strong>wayfare</strong><small>A BETTER WAY TO GO</small></span>
        </Link>
        <div className="nav-caption">{user.role === "CLIENT" ? "YOUR JOURNEYS" : user.role === "DRIVER" ? "DRIVER WORKSPACE" : "MANAGE YOUR NETWORK"}</div>
        <nav className="side-nav" aria-label="Main navigation">
          {items.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`nav-link ${active ? "nav-link-active" : ""}`} onClick={() => setOpen(false)}>
                <Icon size={18} strokeWidth={1.8} /><span>{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card"><span className="help-dot" /><span><strong>Ready when you are</strong><small>Your journeys, all in one place.</small></span></div>
          <div className="user-card">
            <div className="avatar">{user.name.slice(0, 1).toUpperCase()}</div>
            <div className="user-meta"><strong>{user.name}</strong><small>{user.role.toLowerCase()}</small></div>
            <button className="icon-button logout-button" title="Sign out" aria-label="Sign out" onClick={() => void logout()}><LogOut size={17} /></button>
          </div>
        </div>
      </aside>
      <div className="main-column" inert={open || undefined}>
        <header className="topbar">
          <button ref={menuRef} className="icon-button mobile-menu" aria-label="Open menu" aria-expanded={open} aria-controls="app-navigation" onClick={() => setOpen(true)}><Menu size={20} /></button>
          <div className="breadcrumb"><span>WAYFARE</span><span className="crumb-slash">/</span><strong>{pageTitle(pathname)}</strong></div>
          <div className="topbar-right"><ThemeToggle /><span className="secure-label"><span /> Secure workspace</span><span className="top-avatar">{user.name.slice(0, 1).toUpperCase()}</span></div>
        </header>
        <main id="main-content" className="page-content" tabIndex={-1}>{children}</main>
        <footer className="footer-note">Made for the journey ahead <span>·</span> Wayfare transport</footer>
      </div>
    </div>
  );
}
