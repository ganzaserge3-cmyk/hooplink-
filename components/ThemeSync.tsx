"use client";

import { useEffect } from "react";

export default function ThemeSync() {
  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem("hooplink_theme") : null;
    const isDark = stored !== "light";
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.classList.toggle("light", !isDark);

    const highContrast = typeof window !== "undefined" && window.localStorage.getItem("hooplink_high_contrast") === "1";
    document.documentElement.classList.toggle("theme-high-contrast", highContrast);
  }, []);

  return null;
}
