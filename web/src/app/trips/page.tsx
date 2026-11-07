"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin, Search, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ErrorState, formatDate, formatTime, LoadingState, PageHeading } from "@/components/ui";
import { getErrorMessage, tripsApi } from "@/lib/api";
import type { Trip } from "@/lib/types";

export default function TripsPage() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTrips = useCallback(async (filters?: { origin?: string; destination?: string; date?: string }) => {
    setLoading(true);
    setError("");
    try {
      setTrips(await tripsApi.list(filters));
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
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

  return (
    <AppShell roles={["CLIENT"]}>
      <PageHeading eyebrow="THE OPEN ROAD" title="Find your next trip" description="A good seat, a clear view, and somewhere new on the other side." />
      <form className="card search-panel" onSubmit={search}>
        <div className="field"><label htmlFor="origin">Leaving from</label><div className="input-icon"><MapPin size={14} /><input id="origin" placeholder="City or station" value={origin} onChange={(event) => setOrigin(event.target.value)} maxLength={100} /></div></div>
        <div className="field"><label htmlFor="destination">Going to</label><div className="input-icon"><MapPin size={14} /><input id="destination" placeholder="Where to?" value={destination} onChange={(event) => setDestination(event.target.value)} maxLength={100} /></div></div>
        <div className="field"><label htmlFor="date">Travel date</label><input id="date" type="date" value={date} onChange={(event) => setDate(event.target.value)} /></div>
        <button className="button button-primary" type="submit"><Search size={15} /> Search trips</button>
      </form>
      <div className="section-row"><div><h2 className="section-title">Trips for you</h2><p className="section-subtitle">{loading ? "Finding available journeys…" : `${trips.length} ${trips.length === 1 ? "journey" : "journeys"} to explore`}</p></div><div className="date-chip"><CalendarDays size={14} /> Flexible plans welcome</div></div>
      {loading ? <div className="card"><LoadingState label="Finding available trips…" /></div> : error ? <ErrorState message={error} onRetry={() => void loadTrips()} /> : trips.length === 0 ? <div className="card empty-state"><div className="empty-icon"><MapPin size={20} /></div><h3>No trips found just yet</h3><p>Try another route or date. Your next good journey might be one search away.</p></div> : (
        <div className="trip-list">{trips.map((trip) => <article className="card trip-card" key={trip.id}>
          <div className="trip-route"><div className="route-point"><strong>{trip.origin}</strong><small>{formatTime(trip.departureAt)}</small></div><span className="route-line" /><div className="route-point"><strong>{trip.destination}</strong><small>{formatDate(trip.departureAt, { month: "short", day: "numeric" })}</small></div></div>
          <div className="trip-meta"><strong>{formatDate(trip.departureAt)}</strong><small>{trip.driver?.name ? `With ${trip.driver.name}` : "Comfortable coach"}</small></div>
          <div className="trip-meta"><strong><Users size={13} className="inline-icon" /> {trip.vehicle?.capacity ?? "—"} seats</strong><small>{trip.vehicle?.plate ?? "Scheduled service"}</small></div>
          <div className="trip-card-action"><Link className="button button-secondary button-small" href={`/trips/${trip.id}`}>Choose seat <ArrowRight size={13} /></Link></div>
        </article>)}</div>
      )}
    </AppShell>
  );
}
