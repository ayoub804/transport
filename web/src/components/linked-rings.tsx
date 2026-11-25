"use client";
import { useEffect, useRef, useState } from "react";

/** Procedural interlocking links with physical materials; no external model assets. */
export function LinkedRings() {
  const host = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const node = host.current;
    if (!node) return;
    let disposed = false;
    let cleanup = () => {};
    void Promise.all([import("three"), import("three/examples/jsm/environments/RoomEnvironment.js")]).then(([T, { RoomEnvironment }]) => {
      if (disposed) return;
      const renderer = new T.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.setClearColor(0x000000, 0);
      renderer.toneMapping = T.ACESFilmicToneMapping;
      renderer.toneMappingExposure = .9;
      node.appendChild(renderer.domElement);
      const scene = new T.Scene();
      const camera = new T.PerspectiveCamera(35, 1, .1, 100);
      camera.position.set(0, 0, 7.5);
      const pmrem = new T.PMREMGenerator(renderer);
      const room = new RoomEnvironment();
      const env = pmrem.fromScene(room, .04);
      scene.environment = env.texture;
      const light = new T.DirectionalLight(0xffffff, 2);
      light.position.set(-3, 5, 4); scene.add(light);
      scene.add(new T.AmbientLight(0xffffff, .35));
      const points = Array.from({ length: 128 }, (_, i) => {
        const angle = i / 128 * Math.PI * 2;
        const x = Math.cos(angle), y = Math.sin(angle);
        return new T.Vector3(Math.sign(x) * Math.pow(Math.abs(x), .55), Math.sign(y) * Math.pow(Math.abs(y), .55) * 1.12, 0);
      });
      const curve = new T.CatmullRomCurve3(points, true, "centripetal");
      const geometry = new T.TubeGeometry(curve, 160, .19, 20, true);
      const dark = new T.MeshPhysicalMaterial({ color: 0x272727, metalness: .92, roughness: .18, clearcoat: 1, clearcoatRoughness: .12 });
      const lime = new T.MeshPhysicalMaterial({ color: 0xc8f135, metalness: .15, roughness: .25, envMapIntensity: .65, clearcoat: .6, clearcoatRoughness: .1 });
      const group = new T.Group();
      const upper = new T.Mesh(geometry, dark);
      upper.position.set(-.15, .69, -.12); upper.rotation.set(.1, -.65, -.45);
      const lower = new T.Mesh(geometry, lime);
      lower.position.set(.15, -.85, .18); lower.rotation.set(.2, .85, -.45);
      group.add(upper, lower); scene.add(group);
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
      let frame = 0, visible = true, pointerX = 0, pointerY = 0;
      const draw = (time = 0) => {
        frame = 0;
        if (disposed) return;
        group.rotation.y += ((reduced.matches ? 0 : Math.sin(time * .00025) * .2 + pointerX * .2) - group.rotation.y) * .05;
        group.rotation.x += ((reduced.matches ? 0 : pointerY * .12) - group.rotation.x) * .05;
        group.position.y = reduced.matches ? 0 : Math.sin(time * .0007) * .07;
        renderer.render(scene, camera);
        if (visible && !document.hidden && !reduced.matches) frame = requestAnimationFrame(draw);
      };
      const stop = () => { cancelAnimationFrame(frame); frame = 0; };
      const resume = () => { stop(); if (visible && !document.hidden) draw(performance.now()); };
      const resize = new ResizeObserver(() => {
        const { width, height } = node.getBoundingClientRect();
        renderer.setSize(width, height); camera.aspect = width / Math.max(height, 1); camera.updateProjectionMatrix();
        if (!frame) draw(performance.now());
      });
      resize.observe(node);
      const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; resume(); });
      observer.observe(node);
      const move = (event: PointerEvent) => { const r = node.getBoundingClientRect(); pointerX = (event.clientX-r.left)/r.width-.5; pointerY=(event.clientY-r.top)/r.height-.5; };
      node.addEventListener("pointermove", move);
      reduced.addEventListener("change", resume);
      document.addEventListener("visibilitychange", resume);
      setReady(true);
      cleanup = () => { stop(); resize.disconnect(); observer.disconnect(); node.removeEventListener("pointermove",move); reduced.removeEventListener("change",resume); document.removeEventListener("visibilitychange",resume); geometry.dispose(); dark.dispose(); lime.dispose(); env.dispose(); room.dispose(); pmrem.dispose(); renderer.dispose(); renderer.domElement.remove(); };
    }).catch(() => { /* The CSS links remain visible when WebGL is unavailable. */ });
    return () => { disposed = true; cleanup(); };
  }, []);
  return <div className="linked-rings" ref={host} aria-hidden="true">{!ready && <div className="rings-fallback"><i /><i /></div>}</div>;
}
