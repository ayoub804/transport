"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { AxiosError } from "axios";
import { authApi, getErrorMessage } from "@/lib/api";
import type { User, UserRole } from "@/lib/types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function landingFor(role: UserRole): string {
  if (role === "ADMIN") return "/admin/dashboard";
  if (role === "DRIVER") return "/driver/trips";
  return "/trips";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const refresh = useCallback(async () => {
    try {
      const profile = await authApi.me();
      setUser(profile);
      setError(null);
      return profile;
    } catch (requestError) {
      if (
        requestError instanceof AxiosError &&
        requestError.response?.status === 401
      ) {
        setUser(null);
        setError(null);
        return null;
      }
      setError(getErrorMessage(requestError));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (loading) return;
    if ((pathname === "/login" || pathname === "/register") && user) {
      router.replace(landingFor(user.role));
      return;
    }
    if (pathname === "/") {
      router.replace(user ? landingFor(user.role) : "/login");
    }
  }, [loading, pathname, router, user]);

  const login = useCallback(
    async (email: string, password: string) => {
      setError(null);
      try {
        const profile = await authApi.login(email, password);
        setUser(profile);
        router.replace(landingFor(profile.role));
        return profile;
      } catch (requestError) {
        const message = getErrorMessage(requestError);
        setError(message);
        throw new Error(message);
      }
    },
    [router],
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      setError(null);
      try {
        await authApi.register(name, email, password);
        await login(email, password);
      } catch (requestError) {
        const message =
          requestError instanceof Error
            ? requestError.message
            : getErrorMessage(requestError);
        setError(message);
        throw new Error(message);
      }
    },
    [login],
  );

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
    router.replace("/login");
  }, [router]);

  const value = useMemo(
    () => ({ user, loading, error, login, register, logout, refresh }),
    [user, loading, error, login, register, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within AuthProvider");
  return value;
}

export function landingPath(role: UserRole): string {
  return landingFor(role);
}
