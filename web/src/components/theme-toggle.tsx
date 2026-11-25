"use client";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [light, setLight] = useState(false);
  useEffect(() => {
    let saved = false;
    try { saved = localStorage.getItem("wayfare-theme") === "light"; } catch { /* Storage can be unavailable in private contexts. */ }
    setLight(saved);
    document.documentElement.dataset.theme = saved ? "light" : "dark";
  }, []);
  return <button className="icon-button theme-toggle" type="button" aria-label={light ? "Switch to dark theme" : "Switch to light theme"} onClick={() => {
    const next = !light; setLight(next);
    document.documentElement.dataset.theme = next ? "light" : "dark";
    try { localStorage.setItem("wayfare-theme", next ? "light" : "dark"); } catch { /* Theme still works for this page. */ }
  }}>{light ? <Moon size={18} /> : <Sun size={18} />}</button>;
}
