"use client";

import { BrowserQRCodeReader, type IScannerControls } from "@zxing/browser";
import { AlertCircle, Camera, CheckCircle2, LoaderCircle, ScanLine, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button, PageHeading } from "@/components/ui";
import { getErrorMessage, reservationsApi } from "@/lib/api";
import type { TicketValidation } from "@/lib/types";

type ScanResult = { valid: boolean; message: string; reservationId?: string };

export default function DriverScanPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const validatingRef = useRef(false);
  const cameraSessionRef = useRef(0);
  const [scanning, setScanning] = useState(false);
  const [starting, setStarting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [token, setToken] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [cameraError, setCameraError] = useState("");

  async function validate(rawToken: string) {
    setBusy(true);
    setResult(null);
    setCameraError("");
    try {
      const validation: TicketValidation = await reservationsApi.validateTicket(rawToken.trim());
      setResult({ valid: true, message: validation.message, reservationId: validation.reservationId });
    } catch (error) {
      setResult({ valid: false, message: getErrorMessage(error) });
    } finally {
      setBusy(false);
    }
  }

  async function startCamera() {
    const session = ++cameraSessionRef.current;
    setStarting(true);
    setCameraError("");
    setResult(null);
    try {
      const reader = new BrowserQRCodeReader();
      let decodedOnce = false;
      const controls = await reader.decodeFromConstraints({ audio: false, video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } } }, videoRef.current!, (decoded, _error, scannerControls) => {
        if (session !== cameraSessionRef.current) { scannerControls.stop(); return; }
        // Unreadable camera frames are normal; keep scanning until a QR is decoded.
        if (decoded && !validatingRef.current) {
          decodedOnce = true;
          validatingRef.current = true;
          const text = decoded.getText();
          scannerControls.stop();
          controlsRef.current = null;
          setScanning(false);
          void validate(text).finally(() => { validatingRef.current = false; });
        }
      });
      if (session !== cameraSessionRef.current || decodedOnce) { controls.stop(); return; }
      controlsRef.current = controls;
      setScanning(true);
    } catch (error) {
      if (session !== cameraSessionRef.current) return;
      setCameraError(error instanceof Error ? error.message : "Could not access a camera. Check browser permissions.");
      setScanning(false);
    } finally {
      if (session === cameraSessionRef.current) setStarting(false);
    }
  }

  function stopCamera() {
    cameraSessionRef.current++;
    controlsRef.current?.stop();
    controlsRef.current = null;
    setScanning(false);
  }

  useEffect(() => () => { cameraSessionRef.current++; controlsRef.current?.stop(); }, []);

  return (
    <AppShell roles={["DRIVER", "ADMIN"]}>
      <PageHeading eyebrow="BOARDING CHECK" title="Scan a ticket" description="Point your camera at the passenger’s QR ticket. We’ll confirm it and mark it used." />
      <div className="scanner-page-grid">
        <section className="card card-pad scanner-card">
          <div className="card-title"><div><h2>Camera scanner</h2><p>Use a well-lit screen or printed ticket.</p></div><ScanLine size={18} className="muted-icon" /></div>
          <div className="scanner-frame"><video ref={videoRef} className={`scanner-video ${scanning ? "" : "scanner-video-hidden"}`} muted playsInline />{!scanning && <div className="scanner-placeholder"><div><Camera size={28} /><span>Camera ready when you are</span></div></div>}{scanning && <><div className="scanner-overlay" /><div className="scanner-hint">Hold the code within the frame</div></>}</div>
          {cameraError && <div className="alert alert-error camera-error"><AlertCircle size={16} />{cameraError}</div>}
          <div className="scanner-controls">{scanning ? <Button variant="secondary" className="button-wide" onClick={stopCamera}>Stop camera</Button> : <Button className="button-wide" disabled={starting || busy} onClick={() => void startCamera()}><Camera size={15} /> {starting ? "Starting camera..." : "Start camera"}</Button>}</div>
          <div className="scanner-divider"><span />OR ENTER THE CODE<span /></div>
          <form className="stack" onSubmit={(event) => { event.preventDefault(); void validate(token); }}>
            <div className="field"><label htmlFor="ticket-token">Ticket token</label><input id="ticket-token" value={token} onChange={(event) => setToken(event.target.value)} placeholder="Paste a signed ticket token" required /></div>
            <Button type="submit" variant="secondary" className="button-wide" disabled={busy || !token.trim()}>{busy ? <><LoaderCircle className="spin" size={15} /> Checking ticket…</> : "Validate ticket"}</Button>
          </form>
        </section>
        <aside className="scan-side">
          {busy ? <div className="card scan-placeholder"><LoaderCircle className="spin" size={22} /><p>Checking the ticket…</p></div> : result ? <div className={`scan-result ${result.valid ? "" : "scan-result-invalid"}`}>{result.valid ? <CheckCircle2 size={21} /> : <XCircle size={21} />}<div><strong>{result.valid ? "Ticket valid" : "Ticket not valid"}</strong><p>{result.message}</p>{result.reservationId && <p className="scan-reservation-id">Reservation {result.reservationId.slice(0, 8).toUpperCase()}</p>}</div></div> : <div className="card scan-placeholder"><div className="scan-placeholder-icon"><ScanLine size={23} /></div><strong>Ready to check a ticket</strong><p>A clear scan will show the result here. Each ticket can only be used once.</p></div>}
          <div className="card scan-guidance"><div className="eyebrow">A QUICK REMINDER</div><h3>One scan, one boarding.</h3><p>Only confirmed tickets for upcoming trips are valid. A ticket becomes used as soon as it passes validation.</p></div>
        </aside>
      </div>
    </AppShell>
  );
}
