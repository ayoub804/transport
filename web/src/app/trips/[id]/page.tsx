"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarDays, Check, Clock3, MapPin, Users } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button, ErrorState, formatDate, formatTime, LoadingState, PageHeading } from "@/components/ui";
import { useAuth } from "@/components/auth-provider";
import { getErrorMessage, reservationsApi, tripsApi } from "@/lib/api";
import type { Trip, TripSeat } from "@/lib/types";

export default function TripDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { refresh } = useAuth();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [seats, setSeats] = useState<TripSeat[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [tripResult, seatResult] = await Promise.all([tripsApi.get(id), tripsApi.seats(id)]);
      setTrip(tripResult);
      setSeats(seatResult.seats);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  const availableCount = useMemo(() => seats.filter((seat) => seat.available).length, [seats]);

  async function reserveSeat() {
    if (!selected) return;
    setBooking(true);
    setError("");
    setSuccess("");
    try {
      await reservationsApi.create(id, selected);
      setSuccess(`Seat ${selected} is yours. Your ticket is ready in My reservations.`);
      await load();
      await refresh();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBooking(false);
    }
  }

  return (
    <AppShell roles={["CLIENT"]}>
      <Link href="/trips" className="back-link"><ArrowLeft size={14} /> Back to trips</Link>
      {loading ? <div className="card"><LoadingState label="Getting your seat map ready…" /></div> : error && !trip ? <ErrorState message={error} onRetry={() => void load()} /> : trip ? <>
        <PageHeading eyebrow="YOUR JOURNEY" title={`${trip.origin} to ${trip.destination}`} description={`${formatDate(trip.departureAt)} · Departure at ${formatTime(trip.departureAt)} · ${availableCount} seats available`} />
        {error && <div className="form-message"><ErrorState message={error} /></div>}
        {success && <div className="alert alert-success booking-message"><Check size={17} />{success}<button onClick={() => router.push("/my-reservations")}>View ticket <ArrowRight size={13} /></button></div>}
        <div className="grid trip-detail-grid">
          <section className="card card-pad">
            <div className="card-title"><div><h2>Choose your seat</h2><p>Pick the spot that feels like yours.</p></div><span className="capacity-chip"><Users size={13} /> {availableCount} open</span></div>
            <div className="driver-cabin">FRONT OF THE BUS <span>Driver</span></div>
            <div className="seat-layout">{seats.map((seat) => <button key={seat.seatNumber} className={`seat ${!seat.available ? "seat-taken" : ""} ${selected === seat.seatNumber ? "seat-selected" : ""}`} disabled={!seat.available} aria-label={`Seat ${seat.seatNumber}${seat.available ? "" : ", taken"}`} aria-pressed={selected === seat.seatNumber} onClick={() => setSelected(seat.seatNumber)}>{seat.seatNumber}</button>)}</div>
            <div className="seat-legend"><span className="legend-item"><i className="legend-chip" /> Available</span><span className="legend-item"><i className="legend-chip selected" /> Your seat</span><span className="legend-item"><i className="legend-chip taken" /> Taken</span></div>
          </section>
          <aside className="card card-pad booking-summary">
            <div className="eyebrow">TRIP SUMMARY</div>
            <div className="summary-route"><span>{trip.origin}</span><i /><span>{trip.destination}</span></div>
            <div className="summary-row"><CalendarDays size={15} /><span>{formatDate(trip.departureAt)}</span></div>
            <div className="summary-row"><Clock3 size={15} /><span>{formatTime(trip.departureAt)}</span></div>
            <div className="summary-row"><Users size={15} /><span>{trip.vehicle?.capacity ?? seats.length} seats · {trip.vehicle?.plate ?? "Scheduled coach"}</span></div>
            <div className="summary-rule" />
            <div className="summary-total"><span>Your seat</span><strong>{selected ? `#${selected}` : "Choose a seat"}</strong></div>
            <Button className="button-wide" disabled={!selected || booking} onClick={() => void reserveSeat()}>{booking ? "Reserving…" : <>Reserve this seat <ArrowRight size={14} /></>}</Button>
            <div className="secure-note"><MapPin size={13} /> Your QR ticket is ready as soon as you book.</div>
          </aside>
        </div>
      </> : null}
    </AppShell>
  );
}
