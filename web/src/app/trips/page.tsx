"use client";

import Link from "next/link";
import { ArrowRight, ArrowRightLeft, BusFront, CalendarDays, Clock3, MapPin, Search, Ticket, Users } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { JourneyArt } from "@/components/journey-art";
import { ErrorState, formatDate, formatTime, LoadingState, PageHeading } from "@/components/ui";
import { getErrorMessage, tripsApi } from "@/lib/api";
import type { Trip } from "@/lib/types";

type TripFilters = { origin?: string; destination?: string; date?: string };

export default function TripsPage() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [appliedFilters, setAppliedFilters] = useState<TripFilters>({});
  const [sort, setSort] = useState("earliest");
  const requestId = useRef(0);

  const loadTrips = useCallback(async (filters: TripFilters = {}) => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError("");
    setAppliedFilters(filters);
    try {
      const results = await tripsApi.list(filters);
      if (currentRequest === requestId.current) setTrips(results);
    } catch (requestError) {
      if (currentRequest === requestId.current) setError(getErrorMessage(requestError));
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => { void loadTrips(); }, [loadTrips]);

  function search(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadTrips({
      ...(origin.trim() ? { origin: origin.trim() } : {}),
      ...(destination.trim() ? { destination: destination.trim() } : {}),
      ...(date ? { date } : {}),
    });
  }

  function clearFilters() {
    setOrigin("");
    setDestination("");
    setDate("");
    void loadTrips();
  }

  const hasFilters = Object.values(appliedFilters).some(Boolean);
  const sortedTrips = [...trips].sort((a, b) => (new Date(a.departureAt).getTime() - new Date(b.departureAt).getTime()) * (sort === "earliest" ? 1 : -1));

  return (
    <AppShell roles={["CLIENT"]}>
      <PageHeading eyebrow="YOUR NEXT CHAPTER" title="A good day starts here." description="Find a trip. Make it yours." action={<Link className="button button-secondary" href="/my-reservations"><Ticket size={16} /> My reservations</Link>} />
      <section className="journey-hero" aria-label="Plan your journey">
        <div className="journey-hero-copy"><span className="hero-kicker"><span /> GO A LITTLE FURTHER</span><h2>Your next stop.<br /><em>Something good.</em></h2><p>Find a connection. Pick your seat.<br />We’ll keep your ticket ready.</p></div>
        <JourneyArt />
      </section>
      <section className="card search-card" aria-label="Search for a trip">
      <div className="search-card-heading"><span><Search size={17} /> Let’s find your next stop</span><small>One way · Your choice of seat</small></div>
      <form className="search-panel" onSubmit={search}>
        <div className="field"><label htmlFor="origin">Leaving from</label><div className="input-icon"><MapPin size={14} /><input id="origin" placeholder="City or station" value={origin} onChange={(event) => setOrigin(event.target.value)} maxLength={100} /></div></div>
        <button className="icon-button swap-button" type="button" aria-label="Swap origin and destination" onClick={() => { setOrigin(destination); setDestination(origin); }}><ArrowRightLeft size={17} /></button>
        <div className="field"><label htmlFor="destination">Going to</label><div className="input-icon"><MapPin size={14} /><input id="destination" placeholder="Where to?" value={destination} onChange={(event) => setDestination(event.target.value)} maxLength={100} /></div></div>
        <div className="field"><label htmlFor="date">Travel date</label><input id="date" type="date" value={date} onChange={(event) => setDate(event.target.value)} /></div>
        <button className="button button-primary" type="submit" disabled={loading}><Search size={17} /> {loading ? "Searching…" : "Search trips"}</button>
      </form>
      </section>
      <div className="section-row trip-results-heading"><div><h2 className="section-title">{hasFilters ? "Your search results" : "Upcoming journeys"}</h2><p className="section-subtitle" role="status">{loading ? "Finding available journeys…" : error ? "Journeys couldn’t be loaded" : `${trips.length} ${trips.length === 1 ? "journey" : "journeys"} to explore`}</p></div><div className="results-controls">{hasFilters && <button className="button button-ghost button-small" onClick={clearFilters}>Clear filters</button>}<div className="sort-control"><label htmlFor="trip-sort">Sort by</label><select id="trip-sort" value={sort} onChange={(event) => setSort(event.target.value)}><option value="earliest">Earliest departure</option><option value="latest">Latest departure</option></select></div></div></div>
      {loading ? <div className="card"><LoadingState label="Finding available trips…" /></div> : error ? <ErrorState message={error} onRetry={() => void loadTrips(appliedFilters)} /> : trips.length === 0 ? <div className="card empty-state"><div className="empty-icon"><MapPin size={24} /></div><h3>A different route, perhaps?</h3><p>No journeys match this search. Try another city or travel date to find your next connection.</p>{hasFilters && <button className="button button-secondary" onClick={clearFilters}>Explore all trips <ArrowRight size={15} /></button>}</div> : (
        <div className="trip-list">{sortedTrips.map((trip) => <article className="card trip-card" key={trip.id}>
          <div className="trip-card-header"><span><BusFront size={15} /> Wayfare coach</span><span><CalendarDays size={14} /> {formatDate(trip.departureAt)}</span></div>
          <div className="trip-route"><div className="route-point"><strong>{trip.origin}</strong><small>{formatTime(trip.departureAt)}</small></div><span className="route-line" /><div className="route-point"><strong>{trip.destination}</strong><small>{formatDate(trip.departureAt, { month: "short", day: "numeric" })}</small></div></div>
          <div className="trip-meta"><strong><Clock3 size={14} className="inline-icon" /> {formatTime(trip.departureAt)}</strong><small>{trip.driver?.name ? `With ${trip.driver.name}` : "Scheduled departure"}</small></div>
          <div className="trip-meta trip-vehicle"><strong><Users size={14} className="inline-icon" /> {trip.vehicle?.capacity ?? "—"} seat coach</strong><small>{trip.vehicle?.plate ?? "Scheduled service"}</small></div>
          <div className="trip-card-action"><Link className="button button-primary" href={`/trips/${trip.id}`} aria-label={`Choose a seat from ${trip.origin} to ${trip.destination} on ${formatDate(trip.departureAt)} at ${formatTime(trip.departureAt)}`}>Choose seat <ArrowRight size={15} /></Link></div>
        </article>)}</div>
      )}
      <div className="journey-benefits"><span><MapPin size={17} /> Find your connection</span><span><Users size={17} /> Choose your own seat</span><span><Ticket size={17} /> Board with your QR ticket</span></div>
    </AppShell>
  );
}
