"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { useAuth, landingPath } from "@/components/auth-provider";
import type { UserRole } from "@/lib/types";

export function RouteGuard({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles?: UserRole[];
}) {
  const { user, loading, error, refresh } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user && !error) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    } else if (user && roles && !roles.includes(user.role)) {
      router.replace(landingPath(user.role));
    }
  }, [error, loading, pathname, roles, router, user]);

  if (loading || (!user && !error) || (user && roles && !roles.includes(user.role))) {
    return (
      <div className="screen-state">
        <LoaderCircle className="spin" size={22} />
        <span>Checking your account…</span>
      </div>
    );
  }
  if (error) {
    return (
      <div className="screen-state state-error">
        <p>{error}</p>
        <button className="button button-dark" onClick={() => void refresh()}>
          Try again
        </button>
      </div>
    );
  }
  if (!user) return null;
  return children;
}
