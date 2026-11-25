import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/components/auth-provider";
import { ServiceWorker } from "@/components/service-worker";
import "./globals.css";
import "./glass.css";

export const metadata: Metadata = {
  title: "Wayfare — Travel, made simple",
  description: "Find bus trips, reserve your seat, and keep every ticket close.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Wayfare" },
};

export const viewport: Viewport = {
  themeColor: "#f5f5f7",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body><div className="ambient-background" aria-hidden="true" /><AuthProvider><ServiceWorker />{children}</AuthProvider></body>
    </html>
  );
}
