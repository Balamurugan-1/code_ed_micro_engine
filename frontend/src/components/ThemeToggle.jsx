import React, { useState, useEffect } from "react";

export default function ThemeToggle({ className = "" }) {
  const [theme, setTheme] = useState(
    () => document.documentElement.dataset.theme || "light"
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <button
      className={`theme-toggle ${className}`}
      onClick={toggle}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      aria-label="Toggle light or dark mode"
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
