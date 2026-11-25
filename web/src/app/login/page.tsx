"use client";

import Link from "next/link";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { AuthLayout } from "@/components/auth-layout";
import { PasswordInput } from "@/components/password-input";
import { getErrorMessage } from "@/lib/api";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <div className="eyebrow">YOUR NEXT CHAPTER</div>
      <h1>Welcome back.</h1>
      <p>Pick up right where your next journey begins.</p>
      <form className="stack" onSubmit={submit}>
        {error && <div className="alert alert-error" role="alert">{error}</div>}
        <div className="field"><label htmlFor="email">Email address</label><input id="email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
        <div className="field"><label htmlFor="password">Password</label><PasswordInput id="password" autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} /></div>
        <button className="button button-primary button-wide" type="submit" disabled={submitting}>{submitting ? <><LoaderCircle className="spin" size={16} /> Signing in…</> : <>Sign in <ArrowRight size={15} /></>}</button>
      </form>
      <div className="auth-switch">New to Wayfare? <Link href="/register">Create an account</Link></div>
    </AuthLayout>
  );
}
