"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Get theme from localStorage or default to system
    const savedTheme = localStorage.getItem("campusconnect-theme") as Theme;
    if (savedTheme) {
      setThemeState(savedTheme);
    } else {
      setThemeState("system");
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      // Determine actual theme to apply
      let actualTheme: "light" | "dark";
      if (theme === "system") {
        actualTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
      } else {
        actualTheme = theme;
      }

      // Update document class and localStorage
      document.documentElement.classList.remove("light", "dark");
      document.documentElement.classList.add(actualTheme);
      localStorage.setItem("campusconnect-theme", theme);
    }
  }, [theme, mounted]);

  // Listen for system theme changes
  useEffect(() => {
    if (mounted && theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => {
        const actualTheme = mediaQuery.matches ? "dark" : "light";
        document.documentElement.classList.remove("light", "dark");
        document.documentElement.classList.add(actualTheme);
      };

      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme, mounted]);

  const toggleTheme = () => {
    setThemeState((prev) => {
      if (prev === "light") return "dark";
      if (prev === "dark") return "system";
      return "light";
    });
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return <div className="light">{children}</div>;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
