"use client";

import { AlertCircle, LoaderCircle } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export function Button({
  children,
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost";
}) {
  return (
    <button type={type} className={`button button-${variant} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1>{description && <p>{description}</p>}</div>
      {action && <div className="heading-action">{action}</div>}
    </div>
  );
}

export function LoadingState({ label = "Loading your information…" }: { label?: string }) {
  return <div className="inline-state"><LoaderCircle className="spin" size={19} /><span>{label}</span></div>;
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <div className="alert alert-error"><AlertCircle size={18} /><span>{message}</span>{onRetry && <button onClick={onRetry}>Try again</button>}</div>;
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="empty-state"><div className="empty-icon"><AlertCircle size={21} /></div><h3>{title}</h3><p>{description}</p>{action}</div>;
}

export function StatusBadge({ status }: { status: string }) {
  return <span className={`status-badge status-${status.toLowerCase()}`}>{status.toLowerCase().replaceAll("_", " ")}</span>;
}

export function formatDate(date: string, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(undefined, options ?? {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  }).format(new Date(date));
}

export function formatTime(date: string) {
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(date));
}
