"use client";

import { BusFront, Pencil, Plus, Trash2, Users, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button, EmptyState, ErrorState, LoadingState, PageHeading } from "@/components/ui";
import { getErrorMessage, vehiclesApi } from "@/lib/api";
import type { Vehicle } from "@/lib/types";

export default function AdminVehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [plate, setPlate] = useState("");
  const [capacity, setCapacity] = useState("40");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setVehicles(await vehiclesApi.list());
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  function openForm(vehicle?: Vehicle) {
    setEditing(vehicle ?? null);
    setPlate(vehicle?.plate ?? "");
    setCapacity(String(vehicle?.capacity ?? 40));
    setError("");
    setModal(true);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = { plate: plate.trim(), capacity: Number(capacity) };
      if (editing) await vehiclesApi.update(editing.id, data);
      else await vehiclesApi.create(data);
      setModal(false);
      await load();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  }

  async function remove(vehicle: Vehicle) {
    if (!window.confirm(`Remove vehicle ${vehicle.plate}? This only works if it has no assigned trips.`)) return;
    setError("");
    try {
      await vehiclesApi.remove(vehicle.id);
      await load();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }

  return (
    <AppShell roles={["ADMIN"]}>
      <PageHeading eyebrow="YOUR FLEET" title="Vehicles" description="Keep the fleet current so every trip has the right number of seats." action={<Button onClick={() => openForm()}><Plus size={15} /> Add vehicle</Button>} />
      {error && !modal && <div className="form-message"><ErrorState message={error} onRetry={() => void load()} /></div>}
      {loading ? <div className="card"><LoadingState label="Loading your fleet…" /></div> : vehicles.length === 0 ? <div className="card"><EmptyState title="No vehicles added yet" description="Add the first coach to start planning your routes." action={<Button onClick={() => openForm()}><Plus size={14} /> Add a vehicle</Button>} /></div> : (
        <section className="card vehicle-grid">{vehicles.map((vehicle) => <article className="vehicle-card" key={vehicle.id}>
          <div className="vehicle-illustration"><BusFront size={27} /></div>
          <div className="vehicle-main"><span className="eyebrow">FLEET VEHICLE</span><h2>{vehicle.plate}</h2><p><Users size={14} /> {vehicle.capacity} passenger seats</p></div>
          <div className="vehicle-actions"><Button variant="secondary" className="button-small" onClick={() => openForm(vehicle)}><Pencil size={13} /> Edit</Button><Button variant="ghost" className="button-small icon-only-button" aria-label={`Delete ${vehicle.plate}`} onClick={() => void remove(vehicle)}><Trash2 size={14} /></Button></div>
        </article>)}</section>
      )}
      {modal && <div className="modal-backdrop" role="presentation" onClick={() => !busy && setModal(false)}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="vehicle-modal-title" onClick={(event) => event.stopPropagation()}>
        <div className="modal-head"><div><div className="eyebrow">FLEET DETAILS</div><h2 id="vehicle-modal-title">{editing ? "Update vehicle" : "Add a vehicle"}</h2><p>Enter the registration and passenger capacity.</p></div><button className="icon-button" aria-label="Close dialog" onClick={() => setModal(false)}><X size={18} /></button></div>
        {error && <div className="form-message"><ErrorState message={error} /></div>}
        <form className="stack" onSubmit={submit}><div className="field"><label htmlFor="plate">Registration plate</label><input id="plate" value={plate} onChange={(event) => setPlate(event.target.value)} placeholder="BUS-1234" minLength={2} maxLength={20} required /></div><div className="field"><label htmlFor="capacity">Passenger seats</label><input id="capacity" type="number" value={capacity} onChange={(event) => setCapacity(event.target.value)} min={1} step={1} required /></div><div className="modal-actions"><Button variant="secondary" onClick={() => setModal(false)}>Cancel</Button><Button type="submit" disabled={busy}>{busy ? "Saving…" : editing ? "Save changes" : "Add vehicle"}</Button></div></form>
      </section></div>}
    </AppShell>
  );
}
