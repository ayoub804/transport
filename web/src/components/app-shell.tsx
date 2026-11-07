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
import { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { RouteGuard } from "@/components/route-guard";
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
  if (!user) return null;
  const items = navigation[user.role];

  return (
    <div className="app-frame">
      {open && <button className="mobile-backdrop" aria-label="Close menu" onClick={() => setOpen(false)} />}
      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <Link className="brand-lockup" href={user.role === "CLIENT" ? "/trips" : items[0].href} onClick={() => setOpen(false)}>
          <span className="brand-mark"><BusFront size={21} strokeWidth={2.2} /></span>
          <span><strong>wayfare</strong><small>TRAVEL, MADE SIMPLE</small></span>
        </Link>
        <div className="nav-caption">WORKSPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          {items.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/trips" && pathname.startsWith(`${href}/`));
            return (
              <Link key={href} href={href} className={`nav-link ${active ? "nav-link-active" : ""}`} onClick={() => setOpen(false)}>
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
      <div className="main-column">
        <header className="topbar">
          <button className="icon-button mobile-menu" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen(!open)}>{open ? <X size={20} /> : <Menu size={20} />}</button>
          <div className="breadcrumb"><span>WAYFARE</span><span className="crumb-slash">/</span><strong>{pageTitle(pathname)}</strong></div>
          <div className="topbar-right"><span className="secure-label"><span /> Secure workspace</span><span className="top-avatar">{user.name.slice(0, 1).toUpperCase()}</span></div>
        </header>
        <main className="page-content">{children}</main>
        <footer className="footer-note">Made for the journey ahead <span>·</span> Wayfare transport</footer>
      </div>
    </div>
  );
}
