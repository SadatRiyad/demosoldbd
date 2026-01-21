import * as React from "react";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";

type ThemeMode = "system" | "light" | "dark";

function nextMode(m: ThemeMode): ThemeMode {
  if (m === "system") return "light";
  if (m === "light") return "dark";
  return "system";
}

export default function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const current = (theme ?? "system") as ThemeMode;
  const icon = !mounted
    ? Monitor
    : current === "system"
      ? Monitor
      : resolvedTheme === "dark"
        ? Moon
        : Sun;

  const Icon = icon;
  const label = current === "system" ? "Theme: System" : current === "dark" ? "Theme: Dark" : "Theme: Light";

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className={className}
      aria-label={label}
      title={label}
      onClick={() => setTheme(nextMode(current))}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}
