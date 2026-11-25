"use client";

import Link from "next/link";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { AuthLayout } from "@/components/auth-layout";
import { PasswordInput } from "@/components/password-input";
import { getErrorMessage } from "@/lib/api";

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
    <AuthLayout register>
      <div className="eyebrow">JOIN WAYFARE</div>
      <h1>Make room for more.</h1>
      <p>A few details, then you’re ready to roll.</p>
      <form className="stack" onSubmit={submit}>
        {error && <div className="alert alert-error" role="alert">{error}</div>}
        <div className="field"><label htmlFor="name">Your name</label><input id="name" autoComplete="name" placeholder="Sam Passenger" value={name} onChange={(event) => setName(event.target.value)} required minLength={2} maxLength={100} /></div>
        <div className="field"><label htmlFor="email">Email address</label><input id="email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={254} /></div>
        <div className="field"><label htmlFor="password">Password</label><PasswordInput id="password" autoComplete="new-password" placeholder="At least 8 characters" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} maxLength={72} /></div>
        <button className="button button-primary button-wide" type="submit" disabled={submitting}>{submitting ? <><LoaderCircle className="spin" size={16} /> Creating account…</> : <>Create account <ArrowRight size={15} /></>}</button>
      </form>
      <div className="auth-switch">Already have an account? <Link href="/login">Sign in</Link></div>
    </AuthLayout>
  );
}
