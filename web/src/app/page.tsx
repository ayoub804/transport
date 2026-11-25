import Link from "next/link";
import { ArrowRight, ArrowUpRight, BusFront, MapPin, ScanLine, ShieldCheck, Ticket, Users } from "lucide-react";
import { LinkedRings } from "@/components/linked-rings";
import { ReactiveBackground } from "@/components/reactive-background";
import { Reveal } from "@/components/reveal";
import { ThemeToggle } from "@/components/theme-toggle";

export default function HomePage() {
  return (
    <div className="landing">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="public-nav">
        <Link className="brand-lockup" href="/" aria-label="Wayfare home"><span className="brand-mark"><BusFront size={24} /></span><strong>wayfare<span className="brand-period">.</span></strong></Link>
        <nav aria-label="Main navigation"><a href="#journeys">Journeys</a><a href="#how-it-works">How it works</a><Link href="/register">Join as a driver</Link></nav>
        <div className="public-nav-actions"><ThemeToggle /><Link href="/login" className="public-signin">Sign in</Link><Link href="/register" className="button button-primary button-small">Create account</Link></div>
      </header>
      <main id="main-content">
        <section className="landing-hero">
          <ReactiveBackground />
          <div className="hero-content">
            <div className="hero-copy">
              <h1>Connect the<br />journey.<br /><span>Travel with<br />Wayfare.</span></h1>
              <div className="hero-actions"><Link href="/trips" className="line-link">EXPLORE JOURNEYS <ArrowRight size={16} /></Link><Link href="/register" className="line-link">JOIN THE JOURNEY <ArrowRight size={16} /></Link></div>
            </div>
            <LinkedRings />
          </div>
          <div className="hero-bottom"><div className="hero-stamp"><span><BusFront size={25} /><small>WAYFARE TRANSPORT</small></span><span>YOUR ROUTE<br />YOUR SEAT · YOUR WAY</span></div><p>People and places. Better connected.<br />From your first search to the next stop.</p></div>
        </section>
        <Reveal className="landing-section about-section"><span className="eyebrow">A BETTER WAY TO GO</span><h2>Travel should feel simple.<br />Find your connection, choose your seat, and keep your next adventure a little closer.</h2></Reveal>
        <Reveal className="landing-section" ><div id="journeys" className="landing-section-head"><div><span className="eyebrow">BUILT AROUND YOUR JOURNEY</span><h2>Every stop.<br />One connection.</h2></div><Link href="/trips" className="line-link">FIND YOUR ROUTE <ArrowUpRight size={17} /></Link></div><div className="feature-grid">
          <article className="feature-card feature-wide"><MapPin size={26} /><h3>From here to anywhere next.</h3><p>Search by departure city, destination, and date. Find the journey that fits your day.</p><div className="route-preview" aria-hidden="true"><span>FROM</span><div className="route-dot" /><div className="route-track"><i /></div><div className="route-dot destination-dot" /><span>TO</span></div></article>
          <article className="feature-card"><Ticket size={26} /><h3>Your seat. Your choice.</h3><p>See available seats and reserve the spot that feels like yours.</p><div className="preview-seats" aria-hidden="true">{Array.from({length:12},(_,i)=><i key={i} className={i===5?"lit":""}>{String(i+1).padStart(2,"0")}</i>)}</div></article>
          <article className="feature-card"><ScanLine size={26} /><h3>Ready when you are.</h3><p>Your QR ticket stays with your reservation. Show it to your driver and you are on your way.</p></article>
          <article className="feature-card"><ShieldCheck size={26} /><h3>Everything in one place.</h3><p>Review your bookings, change your journey, or cancel before departure.</p></article>
          <article className="feature-card feature-wide"><Users size={26} /><h3>Take the wheel.</h3><p>Choose Driver when you register. Access your assigned trips, passenger lists, and ticket scanner from one workspace.</p><Link href="/register" className="text-link">Create your driver account <ArrowUpRight size={16} /></Link></article>
        </div></Reveal>
        <Reveal className="landing-section join-section"><div><span className="eyebrow">JOIN THE JOURNEY</span><h2>Your next chapter<br />starts here.</h2><p>Passenger or driver. One account, a clear view, and a better way to get there.</p><Link href="/register" className="button button-primary">Create an account <ArrowRight size={16} /></Link></div><ol id="how-it-works" className="join-steps">{[["Create an account","Choose Passenger or Driver and sign up with your email."],["Make your connection","Book your seat, or find the trips assigned to you."],["Get going","Keep your ticket handy. Your next stop is waiting."]].map(([title,description],i)=><li key={title}><span className="step-number">{String(i+1).padStart(2,"0")}</span><div><h3>{title}</h3><p>{description}</p></div></li>)}</ol></Reveal>
      </main>
      <footer className="public-footer"><div><Link className="brand-lockup" href="/"><BusFront size={25} /><strong>wayfare.</strong></Link><p>People and places.<br />Better connected.</p></div><div><span className="eyebrow">PLATFORM</span><Link href="/trips">Find a trip</Link><Link href="/my-reservations">My reservations</Link></div><div><span className="eyebrow">GET STARTED</span><Link href="/register">Create an account</Link><Link href="/login">Sign in</Link></div><small>© {new Date().getFullYear()} Wayfare. Made for the journey ahead.</small></footer>
    </div>
  );
}
