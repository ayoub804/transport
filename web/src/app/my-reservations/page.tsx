"use client";

import Link from "next/link";
import Image from "next/image";
import { CalendarDays, Check, Clock3, Eye, QrCode, Repeat2, Ticket, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button, EmptyState, ErrorState, formatDate, formatTime, LoadingState, PageHeading, StatusBadge } from "@/components/ui";
import { getErrorMessage, reservationsApi, tripsApi } from "@/lib/api";
import type { Reservation, Ticket as TicketInfo, Trip } from "@/lib/types";

export default function MyReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ticket, setTicket] = useState<TicketInfo | null>(null);
  const [moving, setMoving] = useState<Reservation | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [targetTrip, setTargetTrip] = useState("");
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setReservations(await reservationsApi.mine());
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function showTicket(id: string) {
    setActionError("");
    try {
      setTicket(await reservationsApi.ticket(id));
    } catch (requestError) {
      setActionError(getErrorMessage(requestError));
    }
  }

  async function cancel(reservation: Reservation) {
    if (!window.confirm(`Cancel your seat on ${reservation.trip.origin} to ${reservation.trip.destination}?`)) return;
    setActionError("");
    setBusy(true);
    try {
      await reservationsApi.cancel(reservation.id);
      await load();
    } catch (requestError) {
      setActionError(getErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  }

  async function beginMove(reservation: Reservation) {
    setActionError("");
    setMoving(reservation);
    setTargetTrip("");
    try {
      const results = await tripsApi.list({ origin: reservation.trip.origin, destination: reservation.trip.destination });
      setTrips(results.filter((trip) => trip.id !== reservation.tripId));
    } catch (requestError) {
      setActionError(getErrorMessage(requestError));
    }
  }

  async function submitMove(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!moving || !targetTrip) return;
    setBusy(true);
    setActionError("");
    try {
      await reservationsApi.update(moving.id, targetTrip);
      setMoving(null);
      await load();
    } catch (requestError) {
      setActionError(getErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell roles={["CLIENT"]}>
      <PageHeading eyebrow="YOUR WAYFARE" title="My reservations" description="Every booked seat, all in one place. Your QR ticket is ready when you are." action={<Link className="button button-secondary" href="/trips"><Ticket size={15} /> Find a trip</Link>} />
      {actionError && <div className="form-message"><ErrorState message={actionError} /></div>}
      {loading ? <div className="card"><LoadingState label="Gathering your journeys…" /></div> : error ? <ErrorState message={error} onRetry={() => void load()} /> : reservations.length === 0 ? <div className="card"><EmptyState title="Your next journey is waiting" description="Once you book a seat, your reservations and QR tickets will show up here." action={<Link className="button button-primary" href="/trips">Explore trips</Link>} /></div> : (
        <div className="reservation-list">{reservations.map((reservation) => {
          const departed = new Date(reservation.trip.departureAt) <= new Date();
          return <article className="card reservation-card" key={reservation.id}>
            <div>
              <div className="reservation-top"><div className="reservation-route">{reservation.trip.origin}<span>→</span>{reservation.trip.destination}</div><StatusBadge status={reservation.status} /></div>
              <div className="reservation-details"><span><CalendarDays size={13} /> {formatDate(reservation.trip.departureAt)}</span><span><Clock3 size={13} /> {formatTime(reservation.trip.departureAt)}</span><span><Ticket size={13} /> Seat {reservation.seatNumber}</span>{reservation.trip.vehicle?.plate && <span>{reservation.trip.vehicle.plate}</span>}</div>
            </div>
            <div className="reservation-actions">
              {reservation.status === "CONFIRMED" && !departed && <Button variant="secondary" className="button-small" disabled={busy} onClick={() => void beginMove(reservation)}><Repeat2 size={13} /> Change trip</Button>}
              {reservation.status === "CONFIRMED" && !departed && <Button variant="ghost" className="button-small" disabled={busy} onClick={() => void cancel(reservation)}><X size={14} /> Cancel</Button>}
              {reservation.status === "CONFIRMED" && !departed && <Button className="button-small" onClick={() => void showTicket(reservation.id)}><QrCode size={13} /> Show ticket</Button>}
              {reservation.status === "USED" && <span className="confirmed-note"><Check size={13} /> Travel complete</span>}
            </div>
          </article>;
        })}</div>
      )}
      {ticket && <div className="modal-backdrop" role="presentation" onClick={() => setTicket(null)}><section className="modal ticket-modal" role="dialog" aria-modal="true" aria-labelledby="ticket-heading" onClick={(event) => event.stopPropagation()}>
        <div className="modal-head"><div><div className="eyebrow">YOUR BOARDING PASS</div><h2 id="ticket-heading">Ready when you are.</h2><p>Show this code to your driver when you board.</p></div><button className="icon-button" aria-label="Close ticket" onClick={() => setTicket(null)}><X size={18} /></button></div>
        <Image className="ticket-image" src={ticket.qrCodeDataUrl} alt="QR code for reservation ticket" width={240} height={240} unoptimized />
        <p className="ticket-caption">This secure QR ticket belongs to reservation <strong>{ticket.reservationId.slice(0, 8).toUpperCase()}</strong>.</p>
        <Button variant="secondary" className="button-wide" onClick={() => setTicket(null)}><Eye size={14} /> Done</Button>
      </section></div>}
      {moving && <div className="modal-backdrop" role="presentation" onClick={() => !busy && setMoving(null)}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="move-heading" onClick={(event) => event.stopPropagation()}>
        <div className="modal-head"><div><div className="eyebrow">CHANGE YOUR PLANS</div><h2 id="move-heading">Choose another trip</h2><p>Seat {moving.seatNumber} will be kept if it is available.</p></div><button className="icon-button" aria-label="Close" onClick={() => setMoving(null)}><X size={18} /></button></div>
        {actionError && <div className="form-message"><ErrorState message={actionError} /></div>}
        <form className="stack" onSubmit={submitMove}>
          <div className="field"><label htmlFor="move-trip">Available trips</label><select id="move-trip" value={targetTrip} onChange={(event) => setTargetTrip(event.target.value)} required><option value="">Select a departure</option>{trips.map((trip) => <option key={trip.id} value={trip.id}>{formatDate(trip.departureAt)} · {formatTime(trip.departureAt)} · {trip.origin} → {trip.destination}</option>)}</select></div>
          {trips.length === 0 && <p className="field-hint">No other scheduled trips on this route are available.</p>}
          <div className="modal-actions"><Button type="button" variant="secondary" onClick={() => setMoving(null)}>Keep current trip</Button><Button type="submit" disabled={!targetTrip || busy}>{busy ? "Updating…" : "Change trip"}</Button></div>
        </form>
      </section></div>}
    </AppShell>
  );
}
