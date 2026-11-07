"use client";

import { Pencil, Plus, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button, EmptyState, ErrorState, formatDate, formatTime, LoadingState, PageHeading, StatusBadge } from "@/components/ui";
import { getErrorMessage, tripsApi, vehiclesApi } from "@/lib/api";
import type { Trip, TripStatus, Vehicle } from "@/lib/types";

export default function AdminTripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Trip | null>(null);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [departureAt, setDepartureAt] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [status, setStatus] = useState<TripStatus>("SCHEDULED");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [tripResults, vehicleResults] = await Promise.all([
        tripsApi.adminList(),
        vehiclesApi.list(),
      ]);
      setTrips(tripResults);
      setVehicles(vehicleResults);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  function openForm(trip?: Trip) {
    setEditing(trip ?? null);
    setOrigin(trip?.origin ?? "");
    setDestination(trip?.destination ?? "");
    setDepartureAt(trip ? new Date(new Date(trip.departureAt).getTime() - new Date(trip.departureAt).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "");
    setVehicleId(trip?.vehicleId ?? vehicles[0]?.id ?? "");
    setDriverId(trip?.driverId ?? "");
    setStatus(trip?.status ?? "SCHEDULED");
    setError("");
    setModal(true);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const data = {
      origin: origin.trim(),
      destination: destination.trim(),
      departureAt: new Date(departureAt).toISOString(),
      vehicleId,
      driverId: driverId.trim() || null,
      status,
    };
    try {
      if (editing) await tripsApi.update(editing.id, data);
      else await tripsApi.create(data);
      setModal(false);
      await load();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  }

  async function remove(trip: Trip) {
    if (!window.confirm(`Delete ${trip.origin} to ${trip.destination}? Trips with reservation history cannot be deleted.`)) return;
    setError("");
    try {
      await tripsApi.remove(trip.id);
      await load();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }

  return (
    <AppShell roles={["ADMIN"]}>
      <PageHeading eyebrow="THE SCHEDULE" title="Trip management" description="Create a departure, assign a vehicle, and keep the schedule moving." action={<Button onClick={() => openForm()}><Plus size={15} /> Add trip</Button>} />
      {error && !modal && <div className="form-message"><ErrorState message={error} onRetry={() => void load()} /></div>}
      {loading ? <div className="card"><LoadingState label="Loading the trip schedule…" /></div> : trips.length === 0 ? <div className="card"><EmptyState title="No trips on the schedule" description="Create a trip and choose a vehicle to get started." action={<Button onClick={() => openForm()}><Plus size={14} /> Add a trip</Button>} /></div> : (
        <section className="card">
          <div className="table-wrap"><table><thead><tr><th>Route</th><th>Departure</th><th>Vehicle</th><th>Driver ID</th><th>Status</th><th>Actions</th></tr></thead><tbody>{trips.map((trip) => <tr key={trip.id}><td className="table-primary">{trip.origin} → {trip.destination}</td><td><span className="table-primary">{formatDate(trip.departureAt, { month: "short", day: "numeric", year: "numeric" })}</span><span className="table-secondary">{formatTime(trip.departureAt)}</span></td><td>{trip.vehicle?.plate ?? vehicles.find((vehicle) => vehicle.id === trip.vehicleId)?.plate ?? "—"}</td><td>{trip.driverId ? <span className="id-text">{trip.driverId.slice(0, 8)}…</span> : "Unassigned"}</td><td><StatusBadge status={trip.status} /></td><td><div className="table-actions"><Button variant="secondary" className="button-small" onClick={() => openForm(trip)}><Pencil size={12} /> Edit</Button>{trip.status !== "CANCELLED" && <Button variant="ghost" className="button-small icon-only-button" aria-label={`Delete ${trip.origin} to ${trip.destination}`} onClick={() => void remove(trip)}><Trash2 size={13} /></Button>}</div></td></tr>)}</tbody></table></div>
        </section>
      )}
      {modal && <div className="modal-backdrop" role="presentation" onClick={() => !busy && setModal(false)}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="trip-modal-title" onClick={(event) => event.stopPropagation()}>
        <div className="modal-head"><div><div className="eyebrow">ROUTE DETAILS</div><h2 id="trip-modal-title">{editing ? "Update trip" : "Create a trip"}</h2><p>Assign a vehicle and set a departure time.</p></div><button className="icon-button" aria-label="Close dialog" onClick={() => setModal(false)}><X size={18} /></button></div>
        {error && <div className="form-message"><ErrorState message={error} /></div>}
        <form className="stack" onSubmit={submit}>
          <div className="grid grid-2"><div className="field"><label htmlFor="origin">Origin</label><input id="origin" value={origin} onChange={(event) => setOrigin(event.target.value)} required maxLength={100} /></div><div className="field"><label htmlFor="destination">Destination</label><input id="destination" value={destination} onChange={(event) => setDestination(event.target.value)} required maxLength={100} /></div></div>
          <div className="field"><label htmlFor="departure">Departure date & time</label><input id="departure" type="datetime-local" value={departureAt} onChange={(event) => setDepartureAt(event.target.value)} required /></div>
          <div className="field"><label htmlFor="vehicle">Vehicle</label><select id="vehicle" value={vehicleId} onChange={(event) => setVehicleId(event.target.value)} required><option value="">Select a vehicle</option>{vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.plate} · {vehicle.capacity} seats</option>)}</select>{vehicles.length === 0 && <span className="field-hint">Add a vehicle before creating a trip.</span>}</div>
          <div className="field"><label htmlFor="driver-id">Driver account ID <span className="optional">(optional)</span></label><input id="driver-id" value={driverId} onChange={(event) => setDriverId(event.target.value)} placeholder="Paste the driver's UUID" /></div>
          {editing && <div className="field"><label htmlFor="status">Trip status</label><select id="status" value={status} onChange={(event) => setStatus(event.target.value as TripStatus)}><option value="SCHEDULED">Scheduled</option><option value="CANCELLED">Cancelled</option><option value="COMPLETED">Completed</option></select></div>}
          <div className="modal-actions"><Button variant="secondary" onClick={() => setModal(false)}>Cancel</Button><Button type="submit" disabled={busy || !vehicleId}>{busy ? "Saving…" : editing ? "Save changes" : "Create trip"}</Button></div>
        </form>
      </section></div>}
    </AppShell>
  );
}
