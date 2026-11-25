import Link from "next/link";
import { ArrowLeft, BusFront, LockKeyhole } from "lucide-react";
import type { ReactNode } from "react";
import { LinkedRings } from "@/components/linked-rings";
import { ReactiveBackground } from "@/components/reactive-background";
import { ThemeToggle } from "@/components/theme-toggle";

export function AuthLayout({ children, register = false }: { children: ReactNode; register?: boolean }) {
  return <div className="auth-layout">
    <ReactiveBackground />
    <header className="auth-header"><Link className="brand-lockup" href="/"><span className="brand-mark"><BusFront size={23}/></span><strong>wayfare.</strong></Link><div className="public-nav-actions"><ThemeToggle /><Link className="auth-header-link" href={register ? "/login" : "/register"}>{register ? "Sign in" : "Create account"}</Link></div></header>
    <aside className="auth-aside"><div className="auth-aside-copy"><span className="eyebrow">PEOPLE. PLACES. POSSIBILITIES.</span><h2>Better<br />connected.<br /><em>With Wayfare.</em></h2><p>Your next seat. Your next stop.<br />Your next chapter starts here.</p><LinkedRings /></div></aside>
    <main className="auth-main" id="main-content"><div className="auth-form-wrap"><Link href="/" className="back-link"><ArrowLeft size={14} /> Back to home</Link>{children}<div className="auth-form-note"><LockKeyhole size={14} /> Your account. Your journey.</div></div></main>
    <footer className="auth-bottom">WAYFARE TRANSPORT <span>People and places. Better connected.</span></footer>
  </div>;
}
