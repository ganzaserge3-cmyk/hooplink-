"use client";

import { useEffect } from "react";

export default function ThemeSync() {
  useEffect(() => {
    const enabled = typeof window !== "undefined" && window.localStorage.getItem("hooplink_high_contrast") === "1";
    document.documentElement.classList.toggle("theme-high-contrast", enabled);
  }, []);

  return null;
}
