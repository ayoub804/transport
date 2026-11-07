"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { EmptyState, ErrorState, formatDate, formatTime, LoadingState, PageHeading } from "@/components/ui";
import { useAuth } from "@/components/auth-provider";
import { getErrorMessage, tripsApi } from "@/lib/api";
import type { Trip } from "@/lib/types";

export default function DriverTripsPage() {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const allTrips = await tripsApi.list();
      setTrips(allTrips.filter((trip) => trip.driverId === user?.id));
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { if (user) void load(); }, [load, user]);

  return (
    <AppShell roles={["DRIVER"]}>
      <PageHeading eyebrow="BEHIND THE WHEEL" title="Your trips" description="Your upcoming departures, with passenger lists one tap away." action={<Link className="button button-primary" href="/driver/scan"><span className="scan-icon">⌗</span> Scan a ticket</Link>} />
      {loading ? <div className="card"><LoadingState label="Loading your assigned trips…" /></div> : error ? <ErrorState message={error} onRetry={() => void load()} /> : trips.length === 0 ? <div className="card"><EmptyState title="No assigned trips yet" description="Trips assigned to your driver account will appear here." /></div> : (
        <div className="driver-trip-grid">{trips.map((trip) => <article className="card driver-trip-card" key={trip.id}>
          <div className="driver-trip-date"><CalendarDays size={15} /> {formatDate(trip.departureAt)}</div>
          <div className="driver-trip-route"><strong>{trip.origin}</strong><i /><strong>{trip.destination}</strong></div>
          <div className="driver-trip-info"><span><MapPin size={14} /> Departure {formatTime(trip.departureAt)}</span><span><Users size={14} /> {trip.vehicle?.capacity ?? "—"} seats · {trip.vehicle?.plate ?? "Coach"}</span></div>
          <Link className="button button-secondary button-wide" href={`/driver/trips/${trip.id}`}>View passenger list <ArrowRight size={14} /></Link>
        </article>)}</div>
      )}
    </AppShell>
  );
}
