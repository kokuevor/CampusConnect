"use client";

import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "@/lib/theme-provider";

export function ThemeIndicator() {
  const { theme } = useTheme();

  const getThemeIcon = () => {
    switch (theme) {
      case "light":
        return <Sun className="h-3 w-3" />;
      case "dark":
        return <Moon className="h-3 w-3" />;
      case "system":
        return <Monitor className="h-3 w-3" />;
      default:
        return <Sun className="h-3 w-3" />;
    }
  };

  const getThemeText = () => {
    switch (theme) {
      case "light":
        return "Light";
      case "dark":
        return "Dark";
      case "system":
        return "System";
      default:
        return "Light";
    }
  };

  return (
    <div className="flex items-center space-x-1 text-xs text-muted-foreground">
      {getThemeIcon()}
      <span>{getThemeText()}</span>
    </div>
  );
}
