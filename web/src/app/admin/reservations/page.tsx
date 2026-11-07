"use client";

import { Filter, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { EmptyState, ErrorState, formatDate, formatTime, LoadingState, PageHeading, StatusBadge } from "@/components/ui";
import { getErrorMessage, reservationsApi } from "@/lib/api";
import type { Reservation } from "@/lib/types";

export default function AdminReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [userId, setUserId] = useState("");
  const [tripId, setTripId] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (filters?: { userId?: string; tripId?: string; status?: Reservation["status"] }) => {
    setLoading(true);
    setError("");
    try {
      setReservations(await reservationsApi.all(filters));
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  function apply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void load({
      ...(userId.trim() ? { userId: userId.trim() } : {}),
      ...(tripId.trim() ? { tripId: tripId.trim() } : {}),
      ...(status ? { status: status as Reservation["status"] } : {}),
    });
  }

  function reset() {
    setUserId("");
    setTripId("");
    setStatus("");
    void load();
  }

  return (
    <AppShell roles={["ADMIN"]}>
      <PageHeading eyebrow="BOOKING ACTIVITY" title="Reservations" description="Review passenger bookings across the network and narrow down the details." />
      <form className="card filter-row" onSubmit={apply}>
        <div className="field"><label htmlFor="filter-user">Passenger user ID</label><input id="filter-user" value={userId} onChange={(event) => setUserId(event.target.value)} placeholder="Optional UUID" /></div>
        <div className="field"><label htmlFor="filter-trip">Trip ID</label><input id="filter-trip" value={tripId} onChange={(event) => setTripId(event.target.value)} placeholder="Optional UUID" /></div>
        <div className="field"><label htmlFor="filter-status">Status</label><select id="filter-status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All statuses</option><option value="CONFIRMED">Confirmed</option><option value="CANCELLED">Cancelled</option><option value="USED">Used</option></select></div>
        <button className="button button-primary" type="submit"><Filter size={14} /> Apply filters</button>
        <button className="button button-ghost filter-reset" type="button" onClick={reset}><RotateCcw size={14} /> Reset</button>
      </form>
      {error ? <ErrorState message={error} onRetry={() => void load()} /> : loading ? <div className="card"><LoadingState label="Loading reservation records…" /></div> : reservations.length === 0 ? <div className="card"><EmptyState title="No reservations match" description="Try clearing a filter or checking another trip." /></div> : <section className="card">
        <div className="card-title table-heading"><div><h2>Booking records</h2><p>{reservations.length} reservations shown</p></div></div>
        <div className="table-wrap"><table><thead><tr><th>Passenger</th><th>Route</th><th>Departure</th><th>Seat</th><th>Booked</th><th>Status</th></tr></thead><tbody>{reservations.map((reservation) => <tr key={reservation.id}><td><span className="table-primary">{reservation.user?.name ?? "Passenger"}</span><span className="table-secondary">{reservation.user?.email ?? reservation.userId}</span></td><td className="table-primary">{reservation.trip.origin} → {reservation.trip.destination}</td><td><span className="table-primary">{formatDate(reservation.trip.departureAt, { month: "short", day: "numeric" })}</span><span className="table-secondary">{formatTime(reservation.trip.departureAt)}</span></td><td>#{reservation.seatNumber}</td><td>{formatDate(reservation.createdAt, { month: "short", day: "numeric", year: "numeric" })}</td><td><StatusBadge status={reservation.status} /></td></tr>)}</tbody></table></div>
      </section>}
    </AppShell>
  );
}
