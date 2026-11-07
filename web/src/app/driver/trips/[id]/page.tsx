"use client";

import Link from "next/link";
import { ArrowLeft, CalendarDays, Ticket, Users } from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { EmptyState, ErrorState, formatDate, formatTime, LoadingState, PageHeading, StatusBadge } from "@/components/ui";
import { getErrorMessage, reservationsApi, tripsApi } from "@/lib/api";
import type { Reservation, Trip } from "@/lib/types";

export default function DriverTripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [tripResult, reservationResult] = await Promise.all([tripsApi.get(id), reservationsApi.driverTrip(id)]);
      setTrip(tripResult);
      setReservations(reservationResult);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  return (
    <AppShell roles={["DRIVER"]}>
      <Link href="/driver/trips" className="back-link"><ArrowLeft size={14} /> Back to your trips</Link>
      {loading ? <div className="card"><LoadingState label="Loading passenger list…" /></div> : error ? <ErrorState message={error} onRetry={() => void load()} /> : trip ? <>
        <PageHeading eyebrow="DEPARTURE MANIFEST" title={`${trip.origin} to ${trip.destination}`} description={`${formatDate(trip.departureAt)} · ${formatTime(trip.departureAt)}`} />
        <div className="grid grid-3 driver-manifest-metrics">
          <div className="card mini-metric"><span><Users size={15} /> Passengers</span><strong>{reservations.length}</strong></div>
          <div className="card mini-metric"><span><Ticket size={15} /> Confirmed</span><strong>{reservations.filter((item) => item.status === "CONFIRMED").length}</strong></div>
          <div className="card mini-metric"><span><CalendarDays size={15} /> Vehicle</span><strong className="metric-text">{trip.vehicle?.plate ?? "Assigned coach"}</strong></div>
        </div>
        <section className="card manifest-card">
          <div className="card-title"><div><h2>Passenger list</h2><p>Keep this list handy as passengers board.</p></div><StatusBadge status={trip.status} /></div>
          {reservations.length === 0 ? <EmptyState title="No reservations yet" description="Passenger bookings for this trip will appear here." /> : <div className="table-wrap"><table><thead><tr><th>Seat</th><th>Passenger</th><th>Email</th><th>Ticket</th></tr></thead><tbody>{reservations.map((reservation) => <tr key={reservation.id}><td className="table-primary">#{reservation.seatNumber}</td><td className="table-primary">{reservation.user?.name ?? "Passenger"}</td><td>{reservation.user?.email ?? "—"}</td><td><StatusBadge status={reservation.status} /></td></tr>)}</tbody></table></div>}
        </section>
      </> : null}
    </AppShell>
  );
}
