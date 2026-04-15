"use client";

import { useTheme } from "./ThemeProvider";
import { useEffect, useState } from "react";

export function ThemeSwitcher() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <button className="theme-switcher-btn" aria-label="Toggle theme" style={{ width: 40, height: 40 }}></button>;
  }

  return (
    <button 
      onClick={toggleTheme} 
      className="theme-switcher-btn"
      aria-label="Toggle theme"
    >
      {theme === "light" ? <span style={{ filter: "grayscale(1) brightness(0)" }}>🌙</span> : "☀️"}
    </button>
  );
}
