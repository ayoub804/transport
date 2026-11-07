"use client";

import Link from "next/link";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { getErrorMessage } from "@/lib/api";

function Brand() {
  return (
    <Link className="brand-lockup" href="/login">
      <span className="brand-mark">W</span>
      <span><strong>wayfare</strong><small>TRAVEL, MADE SIMPLE</small></span>
    </Link>
  );
}

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
    <div className="auth-layout">
      <aside className="auth-aside">
        <Brand />
        <div className="auth-aside-copy">
          <div className="eyebrow">A better way to get there</div>
          <h1>Good journeys start here.</h1>
          <p>Find your next connection, choose a seat that feels right, and keep every ticket close.</p>
        </div>
        <div className="auth-footnote">Take the scenic route. We’ll handle the details.</div>
      </aside>
      <main className="auth-main">
        <div className="auth-form-wrap">
          <div className="auth-brand-mobile"><Brand /></div>
          <div className="eyebrow">WELCOME BACK</div>
          <h2>Sign in</h2>
          <p>Pick up right where your next journey begins.</p>
          <form className="stack" onSubmit={submit}>
            {error && <div className="alert alert-error" role="alert">{error}</div>}
            <div className="field"><label htmlFor="email">Email address</label><input id="email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
            <div className="field"><label htmlFor="password">Password</label><input id="password" type="password" autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} /></div>
            <button className="button button-primary button-wide" type="submit" disabled={submitting}>{submitting ? <><LoaderCircle className="spin" size={16} /> Signing in…</> : <>Sign in <ArrowRight size={15} /></>}</button>
          </form>
          <div className="auth-switch">New to Wayfare? <Link href="/register">Create an account</Link></div>
        </div>
      </main>
    </div>
  );
}
