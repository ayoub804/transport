"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, ChartNoAxesCombined, Ticket, TrendingDown } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ErrorState, formatDate, LoadingState, PageHeading, StatusBadge } from "@/components/ui";
import { getErrorMessage, reportsApi } from "@/lib/api";
import type { ReportsSummary } from "@/lib/types";

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState<ReportsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setSummary(await reportsApi.summary());
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);
  const activeTrips = summary?.reservationsPerTrip.filter((trip) => trip.status === "SCHEDULED") ?? [];
  const maxCount = Math.max(1, ...activeTrips.map((trip) => trip.reservationCount));

  return (
    <AppShell roles={["ADMIN"]}>
      <PageHeading eyebrow="YOUR NETWORK, AT A GLANCE" title="Everything. In perspective." description="Your passengers, departures, and reservations. One clear view." action={<Link className="button button-secondary" href="/admin/reservations">All reservations <ArrowRight size={14} /></Link>} />
      {loading ? <div className="card"><LoadingState label="Gathering your latest numbers…" /></div> : error ? <ErrorState message={error} onRetry={() => void load()} /> : summary ? <>
        <div className="grid grid-3">
          <article className="card metric-card"><div className="metric-label">All reservations <span className="metric-icon"><Ticket size={15} /></span></div><div className="metric-value">{summary.totalReservations}</div><div className="metric-foot">Across every trip on the network</div></article>
          <article className="card metric-card"><div className="metric-label">Cancellation rate <span className="metric-icon"><TrendingDown size={15} /></span></div><div className="metric-value">{(summary.cancellationRate * 100).toFixed(1)}<small>%</small></div><div className="metric-foot">Cancelled bookings / all bookings</div></article>
          <article className="card metric-card"><div className="metric-label">Scheduled trips <span className="metric-icon"><CalendarDays size={15} /></span></div><div className="metric-value">{activeTrips.length}</div><div className="metric-foot">Open and upcoming departures</div></article>
        </div>
        <div className="dashboard-grid">
          <section className="card card-pad">
            <div className="card-title"><div><h2>Reservations by trip</h2><p>Confirmed and used seats on upcoming trips.</p></div><span className="metric-icon"><ChartNoAxesCombined size={15} /></span></div>
            {activeTrips.length === 0 ? <div className="chart-empty">Scheduled journeys will show up here.</div> : <div className="trip-chart">{activeTrips.slice(0, 7).map((trip) => <div className="chart-row" key={trip.id}><div className="chart-label"><strong>{trip.origin} → {trip.destination}</strong><small>{formatDate(trip.departureAt, { month: "short", day: "numeric" })}</small></div><div className="chart-track"><div className="chart-bar" style={{ width: `${Math.max(3, (trip.reservationCount / maxCount) * 100)}%` }} /></div><strong className="chart-count">{trip.reservationCount}</strong></div>)}</div>}
          </section>
          <section className="card card-pad upcoming-card">
            <div className="card-title"><div><h2>Upcoming departures</h2><p>A quick look at the schedule.</p></div></div>
            <div className="upcoming-list">{activeTrips.slice(0, 4).map((trip) => <div className="upcoming-row" key={trip.id}><div className="upcoming-date"><span>{new Date(trip.departureAt).toLocaleDateString(undefined, { month: "short" })}</span><strong>{new Date(trip.departureAt).getDate()}</strong></div><div className="upcoming-info"><strong>{trip.origin} → {trip.destination}</strong><small>{trip.reservationCount} seats reserved</small></div><StatusBadge status={trip.status} /></div>)}</div>
            <Link href="/admin/trips" className="text-link">Manage trips <ArrowRight size={13} /></Link>
          </section>
        </div>
      </> : null}
    </AppShell>
  );
}
