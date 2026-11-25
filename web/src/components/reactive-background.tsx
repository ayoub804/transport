"use client";

import { useEffect, useRef } from "react";
import "./reactive-background.css";

// Clockwise corners: top-left, top-right, bottom-right, bottom-left.
// Each pair connects two cell edges to form an iso-height contour.
const SEGMENTS: readonly (readonly number[])[] = [
  [], [3, 0], [0, 1], [3, 1], [1, 2], [3, 0, 1, 2], [0, 2], [3, 2],
  [2, 3], [0, 2], [0, 1, 2, 3], [1, 2], [3, 1], [0, 1], [3, 0], [],
];
const CONTOUR_LEVELS = Array.from({ length: 17 }, (_, index) => -1.15 + index * 0.17);
const FRAME_INTERVAL = 1000 / 30;

function latticeHeight(x: number, y: number, seed: number) {
  // Integer hashing gives every lattice point a repeatable height without random state.
  let hash = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ seed;
  hash = Math.imul(hash ^ (hash >>> 13), 1274126177);
  return ((hash ^ (hash >>> 16)) >>> 0) / 4294967295 * 2 - 1;
}

function terrainNoise(x: number, y: number, seed: number) {
  const column = Math.floor(x);
  const row = Math.floor(y);
  const dx = x - column;
  const dy = y - row;
  // Quintic interpolation keeps the height and its first two derivatives continuous.
  const sx = dx * dx * dx * (dx * (dx * 6 - 15) + 10);
  const sy = dy * dy * dy * (dy * (dy * 6 - 15) + 10);
  const a = latticeHeight(column, row, seed);
  const b = latticeHeight(column + 1, row, seed);
  const c = latticeHeight(column, row + 1, seed);
  const d = latticeHeight(column + 1, row + 1, seed);
  return (a + (b - a) * sx) * (1 - sy) + (c + (d - c) * sx) * sy;
}

/** An original contour landscape. Pointer movement gently reshapes a local hill. */
export function ReactiveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { alpha: true });
    if (!canvas || !context) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    let width = 0;
    let height = 0;
    let step = 28;
    let columns = 0;
    let rows = 0;
    let base = new Float32Array(0);
    let field = new Float32Array(0);
    let frame = 0;
    let lastFrame = 0;
    let disposed = false;
    let listening = false;
    let dirtySize = false;
    const cursor = { x: 0, y: 0, targetX: 0, targetY: 0, vx: 0, vy: 0, strength: 0, targetStrength: 0 };
    const intersections = new Float32Array(8);

    function isInteractive() {
      return !reducedMotion.matches && finePointer.matches;
    }

    function stop() {
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
      lastFrame = 0;
    }

    function draw() {
      if (!context || !canvas || !width || !height) return;
      const radius = Math.min(260, Math.max(150, width * 0.19));
      const inverseRadius = 1 / (radius * radius);
      // Only the local Gaussian hill changes. The underlying landscape is cached.
      for (let row = 0; row <= rows; row++) {
        const y = row * step;
        for (let column = 0; column <= columns; column++) {
          const index = row * (columns + 1) + column;
          const dx = column * step - cursor.x;
          const dy = y - cursor.y;
          field[index] = base[index] + cursor.strength * 0.62 * Math.exp(-(dx * dx + dy * dy) * inverseRadius);
        }
      }

      context.clearRect(0, 0, width, height);
      context.lineCap = "round";
      context.lineJoin = "round";
      for (let levelIndex = 0; levelIndex < CONTOUR_LEVELS.length; levelIndex++) {
        const level = CONTOUR_LEVELS[levelIndex];
        context.beginPath();
        for (let row = 0; row < rows; row++) {
          const y = row * step;
          for (let column = 0; column < columns; column++) {
            const x = column * step;
            const index = row * (columns + 1) + column;
            const a = field[index];
            const b = field[index + 1];
            const c = field[index + columns + 2];
            const d = field[index + columns + 1];
            const mask = (a > level ? 1 : 0) | (b > level ? 2 : 0) | (c > level ? 4 : 0) | (d > level ? 8 : 0);
            if (mask === 0 || mask === 15) continue;

            let segments = SEGMENTS[mask];
            // Resolve saddle cells by their center height to keep neighboring paths coherent.
            if (mask === 5 && (a + b + c + d) / 4 > level) segments = SEGMENTS[10];
            if (mask === 10 && (a + b + c + d) / 4 > level) segments = SEGMENTS[5];
            if ((a > level) !== (b > level)) {
              intersections[0] = x + step * (level - a) / (b - a);
              intersections[1] = y;
            }
            if ((b > level) !== (c > level)) {
              intersections[2] = x + step;
              intersections[3] = y + step * (level - b) / (c - b);
            }
            if ((c > level) !== (d > level)) {
              intersections[4] = x + step * (level - d) / (c - d);
              intersections[5] = y + step;
            }
            if ((d > level) !== (a > level)) {
              intersections[6] = x;
              intersections[7] = y + step * (level - a) / (d - a);
            }
            for (let segment = 0; segment < segments.length; segment += 2) {
              const from = segments[segment] * 2;
              const to = segments[segment + 1] * 2;
              context.moveTo(intersections[from], intersections[from + 1]);
              context.lineTo(intersections[to], intersections[to + 1]);
            }
          }
        }
        context.strokeStyle = levelIndex % 3 === 0 ? "rgba(180, 180, 180, 0.32)" : "rgba(160, 160, 160, 0.18)";
        context.lineWidth = levelIndex % 3 === 0 ? 1.1 : 0.8;
        context.stroke();
      }
    }

    function resize() {
      if (!canvas || !context) return;
      width = window.innerWidth;
      height = window.innerHeight;
      // Bound both bitmap resolution and lattice size, including on large Retina screens.
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      step = Math.max(12, Math.sqrt(width * height / 12000));
      columns = Math.ceil(width / step);
      rows = Math.ceil(height / step);
      base = new Float32Array((columns + 1) * (rows + 1));
      field = new Float32Array(base.length);
      for (let row = 0; row <= rows; row++) {
        for (let column = 0; column <= columns; column++) {
          const pixelX = column * step + 83;
          const pixelY = row * step + 117;
          // A low-frequency domain warp removes the grid's straight axes. The three
          // height scales add nested, irregular islands instead of broad parallel bands.
          const x = pixelX + 78 * terrainNoise(pixelX / 440, pixelY / 440, 173);
          const y = pixelY + 78 * terrainNoise(pixelX / 440, pixelY / 440, 719);
          const landscape = 1.12 * terrainNoise(x / 245, y / 245, 1979);
          const ridges = 0.34 * terrainNoise(x / 112, y / 112, 3253);
          const ripples = 0.085 * terrainNoise(x / 58, y / 58, 7907);
          base[row * (columns + 1) + column] = landscape + ridges + ripples;
        }
      }
      draw();
    }

    function animate(now: number) {
      frame = 0;
      if (disposed || document.hidden || !isInteractive()) return;
      const elapsed = lastFrame ? now - lastFrame : FRAME_INTERVAL;
      if (elapsed < FRAME_INTERVAL - 0.5) {
        frame = window.requestAnimationFrame(animate);
        return;
      }
      lastFrame = now;
      const dt = Math.min(elapsed / 1000, 0.05);
      // A critically damped spring trails the pointer without oscillating or jumping.
      cursor.vx += ((cursor.targetX - cursor.x) * 100 - cursor.vx * 20) * dt;
      cursor.vy += ((cursor.targetY - cursor.y) * 100 - cursor.vy * 20) * dt;
      cursor.x += cursor.vx * dt;
      cursor.y += cursor.vy * dt;
      cursor.strength += (cursor.targetStrength - cursor.strength) * (1 - Math.exp(-8 * dt));

      const resting = Math.abs(cursor.targetX - cursor.x) + Math.abs(cursor.targetY - cursor.y) < 0.2
        && Math.abs(cursor.vx) + Math.abs(cursor.vy) < 0.5
        && Math.abs(cursor.targetStrength - cursor.strength) < 0.002;
      if (resting) {
        cursor.x = cursor.targetX;
        cursor.y = cursor.targetY;
        cursor.vx = cursor.vy = 0;
        cursor.strength = cursor.targetStrength;
      }
      draw();
      if (!resting) frame = window.requestAnimationFrame(animate);
      else lastFrame = 0;
    }

    function wake() {
      if (!frame && !disposed && !document.hidden && isInteractive()) frame = window.requestAnimationFrame(animate);
    }

    function onPointerMove(event: PointerEvent) {
      if (event.pointerType === "touch") return;
      if (cursor.strength === 0 && cursor.targetStrength === 0) {
        cursor.x = event.clientX;
        cursor.y = event.clientY;
      }
      cursor.targetX = event.clientX;
      cursor.targetY = event.clientY;
      cursor.targetStrength = 1;
      wake();
    }

    function onPointerLeave(event: PointerEvent) {
      if (event.relatedTarget !== null) return;
      cursor.targetStrength = 0;
      wake();
    }

    function onBlur() {
      cursor.targetStrength = 0;
      wake();
    }

    function updatePreferences() {
      const enabled = isInteractive();
      if (enabled && !listening) {
        window.addEventListener("pointermove", onPointerMove, { passive: true });
        window.addEventListener("pointerout", onPointerLeave, { passive: true });
        window.addEventListener("blur", onBlur);
        listening = true;
      } else if (!enabled && listening) {
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerout", onPointerLeave);
        window.removeEventListener("blur", onBlur);
        listening = false;
      }
      stop();
      cursor.strength = cursor.targetStrength = cursor.vx = cursor.vy = 0;
      if (!document.hidden) draw();
    }

    function onVisibilityChange() {
      stop();
      if (!document.hidden) {
        cursor.strength = cursor.targetStrength = cursor.vx = cursor.vy = 0;
        if (dirtySize) { dirtySize = false; resize(); }
        else draw();
      }
    }

    function onResize() {
      if (document.hidden) { dirtySize = true; return; }
      resize();
    }

    resize();
    updatePreferences();
    window.addEventListener("resize", onResize, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);
    reducedMotion.addEventListener("change", updatePreferences);
    finePointer.addEventListener("change", updatePreferences);

    return () => {
      disposed = true;
      stop();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerout", onPointerLeave);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      reducedMotion.removeEventListener("change", updatePreferences);
      finePointer.removeEventListener("change", updatePreferences);
    };
  }, []);

  return (
    <div className="reactive-background" aria-hidden="true">
      <div className="reactive-background-wash" />
      <canvas ref={canvasRef} className="reactive-background-contours" />
    </div>
  );
}
