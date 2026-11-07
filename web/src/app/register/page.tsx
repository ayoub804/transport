"use client";

import Link from "next/link";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { getErrorMessage } from "@/lib/api";

function Brand() {
  return (
    <Link className="brand-lockup" href="/register">
      <span className="brand-mark">W</span>
      <span><strong>wayfare</strong><small>TRAVEL, MADE SIMPLE</small></span>
    </Link>
  );
}

export default function RegisterPage() {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await register(name.trim(), email.trim(), password);
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
          <div className="eyebrow">The trip starts with you</div>
          <h1>More places. Less planning.</h1>
          <p>Make an account, find a seat, and let the good part of getting there begin.</p>
        </div>
        <div className="auth-footnote">Your next story is closer than you think.</div>
      </aside>
      <main className="auth-main">
        <div className="auth-form-wrap">
          <div className="auth-brand-mobile"><Brand /></div>
          <div className="eyebrow">JOIN WAYFARE</div>
          <h2>Create account</h2>
          <p>A few details, then you’re ready to roll.</p>
          <form className="stack" onSubmit={submit}>
            {error && <div className="alert alert-error" role="alert">{error}</div>}
            <div className="field"><label htmlFor="name">Your name</label><input id="name" autoComplete="name" placeholder="Sam Passenger" value={name} onChange={(event) => setName(event.target.value)} required minLength={2} maxLength={100} /></div>
            <div className="field"><label htmlFor="email">Email address</label><input id="email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={254} /></div>
            <div className="field"><label htmlFor="password">Password</label><input id="password" type="password" autoComplete="new-password" placeholder="At least 8 characters" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} maxLength={72} /></div>
            <button className="button button-primary button-wide" type="submit" disabled={submitting}>{submitting ? <><LoaderCircle className="spin" size={16} /> Creating account…</> : <>Create account <ArrowRight size={15} /></>}</button>
          </form>
          <div className="auth-switch">Already have an account? <Link href="/login">Sign in</Link></div>
        </div>
      </main>
    </div>
  );
}
