"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin, Plus, Users, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button, EmptyState, ErrorState, formatDate, formatTime, LoadingState, PageHeading } from "@/components/ui";
import { useAuth } from "@/components/auth-provider";
import { getErrorMessage, tripsApi, vehiclesApi } from "@/lib/api";
import type { Trip, Vehicle } from "@/lib/types";

export default function DriverTripsPage() {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modal, setModal] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [departureAt, setDepartureAt] = useState("");
  const [vehicleId, setVehicleId] = useState("");

  async function openForm() {
    setModal(true);
    setFormError("");
    setOrigin("");
    setDestination("");
    setDepartureAt("");
    setVehicleId("");
    setVehicles([]);
    setVehiclesLoading(true);
    try {
      const result = await vehiclesApi.list();
      setVehicles(result);
      setVehicleId(result[0]?.id ?? "");
    } catch (requestError) {
      setFormError(getErrorMessage(requestError));
    } finally {
      setVehiclesLoading(false);
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    if (!origin.trim() || !destination.trim()) {
      setFormError("Enter an origin and destination.");
      return;
    }
    setBusy(true);
    try {
      await tripsApi.create({ origin: origin.trim(), destination: destination.trim(), departureAt: new Date(departureAt).toISOString(), vehicleId });
      setModal(false);
      await load();
    } catch (requestError) {
      setFormError(getErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  }

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
      <PageHeading eyebrow="BEHIND THE WHEEL" title="Your trips" description="Your upcoming departures, with passenger lists one tap away." action={<div className="table-actions"><Button onClick={() => void openForm()}><Plus size={15} /> Create trip</Button><Link className="button button-secondary" href="/driver/scan"><span className="scan-icon">⌗</span> Scan a ticket</Link></div>} />
      {loading ? <div className="card"><LoadingState label="Loading your assigned trips…" /></div> : error ? <ErrorState message={error} onRetry={() => void load()} /> : trips.length === 0 ? <div className="card"><EmptyState title="No trips yet" description="Create your first trip to start accepting passengers." action={<Button onClick={() => void openForm()}><Plus size={15} /> Create trip</Button>} /></div> : (
        <div className="driver-trip-grid">{trips.map((trip) => <article className="card driver-trip-card" key={trip.id}>
          <div className="driver-trip-date"><CalendarDays size={15} /> {formatDate(trip.departureAt)}</div>
          <div className="driver-trip-route"><strong>{trip.origin}</strong><i /><strong>{trip.destination}</strong></div>
          <div className="driver-trip-info"><span><MapPin size={14} /> Departure {formatTime(trip.departureAt)}</span><span><Users size={14} /> {trip.vehicle?.capacity ?? "—"} seats · {trip.vehicle?.plate ?? "Coach"}</span></div>
          <Link className="button button-secondary button-wide" href={`/driver/trips/${trip.id}`}>View passenger list <ArrowRight size={14} /></Link>
        </article>)}</div>
      )}
      {modal && <div className="modal-backdrop" onClick={() => !busy && setModal(false)}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="create-trip-title" onClick={(event) => event.stopPropagation()} onKeyDown={(event) => { if (event.key === "Escape" && !busy) setModal(false); }}>
        <div className="modal-head"><div><div className="eyebrow">ROUTE DETAILS</div><h2 id="create-trip-title">Create a trip</h2><p>You will be the driver for this trip.</p></div><button className="icon-button" aria-label="Close dialog" disabled={busy} onClick={() => setModal(false)}><X size={18} /></button></div>
        {formError && <div className="form-message"><ErrorState message={formError} /></div>}
        <form className="stack" onSubmit={submit}>
          <div className="grid grid-2"><div className="field"><label htmlFor="origin">Origin</label><input id="origin" autoFocus value={origin} onChange={(event) => setOrigin(event.target.value)} required maxLength={100} /></div><div className="field"><label htmlFor="destination">Destination</label><input id="destination" value={destination} onChange={(event) => setDestination(event.target.value)} required maxLength={100} /></div></div>
          <div className="field"><label htmlFor="departure">Departure date & time</label><input id="departure" type="datetime-local" value={departureAt} onChange={(event) => setDepartureAt(event.target.value)} required /></div>
          <div className="field"><label htmlFor="vehicle">Vehicle</label><select id="vehicle" value={vehicleId} onChange={(event) => setVehicleId(event.target.value)} required disabled={vehiclesLoading}><option value="">Select a vehicle</option>{vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.plate} - {vehicle.capacity} seats</option>)}</select>{vehiclesLoading ? <LoadingState label="Loading vehicles..." /> : vehicles.length === 0 && !formError && <span className="field-hint">No vehicles available. Ask an administrator to add a vehicle first.</span>}</div>
          <div className="modal-actions"><Button variant="secondary" disabled={busy} onClick={() => setModal(false)}>Cancel</Button><Button type="submit" disabled={busy || vehiclesLoading || !vehicleId}>{busy ? "Creating..." : "Create trip"}</Button></div>
        </form>
      </section></div>}
    </AppShell>
  );
}
