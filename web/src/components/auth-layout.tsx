import Link from "next/link";
import { ArrowUpRight, BusFront, LockKeyhole } from "lucide-react";
import type { ReactNode } from "react";
import { JourneyArt } from "@/components/journey-art";

function Brand() {
  return <Link className="brand-lockup" href="/login" aria-label="Wayfare home"><span className="brand-mark"><BusFront size={23} /></span><span><strong>wayfare</strong><small>A BETTER WAY TO GO</small></span></Link>;
}

export function AuthLayout({ children, register = false }: { children: ReactNode; register?: boolean }) {
  return (
    <div className="auth-layout">
      <header className="auth-header"><Brand /><Link className="auth-header-link" href={register ? "/login" : "/register"}>{register ? "Already a member?" : "Start your journey"}<ArrowUpRight size={16} /></Link></header>
      <aside className="auth-aside">
        <div className="auth-aside-copy">
          <div className="eyebrow">EVERYDAY TRAVEL. REIMAGINED.</div>
          <h2>Go places.<br /><em>Feel free.</em></h2>
          <p>A simpler way to find your trip, choose your seat, and take the day somewhere new.</p>
          <JourneyArt />
        </div>
        <div className="auth-footnote">A little less effort. A lot more possibility.</div>
      </aside>
      <main className="auth-main" id="main-content">
        <div className="auth-form-wrap">
          <span className="auth-form-icon"><BusFront size={25} strokeWidth={1.6} /></span>
          {children}
          <div className="auth-form-note"><LockKeyhole size={14} /> Your journeys, in one secure place.</div>
        </div>
      </main>
      <footer className="auth-bottom">Wayfare <span>Made for wherever life takes you.</span></footer>
    </div>
  );
}
