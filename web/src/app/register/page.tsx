"use client";

import Link from "next/link";
import { ArrowRight, BusFront, Ticket, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { AuthLayout } from "@/components/auth-layout";
import { PasswordInput } from "@/components/password-input";
import { getErrorMessage } from "@/lib/api";

export default function RegisterPage() {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [role, setRole] = useState<"CLIENT" | "DRIVER">("CLIENT");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await register(name.trim(), email.trim(), password, role);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout register>
      <div className="eyebrow">JOIN WAYFARE</div>
      <h1>Join the journey.</h1>
      <p>Find your next seat. Or take the wheel.</p>
      <form className="stack" onSubmit={submit}>
        {error && <div className="alert alert-error" role="alert">{error}</div>}
        <fieldset className="role-picker">
          <legend>Join as</legend>
          <div className="role-options">
            <label className={role === "CLIENT" ? "role-option selected" : "role-option"}><input type="radio" name="role" value="CLIENT" checked={role === "CLIENT"} onChange={() => setRole("CLIENT")} /><Ticket size={21} /><strong>Passenger</strong><span>Find trips and book a seat</span></label>
            <label className={role === "DRIVER" ? "role-option selected" : "role-option"}><input type="radio" name="role" value="DRIVER" checked={role === "DRIVER"} onChange={() => setRole("DRIVER")} /><BusFront size={21} /><strong>Driver</strong><span>Manage trips and scan tickets</span></label>
          </div>
          <p className="role-hint">{role === "DRIVER" ? "Your driver workspace is ready after signup. Assigned trips will appear there." : "Search routes, choose your seat, and keep your tickets together."}</p>
        </fieldset>
        <div className="field"><label htmlFor="name">Your name</label><input id="name" autoComplete="name" placeholder="Sam Passenger" value={name} onChange={(event) => setName(event.target.value)} required minLength={2} maxLength={100} /></div>
        <div className="field"><label htmlFor="email">Email address</label><input id="email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={254} /></div>
        <div className="field"><label htmlFor="password">Password</label><PasswordInput id="password" autoComplete="new-password" placeholder="At least 8 characters" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} maxLength={72} /></div>
        <button className="button button-primary button-wide" type="submit" disabled={submitting}>{submitting ? <><LoaderCircle className="spin" size={16} /> Creating account…</> : <>Create account <ArrowRight size={15} /></>}</button>
      </form>
      <div className="auth-switch">Already have an account? <Link href="/login">Sign in</Link></div>
    </AuthLayout>
  );
}
